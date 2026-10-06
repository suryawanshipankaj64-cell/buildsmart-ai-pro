'use client';
import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function TopBar({ title }: { title: string }) {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="flex items-center justify-between border-b border-blueprint-line bg-navy-900/80 px-6 py-4 backdrop-blur">
      <h1 className="font-display text-xl text-paper">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-paper">{user?.name}</p>
          <p className="text-xs capitalize text-signal-slate">{user?.role?.toLowerCase()}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 rounded-md border border-blueprint-line px-3 py-1.5 text-xs text-signal-slate transition-colors hover:border-signal-coral hover:text-signal-coral"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </header>
  );
}
