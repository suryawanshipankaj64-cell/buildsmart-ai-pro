import { apiClient } from './client';
import { Project, RiskAnalysis } from '../types';

export const FALLBACK_PROJECTS: Project[] = [];

export async function fetchProjects(userContext?: { userId?: string; email?: string; role?: string }): Promise<Project[]> {
  try {
    const queryParams = new URLSearchParams();
    if (userContext?.userId) queryParams.append('userId', userContext.userId);
    if (userContext?.email) queryParams.append('email', userContext.email);
    if (userContext?.role) queryParams.append('role', userContext.role);

    const qs = queryParams.toString();
    const endpoint = qs ? `/projects?${qs}` : '/projects';
    const projects = await apiClient<Project[]>(endpoint);
    
    if (Array.isArray(projects)) {
      return projects.map((p) => {
        const totalSpent = (p.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const budget = Number(p.estimate?.totalEstimatedCost ?? p.budget ?? 0);
        return {
          ...p,
          budget,
          spent: totalSpent,
        };
      });
    }
  } catch (err: any) {
    console.log('[fetchProjects] Query notice:', err?.message);
  }

  return [];
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  try {
    const project = await apiClient<Project>(`/projects/${id}`);
    if (!project) return null;
    const totalSpent = (project.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const budget = Number(project.estimate?.totalEstimatedCost ?? project.budget ?? 0);
    return {
      ...project,
      budget,
      spent: totalSpent,
    };
  } catch (err: any) {
    return null;
  }
}

export async function createProject(data: {
  name: string;
  location: string;
  builtUpAreaSqFt: number;
  budget: number;
  startDate?: string;
  endDate?: string;
  autoSeed?: boolean;
}): Promise<Project> {
  const result = await apiClient<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

// Client-side risk computation matching backend lib/risk.ts
export function calculateProjectRisk(project: Project): RiskAnalysis {
  const budget = project.budget || 1;
  const spent = project.spent || 0;
  const progress = Math.max(project.progressPercent || 0, 1);

  const burnRate = (spent / budget) * 100;
  const overrunRatio = burnRate / progress;
  const budgetOverrunScore = Math.min(100, Math.max(0, Math.round((overrunRatio - 1) * 100)));

  // Tasks delay calculation
  const now = new Date();
  const tasks = project.tasks || [];
  const overdueTasks = tasks.filter((t) => !t.isCompleted && new Date(t.dueDate) < now).length;
  const delayScore = Math.min(100, overdueTasks * 15);

  const materialVolatilityScore = 20; // baseline
  const labourShortageScore = 15;     // baseline

  const overallScore = Math.min(
    100,
    Math.round(budgetOverrunScore * 0.4 + delayScore * 0.35 + materialVolatilityScore * 0.15 + labourShortageScore * 0.1)
  );

  const level: RiskAnalysis['level'] = overallScore < 30 ? 'Low' : overallScore < 65 ? 'Medium' : 'High';
  const flags: string[] = [];

  if (overrunRatio > 1.1) flags.push('Expense burn rate exceeds physical completion milestone.');
  if (overdueTasks > 0) flags.push(`${overdueTasks} milestone task(s) overdue.`);

  return {
    overallScore,
    level,
    budgetOverrunScore,
    delayScore,
    materialVolatilityScore,
    labourShortageScore,
    flags,
  };
}
