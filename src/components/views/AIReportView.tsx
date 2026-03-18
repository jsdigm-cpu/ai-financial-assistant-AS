import React from 'react';
import { Transaction, BusinessInfo, AIReport, DeepDiveAIReport, LocationAnalysisReport } from '../../types';
import AIReportGenerator from '../AIReportGenerator';
import LocationAnalysisGenerator from '../LocationAnalysisGenerator';

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
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">analytics</span>
          AI 경영 분석 리포트
        </h3>
        <AIReportGenerator 
          transactions={transactions}
          businessInfo={businessInfo}
          summaryReport={reports.summary}
          deepDiveReport={reports.deepDive}
          summaryStatus={reportStatus.summary}
          deepDiveStatus={reportStatus.deepDive}
          onGenerate={onGenerateFinancialReport}
        />
      </div>

      {businessInfo.address && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">location_on</span>
            AI 상권 분석 리포트
          </h3>
          <LocationAnalysisGenerator 
            businessInfo={businessInfo}
            report={reports.location}
            status={reportStatus.location}
            onGenerate={onGenerateLocationReport}
          />
        </div>
      )}
    </div>
  );
};

export default AIReportView;
