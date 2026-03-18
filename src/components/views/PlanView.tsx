import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { StartupCostItem, ProfitSimulation } from '../../types';

const PlanView: React.FC = () => {
  const [startupCosts, setStartupCosts] = useState<StartupCostItem[]>([
    { id: '1', category: '부동산', name: '보증금', amount: 50000000 },
    { id: '2', category: '부동산', name: '권리금', amount: 30000000 },
    { id: '3', category: '시설/인테리어', name: '인테리어 공사', amount: 40000000 },
    { id: '4', category: '시설/인테리어', name: '주방 설비', amount: 15000000 },
    { id: '5', category: '운영준비', name: '초기 원부재료', amount: 5000000 },
    { id: '6', category: '운영준비', name: '마케팅/홍보', amount: 3000000 },
    { id: '7', category: '운영준비', name: '예비비', amount: 10000000 },
  ]);

  const [simulation, setSimulation] = useState<ProfitSimulation>({
    monthlyRevenue: 30000000,
    costOfGoodsSold: 10500000, // 35%
    laborCost: 6000000, // 20%
    rent: 3000000, // 10%
    utilities: 1500000, // 5%
    marketing: 1000000,
    otherExpenses: 1000000,
  });

  const totalStartupCost = useMemo(() => startupCosts.reduce((sum, item) => sum + item.amount, 0), [startupCosts]);
  
  const totalMonthlyExpense = useMemo(() => 
    simulation.costOfGoodsSold + simulation.laborCost + simulation.rent + simulation.utilities + simulation.marketing + simulation.otherExpenses
  , [simulation]);

  const monthlyNetProfit = simulation.monthlyRevenue - totalMonthlyExpense;
  const profitMargin = (monthlyNetProfit / simulation.monthlyRevenue) * 100;
  const breakEvenMonths = totalStartupCost / monthlyNetProfit;

  const handleUpdateCost = (id: string, amount: number) => {
    setStartupCosts(prev => prev.map(item => item.id === id ? { ...item, amount } : item));
  };

  const handleUpdateSimulation = (field: keyof ProfitSimulation, value: number) => {
    setSimulation(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">스마트 창업 설계 (Plan)</h2>
          <p className="text-text-muted">데이터 기반의 정교한 창업 계획을 수립합니다.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <span className="text-sm font-bold text-brand-primary">예상 회수 기간: {monthlyNetProfit > 0 ? `${breakEvenMonths.toFixed(1)}개월` : '수익 발생 필요'}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Startup Cost Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-border-color overflow-hidden"
        >
          <div className="p-6 border-b border-border-color bg-surface-subtle/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">payments</span>
              초기 창업 비용 계산기
            </h3>
            <span className="text-brand-primary font-bold">총 {totalStartupCost.toLocaleString()}원</span>
          </div>
          <div className="p-6 space-y-4">
            {startupCosts.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-surface-subtle rounded-2xl border border-border-color/50">
                <div className="flex-1">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">{item.category}</span>
                  <p className="font-bold text-text-primary">{item.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={item.amount}
                    onChange={(e) => handleUpdateCost(item.id, Number(e.target.value))}
                    className="w-32 bg-white border border-border-color rounded-xl px-3 py-2 text-right font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all"
                  />
                  <span className="text-sm text-text-muted">원</span>
                </div>
              </div>
            ))}
            <button className="w-full py-4 border-2 border-dashed border-border-color rounded-2xl text-text-muted font-bold hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">add</span>
              항목 추가하기
            </button>
          </div>
        </motion.div>

        {/* Profit Simulation Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-border-color overflow-hidden"
        >
          <div className="p-6 border-b border-border-color bg-surface-subtle/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">calculate</span>
              월간 손익 시뮬레이션
            </h3>
            <span className={`font-bold ${monthlyNetProfit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              순이익 {monthlyNetProfit.toLocaleString()}원 ({profitMargin.toFixed(1)}%)
            </span>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-text-primary mb-2 block">월 예상 매출액</span>
                <div className="relative">
                  <input 
                    type="number" 
                    value={simulation.monthlyRevenue}
                    onChange={(e) => handleUpdateSimulation('monthlyRevenue', Number(e.target.value))}
                    className="w-full bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl px-4 py-4 text-2xl font-black text-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-right pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-primary">원</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '재료비 (원가)', field: 'costOfGoodsSold', icon: 'shopping_basket' },
                { label: '인건비', field: 'laborCost', icon: 'group' },
                { label: '임차료', field: 'rent', icon: 'home' },
                { label: '수도광열비', field: 'utilities', icon: 'bolt' },
                { label: '마케팅비', field: 'marketing', icon: 'campaign' },
                { label: '기타 운영비', field: 'otherExpenses', icon: 'more_horiz' },
              ].map(item => (
                <div key={item.field} className="p-4 bg-surface-subtle rounded-2xl border border-border-color/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-brand-primary text-sm">{item.icon}</span>
                    <span className="text-xs font-bold text-text-muted">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={simulation[item.field as keyof ProfitSimulation]}
                      onChange={(e) => handleUpdateSimulation(item.field as keyof ProfitSimulation, Number(e.target.value))}
                      className="w-full bg-white border border-border-color rounded-xl px-3 py-2 text-right font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all"
                    />
                    <span className="text-xs text-text-muted">원</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-brand-primary text-white rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold opacity-80">총 월 지출액</span>
                    <span className="text-xl font-black">{totalMonthlyExpense.toLocaleString()}원</span>
                </div>
                <div className="h-px bg-white/20 my-4"></div>
                <div className="flex justify-between items-end">
                    <div>
                        <span className="block text-sm font-bold opacity-80">월 예상 순이익</span>
                        <span className="text-3xl font-black">{monthlyNetProfit.toLocaleString()}원</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-bold opacity-80">수익률</span>
                        <span className="text-2xl font-black">{profitMargin.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlanView;
