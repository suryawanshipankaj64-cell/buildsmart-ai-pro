'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { fetcher, postJson } from '@/lib/fetcher';
import { formatDate } from '@/lib/utils';
import ProjectPicker from '@/components/ProjectPicker';
import Modal from '@/components/Modal';
import { Camera, Bell, Trash2 } from 'lucide-react';

// Module 10 — Site & Field Management. Photo upload here records a URL
// (from any hosted image, e.g. a signed S3 link a mobile client would
// provide) plus optional geotag — matching the SitePhoto schema exactly.
export default function SitePage() {
  const { data: projects = [] } = useSWR('/api/projects', fetcher);
  const [projectId, setProjectId] = useState('');
  const activeId = projectId || projects[0]?.id || '';
  const { data: project } = useSWR(activeId ? `/api/projects/${activeId}` : null, fetcher);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', caption: '' });

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    await postJson('/api/photos', { projectId: activeId, ...form });
    await mutate(`/api/projects/${activeId}`);
    setOpen(false);
    setForm({ imageUrl: '', caption: '' });
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Are you sure you want to delete this inspection photo?')) return;
    try {
      await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      await mutate(`/api/projects/${activeId}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  }

  const overdueTasks = (project?.tasks ?? []).filter((t: any) => !t.isCompleted && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-5">
      <ProjectPicker projects={projects} value={activeId} onChange={setProjectId} />

      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm text-paper"><Bell size={16} /> Notifications</h3>
        {overdueTasks.length === 0 && <p className="text-sm text-signal-slate">No active alerts for this project.</p>}
        <ul className="space-y-2">
          {overdueTasks.map((t: any) => (
            <li key={t.id} className="rounded-md border border-signal-coral/30 bg-signal-coral/10 px-3 py-2 text-sm text-signal-coral">
              Task "{t.title}" ({t.phaseName}) was due {formatDate(t.dueDate)} and is still incomplete.
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-sm text-paper"><Camera size={16} /> Site photos</h3>
          <button onClick={() => setOpen(true)} className="rounded-md bg-signal-teal px-3 py-1.5 text-xs font-medium text-navy-950 hover:opacity-90">Upload photo</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(project?.sitePhotos ?? []).map((photo: any) => (
            // eslint-disable-next-line @next/next/no-img-element
            <div key={photo.id} className="group relative overflow-hidden rounded-md border border-blueprint-line bg-navy-950">
              <img src={photo.imageUrl} alt={photo.caption || 'Site photo'} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between p-2">
                <p className="text-xs text-signal-slate truncate">{photo.caption || formatDate(photo.uploadedAt)}</p>
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="text-signal-slate hover:text-signal-coral p-1 transition-colors"
                  title="Delete photo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {project && project.sitePhotos.length === 0 && <p className="text-sm text-signal-slate">No photos uploaded yet.</p>}
      </div>

      {open && (
        <Modal title="Upload site photo" onClose={() => setOpen(false)}>
          <form onSubmit={addPhoto} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Image URL</label>
              <input required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper" />
              <p className="mt-1 text-xs text-signal-slate">On mobile this would come from the camera capture upload; paste a hosted image URL here for now.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Caption (optional)</label>
              <input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper" />
            </div>
            <button type="submit" className="w-full rounded-md bg-signal-teal py-2.5 text-sm font-medium text-navy-950 hover:opacity-90">Save photo</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
