'use client';

import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  currency: {
    usdToSar: number;
    usdToKrw: number;
  };
  socialLinks: {
    whatsapp: string;
    email: string;
  };
  formatPrice: (price: number) => string;
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrency] = useState('SAR');

  const currency = {
    usdToSar: 3.75,
    usdToKrw: 1300,
  };

  const socialLinks = {
    whatsapp: '+967781007805',
    email: 'dawoodalhash@gmail.com',
  };

  const formatPrice = (price: number): string => {
    switch (displayCurrency) {
      case 'USD':
        return `$${price.toLocaleString()}`;
      case 'KRW':
        return `₩${(price * currency.usdToKrw).toLocaleString()}`;
      case 'SAR':
      default:
        return `${(price * currency.usdToSar).toLocaleString()} ر.س`;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        currency,
        socialLinks,
        formatPrice,
        displayCurrency,
        setDisplayCurrency,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}