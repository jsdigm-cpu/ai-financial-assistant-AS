import React, { useState } from 'react';
import { Transaction, Category, CategoryRule } from '../../types';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  rules: CategoryRule[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onMoveCategory: (draggedName: string, targetName: string) => void;
  onAddRule: (rule: CategoryRule) => void;
  onDeleteRule: (rule: CategoryRule) => void;
}

const CategoryManagementView: React.FC<Props> = ({ 
  transactions, 
  categories, 
  rules, 
  onAddCategory, 
  onDeleteCategory, 
  onRenameCategory, 
  onMoveCategory, 
  onAddRule, 
  onDeleteRule 
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<Category['type']>('operating_expense');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName) return;
    const level1 = newCategoryType.includes('income') ? '수입' : '지출';
    const level2 = newCategoryType === 'operating_income' ? '영업 수익' : 
                   newCategoryType === 'non_operating_income' ? '영업외 수익' :
                   newCategoryType === 'operating_expense' ? '영업 비용' : '사업외 지출';
    
    onAddCategory({
      name: newCategoryName,
      level1,
      level2,
      costGroup: level2 === '영업 비용' ? '변동비' : null,
      type: newCategoryType
    });
    setNewCategoryName('');
  };

  const handleAddRule = () => {
    if (!newRuleKeyword || !newRuleCategory) return;
    onAddRule({
      keyword: newRuleKeyword,
      category: newRuleCategory,
      source: 'manual'
    });
    setNewRuleKeyword('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">category</span>
          카테고리 관리
        </h3>
        
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="새 카테고리명" 
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 px-3 py-2 border border-border-color rounded-xl text-sm"
          />
          <select 
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value as any)}
            className="px-3 py-2 border border-border-color rounded-xl text-sm"
          >
            <option value="operating_income">영업 수익</option>
            <option value="non_operating_income">영업외 수익</option>
            <option value="operating_expense">영업 비용</option>
            <option value="non_operating_expense">사업외 지출</option>
          </select>
          <button 
            onClick={handleAddCategory}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold"
          >
            추가
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {categories.map(cat => (
            <div key={cat.name} className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-border-color">
              <div>
                <span className="text-sm font-bold text-text-primary">{cat.name}</span>
                <span className="ml-2 text-xs text-text-muted">({cat.level2})</span>
              </div>
              <button 
                onClick={() => onDeleteCategory(cat)}
                className="text-rose-500 hover:text-rose-700"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-primary">rule</span>
          자동 분류 규칙
        </h3>

        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="키워드 (예: 스타벅스)" 
            value={newRuleKeyword}
            onChange={(e) => setNewRuleKeyword(e.target.value)}
            className="flex-1 px-3 py-2 border border-border-color rounded-xl text-sm"
          />
          <select 
            value={newRuleCategory}
            onChange={(e) => setNewRuleCategory(e.target.value)}
            className="px-3 py-2 border border-border-color rounded-xl text-sm"
          >
            <option value="">카테고리 선택</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddRule}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold"
          >
            추가
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {rules.map((rule, idx) => (
            <div key={`${rule.keyword}-${idx}`} className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-border-color">
              <div>
                <span className="text-sm font-bold text-text-primary">"{rule.keyword}"</span>
                <span className="mx-2 text-text-muted">→</span>
                <span className="text-sm font-bold text-brand-primary">{rule.category}</span>
              </div>
              <button 
                onClick={() => onDeleteRule(rule)}
                className="text-rose-500 hover:text-rose-700"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementView;
