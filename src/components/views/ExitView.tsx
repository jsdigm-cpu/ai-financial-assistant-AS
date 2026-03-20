import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessInfo, Transaction } from '../../types';
import { exportViewToPdf } from '../../services/pdfExporter';
import PaymentModal from '../PaymentModal';
import { PendingPdf, generateOrderId } from '../../hooks/usePaymentGate';

interface Props {
  businessInfo: BusinessInfo;
  transactions?: Transaction[];
  pendingPdfDownload?: PendingPdf | null;
  onPdfDownloadConsumed?: () => void;
}

interface ChecklistItem {
  id: string;
  task: string;
  detail: string;
  completed: boolean;
  category: string;
  phase: number;       // 1: 결정 전, 2: 3개월 전, 3: 1개월 전, 4: 마지막 주, 5: 완료 후
  priority: 'critical' | 'important' | 'normal';
  deadline?: string;
}

const PHASE_INFO: Record<number, { label: string; color: string; bg: string; border: string; icon: string }> = {
  1: { label: '결정 전 (준비)', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: 'lightbulb' },
  2: { label: '3개월 전',       color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'schedule' },
  3: { label: '1개월 전',       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'warning' },
  4: { label: '마지막 주',      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: 'timer' },
  5: { label: '폐업 완료 후',   color: 'text-gray-700',   bg: 'bg-gray-50',   border: 'border-gray-200',   icon: 'done_all' },
};

const PRIORITY_CONFIG = {
  critical:  { label: '필수', color: 'text-red-600',    bg: 'bg-red-100' },
  important: { label: '중요', color: 'text-amber-600',  bg: 'bg-amber-100' },
  normal:    { label: '권고', color: 'text-blue-600',   bg: 'bg-blue-100' },
};

const INITIAL_CHECKLIST: ChecklistItem[] = [
  // Phase 1: 결정 전
  { id: 'p1-1', task: '폐업 vs 매각 의사결정', detail: '폐업 직접 진행과 사업 양수도 비교. 매각 시 권리금 회수 가능성 검토', completed: false, category: '전략', phase: 1, priority: 'critical' },
  { id: 'p1-2', task: '세무사/노무사 상담', detail: '폐업 절차 전 전문가 조언 필수. 세금 및 퇴직금 이슈 사전 파악', completed: false, category: '법률/세무', phase: 1, priority: 'critical' },
  { id: 'p1-3', task: '정부지원제도 사전 확인', detail: '희망리턴패키지, 재창업패키지 등 지원 요건 미리 파악', completed: false, category: '정부지원', phase: 1, priority: 'important' },
  { id: 'p1-4', task: '재고 및 자산 현황 파악', detail: '판매 가능 재고, 중고 기계 처분 방법 미리 검토', completed: false, category: '자산관리', phase: 1, priority: 'normal' },

  // Phase 2: 3개월 전
  { id: 'p2-1', task: '임대차 계약 해지 통보 (서면)', detail: '최소 3개월 전 서면 통보 필수. 묵시적 갱신 여부 확인', completed: false, category: '부동산', phase: 2, priority: 'critical' },
  { id: 'p2-2', task: '직원 해고예고 통보', detail: '30일 전 예고 또는 1개월분 해고예고수당 지급 의무', completed: false, category: '인사/노무', phase: 2, priority: 'critical' },
  { id: 'p2-3', task: '거래처 계약 해지 통보', detail: '공급업체, 카드단말기, POS시스템 등 각종 계약 해지 일정 조율', completed: false, category: '계약', phase: 2, priority: 'important' },
  { id: 'p2-4', task: '원상복구 업체 견적 비교', detail: '최소 3군데 이상 견적. 임대인과 원상복구 범위 미리 협의', completed: false, category: '시설', phase: 2, priority: 'important' },
  { id: 'p2-5', task: '재고 소진 계획 수립', detail: '마지막까지 남은 재고 최대한 소진. 폐기 비용 최소화', completed: false, category: '자산관리', phase: 2, priority: 'normal' },
  { id: 'p2-6', task: '사업양수도 광고 (선택)', detail: '부동산중개사, 상가닥, 점포라인 등에 매물 등록 검토', completed: false, category: '매각', phase: 2, priority: 'normal' },

  // Phase 3: 1개월 전
  { id: 'p3-1', task: '직원 퇴직금 정산 계획 확정', detail: '계속근로 1년 이상 직원 대상. 퇴직금 = 평균임금 × 근속연수', completed: false, category: '인사/노무', phase: 3, priority: 'critical' },
  { id: 'p3-2', task: '4대보험 상실신고 준비', detail: '건강보험·국민연금·고용보험·산재보험 상실신고 자료 준비', completed: false, category: '인사/노무', phase: 3, priority: 'critical' },
  { id: 'p3-3', task: '부가가치세 확정신고 준비', detail: '폐업일이 속한 달의 다음달 25일까지 신고. 미신고 시 가산세', completed: false, category: '세무', phase: 3, priority: 'critical' },
  { id: 'p3-4', task: '희망리턴패키지 신청 (폐업 전)', detail: '폐업 전 신청해야 지원 가능. 철거비 최대 250만원, 심리지원 등', completed: false, category: '정부지원', phase: 3, priority: 'important' },
  { id: 'p3-5', task: '사업자등록 폐업신고 준비', detail: '폐업일로부터 25일 이내 세무서 또는 홈택스 신고 의무', completed: false, category: '세무', phase: 3, priority: 'important' },

  // Phase 4: 마지막 주
  { id: 'p4-1', task: '사업자등록 폐업신고 (홈택스)', detail: '홈택스 접속 → 사업장 현황 → 폐업신고. 즉시 처리 가능', completed: false, category: '세무', phase: 4, priority: 'critical' },
  { id: 'p4-2', task: '4대보험 사업장 탈퇴신고', detail: '각 공단에 사업장 폐업 신고. 온라인(4대보험포털) 또는 방문', completed: false, category: '인사/노무', phase: 4, priority: 'critical' },
  { id: 'p4-3', task: '전기·가스·수도 해지', detail: '이전요금 정산 후 계약 해지. 보증금 환급 확인', completed: false, category: '시설', phase: 4, priority: 'important' },
  { id: 'p4-4', task: '카드단말기 반납', detail: '밴(VAN)사에 연락하여 단말기 반납 및 계약 해지', completed: false, category: '시설', phase: 4, priority: 'important' },
  { id: 'p4-5', task: '원상복구 공사 완료 및 열쇠 반납', detail: '임대인 입회 하에 원상복구 상태 확인. 보증금 환급 조건 확인', completed: false, category: '부동산', phase: 4, priority: 'critical' },

  // Phase 5: 완료 후
  { id: 'p5-1', task: '종합소득세 신고 (다음해 5월)', detail: '폐업 연도의 사업소득 포함 종합소득세 신고 필수', completed: false, category: '세무', phase: 5, priority: 'critical' },
  { id: 'p5-2', task: '사업자통장 정리', detail: '사업용 통장 잔액 정산. 미수금·미지급금 최종 처리', completed: false, category: '재무', phase: 5, priority: 'important' },
  { id: 'p5-3', task: '재기지원 프로그램 상담', detail: '소상공인진흥공단 재기지원센터 상담. 재창업 및 취업 지원 연계', completed: false, category: '정부지원', phase: 5, priority: 'normal' },
  { id: 'p5-4', task: '세금계산서·영수증 5년 보관', detail: '폐업 후에도 세금 서류 5년간 보관 의무 (세금 분쟁 대비)', completed: false, category: '세무', phase: 5, priority: 'normal' },
];

const SUPPORT_PROGRAMS = [
  {
    name: '희망리턴패키지',
    org: '소상공인진흥공단',
    benefit: '점포철거비 최대 250만원 + 심리치료 + 취업지원',
    condition: '폐업 예정 소상공인 (사업기간 1년 이상)',
    tip: '폐업 전에 신청해야 하므로 3개월 전 반드시 확인',
    priority: 'critical' as const,
  },
  {
    name: '소상공인 폐업 지원금',
    org: '지자체 (시·군·구)',
    benefit: '지역별 상이 (생활안정자금 50~200만원)',
    condition: '해당 지자체 소상공인 등록',
    tip: '지역마다 지원 금액과 조건이 다르므로 거주 지자체 확인',
    priority: 'important' as const,
  },
  {
    name: '재창업 패키지',
    org: '중소벤처기업부',
    benefit: '재창업 교육 + 사업화 지원금 최대 1억원',
    condition: '폐업 이력자로 재창업 의지가 있는 경우',
    tip: '재창업 의지가 있다면 폐업 직후 신청 검토',
    priority: 'important' as const,
  },
  {
    name: '법률·세무 무료 컨설팅',
    org: '대한법률구조공단 / 세무사공회',
    benefit: '폐업 관련 법적 분쟁, 세금신고 무료 상담',
    condition: '소득기준 충족 또는 일부 서비스 무료',
    tip: '퇴직금 분쟁, 임대차 분쟁 등 법적 문제 발생 시 즉시 활용',
    priority: 'normal' as const,
  },
];

const ExitView: React.FC<Props> = ({ businessInfo, transactions = [], pendingPdfDownload, onPdfDownloadConsumed }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [selectedPhase, setSelectedPhase] = useState<number | 'all'>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleTask = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const filteredList = useMemo(() =>
    selectedPhase === 'all' ? checklist : checklist.filter(i => i.phase === selectedPhase),
    [checklist, selectedPhase]
  );

  const totalCount = checklist.length;
  const completedCount = checklist.filter(i => i.completed).length;
  const progress = Math.round(completedCount / totalCount * 100);
  const criticalPending = checklist.filter(i => !i.completed && i.priority === 'critical').length;

  // 재무 리스크 분석 (거래 데이터 기반)
  const financialRisk = useMemo(() => {
    if (transactions.length === 0) return null;
    const totalIncome = transactions.reduce((s, t) => s + t.credit, 0);
    const totalExpense = transactions.reduce((s, t) => s + t.debit, 0);
    const netProfit = totalIncome - totalExpense;
    const months = new Set(transactions.map(t => t.date.toISOString().slice(0, 7))).size;
    const avgMonthly = months > 0 ? netProfit / months : 0;
    return {
      totalIncome, totalExpense, netProfit, months, avgMonthly,
      isLoss: netProfit < 0,
      lossMonths: Math.abs(avgMonthly < 0 ? Math.ceil(netProfit / avgMonthly) : 0),
    };
  }, [transactions]);

  const doExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportViewToPdf(contentRef.current, '전략적 마무리지원', businessInfo.name, `${businessInfo.name}_exit_${new Date().toISOString().slice(0, 10)}`);
    } catch (err) { console.error(err); }
    finally { setIsExporting(false); }
  };

  useEffect(() => {
    if (pendingPdfDownload?.type === 'exit') {
      const timer = setTimeout(() => {
        doExport().then(() => onPdfDownloadConsumed?.());
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPdfDownload]);

  const pendingPdfInfo: PendingPdf = {
    type: 'exit',
    orderId: generateOrderId('exit'),
    businessName: businessInfo.name,
    timestamp: Date.now(),
  };

  return (
    <>
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">exit_to_app</span>
            전략적 마무리지원
          </h2>
          <p className="text-text-muted mt-1">단계별 체크리스트로 성공적이고 손실 없는 폐업을 도와드립니다.</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-secondary transition-all disabled:opacity-50 text-sm"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          {isExporting ? 'PDF 생성 중...' : '체크리스트 PDF'}
        </button>
      </div>

      {/* 진행률 요약 */}
      <div className="bg-white rounded-3xl border border-border-color p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-text-primary">전체 진행률</span>
              <span className="text-2xl font-black text-brand-primary">{progress}%</span>
            </div>
            <div className="w-full h-4 bg-border-color rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={`h-full rounded-full ${progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-brand-primary'}`}
              />
            </div>
            <p className="text-sm text-text-muted mt-2">{completedCount} / {totalCount} 항목 완료</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-2xl font-black text-red-600">{criticalPending}</p>
              <p className="text-xs font-bold text-red-500">필수 미완료</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
              <p className="text-xs font-bold text-emerald-500">완료 항목</p>
            </div>
            <div className="text-center p-3 bg-surface-subtle rounded-2xl border border-border-color">
              <p className="text-2xl font-black text-text-primary">{totalCount - completedCount}</p>
              <p className="text-xs font-bold text-text-muted">미완료</p>
            </div>
          </div>
        </div>

        {criticalPending > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700 font-bold">
            <span className="material-symbols-outlined text-red-500">warning</span>
            {criticalPending}개의 필수 항목이 아직 완료되지 않았습니다. 법적·재무적 손실이 발생할 수 있습니다.
          </div>
        )}
      </div>

      <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 체크리스트 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 단계 필터 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPhase('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedPhase === 'all' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-muted border-border-color hover:border-brand-primary'}`}
            >
              전체 ({totalCount})
            </button>
            {([1, 2, 3, 4, 5] as number[]).map(phase => {
              const cfg = PHASE_INFO[phase];
              const count = checklist.filter(i => i.phase === phase).length;
              const done = checklist.filter(i => i.phase === phase && i.completed).length;
              return (
                <button
                  key={phase}
                  onClick={() => setSelectedPhase(phase)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${selectedPhase === phase ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'bg-white text-text-muted border-border-color hover:border-brand-primary'}`}
                >
                  {cfg.label} ({done}/{count})
                </button>
              );
            })}
          </div>

          {/* 체크리스트 항목 */}
          <div className="space-y-3">
            {([1, 2, 3, 4, 5] as number[])
              .filter(phase => selectedPhase === 'all' || selectedPhase === phase)
              .map(phase => {
                const phaseItems = filteredList.filter(i => i.phase === phase);
                if (phaseItems.length === 0) return null;
                const cfg = PHASE_INFO[phase];
                return (
                  <div key={phase}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${cfg.bg} ${cfg.border} border mb-2`}>
                      <span className={`material-symbols-outlined text-sm ${cfg.color}`}>{cfg.icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                        Phase {phase}: {cfg.label}
                      </span>
                      <span className={`ml-auto text-xs font-bold ${cfg.color}`}>
                        {phaseItems.filter(i => i.completed).length}/{phaseItems.length}
                      </span>
                    </div>

                    {phaseItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        className={`rounded-2xl border transition-all mb-2 overflow-hidden ${item.completed ? 'bg-surface-subtle border-border-color opacity-70' : 'bg-white border-border-color hover:border-brand-primary/40'}`}
                      >
                        <div
                          className="flex items-center gap-4 p-4 cursor-pointer"
                          onClick={() => toggleTask(item.id)}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-border-color'}`}
                          >
                            {item.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[item.priority].bg} ${PRIORITY_CONFIG[item.priority].color}`}>
                                {PRIORITY_CONFIG[item.priority].label}
                              </span>
                              <span className="text-xs text-text-muted">{item.category}</span>
                            </div>
                            <p className={`font-bold text-text-primary text-sm ${item.completed ? 'line-through' : ''}`}>{item.task}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setExpandedItem(expandedItem === item.id ? null : item.id); }}
                            className="p-1 text-text-muted hover:text-brand-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">
                              {expandedItem === item.id ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedItem === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0">
                                <div className="p-3 bg-surface-subtle rounded-xl border border-border-color/50 text-sm text-text-muted leading-relaxed">
                                  <span className="material-symbols-outlined text-brand-primary text-sm mr-1 align-middle">info</span>
                                  {item.detail}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>

        {/* 우측: 지원 프로그램 + 재무 리스크 */}
        <div className="space-y-6">
          {/* 재무 리스크 (데이터 있을 때) */}
          {financialRisk && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-3xl border p-6 ${financialRisk.isLoss ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
            >
              <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${financialRisk.isLoss ? 'text-red-800' : 'text-emerald-800'}`}>
                <span className="material-symbols-outlined">{financialRisk.isLoss ? 'trending_down' : 'trending_up'}</span>
                실제 경영 현황 진단
              </h3>
              <div className="space-y-3">
                {[
                  { label: '총 매출', value: (financialRisk.totalIncome / 10000).toFixed(0) + '만원' },
                  { label: '총 비용', value: (financialRisk.totalExpense / 10000).toFixed(0) + '만원' },
                  { label: '총 순손익', value: (financialRisk.netProfit / 10000).toFixed(0) + '만원', highlight: true },
                  { label: '월 평균 순손익', value: (financialRisk.avgMonthly / 10000).toFixed(0) + '만원' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text-muted">{item.label}</span>
                    <span className={`font-black ${item.highlight ? (financialRisk.isLoss ? 'text-red-600' : 'text-emerald-600') : 'text-text-primary'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {financialRisk.isLoss && (
                <div className="mt-4 p-3 bg-red-100 rounded-xl text-xs text-red-700 leading-relaxed">
                  <strong>손실 경고:</strong> 현재 월 손실이 지속될 경우 빠른 폐업 결정이 추가 손실을 줄일 수 있습니다.
                </div>
              )}
            </motion.div>
          )}

          {/* 정부 지원 프로그램 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-border-color overflow-hidden"
          >
            <div className="p-5 border-b border-border-color bg-surface-subtle/50">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">support_agent</span>
                활용 가능한 정부 지원 프로그램
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {SUPPORT_PROGRAMS.map(program => (
                <div key={program.name} className="p-4 bg-surface-subtle rounded-2xl border border-border-color hover:border-brand-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-text-primary">{program.name}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_CONFIG[program.priority].bg} ${PRIORITY_CONFIG[program.priority].color}`}>
                      {PRIORITY_CONFIG[program.priority].label}
                    </span>
                  </div>
                  <p className="text-xs text-brand-primary font-bold mb-1">{program.org}</p>
                  <p className="text-xs text-text-muted mb-2 leading-relaxed">{program.benefit}</p>
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <span className="font-bold">팁: </span>{program.tip}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 주의 사항 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 rounded-3xl border border-red-100 p-6"
          >
            <h3 className="font-bold text-base text-red-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">warning</span>
              반드시 지켜야 할 주의사항
            </h3>
            <ul className="space-y-3 text-sm text-red-700 leading-relaxed">
              <li className="flex gap-2">
                <span className="font-black text-red-500 shrink-0">1.</span>
                부가가치세 미신고 시 <strong>무신고 가산세 20%</strong> + 납부지연가산세 발생
              </li>
              <li className="flex gap-2">
                <span className="font-black text-red-500 shrink-0">2.</span>
                직원 퇴직금 미지급 시 <strong>형사처벌 대상</strong> (3년 이하 징역 또는 3천만원 이하 벌금)
              </li>
              <li className="flex gap-2">
                <span className="font-black text-red-500 shrink-0">3.</span>
                임대차 해지 미통보 시 <strong>묵시적 갱신</strong>으로 추가 임대료 부담
              </li>
              <li className="flex gap-2">
                <span className="font-black text-red-500 shrink-0">4.</span>
                정부지원금은 <strong>폐업 완료 전</strong> 신청해야 하는 경우가 많음
              </li>
            </ul>
          </motion.div>
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

export default ExitView;
