'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, Trash2, MapPin, Copy, Check } from 'lucide-react';
import { fetcher, postJson } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import Modal from '@/components/Modal';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';
import ImageUploader from '@/components/ImageUploader';

export default function ProjectsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const userEmail = session?.user?.email || '';
  const isClient = userRole === 'CLIENT' || userEmail.toLowerCase().includes('client');

  const { data: projects = [], isLoading } = useSWR('/api/projects', fetcher);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    location: '',
    builtUpAreaSqFt: '',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    coverImageUrl: '',
    autoSeed: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        builtUpAreaSqFt: Number(form.builtUpAreaSqFt) || 0,
        budget: Number(form.budget) || 0,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
        coverImageUrl: form.coverImageUrl,
        autoSeed: form.autoSeed,
      };

      await postJson('/api/projects', payload);
      await mutate('/api/projects');
      setOpen(false);
      setForm({
        name: '',
        location: '',
        builtUpAreaSqFt: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        coverImageUrl: '',
        autoSeed: true,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }
      await mutate('/api/projects');
    } catch (err: any) {
      alert(err.message || 'Could not delete project');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-paper">
            {isClient ? 'My Assigned Project' : 'Projects'}
          </h2>
          <p className="text-xs text-signal-slate mt-0.5">
            {projects.length} project{projects.length === 1 ? '' : 's'} {isClient ? 'under active supervision' : 'managed'}
          </p>
        </div>
        {!isClient && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-md bg-signal-teal px-3.5 py-2 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90"
          >
            <Plus size={16} /> New project
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-signal-slate">Loading projects…</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p: any) => (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="group relative rounded-lg border border-blueprint-line bg-navy-900 p-5 transition-all duration-200 hover:border-signal-teal hover:shadow-lg"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-paper truncate group-hover:text-signal-teal transition-colors">
                {p.name}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={p.status} />
                {!isClient && (
                  <button
                    type="button"
                    title="Delete project"
                    disabled={deletingId === p.id}
                    onClick={(e) => handleDelete(e, p.id, p.name)}
                    className="rounded p-1 text-signal-slate hover:bg-signal-coral/15 hover:text-signal-coral disabled:opacity-50"
                  >
                    <Trash2 size={14} className={deletingId === p.id ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between gap-1 text-xs">
              <p className="flex items-center gap-1.5 text-signal-slate truncate">
                <MapPin size={12} className="text-signal-teal shrink-0" /> {p.location}
              </p>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(p.id);
                  alert(`Project ID copied to clipboard: ${p.id}`);
                }}
                title="Click to copy Project ID for Client / Engineer"
                className="inline-flex items-center gap-1 bg-cyan-950/80 border border-cyan-700/50 hover:border-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 transition-colors cursor-pointer"
              >
                <span>ID: {p.id.length > 12 ? `${p.id.slice(0, 10)}...` : p.id}</span>
                <Copy size={10} className="text-cyan-400 shrink-0" />
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between border-t border-blueprint-line/40 pt-2.5 text-sm">
              <span className="text-signal-slate text-xs">Budget</span>
              <span className="font-display text-base font-semibold text-paper font-mono">
                {formatCurrency(p.budget)}
              </span>
            </div>

            <ProgressBar percent={p.progressPercent} />

            <div className="mt-2 flex items-center justify-between text-xs text-signal-slate">
              <span>{p.progressPercent}% complete</span>
              <span>Ends {formatDate(p.endDate)}</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && projects.length === 0 && (
        <div className="rounded-lg border border-blueprint-line bg-navy-900 p-10 text-center">
          <p className="text-sm text-signal-slate">No projects yet — create your first one to get started.</p>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-signal-teal px-4 py-2 text-xs font-semibold text-navy-950 hover:opacity-90"
          >
            <Plus size={14} /> Create project
          </button>
        </div>
      )}

      {open && (
        <Modal title="Create project" onClose={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs text-signal-slate">Project name</label>
              <input
                required
                placeholder="e.g. Skyline Residency Tower A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-signal-slate">Location / address</label>
              <input
                required
                placeholder="e.g. Sector 4, Hinjewadi, Pune"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>

            {/* Architectural Blueprint & Cover Photo Image Uploader */}
            <ImageUploader
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              label="Blueprint / Elevation / Cover Photo (Optional)"
              helperText="Upload architectural CAD drawing, 3D rendering, or site blueprint."
              allowPresets={true}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-signal-slate">Built-up area (sq.ft)</label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="2400"
                  value={form.builtUpAreaSqFt}
                  onChange={(e) => setForm({ ...form, builtUpAreaSqFt: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-signal-slate">Total budget (₹)</label>
                <input
                  type="number"
                  min={0}
                  required
                  placeholder="5000000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-signal-slate">Start date</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-signal-slate">Target completion</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Auto-Seed Option Toggle */}
            <div className="flex items-start gap-2.5 rounded-md border border-blueprint-line/70 bg-navy-900/80 p-3">
              <input
                type="checkbox"
                id="autoSeedCheck"
                checked={form.autoSeed}
                onChange={(e) => setForm({ ...form, autoSeed: e.target.checked })}
                className="mt-0.5 accent-signal-teal h-4 w-4 rounded cursor-pointer"
              />
              <label htmlFor="autoSeedCheck" className="text-xs text-paper cursor-pointer select-none">
                <span className="font-semibold text-signal-teal">⚡ Auto-Seed Standard Phase Tasks</span>
                <span className="block text-[11px] text-signal-slate mt-0.5">
                  Automatically generates 16 milestone deliverables across all 8 phases (Planning, Substructure, Superstructure, Plumbing, Electrical, Paint, Interior, Handover) assigned to Civil Contractor.
                </span>
              </label>
            </div>

            {error && <p className="text-xs text-signal-coral">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-signal-teal py-2.5 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}