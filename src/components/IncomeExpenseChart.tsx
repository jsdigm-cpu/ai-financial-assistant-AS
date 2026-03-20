import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Props {
  data: any[];
}

const fmt = (v: number) => v.toLocaleString('ko-KR') + '원';

const IncomeExpenseChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center text-gray-400">
        데이터가 없습니다.
      </div>
    );
  }

  // 영업이익누계: 사업순손익의 누적 합계
  let cumulative = 0;
  const chartData = data.map(d => {
    cumulative += (d['사업순손익'] || 0);
    return { ...d, '영업이익누계': cumulative };
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => (v / 10000).toFixed(0) + '만'} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          <Bar dataKey="사업매출" fill="#4ade80" name="사업매출" maxBarSize={40} />
          <Bar dataKey="사업비용" fill="#f87171" name="사업비용" maxBarSize={40} />
          <Bar dataKey="사업순손익" fill="#60a5fa" name="사업순손익" maxBarSize={40} />
          <Line
            type="monotone"
            dataKey="영업이익누계"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="영업이익누계"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
