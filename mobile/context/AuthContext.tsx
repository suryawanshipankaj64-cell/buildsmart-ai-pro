import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { loginWithCredentials, verifyCurrentSession, logout as apiLogout } from '../api/auth';
import { getStoredToken, getSecureItem, setSecureItem } from '../api/client';

const SAVED_USER_KEY = 'buildsmart_cached_user';

export type MobileRole = 'ADMIN' | 'ENGINEER' | 'CLIENT';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  role: MobileRole;
  isAdmin: boolean;
  isEngineer: boolean;
  isClient: boolean;
  canEditData: boolean;
  canManageRates: boolean;
  login: (email: string, pass: string) => Promise<User>;
  loginByProjectId: (projectId: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthSession();
  }, []);

  async function checkAuthSession() {
    setIsLoading(true);
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        // Try verifying with backend
        const verifiedUser = await verifyCurrentSession();
        if (verifiedUser) {
          setUser(verifiedUser);
          await setSecureItem(SAVED_USER_KEY, JSON.stringify(verifiedUser));
        } else {
          // Fallback to cached user if offline
          const cached = await getSecureItem(SAVED_USER_KEY);
          if (cached) {
            setUser(JSON.parse(cached));
          }
        }
      }
    } catch (e) {
      console.warn('Session check failed:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, pass: string): Promise<User> {
    setIsLoading(true);
    try {
      const res = await loginWithCredentials(email, pass);
      setToken(res.token);
      setUser(res.user);
      await setSecureItem(SAVED_USER_KEY, JSON.stringify(res.user));
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }

  async function loginByProjectId(projectId: string): Promise<User> {
    const { loginWithProjectId } = await import('../api/auth');
    setIsLoading(true);
    try {
      const res = await loginWithProjectId(projectId);
      setToken(res.token);
      setUser(res.user);
      await setSecureItem(SAVED_USER_KEY, JSON.stringify(res.user));
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }

  async function logout(): Promise<void> {
    setIsLoading(true);
    try {
      await apiLogout();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser(): Promise<void> {
    try {
      const verified = await verifyCurrentSession();
      if (verified) {
        setUser(verified);
        await setSecureItem(SAVED_USER_KEY, JSON.stringify(verified));
      }
    } catch {}
  }

  const isAuthenticated = !!token && !!user;
  const isApproved = user?.isApproved ?? true; // By default checked against user object

  const rawRole = (user?.role || '').toUpperCase();
  const userEmail = (user?.email || '').toLowerCase();

  const role: MobileRole =
    rawRole === 'ADMIN' || userEmail.includes('admin') || userEmail.includes('pankajsuryawanshi')
      ? 'ADMIN'
      : rawRole === 'CLIENT' || rawRole === 'CUSTOMER' || userEmail.includes('client')
      ? 'CLIENT'
      : 'ENGINEER';

  const isAdmin = role === 'ADMIN';
  const isEngineer = role === 'ENGINEER';
  const isClient = role === 'CLIENT';
  const canEditData = isAdmin || isEngineer;
  const canManageRates = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isApproved,
        role,
        isAdmin,
        isEngineer,
        isClient,
        canEditData,
        canManageRates,
        login,
        loginByProjectId,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

