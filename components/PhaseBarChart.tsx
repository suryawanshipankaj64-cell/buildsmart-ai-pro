'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DEFAULT_PHASES } from '@/lib/estimation';

interface PhaseBarChartProps {
  tasks?: Array<{
    id: string;
    phaseName: string;
    isCompleted: boolean;
  }>;
  data?: Array<{
    phase?: string;
    name?: string;
    progress?: number;
    percent?: number;
    total?: number;
    completed?: number;
  }>;
}

export default function PhaseBarChart({ tasks = [], data }: PhaseBarChartProps) {
  // Normalize incoming data or compute from tasks across all DEFAULT_PHASES
  const chartData = (data && data.length > 0)
    ? data.map((d) => {
        const fullName = d.phase || d.name || 'Phase';
        return {
          name: fullName,
          shortName: fullName.length > 12 ? `${fullName.slice(0, 10)}…` : fullName,
          progress: Number(d.progress ?? d.percent) || 0,
          total: d.total ?? 0,
          completed: d.completed ?? 0,
        };
      })
    : DEFAULT_PHASES.map((phase) => {
        const phaseTasks = tasks.filter((t) => t.phaseName === phase);
        const total = phaseTasks.length;
        const completed = phaseTasks.filter((t) => t.isCompleted).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          name: phase,
          shortName: phase.length > 12 ? `${phase.slice(0, 10)}…` : phase,
          progress,
          total,
          completed,
        };
      });

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 15, left: -20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2A4A6B" vertical={false} opacity={0.4} />
          
          <XAxis
            dataKey="shortName"
            stroke="#8EABC7"
            tick={{ fill: '#8EABC7', fontSize: 10 }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />

          <YAxis
            domain={[0, 100]}
            stroke="#8EABC7"
            tick={{ fill: '#8EABC7', fontSize: 11 }}
            ticks={[0, 25, 50, 75, 100]}
          />

          <Tooltip
            cursor={{ fill: 'rgba(42, 74, 107, 0.25)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-md border border-blueprint-line bg-navy-950 p-2.5 shadow-xl text-xs">
                    <p className="font-semibold text-paper">{item.name}</p>
                    <p className="mt-1 font-medium text-signal-teal">
                      Completion: {item.progress}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-signal-slate">
                      {item.completed} of {item.total} tasks completed
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="progress"
            fill="#2DBF9E"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            minPointSize={3} // Ensures 0% bars show a tiny indicator line
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}