'use client';

/**
 * CurrencyContext - نظام العملات المتقدم
 * تحويل تلقائي بين العملات مع تحديث الأسعار
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'SAR' | 'USD' | 'KRW' | 'EUR' | 'AED';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  nameAr: string;
  flag: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  SAR: { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', nameAr: 'ريال سعودي', flag: '🇸🇦' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي', flag: '🇺🇸' },
  KRW: { code: 'KRW', symbol: '₩', name: 'Korean Won', nameAr: 'وون كوري', flag: '🇰🇷' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', nameAr: 'يورو', flag: '🇪🇺' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', nameAr: 'درهم إماراتي', flag: '🇦🇪' },
};

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: Currency;
  currencyInfo: CurrencyInfo;
  rates: ExchangeRates;
  setCurrency: (currency: Currency) => void;
  convert: (amount: number, from: Currency, to?: Currency) => number;
  format: (amount: number, from?: Currency) => string;
  updateRates: () => Promise<void>;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// أسعار الصرف الافتراضية (بالنسبة للريال السعودي)
const DEFAULT_RATES: ExchangeRates = {
  SAR: 1,
  USD: 0.27,    // 1 SAR = 0.27 USD
  KRW: 350,     // 1 SAR = 350 KRW
  EUR: 0.24,    // 1 SAR = 0.24 EUR
  AED: 0.98,    // 1 SAR = 0.98 AED
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('SAR');
  const [rates, setRates] = useState<ExchangeRates>(DEFAULT_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // تحميل العملة المحفوظة
  useEffect(() => {
    const savedCurrency = localStorage.getItem('carx-currency') as Currency;
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }

    // تحميل أسعار الصرف المحفوظة
    const savedRates = localStorage.getItem('carx-exchange-rates');
    const savedDate = localStorage.getItem('carx-rates-updated');
    
    if (savedRates && savedDate) {
      try {
        setRates(JSON.parse(savedRates));
        setLastUpdated(new Date(savedDate));
      } catch (error) {
        console.error('فشل تحميل أسعار الصرف:', error);
      }
    }
  }, []);

  // تحديث أسعار الصرف
  const updateRates = async () => {
    try {
      // في الواقع، يجب استخدام API حقيقي مثل:
      // https://api.exchangerate-api.com/v4/latest/SAR
      
      const response = await fetch('/api/exchange-rates');
      const data = await response.json();

      if (data.success && data.rates) {
        setRates(data.rates);
        setLastUpdated(new Date());
        
        // حفظ في localStorage
        localStorage.setItem('carx-exchange-rates', JSON.stringify(data.rates));
        localStorage.setItem('carx-rates-updated', new Date().toISOString());
      }
    } catch (error) {
      console.error('فشل تحديث أسعار الصرف:', error);
      // استخدام الأسعار الافتراضية
      setRates(DEFAULT_RATES);
    }
  };

  // تحديث الأسعار تلقائياً عند التحميل
  useEffect(() => {
    // تحديث إذا مر أكثر من ساعة
    const shouldUpdate = !lastUpdated || 
      (new Date().getTime() - lastUpdated.getTime()) > 3600000;

    if (shouldUpdate) {
      updateRates();
    }
  }, []);

  // تغيير العملة
  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('carx-currency', newCurrency);
  };

  // تحويل المبلغ
  const convert = (amount: number, from: Currency, to?: Currency): number => {
    const targetCurrency = to || currency;
    
    if (from === targetCurrency) return amount;

    // تحويل إلى SAR أولاً
    const amountInSAR = amount / rates[from];
    
    // ثم تحويل إلى العملة المستهدفة
    return amountInSAR * rates[targetCurrency];
  };

  // تنسيق المبلغ
  const format = (amount: number, from: Currency = 'SAR'): string => {
    const converted = convert(amount, from);
    const info = CURRENCIES[currency];
    
    return `${converted.toLocaleString('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })} ${info.symbol}`;
  };

  const value: CurrencyContextType = {
    currency,
    currencyInfo: CURRENCIES[currency],
    rates,
    setCurrency,
    convert,
    format,
    updateRates,
    lastUpdated,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
