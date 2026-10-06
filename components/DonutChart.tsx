'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#2DBF9E', '#E8912D', '#8EA3B8', '#E8603C', '#5B7A9E'];

export default function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return <p className="flex h-56 items-center justify-center text-sm text-signal-slate">No expenses logged yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={224}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0D1B2A" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#122542', border: '1px solid #2A4A6B', borderRadius: 6, color: '#F5F3ED' }}
          formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8EA3B8' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
