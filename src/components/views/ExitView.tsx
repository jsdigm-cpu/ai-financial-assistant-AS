import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BusinessInfo } from '../../types';

interface Props {
  businessInfo: BusinessInfo;
}

const ExitView: React.FC<Props> = ({ businessInfo }) => {
  const [checklist, setChecklist] = useState([
    { id: '1', task: '사업 양도/양수 계약서 작성', completed: false, category: '법률/계약' },
    { id: '2', task: '임대차 계약 해지 통보 (3개월 전)', completed: true, category: '부동산' },
    { id: '3', task: '직원 퇴직금 정산 및 4대보험 상실신고', completed: false, category: '인사/노무' },
    { id: '4', task: '원상복구 업체 견적 비교', completed: false, category: '시설' },
    { id: '5', task: '사업자 등록 폐업 신고 (홈택스)', completed: false, category: '세무' },
    { id: '6', task: '부가가치세 확정 신고', completed: false, category: '세무' },
    { id: '7', task: '희망리턴패키지 지원금 신청', completed: false, category: '정부지원' },
  ]);

  const toggleTask = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const completedCount = checklist.filter(t => t.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">전략적 마무리지원 (Exit)</h2>
          <p className="text-text-muted">성공적인 마무리를 위한 단계별 가이드를 제공합니다.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <span className="text-sm font-bold text-brand-primary">진행률: {progress.toFixed(0)}%</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-border-color overflow-hidden"
          >
            <div className="p-6 border-b border-border-color bg-surface-subtle/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">checklist</span>
                마무리 체크리스트
              </h3>
              <span className="text-text-muted text-sm font-bold">{completedCount} / {checklist.length} 완료</span>
            </div>
            
            <div className="p-6">
                <div className="w-full h-2 bg-surface-subtle rounded-full mb-8 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-brand-primary"
                    ></motion.div>
                </div>

                <div className="space-y-3">
                    {checklist.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => toggleTask(item.id)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                                item.completed 
                                ? 'bg-emerald-50 border-emerald-100 opacity-70' 
                                : 'bg-white border-border-color hover:border-brand-primary'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border-color'
                            }`}>
                                {item.completed && <span className="material-symbols-outlined text-sm">check</span>}
                            </div>
                            <div className="flex-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest mb-1 inline-block ${
                                    item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-subtle text-text-muted'
                                }`}>
                                    {item.category}
                                </span>
                                <p className={`font-bold text-text-primary ${item.completed ? 'line-through' : ''}`}>{item.task}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Support & Info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-border-color p-8"
          >
            <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">support_agent</span>
              정부 지원 프로그램
            </h3>
            
            <div className="space-y-4">
                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color hover:border-brand-primary transition-all cursor-pointer group">
                    <h4 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">희망리턴패키지</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">폐업 예정 소상공인의 재기 지원 (철거비 최대 250만원 지원)</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase">
                        자세히 보기 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                </div>
                
                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color hover:border-brand-primary transition-all cursor-pointer group">
                    <h4 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">소상공인 폐업 지원금</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">지자체별 폐업 소상공인 생활 안정 지원금 확인</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase">
                        자세히 보기 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                </div>

                <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color hover:border-brand-primary transition-all cursor-pointer group">
                    <h4 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">법률/세무 무료 컨설팅</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">폐업 과정의 법적 분쟁 및 세무 신고 지원</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase">
                        자세히 보기 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </div>
                </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-50 rounded-3xl border border-red-100 p-8"
          >
            <h3 className="font-bold text-lg text-red-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">warning</span>
              주의 사항
            </h3>
            <ul className="space-y-3 text-sm text-red-700 leading-relaxed">
                <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    폐업 신고 전 부가가치세 및 소득세 정산을 반드시 완료해야 가산세를 피할 수 있습니다.
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    임대차 계약 해지 통보는 최소 3개월 전에 서면으로 진행하는 것이 안전합니다.
                </li>
                <li className="flex gap-2">
                    <span className="font-bold text-red-600">•</span>
                    정부 지원금은 폐업 완료 전 신청해야 하는 경우가 많으므로 미리 확인하세요.
                </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ExitView;
