'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { 
  Calculator, 
  Sparkles, 
  Layers, 
  Building2, 
  IndianRupee, 
  Hammer, 
  CheckCircle2,
  Truck,
  Zap,
  Scissors,
  Tractor,
  Droplet,
  Compass,
  Sliders,
  ShieldCheck,
  Info
} from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { calculateRequiredEquipment, EquipmentItem } from '@/lib/estimation';
import Link from 'next/link';

type QualityTier = 'STANDARD' | 'PREMIUM' | 'LUXURY';

interface TierConfig {
  multiplier: number;
  label: string;
  description: string;
  cementFactor: number; // bags per sq.ft
  steelFactor: number;  // kg per sq.ft
  sandFactor: number;   // cft per sq.ft
  aggregateFactor: number; // cft per sq.ft
  bricksFactor: number; // units per sq.ft
}

const TIER_SPECS: Record<QualityTier, TierConfig> = {
  STANDARD: {
    multiplier: 1.0,
    label: 'Standard / Civil Grade',
    description: 'Basic finishes, standard red bricks / AAC blocks, Fe-500 steel, OPC 43/53 cement.',
    cementFactor: 0.42,
    steelFactor: 3.8,
    sandFactor: 1.7,
    aggregateFactor: 1.3,
    bricksFactor: 19,
  },
  PREMIUM: {
    multiplier: 1.25,
    label: 'Premium Grade',
    description: 'Vitrified tiles, engineered AAC blocks, Fe-550D TMT, waterproof exterior coating.',
    cementFactor: 0.45,
    steelFactor: 4.2,
    sandFactor: 1.85,
    aggregateFactor: 1.4,
    bricksFactor: 19.5,
  },
  LUXURY: {
    multiplier: 1.75,
    label: 'Luxury Architect',
    description: 'Italian marble, structural glazing, custom woodwork, concealed smart home conduits.',
    cementFactor: 0.48,
    steelFactor: 4.8,
    sandFactor: 2.0,
    aggregateFactor: 1.55,
    bricksFactor: 21,
  },
};

export default function EstimationPage() {
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');
  const [sqFt, setSqFt] = useState<number>(2000);
  const [floors, setFloors] = useState<number>(1);
  const [quality, setQuality] = useState<QualityTier>('STANDARD');

  // Fetch live Admin Master Rates from DB
  const { data: adminRates } = useSWR('/api/admin/rates', fetcher);

  // Admin Master Baseline Rates per Quality Grade
  const standardRate = adminRates?.standardRatePerSqFt || adminRates?.baseRatePerSqFt || 1700;
  const premiumRate = adminRates?.premiumRatePerSqFt || 2200;
  const luxuryRate = adminRates?.luxuryRatePerSqFt || 3100;

  const qualityRates: Record<QualityTier, number> = {
    STANDARD: standardRate,
    PREMIUM: premiumRate,
    LUXURY: luxuryRate,
  };

  const cementRate = adminRates?.cementBagRate || 380;
  const steelRate = adminRates?.steelKgRate || 65;
  const sandRate = adminRates?.sandCftRate || 55;
  const aggregateRate = adminRates?.aggregateCftRate || 42;
  const brickRate = adminRates?.brickRate || 9;

  // Calculation Engine
  const effectiveArea = (sqFt || 0) * Math.max(1, floors);
  const currentTier = TIER_SPECS[quality];
  
  // Rate is derived directly from Admin Quality Grade baseline
  const rate = activeTab === 'quick' ? standardRate : qualityRates[quality];
  const totalCost = effectiveArea * rate;

  const materials = {
    cement: Math.round(effectiveArea * (activeTab === 'quick' ? 0.42 : currentTier.cementFactor)),
    steel: Math.round(effectiveArea * (activeTab === 'quick' ? 3.8 : currentTier.steelFactor)),
    sand: Math.round(effectiveArea * (activeTab === 'quick' ? 1.7 : currentTier.sandFactor)),
    aggregate: Math.round(effectiveArea * (activeTab === 'quick' ? 1.3 : currentTier.aggregateFactor)),
    bricks: Math.round(effectiveArea * (activeTab === 'quick' ? 19 : currentTier.bricksFactor)),
    masons: Math.max(2, Math.round(effectiveArea / 300)),
    helpers: Math.max(4, Math.round(effectiveArea / 150)),
    electricians: Math.max(1, Math.round(effectiveArea / 1000)),
    plumbers: Math.max(1, Math.round(effectiveArea / 1000)),
  };

  // Equipment calculation
  const equipmentList: EquipmentItem[] = calculateRequiredEquipment(sqFt, floors);
  const totalEquipmentCost = equipmentList.reduce((sum, item) => sum + item.estCost, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6 text-paper">
      {/* Header */}
      <div className="border-b border-blueprint-line pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Calculator className="text-signal-teal" size={26} /> AI Quantity & Cost Estimator
          </h1>
          <p className="text-xs text-signal-slate mt-0.5">
            Instant square-footage price forecasting, material takeoff, and required equipment planning.
          </p>
        </div>

        {/* Admin Quality Grade Baselines Indicator */}
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-signal-teal/40 bg-signal-teal/10 px-3 py-1.5 text-xs font-mono">
          <ShieldCheck size={14} className="text-signal-teal" />
          <span className="text-signal-slate">Admin Baselines:</span>
          <span className="font-bold text-signal-teal">Standard: ₹{standardRate}</span>
          <span className="text-signal-slate">·</span>
          <span className="font-bold text-signal-blue">Premium: ₹{premiumRate}</span>
          <span className="text-signal-slate">·</span>
          <span className="font-bold text-signal-amber">Luxury: ₹{luxuryRate}</span>
          <Link 
            href="/dashboard/admin" 
            className="text-[10px] text-signal-slate hover:text-signal-teal underline ml-1 font-sans"
            title="Configure baseline rates in Admin Management"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('quick')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'quick'
              ? 'bg-signal-teal text-navy-950 font-bold'
              : 'border border-blueprint-line bg-navy-900 text-signal-slate hover:text-paper'
          }`}
        >
          <Zap size={14} /> ⚡ Quick Area Prediction
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'detailed'
              ? 'bg-signal-teal text-navy-950 font-bold'
              : 'border border-blueprint-line bg-navy-900 text-signal-slate hover:text-paper'
          }`}
        >
          <Layers size={14} /> 🏗️ Quality Grade & Takeoff
        </button>
      </div>

      {/* Input Parameters Card */}
      <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-signal-slate block mb-1">
              Built-up Area (Square Feet)
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 text-signal-slate" size={16} />
              <input
                type="number"
                min="100"
                step="50"
                value={sqFt || ''}
                onChange={(e) => setSqFt(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 py-2 pl-9 pr-4 text-sm text-paper focus:border-signal-teal focus:outline-none"
                placeholder="e.g. 2000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-signal-slate block mb-1">
              Number of Floors / Staging
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={floors}
              onChange={(e) => setFloors(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-blueprint-line bg-navy-800 py-2 px-3 text-sm text-paper focus:border-signal-teal focus:outline-none"
            />
          </div>

          {activeTab === 'detailed' && (
            <div className="sm:col-span-2 md:col-span-1">
              <label className="text-xs font-medium text-signal-slate block mb-1">
                Construction Quality Grade
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['STANDARD', 'PREMIUM', 'LUXURY'] as QualityTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setQuality(tier)}
                    className={`rounded-md border py-2 px-1 text-center transition-all ${
                      quality === tier
                        ? 'border-signal-teal bg-signal-teal/15 text-signal-teal font-bold'
                        : 'border-blueprint-line bg-navy-800 text-signal-slate hover:text-paper'
                    }`}
                  >
                    <span className="block text-[11px] font-mono font-bold">{tier}</span>
                    <span className="block text-[9px] font-mono opacity-80 mt-0.5">₹{qualityRates[tier]}/sq.ft</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Multiplier explanation */}
        <div className="rounded-lg bg-navy-800/60 p-3 text-xs text-signal-slate flex items-center justify-between gap-2 border border-blueprint-line/40">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-signal-teal shrink-0" />
            <span>
              {activeTab === 'quick'
                ? `Calculation formula: Built-up Area (${effectiveArea.toLocaleString()} sq.ft) × Admin Standard Baseline (₹${standardRate}/sq.ft)`
                : `${currentTier.description} Admin Baseline Rate: ₹${qualityRates[quality]}/sq.ft for ${quality} grade`}
            </span>
          </div>
          <span className="font-mono text-signal-teal font-bold shrink-0">
            = ₹{totalCost.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Real-Time Prediction Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-signal-slate font-mono">ESTIMATED BUDGET</span>
          <div className="text-2xl font-extrabold text-paper mt-1 font-display">
            ₹{totalCost.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-signal-teal font-mono">₹{rate}/sq.ft baseline</span>
        </div>

        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-signal-slate font-mono">CEMENT REQUIRED</span>
          <div className="text-2xl font-extrabold text-paper mt-1 font-display">
            {materials.cement.toLocaleString()} <span className="text-xs font-normal font-sans">bags</span>
          </div>
          <span className="text-xs text-signal-slate font-mono">~₹{(materials.cement * cementRate).toLocaleString('en-IN')} est.</span>
        </div>

        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-signal-slate font-mono">TMT STEEL</span>
          <div className="text-2xl font-extrabold text-paper mt-1 font-display">
            {materials.steel.toLocaleString()} <span className="text-xs font-normal font-sans">kg</span>
          </div>
          <span className="text-xs text-signal-slate font-mono">~₹{(materials.steel * steelRate).toLocaleString('en-IN')} est.</span>
        </div>

        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-signal-slate font-mono">LABOR FORCE</span>
          <div className="text-2xl font-extrabold text-paper mt-1 font-display">
            {materials.masons} <span className="text-xs font-normal font-sans">Masons</span>
          </div>
          <span className="text-xs text-signal-slate font-mono">+ {materials.helpers} General helpers</span>
        </div>
      </div>

      {/* Bill of Quantities Breakdown */}
      <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5">
        <h3 className="text-sm font-semibold text-paper mb-3 flex items-center gap-2">
          <Hammer size={16} className="text-signal-teal" /> Material Takeoff Schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-blueprint-line text-signal-slate">
                <th className="pb-2">Material Item</th>
                <th className="pb-2">Standard Formula</th>
                <th className="pb-2">Quantity</th>
                <th className="pb-2">Admin Master Rate</th>
                <th className="pb-2 text-right">Est. Material Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blueprint-line/40 font-mono">
              <tr>
                <td className="py-2.5 font-medium text-paper font-sans">Ordinary Portland Cement (OPC 43/53)</td>
                <td className="py-2.5 text-signal-slate">0.40 - 0.44 bags / sq.ft</td>
                <td className="py-2.5 font-semibold text-paper">{materials.cement.toLocaleString()} bags</td>
                <td className="py-2.5 text-signal-slate">₹{cementRate} / bag</td>
                <td className="py-2.5 text-right font-semibold text-signal-teal">₹{(materials.cement * cementRate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-paper font-sans">Fe-550D TMT Reinforcement Steel</td>
                <td className="py-2.5 text-signal-slate">3.5 - 4.2 kg / sq.ft</td>
                <td className="py-2.5 font-semibold text-paper">{materials.steel.toLocaleString()} kg</td>
                <td className="py-2.5 text-signal-slate">₹{steelRate} / kg</td>
                <td className="py-2.5 text-right font-semibold text-signal-teal">₹{(materials.steel * steelRate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-paper font-sans">River Sand / Plastering M-Sand</td>
                <td className="py-2.5 text-signal-slate">1.6 - 2.0 CFT / sq.ft</td>
                <td className="py-2.5 font-semibold text-paper">{materials.sand.toLocaleString()} CFT</td>
                <td className="py-2.5 text-signal-slate">₹{sandRate} / CFT</td>
                <td className="py-2.5 text-right font-semibold text-signal-teal">₹{(materials.sand * sandRate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-paper font-sans">Coarse Aggregate (10mm / 20mm Stone)</td>
                <td className="py-2.5 text-signal-slate">1.25 - 1.55 CFT / sq.ft</td>
                <td className="py-2.5 font-semibold text-paper">{materials.aggregate.toLocaleString()} CFT</td>
                <td className="py-2.5 text-signal-slate">₹{aggregateRate} / CFT</td>
                <td className="py-2.5 text-right font-semibold text-signal-teal">₹{(materials.aggregate * aggregateRate).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-paper font-sans">Red Clay Kiln Bricks / AAC Blocks</td>
                <td className="py-2.5 text-signal-slate">18 - 21 units / sq.ft</td>
                <td className="py-2.5 font-semibold text-paper">{materials.bricks.toLocaleString()} pcs</td>
                <td className="py-2.5 text-signal-slate">₹{brickRate} / unit</td>
                <td className="py-2.5 text-right font-semibold text-signal-teal">₹{(materials.bricks * brickRate).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Required Construction Equipment & Machinery Section */}
      <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blueprint-line/50 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-paper flex items-center gap-2">
              <Truck size={17} className="text-signal-teal" /> Required Construction Equipment & Machinery
            </h3>
            <p className="text-xs text-signal-slate mt-0.5">
              Civil engineering equipment scheduling based on built-up area and structural volume.
            </p>
          </div>
          <span className="rounded bg-signal-teal/15 px-2.5 py-1 text-xs font-mono font-bold text-signal-teal">
            {equipmentList.length} Machinery Units · Total Est. ₹{totalEquipmentCost.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-blueprint-line text-signal-slate font-mono text-[11px]">
                <th className="pb-2">Equipment Item</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Standard Formula</th>
                <th className="pb-2">Required Quantity</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Operational Purpose</th>
                <th className="pb-2 text-right">Est. Rental Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blueprint-line/40">
              {equipmentList.map((eq) => (
                <tr key={eq.id} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 font-semibold text-paper">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-navy-800 p-1 text-signal-teal border border-blueprint-line/60">
                        {eq.category === 'Concreting' && <Truck size={13} />}
                        {eq.category === 'Earthwork' && <Tractor size={13} />}
                        {eq.category === 'Steel & Rebar' && <Scissors size={13} />}
                        {eq.category === 'Formwork' && <Layers size={13} />}
                        {eq.category === 'Curing & Survey' && <Droplet size={13} />}
                      </span>
                      <span>{eq.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="rounded border border-blueprint-line bg-navy-950 px-2 py-0.5 text-[10px] font-mono text-signal-slate">
                      {eq.category}
                    </span>
                  </td>
                  <td className="py-3 text-signal-slate font-mono text-[11px]">{eq.formula}</td>
                  <td className="py-3 font-semibold text-paper font-mono">{eq.quantity}</td>
                  <td className="py-3 font-mono text-signal-teal">{eq.durationDays} Days</td>
                  <td className="py-3 text-signal-slate text-[11px] max-w-xs">{eq.purpose}</td>
                  <td className="py-3 text-right font-mono font-bold text-paper">₹{eq.estCost.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}