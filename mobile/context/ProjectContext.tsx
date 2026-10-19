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
  refreshProjects: (silent?: boolean) => Promise<void>;
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
              const targetProjectId = (user as any)?.projectId;
              if (isClient) {
                if (targetProjectId) {
                  initialProjects = parsed.filter((p: Project) => p.id === targetProjectId);
                } else if (user?.id) {
                  initialProjects = parsed.filter((p: Project) => p.userId === user.id || p.clientId === user.id);
                }
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
  }, [isClient, user?.id, (user as any)?.projectId]);

  const loadProjects = useCallback(async (silent = false) => {
    if (!isAuthenticated || !isApproved) return;
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const targetProjectId = (user as any)?.projectId;
      const data = await fetchProjects({
        userId: user?.id,
        email: user?.email,
        role,
        projectId: targetProjectId,
      });

      let finalProjects: Project[] = Array.isArray(data) ? data : [];
      if (isClient) {
        if (targetProjectId) {
          const matched = finalProjects.filter((p) => p.id === targetProjectId);
          if (matched.length > 0) finalProjects = matched;
        } else if (user?.id) {
          const matched = finalProjects.filter((p) => p.userId === user.id || p.clientId === user.id);
          if (matched.length > 0) finalProjects = matched;
        }
      }

      if (finalProjects.length > 0) {
        setProjects(finalProjects);
        if (targetProjectId && finalProjects.some((p) => p.id === targetProjectId)) {
          setActiveProjectIdState(targetProjectId);
        } else {
          setActiveProjectIdState((prev) => (prev && finalProjects.some((p) => p.id === prev) ? prev : finalProjects[0].id));
        }
        // Save valid projects to local cache
        await setSecureItem(CACHED_PROJECTS_KEY, JSON.stringify(finalProjects));
      } else {
        // If server returned 0 records unexpectedly, preserve existing projects if available
        setProjects((prev) => (prev.length > 0 ? prev : []));
      }
    } catch (err: any) {
      console.log('[ProjectContext] Load notice:', err?.message);
      // If error occurs and in-memory projects is empty, attempt recovery from local cache
      try {
        const cached = await getSecureItem(CACHED_PROJECTS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects((prev) => (prev.length > 0 ? prev : parsed));
            setActiveProjectIdState((prev) => prev || parsed[0]?.id || null);
          }
        }
      } catch {}
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAuthenticated, isApproved, user?.id, user?.email, (user as any)?.projectId, role, isClient]);

  useEffect(() => {
    loadProjects();
    // Live-sync interval: automatically poll updates every 15 seconds silently without UI flash
    const interval = setInterval(() => {
      loadProjects(true);
    }, 15000);
    return () => clearInterval(interval);
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
