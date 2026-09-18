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
      // مسح كوكي carx_token فقط — هذا ما يتحقق منه middleware.ts في carx-system
      document.cookie = 'carx_token=; path=/; max-age=0; SameSite=Strict';
    }
    setUser(null);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      // حفظ التوكن في localStorage + كوكي carx_token
      // الـ middleware في carx-system يقرأ carx_token فقط (منفصل تماماً عن HM Car)
      const THIRTY_DAYS = 60 * 60 * 24 * 30;
      localStorage.setItem('carx_token', token);
      localStorage.setItem('carx_user', JSON.stringify(userData));
      document.cookie = `carx_token=${token}; path=/; max-age=${THIRTY_DAYS}; SameSite=Strict`;
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
      if (res.data) {
        const d = res.data as any;
        // Backend returns: { success, data: { user: {...} } } OR { success, user: {...} }
        const freshUser = d?.data?.user || d?.user || null;
        if (freshUser && (freshUser.id || freshUser._id)) {
          setUser(freshUser);
          localStorage.setItem('carx_user', JSON.stringify(freshUser));
        } else {
          // التوكن غير صالح — ننظّف
          logout();
        }
      } else {
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
        const parsedUser = JSON.parse(cached);
        setUser(parsedUser);
        // إعادة تعيين carx_token عند التحميل الأولي لضمان استمرارية الجلسة
        // (في حال انتهت صلاحية الكوكي بينما localStorage لا يزال صالحاً)
        const THIRTY_DAYS = 60 * 60 * 24 * 30;
        document.cookie = `carx_token=${token}; path=/; max-age=${THIRTY_DAYS}; SameSite=Strict`;
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
