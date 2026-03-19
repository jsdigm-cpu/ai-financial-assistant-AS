import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction, BusinessInfo, Category } from '../../types';
import { CATEGORY_MAP } from '../../constants';
import { exportViewToPdf } from '../../services/pdfExporter';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories?: Category[];
}

const fmtFull = (n: number) => n.toLocaleString('ko-KR') + '원';
const fmtEok = (n: number) => n >= 100000000
  ? `${(n / 100000000).toFixed(2)}억원`
  : n >= 10000
  ? `${(n / 10000).toFixed(0)}만원`
  : fmtFull(n);

type ValuationMethod = 'income' | 'asset' | 'dcf';

const METHOD_INFO: Record<ValuationMethod, { label: string; desc: string; icon: string }> = {
  income:  { label: '수익환원법', desc: '월 평균 순이익 × 권리금 배수', icon: 'trending_up' },
  asset:   { label: '자산가치법', desc: '시설+재고+브랜드 가치 합산', icon: 'inventory_2' },
  dcf:     { label: '현금흐름할인법', desc: '미래 현금흐름의 현재 가치', icon: 'account_balance' },
};

const ValueView: React.FC<Props> = ({ transactions, businessInfo }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 자산 입력값
  const [assetValue, setAssetValue] = useState(50000000);
  const [inventoryValue, setInventoryValue] = useState(5000000);
  const [brandValue, setBrandValue] = useState(10000000);
  const [premiumMultiplier, setPremiumMultiplier] = useState(12);

  // DCF 파라미터
  const [discountRate, setDiscountRate] = useState(15); // 할인율 %
  const [growthRate, setGrowthRate] = useState(5);      // 성장률 %
  const [projectionYears, setProjectionYears] = useState(3);

  // 실제 거래 데이터 기반 수익성 계산
  const { monthlyAvgProfit, monthlyAvgRevenue, monthlyData, recentMonths } = useMemo(() => {
    if (transactions.length === 0) {
      return { monthlyAvgProfit: 3000000, monthlyAvgRevenue: 15000000, monthlyData: [], recentMonths: 0 };
    }

    const grouped: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(tx => {
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (tx.credit > 0) grouped[key].income += tx.credit;
      if (tx.debit > 0) grouped[key].expense += tx.debit;
    });

    const months = Object.keys(grouped).sort();
    const recent = months.slice(-6); // 최근 6개월
    const recentData = recent.map(m => ({ month: m, ...grouped[m], profit: grouped[m].income - grouped[m].expense }));
    const avgRevenue = recentData.reduce((s, d) => s + d.income, 0) / Math.max(recentData.length, 1);
    const avgProfit = recentData.reduce((s, d) => s + d.profit, 0) / Math.max(recentData.length, 1);

    return {
      monthlyAvgProfit: Math.max(0, avgProfit),
      monthlyAvgRevenue: avgRevenue,
      monthlyData: recentData,
      recentMonths: recentData.length,
    };
  }, [transactions]);

  // 각 평가 방법별 기업 가치
  const incomeValue = monthlyAvgProfit * premiumMultiplier;
  const assetTotal = assetValue + inventoryValue + brandValue;

  // DCF 계산
  const dcfValue = useMemo(() => {
    const annualProfit = monthlyAvgProfit * 12;
    let pv = 0;
    for (let year = 1; year <= projectionYears; year++) {
      const futureCashFlow = annualProfit * Math.pow(1 + growthRate / 100, year);
      pv += futureCashFlow / Math.pow(1 + discountRate / 100, year);
    }
    // 영구 성장 모델 터미널 밸류
    const terminalCF = annualProfit * Math.pow(1 + growthRate / 100, projectionYears + 1);
    const terminalValue = terminalCF / ((discountRate - growthRate) / 100);
    const pvTerminal = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);
    return pv + pvTerminal;
  }, [monthlyAvgProfit, discountRate, growthRate, projectionYears]);

  // 종합 평균가치 (3가지 방법의 가중 평균)
  const weights = { income: 0.4, asset: 0.3, dcf: 0.3 };
  const compositeValue = incomeValue * weights.income + assetTotal * weights.asset + dcfValue * weights.dcf;

  // 레이더 차트용 평가 지표
  const radarData = [
    { subject: '수익성', A: Math.min(100, (monthlyAvgProfit / monthlyAvgRevenue) * 400) },
    { subject: '안정성', A: Math.min(100, recentMonths / 6 * 100) },
    { subject: '자산건전성', A: Math.min(100, assetTotal / compositeValue * 200) },
    { subject: '성장가능성', A: Math.min(100, growthRate * 10) },
    { subject: '브랜드가치', A: Math.min(100, brandValue / compositeValue * 300) },
  ];

  const handleExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportViewToPdf(
        contentRef.current,
        '사업체 가치 평가',
        businessInfo.name,
        `${businessInfo.name}_valuation_${new Date().toISOString().slice(0, 10)}`
      );
    } catch (err) {
      console.error('PDF 오류:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">trending_up</span>
            데이터 기반 가치 평가
          </h2>
          <p className="text-text-muted mt-1">실제 거래 데이터와 3가지 평가 방법론으로 사업체의 객관적 가치를 산출합니다.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-secondary transition-all disabled:opacity-50 text-sm"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {isExporting ? 'PDF 생성 중...' : '가치 평가 리포트 PDF'}
        </button>
      </div>

      <div ref={contentRef} className="space-y-8">
        {/* 실제 수익성 요약 */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-3xl border border-border-color p-6">
            <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-lg">query_stats</span>
              실제 거래 데이터 기반 수익성 ({recentMonths}개월 평균)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '월 평균 매출', value: monthlyAvgRevenue, color: 'text-brand-primary' },
                { label: '월 평균 순손익', value: monthlyAvgProfit, color: monthlyAvgProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
                { label: '순이익률', value: monthlyAvgRevenue > 0 ? (monthlyAvgProfit / monthlyAvgRevenue * 100).toFixed(1) + '%' : '-', color: 'text-text-primary', isText: true },
                { label: '연간 예상 순이익', value: monthlyAvgProfit * 12, color: 'text-brand-primary' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-surface-subtle rounded-2xl border border-border-color/50">
                  <p className="text-xs font-bold text-text-muted mb-1">{item.label}</p>
                  <p className={`text-lg font-black ${item.color}`}>
                    {item.isText ? item.value : fmtEok(item.value as number)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측: 평가 파라미터 입력 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 수익환원법 */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl border border-border-color overflow-hidden">
              <div className="p-5 border-b border-border-color bg-surface-subtle/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">trending_up</span>
                <h3 className="font-bold text-text-primary">수익환원법 파라미터</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20 mb-4">
                  <div>
                    <p className="text-xs font-bold text-brand-primary">기준 월 순이익</p>
                    <p className="text-2xl font-black text-brand-primary">{fmtFull(monthlyAvgProfit)}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {transactions.length > 0 ? `최근 ${recentMonths}개월 실제 거래 기반` : '기본값 (데이터 없음)'}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-brand-primary/20">close</span>
                  <div>
                    <label className="text-xs font-bold text-text-muted block mb-2">권리금 배수 (개월)</label>
                    <select
                      value={premiumMultiplier}
                      onChange={e => setPremiumMultiplier(Number(e.target.value))}
                      className="border border-border-color rounded-xl px-3 py-2 font-bold text-text-primary bg-white"
                    >
                      {[6, 12, 18, 24, 30, 36].map(m => <option key={m} value={m}>{m}개월</option>)}
                    </select>
                  </div>
                  <span className="material-symbols-outlined text-4xl text-brand-primary/20">equal</span>
                  <div className="text-right">
                    <p className="text-xs font-bold text-text-muted">수익 가치</p>
                    <p className="text-xl font-black text-brand-primary">{fmtEok(incomeValue)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 자산가치법 */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl border border-border-color overflow-hidden">
              <div className="p-5 border-b border-border-color bg-surface-subtle/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">inventory_2</span>
                <h3 className="font-bold text-text-primary">자산가치법 파라미터</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: '시설/집기 가치 (감가상각 반영)', value: assetValue, setter: setAssetValue },
                  { label: '재고 자산 가치', value: inventoryValue, setter: setInventoryValue },
                  { label: '브랜드/영업권 가치', value: brandValue, setter: setBrandValue },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">{item.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.value}
                        onChange={e => item.setter(Number(e.target.value))}
                        className="w-full bg-surface-subtle border border-border-color rounded-xl px-4 py-3 font-bold text-text-primary text-right pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">원</span>
                    </div>
                    <p className="text-xs text-text-muted text-right">{fmtEok(item.value)}</p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color flex justify-between items-center">
                  <span className="font-bold text-text-muted">자산 합계</span>
                  <span className="text-xl font-black text-text-primary">{fmtEok(assetTotal)}</span>
                </div>
              </div>
            </motion.div>

            {/* DCF (현금흐름할인법) */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl border border-border-color overflow-hidden">
              <div className="p-5 border-b border-border-color bg-surface-subtle/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">account_balance</span>
                <h3 className="font-bold text-text-primary">현금흐름할인법 (DCF) 파라미터</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: '연간 할인율 (%)', desc: '요구 수익률 (위험 반영)', value: discountRate, setter: setDiscountRate, min: 5, max: 50 },
                  { label: '연간 성장률 (%)', desc: '매출 성장 가정치', value: growthRate, setter: setGrowthRate, min: 0, max: 30 },
                  { label: '예측 기간 (년)', desc: '현금흐름 예측 기간', value: projectionYears, setter: setProjectionYears, min: 1, max: 10 },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <label className="text-xs font-bold text-text-muted">{item.label}</label>
                    <p className="text-xs text-text-muted/70">{item.desc}</p>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      value={item.value}
                      onChange={e => item.setter(Number(e.target.value))}
                      className="w-full accent-brand-primary"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted">{item.min}</span>
                      <span className="text-lg font-black text-brand-primary">{item.value}{item.label.includes('%') ? '%' : '년'}</span>
                      <span className="text-xs text-text-muted">{item.max}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color flex justify-between items-center">
                  <span className="font-bold text-text-muted">DCF 산출 가치</span>
                  <span className="text-xl font-black text-text-primary">{fmtEok(dcfValue)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 우측: 종합 가치 카드 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl border border-border-color overflow-hidden"
            >
              <div className="p-8 bg-gradient-to-br from-brand-primary to-indigo-800 text-white text-center">
                <span className="text-xs font-bold opacity-70 uppercase tracking-widest block mb-2">종합 추정 기업 가치</span>
                <p className="text-4xl font-black mb-1">{fmtEok(compositeValue)}</p>
                <p className="text-white/60 text-sm">가중평균 (수익 40% + 자산 30% + DCF 30%)</p>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { method: '수익환원법', value: incomeValue, weight: 40, icon: 'trending_up' },
                  { method: '자산가치법', value: assetTotal, weight: 30, icon: 'inventory_2' },
                  { method: '현금흐름할인법', value: dcfValue, weight: 30, icon: 'account_balance' },
                ].map(item => (
                  <div key={item.method} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-brand-primary text-base">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-text-muted">{item.method} (가중치 {item.weight}%)</span>
                        <span className="text-sm font-black text-text-primary">{fmtEok(item.value)}</span>
                      </div>
                      <div className="h-1.5 bg-border-color rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-primary rounded-full"
                          style={{ width: `${Math.min(100, item.value / compositeValue * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">info</span>
                    평가 주의사항
                  </p>
                  본 평가는 추정치입니다. 실제 거래 시 상권, 업종 트렌드, 개별 협상에 따라 크게 달라질 수 있습니다. 공인 평가사의 검토를 권장합니다.
                </div>
              </div>
            </motion.div>

            {/* 레이더 차트 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl border border-border-color p-6"
            >
              <h4 className="font-bold text-sm text-text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary text-base">radar</span>
                종합 사업 가치 지표
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="평가" dataKey="A" stroke="#1a1a2e" fill="#1a1a2e" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(0)}점`} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValueView;
