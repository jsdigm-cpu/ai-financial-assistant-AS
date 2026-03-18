import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Category } from '../types';

interface Props {
  isOpen: boolean;
  initialCategories: Category[];
  onConfirm: (categories: Category[]) => void;
}

const CategoryReviewModal: React.FC<Props> = ({ isOpen, initialCategories, onConfirm }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCategories([...initialCategories]);
    }
  }, [isOpen, initialCategories]);

  const handleReset = () => {
    setCategories([...initialCategories]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">AI가 생성한 카테고리 검토</h2>
            <p className="text-sm text-text-muted">비즈니스에 맞게 생성된 카테고리입니다. 확인 후 시작하세요.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar border border-border-color rounded-xl p-4 mb-4 bg-surface-subtle/30">
          {categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.map((cat, idx) => (
                <li key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border-color shadow-sm">
                  <div>
                    <span className="font-bold text-text-primary">{cat.name}</span>
                    <span className="ml-2 text-xs text-text-muted">({cat.level1} {'>'} {cat.level2})</span>
                  </div>
                  <button 
                    onClick={() => setCategories(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 p-1 transition-colors"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>표시할 카테고리가 없습니다.</p>
              <button 
                onClick={handleReset}
                className="mt-4 text-brand-primary font-bold hover:underline"
              >
                기본 카테고리 불러오기
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-4 bg-surface-subtle hover:bg-border-color text-text-primary font-bold rounded-xl transition-colors"
          >
            초기화
          </button>
          <button
            onClick={() => onConfirm(categories)}
            disabled={categories.length === 0}
            className="flex-[2] py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이대로 시작하기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CategoryReviewModal;
