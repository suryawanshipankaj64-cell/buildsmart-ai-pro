'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { fetcher, postJson } from '@/lib/fetcher';
import { formatDate } from '@/lib/utils';
import ProjectPicker from '@/components/ProjectPicker';
import Modal from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';
import { getConstructionFallbackImage } from '@/lib/fallbackImages';
import { Camera, Bell, Trash2, MapPin, Maximize2, X, Navigation, CheckCircle2, Layers } from 'lucide-react';

const PHASES = [
  'Planning',
  'Substructure & Foundation',
  'Superstructure & Masonry',
  'Plumbing Work',
  'Electrical Work',
  'Paint & Finishing Work',
  'Interior & Woodwork',
  'Handover & Commissioning',
];

export default function SitePage() {
  const { data: projects = [] } = useSWR('/api/projects', fetcher);
  const [projectId, setProjectId] = useState('');
  const activeId = projectId || projects[0]?.id || '';
  const { data: project } = useSWR(activeId ? `/api/projects/${activeId}` : null, fetcher);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    imageUrl: '',
    caption: '',
    phase: 'Planning',
    latitude: '',
    longitude: '',
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<any | null>(null);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGettingLocation(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Could not retrieve current GPS position. Please enter manually if needed.');
        setGettingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      alert('Please select or upload an image.');
      return;
    }

    setSaving(true);
    try {
      const formattedCaption = form.caption.trim()
        ? `[${form.phase}] ${form.caption.trim()}`
        : `[${form.phase}] Site Inspection Proof`;

      await postJson('/api/photos', {
        projectId: activeId,
        imageUrl: form.imageUrl.trim(),
        caption: formattedCaption,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      });

      await mutate(`/api/projects/${activeId}`);
      await mutate('/api/projects');
      setOpen(false);
      setForm({ imageUrl: '', caption: '', phase: 'Planning', latitude: '', longitude: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
    }
  }

  async function deletePhoto(e: React.MouseEvent, photoId: string) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this inspection photo?')) return;
    try {
      await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      await mutate(`/api/projects/${activeId}`);
      await mutate('/api/projects');
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  }

  const overdueTasks = (project?.tasks ?? []).filter((t: any) => !t.isCompleted && new Date(t.dueDate) < new Date());
  const sitePhotos = project?.sitePhotos ?? [];

  return (
    <div className="space-y-5">
      <ProjectPicker projects={projects} value={activeId} onChange={setProjectId} />

      {/* Alerts & Notifications */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <h3 className="mb-3 flex items-center gap-2 font-display text-sm text-paper">
          <Bell size={16} /> Site Alerts & Schedule Notifications
        </h3>
        {overdueTasks.length === 0 && <p className="text-xs text-signal-slate">No active overdue alerts for this project.</p>}
        <ul className="space-y-2">
          {overdueTasks.map((t: any) => (
            <li key={t.id} className="rounded-md border border-signal-coral/30 bg-signal-coral/10 px-3 py-2 text-xs text-signal-coral">
              Task "{t.title}" ({t.phaseName}) was due {formatDate(t.dueDate)} and is still incomplete.
            </li>
          ))}
        </ul>
      </div>

      {/* Site Photos Section */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-paper">
              <Camera size={16} className="text-signal-teal" /> Site Inspection Photos & Data
            </h3>
            <p className="text-xs text-signal-slate mt-0.5">
              {sitePhotos.length} proof-of-work inspection {sitePhotos.length === 1 ? 'record' : 'records'} captured
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-signal-teal px-3.5 py-1.5 text-xs font-semibold text-navy-950 transition-opacity hover:opacity-90"
          >
            <Camera size={14} /> Upload Inspection Photo
          </button>
        </div>

        {sitePhotos.length === 0 ? (
          <div className="rounded-md border border-dashed border-blueprint-line bg-navy-950/60 p-10 text-center">
            <Camera size={36} className="mx-auto mb-2 opacity-40 text-signal-teal" />
            <p className="text-xs font-medium text-paper">No photos uploaded yet for this project</p>
            <p className="text-[11px] text-signal-slate mt-1 max-w-sm mx-auto">
              Upload architectural blueprints, site elevation drawings, or mobile inspection photos to store proof-of-work.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-signal-teal px-3 py-1.5 text-xs font-semibold text-navy-950 hover:opacity-90"
            >
              <Camera size={13} /> Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sitePhotos.map((photo: any) => (
              <div
                key={photo.id}
                onClick={() => setSelectedLightboxPhoto(photo)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-md border border-blueprint-line bg-navy-950 cursor-pointer transition-all duration-200 hover:border-signal-teal hover:shadow-lg"
              >
                {/* Photo Preview Thumbnail */}
                <div className="relative aspect-[16/9] min-h-[160px] w-full overflow-hidden bg-navy-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl || getConstructionFallbackImage(photo.caption, photo.caption)}
                    alt={photo.caption || 'Site photo'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getConstructionFallbackImage(photo.caption, photo.caption);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-50" />
                  <div className="absolute right-2 top-2 rounded bg-navy-950/80 p-1 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Maximize2 size={13} />
                  </div>
                </div>

                {/* Photo Caption & Telemetry Details */}
                <div className="p-3 space-y-2">
                  <p className="line-clamp-2 text-xs font-semibold text-paper">
                    {photo.caption || 'Site Inspection Proof'}
                  </p>

                  <div className="flex items-center justify-between border-t border-blueprint-line/40 pt-2 text-[11px] text-signal-slate font-mono">
                    {photo.latitude && photo.longitude ? (
                      <span className="flex items-center gap-1 text-signal-teal">
                        <MapPin size={11} /> {photo.latitude.toFixed(2)}, {photo.longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span>{formatDate(photo.uploadedAt)}</span>
                    )}

                    <button
                      onClick={(e) => deletePhoto(e, photo.id)}
                      className="rounded p-1 text-signal-slate hover:bg-signal-coral/20 hover:text-signal-coral transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Photo Modal */}
      {open && (
        <Modal title="Upload Site Inspection Photo" onClose={() => setOpen(false)}>
          <form onSubmit={addPhoto} className="space-y-3.5">
            {/* Phase Selection */}
            <div>
              <label className="mb-1 block text-xs text-signal-slate">Related Construction Phase</label>
              <select
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Uploader */}
            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Site Inspection Image / Blueprint"
              helperText="Upload image file from computer, drag & drop, or choose quick preset."
              allowPresets={true}
            />

            {/* Caption */}
            <div>
              <label className="mb-1 block text-xs text-signal-slate">Notes / Work-Done Description</label>
              <input
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="e.g. Columns rebar tying verified with drawing specs"
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>

            {/* Geotagging GPS */}
            <div className="rounded-md border border-blueprint-line/60 bg-navy-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-signal-slate font-medium">
                  <MapPin size={12} className="text-signal-teal" /> GPS Geotagging Telemetry
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={gettingLocation}
                  className="flex items-center gap-1 text-[11px] text-signal-teal hover:underline font-mono"
                >
                  <Navigation size={11} className={gettingLocation ? 'animate-spin' : ''} />
                  {gettingLocation ? 'Locating…' : 'Auto-Detect GPS'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (e.g. 18.5204)"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-2.5 py-1.5 text-xs text-paper font-mono focus:border-signal-teal focus:outline-none"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (e.g. 73.8567)"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-2.5 py-1.5 text-xs text-paper font-mono focus:border-signal-teal focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-md bg-signal-teal py-2.5 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving & Syncing Photo…' : 'Save & Attach Photo'}
            </button>
          </form>
        </Modal>
      )}

      {/* Lightbox Modal */}
      {selectedLightboxPhoto && (
        <div
          onClick={() => setSelectedLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-xl border border-blueprint-line bg-navy-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blueprint-line bg-navy-950 px-4 py-3">
              <div>
                <h4 className="font-display text-sm font-semibold text-paper">
                  {selectedLightboxPhoto.caption || 'Site Inspection Proof'}
                </h4>
                <p className="text-[11px] text-signal-slate font-mono mt-0.5">
                  Uploaded {formatDate(selectedLightboxPhoto.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLightboxPhoto(null)}
                className="rounded-full bg-navy-800 p-1.5 text-signal-slate hover:text-paper"
              >
                <X size={16} />
              </button>
            </div>

            {/* High-res Image Preview */}
            <div className="flex-1 overflow-auto p-4 bg-navy-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLightboxPhoto.imageUrl || getConstructionFallbackImage(selectedLightboxPhoto.caption, selectedLightboxPhoto.caption)}
                alt={selectedLightboxPhoto.caption || 'Site Photo'}
                className="max-h-[65vh] w-auto rounded-md object-contain border border-blueprint-line/40 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getConstructionFallbackImage(selectedLightboxPhoto.caption, selectedLightboxPhoto.caption);
                }}
              />
            </div>

            {/* Telemetry Footer */}
            {selectedLightboxPhoto.latitude && selectedLightboxPhoto.longitude && (
              <div className="flex items-center justify-between border-t border-blueprint-line bg-navy-900 px-4 py-2.5 text-xs text-signal-slate">
                <span className="flex items-center gap-1.5 font-mono text-signal-teal">
                  <MapPin size={13} /> GPS: {selectedLightboxPhoto.latitude.toFixed(4)}, {selectedLightboxPhoto.longitude.toFixed(4)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${selectedLightboxPhoto.latitude},${selectedLightboxPhoto.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-navy-800 px-2.5 py-1 text-xs text-signal-teal hover:underline"
                >
                  Open in Google Maps ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
