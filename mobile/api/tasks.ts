import { apiClient } from './client';
import { Task } from '../types';

export async function fetchTasks(projectId?: string): Promise<Task[]> {
  const endpoint = projectId ? `/tasks?projectId=${encodeURIComponent(projectId)}` : '/tasks';
  const tasks = await apiClient<Task[]>(endpoint);
  if (projectId) {
    return tasks.filter((t) => t.projectId === projectId);
  }
  return tasks;
}

export interface UpdateTaskPayload {
  isCompleted?: boolean;
  progressPercent?: number;
  title?: string;
  notes?: string;
  proofImageUrl?: string;
  phaseName?: string;
  assignee?: string;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return apiClient<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export interface CreateTaskPayload {
  projectId: string;
  phaseName: string;
  title: string;
  assignee?: string;
  dueDate: string;
  progressPercent?: number;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiClient<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: string): Promise<{ ok: boolean }> {
  return apiClient<{ ok: boolean }>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function seedProjectTasks(projectId: string, action: 'seed' | 'clear' = 'seed'): Promise<any> {
  return apiClient<any>('/tasks/seed', {
    method: 'POST',
    body: JSON.stringify({ projectId, action }),
  });
}

export async function clearProjectTasks(projectId: string): Promise<any> {
  return apiClient<any>('/tasks/seed', {
    method: 'POST',
    body: JSON.stringify({ projectId, action: 'clear' }),
  });
}
