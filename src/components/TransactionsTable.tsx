import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { CATEGORY_MAP } from '../constants';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onUpdateTransaction: (transaction: Transaction) => void;
}

// 항상 세자리마다 쉼표 표시 (자릿수 혼동 방지)
const fmt = (v: number) => v.toLocaleString('ko-KR');

// costGroup 서브그룹 (영업 비용 내에서만 사용)
const COST_GROUP_ORDER = ['인건비', '재료비', '고정비', '변동비'];

interface CategoryCellProps {
  tx: Transaction;
  categories: Category[];
  onUpdate: (txId: string, newCategory: string) => void;
}

// 세부 카테고리만 표시하는 단일 드롭다운 (optgroup으로 대분류 구분)
const CategoryCell: React.FC<CategoryCellProps> = ({ tx, categories, onUpdate }) => {
  const isIncome = tx.credit > 0;
  const isUnclassified = tx.category === '기타매출' || tx.category === '기타사업비';

  // 입금/출금에 맞는 카테고리만
  const relevantCats = useMemo(() =>
    categories.filter(c => isIncome ? c.type.includes('income') : c.type.includes('expense')),
    [categories, isIncome]
  );

  // 대분류별 그룹화
  const grouped = useMemo(() => {
    const map: Record<string, Category[]> = {};
    relevantCats.forEach(c => {
      const key = c.level2 ?? '기타';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [relevantCats]);

  const groupOrder = isIncome
    ? ['영업 수익', '영업외 수익']
    : ['영업 비용', '사업외 지출'];

  const handleChange = (newCat: string) => {
    onUpdate(tx.id, newCat);
  };

  // 현재 선택값: 해당 카테고리가 목록에 없으면 tx.category 그대로 표시
  const currentValue = tx.category;

  return (
    <div className="flex flex-col gap-0.5 min-w-[150px]">
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`border rounded-lg px-2 py-0.5 text-sm font-medium cursor-pointer transition-all focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${
          isUnclassified
            ? 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
            : 'border-border-color bg-surface-subtle text-text-primary'
        }`}
      >
        {/* 현재 값이 목록에 없으면 임시 옵션으로 표시 */}
        {!relevantCats.some(c => c.name === currentValue) && (
          <option value={currentValue}>{currentValue}</option>
        )}
        {groupOrder.filter(g => grouped[g]?.length > 0).map(grp => {
          if (grp === '영업 비용') {
            // costGroup 서브그룹
            const subGrouped: Record<string, Category[]> = {};
            COST_GROUP_ORDER.forEach(g => { subGrouped[g] = []; });
            subGrouped['기타'] = [];
            grouped[grp].forEach(c => {
              const sg = c.costGroup ?? '기타';
              if (!subGrouped[sg]) subGrouped[sg] = [];
              subGrouped[sg].push(c);
            });
            return COST_GROUP_ORDER.filter(sg => subGrouped[sg]?.length > 0).map(sg => (
              <optgroup key={`${grp}-${sg}`} label={`${grp} › ${sg}`}>
                {subGrouped[sg].map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </optgroup>
            ));
          }
          return (
            <optgroup key={grp} label={grp}>
              {grouped[grp].map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </optgroup>
          );
        })}
      </select>
      {isUnclassified && (
        <span className="text-[9px] text-amber-500 font-bold">미분류</span>
      )}
    </div>
  );
};

const TransactionsTable: React.FC<Props> = ({ transactions, categories, onUpdateTransaction }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  // 거래 ID 목록이 바뀔 때만 (새 데이터 로드, 필터 변경) 첫 페이지로 이동
  // 카테고리 수정처럼 ID 목록이 동일할 때는 페이지 유지
  const txIdsKey = useMemo(() => transactions.map(t => t.id).join(','), [transactions]);
  useEffect(() => {
    setCurrentPage(1);
  }, [txIdsKey]);

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

  // 페이지 버튼 계산 (최대 10개)
  const maxPageButtons = 10;
  const pageButtons = useMemo(() => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = Math.floor(maxPageButtons / 2);
    let start = currentPage - half;
    let end = currentPage + half - 1;
    if (start < 1) { start = 1; end = maxPageButtons; }
    if (end > totalPages) { end = totalPages; start = totalPages - maxPageButtons + 1; }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

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
              const isUnclassified = tx.category === '기타매출' || tx.category === '기타사업비';

              return (
                <tr
                  key={tx.id}
                  className={`hover:bg-surface-subtle/60 transition-colors ${isUnclassified ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-4 py-1 whitespace-nowrap text-sm font-medium text-text-primary">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-1 text-sm text-text-muted max-w-xs">
                    <span className="block truncate font-medium" title={tx.description}>
                      {tx.description}
                    </span>
                  </td>
                  <td className="px-4 py-1 whitespace-nowrap text-sm text-right text-red-600 font-bold">
                    {tx.debit > 0 ? fmt(tx.debit) : '-'}
                  </td>
                  <td className="px-4 py-1 whitespace-nowrap text-sm text-right text-emerald-600 font-bold">
                    {tx.credit > 0 ? fmt(tx.credit) : '-'}
                  </td>
                  <td className="px-4 py-1 whitespace-nowrap text-sm text-right text-text-muted font-medium">
                    {tx.balance > 0 ? fmt(tx.balance) : '-'}
                  </td>
                  <td className="px-4 py-1 whitespace-nowrap">
                    <CategoryCell
                      tx={tx}
                      categories={categories}
                      onUpdate={handleCategoryChange}
                    />
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
              {pageButtons.map(page => (
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
              ))}
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
