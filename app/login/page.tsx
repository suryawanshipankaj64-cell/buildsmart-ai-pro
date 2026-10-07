'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'admin_only') {
      setError('Access Restricted: The web console is reserved for Executive Administrators only. Engineers and Clients should use the mobile app.');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid administrator email or password.');
        setLoading(false);
      } else {
        // Verify that the logged-in user is an ADMIN
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        
        if (sessionData?.user?.role && sessionData.user.role.toUpperCase() !== 'ADMIN') {
          setError('Access Restricted: Only Administrator accounts can log in to the web console. Please use the mobile app.');
          await fetch('/api/auth/signout', { method: 'POST' });
          setLoading(false);
          return;
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-blueprint-line/70 bg-navy-900/90 p-8 shadow-2xl backdrop-blur-sm">
        {/* Header Branding */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-teal/15 text-signal-teal shadow-inner border border-signal-teal/30">
            <ShieldCheck size={32} />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-paper">
            BuildSmart AI
          </h1>
          <p className="mt-1 text-xs font-mono font-medium text-signal-slate uppercase tracking-wider">
            Executive Admin Console
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-signal-coral/40 bg-signal-coral/10 p-3.5 text-xs text-signal-coral leading-relaxed">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-mono font-medium text-signal-slate uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-signal-slate" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pankajsuryawanshi7764@gmail.com"
                className="w-full rounded-lg border border-blueprint-line bg-navy-800/80 py-3 pl-11 pr-4 text-sm text-paper placeholder:text-signal-slate/50 focus:border-signal-teal focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-mono font-medium text-signal-slate uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-signal-slate" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-blueprint-line bg-navy-800/80 py-3 pl-11 pr-4 text-sm text-paper placeholder:text-signal-slate/50 focus:border-signal-teal focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-signal-teal py-3 text-sm font-mono font-bold text-navy-950 shadow-md transition-all hover:bg-signal-teal/90 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>AUTHENTICATING...</span>
              </div>
            ) : (
              'SIGN IN AS ADMIN'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}