import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { Transaction } from '../types';
import { CATEGORY_MAP } from '../constants';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
  categories?: any; // kept for backward compat, not used
}

const COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
];

const fmt = (v: number) => {
  if (Math.abs(v) >= 10000) return (v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '만원';
  return v.toLocaleString('ko-KR') + '원';
};

const CategoryPieChart: React.FC<Props> = ({ data, type }) => {
  const chartData = React.useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(t => {
      const cat = CATEGORY_MAP[t.category];
      if (cat && cat.type === type) {
        const amount = type === 'operating_income' ? t.credit : t.debit;
        if (amount > 0) {
          groups[t.category] = (groups[t.category] || 0) + amount;
        }
      }
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, type]);

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center text-gray-400 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      {/* 도넛 차트 */}
      <div className="w-full sm:w-44 h-44 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={70}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [fmt(value), '']}
              contentStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리 테이블 */}
      <div className="flex-1 overflow-x-auto min-w-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-1.5 text-left text-gray-500 font-medium text-xs">카테고리</th>
              <th className="py-1.5 text-right text-gray-500 font-medium text-xs">금액</th>
              <th className="py-1.5 text-right text-gray-500 font-medium text-xs">비율</th>
              <th className="py-1.5 text-right text-gray-500 font-medium text-xs">매출 대비</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => (
              <tr key={d.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="truncate text-xs font-medium text-gray-700">{d.name}</span>
                </td>
                <td className="py-1.5 text-right text-xs font-semibold text-gray-800">
                  {fmt(d.value)}
                </td>
                <td className="py-1.5 text-right text-xs text-gray-600">
                  {total > 0 ? (d.value / total * 100).toFixed(1) + '%' : '-'}
                </td>
                <td className="py-1.5 text-right text-xs text-gray-500">
                  {total > 0 ? (d.value / total * 100).toFixed(1) + '%' : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryPieChart;
