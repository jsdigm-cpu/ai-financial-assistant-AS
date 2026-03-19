import React, { useState, useCallback, useEffect } from 'react';
import { ProcessedData, UploadedFileInfo } from './types';
import IntroScreen from './components/IntroScreen';
import SetupScreen from './components/SetupScreen';
import MainLayout from './components/MainLayout';
import ServiceLayout from './components/ServiceLayout';
import PlanView from './components/views/PlanView';
import ValueView from './components/views/ValueView';
import ExitView from './components/views/ExitView';
import { BusinessInfo } from './types';

export type AppPhase = 'intro' | 'plan' | 'operate_setup' | 'operate_main' | 'value' | 'exit';

// ============================================================
// 세션 저장/복원 키 및 유틸리티
// ============================================================
const SESSION_KEY = 'ai_tongjang_last_session';

interface SavedSession {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
  transactions: any[]; // Date가 string으로 직렬화됨
  savedAt: string;
}

// localStorage에서 저장된 세션 확인
function getSavedSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SavedSession;
    if (!session.businessInfo || !session.transactions || session.transactions.length === 0) return null;
    return session;
  } catch {
    return null;
  }
}

// 거래 데이터의 date 필드를 Date 객체로 복원
function restoreTransactionDates(transactions: any[]): any[] {
  return transactions.map(t => ({
    ...t,
    date: new Date(t.date),
  }));
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('intro');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | {name: string, owner: string}>({name: '임시 상호', owner: '사장님'}); // For views that don't need full setup
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[] | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const [previousState, setPreviousState] = useState<{
    processedData: ProcessedData | null;
    businessInfo: BusinessInfo | null;
    uploadedFiles: UploadedFileInfo[] | null;
  } | null>(null);

  // 앱 시작 시 저장된 세션 확인
  useEffect(() => {
    const session = getSavedSession();
    if (session) {
      setSavedSession(session);
      // 만약 Operate로 바로 진입할 수 있도록 비즈니스 정보를 미리 세팅해둘 수 있음
      setBusinessInfo(session.businessInfo);
    }
  }, []);

  const handleNavigate = useCallback((newPhase: AppPhase) => {
    if (newPhase === 'operate_setup' && processedData && businessInfo && uploadedFiles && 'type' in businessInfo) {
      setPhase('operate_main');
    } else {
      setPhase(newPhase);
    }
  }, [processedData, businessInfo, uploadedFiles]);

  const handleDataProcessed = useCallback((data: ProcessedData, info: BusinessInfo, files: UploadedFileInfo[]) => {
    setProcessedData(data);
    setBusinessInfo(info);
    setUploadedFiles(files);
    setPreviousState(null);
    setSavedSession(null);
    setPhase('operate_main');
  }, []);

  // 이전 분석 불러오기
  const handleRestoreSession = useCallback(() => {
    if (!savedSession) return;
    const restoredTransactions = restoreTransactionDates(savedSession.transactions);

    if ((savedSession as any).categories) {
      const userKey = `financial_dashboard_user_${savedSession.businessInfo.name}_${savedSession.businessInfo.owner}`;
      localStorage.setItem(userKey, JSON.stringify({
        categories: (savedSession as any).categories,
        categoryRules: (savedSession as any).categoryRules || [],
      }));
    }

    setProcessedData({
      transactions: restoredTransactions,
      errors: [],
    });
    setBusinessInfo(savedSession.businessInfo);
    setUploadedFiles(savedSession.uploadedFiles);
    setSavedSession(null);
    setPhase('operate_main');
  }, [savedSession]);

  // JSON 파일에서 분석 데이터 불러오기
  const handleImportSession = useCallback((data: SavedSession) => {
    const restoredTransactions = restoreTransactionDates(data.transactions);
    
    if ((data as any).categories) {
      const userKey = `financial_dashboard_user_${data.businessInfo.name}_${data.businessInfo.owner}`;
      localStorage.setItem(userKey, JSON.stringify({
        categories: (data as any).categories,
        categoryRules: (data as any).categoryRules || [],
      }));
    }
    
    setProcessedData({
      transactions: restoredTransactions,
      errors: [],
    });
    setBusinessInfo(data.businessInfo);
    setUploadedFiles(data.uploadedFiles);
    setSavedSession(null);
    setPhase('operate_main');
  }, []);
  
  const handleReset = useCallback(() => {
    setPreviousState({ processedData, businessInfo: businessInfo as BusinessInfo, uploadedFiles });
    setProcessedData(null);
    setBusinessInfo({name: '임시 상호', owner: '사장님'});
    setUploadedFiles(null);
    setPhase('intro');
    const session = getSavedSession();
    if (session) setSavedSession(session);
  }, [processedData, businessInfo, uploadedFiles]);

  const handleGoBack = useCallback(() => {
    if (previousState) {
      setProcessedData(previousState.processedData);
      setBusinessInfo(previousState.businessInfo!);
      setUploadedFiles(previousState.uploadedFiles);
      setPreviousState(null);
      setPhase('operate_main');
    } else {
      setPhase('intro');
    }
  }, [previousState]);

  const renderPhase = () => {
    switch (phase) {
      case 'intro':
        return (
          <IntroScreen
            onNavigate={handleNavigate}
            hasSavedSession={!!savedSession}
            onRestoreSession={handleRestoreSession}
          />
        );
      
      case 'operate_setup':
        return (
          <ServiceLayout activeTab="operate" onNavigate={handleNavigate}>
            <SetupScreen
              onDataProcessed={handleDataProcessed}
              onGoBack={handleGoBack}
              savedSession={savedSession}
              onRestoreSession={handleRestoreSession}
              onImportSession={handleImportSession}
            />
          </ServiceLayout>
        );

      case 'operate_main':
        if (processedData && businessInfo && uploadedFiles && 'type' in businessInfo) {
          return (
            <MainLayout
              initialData={processedData}
              businessInfo={businessInfo as BusinessInfo}
              uploadedFiles={uploadedFiles}
              onReset={handleReset}
              activeTab="operate"
              setActiveTab={(tab) => {
                if (tab === 'operate') return;
                setPhase(tab === 'plan' ? 'plan' : tab === 'value' ? 'value' : 'exit');
              }}
            />
          );
        }
        setPhase('operate_setup');
        return null;

      case 'plan':
        return (
          <ServiceLayout activeTab="plan" onNavigate={handleNavigate}>
            <PlanView />
          </ServiceLayout>
        );

      case 'value':
        return (
          <ServiceLayout activeTab="value" onNavigate={handleNavigate}>
            <ValueView 
                transactions={processedData?.transactions || []} 
                businessInfo={businessInfo as BusinessInfo} 
            />
          </ServiceLayout>
        );

      case 'exit':
        return (
          <ServiceLayout activeTab="exit" onNavigate={handleNavigate}>
            <ExitView businessInfo={businessInfo as BusinessInfo} />
          </ServiceLayout>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-main font-sans">
      {renderPhase()}
    </div>
  );
};

export default App;
