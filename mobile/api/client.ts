import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'buildsmart_jwt_token';
const USER_KEY = 'buildsmart_user_data';
const HOST_IP_KEY = 'buildsmart_host_ip';

// Known local development LAN IP of this workstation
export const WORKSTATION_LAN_IP = '10.16.100.56';

export function getAutoDetectedHost(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  // Production Cloud API is accessible globally over 5G/4G/Wi-Fi
  return CLOUD_API_URL;
}

// Secure storage helpers with Web platform fallback
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (err) {
    console.warn(`SecureStore setItem failed for key ${key}:`, err);
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (err) {
    console.warn(`SecureStore deleteItem failed for key ${key}:`, err);
  }
}

// Token & Session In-Memory Cache for ultra-fast zero-latency requests
let memoryToken: string | null = null;

export async function getStoredToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  memoryToken = await getSecureItem(TOKEN_KEY);
  return memoryToken;
}

export async function setStoredToken(token: string): Promise<void> {
  memoryToken = token;
  return setSecureItem(TOKEN_KEY, token);
}

export async function clearStoredSession(): Promise<void> {
  memoryToken = null;
  await deleteSecureItem(TOKEN_KEY);
  await deleteSecureItem(USER_KEY);
}

export const CLOUD_API_URL = 'https://buildsmart-ai-pro.vercel.app/api';

export async function getStoredHostIp(): Promise<string> {
  return CLOUD_API_URL;
}

export async function setStoredHostIp(ip: string): Promise<void> {
  const cleanIp = ip.trim().replace(/\/$/, '');
  const url = cleanIp.endsWith('/api') ? cleanIp : `${cleanIp}/api`;
  await setSecureItem(HOST_IP_KEY, url);
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  _retried?: boolean;
  _useCloud?: boolean;
}

// Main HTTP Client: Direct ultra-fast connection to live Cloud Backend
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = CLOUD_API_URL;
  const token = await getStoredToken();

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${formattedEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use 45s default timeout to tolerate serverless cold starts gracefully
  const timeoutMs = options.timeoutMs ?? 45000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { raw: text } : {};
    }

    if (!response.ok) {
      if (response.status === 413) {
        const err = new Error('Photo payload is too large. Please retake photo with optimized resolution.');
        (err as any).status = 413;
        throw err;
      }

      const errorMessage =
        data?.error ||
        data?.message ||
        `Network request failed with status code ${response.status}`;
      const err = new Error(errorMessage);
      (err as any).status = response.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Auto-retry once for GET requests if cold-start timed out or network blipped
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    if (isGet && !options._retried) {
      await new Promise((r) => setTimeout(r, 1200));
      return apiClient<T>(endpoint, { ...options, _retried: true, timeoutMs: 60000 });
    }

    if (error.name === 'AbortError' || error?.message?.includes('canceled') || error?.message?.includes('aborted')) {
      const customErr = new Error(`Request timed out or connection was aborted. Please check your network connection.`);
      (customErr as any).isAborted = true;
      throw customErr;
    }
    throw error;
  }
}

