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
  try {
    // 1. Try to extract from Expo dev server hostUri (automatically populated when running via Expo Go)
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri && typeof hostUri === 'string') {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3000/api`;
      }
    }
  } catch (e) {
    console.warn('Auto-detect host IP error:', e);
  }

  // 2. Physical device or emulator fallback
  return Platform.select({
    android: `http://${WORKSTATION_LAN_IP}:3000/api`,
    ios: `http://${WORKSTATION_LAN_IP}:3000/api`,
    default: 'http://localhost:3000/api',
  }) || `http://${WORKSTATION_LAN_IP}:3000/api`;
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

// Token & Session Storage Helpers
export async function getStoredToken(): Promise<string | null> {
  return getSecureItem(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  return setSecureItem(TOKEN_KEY, token);
}

export async function clearStoredSession(): Promise<void> {
  await deleteSecureItem(TOKEN_KEY);
  await deleteSecureItem(USER_KEY);
}

export async function getStoredHostIp(): Promise<string> {
  const customHost = await getSecureItem(HOST_IP_KEY);
  if (customHost && customHost.trim().length > 0) {
    // If it was previously set to emulator 10.0.2.2 on a real device, prefer the real LAN IP
    if (customHost.includes('10.0.2.2') && Platform.OS !== 'web') {
      return getAutoDetectedHost();
    }
    return customHost.trim();
  }
  return getAutoDetectedHost();
}

export async function setStoredHostIp(ip: string): Promise<void> {
  const cleanIp = ip.trim().replace(/\/$/, '');
  const url = cleanIp.endsWith('/api') ? cleanIp : `${cleanIp}/api`;
  await setSecureItem(HOST_IP_KEY, url);
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  _retried?: boolean;
}

// Main HTTP Client with automatic Bearer token injection
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = options._retried ? getAutoDetectedHost() : await getStoredHostIp();
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

  const timeoutMs = options.timeoutMs ?? 15000;
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

    const autoHost = getAutoDetectedHost();
    if (!options._retried && baseUrl !== autoHost) {
      return apiClient<T>(endpoint, { ...options, _retried: true });
    }

    if (error.name === 'AbortError' || error?.message?.includes('canceled') || error?.message?.includes('aborted')) {
      const customErr = new Error(`Request timed out or connection was aborted.`);
      (customErr as any).isAborted = true;
      throw customErr;
    }
    throw error;
  }
}

