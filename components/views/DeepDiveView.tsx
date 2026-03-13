import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { suggestFixedCostCategories } from '../../services/geminiService';
import { exportViewToPdf } from '../../services/pdfExporter';


const formatCurrency = (val: number | string, compact = false) => {
    const num = Number(val);
    if (isNaN(num)) return '-';
    if (compact && Math.abs(num) >= 10000) {
        return `${(num / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만원`;
    }
    return `${num.toLocaleString('ko-KR')}원`;
};

const getAvailablePeriods = (transactions: Transaction[]) => {
    if (transactions.length === 0) {
        return { years: [], halves: [], quarters: [], months: [] };
    }
    const periods = {
        years: new Set<string>(),
        halves: new Set<string>(),
        quarters: new Set<string>(),
        months: new Set<string>(),
    };
    transactions.forEach(tx => {
        const year = tx.date.getFullYear();
        const month = tx.date.getMonth();
        periods.years.add(String(year));
        periods.months.add(`${year}-${String(month + 1).padStart(2, '0')}`);
        periods.quarters.add(`${year}-Q${Math.floor(month / 3) + 1}`);
        periods.halves.add(`${year}-H${month < 6 ? 1 : 2}`);
    });
    return {
        years: Array.from(periods.years).sort().reverse(),
        halves: Array.from(periods.halves).sort().reverse(),
        quarters: Array.from(periods.quarters).sort().reverse(),
        months: Array.from(periods.months).sort().reverse(),
    };
};


const IncomeStatementAnalysis: React.FC<{ transactions: Transaction[], categories: Category[], periodBadge?: React.ReactNode }> = ({ transactions, categories, periodBadge }) => {
    const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
    const categoryTypeMap = useMemo(() => new Map(categories.map(c => [c.name, c.type])), [categories]);

    const metrics = useMemo(() => {
        const result = transactions.reduce((acc, t) => {
            const type = categoryTypeMap.get(t.category);
            
            switch (type) {
                case 'operating_income':
                    acc.operatingRevenue += t.credit;
                    acc.operatingRevenueDetails[t.category] = (acc.operatingRevenueDetails[t.category] || 0) + t.credit;
                    break;
                case 'operating_expense':
                    acc.operatingExpense += t.debit;
                    acc.operatingExpenseDetails[t.category] = (acc.operatingExpenseDetails[t.category] || 0) + t.debit;
                    break;
                case 'non_operating_income':
                    acc.nonOperatingIncome += t.credit;
                    acc.nonOperatingIncomeDetails[t.category] = (acc.nonOperatingIncomeDetails[t.category] || 0) + t.credit;
                    break;
                case 'non_operating_expense':
                    acc.nonOperatingExpense += t.debit;
                    acc.nonOperatingExpenseDetails[t.category] = (acc.nonOperatingExpenseDetails[t.category] || 0) + t.debit;
                    break;
                default:
                    // Uncategorized or mis-categorized
                     if (t.credit > 0) {
                        acc.operatingRevenue += t.credit;
                        acc.operatingRevenueDetails[t.category] = (acc.operatingRevenueDetails[t.category] || 0) + t.credit;
                    } else {
                        acc.operatingExpense += t.debit;
                        acc.operatingExpenseDetails[t.category] = (acc.operatingExpenseDetails[t.category] || 0) + t.debit;
                    }
                    break;
            }
            return acc;
        }, {
            operatingRevenue: 0,
            operatingExpense: 0,
            nonOperatingIncome: 0,
            nonOperatingExpense: 0,
            operatingRevenueDetails: {} as Record<string, number>,
            operatingExpenseDetails: {} as Record<string, number>,
            nonOperatingIncomeDetails: {} as Record<string, number>,
            nonOperatingExpenseDetails: {} as Record<string, number>,
        });

        const operatingProfit = result.operatingRevenue - result.operatingExpense;
        const nonOperatingProfit = result.nonOperatingIncome - result.nonOperatingExpense;
        const netProfit = operatingProfit + nonOperatingProfit;

        const sortDetails = (details: Record<string, number>) => Object.entries(details).sort(([, a], [, b]) => b - a);

        return { 
            ...result, 
            operatingProfit, 
            nonOperatingProfit, 
            netProfit,
            operatingRevenueDetailsSorted: sortDetails(result.operatingRevenueDetails),
            operatingExpenseDetailsSorted: sortDetails(result.operatingExpenseDetails),
            nonOperatingIncomeDetailsSorted: sortDetails(result.nonOperatingIncomeDetails),
            nonOperatingExpenseDetailsSorted: sortDetails(result.nonOperatingExpenseDetails),
        };
    }, [transactions, categoryTypeMap]);
    
    // FIX: Explicitly type component props with React.FC to correctly handle the 'key' prop and improve type safety.
    const MetricRow: React.FC<{ label: string; value: number; isSub?: boolean; isTotal?: boolean; isPositive?: boolean; }> = ({ label, value, isSub = false, isTotal = false, isPositive = false }) => (
        <tr className={`border-b border-border-color/50 ${isTotal ? 'bg-surface-subtle/30' : ''}`}>
            <td className={`py-4 px-6 font-bold ${isSub ? 'pl-12' : ''} ${isTotal ? 'text-text-primary text-base' : 'text-text-muted text-sm'}`}>{label}</td>
            <td className={`py-4 px-6 text-right font-mono ${isTotal ? 'font-bold text-lg' : 'font-medium text-base'} ${value < 0 ? 'text-red-600' : isPositive ? 'text-emerald-600' : 'text-text-primary'}`}>
                {formatCurrency(value)}
            </td>
        </tr>
    );
    
    // FIX: Explicitly type component props with React.FC to correctly handle the 'key' prop and improve type safety.
    const DetailRow: React.FC<{ label: string; value: number; }> = ({ label, value }) => (
         <tr className="border-b border-border-color/30 hover:bg-surface-subtle/50 transition-colors">
            <td className="py-2.5 px-6 pl-14 text-sm font-medium text-text-muted">{label}</td>
            <td className="py-2.5 px-6 text-right font-mono text-sm font-medium text-text-primary">{formatCurrency(value)}</td>
        </tr>
    );

    return (
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-color">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    손익계산서{periodBadge}
                </h3>
                <div className="flex items-center p-1.5 bg-surface-subtle rounded-xl border border-border-color/50">
                    <button onClick={() => setViewMode('summary')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'summary' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>요약 보기</button>
                    <button onClick={() => setViewMode('detailed')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'detailed' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>전체 보기</button>
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border-color">
                <table className="min-w-full">
                    <tbody className="divide-y divide-border-color/50">
                        {viewMode === 'summary' ? (
                            <>
                                <MetricRow label="I. 총 매출 (영업 수익)" value={metrics.operatingRevenue} isPositive={true} />
                                <MetricRow label="(-) 영업 비용" value={metrics.operatingExpense} />
                                <MetricRow label="= 영업이익" value={metrics.operatingProfit} isTotal={true} />
                                <MetricRow label="II. 영업외 수익" value={metrics.nonOperatingIncome} isSub={true} isPositive={true} />
                                <MetricRow label="(-) 사업외 지출" value={metrics.nonOperatingExpense} isSub={true} />
                                <MetricRow label="= 영업외손익" value={metrics.nonOperatingProfit} isTotal={true} />
                                <MetricRow label="=> 당기순이익" value={metrics.netProfit} isTotal={true} />
                            </>
                        ) : (
                             <>
                                <MetricRow label="I. 총 매출 (영업 수익)" value={metrics.operatingRevenue} isPositive={true} />
                                {metrics.operatingRevenueDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}
                                
                                <MetricRow label="(-) 영업 비용" value={metrics.operatingExpense} />
                                {metrics.operatingExpenseDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}

                                <MetricRow label="= 영업이익" value={metrics.operatingProfit} isTotal={true} />

                                <MetricRow label="II. 영업외 수익" value={metrics.nonOperatingIncome} isPositive={true} />
                                {metrics.nonOperatingIncomeDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}
                                
                                <MetricRow label="(-) 사업외 지출" value={metrics.nonOperatingExpense} />
                                {metrics.nonOperatingExpenseDetailsSorted.map(([name, value]) => <DetailRow key={name} label={name} value={value} />)}

                                <MetricRow label="= 영업외손익" value={metrics.nonOperatingProfit} isTotal={true} />
                                <MetricRow label="=> 당기순이익" value={metrics.netProfit} isTotal={true} />
                             </>
                        )}
                    </tbody>
                </table>
                 {transactions.length === 0 && <div className="text-center py-8 text-text-muted">선택된 기간에 데이터가 없습니다.</div>}
            </div>
        </div>
    )
};


const FixedVariableCostAnalysis: React.FC<{ transactions: Transaction[], categories: Category[], businessInfo: BusinessInfo, periodBadge?: React.ReactNode }> = ({ transactions, categories, businessInfo, periodBadge }) => {
    const [fixedCategories, setFixedCategories] = useState<Set<string>>(new Set());
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const expenseCategories = useMemo(() => 
        categories.filter(c => c.type === 'operating_expense'), 
    [categories]);

    useEffect(() => {
        const fetchSuggestedCategories = async () => {
            setIsLoading(true);
            const suggested = await suggestFixedCostCategories(categories, businessInfo);
            setFixedCategories(new Set(suggested));
            setIsLoading(false);
        };
        fetchSuggestedCategories();
    }, [categories, businessInfo]);
    
    const { pieData, total, fixedDetails, variableDetails } = useMemo(() => {
        let totalFixed = 0;
        let totalVariable = 0;
        const fixedCostDetails: Record<string, number> = {};
        const variableCostDetails: Record<string, number> = {};

        transactions.forEach(tx => {
            if (fixedCategories.has(tx.category)) {
                totalFixed += tx.debit;
                fixedCostDetails[tx.category] = (fixedCostDetails[tx.category] || 0) + tx.debit;
            } else {
                totalVariable += tx.debit;
                variableCostDetails[tx.category] = (variableCostDetails[tx.category] || 0) + tx.debit;
            }
        });
        
        const totalCost = totalFixed + totalVariable;
        return {
            pieData: totalCost > 0 ? [
                { name: '고정비', value: totalFixed },
                { name: '변동비', value: totalVariable },
            ] : [],
            total: totalCost,
            fixedDetails: Object.entries(fixedCostDetails).sort(([, a], [, b]) => b - a),
            variableDetails: Object.entries(variableCostDetails).sort(([, a], [, b]) => b - a),
        };
    }, [transactions, fixedCategories]);
    
    const handleCheckboxChange = (categoryName: string, isChecked: boolean) => {
        setFixedCategories(prev => {
            const newSet = new Set(prev);
            if (isChecked) newSet.add(categoryName);
            else newSet.delete(categoryName);
            return newSet;
        });
    };

    const renderCustomizedLabel = ({ percent }: any) => {
        if (percent < 0.05) return null;
        return `${(percent * 100).toFixed(0)}%`;
    };

    if (isLoading) {
        return (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-color flex items-center justify-center min-h-[300px]">
                <div className="text-center text-text-muted font-bold text-lg flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    AI가 고정비 항목을 분석 중입니다...
                </div>
            </div>
        );
    }

    const DetailList: React.FC<{title: string, details: [string, number][], total: number, colorClass: string, bgColorClass: string}> = ({title, details, total, colorClass, bgColorClass}) => (
        <div className={`p-5 rounded-2xl ${bgColorClass} border border-border-color/30`}>
            <div className={`flex justify-between font-bold text-base mb-3 ${colorClass}`}>
                <span>{title}</span>
                <span>{formatCurrency(total, true)} ({total > 0 ? (total/pieData.reduce((s,d)=>s+d.value,0)*100).toFixed(1) : 0}%)</span>
            </div>
            {details.length > 0 && (
                <ul className="space-y-2 text-sm text-text-muted max-h-32 overflow-y-auto custom-scrollbar pr-2">
                    {details.map(([name, value]) => (
                        <li key={name} className="flex justify-between items-center font-medium">
                            <span className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`}></span>
                                {name}
                            </span>
                            <span className="font-mono">{formatCurrency(value, true)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-color">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
                <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <span className="text-2xl">⚖️</span>
                    고정비 vs 변동비 분석 <span className="text-lg font-medium text-text-muted ml-1">(영업비용 기준)</span>{periodBadge}
                </h3>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-bold text-brand-primary hover:text-brand-secondary px-4 py-2 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors">
                    {isEditing ? '완료' : '고정비 카테고리 수정'}
                </button>
            </div>
             <p className="text-sm font-medium text-text-muted mb-8">* AI가 추천한 고정비 기준이며, 직접 수정할 수 있습니다.</p>

            {isEditing && (
                <div className="bg-surface-subtle p-6 rounded-2xl mb-8 border border-border-color">
                    <h4 className="font-bold mb-4 text-text-primary text-lg">고정비로 처리할 카테고리를 선택하세요:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {expenseCategories.map(cat => (
                            <label key={cat.name} className="flex items-center space-x-3 text-sm p-3 rounded-xl hover:bg-white border border-transparent hover:border-border-color transition-all cursor-pointer">
                                <input type="checkbox" className="form-checkbox h-5 w-5 rounded-md bg-white border-border-color text-brand-primary focus:ring-brand-primary focus:ring-offset-0" checked={fixedCategories.has(cat.name)} onChange={(e) => handleCheckboxChange(cat.name, e.target.checked)} />
                                <span className="text-text-primary font-medium">{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {total > 0 ? (
                    <>
                        <div style={{width: '100%', height: 300}}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} fill="#8884d8" paddingAngle={5} labelLine={false} label={renderCustomizedLabel}>
                                        <Cell key="cell-0" fill="#3B82F6" />
                                        <Cell key="cell-1" fill="#F59E0B" />
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontWeight: 'bold' }}/>
                                    <Legend wrapperStyle={{ color: '#374151', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-surface-subtle p-4 rounded-2xl border border-border-color text-center">
                                <h4 className="font-bold text-text-muted text-sm mb-1">총 영업비용</h4>
                                <div className="text-2xl font-bold text-text-primary">{formatCurrency(total, true)}</div>
                            </div>
                            <DetailList title="고정비" details={fixedDetails} total={pieData[0]?.value || 0} colorClass="text-blue-600" bgColorClass="bg-blue-50/50" />
                            <DetailList title="변동비" details={variableDetails} total={pieData[1]?.value || 0} colorClass="text-amber-600" bgColorClass="bg-amber-50/50" />
                        </div>
                    </>
                ) : (
                    <div className="col-span-2 text-center py-12 text-text-muted font-medium text-lg bg-surface-subtle/30 rounded-2xl">
                        분석할 영업 비용 데이터가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
};


const CashFlowAnalysis: React.FC<{ transactions: Transaction[], periodBadge?: React.ReactNode }> = ({ transactions, periodBadge }) => {
    const cashFlowData = useMemo(() => {
        if (transactions.length < 1) return [];

        const firstTx = transactions[0];
        // Start from a calculated balance before the very first transaction
        let runningBalance = (firstTx.balance || 0) - firstTx.credit + firstTx.debit;

        const monthlyData: { [key: string]: { 
            inflow: number; 
            outflow: number; 
            openingBalance?: number; 
            closingBalance?: number 
        } } = {};
        
        transactions.forEach(tx => {
            const month = tx.date.toISOString().slice(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { 
                    inflow: 0, 
                    outflow: 0, 
                    openingBalance: runningBalance // Set opening balance for the first tx of the month
                };
            }
            monthlyData[month].inflow += tx.credit;
            monthlyData[month].outflow += tx.debit;
            runningBalance += tx.credit - tx.debit;
            monthlyData[month].closingBalance = runningBalance; // Continuously update closing balance
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                inflow: data.inflow,
                outflow: data.outflow,
                netFlow: data.inflow - data.outflow,
                openingBalance: data.openingBalance!,
                closingBalance: data.closingBalance!,
            }))
            .sort((a,b) => a.month.localeCompare(b.month));

    }, [transactions]);
    
    if (cashFlowData.length === 0) return null;

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
                <span className="text-2xl">🌊</span>
                월별 현금 흐름 분석{periodBadge}
            </h3>
            <p className="text-sm font-medium text-text-muted mb-6">* 이 분석은 선택된 기간의 영업 및 영업외 활동을 포함한 모든 실제 입출금 내역을 기반으로 합니다.</p>
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-border-color">
                <table className="min-w-full">
                    <thead className="bg-surface-subtle">
                        <tr>
                            <th className="py-4 px-6 text-left text-sm font-bold text-text-muted uppercase tracking-wider">월</th>
                            <th className="py-4 px-6 text-right text-sm font-bold text-text-muted uppercase tracking-wider">기초잔액</th>
                            <th className="py-4 px-6 text-right text-sm font-bold text-text-muted uppercase tracking-wider">총수입</th>
                            <th className="py-4 px-6 text-right text-sm font-bold text-text-muted uppercase tracking-wider">총지출</th>
                            <th className="py-4 px-6 text-right text-sm font-bold text-text-muted uppercase tracking-wider">순현금흐름</th>
                            <th className="py-4 px-6 text-right text-sm font-bold text-text-muted uppercase tracking-wider">기말잔액</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/50 bg-white">
                        {cashFlowData.map(d => (
                            <tr key={d.month} className="hover:bg-surface-subtle/50 transition-colors">
                                <td className="py-4 px-6 text-base font-bold text-text-primary">{d.month}</td>
                                <td className="py-4 px-6 text-right text-base font-medium text-text-muted">{formatCurrency(d.openingBalance)}</td>
                                <td className="py-4 px-6 text-right text-base font-bold text-emerald-600">{formatCurrency(d.inflow)}</td>
                                <td className="py-4 px-6 text-right text-base font-bold text-red-600">{formatCurrency(d.outflow)}</td>
                                <td className={`py-4 px-6 text-right text-base font-bold ${d.netFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(d.netFlow)}</td>
                                <td className="py-4 px-6 text-right text-base font-bold text-text-primary bg-surface-subtle/30">{formatCurrency(d.closingBalance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {transactions.length === 0 && <div className="text-center py-12 text-text-muted font-medium text-lg bg-surface-subtle/30">선택된 기간에 데이터가 없습니다.</div>}
            </div>
        </div>
    );
};

const VendorCustomerAnalysis: React.FC<{ transactions: Transaction[], periodBadge?: React.ReactNode }> = ({ transactions, periodBadge }) => {
    const { 
        topExpenses, 
        allExpenses, 
        topIncomes, 
        allIncomes, 
        totalExpense, 
        totalIncome 
    } = useMemo(() => {
        const expenseSources: Record<string, number> = {};
        const incomeSources: Record<string, number> = {};
        let totalExpense = 0;
        let totalIncome = 0;

        transactions.forEach(tx => {
            const source = tx.description.trim();
            if (tx.debit > 0) {
                totalExpense += tx.debit;
                expenseSources[source] = (expenseSources[source] || 0) + tx.debit;
            }
            if (tx.credit > 0) {
                 totalIncome += tx.credit;
                 incomeSources[source] = (incomeSources[source] || 0) + tx.credit;
            }
        });
        
        const sortedExpenses = Object.entries(expenseSources).sort(([,a], [,b]) => b - a).map(([name, value]) => ({ name, value }));
        const sortedIncomes = Object.entries(incomeSources).sort(([,a], [,b]) => b - a).map(([name, value]) => ({ name, value }));
        
        return { 
            topExpenses: sortedExpenses.slice(0, 10), 
            allExpenses: sortedExpenses,
            topIncomes: sortedIncomes.slice(0, 10),
            allIncomes: sortedIncomes,
            totalExpense, 
            totalIncome 
        };
    }, [transactions]);
    
    const renderAnalysisSection = (title: string, chartData: {name: string, value: number}[], tableData: {name: string, value: number}[], total: number, color: string) => (
        <div className="bg-surface-subtle/30 p-6 rounded-2xl border border-border-color/50">
            <h4 className="font-bold text-lg text-text-primary mb-4">{title}</h4>
            {chartData.length > 0 && total > 0 ? (
                <>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" horizontal={false} />
                            <XAxis type="number" tickFormatter={(v) => formatCurrency(v, true)} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 'bold' }}/>
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 'bold' }} interval={0} />
                            <Tooltip formatter={(value: number) => [formatCurrency(value), `(${(value/total*100).toFixed(1)}%)`]} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', fontWeight: 'bold' }}/>
                            <Bar dataKey="value" fill={color} barSize={20} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="overflow-y-auto mt-6 border border-border-color/50 rounded-xl bg-white max-h-[480px] custom-scrollbar">
                  <table className="min-w-full">
                      <thead className="bg-surface-subtle sticky top-0 z-10">
                          <tr>
                              <th className="py-3 px-4 text-left text-sm font-bold text-text-muted">거래처(적요)</th>
                              <th className="py-3 px-4 text-right text-sm font-bold text-text-muted">금액</th>
                              <th className="py-3 px-4 text-right text-sm font-bold text-text-muted">비중</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color/30">
                          {tableData.map(d => (
                              <tr key={d.name} className="hover:bg-surface-subtle/50 transition-colors">
                                  <td className="py-2.5 px-4 truncate max-w-[150px] sm:max-w-xs font-medium text-text-primary" title={d.name}>{d.name}</td>
                                  <td className="py-2.5 px-4 text-right font-mono font-medium text-text-primary">{formatCurrency(d.value)}</td>
                                  <td className="py-2.5 px-4 text-right font-bold text-brand-primary">{((d.value/total)*100).toFixed(1)}%</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                </div>
                </>
            ) : <p className="text-lg font-medium text-text-muted h-[400px] flex items-center justify-center bg-white rounded-xl border border-border-color/50">분석할 데이터가 부족합니다.</p>}
        </div>
    );

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-border-color">
            <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                주요 영업 수입/지출처 분석{periodBadge}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {renderAnalysisSection('Top 10 영업 수입처 (적요 기준)', topIncomes, allIncomes, totalIncome, '#10b981')}
                {renderAnalysisSection('Top 10 영업 지출처 (적요 기준)', topExpenses, allExpenses, totalExpense, '#ef4444')}
            </div>
        </div>
    );
};

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
}

const DeepDiveView: React.FC<Props> = ({ transactions, businessInfo, categories }) => {
    const [periodType, setPeriodType] = useState<'all' | 'year' | 'half' | 'quarter' | 'month'>('all');
    const [selectedValue, setSelectedValue] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const availablePeriods = useMemo(() => getAvailablePeriods(transactions), [transactions]);
    const categoryTypeMap = useMemo(() => new Map(categories.map(c => [c.name, c.type])), [categories]);

    useEffect(() => {
        setSelectedValue('all');
    }, [periodType]);

    const filteredTransactions = useMemo(() => {
        if (periodType === 'all' || selectedValue === 'all') {
            return transactions;
        }
        return transactions.filter(tx => {
            const year = tx.date.getFullYear();
            const month = tx.date.getMonth();
            switch (periodType) {
                case 'year': return String(year) === selectedValue;
                case 'month': return `${year}-${String(month + 1).padStart(2, '0')}` === selectedValue;
                case 'quarter': return `${year}-Q${Math.floor(month / 3) + 1}` === selectedValue;
                case 'half': return `${year}-H${month < 6 ? 1 : 2}` === selectedValue;
                default: return true;
            }
        });
    }, [transactions, periodType, selectedValue]);

    const operatingExpenseTransactions = useMemo(() => 
        filteredTransactions.filter(tx => categoryTypeMap.get(tx.category) === 'operating_expense'), 
    [filteredTransactions, categoryTypeMap]);

    const operatingTransactions = useMemo(() => 
        filteredTransactions.filter(tx => {
            const type = categoryTypeMap.get(tx.category);
            return type === 'operating_income' || type === 'operating_expense';
        }),
    [filteredTransactions, categoryTypeMap]);

    const periodOptions = useMemo(() => {
        if (periodType === 'all') return [];
        const keyMap = {
            year: 'years',
            half: 'halves',
            quarter: 'quarters',
            month: 'months',
        };
        return availablePeriods[keyMap[periodType as keyof typeof keyMap]];
    }, [periodType, availablePeriods]);

    const handleExportPdf = async () => {
        if (!contentRef.current || isExporting) return;
        setIsExporting(true);
        try {
            const periodSuffix = periodLabel.replace(/\s/g, '_');
            await exportViewToPdf(
                contentRef.current,
                `심층 분석 (${periodLabel})`,
                businessInfo.name,
                `${businessInfo.name}_심층분석_${periodSuffix}_${new Date().toISOString().slice(0,10)}`
            );
        } catch (err) {
            console.error('PDF 내보내기 오류:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const PeriodButton: React.FC<{type: typeof periodType, label:string}> = ({type, label}) => (
        <button onClick={() => setPeriodType(type)} className={`px-3 py-1 text-sm font-semibold rounded-md ${periodType === type ? 'bg-brand-primary text-text-on-light shadow' : 'text-text-muted'}`}>{label}</button>
    );

    // 기간 라벨 생성
    const periodLabel = useMemo(() => {
        if (periodType === 'all' || selectedValue === 'all') return '전체 기간';
        return selectedValue;
    }, [periodType, selectedValue]);

    // 섹션 제목에 기간 표시하는 배지
    const PeriodBadge = () => (
        <span className="ml-2 text-sm font-normal text-brand-accent bg-brand-primary/20 px-2 py-0.5 rounded-full">
            {periodLabel}
        </span>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
             <div className="relative p-6 md:p-8 rounded-3xl shadow-sm border border-border-color overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2000&auto=format&fit=crop" 
                  alt="Deep Dive Background" 
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                      </svg>
                    </div>
                    심층 분석
                  </h2>
                  <p className="mt-3 text-lg text-text-muted font-medium">우리 사업이 실제로 얼마나 벌고, 어디에 돈이 나가는지 좀 더 자세히 파고드는 화면입니다. 손익계산서(수입-지출 요약표), 고정비(매달 고정 나가는 돈) vs 변동비(매출에 따라 달라지는 돈) 분석 등을 통해 사업 구조를 꼼꼼하게 점검할 수 있습니다.</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-border-color flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      분석 기간 설정
                    </span>
                    <div className="flex items-center p-1.5 bg-surface-subtle rounded-xl border border-border-color/50">
                        <PeriodButton type="all" label="전체"/>
                        <PeriodButton type="year" label="연도별"/>
                        <PeriodButton type="half" label="반기별"/>
                        <PeriodButton type="quarter" label="분기별"/>
                        <PeriodButton type="month" label="월별"/>
                    </div>
                    {periodType !== 'all' && (
                        <select
                            value={selectedValue}
                            onChange={(e) => setSelectedValue(e.target.value)}
                            className="bg-surface-subtle border border-border-color rounded-xl px-4 py-2 text-sm font-bold text-text-primary focus:ring-2 focus:ring-brand-primary cursor-pointer"
                        >
                            <option value="all">전체</option>
                            {periodOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    )}
                </div>
                <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-sm hover:bg-brand-secondary transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                >
                    {isExporting ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            PDF 생성 중...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF 다운로드
                        </>
                    )}
                </button>
            </div>

            {/* PDF 캡처 영역 */}
            <div ref={contentRef} className="space-y-8">
                <IncomeStatementAnalysis transactions={filteredTransactions} categories={categories} periodBadge={<PeriodBadge />} />
                <FixedVariableCostAnalysis transactions={operatingExpenseTransactions} categories={categories} businessInfo={businessInfo} periodBadge={<PeriodBadge />} />
                <CashFlowAnalysis transactions={filteredTransactions} periodBadge={<PeriodBadge />} />
                <VendorCustomerAnalysis transactions={operatingTransactions} periodBadge={<PeriodBadge />} />
            </div>
        </div>
    );
};

export default DeepDiveView;