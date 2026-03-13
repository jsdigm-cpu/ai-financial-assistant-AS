import React from 'react';

interface Props {
  onStart: () => void;
  hasSavedSession: boolean;
  onRestoreSession?: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart, hasSavedSession, onRestoreSession }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Content Pane */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 z-10">
        <div className="max-w-xl mx-auto md:mx-0 w-full">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-2xl shadow-lg mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 8l3 5m0 0l3-5m-3 5v4m0-4h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-text-primary mb-6 tracking-tight leading-tight">
            복잡한 통장정리,<br />
            <span className="text-brand-accent">AI가 알아서.</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-text-muted leading-relaxed mb-10">
            은행 입출금 내역 파일만 올리세요. AI가 수입과 지출을 자동으로 분류하고, 한눈에 들어오는 재무 대시보드를 만들어 드립니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold text-lg rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              무료로 시작하기
            </button>
            {hasSavedSession && onRestoreSession && (
              <button
                onClick={onRestoreSession}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-surface-subtle text-brand-primary font-semibold text-lg rounded-xl border border-border-color shadow-sm transition-all"
              >
                이전 분석 이어하기
              </button>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-6">
            <FeatureItem 
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="엑셀/CSV 파일 지원"
              description="은행에서 다운로드한 내역을 그대로 업로드하세요."
            />
            <FeatureItem 
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="스마트 자동 분류"
              description="AI가 거래처명과 금액을 분석해 카테고리를 자동 지정합니다."
            />
            <FeatureItem 
              icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}
              title="직관적인 대시보드"
              description="수입/지출 추이와 비용 구조를 차트로 한눈에 확인하세요."
            />
          </div>
          
          <div className="mt-12 pt-8 border-t border-border-color">
            <p className="text-sm text-text-muted">
              Google Gemini AI 기반 · 데이터는 브라우저에만 저장됩니다 (서버 전송 없음)
            </p>
          </div>
        </div>
      </div>

      {/* Right Image Pane */}
      <div className="hidden md:block md:w-1/2 relative bg-surface-subtle overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2000&auto=format&fit=crop" 
          alt="Financial Dashboard" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Overlay gradient for better blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent"></div>
        
        {/* Floating UI Element to show it's an app */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-text-muted font-medium mb-1">이번 달 순이익</p>
                <h3 className="text-3xl font-bold text-text-primary">₩ 4,130,000</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-3/4 rounded-full"></div>
              </div>
              <div className="flex justify-between text-xs text-text-muted font-medium">
                <span>수입 달성률</span>
                <span>75%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-12 h-12 bg-surface-subtle rounded-xl flex items-center justify-center text-brand-primary">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  </div>
);

export default IntroScreen;
