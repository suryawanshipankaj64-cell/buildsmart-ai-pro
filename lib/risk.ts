// Module 4 — AI Risk Analysis. Every input here is read from the database
// (project dates, tasks, expenses, estimate) — nothing is a fixed constant
// except the weighting logic itself.

export interface RiskInputs {
  budget: number;
  totalEstimatedCost: number;
  spentSoFar: number;
  progressPercent: number;
  startDate: Date;
  endDate: Date;
  now?: Date;
  completedTaskDueDates: Date[]; // due dates of tasks still incomplete but overdue
  materialPriceDeltaPercent?: number; // % change vs. baseline MaterialRate, if tracked
  plannedLabourHeadcount: number;
  actualLabourHeadcount: number;
}

export interface RiskOutput {
  budgetOverrunScore: number; // 0-100
  delayScore: number; // 0-100
  materialVolatilityScore: number; // 0-100
  labourShortageScore: number; // 0-100
  overallScore: number; // 0-100
  level: 'Low' | 'Medium' | 'High';
  flags: string[];
}

export function computeRisk(input: RiskInputs): RiskOutput {
  const now = input.now ?? new Date();
  const flags: string[] = [];

  // Budget overrun: burn rate vs. progress rate.
  const budgetBase = input.totalEstimatedCost || input.budget || 1;
  const burnPercent = (input.spentSoFar / budgetBase) * 100;
  const progress = Math.max(input.progressPercent, 0.01);
  const overrunRatio = burnPercent / progress; // >1 means spending faster than progressing
  const budgetOverrunScore = clamp((overrunRatio - 1) * 100, 0, 100);
  if (overrunRatio > 1.15) flags.push('Spending is outpacing physical progress — budget overrun likely.');

  // Delay: elapsed time vs. progress, plus overdue tasks.
  const totalDurationDays = Math.max(daysBetween(input.startDate, input.endDate), 1);
  const elapsedDays = Math.max(daysBetween(input.startDate, now), 0);
  const timeElapsedPercent = clamp((elapsedDays / totalDurationDays) * 100, 0, 200);
  const scheduleGap = timeElapsedPercent - input.progressPercent;
  const overdueCount = input.completedTaskDueDates.filter((d) => d < now).length;
  const delayScore = clamp(scheduleGap + overdueCount * 5, 0, 100);
  if (overdueCount > 0) flags.push(`${overdueCount} task(s) are past their due date.`);

  // Material volatility.
  const delta = input.materialPriceDeltaPercent ?? 0;
  const materialVolatilityScore = clamp(delta * 2.5, 0, 100);
  if (delta > 10) flags.push('Key material prices have risen more than 10% above baseline.');

  // Labour shortage.
  const labourGap = input.plannedLabourHeadcount > 0
    ? ((input.plannedLabourHeadcount - input.actualLabourHeadcount) / input.plannedLabourHeadcount) * 100
    : 0;
  const labourShortageScore = clamp(labourGap, 0, 100);
  if (labourGap > 15) flags.push('On-site labour headcount is running below the planned roster.');

  const overallScore = clamp(
    budgetOverrunScore * 0.35 + delayScore * 0.3 + materialVolatilityScore * 0.15 + labourShortageScore * 0.2,
    0,
    100
  );

  const level: RiskOutput['level'] = overallScore < 30 ? 'Low' : overallScore < 70 ? 'Medium' : 'High';

  return {
    budgetOverrunScore: round(budgetOverrunScore),
    delayScore: round(delayScore),
    materialVolatilityScore: round(materialVolatilityScore),
    labourShortageScore: round(labourShortageScore),
    overallScore: round(overallScore),
    level,
    flags,
  };
}

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}
function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
function round(n: number) {
  return Math.round(n * 10) / 10;
}
