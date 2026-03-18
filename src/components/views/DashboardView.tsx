import React from 'react';
import { Transaction, BusinessInfo, Category } from '../../types';
import KPICard from '../KPICard';
import IncomeExpenseChart from '../IncomeExpenseChart';
import CategoryPieChart from '../CategoryPieChart';
import TopCategoriesChart from '../TopCategoriesChart';

interface Props {
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  categories: Category[];
}

const DashboardView: React.FC<Props> = ({ transactions, businessInfo, categories }) => {
  const totalIncome = transactions.reduce((sum, tx) => sum + tx.credit, 0);
  const totalExpense = transactions.reduce((sum, tx) => sum + tx.debit, 0);
  const netProfit = totalIncome - totalExpense;

  const chartData = React.useMemo(() => {
    const monthlyData: Record<string, { month: string, income: number, expense: number }> = {};
    
    transactions.forEach(tx => {
      const month = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expense: 0 };
      }
      monthlyData[month].income += tx.credit;
      monthlyData[month].expense += tx.debit;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="총 수입" 
          value={totalIncome} 
          formatAsCurrency={true}
        />
        <KPICard 
          title="총 지출" 
          value={totalExpense} 
          formatAsCurrency={true}
        />
        <KPICard 
          title="당기 순이익" 
          value={netProfit} 
          formatAsCurrency={true}
          trend={netProfit}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">수입/지출 추이</h3>
          <IncomeExpenseChart data={chartData} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
          <h3 className="text-lg font-bold text-text-primary mb-4">지출 카테고리 분포</h3>
          <CategoryPieChart data={transactions} categories={categories} type="operating_expense" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border-color">
        <h3 className="text-lg font-bold text-text-primary mb-4">주요 지출 항목 (Top 5)</h3>
        <TopCategoriesChart data={transactions} type="operating_expense" />
      </div>
    </div>
  );
};

export default DashboardView;
