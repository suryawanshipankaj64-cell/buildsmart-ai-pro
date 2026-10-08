'use client';
import useSWR, { mutate } from 'swr';
import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  FolderPlus, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Edit3,
  Trash2,
  Filter,
  Camera,
  MapPin,
  ExternalLink,
  Plus,
  UploadCloud,
  Maximize2,
  Image as ImageIcon,
  Layers,
  Calendar,
  X,
  ChevronRight,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  ShieldAlert,
  Activity,
  Zap,
  Hammer,
  Truck,
  Tractor,
  Scissors,
  Droplet,
  Compass,
  Navigation,
  Copy
} from 'lucide-react';
import { fetcher, postJson } from '@/lib/fetcher';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { computeRisk } from '@/lib/risk';
import { DEFAULT_PHASES, normalizePhaseName, calculateRequiredEquipment, EquipmentItem } from '@/lib/estimation';
import ProgressBar from '@/components/ProgressBar';
import StatusBadge from '@/components/StatusBadge';
import RiskGauge from '@/components/RiskGauge';
import DonutChart from '@/components/DonutChart';
import PhaseBarChart from '@/components/PhaseBarChart';
import Modal from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';
import { getConstructionFallbackImage } from '@/lib/fallbackImages';

const TABS = ['Overview', 'Estimation', 'Planning', 'Site Photos', 'Budget', 'Risk', 'Statistics', 'History'] as const;

const CONTRACTOR_TRADES: string[] = [
  'Civil Contractor',
];

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-signal-slate">Loading project details…</p>}>
      <ProjectDetailContent />
    </Suspense>
  );
}

function ProjectDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialTab = (TABS as readonly string[]).includes(searchParams.get('tab') || '')
    ? (searchParams.get('tab') as (typeof TABS)[number])
    : 'Overview';
  const { data: project, isLoading } = useSWR(`/api/projects/${id}`, fetcher, {
    refreshInterval: 3000,
  });
  const [tab, setTab] = useState<(typeof TABS)[number]>(initialTab);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<any | null>(null);

  if (isLoading || !project) return <p className="text-sm text-signal-slate">Loading project…</p>;

  const spent = (project.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const budgetBase = project.estimate?.totalEstimatedCost ?? project.budget;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-display text-2xl text-paper">{project.name}</h2>
            <div
              onClick={() => {
                navigator.clipboard.writeText(project.id);
                alert(`Project ID copied to clipboard: ${project.id}`);
              }}
              title="Click to copy Project ID for Client / Engineer access"
              className="inline-flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-700/60 hover:border-cyan-400 px-2.5 py-1 rounded text-xs font-mono text-cyan-300 transition-colors cursor-pointer"
            >
              <span>Project ID: {project.id}</span>
              <Copy size={12} className="text-cyan-400 shrink-0" />
            </div>
          </div>
          <p className="text-sm text-signal-slate mt-1">{project.location}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mb-6 flex gap-1 border-b border-blueprint-line overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-2 text-sm whitespace-nowrap transition-colors ${
              tab === t ? 'border-b-2 border-signal-teal text-paper' : 'text-signal-slate hover:text-paper'
            }`}
          >
            {t}
            {t === 'Site Photos' && project.sitePhotos?.length > 0 && (
              <span className="ml-2 rounded-full bg-signal-teal/20 px-2 py-0.5 text-[10px] font-mono text-signal-teal">
                {project.sitePhotos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab project={project} spent={spent} onSelectTab={setTab} onSelectPhoto={setSelectedLightboxPhoto} />}
      {tab === 'Estimation' && <EstimationTab project={project} />}
      {tab === 'Planning' && <PlanningTab project={project} onSelectPhoto={setSelectedLightboxPhoto} />}
      {tab === 'Site Photos' && <SitePhotosTab project={project} onSelectPhoto={setSelectedLightboxPhoto} />}
      {tab === 'Budget' && <BudgetTab project={project} spent={spent} budgetBase={budgetBase} />}
      {tab === 'Risk' && <RiskTab project={project} spent={spent} />}
      {tab === 'Statistics' && <StatisticsTab project={project} spent={spent} budgetBase={budgetBase} />}
      {tab === 'History' && <HistoryTab project={project} />}

      {/* Lightbox Modal */}
      {selectedLightboxPhoto && (
        <PhotoLightboxModal
          photo={selectedLightboxPhoto}
          onClose={() => setSelectedLightboxPhoto(null)}
        />
      )}
    </div>
  );
}

function OverviewTab({ 
  project, 
  spent, 
  onSelectTab,
  onSelectPhoto 
}: { 
  project: any; 
  spent: number; 
  onSelectTab: (tab: (typeof TABS)[number]) => void;
  onSelectPhoto: (photo: any) => void;
}) {
  const completedCount = (project.tasks || []).filter((t: any) => t.isCompleted).length;
  const totalTasks = (project.tasks || []).length;
  const sitePhotos = project.sitePhotos || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Built-up area" value={`${formatNumber(project.builtUpAreaSqFt)} sq.ft`} />
        <Stat label="Budget" value={formatCurrency(project.budget)} />
        <Stat label="Spent so far" value={formatCurrency(spent)} />
        <Stat label="Timeline" value={`${formatDate(project.startDate)} → ${formatDate(project.endDate)}`} />
        <Stat label="Progress" value={`${project.progressPercent}%`} />
        <Stat label="Tasks" value={`${completedCount}/${totalTasks} done`} />
        <div className="md:col-span-3">
          <ProgressBar percent={project.progressPercent} />
        </div>
      </div>

      {/* Proof-of-Work Inspection Photos Preview */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div className="mb-3 flex items-center justify-between border-b border-blueprint-line/40 pb-2.5">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-signal-teal" />
            <h3 className="font-display text-sm text-paper">Recent Proof-of-Work Site Inspection Photos</h3>
            <span className="rounded bg-signal-teal/10 px-2 py-0.5 text-xs font-mono text-signal-teal">
              {sitePhotos.length} total
            </span>
          </div>
          <button
            onClick={() => onSelectTab('Site Photos')}
            className="flex items-center gap-1 text-xs text-signal-teal hover:underline font-medium"
          >
            View all site photos <ChevronRight size={12} />
          </button>
        </div>

        {sitePhotos.length === 0 ? (
          <div className="py-6 text-center text-xs text-signal-slate">
            <ImageIcon size={28} className="mx-auto mb-2 opacity-50" />
            <p>No proof-of-work photos uploaded yet.</p>
            <p className="mt-1">Capture site inspection photos from the mobile app to sync here live with GPS geotagging.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {sitePhotos.slice(0, 4).map((photo: any) => (
              <div
                key={photo.id}
                onClick={() => onSelectPhoto(photo)}
                className="group relative cursor-pointer overflow-hidden rounded-md border border-blueprint-line bg-navy-950 transition-all hover:border-signal-teal"
              >
                <div className="relative aspect-[16/9] min-h-[140px] w-full overflow-hidden bg-navy-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl || getConstructionFallbackImage(photo.caption, photo.caption)}
                    alt={photo.caption || 'Site inspection'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getConstructionFallbackImage(photo.caption, photo.caption);
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent opacity-60" />
                  <div className="absolute right-2 top-2 rounded bg-navy-950/80 p-1 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Maximize2 size={12} />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-paper">
                    {photo.caption || 'Site Progress Proof'}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-signal-slate font-mono">
                    {photo.latitude && photo.longitude ? (
                      <span className="flex items-center gap-1 text-signal-teal">
                        <MapPin size={10} /> {photo.latitude.toFixed(2)}, {photo.longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span>Site Log</span>
                    )}
                    <span>{formatDate(photo.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EstimationTab({ project }: { project: any }) {
  const [floors, setFloors] = useState(1);
  const [running, setRunning] = useState(false);
  const est = project.estimate;

  async function runEstimation() {
    setRunning(true);
    try {
      await postJson(`/api/projects/${project.id}/estimate`, { floors });
      await mutate(`/api/projects/${project.id}`);
    } catch (err: any) {
      alert(err.message || 'Estimation failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div>
          <label className="mb-1.5 block text-xs text-signal-slate">Number of floors</label>
          <input
            type="number"
            min={1}
            value={floors}
            onChange={(e) => setFloors(Number(e.target.value))}
            className="w-24 rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
          />
        </div>
        <button
          onClick={runEstimation}
          disabled={running}
          className="flex items-center gap-2 rounded-md bg-signal-teal px-4 py-2 text-sm font-medium text-navy-950 hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles size={16} /> {running ? 'Calculating…' : est ? 'Re-run AI estimation' : 'Run AI estimation'}
        </button>
        <p className="text-xs text-signal-slate">Uses built-up area ({formatNumber(project.builtUpAreaSqFt)} sq.ft) × current admin baseline rates.</p>
      </div>

      {!est && <p className="text-sm text-signal-slate">No estimate yet — run the AI estimation above.</p>}

      {est && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
              <h3 className="mb-3 font-display text-sm text-paper flex items-center gap-2">
                <Hammer size={16} className="text-signal-teal" /> Material take-off schedule
              </h3>
              <Row label="Cement" value={`${formatNumber(est.cementBags)} bags`} />
              <Row label="Steel" value={`${formatNumber(est.steelKg)} kg`} />
              <Row label="Sand" value={`${formatNumber(est.sandCft)} cft`} />
              <Row label="Bricks" value={`${formatNumber(est.bricksCount)} nos.`} />
              <Row label="Aggregate" value={`${formatNumber(est.aggregateCft)} cft`} />
            </div>
            <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
              <h3 className="mb-3 font-display text-sm text-paper flex items-center gap-2">
                <Users size={16} className="text-signal-teal" /> Labour deployment plan
              </h3>
              <Row label="Masons" value={`${est.masonCount}`} />
              <Row label="Electricians" value={`${est.electricianCount}`} />
              <Row label="Plumbers" value={`${est.plumberCount}`} />
              <Row label="Helpers" value={`${est.helperCount}`} />
              <Row label="Total man-hours" value={formatNumber(est.totalManHours)} />
            </div>
          </div>

          {/* Required Construction Equipment & Machinery Schedule */}
          <div className="rounded-md border border-blueprint-line bg-navy-900 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-blueprint-line/40 pb-2.5">
              <h3 className="font-display text-sm text-paper flex items-center gap-2">
                <Truck size={16} className="text-signal-teal" /> Required Construction Equipment & Machinery
              </h3>
              <span className="text-xs font-mono text-signal-teal">
                Civil Engineering Allocation
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-blueprint-line/60 text-signal-slate text-[11px]">
                    <th className="pb-2">Equipment Item</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Required Quantity</th>
                    <th className="pb-2">Operating Duration</th>
                    <th className="pb-2 text-right">Est. Rental Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blueprint-line/30">
                  {calculateRequiredEquipment(project.builtUpAreaSqFt || 1000, floors).map((eq) => (
                    <tr key={eq.id} className="hover:bg-navy-800/40">
                      <td className="py-2.5 font-medium text-paper font-sans">{eq.name}</td>
                      <td className="py-2.5 text-signal-slate">{eq.category}</td>
                      <td className="py-2.5 text-paper font-bold">{eq.quantity}</td>
                      <td className="py-2.5 text-signal-teal">{eq.durationDays} Days</td>
                      <td className="py-2.5 text-right text-paper font-semibold">₹{eq.estCost.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Stat label="Material cost" value={formatCurrency(est.materialCost)} />
            <Stat label="Labour cost" value={formatCurrency(est.labourCost)} />
            <Stat label="Equipment cost" value={formatCurrency(est.equipmentCost)} />
            <Stat label="Cost / sq.ft" value={formatCurrency(est.costPerSqFt)} />
          </div>
          <div className="rounded-md border border-signal-teal/30 bg-signal-teal/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-signal-slate font-mono">TOTAL ESTIMATED BUDGET (AREA × ADMIN BASELINE)</p>
              <p className="font-display text-3xl text-signal-teal mt-0.5">{formatCurrency(est.totalEstimatedCost)}</p>
            </div>
            <span className="rounded bg-signal-teal/15 px-3 py-1 text-xs font-mono font-bold text-signal-teal">
              ₹{est.costPerSqFt}/sq.ft baseline
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function PlanningTab({ project, onSelectPhoto }: { project: any; onSelectPhoto: (photo: any) => void }) {
  const [open, setOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhaseForPhoto, setSelectedPhaseForPhoto] = useState<string>('Planning');
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [isCustomPhaseMode, setIsCustomPhaseMode] = useState<boolean>(false);
  const [customPhaseInput, setCustomPhaseInput] = useState<string>('');
  const [isCustomTradeMode, setIsCustomTradeMode] = useState<boolean>(false);
  const [customTradeInput, setCustomTradeInput] = useState<string>('');
  
  const [form, setForm] = useState({
    phaseName: DEFAULT_PHASES[0],
    title: '',
    assignee: CONTRACTOR_TRADES[0],
    dueDate: '',
    progressPercent: 0,
  });

  const CUSTOM_PHASE_PRESETS = [
    'Landscape & Hardscaping',
    'HVAC Air Conditioning',
    'Solar Energy & Rooftop Grid',
    'Interior Millwork & Furnishings',
    'Firefighting & Security Gate',
    'Swimming Pool & Decking',
  ];

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const finalPhase = (isCustomPhaseMode && customPhaseInput.trim()) ? customPhaseInput.trim() : form.phaseName;
    const finalAssignee = (isCustomTradeMode && customTradeInput.trim()) ? customTradeInput.trim() : form.assignee;

    await postJson('/api/tasks', { 
      projectId: project.id, 
      phaseName: finalPhase,
      title: form.title,
      assignee: finalAssignee,
      dueDate: form.dueDate,
      progressPercent: form.progressPercent
    });

    await mutate(`/api/projects/${project.id}`);
    setOpen(false);
    setForm({ phaseName: DEFAULT_PHASES[0], title: '', assignee: CONTRACTOR_TRADES[0], dueDate: '', progressPercent: 0 });
    setIsCustomPhaseMode(false);
    setCustomPhaseInput('');
    setIsCustomTradeMode(false);
    setCustomTradeInput('');
  }

  async function toggleTask(taskId: string, isCompleted: boolean) {
    await postJson(`/api/tasks/${taskId}`, { isCompleted: !isCompleted }, 'PATCH');
    await mutate(`/api/projects/${project.id}`);
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Are you sure you want to remove this task?')) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      await mutate(`/api/projects/${project.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  }

  const [seedingTrades, setSeedingTrades] = useState(false);
  const [clearingTrades, setClearingTrades] = useState(false);
  const [autoSeedTasksEnabled, setAutoSeedTasksEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`autoSeedTasks_${project.id}`);
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  async function handleAutoSeedTrades() {
    setSeedingTrades(true);
    try {
      const res = await postJson('/api/tasks/seed', { projectId: project.id, action: 'seed' });
      await mutate(`/api/projects/${project.id}`);
      if (res.createdCount > 0) {
        alert(`Successfully generated ${res.createdCount} standard milestone tasks for Civil Contractor across all phases!`);
      } else {
        alert('All standard phase milestone tasks are already mapped and up to date.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to auto-generate phase tasks');
    } finally {
      setSeedingTrades(false);
    }
  }

  async function handleToggleAutoSeed(enabled: boolean) {
    setAutoSeedTasksEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`autoSeedTasks_${project.id}`, String(enabled));
    }
    if (enabled && tasks.length === 0) {
      await handleAutoSeedTrades();
    }
  }

  async function handleClearSeededTasks() {
    if (!confirm('Are you sure you want to clear all standard auto-seeded tasks for this project?')) return;
    setClearingTrades(true);
    try {
      const res = await postJson('/api/tasks/seed', { projectId: project.id, action: 'clear' });
      await mutate(`/api/projects/${project.id}`);
      alert(res.message || 'Auto-seeded tasks cleared successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to clear tasks');
    } finally {
      setClearingTrades(false);
    }
  }

  async function updatePhaseProgress(phase: string, percent: number) {
    await postJson('/api/record', {
      actionType: 'phase_update',
      projectId: project.id,
      payload: { 
        phaseName: phase, 
        progressPercent: percent,
        assignee: 'Civil Contractor',
        notes: `Updated ${phase} to ${percent}% from web.` 
      },
    });
    await mutate(`/api/projects/${project.id}`);
  }

  async function updateTaskProgress(taskId: string, percent: number) {
    await postJson(`/api/tasks/${taskId}`, { progressPercent: percent, isCompleted: percent >= 100 }, 'PATCH');
    await mutate(`/api/projects/${project.id}`);
  }

  const tradeBadges: Record<string, string> = {
    'Civil Contractor': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  };

  const tasks = (project.tasks || []).map((t: any) => ({
    ...t,
    phaseName: normalizePhaseName(t.phaseName),
  }));
  const sitePhotos = project.sitePhotos || [];
  const filteredTasks = tasks;

  // Group all canonical phases (standard + any valid custom phases)
  const customPhases: string[] = Array.from(
    new Set(
      tasks
        .map((t: any) => normalizePhaseName(t.phaseName))
        .filter((p: string) => !DEFAULT_PHASES.includes(p))
    )
  );
  const allPhases: string[] = [...DEFAULT_PHASES, ...customPhases];

  // Per-project phase completion metrics
  let completedPhasesCount = 0;
  let inProgressPhasesCount = 0;
  let notStartedPhasesCount = 0;

  allPhases.forEach((phase) => {
    const pTasks = tasks.filter((t: any) => t.phaseName === phase);
    const pAvg = pTasks.length
      ? Math.round(pTasks.reduce((s: number, t: any) => s + (t.isCompleted ? 100 : t.progressPercent || 0), 0) / pTasks.length)
      : 0;
    if (pAvg >= 100) completedPhasesCount++;
    else if (pAvg > 0) inProgressPhasesCount++;
    else notStartedPhasesCount++;
  });

  const completedTasksCount = tasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;

  return (
    <div className="space-y-6">
      {/* 1. Project Phase & Planning Executive KPI Bar */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-signal-slate font-mono">PROJECT EXECUTION</span>
            <span className="rounded bg-signal-teal/15 px-2 py-0.5 text-xs font-mono font-bold text-signal-teal">
              {project.progressPercent}%
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
            <div
              className={`h-full transition-all duration-300 ${
                project.progressPercent >= 80 ? 'bg-signal-teal' : project.progressPercent >= 40 ? 'bg-signal-blue' : 'bg-signal-amber'
              }`}
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-signal-slate font-mono">
            {autoSeedTasksEnabled 
              ? `${completedTasksCount} of ${tasks.length} milestone tasks done` 
              : `${completedPhasesCount} of ${allPhases.length} phases completed`}
          </p>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-3.5">
          <span className="text-xs text-signal-slate font-mono">TOTAL PHASES MAPPED</span>
          <p className="mt-1 font-display text-xl text-paper">{allPhases.length} Phases</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-signal-teal">{completedPhasesCount} done</span>
            <span className="text-signal-slate">·</span>
            <span className="text-signal-blue">{inProgressPhasesCount} active</span>
            <span className="text-signal-slate">·</span>
            <span className="text-signal-slate">{notStartedPhasesCount} todo</span>
          </div>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-3.5">
          <span className="text-xs text-signal-slate font-mono">SITE CONTRACTOR</span>
          <p className="mt-1 font-display text-xl text-signal-teal">Civil Contractor</p>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-3.5">
          <span className="text-xs text-signal-slate font-mono">PROOF INSPECTIONS</span>
          <p className="mt-1 font-display text-xl text-signal-teal">{sitePhotos.length} Records</p>
          <p className="mt-1 text-[11px] text-signal-slate font-mono">
            {sitePhotos.filter((p: any) => p.latitude && p.longitude).length} GPS geotagged proofs
          </p>
        </div>
      </div>

      {/* 2. Global Actions & Auto-Seed ON/OFF Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blueprint-line/40 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-md border border-signal-teal/40 bg-signal-teal/10 px-3 py-1.5 text-xs font-mono font-bold text-signal-teal">
            <span>🏗️ Civil Contractor</span>
            <span className="text-signal-slate font-normal">
              ({autoSeedTasksEnabled ? `${tasks.length} Milestone Tasks` : 'Direct Phase Mode'})
            </span>
          </div>

          {/* Auto-Seed ON/OFF Switch Pill */}
          <div className="flex items-center gap-2 rounded-md border border-blueprint-line bg-navy-950 px-2.5 py-1">
            <span className="text-xs font-mono font-medium text-paper flex items-center gap-1">
              <Zap size={13} className={autoSeedTasksEnabled ? 'text-signal-teal' : 'text-signal-slate'} />
              Auto-Seed Tasks:
            </span>
            <button
              type="button"
              onClick={() => handleToggleAutoSeed(!autoSeedTasksEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSeedTasksEnabled ? 'bg-signal-teal' : 'bg-navy-800 border-blueprint-line'
              }`}
              title={autoSeedTasksEnabled ? 'Turn OFF Auto-Seed Phase Tasks' : 'Turn ON Auto-Seed Phase Tasks'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                  autoSeedTasksEnabled ? 'translate-x-4 bg-navy-950' : 'translate-x-0 bg-signal-slate'
                }`}
              />
            </button>
            <span className={`text-[11px] font-mono font-bold ${autoSeedTasksEnabled ? 'text-signal-teal' : 'text-signal-slate'}`}>
              {autoSeedTasksEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {autoSeedTasksEnabled ? (
            <>
              <button
                onClick={handleAutoSeedTrades}
                disabled={seedingTrades}
                className="flex items-center gap-1.5 rounded-md border border-signal-teal/50 bg-signal-teal/10 px-3 py-1.5 text-xs font-mono font-semibold text-signal-teal hover:bg-signal-teal/20 transition-colors disabled:opacity-50"
                title="Auto-populate standard milestone deliverables across all construction phases"
              >
                <Zap size={13} className={seedingTrades ? 'animate-spin text-signal-amber' : 'text-signal-teal'} />
                {seedingTrades ? 'Generating...' : '⚡ Re-Seed Tasks'}
              </button>

              {tasks.length > 0 && (
                <button
                  onClick={handleClearSeededTasks}
                  disabled={clearingTrades}
                  className="flex items-center gap-1 rounded-md border border-signal-coral/30 bg-signal-coral/10 px-2.5 py-1.5 text-xs font-mono text-signal-coral hover:bg-signal-coral/20 transition-colors disabled:opacity-50"
                  title="Remove all standard auto-seeded tasks"
                >
                  <Trash2 size={12} />
                  {clearingTrades ? 'Clearing...' : 'Clear Tasks'}
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-signal-amber/30 bg-signal-amber/10 px-2.5 py-1 text-xs font-mono text-signal-amber">
              <span>⚡ Direct Phase Mode Active</span>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedPhaseForPhoto('Planning');
              setPhotoModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md border border-signal-teal/40 bg-signal-teal/10 px-3 py-1.5 text-xs font-medium text-signal-teal hover:bg-signal-teal/20"
          >
            <Camera size={14} /> Add Photo
          </button>
          <button
            onClick={() => {
              setIsCustomPhaseMode(false);
              setOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-md bg-signal-teal px-3.5 py-1.5 text-sm font-medium text-navy-950 hover:opacity-90"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* 3. Phase Cards Matrix */}
      <div className="space-y-4">
        {allPhases.map((phase) => {
          const phaseTasks = filteredTasks.filter((t: any) => t.phaseName === phase);
          const phasePhotos = sitePhotos.filter((p: any) => 
            (p.caption || '').toLowerCase().includes(`[${phase.toLowerCase()}]`) ||
            (p.caption || '').toLowerCase().includes(phase.toLowerCase())
          );
          const phaseAvg = phaseTasks.length
            ? Math.round(
                phaseTasks.reduce((s: number, t: any) => s + (t.isCompleted ? 100 : t.progressPercent || 0), 0) /
                  phaseTasks.length
              )
            : 0;

          const phaseCompletedTasks = phaseTasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;

          return (
            <div key={phase} className="rounded-md border border-blueprint-line bg-navy-900 p-4 transition-all">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line/40 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm text-paper">{phase}</h3>
                    
                    {/* Status badge */}
                    {phaseAvg >= 100 ? (
                      <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                        COMPLETED
                      </span>
                    ) : phaseAvg > 0 ? (
                      <span className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-400">
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="rounded border border-signal-slate/40 bg-signal-slate/10 px-2 py-0.5 text-[10px] font-mono text-signal-slate">
                        NOT STARTED
                      </span>
                    )}

                    {phasePhotos.length > 0 && (
                      <span className="flex items-center gap-1 rounded bg-signal-teal/15 px-1.5 py-0.5 text-[10px] font-mono text-signal-teal">
                        <Camera size={10} /> {phasePhotos.length} photo(s)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-signal-slate font-mono mt-0.5">
                    {phaseCompletedTasks} of {phaseTasks.length} task(s) completed · {phaseAvg}% overall
                  </p>
                </div>

                {/* Direct 0% - 25% - 50% - 75% - 100% Phase Update Stepper & Photo Trigger */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-signal-slate mr-1">SET PHASE:</span>
                  {[0, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      onClick={() => updatePhaseProgress(phase, step)}
                      className={`rounded px-2 py-0.5 text-xs font-mono transition-colors ${
                        phaseAvg === step
                          ? 'bg-signal-teal text-navy-950 font-bold shadow-sm'
                          : 'bg-navy-800 text-signal-slate hover:text-paper border border-blueprint-line/60'
                      }`}
                    >
                      {step}%
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedPhaseForPhoto(phase);
                      setPhotoModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded border border-signal-teal/40 bg-signal-teal/10 px-2 py-0.5 text-xs font-mono text-signal-teal hover:bg-signal-teal/20 transition-colors ml-1"
                    title={`Upload inspection photo for ${phase}`}
                  >
                    <Camera size={11} /> Photo
                  </button>
                </div>
              </div>

              {/* Visual Phase Progress Bar */}
              <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
                <div
                  className={`h-full transition-all duration-300 ${
                    phaseAvg >= 80 ? 'bg-signal-teal' : phaseAvg >= 40 ? 'bg-signal-blue' : phaseAvg > 0 ? 'bg-signal-amber' : 'bg-transparent'
                  }`}
                  style={{ width: `${phaseAvg}%` }}
                />
              </div>

              {/* Inline Phase Photos Strip if photos exist */}
              {phasePhotos.length > 0 && (
                <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
                  {phasePhotos.map((photo: any) => (
                    <div
                      key={photo.id}
                      onClick={() => onSelectPhoto(photo)}
                      className="group relative h-12 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded border border-blueprint-line bg-navy-950 transition-all hover:border-signal-teal"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.imageUrl}
                        alt={photo.caption || 'Phase proof'}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80';
                        }}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-navy-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={10} className="text-paper" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks under this phase (Visible when Auto-Seed Tasks is ON) */}
              {autoSeedTasksEnabled ? (
                phaseTasks.length > 0 ? (
                  <ul className="divide-y divide-blueprint-line/60">
                    {phaseTasks.map((t: any) => {
                      const taskPercent = t.progressPercent || (t.isCompleted ? 100 : 0);
                      return (
                        <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm group">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={t.isCompleted}
                              onChange={() => toggleTask(t.id, t.isCompleted)}
                              className="accent-signal-teal h-4 w-4 rounded cursor-pointer"
                            />
                            <span className={t.isCompleted ? 'text-signal-slate line-through' : 'text-paper font-medium'}>
                              {t.title}
                            </span>
                            {t.assignee && (
                              <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${tradeBadges[t.assignee] || 'border-blueprint-line text-signal-slate'}`}>
                                {t.assignee}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Task direct percentage buttons */}
                            <div className="flex items-center gap-1">
                              {[0, 25, 50, 75, 100].map((step) => (
                                <button
                                  key={step}
                                  onClick={() => updateTaskProgress(t.id, step)}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                                    taskPercent === step
                                      ? 'bg-signal-teal/20 text-signal-teal border border-signal-teal font-bold'
                                      : 'text-signal-slate hover:text-paper border border-blueprint-line/40'
                                  }`}
                                >
                                  {step}%
                                </button>
                              ))}
                            </div>
                            <span className="text-xs text-signal-slate font-mono">due {formatDate(t.dueDate)}</span>
                            <button
                              onClick={() => deleteTask(t.id)}
                              className="text-signal-slate/40 hover:text-signal-coral p-1 transition-colors"
                              title="Delete task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-signal-slate">
                    <span>No milestone tasks recorded for {phase} yet.</span>
                    <button
                      onClick={() => {
                        setForm({ 
                          ...form, 
                          phaseName: phase,
                          assignee: 'Civil Contractor'
                        });
                        setIsCustomPhaseMode(false);
                        setIsCustomTradeMode(false);
                        setOpen(true);
                      }}
                      className="text-signal-teal hover:underline font-medium"
                    >
                      + Add Task to {phase}
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs text-signal-slate">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-signal-slate/80">
                    <Zap size={11} className="text-signal-amber" /> Direct Phase Control · Sub-tasks turned OFF ({phaseTasks.length} task{phaseTasks.length === 1 ? '' : 's'} hidden)
                  </span>
                  <button
                    onClick={() => handleToggleAutoSeed(true)}
                    className="text-signal-teal hover:underline font-medium text-xs font-mono"
                  >
                    ⚡ Turn ON Tasks View
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* 4. Prominent Add Custom Phase / Milestone Task Card at Bottom */}
        <div 
          onClick={() => {
            setIsCustomPhaseMode(true);
            setOpen(true);
          }}
          className="group cursor-pointer rounded-md border-2 border-dashed border-blueprint-line hover:border-signal-teal bg-navy-900/50 hover:bg-navy-900 p-5 text-center transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <Plus size={18} className="text-signal-teal group-hover:scale-110 transition-transform" />
            <h4 className="font-display text-sm font-semibold text-paper group-hover:text-signal-teal">
              Add Custom Phase & Milestone Task
            </h4>
          </div>
          <p className="mt-1 text-xs text-signal-slate">
            Need a custom work stage like Landscaping, Solar Grid, HVAC, or Custom Interiors? Create any custom phase and it will track independently across Web and Mobile!
          </p>
        </div>
      </div>

      {/* 5. Proof-of-Work Inspection Photos Section Below Phases */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line/40 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-signal-teal" />
              <h3 className="font-display text-sm text-paper">Phase Proof-of-Work & Inspection Photos</h3>
            </div>
            <p className="text-xs text-signal-slate">
              Geotagged site inspection records uploaded from mobile app & field engineers.
            </p>
          </div>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-signal-teal px-3 py-1.5 text-xs font-medium text-navy-950 hover:opacity-90"
          >
            <Camera size={12} /> Upload Photo
          </button>
        </div>

        {sitePhotos.length === 0 ? (
          <div className="py-8 text-center text-xs text-signal-slate">
            <ImageIcon size={32} className="mx-auto mb-2 opacity-40 text-signal-teal" />
            <p className="font-medium text-paper">No Proof-of-Work Photos Yet</p>
            <p className="mt-1">
              Field engineers can snap photos directly from the mobile app to sync here with real-time GPS geotagging.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sitePhotos.map((photo: any) => (
              <div
                key={photo.id}
                onClick={() => onSelectPhoto(photo)}
                className="group relative cursor-pointer overflow-hidden rounded-md border border-blueprint-line bg-navy-950 transition-all hover:border-signal-teal"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-navy-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || 'Site inspection'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80';
                    }}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-transparent to-transparent opacity-80" />
                  <div className="absolute right-2 top-2 rounded bg-navy-950/80 p-1 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Maximize2 size={12} />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs font-semibold text-paper">
                    {photo.caption || 'Site Progress Proof'}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-signal-slate font-mono">
                    {photo.latitude && photo.longitude ? (
                      <span className="flex items-center gap-1 text-signal-teal">
                        <MapPin size={10} /> {photo.latitude.toFixed(2)}, {photo.longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span>Site Log</span>
                    )}
                    <span>{formatDate(photo.uploadedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal with Custom Phase & Custom Trade Support */}
      {open && (
        <Modal title={isCustomPhaseMode ? "Add Custom Phase & Task" : "Add Task to Phase"} onClose={() => setOpen(false)}>
          <form onSubmit={addTask} className="space-y-3">
            {/* Phase Mode Toggle */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs text-signal-slate">Phase Category</label>
                <button
                  type="button"
                  onClick={() => setIsCustomPhaseMode(!isCustomPhaseMode)}
                  className="text-[11px] text-signal-teal hover:underline font-mono"
                >
                  {isCustomPhaseMode ? "← Choose Standard Phase" : "➕ Enter Custom Phase"}
                </button>
              </div>

              {isCustomPhaseMode ? (
                <div>
                  <input
                    required
                    value={customPhaseInput}
                    onChange={(e) => setCustomPhaseInput(e.target.value)}
                    placeholder="e.g. Landscape & Hardscaping or HVAC Air Systems"
                    className="w-full rounded-md border border-signal-teal bg-navy-800 px-3 py-2 text-sm text-paper focus:outline-none"
                  />
                  {/* Quick Preset Buttons */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CUSTOM_PHASE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setCustomPhaseInput(p)}
                        className="rounded border border-blueprint-line bg-navy-800 px-2 py-0.5 text-[10px] text-signal-slate hover:border-signal-teal hover:text-paper"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <select
                  value={form.phaseName}
                  onChange={(e) => setForm({ ...form, phaseName: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
                >
                  {allPhases.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Task title */}
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Task Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Tree plantation & perimeter boundary curb"
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>

            {/* Assigned Trade / Subcontractor */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs text-signal-slate">Assigned Trade</label>
                <button
                  type="button"
                  onClick={() => setIsCustomTradeMode(!isCustomTradeMode)}
                  className="text-[11px] text-signal-teal hover:underline font-mono"
                >
                  {isCustomTradeMode ? "← Standard Trade" : "➕ Custom Trade"}
                </button>
              </div>

              {isCustomTradeMode ? (
                <input
                  required
                  value={customTradeInput}
                  onChange={(e) => setCustomTradeInput(e.target.value)}
                  placeholder="e.g. Landscape Architect or HVAC Lead"
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
                />
              ) : (
                <select
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
                >
                  {CONTRACTOR_TRADES.map((trade) => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Due Date</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Initial Progress Percentage */}
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Initial Progress: {form.progressPercent}%</label>
              <div className="flex items-center gap-1.5">
                {[0, 25, 50, 75, 100].map((step) => (
                  <button
                    type="button"
                    key={step}
                    onClick={() => setForm({ ...form, progressPercent: step })}
                    className={`flex-1 rounded py-1.5 text-xs font-mono transition-colors ${
                      form.progressPercent === step
                        ? 'bg-signal-teal text-navy-950 font-bold'
                        : 'bg-navy-800 text-signal-slate hover:text-paper border border-blueprint-line/40'
                    }`}
                  >
                    {step}%
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-signal-teal py-2.5 text-sm font-medium text-navy-950 hover:opacity-90 mt-2"
            >
              Save Milestone Task
            </button>
          </form>
        </Modal>
      )}

      {/* Upload Photo Modal */}
      {photoModalOpen && (
        <UploadSitePhotoModal
          projectId={project.id}
          initialPhase={selectedPhaseForPhoto}
          allPhases={allPhases}
          onClose={() => setPhotoModalOpen(false)}
        />
      )}
    </div>
  );
}

function SitePhotosTab({ project, onSelectPhoto }: { project: any; onSelectPhoto: (photo: any) => void }) {
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const sitePhotos = project.sitePhotos || [];

  const allPhases = Array.from(
    new Set([...DEFAULT_PHASES, ...(project.tasks || []).map((t: any) => t.phaseName)])
  );

  const filteredPhotos = phaseFilter === 'ALL'
    ? sitePhotos
    : sitePhotos.filter((p: any) =>
        (p.caption || '').toLowerCase().includes(`[${phaseFilter.toLowerCase()}]`) ||
        (p.caption || '').toLowerCase().includes(phaseFilter.toLowerCase())
      );

  async function deletePhoto(photoId: string) {
    if (!confirm('Are you sure you want to delete this inspection photo?')) return;
    try {
      await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
      await mutate(`/api/projects/${project.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo');
    }
  }

  const gpsTaggedCount = sitePhotos.filter((p: any) => p.latitude && p.longitude).length;

  return (
    <div className="space-y-5">
      {/* Top Filter & Summary Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total Photos Captured" value={`${sitePhotos.length} records`} />
        <Stat label="GPS Geotagged Proofs" value={`${gpsTaggedCount} site tags`} />
        <Stat 
          label="Latest Inspection" 
          value={sitePhotos.length > 0 ? formatDate(sitePhotos[0].uploadedAt) : 'None'} 
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blueprint-line/40 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setPhaseFilter('ALL')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              phaseFilter === 'ALL' ? 'bg-signal-teal text-navy-950' : 'bg-navy-900 text-signal-slate hover:text-paper'
            }`}
          >
            All Photos ({sitePhotos.length})
          </button>
          {allPhases.map((phase) => {
            const count = sitePhotos.filter((p: any) =>
              (p.caption || '').toLowerCase().includes(`[${phase.toLowerCase()}]`) ||
              (p.caption || '').toLowerCase().includes(phase.toLowerCase())
            ).length;
            return (
              <button
                key={phase}
                onClick={() => setPhaseFilter(phase)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  phaseFilter === phase ? 'bg-signal-teal text-navy-950' : 'bg-navy-900 text-signal-slate hover:text-paper'
                }`}
              >
                {phase} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setPhotoModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-signal-teal px-3.5 py-1.5 text-sm font-medium text-navy-950 hover:opacity-90"
        >
          <Camera size={14} /> Upload Inspection Photo
        </button>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-12 text-center text-signal-slate">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30 text-signal-teal" />
          <h3 className="font-display text-base text-paper">No Inspection Photos In This View</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-signal-slate">
            Take photos via the mobile app on-site or use the Upload button to attach work-done proofs.
          </p>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-signal-teal px-4 py-2 text-xs font-medium text-navy-950"
          >
            <Camera size={14} /> Upload First Photo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo: any) => (
            <div
              key={photo.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-md border border-blueprint-line bg-navy-900 transition-all hover:border-signal-teal"
            >
              <div
                onClick={() => onSelectPhoto(photo)}
                className="relative aspect-[16/9] min-h-[160px] w-full cursor-pointer overflow-hidden bg-navy-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl || getConstructionFallbackImage(photo.caption, photo.caption)}
                  alt={photo.caption || 'Site inspection'}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getConstructionFallbackImage(photo.caption, photo.caption);
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-50" />
                <div className="absolute right-2 top-2 rounded bg-navy-950/80 p-1 text-paper opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <Maximize2 size={14} />
                </div>
              </div>

              <div className="p-3">
                <p className="line-clamp-2 text-xs font-semibold text-paper">
                  {photo.caption || 'Site Inspection Proof'}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-blueprint-line/40 pt-2 text-[11px] text-signal-slate font-mono">
                  {photo.latitude && photo.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-signal-teal hover:underline"
                      title="Open in Google Maps"
                    >
                      <MapPin size={11} /> {photo.latitude.toFixed(3)}, {photo.longitude.toFixed(3)}
                    </a>
                  ) : (
                    <span className="text-signal-slate/60">No GPS tag</span>
                  )}
                  <span>{formatDate(photo.uploadedAt)}</span>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-blueprint-line/30 pt-2">
                  <button
                    onClick={() => onSelectPhoto(photo)}
                    className="text-[11px] text-signal-teal hover:underline font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="text-signal-slate hover:text-signal-coral p-1 transition-colors"
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

      {/* Upload Photo Modal */}
      {photoModalOpen && (
        <UploadSitePhotoModal
          projectId={project.id}
          initialPhase="Planning"
          allPhases={allPhases}
          onClose={() => setPhotoModalOpen(false)}
        />
      )}
    </div>
  );
}

function UploadSitePhotoModal({
  projectId,
  initialPhase,
  allPhases,
  onClose,
}: {
  projectId: string;
  initialPhase: string;
  allPhases: string[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState(initialPhase || 'Planning');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please select or upload an image.');
      return;
    }

    setLoading(true);
    try {
      const formattedCaption = caption.trim()
        ? `[${phase}] ${caption.trim()}`
        : `[${phase}] Proof of work inspection`;

      await postJson('/api/photos', {
        projectId,
        imageUrl: imageUrl.trim(),
        caption: formattedCaption,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      await mutate(`/api/projects/${projectId}`);
      await mutate('/api/projects');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Upload Site Inspection Photo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="mb-1 block text-xs text-signal-slate">Related Construction Phase</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
          >
            {allPhases.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Image Uploader with File Drag & Drop, URL, and Samples */}
        <ImageUploader
          value={imageUrl}
          onChange={(url) => setImageUrl(url)}
          label="Site Inspection Image / Blueprint"
          helperText="Upload image file from your computer, drag & drop, or pick a sample."
          allowPresets={true}
        />

        <div>
          <label className="mb-1 block text-xs text-signal-slate">Caption / Notes</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Planning boundary layout verified on site"
            className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
          />
        </div>

        {/* GPS Geotagging Telemetry */}
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
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude (e.g. 19.0760)"
              className="w-full rounded-md border border-blueprint-line bg-navy-800 px-2.5 py-1.5 text-xs text-paper font-mono focus:border-signal-teal focus:outline-none"
            />
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude (e.g. 72.8777)"
              className="w-full rounded-md border border-blueprint-line bg-navy-800 px-2.5 py-1.5 text-xs text-paper font-mono focus:border-signal-teal focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-signal-teal py-2.5 text-sm font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <UploadCloud size={16} /> {loading ? 'Saving & Syncing…' : 'Save & Attach Photo'}
        </button>
      </form>
    </Modal>
  );
}

function PhotoLightboxModal({ photo, onClose }: { photo: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] max-w-3xl w-full overflow-hidden rounded-lg border border-blueprint-line bg-navy-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-blueprint-line bg-navy-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-signal-teal" />
            <span className="font-display text-sm text-paper">Inspection Photo Lightbox</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-signal-slate hover:bg-navy-800 hover:text-paper"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative max-h-[60vh] overflow-hidden bg-black flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.imageUrl || getConstructionFallbackImage(photo.caption, photo.caption)}
            alt={photo.caption || 'Site inspection photo'}
            onError={(e) => {
              (e.target as HTMLImageElement).src = getConstructionFallbackImage(photo.caption, photo.caption);
            }}
            className="max-h-[60vh] w-auto max-w-full object-contain"
          />
        </div>

        <div className="p-4 bg-navy-900">
          <h4 className="font-display text-base text-paper">
            {photo.caption || 'Proof of Work Inspection'}
          </h4>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-signal-slate font-mono border-t border-blueprint-line/40 pt-2">
            <div>
              {photo.latitude && photo.longitude ? (
                <a
                  href={`https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-signal-teal hover:underline"
                >
                  <MapPin size={13} /> GPS: {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                  <ExternalLink size={11} />
                </a>
              ) : (
                <span>No GPS geotag metadata</span>
              )}
            </div>
            <div>
              <span>Recorded: {new Date(photo.uploadedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetTab({ project, spent, budgetBase }: { project: any; spent: number; budgetBase: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'MATERIAL', itemName: '', amount: '', date: '' });

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    await postJson('/api/expenses', { projectId: project.id, ...form });
    await mutate(`/api/projects/${project.id}`);
    await mutate('/api/expenses');
    setOpen(false);
    setForm({ category: 'MATERIAL', itemName: '', amount: '', date: '' });
  }

  const donutData = ['MATERIAL', 'LABOUR', 'EQUIPMENT', 'OVERHEADS', 'OTHER'].map((cat) => ({
    name: cat.charAt(0) + cat.slice(1).toLowerCase(),
    value: (project.expenses || []).filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + e.amount, 0),
  }));

  const remaining = budgetBase - spent;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Estimated / budgeted" value={formatCurrency(budgetBase)} />
        <Stat label="Spent" value={formatCurrency(spent)} />
        <Stat label="Remaining" value={formatCurrency(remaining)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <h3 className="mb-2 font-display text-sm text-paper">Category breakdown</h3>
          <DonutChart data={donutData} />
        </div>
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm text-paper">Expense log</h3>
            <button onClick={() => setOpen(true)} className="rounded-md bg-signal-teal px-3 py-1.5 text-xs font-medium text-navy-950 hover:opacity-90">Log expense</button>
          </div>
          <ul className="max-h-64 divide-y divide-blueprint-line/60 overflow-y-auto">
            {(project.expenses || []).map((e: any) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-paper">{e.itemName}</p>
                  <p className="text-xs text-signal-slate">{e.category.toLowerCase()} · {formatDate(e.date)}</p>
                </div>
                <span className="text-signal-amber">{formatCurrency(e.amount)}</span>
              </li>
            ))}
            {(!project.expenses || project.expenses.length === 0) && <p className="py-2 text-sm text-signal-slate">No expenses logged yet.</p>}
          </ul>
        </div>
      </div>

      {open && (
        <Modal title="Log expense" onClose={() => setOpen(false)}>
          <form onSubmit={addExpense} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper">
                {['MATERIAL', 'LABOUR', 'EQUIPMENT', 'OVERHEADS', 'OTHER'].map((c) => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Item name</label>
              <input required value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Amount (₹)</label>
              <input type="number" min={0} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-signal-slate">Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-sm text-paper [color-scheme:dark]" />
            </div>
            <button type="submit" className="w-full rounded-md bg-signal-teal py-2.5 text-sm font-medium text-navy-950 hover:opacity-90">Save expense</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function RiskTab({ project, spent }: { project: any; spent: number }) {
  const openTasks = (project.tasks || []).filter((t: any) => !t.isCompleted);
  const est = project.estimate;
  const risk = computeRisk({
    budget: project.budget,
    totalEstimatedCost: est?.totalEstimatedCost ?? project.budget,
    spentSoFar: spent,
    progressPercent: project.progressPercent,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    completedTaskDueDates: openTasks.map((t: any) => new Date(t.dueDate)),
    plannedLabourHeadcount: (est?.masonCount ?? 0) + (est?.electricianCount ?? 0) + (est?.plumberCount ?? 0),
    actualLabourHeadcount: (est?.masonCount ?? 0) + (est?.electricianCount ?? 0) + (est?.plumberCount ?? 0),
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4 md:col-span-1">
        <RiskGauge score={risk.overallScore} level={risk.level} />
      </div>
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-4 md:col-span-2">
        <h3 className="mb-3 font-display text-sm text-paper">Risk factors</h3>
        <Row label="Budget overrun risk" value={`${risk.budgetOverrunScore}%`} />
        <Row label="Delay risk" value={`${risk.delayScore}%`} />
        <Row label="Material price volatility" value={`${risk.materialVolatilityScore}%`} />
        <Row label="Labour shortage risk" value={`${risk.labourShortageScore}%`} />
        {risk.flags.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {risk.flags.map((f, i) => (
              <p key={i} className="rounded-md border border-signal-coral/30 bg-signal-coral/10 px-3 py-2 text-xs text-signal-coral">{f}</p>
            ))}
          </div>
        )}
        {risk.flags.length === 0 && <p className="mt-4 text-xs text-signal-teal">No active risk flags on this project.</p>}
      </div>
    </div>
  );
}

function StatisticsTab({ 
  project, 
  spent, 
  budgetBase 
}: { 
  project: any; 
  spent: number; 
  budgetBase: number;
}) {
  const tasks = project.tasks || [];
  const expenses = project.expenses || [];
  const sitePhotos = project.sitePhotos || [];
  const est = project.estimate;

  const allPhases = Array.from(
    new Set([...DEFAULT_PHASES, ...tasks.map((t: any) => t.phaseName)])
  );

  const completedTasksCount = tasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;
  const totalTasksCount = tasks.length;
  const taskVelocityPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const remainingBudget = budgetBase - spent;
  const spentPercent = budgetBase > 0 ? Math.round((spent / budgetBase) * 100) : 0;
  const costPerSqFtSpent = project.builtUpAreaSqFt > 0 ? Math.round(spent / project.builtUpAreaSqFt) : 0;
  const costPerSqFtEstimated = project.builtUpAreaSqFt > 0 ? Math.round(budgetBase / project.builtUpAreaSqFt) : 0;
  const gpsPhotosCount = sitePhotos.filter((p: any) => p.latitude && p.longitude).length;

  const donutData = ['MATERIAL', 'LABOUR', 'EQUIPMENT', 'OVERHEADS', 'OTHER'].map((cat) => ({
    name: cat.charAt(0) + cat.slice(1).toLowerCase(),
    value: expenses.filter((e: any) => e.category === cat).reduce((s: number, e: any) => s + e.amount, 0),
  }));

  const phaseChartData = allPhases.map((phase) => {
    const pTasks = tasks.filter((t: any) => t.phaseName.toLowerCase() === phase.toLowerCase());
    const total = pTasks.length;
    const completed = pTasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;
    const percent = total > 0 
      ? Math.round(pTasks.reduce((s: number, t: any) => s + (t.isCompleted ? 100 : t.progressPercent || 0), 0) / total) 
      : 0;
    const photoCount = sitePhotos.filter((p: any) => 
      (p.caption || '').toLowerCase().includes(`[${phase.toLowerCase()}]`) ||
      (p.caption || '').toLowerCase().includes(phase.toLowerCase())
    ).length;

    return {
      phase,
      name: phase,
      percent,
      progress: percent,
      total,
      completed,
      photoCount,
    };
  });

  const assignedTradesList = Array.from(
    new Set([...CONTRACTOR_TRADES, ...tasks.map((t: any) => t.assignee).filter(Boolean)])
  );

  const tradeStats = assignedTradesList.map((trade) => {
    const tTasks = tasks.filter((t: any) => t.assignee === trade);
    const done = tTasks.filter((t: any) => t.isCompleted || t.progressPercent >= 100).length;
    const total = tTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { trade, total, done, percent };
  });

  const openTasks = tasks.filter((t: any) => !t.isCompleted);
  const risk = computeRisk({
    budget: project.budget,
    totalEstimatedCost: est?.totalEstimatedCost ?? project.budget,
    spentSoFar: spent,
    progressPercent: project.progressPercent,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    completedTaskDueDates: openTasks.map((t: any) => new Date(t.dueDate)),
    plannedLabourHeadcount: (est?.masonCount ?? 0) + (est?.electricianCount ?? 0) + (est?.plumberCount ?? 0),
    actualLabourHeadcount: (est?.masonCount ?? 0) + (est?.electricianCount ?? 0) + (est?.plumberCount ?? 0),
  });

  return (
    <div className="space-y-6">
      {/* 1. Executive Statistical KPI Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-signal-slate uppercase">PHYSICAL EXECUTION</span>
            <span className="rounded bg-signal-teal/15 px-2 py-0.5 text-xs font-mono font-bold text-signal-teal">
              {project.progressPercent}%
            </span>
          </div>
          <p className="mt-2 font-display text-2xl text-paper">{project.progressPercent}% Done</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
            <div
              className={`h-full transition-all duration-300 ${
                project.progressPercent >= 80 ? 'bg-signal-teal' : project.progressPercent >= 40 ? 'bg-signal-blue' : 'bg-signal-amber'
              }`}
              style={{ width: `${project.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-signal-slate font-mono">
            {completedTasksCount} of {totalTasksCount} tasks complete
          </p>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-signal-slate uppercase">BUDGET UTILIZATION</span>
            <span className="rounded bg-signal-amber/15 px-2 py-0.5 text-xs font-mono font-bold text-signal-amber">
              {spentPercent}%
            </span>
          </div>
          <p className="mt-2 font-display text-2xl text-signal-amber">{formatCurrency(spent)}</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
            <div
              className={`h-full transition-all duration-300 ${
                spentPercent > 90 ? 'bg-signal-coral' : spentPercent > 60 ? 'bg-signal-amber' : 'bg-signal-teal'
              }`}
              style={{ width: `${Math.min(100, spentPercent)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-signal-slate font-mono">
            {formatCurrency(remainingBudget)} remaining of {formatCurrency(budgetBase)}
          </p>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-signal-slate uppercase">MILESTONE VELOCITY</span>
            <span className="rounded bg-sky-500/15 px-2 py-0.5 text-xs font-mono font-bold text-sky-400">
              {taskVelocityPercent}%
            </span>
          </div>
          <p className="mt-2 font-display text-2xl text-paper">{completedTasksCount} / {totalTasksCount}</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
            <div
              className="h-full bg-signal-blue transition-all duration-300"
              style={{ width: `${taskVelocityPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-signal-slate font-mono">
            {allPhases.length} total work phases mapped
          </p>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-signal-slate uppercase">SITE TELEMETRY & GPS</span>
            <span className="rounded bg-signal-teal/15 px-2 py-0.5 text-xs font-mono font-bold text-signal-teal">
              {sitePhotos.length} Proofs
            </span>
          </div>
          <p className="mt-2 font-display text-2xl text-signal-teal">{gpsPhotosCount} Geotagged</p>
          <p className="mt-2 text-[11px] text-signal-slate font-mono">
            {sitePhotos.length - gpsPhotosCount} standard logs · Live field sync active
          </p>
        </div>
      </div>

      {/* 2. Phase-by-Phase Completion & Progress Analytics */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line/40 pb-3">
          <div>
            <h3 className="font-display text-base text-paper flex items-center gap-2">
              <BarChart3 size={18} className="text-signal-teal" /> Phase Completion & Progress Analytics
            </h3>
            <p className="text-xs text-signal-slate mt-0.5">
              Detailed breakdown of milestones, completion velocity, and inspection coverage per phase for {project.name}.
            </p>
          </div>
          <span className="rounded border border-blueprint-line bg-navy-950 px-2.5 py-1 text-xs font-mono text-signal-slate">
            {allPhases.length} Phases Active
          </span>
        </div>

        {/* Phase Bar Chart */}
        <div className="mb-6">
          <PhaseBarChart data={phaseChartData} />
        </div>

        {/* Phase Statistics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-blueprint-line/60 text-xs text-signal-slate font-mono">
                <th className="pb-2 font-normal">Phase Name</th>
                <th className="pb-2 font-normal">Milestones (Done / Total)</th>
                <th className="pb-2 font-normal">Execution Bar</th>
                <th className="pb-2 font-normal">Progress %</th>
                <th className="pb-2 font-normal">Photos</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blueprint-line/40">
              {phaseChartData.map((p) => {
                const isDone = p.percent >= 100;
                const isInProg = !isDone && p.percent > 0;
                return (
                  <tr key={p.phase} className="hover:bg-navy-950/30 transition-colors">
                    <td className="py-3 pr-3 font-semibold text-paper">{p.phase}</td>
                    <td className="py-3 pr-3 font-mono text-signal-slate text-xs">
                      {p.completed} of {p.total} task(s)
                    </td>
                    <td className="py-3 pr-3 w-40">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-navy-950 border border-blueprint-line/40">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone ? 'bg-signal-teal' : isInProg ? 'bg-signal-blue' : 'bg-transparent'
                          }`}
                          style={{ width: `${p.percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs font-bold text-paper">{p.percent}%</td>
                    <td className="py-3 pr-3 font-mono text-xs text-signal-teal">
                      {p.photoCount > 0 ? `📷 ${p.photoCount}` : '—'}
                    </td>
                    <td className="py-3">
                      {isDone ? (
                        <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                          COMPLETED
                        </span>
                      ) : isInProg ? (
                        <span className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-400">
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="rounded border border-signal-slate/40 bg-signal-slate/10 px-2 py-0.5 text-[10px] font-mono text-signal-slate">
                          NOT STARTED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Financial Breakdown & Cost Distribution Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-5">
          <div className="mb-3 flex items-center justify-between border-b border-blueprint-line/40 pb-2.5">
            <h3 className="font-display text-sm text-paper flex items-center gap-2">
              <PieChart size={16} className="text-signal-teal" /> Category Cost Distribution
            </h3>
            <span className="text-xs font-mono text-signal-amber">{formatCurrency(spent)} total spent</span>
          </div>

          <DonutChart data={donutData} />

          <div className="mt-4 space-y-2 border-t border-blueprint-line/40 pt-3">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                <span className="text-signal-slate">{d.name}</span>
                <span className="text-paper font-semibold">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-5 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-blueprint-line/40 pb-2.5">
              <h3 className="font-display text-sm text-paper flex items-center gap-2">
                <TrendingUp size={16} className="text-signal-teal" /> Cost & Unit Economics
              </h3>
              <span className="text-xs font-mono text-signal-slate">{formatNumber(project.builtUpAreaSqFt)} sq.ft</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-md border border-blueprint-line/60 bg-navy-950 p-3">
                <div className="flex justify-between text-xs font-mono text-signal-slate">
                  <span>Actual Cost per Sq.Ft (Spent)</span>
                  <span className="text-signal-amber font-bold">₹{formatNumber(costPerSqFtSpent)} / sq.ft</span>
                </div>
              </div>

              <div className="rounded-md border border-blueprint-line/60 bg-navy-950 p-3">
                <div className="flex justify-between text-xs font-mono text-signal-slate">
                  <span>Estimated Baseline (Budgeted)</span>
                  <span className="text-signal-teal font-bold">₹{formatNumber(costPerSqFtEstimated)} / sq.ft</span>
                </div>
              </div>

              <div className="rounded-md border border-blueprint-line/60 bg-navy-950 p-3">
                <div className="flex justify-between text-xs font-mono text-signal-slate">
                  <span>Total Expenses Transactions Logged</span>
                  <span className="text-paper font-bold">{expenses.length} entries</span>
                </div>
              </div>

              <div className="rounded-md border border-blueprint-line/60 bg-navy-950 p-3">
                <div className="flex justify-between text-xs font-mono text-signal-slate">
                  <span>Average Expense Ticket</span>
                  <span className="text-paper font-bold">
                    {expenses.length > 0 ? formatCurrency(Math.round(spent / expenses.length)) : '₹0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-signal-teal/30 bg-signal-teal/5 p-3 text-xs text-signal-slate">
            <span className="text-paper font-medium">Financial Summary: </span>
            {remainingBudget >= 0 ? (
              <span className="text-signal-teal">Project is within allocated budget with {formatCurrency(remainingBudget)} remaining.</span>
            ) : (
              <span className="text-signal-coral">Project is exceeding budget by {formatCurrency(Math.abs(remainingBudget))}.</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Subcontractor Trade Allocation & Workload Matrix */}
      <div className="rounded-md border border-blueprint-line bg-navy-900 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line/40 pb-3">
          <div>
            <h3 className="font-display text-base text-paper flex items-center gap-2">
              <Users size={18} className="text-signal-teal" /> Subcontractor Trade Performance & Workload Matrix
            </h3>
            <p className="text-xs text-signal-slate mt-0.5">
              Task distribution and completion statistics across contractor trades for {project.name}.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tradeStats.map((t) => (
            <div key={t.trade} className="rounded-md border border-blueprint-line bg-navy-950 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-paper truncate">{t.trade}</span>
                <span className="font-mono text-xs font-bold text-signal-teal">{t.percent}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-900 border border-blueprint-line/40">
                <div
                  className={`h-full transition-all duration-300 ${
                    t.percent >= 100 ? 'bg-signal-teal' : t.percent > 0 ? 'bg-signal-blue' : 'bg-transparent'
                  }`}
                  style={{ width: `${t.percent}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-signal-slate font-mono">
                {t.done} of {t.total} task(s) done
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AI Risk & Material Takeoff Analytics (if Estimate present) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-blueprint-line bg-navy-900 p-5 lg:col-span-1">
          <h3 className="mb-3 font-display text-sm text-paper flex items-center gap-2">
            <ShieldAlert size={16} className="text-signal-teal" /> AI Risk Forecast
          </h3>
          <RiskGauge score={risk.overallScore} level={risk.level} />
          <div className="mt-4 space-y-2">
            <Row label="Budget Overrun Risk" value={`${risk.budgetOverrunScore}%`} />
            <Row label="Delay Risk" value={`${risk.delayScore}%`} />
            <Row label="Material Volatility" value={`${risk.materialVolatilityScore}%`} />
            <Row label="Labour Shortage" value={`${risk.labourShortageScore}%`} />
          </div>
        </div>

        <div className="rounded-md border border-blueprint-line bg-navy-900 p-5 lg:col-span-2">
          <h3 className="mb-3 font-display text-sm text-paper flex items-center gap-2">
            <Sparkles size={16} className="text-signal-teal" /> Material & Labour Estimation Baseline
          </h3>
          {est ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-mono text-signal-slate uppercase">Material Quantities</p>
                <Row label="Cement" value={`${formatNumber(est.cementBags)} bags`} />
                <Row label="Steel" value={`${formatNumber(est.steelKg)} kg`} />
                <Row label="Sand" value={`${formatNumber(est.sandCft)} cft`} />
                <Row label="Bricks" value={`${formatNumber(est.bricksCount)} nos.`} />
                <Row label="Aggregate" value={`${formatNumber(est.aggregateCft)} cft`} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-mono text-signal-slate uppercase">Labour Headcount</p>
                <Row label="Masons" value={`${est.masonCount}`} />
                <Row label="Electricians" value={`${est.electricianCount}`} />
                <Row label="Plumbers" value={`${est.plumberCount}`} />
                <Row label="Helpers" value={`${est.helperCount}`} />
                <Row label="Total Man-Hours" value={formatNumber(est.totalManHours)} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-signal-slate py-8 text-center">
              No AI Estimation calculated yet for this project. Visit the Estimation tab to run calculations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ project }: { project: any }) {
  const events: Array<{
    id: string;
    type: 'CREATED' | 'ESTIMATE' | 'EXPENSE' | 'TASK' | 'PHOTO' | 'CHANGELOG';
    title: string;
    detail: string;
    author: string;
    date: Date;
    color: string;
  }> = [];

  // 1. Initial Project Creation
  if (project.createdAt) {
    events.push({
      id: `create-${project.id}`,
      type: 'CREATED',
      title: 'Project Registered',
      detail: `Project initiated at ${project.location} with built-up area ${formatNumber(project.builtUpAreaSqFt)} sq.ft and initial budget ${formatCurrency(project.budget)}.`,
      author: project.user?.name || project.user?.email || 'Admin',
      date: new Date(project.createdAt),
      color: 'border-signal-teal text-signal-teal bg-signal-teal/10',
    });
  }

  // 2. Estimate Calculation
  if (project.estimate) {
    events.push({
      id: `est-${project.estimate.id}`,
      type: 'ESTIMATE',
      title: 'AI Estimation Evaluated',
      detail: `Total estimate calculated at ${formatCurrency(project.estimate.totalEstimatedCost)} (${formatCurrency(project.estimate.costPerSqFt)}/sq.ft) with ${formatNumber(project.estimate.cementBags)} bags cement and ${formatNumber(project.estimate.steelKg)} kg steel.`,
      author: 'AI Cost Engine',
      date: new Date(project.estimate.updatedAt || project.estimate.createdAt),
      color: 'border-indigo-400 text-indigo-400 bg-indigo-500/10',
    });
  }

  // 3. Logged Expenses
  (project.expenses || []).forEach((e: any) => {
    events.push({
      id: `exp-${e.id}`,
      type: 'EXPENSE',
      title: `Expense Logged: ${e.itemName}`,
      detail: `${formatCurrency(e.amount)} allocated under ${e.category.toLowerCase()} category.`,
      author: 'Site Accounts',
      date: new Date(e.date || e.createdAt),
      color: 'border-signal-amber text-signal-amber bg-signal-amber/10',
    });
  });

  // 4. Tasks Added or Completed
  (project.tasks || []).forEach((t: any) => {
    events.push({
      id: `task-${t.id}`,
      type: 'TASK',
      title: t.isCompleted ? `Task Completed: ${t.title}` : `Task Scheduled: ${t.title}`,
      detail: `Phase: ${t.phaseName} · Trade: ${t.assignee || 'General'} · Due: ${formatDate(t.dueDate)}`,
      author: t.assignee || 'Planning Engineer',
      date: new Date(t.updatedAt || t.createdAt),
      color: t.isCompleted ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' : 'border-sky-400 text-sky-400 bg-sky-500/10',
    });
  });

  // 5. Proof-of-work Site Photos
  (project.sitePhotos || []).forEach((p: any) => {
    events.push({
      id: `photo-${p.id}`,
      type: 'PHOTO',
      title: 'Site Inspection Photo Uploaded',
      detail: `${p.caption || 'Proof of work captured.'}${p.latitude && p.longitude ? ` (GPS: ${p.latitude.toFixed(2)}, ${p.longitude.toFixed(2)})` : ''}`,
      author: 'Field Engineer (Mobile)',
      date: new Date(p.uploadedAt),
      color: 'border-signal-teal text-signal-teal bg-signal-teal/10',
    });
  });

  // 6. Change Logs
  (project.changeLogs || []).forEach((c: any) => {
    events.push({
      id: `log-${c.id}`,
      type: 'CHANGELOG',
      title: `Field Modified: ${c.field}`,
      detail: `Updated from "${c.oldValue || 'None'}" to "${c.newValue}".`,
      author: c.changedBy || 'Admin',
      date: new Date(c.createdAt),
      color: 'border-signal-slate text-signal-slate bg-signal-slate/10',
    });
  });

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (events.length === 0) {
    return <p className="text-sm text-signal-slate">No history recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 before:absolute before:bottom-0 before:left-2.5 before:top-2 before:w-0.5 before:bg-blueprint-line">
      <div className="space-y-4">
        {events.map((e) => (
          <div key={e.id} className="relative flex items-start gap-4">
            <div className={`absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${e.color}`}>
              {e.type === 'CREATED' && <FolderPlus size={11} />}
              {e.type === 'ESTIMATE' && <Sparkles size={11} />}
              {e.type === 'EXPENSE' && <DollarSign size={11} />}
              {e.type === 'TASK' && (e.title.includes('Completed') ? <CheckCircle2 size={11} /> : <Clock size={11} />)}
              {e.type === 'PHOTO' && <Camera size={11} />}
              {e.type === 'CHANGELOG' && <Edit3 size={11} />}
            </div>

            <div className="w-full rounded-lg border border-blueprint-line bg-navy-900 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-display text-sm font-semibold text-paper">
                  {e.title}
                </span>
                <span className="text-xs text-signal-slate">
                  {formatDate(e.date)}
                </span>
              </div>
              <p className="mt-1 text-xs text-paper/80 leading-relaxed">
                {e.detail}
              </p>
              <div className="mt-2.5 flex items-center gap-2 border-t border-blueprint-line/40 pt-2 text-[11px] text-signal-slate">
                <span>By: <strong className="text-paper/80 font-medium">{e.author}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-blueprint-line bg-navy-900 p-4">
      <p className="text-xs text-signal-slate">{label}</p>
      <p className="mt-1 font-display text-lg text-paper">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-blueprint-line/50 py-1.5 text-sm last:border-0">
      <span className="text-signal-slate">{label}</span>
      <span className="text-paper">{value}</span>
    </div>
  );
}