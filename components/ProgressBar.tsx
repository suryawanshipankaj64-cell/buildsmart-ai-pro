import { cx } from '@/lib/utils';

export default function ProgressBar({ percent, tone = 'teal' }: { percent: number; tone?: 'teal' | 'amber' | 'coral' }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const colors = { teal: 'bg-signal-teal', amber: 'bg-signal-amber', coral: 'bg-signal-coral' };
  return (
    <div className="h-1.5 w-full rounded-full bg-navy-800">
      <div className={cx('h-1.5 rounded-full transition-all', colors[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
