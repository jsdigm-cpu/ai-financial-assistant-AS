import React, { useState, useMemo } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import { CATEGORY_MAP } from '../../constants';
import TransactionsTable from '../TransactionsTable';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
  onUpdateTransaction: (updatedTx: Transaction) => void;
}

const fmt = (v: number) => {
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(0) + '만원';
  return v.toLocaleString('ko-KR') + '원';
};

const TransactionsView: React.FC<Props> = ({ transactions, businessInfo, categories, onUpdateTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [showUnclassifiedOnly, setShowUnclassifiedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txType, setTxType] = useState<'all' | 'income' | 'expense'>('all');

  const unclassifiedCount = useMemo(() =>
    transactions.filter(t => t.category === '기타매출' || t.category === '기타사업비').length,
    [transactions]
  );

  const totalIncome = useMemo(() => transactions.reduce((s, t) => s + t.credit, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.reduce((s, t) => s + t.debit, 0), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedCategory !== '전체' && tx.category !== selectedCategory) return false;
      if (showUnclassifiedOnly && tx.category !== '기타매출' && tx.category !== '기타사업비') return false;
      if (txType === 'income' && tx.credit <= 0) return false;
      if (txType === 'expense' && tx.debit <= 0) return false;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (tx.date < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1);
        if (tx.date >= to) return false;
      }
      return true;
    });
  }, [transactions, searchTerm, selectedCategory, showUnclassifiedOnly, txType, dateFrom, dateTo]);

  const uniqueCategories = useMemo(() =>
    ['전체', ...new Set(categories.map(c => c.name))],
    [categories]
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('전체');
    setShowUnclassifiedOnly(false);
    setTxType('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== '전체' || showUnclassifiedOnly || txType !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border-color shadow-sm">
          <p className="text-xs font-bold text-text-muted">총 거래건수</p>
          <p className="text-xl font-black text-text-primary">{transactions.length.toLocaleString()}건</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-bold text-text-muted">총 입금</p>
          <p className="text-xl font-black text-emerald-600">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm">
          <p className="text-xs font-bold text-text-muted">총 출금</p>
          <p className="text-xl font-black text-red-600">{fmt(totalExpense)}</p>
        </div>
        <div
          className={`bg-white p-4 rounded-2xl border shadow-sm cursor-pointer transition-all ${
            showUnclassifiedOnly ? 'border-amber-400 bg-amber-50' : unclassifiedCount > 0 ? 'border-amber-300' : 'border-border-color'
          }`}
          onClick={() => { setShowUnclassifiedOnly(!showUnclassifiedOnly); setSelectedCategory('전체'); }}
        >
          <p className="text-xs font-bold text-text-muted">미분류 거래</p>
          <p className={`text-xl font-black ${unclassifiedCount > 0 ? 'text-amber-600' : 'text-text-muted'}`}>
            {unclassifiedCount}건
          </p>
          {unclassifiedCount > 0 && (
            <p className="text-[10px] text-amber-500 font-medium mt-0.5">
              {showUnclassifiedOnly ? '▶ 필터 해제' : '▶ 클릭하여 필터'}
            </p>
          )}
        </div>
      </div>

      {/* 필터 패널 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-border-color space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* 검색 */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
              <span className="material-symbols-outlined text-sm">search</span>
            </span>
            <input
              type="text"
              placeholder="적요/거래처 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-border-color rounded-xl bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm"
            />
          </div>

          {/* 입출금 타입 */}
          <div className="flex rounded-xl overflow-hidden border border-border-color">
            {(['all', 'income', 'expense'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTxType(t)}
                className={`px-3 py-2 text-sm font-bold transition-colors ${
                  txType === t
                    ? t === 'income' ? 'bg-emerald-500 text-white' : t === 'expense' ? 'bg-red-500 text-white' : 'bg-brand-primary text-white'
                    : 'bg-white text-text-muted hover:bg-surface-subtle'
                }`}
              >
                {t === 'all' ? '전체' : t === 'income' ? '입금' : '출금'}
              </button>
            ))}
          </div>

          {/* 카테고리 필터 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 border border-border-color rounded-xl bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-sm min-w-[140px]"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="py-2 px-3 border border-border-color rounded-xl text-sm bg-surface-subtle"
            />
            <span className="text-text-muted text-sm">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="py-2 px-3 border border-border-color rounded-xl text-sm bg-surface-subtle"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-sm font-bold text-text-muted hover:text-red-500 border border-border-color rounded-xl hover:border-red-300 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              필터 초기화
            </button>
          )}
        </div>

        {showUnclassifiedOnly && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700 text-sm">
            <span className="material-symbols-outlined text-base">warning</span>
            <strong>미분류 거래 {unclassifiedCount}건</strong>을 표시 중입니다.
            카테고리 관리 탭에서 드래그앤드롭으로 분류하거나, 아래에서 직접 변경하세요.
          </div>
        )}

        {filteredTransactions.length !== transactions.length && (
          <p className="text-xs text-text-muted font-medium">
            전체 {transactions.length}건 중 <strong className="text-brand-primary">{filteredTransactions.length}건</strong> 표시
          </p>
        )}
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
