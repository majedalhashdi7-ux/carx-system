'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Coins } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';

interface CurrencySwitcherProps {
  variant?: 'default' | 'minimal';
  className?: string;
}

export default function CurrencySwitcher({ variant = 'default', className = '' }: CurrencySwitcherProps) {
  const { displayCurrency, setDisplayCurrency } = useSettings() as any;

  const currencies = [
    { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
    { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
    { code: 'KRW', symbol: '₩', name: 'وون كوري' }
  ];

  const currentCurrency = currencies.find(c => c.code === displayCurrency) || currencies[0];

  const handleCurrencyChange = () => {
    const currentIndex = currencies.findIndex(c => c.code === displayCurrency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setDisplayCurrency?.(currencies[nextIndex].code);
  };

  if (variant === 'minimal') {
    return (
      <motion.button
        onClick={handleCurrencyChange}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl text-sm font-bold text-white transition-all ${className}`}
      >
        <Coins className="w-4 h-4" />
        <span>{currentCurrency.code}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleCurrencyChange}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 rounded-2xl transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
        <DollarSign className="w-4 h-4 text-blue-400" />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-white">{currentCurrency.code}</p>
        <p className="text-xs text-white/60">{currentCurrency.name}</p>
      </div>
    </motion.button>
  );
}