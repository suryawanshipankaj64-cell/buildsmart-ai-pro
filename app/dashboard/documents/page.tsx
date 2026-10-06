'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { 
  FileDown, 
  FileText, 
  Calculator, 
  Hammer, 
  DollarSign, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  Loader2,
  Calendar,
  Truck
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProjectPicker from '@/components/ProjectPicker';
import {
  generateEstimatePDF,
  generateMaterialLabourPDF,
  generateBudgetVariancePDF,
  generateTimelineRiskPDF,
  generateMasterDossierPDF,
} from '@/lib/pdfGenerator';

interface DocumentCard {
  id: 'estimate' | 'material' | 'budget' | 'timeline' | 'master';
  title: string;
  badge: string;
  description: string;
  highlights: string[];
  icon: any;
  color: string;
  badgeColor: string;
}

const DOCUMENTS: DocumentCard[] = [
  {
    id: 'estimate',
    title: 'Cost Estimation & Client Quotation',
    badge: 'Executive Quotation',
    description: 'Client-ready commercial proposal with material cost breakdown, labor rates, and machinery rentals.',
    highlights: ['Cost per sq.ft benchmark', 'Equipment & machinery schedule', 'Material & labor % breakdown', 'Technical sign-off block'],
    icon: Calculator,
    color: 'text-signal-teal',
    badgeColor: 'bg-signal-teal/15 text-signal-teal border-signal-teal/30',
  },
  {
    id: 'material',
    title: 'Material Takeoff & Plant Schedule',
    badge: 'Procurement & Logistics',
    description: 'Engineering schedule detailing required civil raw materials, tooling, and labor force sizing.',
    highlights: ['Cement, steel, sand & aggregate takeoff', 'Concrete mixer, vibrator & JCB hours', 'Trade manpower roster', 'Material specs & standards'],
    icon: Hammer,
    color: 'text-signal-blue',
    badgeColor: 'bg-signal-blue/15 text-signal-blue border-signal-blue/30',
  },
  {
    id: 'budget',
    title: 'Budget Variance & Financial Audit',
    badge: 'Financial Intelligence',
    description: 'Cost variance tracking against estimated baseline, expense vouchers audit, and budget burn rate.',
    highlights: ['Budget vs Actual expense metrics', 'Itemized voucher audit log', 'Category cost distribution', 'Financial controller review'],
    icon: DollarSign,
    color: 'text-signal-amber',
    badgeColor: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30',
  },
  {
    id: 'timeline',
    title: 'Timeline Milestones & Risk Audit',
    badge: 'Schedule & Quality',
    description: 'Stage-by-stage work breakdown structure, task status tracking, and AI risk mitigation matrix.',
    highlights: ['Phase milestone register', 'AI risk vulnerability matrix', 'Task completion percentages', 'Site manager sign-off'],
    icon: Clock,
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
];

export default function DocumentsPage() {
  const { data: projects = [], isLoading } = useSWR('/api/projects', fetcher);
  const [projectId, setProjectId] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const project = projects.find((p: any) => p.id === (projectId || projects[0]?.id));

  async function handleDownload(kind: 'estimate' | 'material' | 'budget' | 'timeline' | 'master') {
    if (!project) return;
    setDownloadingId(kind);
    try {
      if (kind === 'estimate') await generateEstimatePDF(project);
      else if (kind === 'material') await generateMaterialLabourPDF(project);
      else if (kind === 'budget') await generateBudgetVariancePDF(project);
      else if (kind === 'timeline') await generateTimelineRiskPDF(project);
      else if (kind === 'master') await generateMasterDossierPDF(project);
    } catch (err) {
      console.error('PDF_DOWNLOAD_ERROR:', err);
    } finally {
      setDownloadingId(null);
    }
  }

  const spentSoFar = (project?.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const totalBudget = project?.estimate?.totalEstimatedCost || project?.budget || 0;
  const completedTasks = (project?.tasks || []).filter((t: any) => t.isCompleted).length;
  const totalTasks = (project?.tasks || []).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 text-paper">
      {/* Page Header */}
      <div className="border-b border-blueprint-line pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="text-signal-teal" size={26} /> Documents & Engineering Reports
          </h1>
          <p className="text-xs text-signal-slate mt-0.5">
            Generate systematically structured, client-ready civil engineering PDF reports with live project data.
          </p>
        </div>

        {project && (
          <button
            onClick={() => handleDownload('master')}
            disabled={downloadingId !== null}
            className="flex items-center gap-2 rounded-lg bg-signal-teal px-4 py-2 text-xs font-bold text-navy-950 transition hover:bg-signal-teal/90 disabled:opacity-50 shadow-sm"
          >
            {downloadingId === 'master' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating Master Dossier...
              </>
            ) : (
              <>
                <Layers size={14} /> Download Master Project Dossier (All-in-One)
              </>
            )}
          </button>
        )}
      </div>

      {/* Project Selector & Active Project Overview Card */}
      <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <label className="text-[11px] font-mono uppercase tracking-wider text-signal-slate block mb-1">
              Select Active Project
            </label>
            <ProjectPicker projects={projects} value={projectId || projects[0]?.id || ''} onChange={setProjectId} />
          </div>

          {project && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg border border-blueprint-line bg-navy-950 px-3 py-2 text-left">
                <span className="text-[10px] font-mono text-signal-slate block">BUILT-UP AREA</span>
                <span className="text-xs font-mono font-bold text-signal-teal">
                  {(project.builtUpAreaSqFt || 0).toLocaleString()} sq.ft
                </span>
              </div>

              <div className="rounded-lg border border-blueprint-line bg-navy-950 px-3 py-2 text-left">
                <span className="text-[10px] font-mono text-signal-slate block">ESTIMATED BUDGET</span>
                <span className="text-xs font-mono font-bold text-paper">
                  {formatCurrency(totalBudget)}
                </span>
              </div>

              <div className="rounded-lg border border-blueprint-line bg-navy-950 px-3 py-2 text-left">
                <span className="text-[10px] font-mono text-signal-slate block">ACTUAL SPENT</span>
                <span className="text-xs font-mono font-bold text-signal-blue">
                  {formatCurrency(spentSoFar)}
                </span>
              </div>

              <div className="rounded-lg border border-blueprint-line bg-navy-950 px-3 py-2 text-left">
                <span className="text-[10px] font-mono text-signal-slate block">PROGRESS / TASKS</span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {Math.round(project.progressPercent || 0)}% ({completedTasks}/{totalTasks})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Systematic PDF Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.icon;
          const isDownloading = downloadingId === doc.id;

          return (
            <div
              key={doc.id}
              className="flex flex-col justify-between rounded-xl border border-blueprint-line bg-navy-900/80 p-5 transition hover:border-blueprint-line/80 hover:bg-navy-900"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-navy-950 border border-blueprint-line p-2">
                      <Icon className={doc.color} size={18} />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-paper">{doc.title}</h3>
                      <span className={`inline-block rounded border px-2 py-0.5 text-[9px] font-mono font-semibold mt-0.5 ${doc.badgeColor}`}>
                        {doc.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-signal-slate leading-relaxed mb-4">
                  {doc.description}
                </p>

                {/* Structured Highlights */}
                <div className="rounded-lg bg-navy-950/80 border border-blueprint-line/60 p-3 mb-4 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-signal-slate block">
                    Structured PDF Sections:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {doc.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-paper/80">
                        <CheckCircle2 size={11} className="text-signal-teal shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Action */}
              <div className="pt-2 border-t border-blueprint-line/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-signal-slate">
                  Format: Systematic PDF (A4)
                </span>
                <button
                  onClick={() => handleDownload(doc.id)}
                  disabled={!project || downloadingId !== null}
                  className="flex items-center gap-2 rounded-lg bg-navy-800 border border-blueprint-line px-3.5 py-1.5 text-xs font-semibold text-paper transition hover:bg-signal-teal hover:text-navy-950 hover:border-signal-teal disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-signal-teal" /> Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileDown size={14} /> Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
