'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Error Caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center text-paper">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-signal-coral/30 bg-signal-coral/10 text-signal-coral shadow-lg">
        <AlertTriangle size={28} />
      </div>
      <h2 className="font-display text-2xl font-bold text-paper">Something went wrong</h2>
      <p className="mt-2 max-w-md text-xs text-signal-slate leading-relaxed">
        An unexpected error occurred while loading this view. The system has automatically isolated the issue to prevent data corruption.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-signal-teal px-5 py-2.5 text-xs font-bold text-navy-950 hover:opacity-90 transition-opacity shadow-md"
        >
          <RefreshCw size={14} /> Try Again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-blueprint-line bg-navy-900 px-5 py-2.5 text-xs font-semibold text-paper hover:border-signal-teal transition-colors"
        >
          <Home size={14} /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
