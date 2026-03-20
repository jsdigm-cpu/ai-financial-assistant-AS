import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { CATEGORY_MAP } from '../constants';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (transaction: Transaction) => void;
}

const fmt = (v: number) => v.toLocaleString('ko-KR');

const TransactionsTable: React.FC<Props> = ({ transactions, categories, onUpdateTransaction }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return transactions.slice(startIndex, startIndex + rowsPerPage);
  }, [transactions, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(transactions.length / rowsPerPage);

  const handleCategoryChange = (txId: string, newCategory: string) => {
    const txToUpdate = transactions.find(tx => tx.id === txId);
    if (txToUpdate) {
      onUpdateTransaction({ ...txToUpdate, category: newCategory });
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const incomeCategories = useMemo(() => categories.filter(c => c.type.includes('income')), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type.includes('expense')), [categories]);

  const isUnclassified = (tx: Transaction) =>
    tx.category === '기타매출' || tx.category === '기타사업비';

  const getCatColor = (cat: string) => {
    const type = CATEGORY_MAP[cat]?.type;
    if (!type) return '';
    if (type === 'operating_income') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (type === 'non_operating_income') return 'text-teal-700 bg-teal-50 border-teal-200';
    if (type === 'operating_expense') return 'text-red-700 bg-red-50 border-red-200';
    if (type === 'non_operating_expense') return 'text-orange-700 bg-orange-50 border-orange-200';
    return '';
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-surface-subtle">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">거래일시</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">적요</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">출금액</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">입금액</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase tracking-wider">잔액</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">카테고리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-color/40">
            {paginatedTransactions.map((tx) => {
              const availableCategories = tx.credit > 0 ? incomeCategories : expenseCategories;
              const unclassified = isUnclassified(tx);

              return (
                <tr
                  key={tx.id}
                  className={`hover:bg-surface-subtle/60 transition-colors ${unclassified ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm font-medium text-text-primary">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-text-muted max-w-xs">
                    <span className="block truncate font-medium" title={tx.description}>
                      {tx.description}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                    {tx.debit > 0 ? fmt(tx.debit) : '-'}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm text-right text-emerald-600 font-bold">
                    {tx.credit > 0 ? fmt(tx.credit) : '-'}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sm text-right text-text-muted font-medium">
                    {tx.balance > 0 ? fmt(tx.balance) : '-'}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className={`border rounded-lg px-2.5 py-1 text-sm font-medium cursor-pointer transition-all focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${
                        unclassified
                          ? 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
                          : 'border-border-color bg-surface-subtle text-text-primary'
                      }`}
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    {unclassified && (
                      <span className="ml-1 text-[10px] text-amber-500 font-bold">미분류</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedTransactions.length === 0 && (
          <div className="text-center py-12 text-text-muted font-medium bg-surface-subtle/30">
            표시할 거래 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      <nav className="flex flex-col sm:flex-row items-center justify-between border-t border-border-color px-5 py-3 bg-white gap-3">
        <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
          <span>전체 {transactions.length.toLocaleString()}건</span>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-text-muted">페이지당:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-surface-subtle border border-border-color rounded-lg px-2 py-1 text-xs font-bold text-text-primary cursor-pointer"
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1.5 border border-border-color text-sm font-bold rounded-lg text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-40 transition-colors"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-border-color text-sm font-bold rounded-lg text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-40 transition-colors"
            >
              이전
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 text-sm font-bold rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-brand-primary text-white'
                        : 'border border-border-color text-text-muted hover:bg-surface-subtle'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-border-color text-sm font-bold rounded-lg text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-40 transition-colors"
            >
              다음
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1.5 border border-border-color text-sm font-bold rounded-lg text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-40 transition-colors"
            >
              »
            </button>
          </div>
        )}
      </nav>
    </div>
  );
};

export default TransactionsTable;
