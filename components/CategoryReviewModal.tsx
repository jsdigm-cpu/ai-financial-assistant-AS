import React, { useState, useEffect } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col max-w-2xl w-full max-h-[80vh] mx-4">
        <h2 className="text-2xl font-bold text-text-primary mb-4">AI가 생성한 카테고리 검토</h2>
        <p className="text-text-muted mb-4">AI가 업종에 맞게 제안한 카테고리입니다. 확인 후 적용해주세요.</p>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-border-color rounded-xl p-4 mb-4">
          <ul className="space-y-2">
            {categories.map((cat, idx) => (
              <li key={idx} className="flex justify-between items-center p-3 bg-surface-subtle rounded-lg">
                <span className="font-semibold text-text-primary">{cat.name}</span>
                <span className="text-sm text-text-muted">{cat.level1} &gt; {cat.level2} {cat.costGroup ? `> ${cat.costGroup}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onConfirm(categories)}
            className="px-6 py-2 bg-brand-primary text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryReviewModal;
