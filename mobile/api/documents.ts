import { apiClient } from './client';
import { DocumentRecord, DocumentCategory, Role } from '../types';

export interface DocumentFilterOptions {
  projectId?: string;
  category?: string;
  search?: string;
}

export async function fetchDocuments(options: DocumentFilterOptions = {}): Promise<DocumentRecord[]> {
  const params = new URLSearchParams();
  if (options.projectId) params.append('projectId', options.projectId);
  if (options.category && options.category !== 'ALL') params.append('category', options.category);
  if (options.search) params.append('search', options.search);

  const query = params.toString();
  const endpoint = `/documents${query ? `?${query}` : ''}`;
  return apiClient<DocumentRecord[]>(endpoint);
}

export interface UploadDocumentPayload {
  projectId: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize?: string;
  version?: string;
  uploadedBy?: string;
  roleVisibility?: Role[];
  tags?: string[];
  url?: string;
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<DocumentRecord> {
  return apiClient<DocumentRecord>('/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteDocument(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/documents?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

