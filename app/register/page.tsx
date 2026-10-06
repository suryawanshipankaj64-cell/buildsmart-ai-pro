'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HardHat, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer / Client' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'ENGINEER', label: 'Project Engineer' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Registration failed.');
      return;
    }
    router.push('/login');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="blueprint-bg relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-signal-teal/15 font-display text-signal-teal">B</div>
          <span className="font-display text-lg text-paper">BuildSmart <span className="text-signal-teal">AI Pro</span></span>
        </div>
        <div className="max-w-md">
          <HardHat size={40} className="mb-6 text-signal-teal" />
          <h2 className="font-display text-3xl leading-tight text-paper">One account, every role on the site.</h2>
          <p className="mt-4 text-sm leading-relaxed text-signal-slate">
            Clients track budgets, contractors log expenses, engineers manage phases — the same live project data, scoped to what each role needs to see.
          </p>
        </div>
        <p className="text-xs text-signal-slate">© {new Date().getFullYear()} BuildSmart AI Pro</p>
      </div>

      <div className="flex items-center justify-center bg-navy-950 p-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-paper">Create your account</h1>
          <p className="mt-1 text-sm text-signal-slate">Start planning and estimating in minutes.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2.5 text-sm text-paper focus:border-signal-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Work email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2.5 text-sm text-paper focus:border-signal-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2.5 text-sm text-paper focus:border-signal-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2.5 text-sm text-paper focus:border-signal-teal focus:outline-none">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Company (optional)</label>
              <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2.5 text-sm text-paper focus:border-signal-teal focus:outline-none" />
            </div>

            {error && <p className="rounded-md border border-signal-coral/30 bg-signal-coral/10 px-3 py-2 text-xs text-signal-coral">{error}</p>}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-signal-teal py-2.5 text-sm font-medium text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-signal-slate">
            Already registered? <Link href="/login" className="text-signal-teal hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
