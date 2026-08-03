/**
 * Tenant Configuration Utility
 * 
 * This module provides domain-based tenant detection for multi-tenant support.
 * It works on both client-side and server-side (SSR) environments.
 * 
 * The tenant mapping is derived from the backend's tenants.json file.
 * When adding new tenants, update both this file and the backend tenants.json.
 */

import { TenantData } from './TenantContext';

// Domain to tenant mapping - derived from backend tenants.json
// This allows the frontend to detect the tenant before making API calls
export const TENANT_DOMAIN_MAP: Record<string, string> = {
  // HM CAR domains
  'localhost:3000': 'hmcar',
  'localhost:4002': 'hmcar',
  'hmcar.vercel.app': 'hmcar',
  'hmcar-system-two.vercel.app': 'hmcar',
  'hmcar.xyz': 'hmcar',
  'www.hmcar.xyz': 'hmcar',
  
  // CAR X domains
  'localhost:3001': 'carx',
  'carx.localhost': 'carx',
  'carx-system-five.vercel.app': 'carx',
};

// Complete tenant configurations - mirrors backend tenants.json
export const TENANT_CONFIGS: Record<string, TenantData> = {
  hmcar: {
    id: 'hmcar',
    name: 'HM CAR',
    nameEn: 'HM CAR',
    description: 'منصة مزادات ومبيعات السيارات الفاخرة',
    descriptionEn: 'Premium Car Auction & Sales Platform',
    domains: [
      'localhost:3000',
      'localhost:4002',
      'hmcar.vercel.app',
      'hmcar-system-two.vercel.app',
      'hmcar.xyz',
      'www.hmcar.xyz',
    ],
    logo: '/images/logo/logo-horizontal.png',
    favicon: '/favicon.ico',
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
  },
  carx: {
    id: 'carx',
    name: 'CAR X',
    nameEn: 'CAR X',
    description: 'معرض وأمزاد CAR X',
    descriptionEn: 'CAR X Showroom & Auctions',
    domains: [
      'localhost:3001',
      'carx.localhost',
      'carx-system-five.vercel.app',
    ],
    logo: '/images/logo/logo-horizontal.png',
    favicon: '/favicon.ico',
    theme: {
      primaryColor: '#000000',
      secondaryColor: '#ff0000',
      accentColor: '#cc0000',
      backgroundColor: '#111111',
      textColor: '#ffffff',
    },
    contact: {
      whatsapp: '+967781007805',
      email: 'info@carx-motors.com',
      phone: '+967781007805',
    },
    settings: {
      currency: 'SAR',
      language: 'ar',
      direction: 'rtl',
    },
  },
};

// Default tenant ID when no match is found
export const DEFAULT_TENANT_ID = 'hmcar';

/**
 * Get the current hostname from the environment
 * Works on both client and server (SSR)
 */
export function getCurrentHostname(): string {
  // Client-side
  if (typeof window !== 'undefined') {
    return window.location.hostname + (window.location.port ? `:${window.location.port}` : '');
  }
  
  // Server-side (SSR) - use environment variables
  // VERCEL_URL is set by Vercel during build and runtime
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL;
  }
  
  // Fallback to environment variable or default
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      return url.hostname + (url.port ? `:${url.port}` : '');
    } catch {
      return appUrl.replace(/^https?:\/\//, '');
    }
  }
  
  return DEFAULT_TENANT_ID;
}

/**
 * Get tenant ID from hostname
 */
export function getTenantIdFromHostname(hostname: string): string {
  // Direct match
  if (TENANT_DOMAIN_MAP[hostname]) {
    return TENANT_DOMAIN_MAP[hostname];
  }
  
  // Check without www prefix
  if (hostname.startsWith('www.')) {
    const withoutWww = hostname.slice(4);
    if (TENANT_DOMAIN_MAP[withoutWww]) {
      return TENANT_DOMAIN_MAP[withoutWww];
    }
  }
  
  // Check with www prefix
  const withWww = `www.${hostname}`;
  if (TENANT_DOMAIN_MAP[withWww]) {
    return TENANT_DOMAIN_MAP[withWww];
  }
  
  // Check for Vercel preview deployments (they have random suffixes)
  // e.g., carx-system-abc123.vercel.app should match carx-system-five.vercel.app pattern
  if (hostname.includes('vercel.app')) {
    // Try to match by extracting a base slug from configured vercel project names
    for (const [domain, tenantId] of Object.entries(TENANT_DOMAIN_MAP)) {
      if (domain.includes('vercel.app')) {
        const configuredProject = domain.split('.vercel.app')[0]; // e.g., "carx-system-five"
        // derive a short slug by taking the first 1-2 dash-separated tokens
        const tokens = configuredProject.split('-').filter(Boolean);
        const shortSlug = tokens.slice(0, Math.min(2, tokens.length)).join('-');
        if (shortSlug && hostname.includes(shortSlug)) {
          return tenantId;
        }
      }
    }
  }
  
  return DEFAULT_TENANT_ID;
}

/**
 * Get tenant configuration by ID
 */
export function getTenantById(tenantId: string): TenantData {
  return TENANT_CONFIGS[tenantId] || TENANT_CONFIGS[DEFAULT_TENANT_ID];
}

/**
 * Get tenant configuration for the current domain
 * This is the main function to use for getting tenant config
 */
export function getTenantConfig(): TenantData {
  // Allow build-time override for SSR or when explicitly set
  if (process.env.NEXT_PUBLIC_TENANT) {
    const envTenant = process.env.NEXT_PUBLIC_TENANT.trim();
    if (envTenant && TENANT_CONFIGS[envTenant]) {
      return getTenantById(envTenant);
    }
  }

  const hostname = getCurrentHostname();
  const tenantId = getTenantIdFromHostname(hostname);
  return getTenantById(tenantId);
}

/**
 * Get tenant configuration for a specific hostname
 * Useful for SSR when you have the hostname from request headers
 */
export function getTenantConfigForHostname(hostname: string): TenantData {
  const tenantId = getTenantIdFromHostname(hostname);
  return getTenantById(tenantId);
}

/**
 * Get API base URL for the current tenant
 */
export function getTenantApiUrl(): string {
  // In production, use relative URL (Vercel routing handles it)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '';
  }
  
  // For local development or SSR, use the environment variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
}

/**
 * Check if current tenant is a specific tenant
 */
export function isTenant(tenantId: string): boolean {
  const config = getTenantConfig();
  return config.id === tenantId;
}

/**
 * Get all available tenants
 */
export function getAllTenants(): TenantData[] {
  return Object.values(TENANT_CONFIGS);
}

/**
 * Get all domains for a specific tenant
 */
export function getTenantDomains(tenantId: string): string[] {
  return TENANT_CONFIGS[tenantId]?.domains || [];
}
