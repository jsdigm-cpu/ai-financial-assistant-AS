import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '../types';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (transaction: Transaction) => void;
}

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
  
  const formatDate = (date: Date) => date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Memoize category lists to prevent re-filtering on every render
  const incomeCategories = useMemo(() => categories.filter(c => c.type.includes('income')), [categories]);
  const expenseCategories = useMemo(() => categories.filter(c => c.type.includes('expense')), [categories]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-surface-subtle">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-text-muted uppercase tracking-wider">거래일시</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-text-muted uppercase tracking-wider">적요</th>
              <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-text-muted uppercase tracking-wider">출금액</th>
              <th scope="col" className="px-6 py-4 text-right text-sm font-bold text-text-muted uppercase tracking-wider">입금액</th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-text-muted uppercase tracking-wider">카테고리</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-border-color/50">
            {paginatedTransactions.map((tx) => {
              const availableCategories = tx.credit > 0 ? incomeCategories : expenseCategories;

              return (
                <tr key={tx.id} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap text-base font-medium text-text-primary">{formatDate(tx.date)}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-base font-medium text-text-muted max-w-xs truncate" title={tx.description}>{tx.description}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-base text-right text-red-600 font-bold">
                    {tx.debit > 0 ? tx.debit.toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-base text-right text-emerald-600 font-bold">
                    {tx.credit > 0 ? tx.credit.toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-base">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="bg-surface-subtle border border-border-color rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-text-primary text-sm font-medium cursor-pointer transition-shadow"
                    >
                      {availableCategories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedTransactions.length === 0 && (
            <div className="text-center py-12 text-text-muted font-medium text-lg bg-surface-subtle/30">
                표시할 거래 내역이 없습니다.
            </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex flex-col sm:flex-row items-center justify-between border-t border-border-color px-6 py-4 bg-white gap-4">
           <div className="flex items-center">
            <label htmlFor="rowsPerPage" className="text-sm font-bold text-text-muted mr-3">페이지당 행 수:</label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page
              }}
              className="bg-surface-subtle border border-border-color rounded-lg px-3 py-1.5 text-sm font-bold text-text-primary cursor-pointer focus:ring-2 focus:ring-brand-primary"
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-border-color text-sm font-bold rounded-xl text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              이전
            </button>
            <span className="text-sm font-bold text-text-muted">
              {currentPage} <span className="mx-1 font-normal">/</span> {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-border-color text-sm font-bold rounded-xl text-text-primary bg-white hover:bg-surface-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              다음
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default TransactionsTable;