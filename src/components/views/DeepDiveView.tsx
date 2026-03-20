import React, { useRef, useState, useEffect } from 'react';
import { Transaction, BusinessInfo, Category, DeepDiveAIReport } from '../../types';
import { exportViewToPdf } from '../../services/pdfExporter';
import PaymentModal from '../PaymentModal';
import { PendingPdf, generateOrderId } from '../../hooks/usePaymentGate';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
  deepDiveReport: DeepDiveAIReport | null;
  deepDiveStatus: { isLoading: boolean; error: string | null };
  onGenerate: () => void;
  pendingPdfDownload?: PendingPdf | null;
  onPdfDownloadConsumed?: () => void;
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const label = score >= 75 ? '양호' : score >= 50 ? '보통' : '주의';
  const labelColor = score >= 75 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-red-700';
  const bgColor = score >= 75 ? 'bg-emerald-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50';
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-3 bg-border-color rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${bgColor} ${labelColor}`}>
        {label} {score}점
      </div>
    </div>
  );
};

const DeepDiveView: React.FC<Props> = ({
  transactions,
  businessInfo,
  categories,
  deepDiveReport,
  deepDiveStatus,
  onGenerate,
  pendingPdfDownload,
  onPdfDownloadConsumed,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const doExport = async () => {
    if (!contentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportViewToPdf(
        contentRef.current,
        '심층 경영 진단',
        businessInfo.name,
        `${businessInfo.name}_deepdive_${new Date().toISOString().slice(0, 10)}`
      );
    } catch (err) {
      console.error('PDF 내보내기 오류:', err);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (pendingPdfDownload?.type === 'deepdive') {
      doExport().then(() => onPdfDownloadConsumed?.());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPdfDownload]);

  const pendingPdfInfo: PendingPdf = {
    type: 'deepdive',
    orderId: generateOrderId('deepdive'),
    businessName: businessInfo.name,
    timestamp: Date.now(),
  };

  if (deepDiveStatus.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-brand-primary/20 rounded-full"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-brand-primary text-2xl">psychology</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary">AI 심층 경영 진단 중...</p>
          <p className="text-text-muted mt-2">재무 건전성, 리스크, 전략적 기회를 분석하고 있습니다. 잠시만 기다려 주세요.</p>
        </div>
        <div className="flex gap-2">
          {[0.2, 0.4, 0.6].map((delay) => (
            <div
              key={delay}
              className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!deepDiveReport) {
    return (
      <div className="space-y-8">
        {/* 빈 상태 - 생성 버튼 */}
        <div className="bg-white rounded-3xl border border-border-color p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-brand-primary">psychology</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">AI 심층 경영 진단</h3>
            <p className="text-text-muted mb-8 leading-relaxed">
              Gemini AI가 사장님의 실제 거래 데이터를 분석하여 재무 건전성, 리스크, 성장 기회를 종합적으로 진단합니다.
              단순 요약을 넘어 실질적인 경영 전략까지 제시해 드립니다.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: 'monitor_heart', label: '재무 건전성', desc: '수익성·안정성 점수' },
                { icon: 'trending_up', label: '전략적 기회', desc: '성장 방향 제시' },
                { icon: 'shield', label: '리스크 평가', desc: '위험 요소 & 대응책' },
                { icon: 'lightbulb', label: '실행 과제', desc: '구체적 개선 액션' },
              ].map(item => (
                <div key={item.label} className="p-4 bg-surface-subtle rounded-2xl border border-border-color/50 text-left">
                  <span className="material-symbols-outlined text-brand-primary mb-2 block">{item.icon}</span>
                  <h4 className="font-bold text-sm text-text-primary">{item.label}</h4>
                  <p className="text-xs text-text-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            {deepDiveStatus.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <span className="font-bold">오류: </span>{deepDiveStatus.error}
              </div>
            )}

            <button
              onClick={onGenerate}
              disabled={transactions.length === 0}
              className="inline-flex items-center gap-3 px-10 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-lg rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              <span className="material-symbols-outlined">psychology</span>
              AI 심층 진단 시작하기
            </button>
            {transactions.length === 0 && (
              <p className="mt-3 text-sm text-text-muted">거래 데이터를 먼저 업로드해 주세요.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const avgScore = deepDiveReport.financialHealthAnalysis.length > 0
    ? Math.round(deepDiveReport.financialHealthAnalysis.reduce((s, a) => s + a.score, 0) / deepDiveReport.financialHealthAnalysis.length)
    : 0;

  const totalIncome = transactions.reduce((s, t) => s + t.credit, 0);
  const totalExpense = transactions.reduce((s, t) => s + t.debit, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <>
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="bg-white rounded-3xl border border-border-color p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">psychology</span>
            AI 심층 경영 진단
          </h2>
          <p className="text-text-muted text-sm mt-1">Gemini AI가 실제 거래 데이터를 기반으로 생성한 경영 진단 리포트</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerate}
            className="flex items-center gap-2 px-4 py-2 bg-surface-subtle border border-border-color rounded-xl text-sm font-bold text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            재생성
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm transition-all hover:bg-brand-secondary disabled:opacity-50 text-sm"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {isExporting ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
        </div>
      </div>

      <div ref={contentRef} className="space-y-8">
        {/* 핵심 요약 + 종합 점수 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-br from-brand-primary to-indigo-700 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-white/70">summarize</span>
              <span className="text-sm font-bold uppercase tracking-widest text-white/70">Executive Summary</span>
            </div>
            <p className="text-lg font-medium leading-relaxed text-white/95">
              {deepDiveReport.executiveSummary}
            </p>
            <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-white/60 uppercase">분석 거래 건수</p>
                <p className="text-xl font-black">{transactions.length.toLocaleString()}건</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white/60 uppercase">총 매출</p>
                <p className="text-xl font-black">{(totalIncome / 10000).toFixed(0)}만원</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white/60 uppercase">순손익</p>
                <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {(netProfit / 10000).toFixed(0)}만원
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border-color p-8 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">종합 재무 건전성 점수</p>
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={avgScore >= 75 ? '#10b981' : avgScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${avgScore} ${100 - avgScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-text-primary">{avgScore}</span>
                <span className="text-xs text-text-muted font-bold">/ 100</span>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${avgScore >= 75 ? 'bg-emerald-100 text-emerald-700' : avgScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {avgScore >= 75 ? '재무 건전' : avgScore >= 50 ? '주의 필요' : '긴급 개선 필요'}
            </span>
          </div>
        </div>

        {/* 재무 건전성 항목별 분석 */}
        <div className="bg-white rounded-3xl border border-border-color p-8">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">monitor_heart</span>
            재무 건전성 세부 분석
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deepDiveReport.financialHealthAnalysis.map((item, i) => (
              <div key={i} className="p-6 bg-surface-subtle rounded-2xl border border-border-color/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="font-bold text-text-primary">{item.title}</h4>
                  <span className={`text-lg font-black px-3 py-0.5 rounded-xl ${item.score >= 75 ? 'bg-emerald-100 text-emerald-700' : item.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {item.score}
                  </span>
                </div>
                <ScoreBar score={item.score} />
                <p className="text-sm text-text-muted mt-3 leading-relaxed">{item.analysis}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 전략적 권고사항 */}
        <div className="bg-white rounded-3xl border border-border-color p-8">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">trending_up</span>
            전략적 권고사항
          </h3>
          <div className="space-y-4">
            {deepDiveReport.strategicRecommendations.map((item, i) => (
              <div key={i} className="flex gap-5 p-6 bg-surface-subtle rounded-2xl border border-border-color/50 hover:border-brand-primary/30 transition-colors">
                <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-text-primary mb-1">{item.title}</h4>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{item.description}</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                    <span className="material-symbols-outlined text-xs">arrow_upward</span>
                    기대 효과: {item.expectedImpact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 리스크 평가 */}
        <div className="bg-white rounded-3xl border border-border-color p-8">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">shield</span>
            리스크 평가 및 대응 전략
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deepDiveReport.riskAssessment.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border-color">
                <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-xl shrink-0 mt-0.5">warning</span>
                  <div>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">리스크</p>
                    <p className="font-bold text-text-primary text-sm">{item.risk}</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">shield</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">대응 전략</p>
                    <p className="text-sm text-text-muted leading-relaxed">{item.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
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

export default DeepDiveView;
