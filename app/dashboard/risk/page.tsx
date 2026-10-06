'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';

export default function RiskLandingPage() {
  const { data: projects = [], isLoading } = useSWR('/api/projects', fetcher);

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm text-signal-slate">See each project's budget, delay, material and labour risk scores.</p>

      {isLoading && <p className="text-sm text-signal-slate">Loading…</p>}

      {!isLoading && projects.length === 0 && (
        <div className="rounded-md border border-dashed border-blueprint-line p-8 text-center">
          <p className="text-sm text-signal-slate">No projects yet.</p>
          <Link href="/dashboard/projects" className="mt-3 inline-block rounded-md bg-signal-teal px-4 py-2 text-sm font-medium text-navy-950 hover:opacity-90">
            Create a project
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p: any) => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}?tab=Risk`} className="rounded-md border border-blueprint-line bg-navy-900 p-4 transition-colors hover:border-signal-teal">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-display text-base text-paper">{p.name}</h3>
              <StatusBadge status={p.status} />
            </div>
            <p className="mb-3 text-xs text-signal-slate">{p.location} · budget {formatCurrency(p.budget)}</p>
            <ProgressBar percent={p.progressPercent} />
            <p className="mt-2 text-xs text-signal-slate">{p.progressPercent}% complete · ends {formatDate(p.endDate)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
