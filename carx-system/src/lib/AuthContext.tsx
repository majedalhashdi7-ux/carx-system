'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from './api';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('carx_token');
      localStorage.removeItem('carx_user');
      document.cookie = 'carx_token=; path=/; max-age=0';
    }
    setUser(null);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('carx_token', token);
      localStorage.setItem('carx_user', JSON.stringify(userData));
      document.cookie = `carx_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
    }
    setUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('carx_token') : null;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.auth.verify();
      if (res.data && (res.data as any).user) {
        const freshUser = (res.data as any).user;
        setUser(freshUser);
        localStorage.setItem('carx_user', JSON.stringify(freshUser));
      } else {
        // التوكن غير صالح — ننظّف
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // التحميل الأولي: نقرأ من localStorage أولاً (سريع) ثم نتحقق من الخادم
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('carx_token');
    const cached = localStorage.getItem('carx_user');

    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        /* ignored */
      }
      // نتحقق من الخادم في الخلفية
      refreshUser();
    } else {
      setIsLoading(false);
    }

    // الاستماع لتغييرات localStorage من تابات أخرى
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'carx_token') {
        if (!e.newValue) {
          setUser(null);
        } else if (e.newValue !== e.oldValue) {
          refreshUser();
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshUser]);

  // ---- Heartbeat: keeps the user marked as "online" on the backend ----
  // Fires every 60 seconds while the user is logged in
  useEffect(() => {
    if (!user) return; // Only run when logged in
    
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2';
    
    const ping = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('carx_token') : null;
      if (!token) return;
      fetch(`${API_BASE}/users/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'carx',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {}); // Silent — never block UI
    };

    // Ping immediately on mount/login, then every 60 seconds
    ping();
    const interval = setInterval(ping, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
