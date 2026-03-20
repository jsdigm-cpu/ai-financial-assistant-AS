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

// 대분류 그룹 정의 (표시 순서)
const LEVEL2_GROUPS = [
  { key: '영업 수익', label: '영업 수익', forIncome: true },
  { key: '영업외 수익', label: '영업외 수익', forIncome: true },
  { key: '영업 비용', label: '영업 비용', forIncome: false },
  { key: '사업외 지출', label: '사업외 지출', forIncome: false },
];

// costGroup 서브그룹 (영업 비용 내에서만 사용)
const COST_GROUP_ORDER = ['인건비', '재료비', '고정비', '변동비'];

interface HierarchyCellProps {
  tx: Transaction;
  categories: Category[];
  onUpdate: (txId: string, newCategory: string) => void;
}

const HierarchyCategoryCell: React.FC<HierarchyCellProps> = ({ tx, categories, onUpdate }) => {
  const isIncome = tx.credit > 0;
  const currentCat = CATEGORY_MAP[tx.category] ?? categories.find(c => c.name === tx.category);

  // 현재 카테고리의 대분류 결정
  const currentLevel2 = currentCat?.level2 ?? (isIncome ? '영업 수익' : '영업 비용');
  const [selectedLevel2, setSelectedLevel2] = useState<string>(currentLevel2);

  // 트랜잭션이 바뀌면 level2 상태도 동기화
  useEffect(() => {
    const cat = CATEGORY_MAP[tx.category] ?? categories.find(c => c.name === tx.category);
    const l2 = cat?.level2 ?? (tx.credit > 0 ? '영업 수익' : '영업 비용');
    setSelectedLevel2(l2);
  }, [tx.category, tx.credit, categories]);

  // 현재 거래에 맞는 대분류 목록
  const availableLevel2Groups = LEVEL2_GROUPS.filter(g => g.forIncome === isIncome);

  // 선택된 대분류에 속하는 카테고리 목록
  const filteredCats = useMemo(() => {
    return categories.filter(c => {
      const inIncomeSide = isIncome ? c.type.includes('income') : c.type.includes('expense');
      return inIncomeSide && c.level2 === selectedLevel2;
    });
  }, [categories, isIncome, selectedLevel2]);

  const isUnclassified = tx.category === '기타매출' || tx.category === '기타사업비';

  // 대분류 변경 시: 해당 그룹의 첫 번째 카테고리로 자동 이동
  const handleLevel2Change = (newLevel2: string) => {
    setSelectedLevel2(newLevel2);
    const firstCatInGroup = categories.find(c => {
      const inIncomeSide = isIncome ? c.type.includes('income') : c.type.includes('expense');
      return inIncomeSide && c.level2 === newLevel2;
    });
    if (firstCatInGroup) {
      onUpdate(tx.id, firstCatInGroup.name);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    onUpdate(tx.id, newCat);
  };

  // 영업 비용 내에서 costGroup으로 서브그룹 나누기
  const renderCategoryOptions = () => {
    if (selectedLevel2 === '영업 비용') {
      const grouped: Record<string, Category[]> = {};
      COST_GROUP_ORDER.forEach(g => { grouped[g] = []; });
      grouped['기타'] = [];
      filteredCats.forEach(c => {
        const grp = c.costGroup ?? '기타';
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(c);
      });
      return COST_GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(grp => (
        <optgroup key={grp} label={`── ${grp}`}>
          {grouped[grp].map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </optgroup>
      ));
    }
    return filteredCats.map(cat => (
      <option key={cat.name} value={cat.name}>{cat.name}</option>
    ));
  };

  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      {/* 대분류 선택 */}
      <select
        value={selectedLevel2}
        onChange={(e) => handleLevel2Change(e.target.value)}
        className={`text-[10px] font-bold border rounded-md px-1.5 py-0.5 cursor-pointer transition-all focus:ring-1 focus:ring-brand-primary/30 ${
          isIncome
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}
      >
        {availableLevel2Groups.map(g => (
          <option key={g.key} value={g.key}>{g.label}</option>
        ))}
      </select>
      {/* 세부 카테고리 선택 */}
      <select
        value={filteredCats.some(c => c.name === tx.category) ? tx.category : (filteredCats[0]?.name ?? tx.category)}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className={`border rounded-lg px-2 py-1 text-sm font-medium cursor-pointer transition-all focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary ${
          isUnclassified
            ? 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
            : 'border-border-color bg-surface-subtle text-text-primary'
        }`}
      >
        {renderCategoryOptions()}
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
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">카테고리 (대분류 → 세부)</th>
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
                    <HierarchyCategoryCell
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
