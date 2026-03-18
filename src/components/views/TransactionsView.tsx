import React, { useState } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import TransactionsTable from '../TransactionsTable';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
  onUpdateTransaction: (updatedTx: Transaction) => void;
}

const TransactionsView: React.FC<Props> = ({ transactions, businessInfo, categories, onUpdateTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '전체' || tx.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ['전체', ...new Set(categories.map(c => c.name))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-border-color">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
            <span className="material-symbols-outlined text-lg">search</span>
          </span>
          <input
            type="text"
            placeholder="거래처 또는 내용 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-xl bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm font-medium text-text-muted whitespace-nowrap">카테고리 필터:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full md:w-48 py-2 px-3 border border-border-color rounded-xl bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border-color overflow-hidden">
        <TransactionsTable 
          transactions={filteredTransactions} 
          categories={categories} 
          onUpdateTransaction={onUpdateTransaction} 
        />
      </div>
    </div>
  );
};

export default TransactionsView;
