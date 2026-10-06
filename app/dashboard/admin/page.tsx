'use client';

import { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, Loader2, IndianRupee, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [rates, setRates] = useState<any>({
    baseRatePerSqFt: 1800,
    cementBagRate: 380,
    steelKgRate: 65,
    sandCftRate: 55,
    aggregateCftRate: 42,
    brickRate: 9,
    masonDailyWage: 950,
    helperDailyWage: 550,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch('/api/admin/rates');
        if (res.ok) {
          const data = await res.json();
          setRates(data);
        } else {
          setError('Failed to fetch current baseline rates.');
        }
      } catch (err: any) {
        setError(err?.message || 'Network error.');
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save rates.');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error updating rates.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-signal-slate">
        <Loader2 className="animate-spin text-signal-teal mr-2" size={20} />
        Loading baseline rates...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6 text-paper">
      <div className="border-b border-blueprint-line pb-4">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Sliders className="text-signal-teal" size={24} /> Admin Estimation Controls
        </h1>
        <p className="text-xs text-signal-slate">
          Set official baseline rates per square foot, material prices, and labour wages.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-signal-coral/30 bg-signal-coral/10 p-3 text-xs text-signal-coral">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-paper flex items-center gap-2">
              <Sliders size={16} className="text-signal-teal" /> Construction Quality Grade Baseline Rates
            </h2>
            <p className="text-xs text-signal-slate mt-1">
              Admin master baseline prices per square foot for STANDARD, PREMIUM, and LUXURY grades. These rates directly drive AI House Price predictions across Web and Mobile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Grade */}
            <div className="rounded-lg border border-blueprint-line/70 bg-navy-950 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-teal/15 px-2 py-0.5 text-[10px] font-mono font-bold text-signal-teal">
                  STANDARD GRADE
                </span>
                <span className="text-[10px] font-mono text-signal-slate">Civil Standard</span>
              </div>
              <label className="text-xs text-paper font-semibold block">Baseline Rate (₹ / sq.ft)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 text-signal-slate" size={15} />
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={rates.standardRatePerSqFt ?? rates.baseRatePerSqFt ?? 1700}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRates({ 
                      ...rates, 
                      standardRatePerSqFt: val,
                      baseRatePerSqFt: val 
                    });
                  }}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 py-2 pl-8 pr-3 text-sm font-mono text-signal-teal font-bold focus:border-signal-teal focus:outline-none"
                  placeholder="1700"
                />
              </div>
              <p className="text-[10px] text-signal-slate">
                Basic finishes, red clay / AAC blocks, Fe-500 TMT, OPC 43/53 cement.
              </p>
            </div>

            {/* Premium Grade */}
            <div className="rounded-lg border border-blueprint-line/70 bg-navy-950 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-blue/15 px-2 py-0.5 text-[10px] font-mono font-bold text-signal-blue">
                  PREMIUM GRADE
                </span>
                <span className="text-[10px] font-mono text-signal-slate">High Spec</span>
              </div>
              <label className="text-xs text-paper font-semibold block">Baseline Rate (₹ / sq.ft)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 text-signal-slate" size={15} />
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={rates.premiumRatePerSqFt ?? 2200}
                  onChange={(e) => setRates({ ...rates, premiumRatePerSqFt: Number(e.target.value) })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 py-2 pl-8 pr-3 text-sm font-mono text-signal-blue font-bold focus:border-signal-teal focus:outline-none"
                  placeholder="2200"
                />
              </div>
              <p className="text-[10px] text-signal-slate">
                Vitrified tiles, Fe-550D TMT, waterproof exterior, premium sanitary.
              </p>
            </div>

            {/* Luxury Grade */}
            <div className="rounded-lg border border-blueprint-line/70 bg-navy-950 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="rounded bg-signal-amber/15 px-2 py-0.5 text-[10px] font-mono font-bold text-signal-amber">
                  LUXURY GRADE
                </span>
                <span className="text-[10px] font-mono text-signal-slate">Architectural</span>
              </div>
              <label className="text-xs text-paper font-semibold block">Baseline Rate (₹ / sq.ft)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 text-signal-slate" size={15} />
                <input
                  type="number"
                  min="500"
                  step="50"
                  value={rates.luxuryRatePerSqFt ?? 3100}
                  onChange={(e) => setRates({ ...rates, luxuryRatePerSqFt: Number(e.target.value) })}
                  className="w-full rounded-md border border-blueprint-line bg-navy-800 py-2 pl-8 pr-3 text-sm font-mono text-signal-amber font-bold focus:border-signal-teal focus:outline-none"
                  placeholder="3100"
                />
              </div>
              <p className="text-[10px] text-signal-slate">
                Italian marble, structural glazing, custom woodwork, smart conduits.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-paper">Material Unit Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-signal-slate block mb-1">Cement Bag (50kg) (₹)</label>
              <input
                type="number"
                value={rates.cementBagRate || ''}
                onChange={(e) => setRates({ ...rates, cementBagRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-signal-slate block mb-1">TMT Steel (per kg) (₹)</label>
              <input
                type="number"
                value={rates.steelKgRate || ''}
                onChange={(e) => setRates({ ...rates, steelKgRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-signal-slate block mb-1">River / M-Sand (per CFT) (₹)</label>
              <input
                type="number"
                value={rates.sandCftRate || ''}
                onChange={(e) => setRates({ ...rates, sandCftRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-signal-slate block mb-1">Aggregate (per CFT) (₹)</label>
              <input
                type="number"
                value={rates.aggregateCftRate || ''}
                onChange={(e) => setRates({ ...rates, aggregateCftRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-signal-slate block mb-1">Brick (per piece) (₹)</label>
              <input
                type="number"
                value={rates.brickRate || ''}
                onChange={(e) => setRates({ ...rates, brickRate: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-blueprint-line bg-navy-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-paper">Labour Daily Wage Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-signal-slate block mb-1">Mason Daily Wage (₹)</label>
              <input
                type="number"
                value={rates.masonDailyWage || ''}
                onChange={(e) => setRates({ ...rates, masonDailyWage: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-signal-slate block mb-1">Helper Daily Wage (₹)</label>
              <input
                type="number"
                value={rates.helperDailyWage || ''}
                onChange={(e) => setRates({ ...rates, helperDailyWage: Number(e.target.value) })}
                className="w-full rounded-lg border border-blueprint-line bg-navy-800 p-2 text-sm text-paper focus:border-signal-teal focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-signal-teal px-6 py-2.5 text-xs font-semibold text-navy-950 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save & Lock Rates'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-signal-teal">
              <CheckCircle2 size={15} /> Rates updated and synced across all estimations!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}