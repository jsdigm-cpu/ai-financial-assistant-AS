import React, { useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { AppPhase } from '../App';

interface Props {
  onNavigate: (phase: AppPhase) => void;
  hasSavedSession: boolean;
  onRestoreSession?: () => void;
}

const IntroScreen: React.FC<Props> = ({ onNavigate, hasSavedSession, onRestoreSession }) => {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      alert('결제가 완료되었습니다! 프리미엄 리포트를 이용하실 수 있습니다.');
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (query.get('canceled')) {
      alert('결제가 취소되었습니다.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handlePurchase = async (type: 'premium' | 'certificate', price: number) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: type, price }),
      });
      
      const session = await response.json();
      if (session.error) {
        alert('결제 준비 중 오류가 발생했습니다: ' + session.error);
        return;
      }

      const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!stripePublicKey) {
        alert('Stripe 공개 키가 설정되지 않았습니다. (.env 파일을 확인해주세요)');
        return;
      }

      const stripe = await loadStripe(stripePublicKey);
      if (stripe) {
        await (stripe as any).redirectToCheckout({ sessionId: session.id });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#e9572b] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md px-6 lg:px-40 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#e9572b] flex-shrink-0">
            <div className="size-8 bg-[#e9572b]/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[#e9572b]">storefront</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold tracking-tight whitespace-nowrap">사장님 든든</h2>
          </div>
          <nav className="hidden md:flex flex-1 justify-center items-center gap-8 mx-4">
            <a className="text-slate-600 dark:text-slate-400 hover:text-[#e9572b] text-sm font-semibold transition-colors whitespace-nowrap" href="#features">서비스 소개</a>
            <button onClick={() => onNavigate('plan')} className="text-slate-600 dark:text-slate-400 hover:text-[#e9572b] text-sm font-semibold transition-colors whitespace-nowrap">창업 계산기</button>
            <button onClick={() => onNavigate('operate_setup')} className="text-slate-600 dark:text-slate-400 hover:text-[#e9572b] text-sm font-semibold transition-colors whitespace-nowrap">AI 재무 분석</button>
            <button onClick={() => onNavigate('value')} className="text-slate-600 dark:text-slate-400 hover:text-[#e9572b] text-sm font-semibold transition-colors whitespace-nowrap">권리금 산정</button>
          </nav>
          <div className="flex items-center justify-end gap-3 flex-shrink-0 w-48">
            <button className="hidden sm:block text-slate-600 dark:text-slate-400 text-sm font-bold px-4 hover:text-slate-900 dark:hover:text-white transition-colors">로그인</button>
            <button 
              onClick={() => onNavigate('operate_setup')}
              className="bg-[#e9572b] hover:bg-[#e9572b]/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#e9572b]/20 whitespace-nowrap"
            >
              무료 시작하기
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#e9572b]/5 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <span className="inline-block py-1 px-4 rounded-full bg-[#e9572b]/10 text-[#e9572b] text-sm font-bold mb-6 border border-[#e9572b]/20">데이터 코칭 플랫폼</span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.2] lg:leading-[1.2] tracking-tight mb-8 break-keep">
              사장님의 성공적인 비즈니스 여정,<br className="hidden sm:block"/>
              <span className="text-[#e9572b]">가장 든든한 파트너</span>가 되겠습니다
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-normal leading-relaxed mb-10 max-w-2xl mx-auto break-keep">
              막막한 창업부터, 똑똑한 운영, 객관적인 권리금 산정과 전략적 폐업까지.<br/>
              모든 단계를 AI와 데이터로 증명하여 사장님을 지켜드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('operate_setup')}
                className="w-full sm:w-auto bg-[#e9572b] text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-[#e9572b]/90 hover:scale-105 transition-all shadow-xl shadow-[#e9572b]/30"
              >
                AI 재무 분석 시작하기
              </button>
              {hasSavedSession && onRestoreSession && (
                <button 
                  onClick={onRestoreSession}
                  className="w-full sm:w-auto bg-white dark:bg-slate-800 border-2 border-[#e9572b]/20 text-[#e9572b] dark:text-[#e9572b] font-bold px-10 py-4 rounded-xl text-lg hover:bg-[#e9572b]/5 transition-all shadow-sm"
                >
                  이전 분석 불러오기
                </button>
              )}
            </div>
            {/* Quick Links */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm">
                <button onClick={() => onNavigate('plan')} className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 transition-colors">창업 비용 계산해보기</button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button onClick={() => onNavigate('value')} className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 transition-colors">권리금 알아보기</button>
            </div>
          </div>
        </section>

        {/* Detailed Service Features (The 4 Pillars) */}
        <section id="features" className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[#e9572b] font-bold text-sm tracking-widest uppercase mb-2 block">4-Step Life Cycle</span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white break-keep">사장님을 위한 필수 4대 핵심 기능</h2>
              <p className="mt-4 text-slate-500 text-lg">복잡한 엑셀 업로드 없이 지금 바로 꼭 필요한 기능만 활용해 보세요.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                icon="edit_note"
                step="Plan"
                title="스마트 창업 설계"
                description="시작이 반입니다. 초기 투자비용과 고정 지출을 시뮬레이션하여 예상 손익분기점과 원금 회수 기간을 한눈에 확인하세요."
                actionText="창업 계산기 바로가기"
                onAction={() => onNavigate('plan')}
              />
              <FeatureCard 
                icon="analytics"
                step="Operate"
                title="AI 실시간 경영"
                description="복잡한 통장 내역 엑셀 파일을 업로드하면, AI가 자동으로 재무 상태를 분석하고 절세 및 운영 꿀팁을 제공합니다."
                actionText="재무 분석 시작하기"
                onAction={() => onNavigate('operate_setup')}
                highlight
              />
              <FeatureCard 
                icon="trending_up"
                step="Value"
                title="데이터 기반 가치 평가"
                description="매장의 현재 자산과 AI가 예측한 기대 수익성을 종합하여, 권리금을 얼마나 받을 수 있는지 객관적으로 산출합니다."
                actionText="권리금 계산기 바로가기"
                onAction={() => onNavigate('value')}
              />
              <FeatureCard 
                icon="exit_to_app"
                step="Exit"
                title="전략적 마무리지원"
                description="아쉬운 폐업의 순간, 위약금과 철거비 등을 감안한 실 손실을 파악하고 맞춤형 정부 지원금을 매칭해 드립니다."
                actionText="폐업 계산기 바로가기"
                onAction={() => onNavigate('exit')}
              />
            </div>
          </div>
        </section>

        {/* Pricing Section (Pay-per-Report) */}
        <section id="pricing" className="py-24 bg-[#f8f6f6] dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <span className="text-[#e9572b] font-bold text-sm tracking-widest uppercase mb-2 block">Pricing</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 break-keep">부담 없는 리포트 전용 요금제</h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
              <PricingCard 
                title="무료 기본 서비스"
                price="0"
                features={["4대 핵심 계산기 전면 무료", "AI 재무 내역 자동 분류", "기본 대시보드 무제한 조회", "정부 지원금 맞춤형 매칭"]}
                onAction={() => onNavigate('operate_setup')}
              />
              <PricingCard 
                title="프리미엄 리포트"
                price="1,000"
                unit="건당"
                highlight
                features={["상세 재무 진단 PDF 보고서", "업종 평균 대비 정밀 분석", "AI 경영 코칭 3대 액션 아이템", "은행 제출용 증빙 자료"]}
                onAction={() => handlePurchase('premium', 1000)}
                actionText="결제하고 다운로드"
              />
              <PricingCard 
                title="권리금 공식 인증서"
                price="1,000"
                unit="건당"
                features={["데이터 기반 권리금 검증 보고서", "프리미엄 상권 빅데이터 분석", "매각/양도용 객관적 증빙 자료", "양도 소득세 절세 가이드"]}
                onAction={() => handlePurchase('certificate', 1000)}
                actionText="결제하고 다운로드"
              />
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="py-24 relative overflow-hidden bg-slate-900 border-y border-[#d4af37]/30">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 z-0"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#d4af37] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">Partnership</span>
              <h4 className="text-[#d4af37] font-bold text-sm tracking-widest uppercase">매장 에너지 절감 혜택</h4>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white mb-6 break-keep">노후된 매장 설비 교체하고 가치 UP!</h3>
            <p className="text-slate-300 text-lg mb-10 break-keep">
              사장님 든든 회원 전용. 친환경 고효율 설비(냉난방기 등)로 교체 시,<br className="hidden md:block"/>
              최대 30% 지원금을 받고 권리금 평가 시 인테리어 감가상각을 방어하세요.
            </p>
            <button 
              onClick={() => { alert('제휴 준비 중인 서비스입니다.'); }}
              className="bg-[#d4af37] text-slate-900 font-black px-12 py-5 rounded-2xl text-lg hover:bg-[#c19b2e] active:scale-95 transition-all shadow-xl shadow-[#d4af37]/20"
            >
              제휴 혜택 상담 신청
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 px-6 lg:px-40">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[#e9572b] text-3xl">storefront</span>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold">사장님 든든</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                자영업자의 가장 든든한 파트너.<br/>
                창업, 운영, 평가, 정리까지 데이터를 통해 당신의 경영을 증명해 드립니다.
              </p>
            </div>
            <div>
              <h5 className="text-slate-900 dark:text-white font-bold mb-6">핵심 서비스</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => onNavigate('plan')} className="hover:text-[#e9572b] transition-colors">스마트 창업 설계</button></li>
                <li><button onClick={() => onNavigate('operate_setup')} className="hover:text-[#e9572b] transition-colors">AI 실시간 재무 경영</button></li>
                <li><button onClick={() => onNavigate('value')} className="hover:text-[#e9572b] transition-colors">빅데이터 권리금 평가</button></li>
                <li><button onClick={() => onNavigate('exit')} className="hover:text-[#e9572b] transition-colors">폐업 지원금 매칭 솔루션</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-slate-900 dark:text-white font-bold mb-6">고객센터</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">자주 묻는 질문</a></li>
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">1:1 문의하기</a></li>
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">공지사항</a></li>
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">전문가 제휴(세무/노무)</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-slate-900 dark:text-white font-bold mb-6">법적 고지</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">이용약관</a></li>
                <li><a href="#" className="font-bold text-slate-700 dark:text-slate-300 hover:text-[#e9572b] transition-colors">개인정보처리방침</a></li>
                <li><a href="#" className="hover:text-[#e9572b] transition-colors">사업자 정보 확인</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
            <p>© 2024 DEUNDEUN Co., Ltd. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; step: string; title: string; description: string; actionText: string; onAction: () => void; highlight?: boolean }> = ({ icon, step, title, description, actionText, onAction, highlight }) => (
  <div className={`flex flex-col h-full bg-white dark:bg-slate-800 border p-8 rounded-3xl transition-all group ${highlight ? 'border-[#e9572b] shadow-xl shadow-[#e9572b]/10 scale-105 z-10' : 'border-slate-200 dark:border-slate-700 hover:border-[#e9572b]/50'}`}>
    <span className={`text-[10px] font-black uppercase tracking-widest mb-4 inline-block px-2 py-1 rounded w-max ${highlight ? 'bg-[#e9572b]/10 text-[#e9572b]' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{step}</span>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${highlight ? 'bg-[#e9572b] text-white' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 group-hover:bg-[#e9572b]/10 group-hover:text-[#e9572b]'}`}>
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 break-keep">{title}</h4>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed break-keep mb-8 grow">
      {description}
    </p>
    <button onClick={onAction} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${highlight ? 'bg-[#e9572b] text-white hover:bg-[#c6441e]' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
        {actionText}
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </button>
  </div>
);

const PricingCard: React.FC<{ title: string; price: string; unit?: string; features: string[]; highlight?: boolean; onAction?: () => void; actionText?: string }> = ({ title, price, unit = "월", features, highlight, onAction, actionText = "지금 시작하기" }) => (
  <div className={`p-8 rounded-3xl border transition-all flex flex-col ${highlight ? 'bg-slate-900 dark:bg-slate-800 text-white border-[#e9572b] shadow-2xl scale-105 z-10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}>
    <h4 className={`text-xl font-bold mb-4 break-keep ${highlight ? 'text-[#e9572b]' : ''}`}>{title}</h4>
    <div className="mb-8 border-b border-black/5 dark:border-white/10 pb-8">
      <span className="text-4xl font-black">₩{price}</span>
      <span className={`text-sm ml-1 ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>/{unit}</span>
    </div>
    <ul className="space-y-4 text-left mb-8 grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className={`material-symbols-outlined text-lg flex-shrink-0 ${highlight ? 'text-[#e9572b]' : 'text-emerald-500'}`}>check_circle</span>
          <span className={`break-keep leading-relaxed ${highlight ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>{f}</span>
        </li>
      ))}
    </ul>
    <button onClick={onAction} className={`w-full py-4 rounded-xl font-bold transition-all break-keep text-sm ${highlight ? 'bg-[#e9572b] text-white hover:bg-[#c6441e]' : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'}`}>
      {actionText}
    </button>
  </div>
);

export default IntroScreen;
