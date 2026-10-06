'use client';

// Half-speedometer gauge, 0-100. Purely a function of the `score` prop —
// the caller (risk page / dashboard) always derives that score live from
// computeRisk() in lib/risk.ts, never a fixed value.
export default function RiskGauge({ score, level = 'Low' }: { score: number; level?: 'Low' | 'Medium' | 'High' | string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180; // 0-180 degrees across the semicircle
  const needleColor = level === 'Low' ? '#2DBF9E' : level === 'Medium' ? '#E8912D' : '#E8603C';

  const rad = (Math.PI * (180 - angle)) / 180;
  const cx = 100, cy = 100, r = 78;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[240px]">
        <path d="M 22 100 A 78 78 0 0 1 68 27" fill="none" stroke="#2DBF9E" strokeWidth="14" strokeLinecap="round" />
        <path d="M 68 27 A 78 78 0 0 1 132 27" fill="none" stroke="#E8912D" strokeWidth="14" strokeLinecap="round" />
        <path d="M 132 27 A 78 78 0 0 1 178 100" fill="none" stroke="#E8603C" strokeWidth="14" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={x} y2={y} stroke="#F5F3ED" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#F5F3ED" />
      </svg>
      <p className="font-display text-3xl" style={{ color: needleColor }}>{clamped.toFixed(0)}%</p>
      <p className="text-xs uppercase tracking-wide text-signal-slate">{level} risk</p>
    </div>
  );
}

