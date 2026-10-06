'use client';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DEFAULT_PHASES } from '@/lib/estimation';
import TrendLineChart from '@/components/TrendLineChart';
import PhaseBarChart from '@/components/PhaseBarChart';

export default function AnalyticsPage() {
  const { data: projects = [] } = useSWR('/api/projects', fetcher);
  const { data: expenses = [] } = useSWR('/api/expenses', fetcher);
  const { data: tasks = [] } = useSWR('/api/tasks', fetcher);

  const [projectFilter, setProjectFilter] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
      if (projectFilter !== 'ALL' && e.projectId !== projectFilter) return false;
      if (from && new Date(e.date) < new Date(from)) return false;
      if (to && new Date(e.date) > new Date(to)) return false;
      return true;
    });
  }, [expenses, projectFilter, from, to]);

  const trendData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const e of filteredExpenses) {
      const key = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      byDate[key] = (byDate[key] ?? 0) + e.amount;
    }
    return Object.entries(byDate)
      .sort((a, b) => +new Date(a[0]) - +new Date(b[0]))
      .map(([label, value]) => ({ label, value }));
  }, [filteredExpenses]);

  // Key fix: map to `progress`, calculate completion from isCompleted or progressPercent
  const phaseData = useMemo(() => {
    const scoped = projectFilter === 'ALL' 
      ? tasks 
      : tasks.filter((t: any) => t.projectId === projectFilter);

    return DEFAULT_PHASES.map((phase) => {
      const phaseTasks = scoped.filter((t: any) => t.phaseName === phase);
      const total = phaseTasks.length;
      const completed = phaseTasks.filter((t: any) => t.isCompleted).length;

      // Check both completion checkbox and progress percentage
      const calculatedProgress = total > 0
        ? Math.round(
            phaseTasks.reduce((sum: number, t: any) => {
              if (t.isCompleted) return sum + 100;
              return sum + (Number(t.progressPercent) || 0);
            }, 0) / total
          )
        : 0;

      return {
        phase,
        name: phase,
        progress: calculatedProgress,
        total,
        completed,
      };
    });
  }, [tasks, projectFilter]);

  const labourWageTotal = useMemo(
    () => filteredExpenses.filter((e: any) => e.category === 'LABOUR').reduce((s: number, e: any) => s + e.amount, 0),
    [filteredExpenses]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div>
          <label className="mb-1.5 block text-xs text-signal-slate">Project</label>
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)} 
            className="rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
          >
            <option value="ALL">All projects</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-signal-slate">From</label>
          <input 
            type="date" 
            value={from} 
            onChange={(e) => setFrom(e.target.value)} 
            className="rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none [color-scheme:dark]" 
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-signal-slate">To</label>
          <input 
            type="date" 
            value={to} 
            onChange={(e) => setTo(e.target.value)} 
            className="rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none [color-scheme:dark]" 
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <h3 className="mb-2 font-display text-sm text-paper">Cost outflow trend</h3>
          <TrendLineChart data={trendData} />
        </div>
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <h3 className="mb-2 font-display text-sm text-paper">Phase-wise progress</h3>
          <PhaseBarChart data={phaseData} />
        </div>
      </div>

      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <h3 className="mb-1 font-display text-sm text-paper">Labour wage outflow</h3>
        <p className="font-display text-2xl text-signal-teal">{formatCurrency(labourWageTotal)}</p>
        <p className="text-xs text-signal-slate">Sum of expenses logged under the labour category, for the selected filters.</p>
      </div>

      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <h3 className="mb-3 font-display text-sm text-paper">Custom report — filtered transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-signal-slate">
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Project</th>
                <th className="pb-2 font-normal">Category</th>
                <th className="pb-2 font-normal">Item</th>
                <th className="pb-2 font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((e: any) => (
                <tr key={e.id} className="border-t border-blueprint-line/60">
                  <td className="py-2 text-signal-slate">{formatDate(e.date)}</td>
                  <td className="py-2 text-paper">{e.project?.name}</td>
                  <td className="py-2 text-signal-slate">{e.category.toLowerCase()}</td>
                  <td className="py-2 text-paper">{e.itemName}</td>
                  <td className="py-2 text-signal-amber">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <p className="py-4 text-center text-sm text-signal-slate">No transactions match these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}