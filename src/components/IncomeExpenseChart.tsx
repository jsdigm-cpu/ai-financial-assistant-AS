import React from 'react';
import {
  BarChart,
  Bar,
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

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => (v / 10000).toFixed(0) + '만'} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          <Bar dataKey="사업매출" fill="#4ade80" name="사업매출" />
          <Bar dataKey="사업비용" fill="#f87171" name="사업비용" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeExpenseChart;
