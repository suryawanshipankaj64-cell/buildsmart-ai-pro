import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 p-6 text-center text-paper">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blueprint-line bg-navy-900 text-signal-teal shadow-xl">
        <FileQuestion size={28} />
      </div>
      <h2 className="font-display text-3xl font-bold text-paper">Page Not Found</h2>
      <p className="mt-2 max-w-sm text-xs text-signal-slate">
        The requested resource, project link, or report could not be found or may have been relocated.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 flex items-center gap-2 rounded-xl bg-signal-teal px-5 py-2.5 text-xs font-bold text-navy-950 hover:opacity-90 transition-opacity shadow-md"
      >
        <Home size={14} /> Back to Dashboard
      </Link>
    </div>
  );
}
