import React, { useState, useMemo } from 'react';
import { Transaction, Category, BusinessInfo } from '../../types';
import TransactionsTable from '../TransactionsTable';

declare const XLSX: any;

interface Props {
  transactions: Transaction[];
  categories: Category[];
  businessInfo: BusinessInfo;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const TypeButton = ({ label, icon, isActive, onClick }: { label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
            isActive 
            ? 'bg-brand-primary text-text-on-light shadow' 
            : 'bg-surface-subtle text-text-muted hover:bg-border-color'
        }`}
        aria-pressed={isActive}
    >
        {icon}
        <span>{label}</span>
    </button>
);


const TransactionsView: React.FC<Props> = ({ transactions, categories, onUpdateTransaction }) => {
  const [filter, setFilter] = useState({ 
      term: '', 
      category: 'all', 
      type: 'all' as 'all' | 'income' | 'expense',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilter(f => ({ ...f, [name]: value }));
  };

  const { filteredTransactions, summary } = useMemo(() => {
    const minAmount = filter.minAmount ? parseFloat(filter.minAmount) : null;
    const maxAmount = filter.maxAmount ? parseFloat(filter.maxAmount) : null;
    const startDate = filter.startDate ? new Date(filter.startDate) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    const endDate = filter.endDate ? new Date(filter.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const selectedCategoryInfo = filter.category !== 'all' 
            ? categories.find(c => c.name === filter.category) 
            : null;

    const filtered = transactions.filter(t => {
      const termMatch = filter.term === '' || t.description.toLowerCase().includes(filter.term.toLowerCase());
      const categoryMatch = filter.category === 'all' || t.category === filter.category;
      
      const typeMatch = filter.type === 'all' || 
          (filter.type === 'income' && t.credit > 0) || 
          (filter.type === 'expense' && t.debit > 0);
      
      // Stricter check if a specific category is selected
      if (selectedCategoryInfo) {
          if (selectedCategoryInfo.type.includes('income') && t.credit === 0) return false;
          if (selectedCategoryInfo.type.includes('expense') && t.debit === 0) return false;
      }

      const startDateMatch = !startDate || t.date >= startDate;
      const endDateMatch = !endDate || t.date <= endDate;

      const transactionAmount = t.credit > 0 ? t.credit : t.debit;
      const minAmountMatch = minAmount === null || transactionAmount >= minAmount;
      const maxAmountMatch = maxAmount === null || transactionAmount <= maxAmount;

      return termMatch && categoryMatch && typeMatch && startDateMatch && endDateMatch && minAmountMatch && maxAmountMatch;
    });

    const calculatedSummary = filtered.reduce((acc, tx) => {
        acc.totalCredit += tx.credit;
        acc.totalDebit += tx.debit;
        return acc;
    }, { totalCredit: 0, totalDebit: 0 });

    return { filteredTransactions: filtered, summary: calculatedSummary };
  }, [transactions, filter, categories]);
  
  const availableCategories = useMemo(() => {
    if (filter.type === 'all') return categories;
    return categories.filter(c => c.type.includes(filter.type));
  }, [categories, filter.type]);
  
  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setFilter(f => ({
        ...f,
        type,
        category: 'all' // Reset category filter when type changes
    }));
  };
  
  const netSum = summary.totalCredit - summary.totalDebit;

  const handleExport = () => {
    const dataToExport = filteredTransactions.map(tx => ({
        '거래일시': tx.date.toLocaleString('ko-KR'),
        '적요': tx.description,
        '출금액': tx.debit,
        '입금액': tx.credit,
        '카테고리': tx.category,
        '은행': tx.bank,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
     <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-border-color max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 mb-8">
            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 md:p-8 rounded-3xl shadow-sm border border-border-color overflow-hidden -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-2">
              <img 
                src="https://images.unsplash.com/photo-1554224154-26032ffc0d04?q=80&w=2000&auto=format&fit=crop" 
                alt="Transactions Background" 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
              <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    거래 내역 상세 조회
                  </h3>
                  <p className="mt-3 text-lg text-text-muted font-medium">통장에 찍힌 모든 입출금 내역을 하나씩 볼 수 있는 화면입니다. 날짜, 금액, 분류 항목별로 원하는 거래만 골라볼 수 있고, AI가 잘못 분류한 항목이 있으면 직접 클릭해서 바로잡을 수 있습니다.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm transition-colors duration-200 whitespace-nowrap w-full sm:w-auto justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel로 내보내기
                </button>
              </div>
            </div>
            
            {/* 필터 영역 */}
            <div className="flex flex-col gap-4 p-5 bg-surface-subtle border border-border-color rounded-2xl">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center p-1.5 bg-white rounded-xl border border-border-color/50 w-fit shadow-sm">
                        <TypeButton label="전체" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>} isActive={filter.type === 'all'} onClick={() => handleTypeChange('all')} />
                        <TypeButton label="수입" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} isActive={filter.type === 'income'} onClick={() => handleTypeChange('income')} />
                        <TypeButton label="지출" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} isActive={filter.type === 'expense'} onClick={() => handleTypeChange('expense')} />
                    </div>
                    <div className="relative flex-1 min-w-[200px]">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input 
                          type="text" name="term" placeholder="적요 검색..." value={filter.term} onChange={handleFilterChange}
                          className="w-full bg-white border border-border-color rounded-xl pl-10 pr-4 py-2.5 text-base text-text-primary placeholder-text-muted focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow shadow-sm" aria-label="Search by description"
                      />
                    </div>
                    <div className="relative min-w-[200px]">
                      <select 
                          name="category" value={filter.category} onChange={handleFilterChange}
                          className="w-full bg-white border border-border-color rounded-xl pl-4 pr-10 py-2.5 text-base font-medium text-text-primary appearance-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-shadow shadow-sm cursor-pointer" aria-label="Select category"
                      >
                          <option value="all">모든 카테고리</option>
                          {availableCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
                        <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                </div>
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-border-color shadow-sm">
                        <label htmlFor="startDate" className="text-sm font-bold text-text-muted ml-2">기간</label>
                        <input type="date" name="startDate" id="startDate" value={filter.startDate} onChange={handleFilterChange} className="bg-transparent border-none focus:ring-0 text-base font-medium text-text-primary cursor-pointer"/>
                        <span className="text-text-muted font-bold">~</span>
                        <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} className="bg-transparent border-none focus:ring-0 text-base font-medium text-text-primary cursor-pointer"/>
                    </div>
                     <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-border-color shadow-sm">
                        <label htmlFor="minAmount" className="text-sm font-bold text-text-muted ml-2">금액</label>
                        <input type="number" name="minAmount" id="minAmount" placeholder="최소" value={filter.minAmount} onChange={handleFilterChange} className="bg-transparent border-none focus:ring-0 text-base font-medium w-24 text-text-primary placeholder-text-muted/50 text-right"/>
                        <span className="text-text-muted font-bold">~</span>
                        <input type="number" name="maxAmount" placeholder="최대" value={filter.maxAmount} onChange={handleFilterChange} className="bg-transparent border-none focus:ring-0 text-base font-medium w-24 text-text-primary placeholder-text-muted/50 text-right"/>
                    </div>
                 </div>
            </div>
            
            {/* 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm">
                    <div className="text-sm font-bold text-emerald-700 mb-1">조회된 수입 합계</div>
                    <div className="text-2xl font-bold text-emerald-600">{summary.totalCredit.toLocaleString()}원</div>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl shadow-sm">
                    <div className="text-sm font-bold text-red-700 mb-1">조회된 지출 합계</div>
                    <div className="text-2xl font-bold text-red-600">{summary.totalDebit.toLocaleString()}원</div>
                </div>
                 <div className={`${netSum >= 0 ? 'bg-brand-primary/10 border-brand-primary/20' : 'bg-orange-50 border-orange-100'} p-4 rounded-2xl shadow-sm`}>
                    <div className={`text-sm font-bold mb-1 ${netSum >= 0 ? 'text-brand-primary' : 'text-orange-700'}`}>합계 (수입 - 지출)</div>
                    <div className={`text-2xl font-bold ${netSum >= 0 ? 'text-brand-primary' : 'text-orange-600'}`}>{netSum.toLocaleString()}원</div>
                </div>
            </div>
        </div>
        <div className="rounded-2xl border border-border-color overflow-hidden shadow-sm">
          <TransactionsTable 
              transactions={filteredTransactions} 
              categories={categories}
              onUpdateTransaction={onUpdateTransaction}
          />
        </div>
      </div>
  )
};

export default TransactionsView;