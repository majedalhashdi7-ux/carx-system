'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getTenantConfig, 
  getTenantApiUrl,
  TENANT_CONFIGS,
  DEFAULT_TENANT_ID 
} from './tenant-config';

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
  // Initialize with domain-detected tenant config for immediate availability
  const initialTenant = typeof window !== 'undefined' ? getTenantConfig() : null;
  
  const [tenant, setTenant] = useState<TenantData | null>(initialTenant);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    // الحصول على إعدادات الـ domain مسبقاً كـ fallback آمن
    const domainConfig = typeof window !== 'undefined'
      ? getTenantConfig()
      : getDefaultTenant();

    try {
      setLoading(true);
      setError(null);

      // تطبيق إعدادات الـ domain فوراً للحصول على أفضل تجربة (بدون انتظار API)
      setTenant(domainConfig);
      if (typeof document !== 'undefined') {
        applyTheme(domainConfig.theme, domainConfig.id);
        updateFavicon(domainConfig.favicon);
        document.title = domainConfig.name || 'HM CAR';
      }

      const baseUrl = getTenantApiUrl();

      // مهلة زمنية للطلب: 5 ثوانٍ فقط لتجنب تعليق الواجهة
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/api/v2/tenant/info`, {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        // فشل الشبكة أو انتهت المهلة — نستمر بإعدادات الـ domain (لا نرمي خطأ)
        console.warn('[Tenant] API unreachable, using domain config:', (fetchErr as Error).message);
        return;
      }

      // إذا كان الـ response غير ناجح، نستمر بإعدادات الـ domain بهدوء
      if (!response.ok) {
        console.warn('[Tenant] API returned', response.status, '— using domain config fallback');
        return;
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        console.warn('[Tenant] Invalid JSON from API — using domain config fallback');
        return;
      }

      if (data?.success && data?.data) {
        // دمج بيانات الـ API مع إعدادات الـ domain (الـ API له الأولوية)
        const mergedTenant = { ...domainConfig, ...data.data };
        setTenant(mergedTenant);
        if (typeof document !== 'undefined') {
          applyTheme(mergedTenant.theme, mergedTenant.id);
          updateFavicon(mergedTenant.favicon);
          document.title = mergedTenant.name || 'HM CAR';
        }
      }
    } catch (err) {
      // أي خطأ غير متوقع — نسجله فقط ولا نرميه للـ ErrorBoundary
      console.warn('[Tenant] Unexpected error in fetchTenant:', err);
      // ضمان وجود tenant دائماً
      setTenant(prev => prev ?? domainConfig);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

function applyTheme(theme: TenantTheme, tenantId?: string) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  if (tenantId) {
    root.setAttribute('data-tenant', tenantId);
  }
  
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

  const baseUrl = getTenantApiUrl();

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
  // Use the tenant config from tenant-config.ts for consistency
  return TENANT_CONFIGS[DEFAULT_TENANT_ID];
}
