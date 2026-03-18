import React from 'react';

interface Props {
  onStart: () => void;
  hasSavedSession: boolean;
  onRestoreSession?: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart, hasSavedSession, onRestoreSession }) => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-accent selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="material-symbols-outlined text-brand-accent text-3xl">shield_person</span>
            <h2 className="text-brand-primary dark:text-white text-xl font-bold tracking-tight whitespace-nowrap font-serif">사장님 든든</h2>
          </div>
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-10 mx-4">
            <a className="text-text-muted dark:text-slate-300 hover:text-brand-accent text-sm font-medium transition-colors whitespace-nowrap" href="#features">서비스 소개</a>
            <a className="text-text-muted dark:text-slate-300 hover:text-brand-accent text-sm font-medium transition-colors whitespace-nowrap" href="#pricing">요금 안내</a>
          </nav>
          <div className="flex items-center justify-end gap-3 lg:gap-4 flex-shrink-0">
            <button className="hidden sm:block text-text-muted dark:text-slate-300 text-sm font-medium px-4">로그인</button>
            <button 
              onClick={onStart}
              className="bg-brand-accent hover:bg-brand-accent/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-accent/20 whitespace-nowrap"
            >
              무료 시작하기
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden pt-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-accent/10 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <span className="inline-block py-1 px-4 rounded-full bg-brand-accent/20 text-brand-accent text-sm font-bold mb-6">Your Best Business Partner</span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-brand-primary dark:text-white leading-[1.1] lg:leading-[1.1] tracking-tight mb-8 font-serif">
              사장님의 성공적인 비즈니스 여정,<br className="hidden sm:block"/>
              <span className="text-brand-accent">가장 든든한 파트너</span>가 되겠습니다
            </h1>
            <p className="text-text-muted dark:text-slate-400 text-lg md:text-xl font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
              데이터와 AI 기술로 소상공인의 내일을 혁신하는 사장님 든든.<br/>
              창업부터 운영, 권리금 산정까지 숫자로 증명해 드립니다.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto bg-brand-accent text-white font-bold px-10 py-4 rounded-xl text-lg hover:scale-105 transition-transform shadow-xl shadow-brand-accent/30"
              >
                서비스 체험하기
              </button>
              {hasSavedSession && onRestoreSession && (
                <button 
                  onClick={onRestoreSession}
                  className="w-full sm:w-auto border border-brand-primary/20 dark:border-white/20 text-brand-primary dark:text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  이전 분석 불러오기
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Our Value Section */}
        <section id="features" className="py-24 bg-surface-subtle dark:bg-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-brand-accent text-lg font-bold mb-2">Our Value</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-white mb-6 font-serif">데이터로 증명하고<br/>AI로 성장합니다</h3>
                <p className="text-text-muted dark:text-slate-400 text-lg leading-relaxed mb-8">
                  복잡한 데이터 분석부터 리스크 관리까지, AI 기술을 통해 소상공인 사장님들께 실질적인 힘이 되어드리는 것이 우리의 존재 이유입니다. 우리는 단순한 툴을 넘어, 사장님의 곁을 지키는 전문가 그룹이 되고자 합니다.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-text-primary dark:text-slate-200">
                    <span className="material-symbols-outlined text-brand-accent">check_circle</span>
                    실시간 시장 데이터 기반 의사결정 지원
                  </li>
                  <li className="flex items-center gap-3 text-text-primary dark:text-slate-200">
                    <span className="material-symbols-outlined text-brand-accent">check_circle</span>
                    인공지능을 통한 정교한 비용 절감 솔루션
                  </li>
                  <li className="flex items-center gap-3 text-text-primary dark:text-slate-200">
                    <span className="material-symbols-outlined text-brand-accent">check_circle</span>
                    지속 가능한 비즈니스 모델 구축 파트너십
                  </li>
                </ul>
              </div>
              <div className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl">
                <img 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop" 
                  alt="Modern business office"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-accent/10 mix-blend-multiply"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Service Features */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6 text-center mb-16">
            <h2 className="text-brand-accent text-lg font-bold mb-2">Service Features</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-brand-primary dark:text-white font-serif">사장님을 위한 핵심 기능</h3>
          </div>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon="calculate"
              title="창업 계산기"
              description="정교한 시뮬레이션을 통해 초기 리스크를 최소화합니다. 상권 데이터와 예상 매출을 분석하여 최적의 시작을 도와드립니다."
            />
            <FeatureCard 
              icon="analytics"
              title="AI 재무 분석"
              description="복잡한 지출 내역을 지능적으로 분류하고 시각화합니다. 불필요한 비용을 찾아내고 수익성을 극대화하는 인사이트를 제공합니다."
            />
            <FeatureCard 
              icon="verified"
              title="프리미엄 가치 산정"
              description="사장님의 노력이 담긴 매장의 가치를 AI가 객관적으로 평가합니다. 투명한 데이터 기반으로 매장의 권리금을 증명하세요."
            />
            <FeatureCard 
              icon="door_open"
              title="출구 전략 가이드"
              description="폐업이나 전업 고민 시 정부 지원금 매칭 및 따뜻한 상담을 지원합니다. 또 다른 시작을 위한 안전한 마무리를 도와드립니다."
            />
          </div>
        </section>

        {/* Pricing Section (Pay-per-Report) */}
        <section id="pricing" className="py-24 bg-surface-subtle dark:bg-white/5">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-brand-accent text-lg font-bold mb-2">Pricing</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-brand-primary dark:text-white mb-12 font-serif">부담 없는 리포트 중심 요금제</h3>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard 
                title="무료 기본 서비스"
                price="0"
                features={["AI 통장 자동 분류", "기본 재무 대시보드", "창업/폐업 시뮬레이션", "정부 지원금 정보 조회"]}
              />
              <PricingCard 
                title="프리미엄 리포트"
                price="1,000"
                unit="건당"
                highlight
                features={["상세 재무 진단 보고서", "업종 평균 비교 분석", "AI 경영 코칭 액션 아이템", "PDF 다운로드 제공"]}
              />
              <PricingCard 
                title="권리금 인증서"
                price="1,000"
                unit="건당"
                features={["데이터 기반 권리금 산정", "상권 프리미엄 분석", "매각용 공식 증빙 자료", "전문가 검토 가이드"]}
              />
            </div>
          </div>
        </section>

        {/* Closing Section */}
        <section className="py-24 relative overflow-hidden bg-brand-primary">
          <div className="absolute inset-0 bg-brand-accent/10 z-0"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-6 font-serif">사장님의 내일이 오늘보다 더 든든하도록</h3>
            <p className="text-slate-300 text-lg mb-10">
              지금 '사장님 든든'과 함께 스마트한 비즈니스 관리를 시작해보세요.<br className="hidden md:block"/>
              이미 수천 명의 사장님들이 데이터의 힘을 경험하고 있습니다.
            </p>
            <button 
              onClick={onStart}
              className="bg-brand-accent text-white font-bold px-12 py-5 rounded-2xl text-xl hover:bg-brand-accent/90 transition-all shadow-2xl shadow-brand-accent/40"
            >
              지금 바로 시작하기
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f1d] border-t border-white/5 pt-16 pb-8 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-brand-accent text-3xl">shield_person</span>
                <h2 className="text-white text-xl font-bold font-serif">사장님 든든</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                소상공인의 성공을 돕는<br/>AI 비즈니스 데이터 플랫폼
              </p>
            </div>
            <div>
              <h5 className="text-white font-bold mb-6">서비스</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><a className="hover:text-brand-accent transition-colors" href="#">창업 계산기</a></li>
                <li><a className="hover:text-brand-accent transition-colors" href="#">재무 분석 리포트</a></li>
                <li><a className="hover:text-brand-accent transition-colors" href="#">매장 가치 평가</a></li>
                <li><a className="hover:text-brand-accent transition-colors" href="#">폐업 지원 솔루션</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-6">고객센터</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li>자주 묻는 질문</li>
                <li>1:1 문의하기</li>
                <li>공지사항</li>
                <li>제휴 문의</li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-bold mb-6">법적 고지</h5>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li>이용약관</li>
                <li>개인정보처리방침</li>
                <li>사업자 정보 확인</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <p>© 2024 사장님든든 (Sajangnim Deundeun) Co., Ltd. All Rights Reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
              <span className="hover:text-white cursor-pointer transition-colors">Blog</span>
              <span className="hover:text-white cursor-pointer transition-colors">YouTube</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 rounded-3xl hover:border-brand-accent/50 transition-all group">
    <div className="bg-brand-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-accent transition-colors">
      <span className="material-symbols-outlined text-brand-accent text-3xl group-hover:text-white">{icon}</span>
    </div>
    <h4 className="text-xl font-bold text-brand-primary dark:text-white mb-4 font-serif">{title}</h4>
    <p className="text-text-muted dark:text-slate-400 text-sm leading-relaxed">
      {description}
    </p>
  </div>
);

const PricingCard: React.FC<{ title: string; price: string; unit?: string; features: string[]; highlight?: boolean }> = ({ title, price, unit = "월", features, highlight }) => (
  <div className={`p-8 rounded-3xl border transition-all ${highlight ? 'bg-brand-primary text-white border-brand-accent shadow-2xl scale-105 z-10' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-brand-primary dark:text-white'}`}>
    <h4 className={`text-xl font-bold mb-4 font-serif ${highlight ? 'text-brand-accent' : ''}`}>{title}</h4>
    <div className="mb-8">
      <span className="text-4xl font-black">₩{price}</span>
      <span className={`text-sm ml-1 ${highlight ? 'text-slate-400' : 'text-text-muted'}`}>/{unit}</span>
    </div>
    <ul className="space-y-4 text-left mb-8">
      {features.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-brand-accent text-lg">check</span>
          <span className={highlight ? 'text-slate-300' : 'text-text-muted'}>{f}</span>
        </li>
      ))}
    </ul>
    <button className={`w-full py-3 rounded-xl font-bold transition-all ${highlight ? 'bg-brand-accent text-white hover:bg-brand-accent/90' : 'bg-surface-subtle dark:bg-white/10 text-brand-primary dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
      시작하기
    </button>
  </div>
);

export default IntroScreen;
