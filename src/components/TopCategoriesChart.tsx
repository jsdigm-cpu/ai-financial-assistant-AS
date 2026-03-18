import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Transaction } from '../types';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const TopCategoriesChart: React.FC<Props> = ({ data, type }) => {
  const chartData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(t => {
      const amount = type === 'operating_income' ? t.credit : t.debit;
      if (amount > 0 && t.category !== '미분류') {
        groups[t.category] = (groups[t.category] || 0) + amount;
      }
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data, type]);

  if (chartData.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-400">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
          <Tooltip formatter={(value: number) => value.toLocaleString() + '원'} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopCategoriesChart;
