'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DashboardChart({ data }: { data: any[] }) {
  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="w-full h-[300px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-neon-green)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-neon-green)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-neon-red)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-neon-red)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" stroke="#8e95a5" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8e95a5" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₺${value}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(15, 17, 21, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ fontWeight: 'bold' }}
            formatter={(value: any) => formatMoney(value)}
            labelStyle={{ color: '#8e95a5', marginBottom: '8px' }}
          />
          <Area type="monotone" dataKey="income" name="Giriş (Gelir)" stroke="var(--color-neon-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="expense" name="Çıkış (Gider)" stroke="var(--color-neon-red)" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
