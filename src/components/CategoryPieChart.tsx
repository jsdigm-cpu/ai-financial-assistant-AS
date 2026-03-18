import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Transaction, Category } from '../types';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
  categories: Category[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

const CategoryPieChart: React.FC<Props> = ({ data, type, categories }) => {
  const chartData = React.useMemo(() => {
    const relevantCategories = categories.filter(c => c.type === type);
    const categoryNames = relevantCategories.map(c => c.name);
    
    const groups: Record<string, number> = {};
    data.forEach(t => {
      if (categoryNames.includes(t.category)) {
        const amount = type === 'operating_income' ? t.credit : t.debit;
        if (amount > 0) {
          groups[t.category] = (groups[t.category] || 0) + amount;
        }
      }
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, type, categories]);

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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString() + '원'} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryPieChart;
