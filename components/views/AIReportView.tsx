import React, { useState } from 'react';
import { Transaction, BusinessInfo, AIReport, DeepDiveAIReport, LocationAnalysisReport } from '../../types';
import AIReportGenerator from '../AIReportGenerator';
import LocationAnalysisGenerator from '../LocationAnalysisGenerator';
import { exportAIReportToPdf } from '../../services/pdfExporter';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  reports: {
    summary: AIReport | null;
    deepDive: DeepDiveAIReport | null;
    location: LocationAnalysisReport | null;
  };
  reportStatus: {
    summary: { isLoading: boolean; error: string | null };
    deepDive: { isLoading: boolean; error: string | null };
    location: { isLoading: boolean; error: string | null };
  };
  onGenerateFinancialReport: (type: 'summary' | 'deepDive') => void;
  onGenerateLocationReport: () => void;
}

const AIReportView: React.FC<Props> = ({ 
  transactions, 
  businessInfo, 
  reports, 
  reportStatus, 
  onGenerateFinancialReport, 
  onGenerateLocationReport 
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'location'>('financial');

  const handleExport = () => {
    if (activeTab !== 'financial') return;
    
    const reportElement = document.getElementById('ai-report-content-to-export');
    if (reportElement) {
        exportAIReportToPdf(reportElement, businessInfo, `${businessInfo.name}_ai_report_${new Date().toISOString().slice(0,10)}`);
    } else {
        alert("리포트 내용을 찾을 수 없습니다. 먼저 리포트를 생성해주세요.");
    }
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto">
       <div className="relative p-6 md:p-8 rounded-3xl shadow-sm border border-border-color overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop" 
            alt="AI Report Background" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                AI 분석 및 제안
              </h2>
              <p className="mt-3 text-lg text-text-muted font-medium">
                {activeTab === 'financial'
                  ? 'AI가 우리 사업의 돈 흐름을 종합적으로 분석해서, 잘하고 있는 점과 개선할 점을 알려주고 매출을 올릴 수 있는 구체적인 방법을 제안합니다. "리포트 생성" 버튼을 누르면 분석이 시작됩니다.'
                  : 'AI가 사업장 주변 상권과 경쟁 상황을 분석해서, 우리 가게에 맞는 영업/마케팅 전략을 제안합니다. 사업장 주소를 입력했을 때만 사용할 수 있습니다.'
                }
              </p>
            </div>
              <button 
                  onClick={handleExport}
                  disabled={activeTab !== 'financial'}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-secondary transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                  title={activeTab !== 'financial' ? '재무 분석 리포트만 PDF로 다운로드할 수 있습니다.' : 'PDF 다운로드'}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF 다운로드
              </button>
          </div>
       </div>

      <div className="flex items-center p-1.5 bg-white rounded-2xl w-fit border border-border-color shadow-sm">
          <button onClick={() => setActiveTab('financial')} className={`px-6 py-2.5 text-base font-bold rounded-xl transition-all ${activeTab === 'financial' ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'}`}>재무 분석</button>
          <button onClick={() => setActiveTab('location')} className={`px-6 py-2.5 text-base font-bold rounded-xl transition-all ${activeTab === 'location' ? 'bg-brand-primary/10 text-brand-primary' : 'text-text-muted hover:text-text-primary hover:bg-surface-subtle'}`}>상권 분석 및 마케팅</button>
      </div>

      <div>
        {activeTab === 'financial' && (
          <AIReportGenerator 
            transactions={transactions} 
            businessInfo={businessInfo}
            summaryReport={reports.summary}
            deepDiveReport={reports.deepDive}
            summaryStatus={reportStatus.summary}
            deepDiveStatus={reportStatus.deepDive}
            onGenerate={onGenerateFinancialReport}
          />
        )}
        {activeTab === 'location' && (
          // FIX: Removed the 'transactions' prop from the LocationAnalysisGenerator component call, as it is not an expected prop and caused a TypeScript error.
          <LocationAnalysisGenerator
            businessInfo={businessInfo}
            report={reports.location}
            status={reportStatus.location}
            onGenerate={onGenerateLocationReport}
          />
        )}
      </div>
    </div>
  );
};

export default AIReportView;