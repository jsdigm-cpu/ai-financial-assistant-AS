import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Transaction } from '../types';
import { CATEGORY_MAP } from '../constants';

interface Props {
  data: Transaction[];
  type: 'operating_income' | 'operating_expense';
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const fmtCell = (v: number) => v > 0 ? (v / 10000).toFixed(0) + '만원' : '-';

const TopCategoriesChart: React.FC<Props> = ({ data, type }) => {
  const { lineData, topCategories, monthlyRows } = React.useMemo(() => {
    // 1. type에 해당하는 거래만 필터 (CATEGORY_MAP 기준)
    const typedData = data.filter(t => {
      const cat = CATEGORY_MAP[t.category];
      return cat && cat.type === type;
    });

    // 2. 카테고리별 합계
    const totalByCategory: Record<string, number> = {};
    typedData.forEach(t => {
      const amount = type === 'operating_income' ? t.credit : t.debit;
      if (amount > 0) {
        totalByCategory[t.category] = (totalByCategory[t.category] || 0) + amount;
      }
    });

    // 3. 상위 5개 카테고리
    const top5 = Object.entries(totalByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    if (top5.length === 0) {
      return { lineData: [], topCategories: [], monthlyRows: [] };
    }

    // 4. 월별로 그룹핑
    const monthlyData: Record<string, Record<string, number>> = {};
    typedData.forEach(t => {
      const month = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) monthlyData[month] = {};
      const amount = type === 'operating_income' ? t.credit : t.debit;
      if (amount > 0 && top5.includes(t.category)) {
        monthlyData[month][t.category] = (monthlyData[month][t.category] || 0) + amount;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();

    const lineData = sortedMonths.map(month => ({
      name: month,
      ...top5.reduce((acc, cat) => ({ ...acc, [cat]: monthlyData[month][cat] || 0 }), {}),
    }));

    const monthlyRows = sortedMonths.map(month => ({
      month,
      values: top5.map(cat => monthlyData[month][cat] || 0),
    }));

    return { lineData, topCategories: top5, monthlyRows };
  }, [data, type]);

  if (lineData.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center text-gray-400 text-sm">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div>
      {/* 라인 차트 */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis
              tickFormatter={v => (v / 10000).toFixed(0) + '만'}
              tick={{ fontSize: 10 }}
            />
            <Tooltip formatter={(v: number) => [(v / 10000).toFixed(0) + '만원', '']} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {topCategories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 월별 데이터 테이블 */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-2 px-2 text-left text-gray-500 font-medium whitespace-nowrap">월</th>
              {topCategories.map((cat, i) => (
                <th
                  key={cat}
                  className="py-2 px-2 text-right text-gray-500 font-medium"
                  style={{ color: COLORS[i % COLORS.length] }}
                >
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map(row => (
              <tr key={row.month} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 px-2 font-medium text-gray-700 whitespace-nowrap">{row.month}</td>
                {row.values.map((v, i) => (
                  <td key={i} className="py-1.5 px-2 text-right text-gray-600">
                    {fmtCell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopCategoriesChart;
