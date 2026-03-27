import React, { useState, useMemo, useRef } from 'react';
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

const fmt = (v: number) => {
  if (v === 0) return '-';
  return v.toLocaleString('ko-KR') + '원';
};

const COST_GROUP_ORDER = ['인건비', '재료비', '고정비', '변동비'];

// ── B-4: 간단한 카테고리 추론 ──
function guessCategory(description: string, isIncome: boolean): string {
  const desc = description.toLowerCase();
  if (isIncome) {
    if (/배달|요기요|쿠팡이츠|배민|배달의민족/.test(desc)) return '배달매출';
    if (/카드매출|카드결제|신용카드수납|pos/.test(desc)) return '카드매출';
    if (/지역화폐|지역사랑상품권|온누리/.test(desc)) return '지역화폐';
    if (/지원금|보조금|지원사업/.test(desc)) return '정부지원금';
    if (/페이|pay|간편결제|카카오페이|네이버페이/.test(desc)) return '간편결제';
    return '기타매출';
  } else {
    if (/급여|임금|월급|알바|아르바이트|4대보험/.test(desc)) return '인건비(정규)';
    if (/식자재|농산|수산|청과|정육|마트|이마트|롯데마트|홈플러스/.test(desc)) return '원재료(식자재)';
    if (/식용유|식용류|오일/.test(desc)) return '부자재(식용류)';
    if (/주류|소주|맥주|막걸리|와인/.test(desc)) return '부자재(주류)';
    if (/음료|콜라|사이다|커피원두/.test(desc)) return '부자재(음료)';
    if (/임대|월세|관리비|건물주/.test(desc)) return '임대료·관리비';
    if (/전기|한전|한국전력/.test(desc)) return '전기요금';
    if (/가스|도시가스/.test(desc)) return '도시가스비';
    if (/통신|sk텔레콤|kt|lg유플러스/.test(desc)) return '통신·IT비';
    if (/보험|삼성화재|현대해상|db손해/.test(desc)) return '보험료';
    if (/배달수수료|배달플랫폼수수료/.test(desc)) return '배달수수료';
    if (/광고|구글|페이스북|인스타|네이버광고/.test(desc)) return '광고비';
    if (/카드대금|신용카드대금/.test(desc)) return '신용카드대금';
    if (/병원|의원|약국|한의원/.test(desc)) return '의료비(병원·약국)';
    if (/주유|주유소|sk에너지|gs칼텍스/.test(desc)) return '유류비';
    if (/세금|부가세|소득세|법인세|공과금/.test(desc)) return '세금·공과금';
    return '기타사업비';
  }
}

// ── B-3: 카테고리 트리 아이템 (서브 컴포넌트) ──
interface CategoryTreeItemProps {
  cat: Category;
  stats: { count: number; total: number };
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement>;
  draggingCatName: string | null;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  cat, stats, isRenaming, renameValue, renameInputRef, draggingCatName,
  onRenameChange, onRenameCommit, onRenameCancel, onStartRename, onDelete,
  onDragStart, onDragOver, onDrop, onDragEnd,
}) => (
  <div
    draggable
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
      draggingCatName === cat.name
        ? 'opacity-40 border-dashed border-brand-primary'
        : 'border-border-color bg-surface-subtle hover:border-brand-primary/30'
    }`}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <span className="material-symbols-outlined text-text-muted text-sm cursor-grab select-none">drag_indicator</span>
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onBlur={onRenameCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameCommit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          className="flex-1 px-2 py-1 border-2 border-brand-primary rounded-lg text-sm font-bold"
        />
      ) : (
        <span className="text-sm font-bold text-text-primary truncate">{cat.name}</span>
      )}
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-2">
      <div className="text-right">
        <span className="text-xs font-bold text-brand-primary">{stats.count}건</span>
        {stats.total > 0 && (
          <p className="text-[10px] text-text-muted">{stats.total.toLocaleString('ko-KR')}원</p>
        )}
      </div>
      <button
        onClick={onStartRename}
        className="text-text-muted hover:text-brand-primary transition-colors p-1"
        title="이름 변경"
      >
        <span className="material-symbols-outlined text-sm">edit</span>
      </button>
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-red-500 transition-colors p-1"
        title="삭제"
      >
        <span className="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  </div>
);

// ── 메인 컴포넌트 ──
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
  const [classifyMode, setClassifyMode] = useState<'card' | 'table'>('card'); // B-1
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set()); // B-3

  // ── 규칙 탭 상태 ──
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('');
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleAddedMsg, setRuleAddedMsg] = useState<string | null>(null);
  const [suggestionOverrides, setSuggestionOverrides] = useState<Record<number, string>>({}); // B-4

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
  const unclassifiedCount = useMemo(() =>
    transactions.filter(t =>
      t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류'
    ).length,
    [transactions]
  );

  // ── B-1: 카드뷰용 미분류 거래 ──
  const unclassifiedForCard = useMemo(() =>
    transactions.filter(t =>
      t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류'
    ),
    [transactions]
  );

  const safeCardIdx = Math.min(currentCardIdx, Math.max(0, unclassifiedForCard.length - 1));
  const currentCardTx = unclassifiedForCard[safeCardIdx] ?? null;

  // ── B-4: 스마트 키워드 제안 ──
  const smartSuggestions = useMemo(() => {
    const unclassified = transactions.filter(t =>
      t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류'
    );
    const descMap: Record<string, { count: number; isIncome: boolean }> = {};
    unclassified.forEach(t => {
      const key = t.description.trim();
      if (!key || key.length < 2) return;
      if (!descMap[key]) descMap[key] = { count: 0, isIncome: t.credit > 0 };
      descMap[key].count++;
    });
    return Object.entries(descMap)
      .filter(([, v]) => v.count >= 2)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([keyword, v]) => ({
        keyword,
        isIncome: v.isIncome,
        count: v.count,
        suggestedCategory: guessCategory(keyword, v.isIncome),
      }))
      .filter(s => rules.every(r => r.keyword !== s.keyword));
  }, [transactions, rules]);

  // ── 필터된 거래 목록 (테이블뷰용) ──
  const filteredTxs = useMemo(() => {
    let txs = transactions;
    if (txFilter === 'unclassified') {
      txs = txs.filter(t =>
        t.category === '기타매출' || t.category === '기타사업비' || t.category === '미분류'
      );
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

  // ── B-1: 카드뷰 핸들러 ──
  const handleCardClassify = (catName: string) => {
    if (!currentCardTx || !onUpdateTransaction) return;
    onUpdateTransaction({ ...currentCardTx, category: catName });
    // 분류 후 같은 인덱스 유지 (다음 항목이 올라옴), 마지막이면 앞으로 이동
    if (safeCardIdx >= unclassifiedForCard.length - 1) {
      setCurrentCardIdx(Math.max(0, unclassifiedForCard.length - 2));
    }
  };

  const handleSkipCard = () => {
    setCurrentCardIdx(i => Math.min(i + 1, Math.max(0, unclassifiedForCard.length - 1)));
  };

  // ── B-3: 섹션 접기/펼치기 ──
  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
    e.dataTransfer.setData('text/plain', catName);
  };
  const handleCatItemDrop = (e: React.DragEvent, targetName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const source = e.dataTransfer.getData('text/plain') || draggingCatName;
    if (source && source !== targetName) onMoveCategory(source, targetName);
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

  // ── B-4: 스마트 제안 규칙 추가 ──
  const handleApplySuggestion = (idx: number, keyword: string, defaultCat: string) => {
    const category = suggestionOverrides[idx] || defaultCat;
    const matchCount = transactions.filter(t =>
      t.description.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    onAddRule({ keyword, category, source: 'manual' });
    const msg = `✓ "${keyword}" → ${category} 규칙 추가 — ${matchCount}건 재분류됨`;
    setRuleAddedMsg(msg);
    setTimeout(() => setRuleAddedMsg(null), 3500);
    setSuggestionOverrides(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
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
    return rules.filter(r =>
      r.keyword.toLowerCase().includes(ruleSearch.toLowerCase()) ||
      r.category.toLowerCase().includes(ruleSearch.toLowerCase())
    );
  }, [rules, ruleSearch]);

  const typeOrder: Category['type'][] = [
    'operating_income', 'non_operating_income', 'operating_expense', 'non_operating_expense',
  ];

  // ── 공통 CategoryTreeItem props 생성 헬퍼 ──
  const treeItemProps = (cat: Category) => ({
    cat,
    stats: catStats[cat.name] || { count: 0, total: 0 },
    isRenaming: renamingCat === cat.name,
    renameValue,
    renameInputRef,
    draggingCatName,
    onRenameChange: setRenameValue,
    onRenameCommit: commitRename,
    onRenameCancel: () => setRenamingCat(null),
    onStartRename: () => startRename(cat.name),
    onDelete: () => onDeleteCategory(cat),
    onDragStart: (e: React.DragEvent) => handleCatItemDragStart(e, cat.name),
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); },
    onDrop: (e: React.DragEvent) => handleCatItemDrop(e, cat.name),
    onDragEnd: () => setDraggingCatName(null),
  });

  // ── 렌더 ──
  return (
    <div className="space-y-4">
      {/* 규칙 추가 완료 알림 */}
      {ruleAddedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">
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
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-text-muted hover:bg-surface-subtle hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-red-100 text-red-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          탭1: 거래 분류 (B-1 Quick Classify 카드뷰 포함)
      ══════════════════════════════════════════ */}
      {activeTab === 'classify' && (
        <div className="space-y-3">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-text-muted">보기 방식</span>
              <div className="flex rounded-xl overflow-hidden border border-border-color">
                <button
                  onClick={() => { setClassifyMode('card'); setCurrentCardIdx(0); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors ${
                    classifyMode === 'card' ? 'bg-brand-primary text-white' : 'bg-white text-text-muted hover:bg-surface-subtle'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">view_agenda</span>
                  카드 뷰
                </button>
                <button
                  onClick={() => setClassifyMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors ${
                    classifyMode === 'table' ? 'bg-brand-primary text-white' : 'bg-white text-text-muted hover:bg-surface-subtle'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">table_rows</span>
                  테이블 뷰
                </button>
              </div>
            </div>
            {unclassifiedCount > 0 && (
              <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                미분류 {unclassifiedCount}건 남음
              </span>
            )}
          </div>

          {/* ── B-1: 카드 뷰 ── */}
          {classifyMode === 'card' && (
            <div className="bg-white rounded-2xl border border-border-color overflow-hidden">
              {unclassifiedForCard.length === 0 ? (
                /* 완료 화면 */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3">check_circle</span>
                  <h3 className="text-xl font-black text-text-primary mb-1">모두 분류 완료!</h3>
                  <p className="text-text-muted text-sm">미분류 거래가 없습니다. 수고하셨어요 🎉</p>
                  <button
                    onClick={() => setClassifyMode('table')}
                    className="mt-4 px-4 py-2 rounded-xl border border-border-color text-sm font-bold text-text-muted hover:bg-surface-subtle transition-colors"
                  >
                    전체 거래 보기
                  </button>
                </div>
              ) : (
                <>
                  {/* 헤더 + 네비게이션 */}
                  <div className="px-6 py-4 border-b border-border-color bg-surface-subtle">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-base">assignment_late</span>
                        <span className="text-sm font-black text-text-primary">미분류 Quick Classify</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600">{unclassifiedForCard.length}건 남음</span>
                    </div>
                    {/* 진행률 바 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentCardIdx(i => Math.max(0, i - 1))}
                        disabled={safeCardIdx === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-color text-sm font-bold text-text-muted hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        이전
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-sm font-bold text-text-muted">
                          {safeCardIdx + 1} / {unclassifiedForCard.length}
                        </span>
                        <div className="mt-1 h-1.5 bg-border-color rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${((safeCardIdx + 1) / unclassifiedForCard.length) * 100}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSkipCard}
                        disabled={safeCardIdx >= unclassifiedForCard.length - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-color text-sm font-bold text-text-muted hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        다음
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>

                  {/* 거래 카드 + 카테고리 버튼 */}
                  {currentCardTx && (
                    <div className="p-6 space-y-5">
                      {/* 거래 정보 카드 */}
                      <div className={`rounded-2xl p-5 border-2 ${
                        currentCardTx.credit > 0
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <p className="text-xs text-text-muted font-medium">
                              {currentCardTx.date.toLocaleDateString('ko-KR', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                              })}
                              &nbsp;·&nbsp;{currentCardTx.bank}
                            </p>
                            <p className="text-lg font-black text-text-primary break-words leading-snug">
                              {currentCardTx.description}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-2xl font-black ${
                              currentCardTx.credit > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {currentCardTx.credit > 0 ? '+' : '-'}
                              {fmt(currentCardTx.credit > 0 ? currentCardTx.credit : currentCardTx.debit)}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              currentCardTx.credit > 0
                                ? 'bg-emerald-200 text-emerald-700'
                                : 'bg-red-200 text-red-700'
                            }`}>
                              {currentCardTx.credit > 0 ? '입금' : '출금'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 카테고리 버튼 영역 */}
                      <div>
                        <p className="text-xs font-bold text-text-muted mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">touch_app</span>
                          카테고리를 선택하세요 ({currentCardTx.credit > 0 ? '수입' : '지출'} 거래)
                        </p>

                        {currentCardTx.credit > 0 ? (
                          /* 수입 카테고리 */
                          <div className="space-y-3">
                            {(['operating_income', 'non_operating_income'] as Category['type'][]).map(type => {
                              const cats = categoryGroups[type] || [];
                              if (cats.length === 0) return null;
                              return (
                                <div key={type}>
                                  <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 border ${typeColors[type]}`}>
                                    {typeLabels[type]}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {cats.map(cat => (
                                      <button
                                        key={cat.name}
                                        onClick={() => handleCardClassify(cat.name)}
                                        className="px-4 py-2 rounded-xl border-2 border-emerald-200 bg-white text-sm font-bold text-text-primary hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 transition-all"
                                      >
                                        {cat.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* 지출 카테고리 */
                          <div className="space-y-3">
                            {/* 영업 비용 - costGroup별 */}
                            {(() => {
                              const opExpCats = categoryGroups['operating_expense'] || [];
                              const grouped: Record<string, Category[]> = {};
                              opExpCats.forEach(c => {
                                const g = c.costGroup || '기타';
                                if (!grouped[g]) grouped[g] = [];
                                grouped[g].push(c);
                              });
                              const hasGroups = COST_GROUP_ORDER.some(g => grouped[g]?.length > 0);
                              if (!hasGroups) return null;
                              return (
                                <div>
                                  <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 border ${typeColors['operating_expense']}`}>
                                    영업 비용
                                  </p>
                                  <div className="space-y-2">
                                    {COST_GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(grp => (
                                      <div key={grp}>
                                        <p className="text-[10px] font-bold text-text-muted mb-1 px-1">{grp}</p>
                                        <div className="flex flex-wrap gap-2">
                                          {grouped[grp].map(cat => (
                                            <button
                                              key={cat.name}
                                              onClick={() => handleCardClassify(cat.name)}
                                              className="px-3 py-1.5 rounded-xl border-2 border-red-200 bg-white text-sm font-bold text-text-primary hover:border-red-400 hover:bg-red-50 hover:text-red-700 active:scale-95 transition-all"
                                            >
                                              {cat.name}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                            {/* 사업외 지출 */}
                            {(() => {
                              const nonOpCats = categoryGroups['non_operating_expense'] || [];
                              if (nonOpCats.length === 0) return null;
                              return (
                                <div>
                                  <p className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2 border ${typeColors['non_operating_expense']}`}>
                                    사업외 지출
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {nonOpCats.map(cat => (
                                      <button
                                        key={cat.name}
                                        onClick={() => handleCardClassify(cat.name)}
                                        className="px-3 py-1.5 rounded-xl border-2 border-orange-200 bg-white text-sm font-bold text-text-primary hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700 active:scale-95 transition-all"
                                      >
                                        {cat.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* 하단 액션 */}
                      <div className="flex items-center justify-between pt-3 border-t border-border-color">
                        <button
                          onClick={() => {
                            setActiveTab('rules');
                            setNewRuleKeyword(currentCardTx.description);
                          }}
                          className="flex items-center gap-1.5 text-sm font-bold text-text-muted hover:text-brand-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">rule</span>
                          규칙으로 저장
                        </button>
                        <button
                          onClick={handleSkipCard}
                          disabled={safeCardIdx >= unclassifiedForCard.length - 1}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-text-muted border border-border-color hover:bg-surface-subtle disabled:opacity-40 transition-all"
                        >
                          건너뛰기
                          <span className="material-symbols-outlined text-sm">skip_next</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 테이블 뷰 (기존 드래그앤드롭) ── */}
          {classifyMode === 'table' && (
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
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5 px-1">
                        {typeLabels[type]}
                      </p>
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
                                  : 'border-border-color bg-surface-subtle hover:border-brand-primary/40'
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
                        const availableCats = categories.filter(c =>
                          isIncome ? c.type.includes('income') : c.type.includes('expense')
                        );
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
                                <span className={`text-xs px-2 py-1 rounded-lg border ${
                                  typeColors[categories.find(c => c.name === tx.category)?.type || 'operating_expense']
                                }`}>
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

                {totalTxPages > 1 && (
                  <div className="p-3 border-t border-border-color flex items-center justify-between">
                    <span className="text-xs text-text-muted font-medium">
                      {filteredTxs.length}건 중 {(txPage - 1) * TX_PAGE_SIZE + 1}–{Math.min(txPage * TX_PAGE_SIZE, filteredTxs.length)}건
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="px-3 py-1 rounded-lg border border-border-color text-xs font-bold disabled:opacity-40"
                      >이전</button>
                      <span className="px-3 py-1 text-xs font-bold text-text-muted">{txPage}/{totalTxPages}</span>
                      <button
                        onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))}
                        disabled={txPage === totalTxPages}
                        className="px-3 py-1 rounded-lg border border-border-color text-xs font-bold disabled:opacity-40"
                      >다음</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          탭2: 카테고리 편집 (B-3 계층형 트리)
      ══════════════════════════════════════════ */}
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

          {/* ── B-3: 계층형 트리 ── */}
          <div className="space-y-3">

            {/* ▶ 수입 최상위 */}
            <div className="bg-white rounded-2xl border border-border-color overflow-hidden">
              <button
                onClick={() => toggleSection('income')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                  <span className="text-base font-black text-text-primary">수입</span>
                  <span className="text-xs text-text-muted font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {(categoryGroups['operating_income']?.length || 0) + (categoryGroups['non_operating_income']?.length || 0)}개
                  </span>
                </div>
                <span
                  className="material-symbols-outlined text-text-muted text-base transition-transform duration-200"
                  style={{ transform: collapsedSections.has('income') ? 'rotate(-90deg)' : '' }}
                >
                  expand_more
                </span>
              </button>

              {!collapsedSections.has('income') && (
                <div className="px-4 pb-4 space-y-2 border-t border-border-color/50 pt-3">
                  {/* 영업 수익 */}
                  <div className="border border-emerald-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('operating_income')}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-emerald-600 text-sm">
                        {collapsedSections.has('operating_income') ? 'chevron_right' : 'expand_more'}
                      </span>
                      <span className="text-sm font-bold text-emerald-700">영업 수익</span>
                      <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {categoryGroups['operating_income']?.length || 0}개
                      </span>
                    </button>
                    {!collapsedSections.has('operating_income') && (
                      <div className="px-4 py-3 space-y-2 bg-white">
                        {(categoryGroups['operating_income'] || []).length === 0 ? (
                          <p className="text-xs text-text-muted text-center py-2">카테고리가 없습니다</p>
                        ) : (
                          (categoryGroups['operating_income'] || []).map(cat => (
                            <CategoryTreeItem key={cat.name} {...treeItemProps(cat)} />
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 영업외 수익 */}
                  <div className="border border-teal-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('non_operating_income')}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-teal-600 text-sm">
                        {collapsedSections.has('non_operating_income') ? 'chevron_right' : 'expand_more'}
                      </span>
                      <span className="text-sm font-bold text-teal-700">영업외 수익</span>
                      <span className="text-xs bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                        {categoryGroups['non_operating_income']?.length || 0}개
                      </span>
                    </button>
                    {!collapsedSections.has('non_operating_income') && (
                      <div className="px-4 py-3 space-y-2 bg-white">
                        {(categoryGroups['non_operating_income'] || []).map(cat => (
                          <CategoryTreeItem key={cat.name} {...treeItemProps(cat)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ▶ 지출 최상위 */}
            <div className="bg-white rounded-2xl border border-border-color overflow-hidden">
              <button
                onClick={() => toggleSection('expense')}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-subtle transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
                  <span className="text-base font-black text-text-primary">지출</span>
                  <span className="text-xs text-text-muted font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    {(categoryGroups['operating_expense']?.length || 0) + (categoryGroups['non_operating_expense']?.length || 0)}개
                  </span>
                </div>
                <span
                  className="material-symbols-outlined text-text-muted text-base transition-transform duration-200"
                  style={{ transform: collapsedSections.has('expense') ? 'rotate(-90deg)' : '' }}
                >
                  expand_more
                </span>
              </button>

              {!collapsedSections.has('expense') && (
                <div className="px-4 pb-4 space-y-2 border-t border-border-color/50 pt-3">
                  {/* 영업 비용 */}
                  <div className="border border-red-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('operating_expense')}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-red-600 text-sm">
                        {collapsedSections.has('operating_expense') ? 'chevron_right' : 'expand_more'}
                      </span>
                      <span className="text-sm font-bold text-red-700">영업 비용</span>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">
                        {categoryGroups['operating_expense']?.length || 0}개
                      </span>
                    </button>
                    {!collapsedSections.has('operating_expense') && (
                      <div className="px-3 py-3 space-y-2 bg-white">
                        {/* costGroup 별 3단계 */}
                        {(() => {
                          const opExpCats = categoryGroups['operating_expense'] || [];
                          const grouped: Record<string, Category[]> = {};
                          opExpCats.forEach(c => {
                            const g = c.costGroup || '기타';
                            if (!grouped[g]) grouped[g] = [];
                            grouped[g].push(c);
                          });
                          return COST_GROUP_ORDER.filter(g => grouped[g]?.length > 0).map(grp => (
                            <div key={grp} className="border border-gray-100 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleSection(`opexp_${grp}`)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                              >
                                <span className="material-symbols-outlined text-gray-500 text-xs">
                                  {collapsedSections.has(`opexp_${grp}`) ? 'chevron_right' : 'expand_more'}
                                </span>
                                <span className="text-xs font-bold text-gray-600">{grp}</span>
                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-bold">
                                  {grouped[grp].length}개
                                </span>
                              </button>
                              {!collapsedSections.has(`opexp_${grp}`) && (
                                <div className="px-3 py-2 space-y-1.5 bg-white">
                                  {grouped[grp].map(cat => (
                                    <CategoryTreeItem key={cat.name} {...treeItemProps(cat)} />
                                  ))}
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 사업외 지출 */}
                  <div className="border border-orange-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('non_operating_expense')}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-orange-600 text-sm">
                        {collapsedSections.has('non_operating_expense') ? 'chevron_right' : 'expand_more'}
                      </span>
                      <span className="text-sm font-bold text-orange-700">사업외 지출</span>
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                        {categoryGroups['non_operating_expense']?.length || 0}개
                      </span>
                    </button>
                    {!collapsedSections.has('non_operating_expense') && (
                      <div className="px-4 py-3 space-y-2 bg-white">
                        {(categoryGroups['non_operating_expense'] || []).map(cat => (
                          <CategoryTreeItem key={cat.name} {...treeItemProps(cat)} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          탭3: 자동 분류 규칙 (B-4 스마트 제안 포함)
      ══════════════════════════════════════════ */}
      {activeTab === 'rules' && (
        <div className="space-y-4">

          {/* ── B-4: 스마트 키워드 제안 ── */}
          {smartSuggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-base">lightbulb</span>
                  스마트 키워드 제안
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    {smartSuggestions.length}개
                  </span>
                </h3>
              </div>
              <p className="text-xs text-text-muted mb-4">
                미분류 거래에서 자주 등장하는 패턴을 분석했습니다. 카테고리를 확인하고 <strong>+ 추가</strong>를 눌러 자동 규칙을 만드세요.
              </p>
              <div className="space-y-2">
                {smartSuggestions.map((s, idx) => {
                  const selectedCat = suggestionOverrides[idx] ?? s.suggestedCategory;
                  const catObj = categories.find(c => c.name === selectedCat);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-300 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          s.isIncome
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {s.isIncome ? '입금' : '출금'}
                        </span>
                        <code className="text-sm font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border-color max-w-[180px] truncate" title={s.keyword}>
                          {s.keyword}
                        </code>
                        <span className="text-text-muted text-sm shrink-0">→</span>
                        <select
                          value={selectedCat}
                          onChange={(e) => setSuggestionOverrides(prev => ({ ...prev, [idx]: e.target.value }))}
                          className={`text-xs border rounded-lg px-2 py-1 bg-white min-w-[120px] max-w-[180px] font-semibold ${
                            catObj ? typeColors[catObj.type] : 'border-border-color text-text-primary'
                          }`}
                        >
                          {typeOrder.map(type => (
                            <optgroup key={type} label={typeLabels[type]}>
                              {(categoryGroups[type] || []).map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                          {s.count}건 해당
                        </span>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(idx, s.keyword, s.suggestedCategory)}
                        className="shrink-0 px-3 py-1.5 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-secondary transition-colors"
                      >
                        + 추가
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 새 규칙 수동 추가 */}
          <div className="bg-white rounded-2xl border border-border-color p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary text-base">add_circle</span>
              새 규칙 추가
              <span className="text-xs font-normal text-text-muted">— 적요에 키워드가 포함된 거래를 자동 분류합니다</span>
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
                  {previewCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-brand-primary/10 rounded-full font-bold">
                      {previewCount}건 해당
                    </span>
                  )}
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
                <span className="bg-brand-primary/10 text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {rules.length}개
                </span>
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rule.source === 'manual'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {rule.source === 'manual' ? '수동' : 'AI'}
                        </span>
                        <code className="text-sm font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border-color truncate">
                          {rule.keyword}
                        </code>
                        <span className="text-text-muted text-sm">→</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${
                          catType ? typeColors[catType] : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
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
