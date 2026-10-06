import { type LucideIcon } from 'lucide-react';
import { cx } from '@/lib/utils';

export default function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'slate',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'slate' | 'amber' | 'teal' | 'coral';
}) {
  const accentMap = {
    slate: 'text-signal-slate',
    amber: 'text-signal-amber',
    teal: 'text-signal-teal',
    coral: 'text-signal-coral',
  };
  return (
    <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-signal-slate">{label}</span>
        <Icon size={16} className={cx(accentMap[accent])} />
      </div>
      <p className="mt-2 font-display text-2xl text-paper">{value}</p>
    </div>
  );
}
