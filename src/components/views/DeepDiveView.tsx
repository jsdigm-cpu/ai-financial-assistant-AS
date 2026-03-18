import React from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
}

const DeepDiveView: React.FC<Props> = ({ transactions, businessInfo, categories }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-border-color text-center">
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto py-12">
        <div className="p-4 bg-brand-primary/10 rounded-full mb-6">
          <span className="material-symbols-outlined text-5xl text-brand-primary">psychology</span>
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-4">심층 분석 서비스 준비 중</h3>
        <p className="text-text-muted mb-8">
          AI가 사장님의 비즈니스 데이터를 더 깊이 있게 분석하여 맞춤형 전략을 제안해 드립니다. 
          현재 서비스 고도화 작업 중이며, 곧 만나보실 수 있습니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color text-left">
            <span className="material-symbols-outlined text-brand-primary mb-2">trending_up</span>
            <h4 className="font-bold text-sm mb-1">수익성 극대화 전략</h4>
            <p className="text-xs text-text-muted">비용 절감 및 매출 증대 포인트 분석</p>
          </div>
          <div className="p-4 bg-surface-subtle rounded-xl border border-border-color text-left">
            <span className="material-symbols-outlined text-brand-primary mb-2">group</span>
            <h4 className="font-bold text-sm mb-1">고객 행동 패턴 분석</h4>
            <p className="text-xs text-text-muted">재방문율 및 객단가 향상 방안</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepDiveView;
