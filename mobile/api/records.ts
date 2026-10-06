import { apiClient } from './client';
import { QuickActionType } from '../types';

export interface RecordPayload {
  actionType: QuickActionType;
  projectId: string;
  payload: Record<string, any>;
}

export async function dispatchRecord(data: RecordPayload): Promise<any> {
  return apiClient('/record', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

