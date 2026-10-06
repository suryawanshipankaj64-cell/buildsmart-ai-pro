const STYLES: Record<string, string> = {
  PLANNING: 'bg-signal-slate/15 text-signal-slate border-signal-slate/30',
  ACTIVE: 'bg-signal-teal/15 text-signal-teal border-signal-teal/30',
  ON_HOLD: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30',
  AT_RISK: 'bg-signal-coral/15 text-signal-coral border-signal-coral/30',
  COMPLETED: 'bg-signal-teal/25 text-signal-teal border-signal-teal/40',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.PLANNING;
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs ${style}`}>
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
}
