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
import {
  getPendingPdf,
  savePaidToken,
  confirmTossPayment,
  PendingPdf,
} from './hooks/usePaymentGate';

export type AppPhase = 'intro' | 'plan' | 'operate_setup' | 'operate_main' | 'value' | 'exit';

const SESSION_KEY = 'ai_tongjang_last_session';

interface SavedSession {
  businessInfo: BusinessInfo;
  uploadedFiles: UploadedFileInfo[];
  transactions: any[];
  savedAt: string;
}

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

function restoreTransactionDates(transactions: any[]): any[] {
  return transactions.map(t => ({ ...t, date: new Date(t.date) }));
}

// ─── 토스 결제 리다이렉트 파라미터 파싱 ─────────────────────────
interface TossReturnParams {
  payment: 'success' | 'fail' | null;
  paymentKey: string | null;
  orderId: string | null;
  amount: number | null;
}

function parseTossReturnParams(): TossReturnParams {
  const params = new URLSearchParams(window.location.search);
  return {
    payment:    (params.get('payment') as 'success' | 'fail' | null),
    paymentKey: params.get('paymentKey'),
    orderId:    params.get('orderId'),
    amount:     params.get('amount') ? Number(params.get('amount')) : null,
  };
}

function clearUrlParams() {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, '', url.toString());
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('intro');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | { name: string; owner: string }>({ name: '임시 상호', owner: '사장님' });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[] | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  // 결제 후 PDF 자동 다운로드 트리거
  const [pendingPdfDownload, setPendingPdfDownload] = useState<PendingPdf | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'confirming' | 'success' | 'fail'>('idle');

  const [previousState, setPreviousState] = useState<{
    processedData: ProcessedData | null;
    businessInfo: BusinessInfo | null;
    uploadedFiles: UploadedFileInfo[] | null;
  } | null>(null);

  // ── 앱 초기화: 세션 복원 + 토스 결제 리다이렉트 처리 ──────────
  useEffect(() => {
    const session = getSavedSession();
    if (session) {
      setSavedSession(session);
      setBusinessInfo(session.businessInfo);
    }

    const tossParams = parseTossReturnParams();
    if (tossParams.payment === 'success' && tossParams.paymentKey && tossParams.orderId && tossParams.amount) {
      clearUrlParams();
      handleTossSuccess(tossParams.paymentKey, tossParams.orderId, tossParams.amount);
    } else if (tossParams.payment === 'fail') {
      clearUrlParams();
      setPaymentStatus('fail');
      // 3초 후 초기화
      setTimeout(() => setPaymentStatus('idle'), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTossSuccess = async (paymentKey: string, orderId: string, amount: number) => {
    setPaymentStatus('confirming');
    const ok = await confirmTossPayment(paymentKey, orderId, amount);
    if (ok) {
      savePaidToken(orderId);
      const pending = getPendingPdf();
      setPaymentStatus('success');
      setPendingPdfDownload(pending);

      // 이전 화면으로 복원
      const session = getSavedSession();
      if (session) {
        const restoredTxs = restoreTransactionDates(session.transactions);
        const userKey = `financial_dashboard_user_${session.businessInfo.name}_${session.businessInfo.owner}`;
        if ((session as any).categories) {
          localStorage.setItem(userKey, JSON.stringify({
            categories: (session as any).categories,
            categoryRules: (session as any).categoryRules || [],
          }));
        }
        setProcessedData({ transactions: restoredTxs, errors: [] });
        setBusinessInfo(session.businessInfo);
        setUploadedFiles(session.uploadedFiles);
        setPhase('operate_main');
      }
      setTimeout(() => setPaymentStatus('idle'), 3000);
    } else {
      setPaymentStatus('fail');
      setTimeout(() => setPaymentStatus('idle'), 4000);
    }
  };

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
    setProcessedData({ transactions: restoredTransactions, errors: [] });
    setBusinessInfo(savedSession.businessInfo);
    setUploadedFiles(savedSession.uploadedFiles);
    setSavedSession(null);
    setPhase('operate_main');
  }, [savedSession]);

  const handleImportSession = useCallback((data: SavedSession) => {
    const restoredTransactions = restoreTransactionDates(data.transactions);
    if ((data as any).categories) {
      const userKey = `financial_dashboard_user_${data.businessInfo.name}_${data.businessInfo.owner}`;
      localStorage.setItem(userKey, JSON.stringify({
        categories: (data as any).categories,
        categoryRules: (data as any).categoryRules || [],
      }));
    }
    setProcessedData({ transactions: restoredTransactions, errors: [] });
    setBusinessInfo(data.businessInfo);
    setUploadedFiles(data.uploadedFiles);
    setSavedSession(null);
    setPhase('operate_main');
  }, []);

  const handleReset = useCallback(() => {
    setPreviousState({ processedData, businessInfo: businessInfo as BusinessInfo, uploadedFiles });
    setProcessedData(null);
    setBusinessInfo({ name: '임시 상호', owner: '사장님' });
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
              pendingPdfDownload={pendingPdfDownload}
              onPdfDownloadConsumed={() => setPendingPdfDownload(null)}
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
              pendingPdfDownload={pendingPdfDownload}
              onPdfDownloadConsumed={() => setPendingPdfDownload(null)}
            />
          </ServiceLayout>
        );

      case 'exit':
        return (
          <ServiceLayout activeTab="exit" onNavigate={handleNavigate}>
            <ExitView
              businessInfo={businessInfo as BusinessInfo}
              transactions={processedData?.transactions || []}
              pendingPdfDownload={pendingPdfDownload}
              onPdfDownloadConsumed={() => setPendingPdfDownload(null)}
            />
          </ServiceLayout>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background-main font-sans">
      {/* 결제 상태 토스트 */}
      {paymentStatus === 'confirming' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-xl border border-border-color">
          <svg className="animate-spin h-5 w-5 text-brand-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-bold text-text-primary">결제 확인 중...</span>
        </div>
      )}
      {paymentStatus === 'success' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-bold">결제 완료! PDF 다운로드 준비 중...</span>
        </div>
      )}
      {paymentStatus === 'fail' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-2xl shadow-xl">
          <span className="material-symbols-outlined">error</span>
          <span className="font-bold">결제가 취소되었거나 실패했습니다.</span>
        </div>
      )}
      {renderPhase()}
    </div>
  );
};

export default App;
