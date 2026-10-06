'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { 
  FolderKanban, 
  Activity, 
  IndianRupee, 
  Receipt, 
  TrendingUp, 
  ShieldAlert, 
  MessageSquareText,
  Building2,
  Filter,
  CheckCircle2,
  ExternalLink,
  MapPin,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { computeRisk } from '@/lib/risk';
import { DEFAULT_PHASES, normalizePhaseName } from '@/lib/estimation';
import KpiCard from '@/components/KpiCard';
import DonutChart from '@/components/DonutChart';
import PhaseBarChart from '@/components/PhaseBarChart';
import RiskGauge from '@/components/RiskGauge';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardOverview() {
  const { data: projects = [], isLoading } = useSWR('/api/projects', fetcher, {
    refreshInterval: 3000,
  });
  const { data: expenses = [] } = useSWR('/api/expenses', fetcher, {
    refreshInterval: 3000,
  });
  const { data: tasks = [] } = useSWR('/api/tasks', fetcher, {
    refreshInterval: 3000,
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [prompt, setPrompt] = useState('');

  // Determine active single project (or null if "ALL")
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'ALL') return null;
    return projects.find((p: any) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Filtered expenses based on scope
  const filteredExpenses = useMemo(() => {
    if (!activeProject) return expenses;
    return expenses.filter((e: any) => e.projectId === activeProject.id);
  }, [expenses, activeProject]);

  // Filtered tasks based on scope
  const filteredTasks = useMemo(() => {
    if (!activeProject) return tasks;
    return tasks.filter((t: any) => t.projectId === activeProject.id);
  }, [tasks, activeProject]);

  // 1. Dynamic KPIs Calculation
  const kpis = useMemo(() => {
    if (activeProject) {
      // Single Project KPIs
      const budget = activeProject.estimate?.totalEstimatedCost ?? activeProject.budget ?? 0;
      const spent = filteredExpenses.reduce((s: number, e: any) => s + e.amount, 0);
      const remaining = budget - spent;
      const completedTasks = filteredTasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;
      const progress = Number(activeProject.progressPercent) || 0;
      return {
        isSingle: true as const,
        budget,
        spent,
        remaining,
        progress,
        completedTasks,
        totalTasks: filteredTasks.length,
        totalEstimated: budget,
        totalExpenses: spent,
        avgProgress: progress,
        active: 1,
      };
    } else {
      // All Projects (Portfolio Overall) KPIs
      const totalEstimated = projects.reduce((s: number, p: any) => s + (p.estimate?.totalEstimatedCost ?? p.budget ?? 0), 0);
      const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0);
      const avgProgress = projects.length ? projects.reduce((s: number, p: any) => s + (Number(p.progressPercent) || 0), 0) / projects.length : 0;
      const active = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'AT_RISK' || p.status === 'PLANNING').length;
      return {
        isSingle: false as const,
        budget: totalEstimated,
        spent: totalExpenses,
        remaining: totalEstimated - totalExpenses,
        progress: avgProgress,
        completedTasks: tasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length,
        totalTasks: tasks.length,
        totalEstimated,
        totalExpenses,
        avgProgress,
        active,
      };
    }
  }, [projects, expenses, tasks, activeProject, filteredExpenses, filteredTasks]);

  // 2. Dynamic Risk Calculation
  const calculatedRisk = useMemo(() => {
    if (activeProject) {
      // Risk for specific project
      const spent = filteredExpenses.reduce((s: number, e: any) => s + e.amount, 0);
      const openTasks = filteredTasks.filter((t: any) => !t.isCompleted);
      const risk = computeRisk({
        budget: activeProject.budget,
        totalEstimatedCost: activeProject.estimate?.totalEstimatedCost ?? activeProject.budget,
        spentSoFar: spent,
        progressPercent: activeProject.progressPercent,
        startDate: new Date(activeProject.startDate),
        endDate: new Date(activeProject.endDate),
        completedTaskDueDates: openTasks.map((t: any) => new Date(t.dueDate)),
        plannedLabourHeadcount: (activeProject.estimate?.masonCount ?? 0) + (activeProject.estimate?.electricianCount ?? 0) + (activeProject.estimate?.plumberCount ?? 0),
        actualLabourHeadcount: (activeProject.estimate?.masonCount ?? 0) + (activeProject.estimate?.electricianCount ?? 0) + (activeProject.estimate?.plumberCount ?? 0),
      });
      return { overallScore: risk.overallScore, level: risk.level, flags: risk.flags };
    } else {
      // Overall portfolio risk
      if (!projects.length) return { overallScore: 0, level: 'Low' as const, flags: [] };
      const scores = projects.map((p: any) => {
        const pExpenses = expenses.filter((e: any) => e.projectId === p.id);
        const spent = pExpenses.reduce((s: number, e: any) => s + e.amount, 0);
        const openTasks = (p.tasks ?? tasks.filter((t: any) => t.projectId === p.id)).filter((t: any) => !t.isCompleted);
        return computeRisk({
          budget: p.budget,
          totalEstimatedCost: p.estimate?.totalEstimatedCost ?? p.budget,
          spentSoFar: spent,
          progressPercent: p.progressPercent,
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate),
          completedTaskDueDates: openTasks.map((t: any) => new Date(t.dueDate)),
          plannedLabourHeadcount: (p.estimate?.masonCount ?? 0) + (p.estimate?.electricianCount ?? 0) + (p.estimate?.plumberCount ?? 0),
          actualLabourHeadcount: (p.estimate?.masonCount ?? 0) + (p.estimate?.electricianCount ?? 0) + (p.estimate?.plumberCount ?? 0),
        }).overallScore;
      });
      const overallScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      const level = overallScore < 30 ? 'Low' : overallScore < 70 ? 'Medium' : 'High';
      return { overallScore, level, flags: [] };
    }
  }, [projects, expenses, tasks, activeProject, filteredExpenses, filteredTasks]);

  // 3. Dynamic Cost Breakdown (Donut Data)
  const donutData = useMemo(() => {
    const groups: Record<string, number> = { Material: 0, Labour: 0, Equipment: 0, Overheads: 0, Other: 0 };
    for (const e of filteredExpenses) {
      const key = e.category.charAt(0) + e.category.slice(1).toLowerCase();
      groups[key] = (groups[key] ?? 0) + e.amount;
    }
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // 4. Dynamic Phase Progress Bar Chart Data
  const phaseChartData = useMemo(() => {
    const normTasks = filteredTasks.map((t: any) => ({
      ...t,
      phaseName: normalizePhaseName(t.phaseName),
    }));

    const customPhases: string[] = Array.from(
      new Set(
        normTasks
          .map((t: any) => normalizePhaseName(t.phaseName))
          .filter((p: string) => !DEFAULT_PHASES.includes(p))
      )
    );
    const phasesToMap: string[] = [...DEFAULT_PHASES, ...customPhases];

    return phasesToMap.map((phase) => {
      const phaseTasks = normTasks.filter((t: any) => t.phaseName.toLowerCase() === phase.toLowerCase());
      const total = phaseTasks.length;
      const completed = phaseTasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;
      const percent = total > 0
        ? Math.round(phaseTasks.reduce((s: number, t: any) => s + (t.isCompleted ? 100 : t.progressPercent || 0), 0) / total)
        : 0;

      return {
        phase,
        name: phase,
        percent,
        progress: percent,
        total,
        completed,
      };
    });
  }, [filteredTasks]);

  // 5. Recent Expenses & Upcoming Tasks
  const recentExpenses = useMemo(() => filteredExpenses.slice(0, 6), [filteredExpenses]);
  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t: any) => !t.isCompleted).sort((a: any, b: any) => +new Date(a.dueDate) - +new Date(b.dueDate)).slice(0, 6),
    [filteredTasks]
  );

  if (isLoading) return <p className="text-sm text-signal-slate">Loading dashboard…</p>;

  if (!projects.length) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-lg border border-dashed border-blueprint-line text-center">
        <FolderKanban size={36} className="mb-4 text-signal-slate" />
        <h2 className="font-display text-xl text-paper">No projects yet</h2>
        <p className="mt-2 max-w-sm text-sm text-signal-slate">
          Every chart and KPI on this dashboard is computed from your project data. Create your first project to see it come alive.
        </p>
        <Link href="/dashboard/projects" className="mt-5 rounded-md bg-signal-teal px-4 py-2 text-sm font-medium text-navy-950 hover:opacity-90">
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Global Project Filter & Scope Selector Bar */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-signal-teal" />
              <span className="text-xs font-mono font-bold text-signal-slate uppercase">DASHBOARD SCOPE:</span>
            </div>

            {/* Project Select Dropdown */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border border-signal-teal/60 bg-navy-950 px-3 py-1.5 text-sm font-medium text-paper focus:border-signal-teal focus:outline-none"
            >
              <option value="ALL">🌐 All Projects (Portfolio Overall Summary)</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  🏢 {p.name} ({p.location}) — {p.progressPercent}%
                </option>
              ))}
            </select>
          </div>

          {/* Quick Info & Direct Project Link */}
          {activeProject ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-signal-slate font-mono">
                <MapPin size={12} className="text-signal-teal" /> {activeProject.location}
              </span>
              <StatusBadge status={activeProject.status} />
              <Link
                href={`/dashboard/projects/${activeProject.id}`}
                className="flex items-center gap-1 rounded bg-signal-teal/15 px-2.5 py-1 text-xs font-mono font-bold text-signal-teal hover:bg-signal-teal/25"
              >
                Open Project Page <ExternalLink size={12} />
              </Link>
            </div>
          ) : (
            <span className="text-xs text-signal-slate font-mono">
              Displaying combined portfolio metrics across {projects.length} construction sites
            </span>
          )}
        </div>

        {/* Selected Project Scope Banner */}
        {activeProject && (
          <div className="mt-3 flex items-center justify-between rounded border border-signal-teal/30 bg-signal-teal/5 px-3 py-2 text-xs">
            <span className="text-paper">
              Currently viewing graphs and statistics specifically for <strong>{activeProject.name}</strong>.
            </span>
            <button
              onClick={() => setSelectedProjectId('ALL')}
              className="flex items-center gap-1 text-signal-teal hover:underline font-mono"
            >
              <RotateCcw size={11} /> Reset to All Projects
            </button>
          </div>
        )}
      </div>

      {/* 2. Top KPI Cards Matrix */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {kpis.isSingle ? (
          <>
            <KpiCard label="Allocated Budget" value={formatCurrency(kpis.budget)} icon={IndianRupee} accent="amber" />
            <KpiCard label="Total Spent" value={formatCurrency(kpis.spent)} icon={Receipt} accent="coral" />
            <KpiCard label="Remaining Funds" value={formatCurrency(kpis.remaining)} icon={IndianRupee} accent={kpis.remaining >= 0 ? 'teal' : 'coral'} />
            <KpiCard label="Project Execution" value={`${formatNumber(kpis.progress)}%`} icon={TrendingUp} accent="teal" />
            <KpiCard label="Milestone Tasks" value={`${kpis.completedTasks} / ${kpis.totalTasks}`} icon={CheckCircle2} accent="teal" />
            <KpiCard 
              label="Project Risk" 
              value={calculatedRisk.level} 
              icon={ShieldAlert} 
              accent={calculatedRisk.level === 'High' ? 'coral' : calculatedRisk.level === 'Medium' ? 'amber' : 'teal'} 
            />
          </>
        ) : (
          <>
            <KpiCard label="Total Projects" value={String(projects.length)} icon={FolderKanban} />
            <KpiCard label="Active Sites" value={String(kpis.active)} icon={Activity} accent="teal" />
            <KpiCard label="Total Est. Budget" value={formatCurrency(kpis.totalEstimated)} icon={IndianRupee} accent="amber" />
            <KpiCard label="Total Expenses" value={formatCurrency(kpis.totalExpenses)} icon={Receipt} accent="coral" />
            <KpiCard label="Avg. Progress" value={`${formatNumber(kpis.avgProgress)}%`} icon={TrendingUp} accent="teal" />
            <KpiCard 
              label="Overall Risk" 
              value={calculatedRisk.level} 
              icon={ShieldAlert} 
              accent={calculatedRisk.level === 'High' ? 'coral' : calculatedRisk.level === 'Medium' ? 'amber' : 'teal'} 
            />
          </>
        )}
      </div>

      {/* 3. Graphs Grid: Cost Breakdown, Phase Progress Bar Chart & Risk Gauge */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Graph 1: Cost Breakdown */}
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">Cost breakdown</h3>
            <span className="text-[10px] font-mono text-signal-slate">
              {activeProject ? activeProject.name : 'All Projects'}
            </span>
          </div>
          <DonutChart data={donutData} />
        </div>

        {/* Graph 2: Phase Progress Bar Chart */}
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">Phase progress</h3>
            <span className="text-[10px] font-mono text-signal-teal">
              {activeProject ? `${activeProject.name} (${activeProject.progressPercent}%)` : 'Portfolio Average'}
            </span>
          </div>
          <PhaseBarChart data={phaseChartData} />
        </div>

        {/* Graph 3: AI Risk Prediction Gauge */}
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">AI risk prediction</h3>
            <span className="text-[10px] font-mono text-signal-slate">
              {activeProject ? activeProject.name : 'Portfolio Score'}
            </span>
          </div>
          <RiskGauge score={calculatedRisk.overallScore} level={calculatedRisk.level} />
        </div>
      </div>

      {/* 4. Projects Table & AI Assistant */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">
              {activeProject ? `Project Focus: ${activeProject.name}` : 'Recent projects'}
            </h3>
            <Link href="/dashboard/projects" className="text-xs text-signal-teal hover:underline font-mono">
              View all ({projects.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-signal-slate font-mono">
                  <th className="pb-2 font-normal">Project</th>
                  <th className="pb-2 font-normal">Location</th>
                  <th className="pb-2 font-normal">Budget</th>
                  <th className="pb-2 font-normal">Progress</th>
                  <th className="pb-2 font-normal">End date</th>
                  <th className="pb-2 font-normal">Action / Status</th>
                </tr>
              </thead>
              <tbody>
                {(activeProject ? [activeProject] : projects.slice(0, 6)).map((p: any) => {
                  const isSelected = p.id === selectedProjectId;
                  return (
                    <tr 
                      key={p.id} 
                      className={`border-t border-blueprint-line/60 transition-colors ${
                        isSelected ? 'bg-signal-teal/5' : 'hover:bg-navy-950/40'
                      }`}
                    >
                      <td className="py-2.5 pr-2">
                        <Link href={`/dashboard/projects/${p.id}`} className="font-medium text-paper hover:text-signal-teal">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-2 text-signal-slate">{p.location}</td>
                      <td className="py-2.5 pr-2 text-signal-slate font-mono">{formatCurrency(p.budget)}</td>
                      <td className="w-32 py-2.5 pr-2">
                        <ProgressBar percent={p.progressPercent} />
                      </td>
                      <td className="py-2.5 pr-2 text-signal-slate font-mono">{formatDate(p.endDate)}</td>
                      <td className="py-2.5 flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <button
                          onClick={() => setSelectedProjectId(isSelected ? 'ALL' : p.id)}
                          className={`rounded px-2 py-0.5 text-[10px] font-mono transition-colors ${
                            isSelected
                              ? 'bg-signal-teal text-navy-950 font-bold'
                              : 'border border-blueprint-line text-signal-slate hover:text-paper'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Filter Graph'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Assistant card */}
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4 flex flex-col justify-between">
          <div>
            <h3 className="mb-1 font-display text-sm text-paper">AI assistant</h3>
            <p className="mb-3 text-xs text-signal-slate">
              {activeProject ? `Ask questions specifically about ${activeProject.name}` : 'Ask anything about your live project data.'}
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                activeProject ? `${activeProject.name} budget status?` : 'Remaining budget?',
                'Which project is at risk?',
                'Cement needed?',
              ].map((chip) => (
                <button 
                  key={chip} 
                  onClick={() => setPrompt(chip)} 
                  className="rounded-full border border-blueprint-line px-2.5 py-1 text-xs text-signal-slate hover:border-signal-teal hover:text-paper"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
          <Link
            href={{ pathname: '/dashboard/chat', query: prompt ? { q: prompt } : undefined }}
            className="flex items-center justify-center gap-2 rounded-md bg-signal-teal py-2 text-sm font-medium text-navy-950 hover:opacity-90"
          >
            <MessageSquareText size={16} /> Open AI chat
          </Link>
        </div>
      </div>

      {/* 5. Recent Expenses & Upcoming Tasks (Scoped to Selected Project or Overall) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">
              Recent expenses {activeProject ? `(${activeProject.name})` : ''}
            </h3>
            <span className="text-xs text-signal-slate font-mono">
              {filteredExpenses.length} total logged
            </span>
          </div>

          {recentExpenses.length === 0 && <p className="text-sm text-signal-slate">No expenses logged yet.</p>}
          <ul className="divide-y divide-blueprint-line/60">
            {recentExpenses.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-paper">{e.itemName}</p>
                  <p className="text-xs text-signal-slate">
                    {e.project?.name || activeProject?.name || 'Site'} · {e.category.toLowerCase()} · {formatDate(e.date)}
                  </p>
                </div>
                <span className="text-signal-amber font-mono font-medium">{formatCurrency(e.amount)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">
              Upcoming tasks {activeProject ? `(${activeProject.name})` : ''}
            </h3>
            <span className="text-xs text-signal-slate font-mono">
              {filteredTasks.filter((t: any) => !t.isCompleted).length} pending
            </span>
          </div>

          {upcomingTasks.length === 0 && <p className="text-sm text-signal-slate">No pending tasks.</p>}
          <ul className="divide-y divide-blueprint-line/60">
            {upcomingTasks.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-paper">{t.title}</p>
                  <p className="text-xs text-signal-slate">
                    {t.project?.name || activeProject?.name || 'Site'} · {t.phaseName} · due {formatDate(t.dueDate)}
                  </p>
                </div>
                <span className="rounded bg-navy-800 border border-blueprint-line/60 px-2 py-0.5 text-xs text-signal-teal font-mono">
                  {t.progressPercent || 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
