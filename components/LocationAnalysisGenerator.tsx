import React from 'react';
import { BusinessInfo, LocationAnalysisReport } from '../types';
import { ResponsiveContainer, ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Legend, Scatter, Cell } from 'recharts';


interface PositioningMapChartProps {
    data: LocationAnalysisReport['positioningMap'];
}

const PositioningMapChart: React.FC<PositioningMapChartProps> = ({ data }) => {
    if (!data || !data.points || data.points.length === 0) return null;

    const selfPoint = data.points.find(p => p.isSelf);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;
            return (
                <div className="bg-surface-card p-2 border border-border-color rounded-md shadow-lg text-sm">
                    <p className={`font-bold ${point.isSelf ? 'text-brand-primary' : 'text-text-primary'}`}>{point.name}</p>
                </div>
            );
        }
        return null;
    };
    
    return (
        <div className="w-full h-96 bg-surface-subtle p-4 rounded-lg">
            <ResponsiveContainer>
                <ScatterChart
                    margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#415A77" />
                    
                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name={data.xAxis.label} 
                        domain={[-10, 10]} 
                        ticks={[-10, 0, 10]}
                        tickFormatter={(tick) => {
                            if (tick === -10) return data.xAxis.min;
                            if (tick === 10) return data.xAxis.max;
                            return '';
                        }}
                        label={{ value: data.xAxis.label, position: 'insideBottom', offset: -25, fill: '#ccd6f6' }}
                        stroke="#8892b0"
                    />
                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={data.yAxis.label} 
                        domain={[-10, 10]}
                        ticks={[-10, 0, 10]}
                        tickFormatter={(tick) => {
                            if (tick === -10) return data.yAxis.min;
                            if (tick === 10) return data.yAxis.max;
                            return '';
                        }}
                        label={{ value: data.yAxis.label, angle: -90, position: 'insideLeft', offset: -25, fill: '#ccd6f6' }}
                        stroke="#8892b0"
                    />
                    
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

                    <Scatter name="Competitors" data={data.points} fill="#8884d8">
                         {data.points.map((point, index) => (
                            <Cell key={`cell-${index}`} fill={point.isSelf ? '#f59e0b' : '#06b6d4'} />
                        ))}
                    </Scatter>

                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};


interface Props {
  businessInfo: BusinessInfo;
  report: LocationAnalysisReport | null;
  status: { isLoading: boolean; error: string | null };
  onGenerate: () => void;
}

const LocationAnalysisGenerator: React.FC<Props> = ({ businessInfo, report, status, onGenerate }) => {

    const SWOTCard: React.FC<{ title: string; items: string[]; color: string; icon: React.ReactNode; bgClass: string; borderClass: string; textClass: string }> = ({ title, items, color, icon, bgClass, borderClass, textClass }) => (
        <div className={`${bgClass} p-6 rounded-2xl border ${borderClass} h-full`}>
            <h5 className={`font-bold ${color} mb-4 flex items-center gap-2 text-lg`}>
              <span className="text-xl">{icon}</span>
              {title}
            </h5>
            <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i} className={`flex items-start gap-3 ${textClass} font-medium`}>
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} flex-shrink-0`}></span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
            </ul>
        </div>
    );

    const Marketing4PCard: React.FC<{ title: string; strategies: {title: string; description: string}[]; icon: React.ReactNode }> = ({ title, strategies, icon }) => (
         <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl h-full">
            <h5 className="font-bold text-blue-800 text-lg mb-4 flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              {title}
            </h5>
            <div className="space-y-4">
             {strategies.map((item, i) => (
                <div key={i} className="bg-white/60 p-4 rounded-xl border border-blue-100/50">
                    <p className="text-base text-blue-800 font-bold mb-1">{item.title}</p>
                    <p className="text-sm text-blue-900 font-medium leading-relaxed">{item.description}</p>
                </div>
             ))}
            </div>
         </div>
    );
    
    const renderReport = (report: LocationAnalysisReport) => (
      <div className="mt-8 space-y-10 animate-fade-in">
          {/* SWOT Analysis */}
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-brand-primary">{businessInfo.name}</span> SWOT 분석
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SWOTCard title="Strengths (강점)" items={report.swotAnalysis.strengths} color="text-emerald-700" icon="💪" bgClass="bg-emerald-50/50" borderClass="border-emerald-100" textClass="text-emerald-800" />
                  <SWOTCard title="Weaknesses (약점)" items={report.swotAnalysis.weaknesses} color="text-red-700" icon="😥" bgClass="bg-red-50/50" borderClass="border-red-100" textClass="text-red-800" />
                  <SWOTCard title="Opportunities (기회)" items={report.swotAnalysis.opportunities} color="text-blue-700" icon="📈" bgClass="bg-blue-50/50" borderClass="border-blue-100" textClass="text-blue-800" />
                  <SWOTCard title="Threats (위협)" items={report.swotAnalysis.threats} color="text-amber-700" icon="⚠️" bgClass="bg-amber-50/50" borderClass="border-amber-100" textClass="text-amber-800" />
              </div>
          </div>
          
          {/* Competitor Analysis */}
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🏪</span>
                주요 경쟁사 분석 (온라인 노출 상위 5)
              </h4>
               <div className="space-y-4">
                  {report.competitorAnalysis.map((item, i) => (
                      <details key={i} className="bg-white p-4 rounded-2xl border border-border-color shadow-sm group open:ring-2 open:ring-brand-primary/50 transition-all">
                          <summary className="font-bold text-text-primary cursor-pointer text-lg flex items-center gap-3 outline-none">
                            <div className="w-8 h-8 rounded-full bg-surface-subtle flex items-center justify-center text-text-muted group-open:bg-brand-primary/10 group-open:text-brand-primary transition-colors">
                              {i + 1}
                            </div>
                            {item.competitorName}
                          </summary>
                          <div className="mt-4 pt-4 border-t border-border-color/50 pl-11">
                              <p className="text-base text-text-muted font-medium italic mb-4">"{item.description}"</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                    <strong className="text-emerald-700 block mb-1">강점</strong>
                                    <span className="text-emerald-900 font-medium text-sm">{item.strength}</span>
                                  </div>
                                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                    <strong className="text-red-700 block mb-1">약점</strong>
                                    <span className="text-red-900 font-medium text-sm">{item.weakness}</span>
                                  </div>
                              </div>
                          </div>
                      </details>
                  ))}
              </div>
          </div>
          
          {/* Positioning Map */}
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                시장 포지셔닝 맵
              </h4>
              <PositioningMapChart data={report.positioningMap} />
          </div>

          {/* 4P Marketing Mix Strategy */}
          <div>
              <h4 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                맞춤형 마케팅 믹스(4P) 전략 제안
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Marketing4PCard title="Product (제품 전략)" strategies={report.marketingMix4P.product} icon="📦" />
                 <Marketing4PCard title="Price (가격 전략)" strategies={report.marketingMix4P.price} icon="💰" />
                 <Marketing4PCard title="Place (유통 전략)" strategies={report.marketingMix4P.place} icon="🚚" />
                 <Marketing4PCard title="Promotion (촉진 전략)" strategies={report.marketingMix4P.promotion} icon="📣" />
              </div>
          </div>
      </div>
  );

  const isAddressMissing = !businessInfo.address;

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span className="text-brand-primary">AI</span> 기반 상권 분석 및 마케팅 전략
          </h3>
        </div>
        <button
          onClick={onGenerate}
          disabled={status.isLoading || isAddressMissing}
          className="w-full sm:w-auto px-6 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-sm transition-colors duration-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          title={isAddressMissing ? "상권 분석을 위해서는 사업장 주소가 필요합니다." : "AI 분석 리포트 생성"}
        >
          {status.isLoading ? (
            <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>리포트 생성 중...</span>
            </>
          ) : (
             <>
              {report ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m7 0a9 9 0 11-12.73 0" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              <span>{report ? '재분석' : 'AI 분석 리포트 생성'}</span>
            </>
          )}
        </button>
      </div>

      <div className="text-text-primary">
          {status.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl my-6 flex items-center gap-3 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {status.error}
            </div>
          )}

          {!report && !status.isLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-subtle/30 rounded-3xl border border-border-color/50">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              {isAddressMissing 
                ? <p className="text-lg text-text-muted font-medium max-w-lg">사업장 주소가 입력되지 않았습니다. '새 분석'으로 돌아가 주소를 입력하면 상권 분석 기능을 이용할 수 있습니다.</p>
                : <>
                    <h4 className="text-xl font-bold text-text-primary mb-2">
                      { status.isLoading ? 'AI가 상권 분석 리포트를 생성하고 있습니다... 잠시 후 확인해주세요.' : '버튼을 클릭하여 우리 가게 맞춤형 상권 분석 및 마케팅 전략을 받아보세요.'}
                    </h4>
                  </>
              }
            </div>
          )}

           {status.isLoading && !report && (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-subtle/30 rounded-3xl border border-border-color/50">
               <svg className="animate-spin h-12 w-12 text-brand-primary mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <h4 className="text-xl font-bold text-text-primary mb-2">AI가 리포트를 생성하고 있습니다</h4>
               <p className="text-lg text-text-muted font-medium">이 화면을 벗어나 다른 메뉴를 보셔도 됩니다.</p>
             </div>
          )}

          {report && renderReport(report)}
      </div>
    </div>
  );
};

export default LocationAnalysisGenerator;