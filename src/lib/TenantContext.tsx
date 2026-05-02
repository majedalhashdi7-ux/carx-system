'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TenantContextType {
  tenant: {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
    };
    contact: {
      whatsapp: string;
      email: string;
      phone: string;
    };
    settings: {
      currency: string;
      language: string;
      direction: string;
    };
  };
  isLoading: boolean;
}

const defaultTenant = {
  id: 'carx',
  name: 'CAR X',
  nameEn: 'CAR X',
  description: 'نظام معارض ومزادات السيارات',
  descriptionEn: 'Car Showroom & Auction System',
  theme: {
    primaryColor: '#ef4444',
    secondaryColor: '#f59e0b',
    accentColor: '#8b5cf6',
    backgroundColor: '#000000',
    textColor: '#ffffff'
  },
  contact: {
    whatsapp: '+967781007805',
    email: 'info@carx-system.com',
    phone: '+967781007805'
  },
  settings: {
    currency: 'SAR',
    language: 'ar',
    direction: 'rtl'
  }
};

const TenantContext = createContext<TenantContextType>({
  tenant: defaultTenant,
  isLoading: false
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState(defaultTenant);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // For CAR X system, we use the default tenant
    // In a multi-tenant system, this would fetch tenant data based on domain
    setTenant(defaultTenant);
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}