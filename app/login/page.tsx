'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardHat, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-blueprint-line bg-navy-900 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-signal-teal/15 text-signal-teal">
            <HardHat size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-paper">BuildSmart AI</h1>
          <p className="text-xs text-signal-slate">Sign in to access your construction workspace</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-signal-coral/30 bg-signal-coral/10 p-3 text-xs text-signal-coral">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-signal-slate">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-signal-slate" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@buildsmart.com"
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 py-2.5 pl-10 pr-4 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-signal-slate">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-signal-slate" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 py-2.5 pl-10 pr-4 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-signal-teal py-2.5 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        {/* Quick Fill Demo Profiles */}
        <div className="mt-6 border-t border-blueprint-line pt-4">
          <p className="text-[10px] font-mono font-bold tracking-wider text-signal-slate uppercase text-center mb-2.5">
            Quick Sign-In Profiles
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('pankajsuryawanshi7764@gmail.com');
                setPassword('9403496516');
              }}
              className="rounded-md border border-signal-teal/40 bg-signal-teal/10 px-2 py-1.5 text-center text-[11px] font-mono font-bold text-signal-teal hover:bg-signal-teal/20 transition-colors"
            >
              Exec Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('engineer@buildsmart.ai');
                setPassword('engineer123');
              }}
              className="rounded-md border border-blueprint-line bg-navy-800 px-2 py-1.5 text-center text-[11px] font-mono text-signal-slate hover:text-paper hover:bg-navy-700 transition-colors"
            >
              Site Eng
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('pm@buildsmart.ai');
                setPassword('pm123');
              }}
              className="rounded-md border border-blueprint-line bg-navy-800 px-2 py-1.5 text-center text-[11px] font-mono text-signal-slate hover:text-paper hover:bg-navy-700 transition-colors"
            >
              Senior PM
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-signal-slate">
          Don't have an account?{' '}
          <Link href="/register" className="text-signal-teal hover:underline">
            Register site
          </Link>
        </div>
      </div>
    </div>
  );
}