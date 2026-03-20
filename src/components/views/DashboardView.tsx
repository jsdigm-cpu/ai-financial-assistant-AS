import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import { CATEGORY_MAP } from '../../constants';
import IncomeExpenseChart from '../IncomeExpenseChart';
import CategoryPieChart from '../CategoryPieChart';
import TopCategoriesChart from '../TopCategoriesChart';
import { exportViewToPdf } from '../../services/pdfExporter';
import PaymentModal from '../PaymentModal';
import { PendingPdf, generateOrderId } from '../../hooks/usePaymentGate';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
  pendingPdfDownload?: PendingPdf | null;
  onPdfDownloadConsumed?: () => void;
}

// ── 포맷 헬퍼 ──
const fmtW = (n: number) => n.toLocaleString('ko-KR') + '원';
const fmtM = (n: number) => {
  if (Math.abs(n) >= 100_000_000) return (n / 100_000_000).toFixed(1) + '억원';
  if (Math.abs(n) >= 10_000) return Math.round(n / 10_000).toLocaleString('ko-KR') + '만원';
  return n.toLocaleString('ko-KR') + '원';
};
const pct = (part: number, total: number) =>
  total === 0 ? '-' : (part / total * 100).toFixed(1) + '%';

// ── 기간 선택 헬퍼 ──
function getPeriodOptions(txs: Transaction[]) {
  const months = new Set<string>();
  const years = new Set<string>();
  txs.forEach(t => {
    const y = t.date.getFullYear();
    const m = String(t.date.getMonth() + 1).padStart(2, '0');
    months.add(`${y}-${m}`);
    years.add(String(y));
  });
  const opts: { label: string; value: string }[] = [{ label: '전체 기간', value: 'all' }];
  [...years].sort().forEach(y => opts.push({ label: `${y}년`, value: `year-${y}` }));
  [...months].sort().forEach(m => opts.push({ label: `${m.replace('-', '년 ')}월`, value: `month-${m}` }));
  return opts;
}

function filterByPeriod(txs: Transaction[], period: string) {
  if (period === 'all') return txs;
  if (period.startsWith('year-')) {
    const y = parseInt(period.replace('year-', ''));
    return txs.filter(t => t.date.getFullYear() === y);
  }
  if (period.startsWith('month-')) {
    const [y, m] = period.replace('month-', '').split('-').map(Number);
    return txs.filter(t => t.date.getFullYear() === y && t.date.getMonth() + 1 === m);
  }
  return txs;
}

function getPeriodLabel(period: string) {
  if (period === 'all') return '전체 기간';
  if (period.startsWith('year-')) return period.replace('year-', '') + '년';
  if (period.startsWith('month-')) return period.replace('month-', '').replace('-', '년 ') + '월';
  return '';
}

function getLevel2(catName: string, isIncome: boolean) {
  return CATEGORY_MAP[catName]?.level2 ?? (isIncome ? '영업외 수익' : '사업외 지출');
}

function getCostGroup(catName: string) {
  return CATEGORY_MAP[catName]?.costGroup ?? null;
}

// ── 손익 계산 핵심 로직 ──
function calcPL(txs: Transaction[]) {
  const sumL2 = (l2: string) => {
    let t = 0;
    txs.forEach(tx => {
      if (getLevel2(tx.category, tx.credit > 0) === l2)
        t += tx.credit > 0 ? tx.credit : tx.debit;
    });
    return t;
  };

  const sumCG = (cg: string) => {
    let t = 0;
    txs.forEach(tx => {
      if (tx.debit > 0 && getCostGroup(tx.category) === cg) t += tx.debit;
    });
    return t;
  };

  const getDetail = (l2: string, cg?: string) => {
    const map: Record<string, number> = {};
    txs.forEach(tx => {
      const isInc = tx.credit > 0;
      if (getLevel2(tx.category, isInc) !== l2) return;
      if (cg && getCostGroup(tx.category) !== cg) return;
      const amt = isInc ? tx.credit : tx.debit;
      map[tx.category] = (map[tx.category] ?? 0) + amt;
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .filter(x => x.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  };

  // ① 사업 손익
  const bizRevenue   = sumL2('영업 수익');
  const bizExpense   = sumL2('영업 비용');
  const bizProfit    = bizRevenue - bizExpense;

  // ② 영업외 수지
  const nonOpIncome  = sumL2('영업외 수익');
  const nonOpExpense = sumL2('사업외 지출');
  const nonOpBalance = nonOpIncome - nonOpExpense;

  // ③ 현금 종합수지
  const cashTotal = bizProfit + nonOpBalance;

  // 비용 그룹
  const laborCost    = sumCG('인건비');
  const materialCost = sumCG('재료비');
  const fixedCost    = sumCG('고정비');
  const variableCost = sumCG('변동비');

  return {
    bizRevenue, bizExpense, bizProfit,
    nonOpIncome, nonOpExpense, nonOpBalance,
    cashTotal,
    laborCost, materialCost, fixedCost, variableCost,
    incomeDetail:   getDetail('영업 수익'),
    laborDetail:    getDetail('영업 비용', '인건비'),
    materialDetail: getDetail('영업 비용', '재료비'),
    fixedDetail:    getDetail('영업 비용', '고정비'),
    variableDetail: getDetail('영업 비용', '변동비'),
    nonOpIncDetail: getDetail('영업외 수익'),
    nonOpExpDetail: getDetail('사업외 지출'),
  };
}

// ── 3단계 손익 요약 카드 ──
const SummaryBlock: React.FC<{
  badge: string;
  title: string;
  subtitle: string;
  left: { label: string; value: number; color: string };
  right: { label: string; value: number; color: string };
  result: { label: string; value: number };
  bgClass: string;
}> = ({ badge, title, subtitle, left, right, result, bgClass }) => {
  const isPos = result.value >= 0;
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/60 text-text-primary">{badge}</span>
        <div>
          <p className="text-sm font-bold text-text-primary leading-tight">{title}</p>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>
      {/* 계산식 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="text-center">
          <p className="text-[10px] font-bold text-text-muted uppercase">{left.label}</p>
          <p className={`text-base font-black ${left.color}`}>{fmtM(left.value)}</p>
        </div>
        <span className="text-text-muted font-bold">-</span>
        <div className="text-center">
          <p className="text-[10px] font-bold text-text-muted uppercase">{right.label}</p>
          <p className={`text-base font-black ${right.color}`}>{fmtM(right.value)}</p>
        </div>
        <span className="text-text-muted font-bold">=</span>
        <div className="text-center flex-1">
          <p className="text-[10px] font-bold text-text-muted uppercase">{result.label}</p>
          <p className={`text-xl font-black ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPos ? '+' : ''}{fmtM(result.value)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── P&L 테이블 행 컴포넌트 ──
const PlRow: React.FC<{ label: string; amount: number; base: number; indent?: boolean }> = ({ label, amount, base, indent }) => (
  <tr className="hover:bg-surface-subtle/40 border-b border-border-color/20 last:border-0">
    <td className={`py-2.5 px-4 text-sm text-text-muted font-medium ${indent ? 'pl-10' : ''}`}>{label}</td>
    <td className="py-2.5 px-4 text-right text-sm font-semibold text-text-primary">{fmtW(amount)}</td>
    <td className="py-2.5 px-4 text-right text-sm text-text-muted font-medium">{pct(amount, base)}</td>
  </tr>
);

const PlSubtotal: React.FC<{ label: string; amount: number; base: number }> = ({ label, amount, base }) => (
  <tr className="border-t border-border-color bg-surface-subtle/50">
    <td className="py-2.5 px-4 pl-8 text-sm font-bold text-text-primary">{label}</td>
    <td className="py-2.5 px-4 text-right text-sm font-bold text-text-primary">{fmtW(amount)}</td>
    <td className="py-2.5 px-4 text-right text-sm font-bold text-text-muted">{pct(amount, base)}</td>
  </tr>
);

const PlSectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="bg-white">
    <td colSpan={3} className="py-3 px-4 font-bold text-sm text-brand-accent border-b-2 border-brand-accent/20">
      {children}
    </td>
  </tr>
);

const PlKeyRow: React.FC<{ badge: string; label: string; amount: number; base: number; desc?: string }> = ({ badge, label, amount, base, desc }) => {
  const isPos = amount >= 0;
  return (
    <tr className={`border-t-2 ${isPos ? 'border-emerald-400 bg-emerald-50/60' : 'border-red-400 bg-red-50/60'}`}>
      <td className="py-3.5 px-4">
        <span className={`text-xs font-black px-2 py-0.5 rounded-full mr-2 ${isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{badge}</span>
        <span className="font-bold text-text-primary">{label}</span>
        {desc && <span className="ml-2 text-xs text-text-muted font-normal">{desc}</span>}
      </td>
      <td className={`py-3.5 px-4 text-right text-lg font-black ${isPos ? 'text-emerald-600' : 'text-red-600'}`}>
        {isPos ? '+' : ''}{fmtW(amount)}
      </td>
      <td className="py-3.5 px-4 text-right font-bold text-text-muted">{pct(amount, base)}</td>
    </tr>
  );
};

const PlFinalRow: React.FC<{ amount: number; base: number }> = ({ amount, base }) => {
  const isPos = amount >= 0;
  return (
    <tr className={`border-t-4 ${isPos ? 'border-brand-primary bg-brand-primary/5' : 'border-red-500 bg-red-50'}`}>
      <td className="py-5 px-4">
        <div className="flex items-center gap-2">
          <span className="text-base font-black px-2.5 py-1 rounded-xl bg-brand-primary text-white">③</span>
          <div>
            <p className="font-black text-brand-primary text-base">현금 종합수지</p>
            <p className="text-xs text-text-muted font-normal">= ① 사업손익 + ② 영업외수지</p>
          </div>
        </div>
      </td>
      <td className={`py-5 px-4 text-right text-2xl font-black ${isPos ? 'text-brand-primary' : 'text-red-600'}`}>
        {isPos ? '+' : ''}{fmtW(amount)}
      </td>
      <td className="py-5 px-4 text-right font-bold text-brand-primary">{pct(amount, base)}</td>
    </tr>
  );
};

// ── 메인 대시보드 ──
const DashboardView: React.FC<Props> = ({ transactions, businessInfo, categories, pendingPdfDownload, onPdfDownloadConsumed }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const periodOptions = useMemo(() => getPeriodOptions(transactions), [transactions]);
  const periodLabel = getPeriodLabel(selectedPeriod);
  const filteredTxs = useMemo(() => filterByPeriod(transactions, selectedPeriod), [transactions, selectedPeriod]);
  const pl = useMemo(() => calcPL(filteredTxs), [filteredTxs]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { bizRev: number; bizExp: number; nonOpInc: number; nonOpExp: number }> = {};
    filteredTxs.forEach(tx => {
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { bizRev: 0, bizExp: 0, nonOpInc: 0, nonOpExp: 0 };
      const l2 = getLevel2(tx.category, tx.credit > 0);
      if (l2 === '영업 수익') map[key].bizRev += tx.credit;
      else if (l2 === '영업 비용') map[key].bizExp += tx.debit;
      else if (l2 === '영업외 수익') map[key].nonOpInc += tx.credit;
      else if (l2 === '사업외 지출') map[key].nonOpExp += tx.debit;
    });
    return Object.keys(map).sort().map(k => ({
      name: k,
      '사업매출': map[k].bizRev,
      '사업비용': map[k].bizExp,
      '사업손익': map[k].bizRev - map[k].bizExp,
      '영업외수지': map[k].nonOpInc - map[k].nonOpExp,
      '현금종합수지': (map[k].bizRev - map[k].bizExp) + (map[k].nonOpInc - map[k].nonOpExp),
    }));
  }, [filteredTxs]);

  const doExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportViewToPdf(contentRef.current, '종합 대시보드', businessInfo.name,
        `${businessInfo.name}_dashboard_${new Date().toISOString().slice(0, 10)}`);
    } catch (e) { console.error(e); }
    finally { setIsExporting(false); }
  };

  useEffect(() => {
    if (pendingPdfDownload?.type === 'dashboard') {
      const t = setTimeout(() => doExport().then(() => onPdfDownloadConsumed?.()), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPdfDownload]);

  const pendingPdfInfo: PendingPdf = {
    type: 'dashboard',
    orderId: generateOrderId('dashboard'),
    businessName: businessInfo.name,
    timestamp: Date.now(),
  };

  const profitRate = pl.bizRevenue > 0 ? (pl.bizProfit / pl.bizRevenue * 100).toFixed(1) : '0.0';

  return (
    <>
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── 헤더 + 기간 선택 ── */}
      <div className="bg-white rounded-3xl border border-border-color shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">dashboard</span>
            종합 대시보드
          </h2>
          <p className="text-sm text-text-muted mt-1 font-medium">
            사업 손익 · 영업외 수지 · 현금 종합수지를 한눈에 파악합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 bg-white text-text-primary border-2 border-border-color rounded-xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary appearance-none cursor-pointer"
            >
              {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </span>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-sm transition-colors text-sm whitespace-nowrap disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">{isExporting ? 'hourglass_empty' : 'download'}</span>
            {isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-8">

        {/* ── ① ② ③ 손익 3단계 요약 카드 ── */}
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">
            손익 구조 — {periodLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ① 사업 손익 */}
            <SummaryBlock
              badge="① 사업 손익"
              title="사업매출 - 사업비용"
              subtitle="영업 수익에서 영업 비용을 제한 순손익"
              left={{ label: '사업 매출', value: pl.bizRevenue, color: 'text-emerald-600' }}
              right={{ label: '사업 비용', value: pl.bizExpense, color: 'text-red-600' }}
              result={{ label: '사업 손익', value: pl.bizProfit }}
              bgClass="bg-emerald-50 border-emerald-200"
            />
            {/* ② 영업외 수지 */}
            <SummaryBlock
              badge="② 영업외 수지"
              title="영업외수익 - 영업외지출"
              subtitle="정부지원·개인입금에서 개인사비·카드대금을 제함"
              left={{ label: '영업외 수익', value: pl.nonOpIncome, color: 'text-teal-600' }}
              right={{ label: '사업외 지출', value: pl.nonOpExpense, color: 'text-orange-600' }}
              result={{ label: '영업외 수지', value: pl.nonOpBalance }}
              bgClass="bg-teal-50 border-teal-200"
            />
            {/* ③ 현금 종합수지 */}
            <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${pl.cashTotal >= 0 ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-brand-primary text-white">③ 현금 종합수지</span>
              </div>
              <p className="text-xs text-text-muted font-medium">= ① 사업손익 + ② 영업외수지<br/>통장의 실질적인 현금 증감액</p>
              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-xs text-text-muted font-bold">① {pl.bizProfit >= 0 ? '+' : ''}{fmtM(pl.bizProfit)}</p>
                  <p className="text-xs text-text-muted font-bold">② {pl.nonOpBalance >= 0 ? '+' : ''}{fmtM(pl.nonOpBalance)}</p>
                </div>
                <p className={`text-3xl font-black ${pl.cashTotal >= 0 ? 'text-brand-primary' : 'text-red-600'}`}>
                  {pl.cashTotal >= 0 ? '+' : ''}{fmtM(pl.cashTotal)}
                </p>
              </div>
              {pl.bizRevenue > 0 && (
                <p className="text-xs text-text-muted border-t border-border-color pt-2 font-medium">
                  사업 순이익률: <strong className="text-brand-primary">{profitRate}%</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 경영 손익 분석표 (3단계 구조) ── */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
          <div className="mb-5">
            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">table_chart</span>
              경영 손익 분석표
              <span className="ml-2 text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">{periodLabel}</span>
            </h3>
            <p className="text-sm text-text-muted mt-1">
              사장님 통장의 사업적 입출금과 개인·사업외 입출금을 구분하여 실질 손익을 계산합니다.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border-color">
            <table className="w-full text-sm">
              <thead className="bg-surface-subtle">
                <tr className="border-b-2 border-border-color">
                  <th className="py-3 px-4 text-left text-text-muted font-bold w-1/2">항목 / 계정명</th>
                  <th className="py-3 px-4 text-right text-text-muted font-bold w-1/4">금액</th>
                  <th className="py-3 px-4 text-right text-text-muted font-bold w-1/4">매출 대비</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/30">

                {/* ══ ① 사업 손익 섹션 ══ */}
                <PlSectionHead>
                  <span className="inline-flex items-center gap-2">
                    <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">①</span>
                    사업 손익 = 사업매출 - 사업비용
                  </span>
                </PlSectionHead>

                {/* 사업 매출 */}
                <tr className="bg-emerald-50/40">
                  <td colSpan={3} className="py-2 px-4 text-xs font-bold text-emerald-700 uppercase tracking-wider">▶ 사업 매출 (영업 수익)</td>
                </tr>
                {pl.incomeDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                {pl.incomeDetail.length === 0 && (
                  <tr><td colSpan={3} className="py-3 pl-10 text-text-muted italic text-sm">분류된 매출 항목이 없습니다.</td></tr>
                )}
                <PlSubtotal label="사업 매출 합계" amount={pl.bizRevenue} base={pl.bizRevenue} />

                {/* 사업 비용 */}
                <tr className="bg-red-50/40">
                  <td colSpan={3} className="py-2 px-4 text-xs font-bold text-red-700 uppercase tracking-wider">▶ 사업 비용 (영업 비용)</td>
                </tr>

                {pl.laborDetail.length > 0 && (<>
                  <tr><td colSpan={3} className="py-1.5 px-4 text-xs font-semibold text-text-muted">인건비</td></tr>
                  {pl.laborDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                  <PlSubtotal label="인건비 소계" amount={pl.laborCost} base={pl.bizRevenue} />
                </>)}

                {pl.materialDetail.length > 0 && (<>
                  <tr><td colSpan={3} className="py-1.5 px-4 text-xs font-semibold text-text-muted">재료비</td></tr>
                  {pl.materialDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                  <PlSubtotal label="재료비 소계" amount={pl.materialCost} base={pl.bizRevenue} />
                </>)}

                {pl.fixedDetail.length > 0 && (<>
                  <tr><td colSpan={3} className="py-1.5 px-4 text-xs font-semibold text-text-muted">고정비</td></tr>
                  {pl.fixedDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                  <PlSubtotal label="고정비 소계" amount={pl.fixedCost} base={pl.bizRevenue} />
                </>)}

                {pl.variableDetail.length > 0 && (<>
                  <tr><td colSpan={3} className="py-1.5 px-4 text-xs font-semibold text-text-muted">변동비</td></tr>
                  {pl.variableDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                  <PlSubtotal label="변동비 소계" amount={pl.variableCost} base={pl.bizRevenue} />
                </>)}

                {(pl.laborDetail.length + pl.materialDetail.length + pl.fixedDetail.length + pl.variableDetail.length) === 0 && (
                  <tr><td colSpan={3} className="py-3 pl-10 text-text-muted italic text-sm">분류된 비용 항목이 없습니다.</td></tr>
                )}
                <PlSubtotal label="사업 비용 합계" amount={pl.bizExpense} base={pl.bizRevenue} />

                {/* ① 사업 손익 결과 */}
                <PlKeyRow
                  badge="① 사업 손익"
                  label="사업매출 - 사업비용"
                  desc={`(순이익률 ${profitRate}%)`}
                  amount={pl.bizProfit}
                  base={pl.bizRevenue}
                />

                {/* ══ ② 영업외 수지 섹션 ══ */}
                <PlSectionHead>
                  <span className="inline-flex items-center gap-2">
                    <span className="bg-teal-500 text-white text-xs font-black px-2 py-0.5 rounded-full">②</span>
                    영업외 수지 = 영업외수익 - 사업외지출
                  </span>
                </PlSectionHead>

                <tr className="bg-teal-50/40">
                  <td colSpan={3} className="py-2 px-4 text-xs font-bold text-teal-700 uppercase tracking-wider">▶ 영업외 수익 (정부지원금, 외부입금 등)</td>
                </tr>
                {pl.nonOpIncDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                {pl.nonOpIncDetail.length === 0 && (
                  <tr><td colSpan={3} className="py-3 pl-10 text-text-muted italic text-sm">해당 항목 없음</td></tr>
                )}
                <PlSubtotal label="영업외 수익 합계" amount={pl.nonOpIncome} base={pl.bizRevenue} />

                <tr className="bg-orange-50/40">
                  <td colSpan={3} className="py-2 px-4 text-xs font-bold text-orange-700 uppercase tracking-wider">▶ 사업외 지출 (개인사비, 카드대금, 개인출금 등)</td>
                </tr>
                {pl.nonOpExpDetail.map(a => <PlRow key={a.name} label={a.name} amount={a.amount} base={pl.bizRevenue} indent />)}
                {pl.nonOpExpDetail.length === 0 && (
                  <tr><td colSpan={3} className="py-3 pl-10 text-text-muted italic text-sm">해당 항목 없음</td></tr>
                )}
                <PlSubtotal label="사업외 지출 합계" amount={pl.nonOpExpense} base={pl.bizRevenue} />

                {/* ② 영업외 수지 결과 */}
                <PlKeyRow
                  badge="② 영업외 수지"
                  label="영업외수익 - 사업외지출"
                  amount={pl.nonOpBalance}
                  base={pl.bizRevenue}
                />

                {/* ══ ③ 현금 종합수지 ══ */}
                <PlFinalRow amount={pl.cashTotal} base={pl.bizRevenue} />

              </tbody>
            </table>
          </div>

          {/* 하단 설명 */}
          <div className="mt-4 p-4 bg-surface-subtle rounded-xl border border-border-color text-xs text-text-muted space-y-1">
            <p><strong>① 사업 손익</strong>: 실제 사업 운영에서 발생한 순이익 (영업 수익 - 영업 비용)</p>
            <p><strong>② 영업외 수지</strong>: 사업과 무관한 수입/지출 (정부지원금, 개인사비, 카드대금 등)</p>
            <p><strong>③ 현금 종합수지</strong>: 통장의 실질적인 전체 현금 증감 (① + ②). 사업 손익과 개인 지출이 섞인 개인사업자 통장의 실질 현금 흐름입니다.</p>
          </div>
        </div>

        {/* ── 월별 추이 차트 ── */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-brand-primary">bar_chart</span>
            월별 재무 성과 추이
          </h3>
          <p className="text-sm text-text-muted mb-5">사업매출·사업비용·사업손익·영업외수지의 월별 변화를 확인합니다.</p>
          <IncomeExpenseChart data={monthlyData} />
        </div>

        {/* ── 수익/비용 파이차트 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-emerald-500">pie_chart</span>
              사업 매출 구성 비율
            </h3>
            <p className="text-sm text-text-muted mb-4">어느 채널에서 매출이 발생했는지 비중을 확인합니다.</p>
            <CategoryPieChart data={filteredTxs} type="operating_income" />
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-red-500">pie_chart</span>
              사업 비용 구성 비율
            </h3>
            <p className="text-sm text-text-muted mb-4">어느 비용 항목에 가장 많이 지출되었는지 확인합니다.</p>
            <CategoryPieChart data={filteredTxs} type="operating_expense" />
          </div>
        </div>

        {/* ── 상위 항목 추이 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
              주요 수입 항목 월별 추이
            </h3>
            <p className="text-sm text-text-muted mb-4">상위 5개 매출 항목의 월별 변화 추이입니다.</p>
            <TopCategoriesChart data={filteredTxs} type="operating_income" />
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-red-500">trending_down</span>
              주요 비용 항목 월별 추이
            </h3>
            <p className="text-sm text-text-muted mb-4">상위 5개 지출 항목의 월별 변화 추이입니다.</p>
            <TopCategoriesChart data={filteredTxs} type="operating_expense" />
          </div>
        </div>

      </div>
    </div>

    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      pdfInfo={pendingPdfInfo}
    />
    </>
  );
};

export default DashboardView;
