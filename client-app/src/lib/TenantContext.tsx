'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Types ──
export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface TenantContact {
  whatsapp: string;
  email: string;
  phone: string;
}

export interface TenantSettings {
  currency: string;
  language: string;
  direction: 'rtl' | 'ltr';
}

export interface TenantData {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  logo: string;
  favicon: string;
  theme: TenantTheme;
  contact: TenantContact;
  settings: TenantSettings;
  domains?: string[];
}

interface TenantContextType {
  tenant: TenantData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ── Context ──
const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
  refetch: async () => {},
});

// ── Provider ──
export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') 
          ? '' 
          : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

      const response = await fetch(`${baseUrl}/api/v2/tenant/info`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('فشل تحميل بيانات المعرض');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setTenant(data.data);
        
        // تطبيق الثيم على المتصفح
        applyTheme(data.data.theme);
        
        // تحديث favicon
        updateFavicon(data.data.favicon);
        
        // تحديث عنوان الصفحة
        document.title = data.data.name || 'HM CAR';
      }
    } catch (err) {
      console.error('خطأ في تحميل بيانات المعرض:', err);
      setError(err instanceof Error ? err.message : 'خطأ غير معروف');
      
      // استخدام بيانات افتراضية في حالة الفشل
      setTenant(getDefaultTenant());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refetch: fetchTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

// ── Hook ──
export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

// ── Helper Functions ──

function applyTheme(theme: TenantTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // تطبيق CSS Variables
  root.style.setProperty('--color-primary', theme.primaryColor);
  root.style.setProperty('--color-secondary', theme.secondaryColor);
  root.style.setProperty('--color-accent', theme.accentColor);
  root.style.setProperty('--color-background', theme.backgroundColor);
  root.style.setProperty('--color-text', theme.textColor);
  
  // تحديث meta theme-color
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', theme.backgroundColor);
}

function updateFavicon(faviconUrl: string) {
  if (typeof document === 'undefined') return;

  const baseUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost') 
      ? '' 
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

  const fullUrl = faviconUrl.startsWith('http') ? faviconUrl : `${baseUrl}${faviconUrl}`;

  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = fullUrl;
}

function getDefaultTenant(): TenantData {
  return {
    id: 'hmcar',
    name: 'HM CAR',
    nameEn: 'HM CAR',
    description: 'منصة مزادات ومبيعات السيارات الفاخرة',
    descriptionEn: 'Premium Car Auction & Sales Platform',
    logo: '/uploads/tenants/hmcar/logo.png',
    favicon: '/uploads/tenants/hmcar/favicon.ico',
    theme: {
      primaryColor: '#D4AF37',
      secondaryColor: '#1a1a2e',
      accentColor: '#e94560',
      backgroundColor: '#0f0f23',
      textColor: '#ffffff',
    },
    contact: {
      whatsapp: '+967781007805',
      email: 'info@hmcar.com',
      phone: '+967781007805',
    },
    settings: {
      currency: 'SAR',
      language: 'ar',
      direction: 'rtl',
    },
  };
}
