export const DEFAULT_PHASES = [
  'Planning',
  'Substructure & Foundation',
  'Superstructure & Masonry',
  'Plumbing Work',
  'Electrical Work',
  'Paint & Finishing Work',
  'Interior & Woodwork',
  'Handover & Commissioning',
];

export function normalizePhaseName(phase?: string | null): string {
  if (!phase) return 'Planning';
  const p = phase.trim().toLowerCase();
  
  if (p.includes('plan')) return 'Planning';
  if (p.includes('found') || p.includes('substruct') || p.includes('excavat') || p.includes('footing') || p.includes('pile')) {
    return 'Substructure & Foundation';
  }
  if (p.includes('superstruct') || p.includes('rcc') || p.includes('structure') || p.includes('mason') || p.includes('brick') || p.includes('block') || p.includes('slab') || p.includes('column')) {
    return 'Superstructure & Masonry';
  }
  if (p.includes('plumb') || p.includes('drain') || p.includes('sanitar') || p.includes('pipe')) {
    return 'Plumbing Work';
  }
  if (p.includes('electr') || p.includes('conduit') || p.includes('wir') || p.includes('switch')) {
    return 'Electrical Work';
  }
  if (p.includes('paint') || p.includes('finish') || p.includes('plaster') || p.includes('putty') || p.includes('coat')) {
    return 'Paint & Finishing Work';
  }
  if (p.includes('interior') || p.includes('wood') || p.includes('tile') || p.includes('marble') || p.includes('door') || p.includes('cabinet') || p.includes('ceiling')) {
    return 'Interior & Woodwork';
  }
  if (p.includes('handover') || p.includes('commission') || p.includes('clean') || p.includes('final')) {
    return 'Handover & Commissioning';
  }

  const match = DEFAULT_PHASES.find((dp) => dp.toLowerCase() === p);
  if (match) return match;

  return phase.trim();
}


export interface AdminRates {
  baseRatePerSqFt: number;
  cementBagRate: number;
  steelKgRate: number;
  sandCftRate: number;
  aggregateCftRate: number;
  brickRate: number;
  masonDailyWage: number;
  helperDailyWage: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Concreting' | 'Earthwork' | 'Steel & Rebar' | 'Formwork' | 'Curing & Survey';
  formula: string;
  quantity: string;
  durationDays: number;
  estCost: number;
  icon: string;
  purpose: string;
}

export function calculateRequiredEquipment(
  builtUpAreaSqFt: number,
  floors: number = 1
): EquipmentItem[] {
  const effectiveArea = builtUpAreaSqFt * Math.max(1, floors);
  const estimatedDays = Math.max(30, Math.round((effectiveArea * 5.5) / (8 * Math.max(5, Math.round(effectiveArea / 200)))));
  
  const mixerDays = Math.max(5, Math.round(effectiveArea / 120));
  const vibratorDays = Math.max(5, Math.round(effectiveArea / 120));
  const excavatorHours = Math.max(8, Math.round(effectiveArea / 100));
  const plateCompactorDays = Math.max(3, Math.round(effectiveArea / 500));
  const rebarBenderDays = Math.max(4, Math.round(effectiveArea / 250));
  const scaffoldingUnits = Math.round(effectiveArea * 1.1);
  const curingPumpDays = Math.max(21, Math.round(effectiveArea / 80));
  const totalStationDays = Math.max(2, Math.round(floors * 2));

  return [
    {
      id: 'concrete-mixer',
      name: 'Concrete Batch Mixer (10/7 CFT)',
      category: 'Concreting',
      formula: '1 Batch / 120 sq.ft',
      quantity: '1 Unit',
      durationDays: mixerDays,
      estCost: mixerDays * 1200,
      icon: 'Truck',
      purpose: 'Homogeneous on-site RCC concrete mixing for columns, beams & floor slabs',
    },
    {
      id: 'needle-vibrator',
      name: 'High-Frequency Needle Vibrator (40mm/60mm)',
      category: 'Concreting',
      formula: '1 Pair per Pour',
      quantity: '2 Units',
      durationDays: vibratorDays,
      estCost: vibratorDays * 450,
      icon: 'Zap',
      purpose: 'De-aeration and compaction of poured concrete to eliminate honeycombs',
    },
    {
      id: 'rebar-cutter-bender',
      name: 'TMT Rebar Cutting & Bending Machine (8-32mm)',
      category: 'Steel & Rebar',
      formula: '1 Set per 250 sq.ft',
      quantity: '1 Unit Set',
      durationDays: rebarBenderDays,
      estCost: rebarBenderDays * 800,
      icon: 'Scissors',
      purpose: 'Precision cutting & bending of Fe-550D TMT reinforcement rings & column bars',
    },
    {
      id: 'excavator-jcb',
      name: 'Backhoe Earth Excavator (JCB 3DX)',
      category: 'Earthwork',
      formula: '1 Machine / 100 sq.ft foundation',
      quantity: `${excavatorHours} Op-Hours`,
      durationDays: Math.ceil(excavatorHours / 8),
      estCost: excavatorHours * 1600,
      icon: 'Tractor',
      purpose: 'Footing trenches, column pit excavation & boundary basement leveling',
    },
    {
      id: 'scaffolding-props',
      name: 'Heavy Duty Cuplock Scaffolding & Acrow Props',
      category: 'Formwork',
      formula: '1.1 sq.ft per built-up area',
      quantity: `${scaffoldingUnits} sq.ft Props`,
      durationDays: Math.round(estimatedDays * 0.6),
      estCost: Math.round(scaffoldingUnits * 18),
      icon: 'Layers',
      purpose: 'Structural support and falsework staging for RCC beam & ceiling slab casting',
    },
    {
      id: 'plate-compactor',
      name: 'Vibratory Plate Compactor (3-5 Ton force)',
      category: 'Earthwork',
      formula: '1 Unit / 500 sq.ft backfill',
      quantity: '1 Unit',
      durationDays: plateCompactorDays,
      estCost: plateCompactorDays * 900,
      icon: 'Hammer',
      purpose: 'Compacting foundation subgrade, plinth murrum fill & floor base concrete',
    },
    {
      id: 'curing-pump',
      name: 'High-Pressure Water Curing Pump & Grid',
      category: 'Curing & Survey',
      formula: 'Continuous 21-Day Hydration',
      quantity: '1 HP Monoblock Kit',
      durationDays: curingPumpDays,
      estCost: curingPumpDays * 350,
      icon: 'Droplet',
      purpose: 'Constant hydration curing for brick masonry walls and RCC structural members',
    },
    {
      id: 'total-station',
      name: 'Digital Total Station / Optical Theodolite',
      category: 'Curing & Survey',
      formula: '2 Days per Slab Level',
      quantity: '1 Survey Kit',
      durationDays: totalStationDays,
      estCost: totalStationDays * 2500,
      icon: 'Compass',
      purpose: 'Boundary demarcation, column axis alignment, and level benchmark transfer',
    },
  ];
}

export function calculateProjectEstimate(
  builtUpAreaSqFt: number,
  floors: number = 1,
  rates: AdminRates
) {
  const totalEffectiveArea = builtUpAreaSqFt * Math.max(1, floors);

  // Material consumption ratios per sq.ft
  const cementBags = Math.round(totalEffectiveArea * 0.4);
  const steelKg = Math.round(totalEffectiveArea * 3.5);
  const sandCft = Math.round(totalEffectiveArea * 1.8);
  const aggregateCft = Math.round(totalEffectiveArea * 1.35);
  const bricksCount = Math.round(totalEffectiveArea * 17);

  // Material cost based on admin rates
  const materialCost =
    cementBags * rates.cementBagRate +
    steelKg * rates.steelKgRate +
    sandCft * rates.sandCftRate +
    aggregateCft * rates.aggregateCftRate +
    bricksCount * rates.brickRate;

  // Labour sizing & man-hours
  const totalManHours = Math.round(totalEffectiveArea * 5.5);
  const masonCount = Math.max(2, Math.round(totalEffectiveArea / 400));
  const helperCount = Math.max(3, Math.round(totalEffectiveArea / 250));
  const electricianCount = Math.max(1, Math.round(totalEffectiveArea / 1000));
  const plumberCount = Math.max(1, Math.round(totalEffectiveArea / 1000));

  const estimatedDays = Math.max(30, Math.round(totalManHours / ((masonCount + helperCount) * 8)));
  const labourCost =
    estimatedDays * (masonCount * rates.masonDailyWage + helperCount * rates.helperDailyWage) +
    estimatedDays * (electricianCount * 850 + plumberCount * 850);

  // Required Equipment & Machinery calculations
  const equipmentItems = calculateRequiredEquipment(builtUpAreaSqFt, floors);
  const equipmentCost = equipmentItems.reduce((sum, item) => sum + item.estCost, 0);
  const overheadCost = Math.round((materialCost + labourCost) * 0.08);

  // Baseline cost benchmark derived from admin base rate (Area × Admin Base Rate)
  const baselineExpectedCost = totalEffectiveArea * rates.baseRatePerSqFt;
  const rawSumCost = materialCost + labourCost + equipmentCost + overheadCost;

  // Total estimated house cost is driven directly by admin baseline rate
  const totalEstimatedCost = Math.max(baselineExpectedCost, rawSumCost);
  const costPerSqFt = Math.round(totalEstimatedCost / totalEffectiveArea);

  return {
    cementBags,
    steelKg,
    sandCft,
    aggregateCft,
    bricksCount,
    masonCount,
    helperCount,
    electricianCount,
    plumberCount,
    totalManHours,
    materialCost,
    labourCost,
    equipmentCost,
    equipmentItems,
    overheadCost,
    totalEstimatedCost,
    costPerSqFt,
  };
}