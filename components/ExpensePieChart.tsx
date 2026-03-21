'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#00f0ff', '#ff3366', '#a855f7', '#00ff88', '#facc15', '#fb923c', '#60a5fa'];

export default function ExpensePieChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[250px] flex items-center justify-center text-[#8e95a5] text-sm text-center">
        Bu ay henüz gider işlenmediği için pasta grafik çıkartılamıyor.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0d17', borderColor: '#ffffff14', borderRadius: '12px' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#8e95a5' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
