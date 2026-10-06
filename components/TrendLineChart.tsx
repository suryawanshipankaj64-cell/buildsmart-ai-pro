'use client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export default function TrendLineChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) {
    return <p className="flex h-56 items-center justify-center text-sm text-signal-slate">No expense history yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#8EA3B8', fontSize: 11 }} axisLine={{ stroke: '#2A4A6B' }} tickLine={false} />
        <YAxis tick={{ fill: '#8EA3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#122542', border: '1px solid #2A4A6B', borderRadius: 6, color: '#F5F3ED' }}
          formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
        />
        <Line type="monotone" dataKey="value" stroke="#E8912D" strokeWidth={2} dot={{ r: 3, fill: '#E8912D' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
