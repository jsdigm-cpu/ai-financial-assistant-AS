import React from 'react';

const pillarItems = [
  { id: 'plan', label: '스마트 창업 설계', icon: 'edit_note' },
  { id: 'operate', label: 'AI 실시간 경영', icon: 'analytics' },
  { id: 'value', label: '데이터 기반 가치 평가', icon: 'trending_up' },
  { id: 'exit', label: '전략적 마무리지원', icon: 'exit_to_app' },
];

type AppPhase = 'intro' | 'plan' | 'operate_setup' | 'operate_main' | 'value' | 'exit';

interface Props {
  activeTab: 'plan' | 'operate' | 'value' | 'exit';
  onNavigate: (phase: AppPhase) => void;
  children: React.ReactNode;
}

const ServiceLayout: React.FC<Props> = ({ activeTab, onNavigate, children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-slate-900 font-sans">
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-border-color dark:border-slate-700 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shrink-0 sticky top-0">
        <button onClick={() => onNavigate('intro')} className="flex items-center space-x-3 group cursor-pointer text-left focus:outline-none shrink-0 w-[180px]">
          <div className="relative p-2.5 bg-gradient-to-br from-brand-primary to-orange-500 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
            <span className="material-symbols-outlined text-white block">storefront</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-primary tracking-wider uppercase">메인으로</span>
            <span className="text-lg font-bold text-text-primary dark:text-white leading-tight font-serif min-w-max">사장님 든든</span>
          </div>
        </button>

        <div className="flex items-center space-x-1 bg-surface-subtle dark:bg-slate-900 p-1 rounded-2xl border border-border-color dark:border-slate-700 overflow-x-auto max-w-full">
          {pillarItems.map(pillar => (
            <button
              key={pillar.id}
              onClick={() => {
                if (pillar.id === 'operate') {
                  onNavigate('operate_setup');
                } else {
                  onNavigate(pillar.id as AppPhase);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                activeTab === pillar.id 
                ? 'bg-white dark:bg-slate-800 text-brand-primary shadow-sm border border-border-color/50 dark:border-slate-600' 
                : 'text-text-muted dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-text-primary dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{pillar.icon}</span>
              {pillar.label}
            </button>
          ))}
        </div>
        
        {/* Placeholder for right side to balance flex-between */}
        <div className="hidden lg:block w-[180px]"></div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default ServiceLayout;
