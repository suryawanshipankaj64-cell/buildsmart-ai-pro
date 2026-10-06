import { apiClient } from './client';
import { SitePhoto } from '../types';

export interface UploadPhotoPayload {
  projectId: string;
  imageUrl: string;
  caption?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export async function uploadSitePhoto(payload: UploadPhotoPayload): Promise<SitePhoto> {
  return apiClient<SitePhoto>('/photos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchSitePhotos(projectId?: string): Promise<SitePhoto[]> {
  const endpoint = projectId ? `/photos?projectId=${encodeURIComponent(projectId)}` : '/photos';
  return apiClient<SitePhoto[]>(endpoint);
}

export async function deleteSitePhoto(photoId: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>(`/photos/${encodeURIComponent(photoId)}`, {
    method: 'DELETE',
  });
}
