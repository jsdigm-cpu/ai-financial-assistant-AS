import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category, CategoryRule } from '../../types';
import { CATEGORY_MAP } from '../../constants';

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
  onUpdateTransaction?: (tx: Transaction) => void;
}

type Tab = 'classify' | 'categories' | 'rules';

const typeLabels: Record<Category['type'], string> = {
  operating_income: '영업 수익',
  non_operating_income: '영업외 수익',
  operating_expense: '영업 비용',
  non_operating_expense: '사업외 지출',
};

const typeColors: Record<Category['type'], string> = {
  operating_income: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  non_operating_income: 'bg-teal-100 text-teal-700 border-teal-200',
  operating_expense: 'bg-red-100 text-red-700 border-red-200',
  non_operating_expense: 'bg-orange-100 text-orange-700 border-orange-200',
};

// 항상 세자리마다 쉼표 표시 (자릿수 혼동 방지)
const fmt = (v: number) => {
  if (v === 0) return '-';
  return v.toLocaleString('ko-KR') + '원';
};

const CategoryManagementView: React.FC<Props> = ({
  transactions,
  categories,
  rules,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onMoveCategory,
  onAddRule,
  onDeleteRule,
  onUpdateTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('classify');

  // ── 거래 분류 탭 상태 ──
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'unclassified'>('unclassified');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('전체');
  const [draggingTxId, setDraggingTxId] = useState<string | null>(null);
  const [dropTargetCat, setDropTargetCat] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(1);
  const TX_PAGE_SIZE = 50;

  // ── 카테고리 편집 탭 상태 ──
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<Category['type']>('operating_expense');
  const [newCatCostGroup, setNewCatCostGroup] = useState<string>('변동비');
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggingCatName, setDraggingCatName] = useState<string | null>(null);

  // ── 규칙 탭 상태 ──
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleAddedMsg, setRuleAddedMsg] = useState<string | null>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── 카테고리별 거래 집계 ──
  const catStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    categories.forEach(c => { stats[c.name] = { count: 0, total: 0 }; });
    transactions.forEach(t => {
      if (stats[t.category]) {
        stats[t.category].count++;
        stats[t.category].total += t.credit > 0 ? t.credit : t.debit;
      }
    });
    return stats;
  }, [transactions, categories]);

  // 미분류 개수
  const unclassifiedCats = useMemo(() => {
    return new Set(
      categories.filter(c => CATEGORY_MAP[c.name] === undefined && c.name !== '기타매출' && c.name !== '기타사업비').map(c => c.name)
    );
  }, [categories]);

  const unclassifiedCount = useMemo(() => {
    return transactions.filter(t => t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류').length;
  }, [transactions]);

  // ── 필터된 거래 목록 ──
  const filteredTxs = useMemo(() => {
    let txs = transactions;
    if (txFilter === 'unclassified') {
      txs = txs.filter(t => t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류');
    }
    if (selectedCatFilter !== '전체') {
      txs = txs.filter(t => t.category === selectedCatFilter);
    }
    if (txSearch) {
      txs = txs.filter(t => t.description.toLowerCase().includes(txSearch.toLowerCase()));
    }
    return txs;
  }, [transactions, txFilter, selectedCatFilter, txSearch]);

  const pagedTxs = useMemo(() => {
    const start = (txPage - 1) * TX_PAGE_SIZE;
    return filteredTxs.slice(start, start + TX_PAGE_SIZE);
  }, [filteredTxs, txPage]);

  const totalTxPages = Math.ceil(filteredTxs.length / TX_PAGE_SIZE);

  // ── 드래그앤드롭: 거래 → 카테고리 ──
  const handleTxDragStart = (e: React.DragEvent, txId: string) => {
    setDraggingTxId(txId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragOver = (e: React.DragEvent, catName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetCat(catName);
  };

  const handleCatDrop = (e: React.DragEvent, catName: string) => {
    e.preventDefault();
    setDropTargetCat(null);
    if (!draggingTxId || !onUpdateTransaction) return;
    const tx = transactions.find(t => t.id === draggingTxId);
    if (tx) onUpdateTransaction({ ...tx, category: catName });
    setDraggingTxId(null);
  };

  // ── 드래그앤드롭: 카테고리 순서 변경 ──
  const handleCatItemDragStart = (e: React.DragEvent, catName: string) => {
    setDraggingCatName(catName);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox 등 일부 브라우저는 setData 없이 드래그가 시작되지 않음
    e.dataTransfer.setData('text/plain', catName);
  };

  const handleCatItemDrop = (e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData('text/plain') || draggingCatName;
    if (source && source !== targetName) {
      onMoveCategory(source, targetName);
    }
    setDraggingCatName(null);
  };

  // ── 인라인 카테고리명 수정 ──
  const startRename = (catName: string) => {
    setRenamingCat(catName);
    setRenameValue(catName);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = () => {
    if (renamingCat && renameValue.trim() && renameValue.trim() !== renamingCat) {
      onRenameCategory(renamingCat, renameValue.trim());
    }
    setRenamingCat(null);
    setRenameValue('');
  };

  // ── 새 카테고리 추가 ──
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const level1 = newCatType.includes('income') ? '수입' : '지출';
    const level2 = typeLabels[newCatType];
    onAddCategory({
      name: newCatName.trim(),
      level1,
      level2,
      costGroup: newCatType === 'operating_expense' ? (newCatCostGroup as any) : null,
      type: newCatType,
    });
    setNewCatName('');
  };

  // ── 규칙 추가 ──
  const handleAddRule = () => {
    if (!newRuleKeyword.trim() || !newRuleCategory) return;
    const keyword = newRuleKeyword.trim();
    const matchCount = transactions.filter(t =>
      t.description.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    onAddRule({ keyword, category: newRuleCategory, source: 'manual' });
    setNewRuleKeyword('');
    const msg = matchCount > 0
      ? `✓ "${keyword}" 규칙 추가 완료 — ${matchCount}건 자동 재분류됨`
      : `✓ "${keyword}" 규칙이 추가되었습니다 (해당 거래 없음)`;
    setRuleAddedMsg(msg);
    setTimeout(() => setRuleAddedMsg(null), 3500);
  };

  const handleAddRuleFromDescription = (desc: string, catName: string) => {
    const matchCount = transactions.filter(t =>
      t.description.toLowerCase().includes(desc.toLowerCase())
    ).length;
    onAddRule({ keyword: desc, category: catName, source: 'manual' });
    const msg = matchCount > 0
      ? `✓ "${desc}" 규칙 추가 — ${matchCount}건 자동 재분류됨`
      : `✓ "${desc}" 규칙이 추가되었습니다`;
    setRuleAddedMsg(msg);
    setTimeout(() => setRuleAddedMsg(null), 3500);
    setActiveTab('rules');
  };

  // 카테고리 타입별 그룹
  const categoryGroups = useMemo(() => {
    const groups: Partial<Record<Category['type'], Category[]>> = {};
    categories.forEach(c => {
      if (!groups[c.type]) groups[c.type] = [];
      groups[c.type]!.push(c);
    });
    return groups;
  }, [categories]);

  const filteredRules = useMemo(() => {
    if (!ruleSearch) return rules;
    return rules.filter(r => r.keyword.toLowerCase().includes(ruleSearch.toLowerCase()) || r.category.toLowerCase().includes(ruleSearch.toLowerCase()));
  }, [rules, ruleSearch]);

  const typeOrder: Category['type'][] = ['operating_income', 'non_operating_income', 'operating_expense', 'non_operating_expense'];
  const COST_GROUP_ORDER = ['인건비', '재료비', '고정비', '변동비'];

  return (
    <div className="space-y-4">
      {/* 규칙 추가 완료 알림 */}
      {ruleAddedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-fadeIn">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {ruleAddedMsg}
        </div>
      )}
      {/* 탭 */}
      <div className="bg-white rounded-2xl border border-border-color p-1 flex gap-1">
        {([
          { id: 'classify', label: '거래 분류', icon: 'swap_horiz', badge: unclassifiedCount > 0 ? unclassifiedCount : undefined },
          { id: 'categories', label: '카테고리 편집', icon: 'category' },
          { id: 'rules', label: '자동 분류 규칙', icon: 'rule', badge: rules.length > 0 ? rules.length : undefined },
        ] as { id: Tab; label: string; icon: string; badge?: number }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-subtle hover:text-text-primary'}`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 탭1: 거래 분류 ── */}
      {activeTab === 'classify' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* 좌: 카테고리 드롭존 */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-border-color p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            <p className="text-sm font-bold text-text-muted flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">info</span>
              거래 행을 드래그해서 아래 카테고리에 놓으세요
            </p>
            {typeOrder.map(type => {
              const cats = categoryGroups[type];
              if (!cats || cats.length === 0) return null;
              return (
                <div key={type}>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 px-1">{typeLabels[type]}</p>
                  <div className="space-y-1">
                    {cats.map(cat => {
                      const stats = catStats[cat.name] || { count: 0, total: 0 };
                      const isDropTarget = dropTargetCat === cat.name;
                      const isSelected = selectedCatFilter === cat.name;
                      return (
                        <div
                          key={cat.name}
                          onDragOver={(e) => handleCatDragOver(e, cat.name)}
                          onDragLeave={() => setDropTargetCat(null)}
                          onDrop={(e) => handleCatDrop(e, cat.name)}
                          onClick={() => setSelectedCatFilter(isSelected ? '전체' : cat.name)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                            isDropTarget
                              ? 'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary scale-[1.02]'
                              : isSelected
                              ? 'border-brand-primary bg-brand-primary/5'
                              : 'border-border-color bg-surface-subtle hover:border-brand-primary/40 hover:bg-surface-subtle/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${typeColors[cat.type]}`}>
                              {cat.level2.replace('영업 ', '').replace('사업외 ', '')}
                            </span>
                            <span className="text-sm font-semibold text-text-primary truncate">{cat.name}</span>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-xs font-bold text-brand-primary">{stats.count}건</span>
                            {stats.total > 0 && (
                              <p className="text-[10px] text-text-muted">{fmt(stats.total)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 우: 거래 목록 */}
          <div className="xl:col-span-3 bg-white rounded-2xl border border-border-color overflow-hidden flex flex-col">
            {/* 필터 바 */}
            <div className="p-4 border-b border-border-color space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => { setTxFilter('all'); setSelectedCatFilter('전체'); setTxPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${txFilter === 'all' ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-text-muted'}`}
                >
                  전체 ({transactions.length})
                </button>
                <button
                  onClick={() => { setTxFilter('unclassified'); setSelectedCatFilter('전체'); setTxPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${txFilter === 'unclassified' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'}`}
                >
                  미분류 ({unclassifiedCount})
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
                  <span className="material-symbols-outlined text-sm">search</span>
                </span>
                <input
                  type="text"
                  placeholder="적요 검색..."
                  value={txSearch}
                  onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                  className="w-full pl-9 pr-3 py-2 border border-border-color rounded-xl text-sm bg-surface-subtle"
                />
              </div>
            </div>

            {/* 거래 테이블 */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-subtle sticky top-0 z-10">
                  <tr className="border-b border-border-color">
                    <th className="py-2 px-2 text-left text-xs text-text-muted font-bold w-6"></th>
                    <th className="py-2 px-3 text-left text-xs text-text-muted font-bold">날짜</th>
                    <th className="py-2 px-3 text-left text-xs text-text-muted font-bold">적요</th>
                    <th className="py-2 px-3 text-right text-xs text-text-muted font-bold">금액</th>
                    <th className="py-2 px-3 text-left text-xs text-text-muted font-bold">카테고리</th>
                    <th className="py-2 px-2 text-center text-xs text-text-muted font-bold">규칙</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTxs.map(tx => {
                    const isUnclassified = tx.category === '기타매출' || tx.category === '기타사업비';
                    const isIncome = tx.credit > 0;
                    const availableCats = categories.filter(c => isIncome ? c.type.includes('income') : c.type.includes('expense'));
                    return (
                      <tr
                        key={tx.id}
                        draggable
                        onDragStart={(e) => handleTxDragStart(e, tx.id)}
                        onDragEnd={() => setDraggingTxId(null)}
                        className={`border-b border-border-color/40 hover:bg-surface-subtle/60 cursor-grab active:cursor-grabbing transition-colors ${
                          draggingTxId === tx.id ? 'opacity-40' : ''
                        } ${isUnclassified ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="py-2 px-2 text-text-muted">
                          <span className="material-symbols-outlined text-sm select-none">drag_indicator</span>
                        </td>
                        <td className="py-2 px-3 text-xs text-text-muted whitespace-nowrap">
                          {tx.date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 max-w-[200px]">
                          <span className="text-xs text-text-primary font-medium truncate block" title={tx.description}>
                            {tx.description}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{fmt(isIncome ? tx.credit : tx.debit)}
                        </td>
                        <td className="py-2 px-3">
                          {onUpdateTransaction ? (
                            <select
                              value={tx.category}
                              onChange={(e) => onUpdateTransaction({ ...tx, category: e.target.value })}
                              className={`text-xs border rounded-lg px-2 py-1 cursor-pointer transition-all max-w-[160px] ${
                                isUnclassified
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 font-bold'
                                  : 'border-border-color bg-surface-subtle text-text-primary'
                              }`}
                            >
                              {isIncome ? (
                                <>
                                  <optgroup label="── 영업 수익">
                                    {availableCats.filter(c => c.level2 === '영업 수익').map(cat => (
                                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="── 영업외 수익">
                                    {availableCats.filter(c => c.level2 === '영업외 수익').map(cat => (
                                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                  </optgroup>
                                </>
                              ) : (
                                <>
                                  {COST_GROUP_ORDER.map(grp => {
                                    const grpCats = availableCats.filter(c => c.level2 === '영업 비용' && c.costGroup === grp);
                                    if (!grpCats.length) return null;
                                    return (
                                      <optgroup key={grp} label={`── 영업비용 / ${grp}`}>
                                        {grpCats.map(cat => (
                                          <option key={cat.name} value={cat.name}>{cat.name}</option>
                                        ))}
                                      </optgroup>
                                    );
                                  })}
                                  <optgroup label="── 사업외 지출">
                                    {availableCats.filter(c => c.level2 === '사업외 지출').map(cat => (
                                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                  </optgroup>
                                </>
                              )}
                            </select>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-lg border ${typeColors[categories.find(c => c.name === tx.category)?.type || 'operating_expense']}`}>
                              {tx.category}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => {
                              setActiveTab('rules');
                              setNewRuleKeyword(tx.description);
                              setNewRuleCategory(tx.category);
                            }}
                            title="이 적요로 자동 분류 규칙 추가"
                            className="text-text-muted hover:text-brand-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add_circle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedTxs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-text-muted text-sm">
                        {txFilter === 'unclassified' ? '미분류 거래가 없습니다.' : '검색 결과가 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalTxPages > 1 && (
              <div className="p-3 border-t border-border-color flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">
                  {filteredTxs.length}건 중 {(txPage - 1) * TX_PAGE_SIZE + 1}-{Math.min(txPage * TX_PAGE_SIZE, filteredTxs.length)}건
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                    className="px-3 py-1 rounded-lg border border-border-color text-xs font-bold disabled:opacity-40">이전</button>
                  <span className="px-3 py-1 text-xs font-bold text-text-muted">{txPage}/{totalTxPages}</span>
                  <button onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} disabled={txPage === totalTxPages}
                    className="px-3 py-1 rounded-lg border border-border-color text-xs font-bold disabled:opacity-40">다음</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 탭2: 카테고리 편집 ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* 새 카테고리 추가 */}
          <div className="bg-white rounded-2xl border border-border-color p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-base">add_circle</span>
              새 카테고리 추가
            </h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="카테고리명"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 min-w-[150px] px-3 py-2 border border-border-color rounded-xl text-sm"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as Category['type'])}
                className="px-3 py-2 border border-border-color rounded-xl text-sm"
              >
                <option value="operating_income">영업 수익</option>
                <option value="non_operating_income">영업외 수익</option>
                <option value="operating_expense">영업 비용</option>
                <option value="non_operating_expense">사업외 지출</option>
              </select>
              {newCatType === 'operating_expense' && (
                <select
                  value={newCatCostGroup}
                  onChange={(e) => setNewCatCostGroup(e.target.value)}
                  className="px-3 py-2 border border-border-color rounded-xl text-sm"
                >
                  <option value="인건비">인건비</option>
                  <option value="재료비">재료비</option>
                  <option value="고정비">고정비</option>
                  <option value="변동비">변동비</option>
                </select>
              )}
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-secondary transition-colors"
              >
                추가
              </button>
            </div>
          </div>

          {/* 카테고리 목록 - 타입별 그룹 */}
          {typeOrder.map(type => {
            const cats = categoryGroups[type];
            if (!cats || cats.length === 0) return null;
            return (
              <div key={type} className="bg-white rounded-2xl border border-border-color p-5">
                <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 px-2 py-1 rounded-lg w-fit ${typeColors[type]}`}>
                  {typeLabels[type]}
                  <span className="opacity-70">({cats.length}개)</span>
                </h3>
                <div className="space-y-2">
                  {cats.map(cat => {
                    const stats = catStats[cat.name] || { count: 0, total: 0 };
                    const isRenaming = renamingCat === cat.name;
                    return (
                      <div
                        key={cat.name}
                        draggable
                        onDragStart={(e) => handleCatItemDragStart(e, cat.name)}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleCatItemDrop(e, cat.name)}
                        onDragEnd={() => setDraggingCatName(null)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          draggingCatName === cat.name ? 'opacity-40 border-dashed border-brand-primary' : 'border-border-color bg-surface-subtle hover:border-brand-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="material-symbols-outlined text-text-muted text-sm cursor-grab select-none">drag_indicator</span>
                          {isRenaming ? (
                            <input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') { setRenamingCat(null); }
                              }}
                              className="flex-1 px-2 py-1 border-2 border-brand-primary rounded-lg text-sm font-bold"
                            />
                          ) : (
                            <span className="text-sm font-bold text-text-primary truncate">{cat.name}</span>
                          )}
                          {cat.costGroup && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full border border-gray-200">
                              {cat.costGroup}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <span className="text-xs font-bold text-brand-primary">{stats.count}건</span>
                            {stats.total > 0 && <p className="text-[10px] text-text-muted">{fmt(stats.total)}</p>}
                          </div>
                          <button
                            onClick={() => startRename(cat.name)}
                            className="text-text-muted hover:text-brand-primary transition-colors p-1"
                            title="이름 변경"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat)}
                            className="text-text-muted hover:text-red-500 transition-colors p-1"
                            title="삭제"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 탭3: 자동 분류 규칙 ── */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* 새 규칙 추가 */}
          <div className="bg-white rounded-2xl border border-border-color p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-base">add_circle</span>
              새 규칙 추가
              <span className="text-xs font-normal text-text-muted">— 적요에 키워드가 포함된 거래를 자동으로 분류합니다</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="키워드 (예: 스타벅스, 배달의민족)"
                value={newRuleKeyword}
                onChange={(e) => setNewRuleKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                className="flex-1 min-w-[200px] px-3 py-2 border border-border-color rounded-xl text-sm"
              />
              <select
                value={newRuleCategory}
                onChange={(e) => setNewRuleCategory(e.target.value)}
                className="flex-1 min-w-[150px] px-3 py-2 border border-border-color rounded-xl text-sm"
              >
                <option value="">카테고리 선택</option>
                {typeOrder.map(type => (
                  <optgroup key={type} label={typeLabels[type]}>
                    {(categoryGroups[type] || []).map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                onClick={handleAddRule}
                disabled={!newRuleKeyword.trim() || !newRuleCategory}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-secondary transition-colors disabled:opacity-50"
              >
                규칙 추가
              </button>
            </div>
            {newRuleKeyword && newRuleCategory && (() => {
              const previewCount = transactions.filter(t =>
                t.description.toLowerCase().includes(newRuleKeyword.toLowerCase())
              ).length;
              return (
                <p className="mt-2 text-xs text-brand-primary font-medium">
                  ✓ "{newRuleKeyword}"가 포함된 거래 → <strong>{newRuleCategory}</strong> 로 즉시 재분류
                  {previewCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-brand-primary/10 rounded-full font-bold">{previewCount}건 해당</span>}
                </p>
              );
            })()}
          </div>

          {/* 규칙 검색 + 목록 */}
          <div className="bg-white rounded-2xl border border-border-color p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary text-base">rule</span>
                자동 분류 규칙 목록
                <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full">{rules.length}개</span>
              </h3>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-text-muted">
                  <span className="material-symbols-outlined text-sm">search</span>
                </span>
                <input
                  type="text"
                  placeholder="키워드/카테고리 검색"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-border-color rounded-xl text-sm w-48"
                />
              </div>
            </div>

            {filteredRules.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm">
                {ruleSearch ? '검색 결과가 없습니다.' : '등록된 규칙이 없습니다.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredRules.map((rule, idx) => {
                  const catType = categories.find(c => c.name === rule.category)?.type;
                  return (
                    <div
                      key={`${rule.keyword}-${idx}`}
                      className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-border-color hover:border-brand-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rule.source === 'manual' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {rule.source === 'manual' ? '수동' : 'AI'}
                        </span>
                        <code className="text-sm font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border-color truncate">
                          {rule.keyword}
                        </code>
                        <span className="text-text-muted text-sm">→</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${catType ? typeColors[catType] : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {rule.category}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteRule(rule)}
                        className="text-text-muted hover:text-red-500 transition-colors p-1 ml-2 shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementView;
