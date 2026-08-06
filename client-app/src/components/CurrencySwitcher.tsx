'use client';

import { useSettings } from '@/lib/SettingsContext';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CURRENCIES = [
    { key: 'SAR', symbol: 'ر.س', label: 'ريال', labelEn: 'SAR', flag: '🇸🇦' },
    { key: 'USD', symbol: '$',   label: 'دولار', labelEn: 'USD', flag: '🇺🇸' },
    { key: 'KRW', symbol: '₩',  label: 'وون', labelEn: 'KRW', flag: '🇰🇷' },
] as const;

interface CurrencySwitcherProps {
    variant?: 'compact' | 'full' | 'minimal';
    className?: string;
}

export default function CurrencySwitcher({ variant = 'compact', className = '' }: CurrencySwitcherProps) {
    const { displayCurrency, setDisplayCurrency } = useSettings();
    const { isRTL } = useLanguage();
    const [open, setOpen] = useState(false);

    const active = CURRENCIES.find(c => c.key === displayCurrency) || CURRENCIES[0];

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setOpen(p => !p)}
                className={`flex items-center gap-1.5 rounded-xl border transition-all duration-200 font-bold
                    ${open
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10'
                    }
                    ${variant === 'full' ? 'px-3 py-2 text-sm' : 'px-2.5 py-1.5 text-xs'}
                `}
            >
                <span>{active.flag}</span>
                <span>{active.symbol}</span>
                {variant === 'full' && (
                    <span className="text-[10px] opacity-60">{isRTL ? active.label : active.labelEn}</span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`absolute z-50 mt-1.5 rounded-xl bg-[#1a1108] border border-[#3d2c18] shadow-2xl shadow-black/50 overflow-hidden min-w-[130px]
                                ${isRTL ? 'right-0' : 'left-0'}
                            `}
                        >
                            {CURRENCIES.map(curr => (
                                <button
                                    key={curr.key}
                                    onClick={() => { setDisplayCurrency(curr.key as 'SAR' | 'USD' | 'KRW'); setOpen(false); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors
                                        ${curr.key === displayCurrency
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'text-white/70 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <span className="text-base leading-none">{curr.flag}</span>
                                    <span>{curr.symbol}</span>
                                    <span className="text-white/40">{isRTL ? curr.label : curr.labelEn}</span>
                                    {curr.key === displayCurrency && (
                                        <span className="ms-auto text-amber-400 text-[10px]">✓</span>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
