import React, { useState } from 'react';
import { Transaction, BusinessInfo, AIReport, DeepDiveAIReport } from '../types';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  summaryReport: AIReport | null;
  deepDiveReport: DeepDiveAIReport | null;
  summaryStatus: { isLoading: boolean; error: string | null };
  deepDiveStatus: { isLoading: boolean; error: string | null };
  onGenerate: (type: 'summary' | 'deepDive') => void;
}

const AIReportGenerator: React.FC<Props> = ({ 
  transactions, 
  businessInfo,
  summaryReport,
  deepDiveReport,
  summaryStatus,
  deepDiveStatus,
  onGenerate 
}) => {
  const [reportType, setReportType] = useState<'summary' | 'deepDive'>('summary');

  const currentReport = reportType === 'summary' ? summaryReport : deepDiveReport;
  const currentStatus = reportType === 'summary' ? summaryStatus : deepDiveStatus;
  
  const renderSummaryReport = (report: AIReport) => (
      <div className="mt-8 space-y-8 animate-fade-in">
        <div className="bg-surface-subtle/30 p-6 rounded-2xl border border-border-color/50">
          <h4 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span>
            종합 재무 요약
          </h4>
          <p className="text-text-primary text-lg leading-relaxed font-medium">{report.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
              <h5 className="font-bold text-emerald-700 mb-4 flex items-center gap-2 text-lg">
                <span className="text-xl">✅</span>
                긍정적 측면
              </h5>
              <ul className="space-y-3">
                  {report.positivePoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-800 font-medium">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
              </ul>
          </div>
            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
              <h5 className="font-bold text-amber-700 mb-4 flex items-center gap-2 text-lg">
                <span className="text-xl">⚠️</span>
                개선 필요 영역
              </h5>
              <ul className="space-y-3">
                  {report.areasForImprovement.map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-amber-800 font-medium">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
              </ul>
          </div>
        </div>
          <div>
          <h4 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            AI 맞춤형 실행 전략
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.actionableSuggestions.map((suggestion, i) => (
                    <div key={i} className="bg-white border border-border-color p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                            {i + 1}
                          </div>
                          <h5 className="font-bold text-text-primary text-lg">{suggestion.title}</h5>
                        </div>
                        <p className="text-text-muted font-medium leading-relaxed pl-11">{suggestion.description}</p>
                    </div>
                ))}
          </div>
        </div>
      </div>
  );

  const renderDeepDiveReport = (report: DeepDiveAIReport) => (
      <div className="mt-8 space-y-10 animate-fade-in">
          <div className="bg-surface-subtle/30 p-8 rounded-3xl border border-border-color/50">
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">📑</span>
                Executive Summary
              </h4>
              <p className="text-text-primary text-lg leading-relaxed font-medium whitespace-pre-line">{report.executiveSummary}</p>
          </div>
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🏥</span>
                재무 건전성 분석
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {report.financialHealthAnalysis.map((item, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-border-color shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4 gap-4">
                              <h5 className="font-bold text-text-primary text-lg leading-tight">{item.title}</h5>
                              <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-xl flex-shrink-0 ${item.score >= 8 ? 'bg-emerald-100 text-emerald-600' : item.score >= 5 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                {item.score}
                              </div>
                          </div>
                          <p className="text-text-muted font-medium leading-relaxed flex-grow">{item.analysis}</p>
                      </div>
                  ))}
              </div>
          </div>
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                전략적 제안
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.strategicRecommendations.map((item, i) => (
                      <div key={i} className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
                          <h5 className="font-bold text-blue-800 text-lg mb-3 flex items-center gap-2">
                            <span className="text-xl">✨</span>
                            {item.title}
                          </h5>
                          <p className="text-blue-900 font-medium leading-relaxed mb-4">{item.description}</p>
                          <div className="bg-white/60 p-4 rounded-xl border border-blue-100/50">
                            <p className="text-sm font-bold text-blue-800 mb-1">기대 효과</p>
                            <p className="text-blue-900 font-medium">{item.expectedImpact}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                리스크 평가 및 관리 방안
              </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {report.riskAssessment.map((item, i) => (
                      <div key={i} className="bg-red-50/50 border border-red-100 p-6 rounded-2xl">
                           <h5 className="font-bold text-red-800 text-lg mb-3 flex items-start gap-2">
                             <span className="text-xl mt-0.5">🚨</span>
                             <span className="leading-tight">{item.risk}</span>
                           </h5>
                          <div className="bg-white/60 p-4 rounded-xl border border-red-100/50 mt-4">
                            <p className="text-sm font-bold text-red-800 mb-1">완화 방안</p>
                            <p className="text-red-900 font-medium leading-relaxed">{item.mitigation}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-brand-primary">AI</span> 기반 재무 분석 및 전략 제안
          </h3>
          <div className="flex items-center p-1.5 bg-surface-subtle rounded-xl mt-4 w-fit border border-border-color/50">
              <button onClick={() => setReportType('summary')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'summary' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>요약 제안</button>
              <button onClick={() => setReportType('deepDive')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'deepDive' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>심층 분석</button>
          </div>
        </div>
        <button
          onClick={() => onGenerate(reportType)}
          disabled={currentStatus.isLoading}
          className="w-full sm:w-auto px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-sm transition-colors duration-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {currentStatus.isLoading ? (
            <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>리포트 생성 중...</span>
            </>
          ) : (
            <>
              {currentReport ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m7 0a9 9 0 11-12.73 0" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              <span>{currentReport ? '재분석' : 'AI 분석 리포트 생성'}</span>
            </>
          )}
        </button>
      </div>

      <div id="ai-report-content-to-export" className="text-text-primary">
          {currentStatus.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl my-6 flex items-center gap-3 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {currentStatus.error}
            </div>
          )}

          {!currentReport && !currentStatus.isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-subtle/30 rounded-3xl border border-border-color/50">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h4 className="text-xl font-bold text-text-primary mb-2">
                {
                   reportType === 'summary' && summaryStatus.isLoading ? 'AI가 요약 리포트를 생성하고 있습니다... 잠시 후 확인해주세요.' :
                   !currentReport ? '버튼을 클릭하여 맞춤형 재무 분석 리포트를 받아보세요.' : ''
                }
              </h4>
              <p className="text-lg text-text-muted font-medium max-w-lg">
                {reportType === 'summary' 
                  ? '데이터를 기반으로 한 경영 및 마케팅 전략을 제안해 드립니다.' 
                  : 'MBA 수준의 전문적인 심층 분석 및 전략을 제안해 드립니다.'}
              </p>
            </div>
          )}
          
          {currentStatus.isLoading && !currentReport && (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-subtle/30 rounded-3xl border border-border-color/50">
               <svg className="animate-spin h-12 w-12 text-brand-primary mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <h4 className="text-xl font-bold text-text-primary mb-2">AI가 리포트를 생성하고 있습니다</h4>
               <p className="text-lg text-text-muted font-medium">이 화면을 벗어나 다른 메뉴를 보셔도 됩니다.</p>
             </div>
          )}

          {reportType === 'summary' && summaryReport && renderSummaryReport(summaryReport)}
          {reportType === 'deepDive' && deepDiveReport && renderDeepDiveReport(deepDiveReport)}
      </div>
    </div>
  );
};

export default AIReportGenerator;