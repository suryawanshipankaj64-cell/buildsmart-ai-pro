import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project, DashboardMetrics } from '../types';
import { fetchProjects, calculateProjectRisk, FALLBACK_PROJECTS } from '../api/projects';
import { getSecureItem, setSecureItem } from '../api/client';
import { useAuth } from './AuthContext';

const CACHED_PROJECTS_KEY = 'buildsmart_cached_projects';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  metrics: DashboardMetrics;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isApproved, user, role, isClient } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load from Local Cache
  useEffect(() => {
    async function loadCached() {
      try {
        const cached = await getSecureItem(CACHED_PROJECTS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ignore stale legacy mock IDs
            const hasLegacyFakeIds = parsed.some((p: Project) => p.id?.startsWith('proj-') || p.id?.startsWith('cmux8b0pe0006'));
            if (!hasLegacyFakeIds) {
              let initialProjects = parsed;
              if (isClient && user?.id) {
                const clientFiltered = parsed.filter((p: Project) => p.userId === user.id);
                if (clientFiltered.length > 0) initialProjects = clientFiltered;
              }
              setProjects(initialProjects);
              setActiveProjectIdState((prev) => (prev && initialProjects.some((p: Project) => p.id === prev) ? prev : initialProjects[0]?.id ?? null));
              return;
            }
          }
        }
      } catch {}

      setProjects([]);
      setActiveProjectIdState(null);
    }

    loadCached();
  }, [isClient, user?.id]);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !isApproved) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjects({
        userId: user?.id,
        email: user?.email,
        role,
      });

      let finalProjects: Project[] = Array.isArray(data) ? data : [];
      if (isClient && user?.id) {
        finalProjects = finalProjects.filter((p) => p.userId === user.id);
      }

      setProjects(finalProjects);
      if (finalProjects.length > 0) {
        setActiveProjectIdState((prev) => (prev && finalProjects.some((p) => p.id === prev) ? prev : finalProjects[0].id));
      } else {
        setActiveProjectIdState(null);
      }
      // Save valid projects to local cache
      await setSecureItem(CACHED_PROJECTS_KEY, JSON.stringify(finalProjects));
    } catch (err: any) {
      if (!err?.isAborted) {
        console.log('[ProjectContext] Load error:', err?.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isApproved, user?.id, user?.email, role, isClient]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const setActiveProjectId = (id: string) => {
    setActiveProjectIdState(id);
  };

  // Compute aggregate metrics for dashboard matching Web dashboard calculation
  const activeCount = projects.filter((p) => p.status !== 'COMPLETED').length || projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const totalSpent = projects.reduce((sum, p) => sum + (Number(p.spent) || 0), 0);
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (Number(p.progressPercent) || 0), 0) / projects.length)
    : 0;

  // Determine highest risk level among active projects
  let worstRisk: 'Low' | 'Medium' | 'High' = 'Low';
  projects.forEach((p) => {
    const risk = calculateProjectRisk(p);
    if (risk.level === 'High') worstRisk = 'High';
    else if (risk.level === 'Medium' && worstRisk !== 'High') worstRisk = 'Medium';
  });

  const metrics: DashboardMetrics = {
    activeProjects: activeCount,
    totalBudget,
    totalSpent,
    averageProgress: avgProgress,
    riskLevel: worstRisk,
    notificationsCount: 0,
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        error,
        metrics,
        setActiveProjectId,
        refreshProjects: loadProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
