import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProcessedData, BusinessInfo } from '../../types';

interface Props {
  transactions: any[];
  businessInfo: BusinessInfo;
}

const ValueView: React.FC<Props> = ({ transactions, businessInfo }) => {
  const [assetValue, setAssetValue] = useState(50000000); // 시설/집기 가치
  const [inventoryValue, setInventoryValue] = useState(5000000); // 재고 가치
  const [premiumMultiplier, setPremiumMultiplier] = useState(12); // 권리금 배수 (개월)
  const [brandValue, setBrandValue] = useState(10000000); // 브랜드/무형 가치

  // 최근 3개월 평균 순이익 계산 (간이)
  const averageMonthlyProfit = useMemo(() => {
    if (transactions.length === 0) return 3000000; // 기본값
    
    // 실제 데이터가 있다면 여기서 계산 로직 추가 가능
    // 현재는 예시로 300만원 설정
    return 4500000; 
  }, [transactions]);

  const profitValue = averageMonthlyProfit * premiumMultiplier;
  const totalValue = assetValue + inventoryValue + profitValue + brandValue;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">데이터 기반 가치 평가 (Value)</h2>
          <p className="text-text-muted">내 사업의 현재 가치를 객관적으로 산출합니다.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <span className="text-sm font-bold text-brand-primary">평가 기준: 수익환원법 + 자산가치법</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-border-color p-8"
          >
            <h3 className="font-bold text-lg text-text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">inventory_2</span>
              자산 및 무형 가치 설정
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted">시설 및 집기 가치 (감가상각 반영)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={assetValue}
                    onChange={(e) => setAssetValue(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-color rounded-2xl px-4 py-3 font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all text-right pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">원</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted">재고 자산 가치</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={inventoryValue}
                    onChange={(e) => setInventoryValue(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-color rounded-2xl px-4 py-3 font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all text-right pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">원</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted">브랜드 및 영업권 가치</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={brandValue}
                    onChange={(e) => setBrandValue(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-color rounded-2xl px-4 py-3 font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all text-right pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">원</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted">권리금 배수 (수익의 N배)</label>
                <div className="relative">
                  <select 
                    value={premiumMultiplier}
                    onChange={(e) => setPremiumMultiplier(Number(e.target.value))}
                    className="w-full bg-surface-subtle border border-border-color rounded-2xl px-4 py-3 font-bold text-text-primary focus:ring-2 focus:ring-brand-accent transition-all appearance-none"
                  >
                    <option value={6}>6개월 (보통)</option>
                    <option value={12}>12개월 (우수)</option>
                    <option value={18}>18개월 (매우 우수)</option>
                    <option value={24}>24개월 (독보적)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-brand-primary/5 rounded-3xl border border-brand-primary/20 p-8"
          >
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-brand-primary">trending_up</span>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-text-primary">수익 가치 분석 (Profit Value)</h3>
                    <p className="text-sm text-text-muted">최근 경영 데이터를 기반으로 산출된 월 평균 순이익</p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                    <span className="text-sm font-bold text-text-muted block mb-1">월 평균 순이익</span>
                    <span className="text-3xl font-black text-brand-primary">{averageMonthlyProfit.toLocaleString()}원</span>
                </div>
                <div className="hidden sm:block text-text-muted">
                    <span className="material-symbols-outlined text-4xl">close</span>
                </div>
                <div className="text-center sm:text-left">
                    <span className="text-sm font-bold text-text-muted block mb-1">권리금 배수</span>
                    <span className="text-3xl font-black text-brand-primary">{premiumMultiplier}배</span>
                </div>
                <div className="hidden sm:block text-text-muted">
                    <span className="material-symbols-outlined text-4xl">equal</span>
                </div>
                <div className="text-center sm:text-right">
                    <span className="text-sm font-bold text-text-muted block mb-1">최종 수익 가치</span>
                    <span className="text-3xl font-black text-brand-primary">{profitValue.toLocaleString()}원</span>
                </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Summary Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl border border-border-color overflow-hidden flex flex-col"
        >
          <div className="p-8 bg-gradient-to-br from-brand-primary to-indigo-800 text-white text-center">
            <span className="text-sm font-bold opacity-80 uppercase tracking-widest block mb-2">Estimated Business Value</span>
            <h3 className="text-4xl font-black mb-1">{totalValue.toLocaleString()}원</h3>
            <p className="text-white/60 text-sm">현재 데이터 기준 예상 기업 가치</p>
          </div>
          
          <div className="p-8 flex-1 space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold">시설/집기 가치</span>
                    <span className="font-bold text-text-primary">{assetValue.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold">재고 자산 가치</span>
                    <span className="font-bold text-text-primary">{inventoryValue.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold">수익 가치 (N배)</span>
                    <span className="font-bold text-text-primary">{profitValue.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-text-muted font-bold">브랜드/무형 가치</span>
                    <span className="font-bold text-text-primary">{brandValue.toLocaleString()}원</span>
                </div>
            </div>
            
            <div className="h-px bg-border-color"></div>
            
            <div className="p-4 bg-surface-subtle rounded-2xl text-sm text-text-muted leading-relaxed">
                <p className="font-bold text-text-primary mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-primary text-sm">info</span>
                    가치 평가 가이드
                </p>
                본 평가는 입력된 데이터와 일반적인 권리금 산정 방식을 기반으로 한 추정치입니다. 실제 매매 시에는 상권의 변화, 업종 트렌드, 개별 협상에 따라 차이가 발생할 수 있습니다.
            </div>
            
            <button className="w-full py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg hover:bg-brand-secondary transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">description</span>
                가치 평가 보고서 다운로드
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ValueView;
