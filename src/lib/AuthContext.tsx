'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'buyer';
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage (stored after successful login)
    const savedUser = localStorage.getItem('carx-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('carx-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error || 'فشل تسجيل الدخول' };
      }

      setUser(data.user);
      localStorage.setItem('carx-user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('carx-token', data.token);
      }

      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!data.success) {
        return { success: false, error: data.error || 'فشل التسجيل' };
      }

      setUser(data.user);
      localStorage.setItem('carx-user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('carx-token', data.token);
      }

      return { success: true };
    } catch {
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // silent
    } finally {
      setUser(null);
      localStorage.removeItem('carx-user');
      localStorage.removeItem('carx-token');
    }
  };

  const refreshUser = () => {
    const savedUser = localStorage.getItem('carx-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('carx-user');
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}