import React, { useState, useMemo, useId } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { StartupCostItem, ProfitSimulation } from '../../types';
import FormattedNumberInput from '../FormattedNumberInput';

const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(0)}만원` : `${n.toLocaleString()}원`;
const fmtFull = (n: number) => n.toLocaleString('ko-KR') + '원';

const CATEGORIES = ['부동산', '시설/인테리어', '운영준비', '마케팅/홍보', '기타'];

type Scenario = 'pessimistic' | 'base' | 'optimistic';

const SCENARIO_CONFIG: Record<Scenario, { label: string; revenueMult: number; expenseMult: number; color: string; bg: string; border: string }> = {
  pessimistic: { label: '비관 시나리오', revenueMult: 0.7, expenseMult: 1.1, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  base:        { label: '기본 시나리오', revenueMult: 1.0, expenseMult: 1.0, color: 'text-brand-primary', bg: 'bg-brand-primary/5', border: 'border-brand-primary/20' },
  optimistic:  { label: '낙관 시나리오', revenueMult: 1.3, expenseMult: 0.95, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

const INDUSTRY_BENCHMARKS: Record<string, { laborRatio: number; materialRatio: number; rentRatio: number; profitRatio: number }> = {
  '음식점':   { laborRatio: 25, materialRatio: 35, rentRatio: 10, profitRatio: 15 },
  '카페':     { laborRatio: 20, materialRatio: 30, rentRatio: 12, profitRatio: 18 },
  '소매업':   { laborRatio: 15, materialRatio: 50, rentRatio: 8,  profitRatio: 12 },
  '서비스업': { laborRatio: 35, materialRatio: 10, rentRatio: 10, profitRatio: 25 },
  '미용/뷰티': { laborRatio: 40, materialRatio: 15, rentRatio: 12, profitRatio: 20 },
};

const PlanView: React.FC = () => {
  const uid = useId();

  const [startupCosts, setStartupCosts] = useState<StartupCostItem[]>([
    { id: '1', category: '부동산', name: '보증금', amount: 50000000 },
    { id: '2', category: '부동산', name: '권리금', amount: 30000000 },
    { id: '3', category: '시설/인테리어', name: '인테리어 공사', amount: 40000000 },
    { id: '4', category: '시설/인테리어', name: '주방 설비', amount: 15000000 },
    { id: '5', category: '운영준비', name: '초기 원부재료', amount: 5000000 },
    { id: '6', category: '마케팅/홍보', name: '개업 마케팅', amount: 3000000 },
    { id: '7', category: '운영준비', name: '예비비 (비용의 10%)', amount: 10000000 },
  ]);

  const [simulation, setSimulation] = useState<ProfitSimulation>({
    monthlyRevenue: 30000000,
    costOfGoodsSold: 10500000,
    laborCost: 6000000,
    rent: 3000000,
    utilities: 1500000,
    marketing: 1000000,
    otherExpenses: 1000000,
  });

  const [selectedScenario, setSelectedScenario] = useState<Scenario>('base');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('음식점');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(CATEGORIES[0]);
  const [newItemAmount, setNewItemAmount] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalStartupCost = useMemo(() => startupCosts.reduce((sum, item) => sum + item.amount, 0), [startupCosts]);

  const totalMonthlyExpense = useMemo(() =>
    simulation.costOfGoodsSold + simulation.laborCost + simulation.rent +
    simulation.utilities + simulation.marketing + simulation.otherExpenses,
    [simulation]);

  const scenarioData = useMemo(() => {
    return (Object.keys(SCENARIO_CONFIG) as Scenario[]).map(key => {
      const cfg = SCENARIO_CONFIG[key];
      const revenue = Math.round(simulation.monthlyRevenue * cfg.revenueMult);
      const expense = Math.round(totalMonthlyExpense * cfg.expenseMult);
      const profit = revenue - expense;
      const margin = revenue > 0 ? (profit / revenue * 100) : 0;
      const breakEven = profit > 0 ? Math.ceil(totalStartupCost / profit) : null;
      return { key, ...cfg, revenue, expense, profit, margin, breakEven };
    });
  }, [simulation, totalMonthlyExpense, totalStartupCost]);

  const activeScenario = scenarioData.find(s => s.key === selectedScenario)!;

  const benchmark = INDUSTRY_BENCHMARKS[selectedIndustry];
  const laborRatio = simulation.monthlyRevenue > 0 ? (simulation.laborCost / simulation.monthlyRevenue * 100) : 0;
  const materialRatio = simulation.monthlyRevenue > 0 ? (simulation.costOfGoodsSold / simulation.monthlyRevenue * 100) : 0;
  const rentRatio = simulation.monthlyRevenue > 0 ? (simulation.rent / simulation.monthlyRevenue * 100) : 0;
  const profitRatio = simulation.monthlyRevenue > 0 ? ((simulation.monthlyRevenue - totalMonthlyExpense) / simulation.monthlyRevenue * 100) : 0;

  // 12개월 현금흐름 차트 데이터
  const cashFlowData = useMemo(() => {
    const { revenueMult, expenseMult } = SCENARIO_CONFIG[selectedScenario];
    const r = simulation.monthlyRevenue * revenueMult;
    const e = totalMonthlyExpense * expenseMult;
    let cumulative = -totalStartupCost;
    return Array.from({ length: 12 }, (_, i) => {
      const ramp = Math.min(1, 0.5 + i * 0.05); // 영업 초기 매출 램프업
      const monthRevenue = Math.round(r * ramp);
      const monthProfit = monthRevenue - Math.round(e);
      cumulative += monthProfit;
      return {
        name: `${i + 1}월`,
        월순손익: monthProfit,
        누적손익: cumulative,
      };
    });
  }, [simulation, totalMonthlyExpense, totalStartupCost, selectedScenario]);

  const addItem = () => {
    if (!newItemName.trim() || newItemAmount <= 0) return;
    const newItem: StartupCostItem = {
      id: `${uid}-${Date.now()}`,
      category: newItemCategory,
      name: newItemName.trim(),
      amount: newItemAmount,
    };
    setStartupCosts(prev => [...prev, newItem]);
    setNewItemName('');
    setNewItemAmount(0);
    setShowAddForm(false);
  };

  const removeItem = (id: string) => {
    setStartupCosts(prev => prev.filter(item => item.id !== id));
  };

  const updateSimulation = (field: keyof ProfitSimulation, value: number) => {
    setSimulation(prev => ({ ...prev, [field]: value }));
  };

  // 비용 구성 비율 비교 컴포넌트
  const BenchmarkRow = ({ label, mine, bench }: { label: string; mine: number; bench: number }) => {
    const diff = mine - bench;
    return (
      <div className="grid grid-cols-3 items-center gap-4 py-3 border-b border-border-color/30 last:border-0">
        <span className="text-sm font-bold text-text-muted">{label}</span>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-border-color rounded-full overflow-hidden">
            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(mine, 100)}%` }} />
          </div>
          <span className="text-sm font-bold w-12 text-right text-text-primary">{mine.toFixed(1)}%</span>
        </div>
        <div className={`text-xs font-bold text-right ${diff > 2 ? 'text-red-500' : diff < -2 ? 'text-emerald-500' : 'text-text-muted'}`}>
          {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
          <span className="ml-1 font-normal text-text-muted">(업계 {bench}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">edit_note</span>
            스마트 창업 설계
          </h2>
          <p className="text-text-muted mt-1">데이터 기반의 정교한 창업 계획 및 수익성 시뮬레이션을 수행합니다.</p>
        </div>
        {activeScenario.breakEven && (
          <div className="px-5 py-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
            <span className="text-sm font-bold text-brand-primary">
              기본 시나리오 손익분기: {scenarioData.find(s => s.key === 'base')?.breakEven ?? '-'}개월
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 창업 비용 계산기 */}
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
            <span className="text-brand-primary font-bold text-sm">{fmtFull(totalStartupCost)}</span>
          </div>

          {/* 카테고리별 그룹 */}
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {CATEGORIES.filter(cat => startupCosts.some(i => i.category === cat)).map(cat => (
              <div key={cat}>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">{cat}</p>
                {startupCosts.filter(item => item.category === cat).map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-subtle rounded-xl border border-border-color/50 mb-2 group">
                    <span className="flex-1 font-bold text-text-primary text-sm">{item.name}</span>
                    <FormattedNumberInput
                      value={item.amount}
                      onChange={(n) => setStartupCosts(prev => prev.map(i => i.id === item.id ? { ...i, amount: n } : i))}
                      className="w-36 bg-white border border-border-color rounded-lg px-3 py-1.5 text-right font-bold text-text-primary text-sm focus:ring-2 focus:ring-brand-accent transition-all"
                    />
                    <span className="text-xs text-text-muted">원</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 항목 추가 */}
          <div className="p-6 pt-0">
            {showAddForm ? (
              <div className="p-4 bg-surface-subtle rounded-2xl border border-border-color space-y-3">
                <select
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  className="w-full border border-border-color rounded-xl px-3 py-2 text-sm font-bold bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="항목명 (예: 에어컨 설치)"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full border border-border-color rounded-xl px-3 py-2 text-sm bg-white"
                />
                <FormattedNumberInput
                  value={newItemAmount}
                  onChange={n => setNewItemAmount(n)}
                  placeholder="금액 (원)"
                  className="w-full border border-border-color rounded-xl px-3 py-2 text-sm bg-white text-right"
                />
                <div className="flex gap-2">
                  <button onClick={addItem} className="flex-1 py-2 bg-brand-primary text-white font-bold rounded-xl text-sm">추가</button>
                  <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 bg-surface-subtle border border-border-color font-bold rounded-xl text-sm text-text-muted">취소</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3 border-2 border-dashed border-border-color rounded-2xl text-text-muted font-bold hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined">add</span>
                항목 추가하기
              </button>
            )}
          </div>

          {/* 카테고리별 비중 */}
          <div className="px-6 pb-6">
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {CATEGORIES.filter(cat => startupCosts.some(i => i.category === cat)).map((cat, idx) => {
                const catTotal = startupCosts.filter(i => i.category === cat).reduce((s, i) => s + i.amount, 0);
                const ratio = totalStartupCost > 0 ? (catTotal / totalStartupCost * 100) : 0;
                const colors = ['bg-brand-primary', 'bg-brand-accent', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
                return <div key={cat} className={`${colors[idx % colors.length]} h-full transition-all`} style={{ width: `${ratio}%` }} title={`${cat}: ${ratio.toFixed(1)}%`} />;
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {CATEGORIES.filter(cat => startupCosts.some(i => i.category === cat)).map((cat, idx) => {
                const catTotal = startupCosts.filter(i => i.category === cat).reduce((s, i) => s + i.amount, 0);
                const colors = ['text-brand-primary', 'text-brand-accent', 'text-emerald-600', 'text-amber-600', 'text-purple-600'];
                const bgColors = ['bg-brand-primary/10', 'bg-brand-accent/10', 'bg-emerald-50', 'bg-amber-50', 'bg-purple-50'];
                return (
                  <span key={cat} className={`text-xs font-bold px-2 py-1 rounded-full ${bgColors[idx % bgColors.length]} ${colors[idx % colors.length]}`}>
                    {cat}: {fmt(catTotal)}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 월간 손익 시뮬레이션 */}
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
          </div>
          <div className="p-6 space-y-5">
            <label className="block">
              <span className="text-sm font-bold text-text-primary mb-2 block">월 예상 매출액</span>
              <div className="relative">
                <FormattedNumberInput
                  value={simulation.monthlyRevenue}
                  onChange={n => updateSimulation('monthlyRevenue', n)}
                  className="w-full bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl px-4 py-4 text-2xl font-black text-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-right pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-brand-primary">원</span>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: '재료비 (원가)', field: 'costOfGoodsSold', icon: 'shopping_basket', color: 'text-orange-500' },
                { label: '인건비', field: 'laborCost', icon: 'group', color: 'text-blue-500' },
                { label: '임차료', field: 'rent', icon: 'home', color: 'text-purple-500' },
                { label: '수도광열비', field: 'utilities', icon: 'bolt', color: 'text-amber-500' },
                { label: '마케팅비', field: 'marketing', icon: 'campaign', color: 'text-pink-500' },
                { label: '기타 운영비', field: 'otherExpenses', icon: 'more_horiz', color: 'text-gray-500' },
              ].map(item => (
                <div key={item.field} className="p-3 bg-surface-subtle rounded-xl border border-border-color/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-sm ${item.color}`}>{item.icon}</span>
                    <span className="text-xs font-bold text-text-muted">{item.label}</span>
                    <span className="ml-auto text-xs text-text-muted">
                      {simulation.monthlyRevenue > 0 ? `${(Number(simulation[item.field as keyof ProfitSimulation]) / simulation.monthlyRevenue * 100).toFixed(0)}%` : '-'}
                    </span>
                  </div>
                  <FormattedNumberInput
                    value={Number(simulation[item.field as keyof ProfitSimulation])}
                    onChange={n => updateSimulation(item.field as keyof ProfitSimulation, n)}
                    className="w-full bg-white border border-border-color rounded-lg px-3 py-2 text-right font-bold text-text-primary text-sm focus:ring-2 focus:ring-brand-accent transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 bg-brand-primary text-white rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold opacity-80">총 월 지출액</span>
                <span className="text-lg font-black">{fmtFull(totalMonthlyExpense)}</span>
              </div>
              <div className="h-px bg-white/20 mb-3"></div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="block text-sm font-bold opacity-80">월 예상 순이익 (기본)</span>
                  <span className="text-2xl font-black">{fmtFull(simulation.monthlyRevenue - totalMonthlyExpense)}</span>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold opacity-80">수익률</span>
                  <span className="text-2xl font-black">
                    {simulation.monthlyRevenue > 0 ? ((simulation.monthlyRevenue - totalMonthlyExpense) / simulation.monthlyRevenue * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 시나리오 비교 분석 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-sm border border-border-color overflow-hidden"
      >
        <div className="p-6 border-b border-border-color bg-surface-subtle/50">
          <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">analytics</span>
            시나리오별 수익성 분석
          </h3>
          <p className="text-sm text-text-muted mt-1">낙관·기본·비관 시나리오로 예상 수익과 손익분기점을 비교합니다.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {scenarioData.map(s => (
              <button
                key={s.key}
                onClick={() => setSelectedScenario(s.key as Scenario)}
                className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedScenario === s.key ? `${s.border} ${s.bg} shadow-md` : 'border-border-color hover:border-brand-primary/30'}`}
              >
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${selectedScenario === s.key ? s.color : 'text-text-muted'}`}>
                  {s.label}
                </p>
                <p className={`text-2xl font-black ${s.profit >= 0 ? (s.key === 'pessimistic' ? 'text-red-600' : 'text-emerald-600') : 'text-red-600'}`}>
                  {fmtFull(s.profit)}
                </p>
                <p className="text-xs text-text-muted mt-1">월 순이익 ({s.margin.toFixed(1)}%)</p>
                <div className="mt-3 pt-3 border-t border-border-color/30 text-xs text-text-muted">
                  {s.breakEven
                    ? <span className="font-bold">손익분기: <span className={s.color}>{s.breakEven}개월</span></span>
                    : <span className="text-red-500 font-bold">수익 발생 불가</span>
                  }
                </div>
              </button>
            ))}
          </div>

          {/* 12개월 현금흐름 차트 */}
          <div>
            <p className="text-sm font-bold text-text-muted mb-4">12개월 현금흐름 예측 ({SCENARIO_CONFIG[selectedScenario].label})</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cashFlowData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(value: number) => fmtFull(value)} />
                <Legend />
                <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 2" />
                <Bar dataKey="월순손익" fill={selectedScenario === 'optimistic' ? '#10b981' : selectedScenario === 'pessimistic' ? '#ef4444' : '#1a1a2e'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="누적손익" fill={selectedScenario === 'optimistic' ? '#6ee7b7' : selectedScenario === 'pessimistic' ? '#fca5a5' : '#c8953a'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* 업종 벤치마크 비교 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-sm border border-border-color overflow-hidden"
      >
        <div className="p-6 border-b border-border-color bg-surface-subtle/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">compare_arrows</span>
              업종 평균 대비 비용 구조 분석
            </h3>
            <p className="text-sm text-text-muted mt-1">내 비용 비율을 업종 평균과 비교합니다. 빨간색은 업종 평균보다 높은 비용을 의미합니다.</p>
          </div>
          <select
            value={selectedIndustry}
            onChange={e => setSelectedIndustry(e.target.value)}
            className="border border-border-color rounded-xl px-4 py-2 text-sm font-bold bg-white appearance-none"
          >
            {Object.keys(INDUSTRY_BENCHMARKS).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 text-xs font-bold text-text-muted pb-2 border-b border-border-color mb-2">
            <span>항목</span>
            <span className="text-center">내 비율 (막대)</span>
            <span className="text-right">차이 (업종 평균)</span>
          </div>
          <BenchmarkRow label="인건비율" mine={laborRatio} bench={benchmark.laborRatio} />
          <BenchmarkRow label="재료비율" mine={materialRatio} bench={benchmark.materialRatio} />
          <BenchmarkRow label="임차료율" mine={rentRatio} bench={benchmark.rentRatio} />
          <BenchmarkRow label="순이익률" mine={profitRatio} bench={benchmark.profitRatio} />

          <div className="mt-6 p-4 bg-surface-subtle rounded-2xl border border-border-color">
            <p className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-brand-primary">info</span>
              해석 가이드
            </p>
            <ul className="text-xs text-text-muted space-y-1 leading-relaxed">
              <li>• <strong className="text-red-500">+수치 (빨간색)</strong>: 업종 평균보다 해당 비용이 높음 → 절감 가능성 검토 필요</li>
              <li>• <strong className="text-emerald-600">-수치 (초록색)</strong>: 업종 평균보다 낮음 → 효율적 운영 또는 과소 투자 여부 점검</li>
              <li>• 순이익률의 경우 +수치가 유리 (업종 평균보다 높은 수익성)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlanView;
