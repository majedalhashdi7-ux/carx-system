'use client';

/**
 * SearchAutocomplete — مكون البحث الذكي بالاقتراحات الفورية
 * يقبل قائمة items من الخارج، ويعرض اقتراحات فورية أثناء الكتابة
 * يدعم تمييز النص المطابق بلون مختلف
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
    id: string;
    label: string;       // النص الرئيسي
    sublabel?: string;   // نص ثانوي (مثل: نوع الماركة، السنة...)
    icon?: string;       // رابط صورة/أيقونة اختياري
    value?: string;      // القيمة المُعادة عند الاختيار (افتراضي: label)
}

interface SearchAutocompleteProps {
    placeholder?: string;
    suggestions: SearchSuggestion[];
    value: string;
    onChange: (value: string) => void;
    onSelect?: (item: SearchSuggestion) => void;
    className?: string;
    inputClassName?: string;
    dropdownClassName?: string;
    isRTL?: boolean;
    maxSuggestions?: number;
    clearable?: boolean;
    autoFocus?: boolean;
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part)
            ? <mark key={i} className="bg-[#C9A96E]/30 text-[#C9A96E] rounded px-0.5 not-italic font-black">{part}</mark>
            : <span key={i}>{part}</span>
    );
}

export default function SearchAutocomplete({
    placeholder = 'ابحث...',
    suggestions,
    value,
    onChange,
    onSelect,
    className,
    inputClassName,
    dropdownClassName,
    isRTL = false,
    maxSuggestions = 8,
    clearable = true,
    autoFocus = false,
}: SearchAutocompleteProps) {
    const [focused, setFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // فلترة الاقتراحات بناءً على النص المُدخل
    const filtered = value.trim().length === 0
        ? []
        : suggestions
            .filter(s => {
                const q = value.toLowerCase().trim();
                return (
                    s.label.toLowerCase().includes(q) ||
                    (s.sublabel?.toLowerCase().includes(q)) ||
                    (s.value?.toLowerCase().includes(q))
                );
            })
            .slice(0, maxSuggestions);

    const showDropdown = focused && filtered.length > 0;

    // إغلاق عند الضغط خارج المكوّن
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setFocused(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelect = (item: SearchSuggestion) => {
        onChange(item.label);
        onSelect?.(item);
        setFocused(false);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(filtered[activeIndex]);
        } else if (e.key === 'Escape') {
            setFocused(false);
            setActiveIndex(-1);
        }
    };

    // تمرير الاقتراح المحدد إلى العرض
    useEffect(() => {
        if (activeIndex >= 0 && dropdownRef.current) {
            const items = dropdownRef.current.querySelectorAll('[data-suggestion-item]');
            items[activeIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [activeIndex]);

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* حقل الإدخال */}
            <div className={cn(
                'relative flex items-center gap-2 bg-white/5 border rounded-2xl px-4 py-3 transition-all duration-300',
                focused
                    ? 'border-[#C9A96E]/60 bg-white/8 shadow-[0_0_0_3px_rgba(201,169,110,0.12)]'
                    : 'border-white/10 hover:border-white/20',
                inputClassName
            )}>
                <Search className={cn(
                    'w-4 h-4 flex-shrink-0 transition-colors',
                    focused ? 'text-[#C9A96E]' : 'text-white/30'
                )} />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={e => { onChange(e.target.value); setActiveIndex(-1); }}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/25 min-w-0"
                />
                {/* زر المسح */}
                {clearable && value && (
                    <button
                        onClick={() => { onChange(''); inputRef.current?.focus(); }}
                        className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* قائمة الاقتراحات */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                        className={cn(
                            'absolute top-full mt-2 left-0 right-0 z-[500]',
                            'bg-[#10101e]/98 backdrop-blur-3xl border border-white/10 rounded-2xl',
                            'shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden',
                            dropdownClassName
                        )}
                        style={{ maxHeight: '320px', overflowY: 'auto' }}
                    >
                        <div className="p-2">
                            {filtered.map((item, index) => (
                                <motion.button
                                    key={item.id}
                                    data-suggestion-item
                                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                                        activeIndex === index
                                            ? 'bg-[#C9A96E]/15 text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                    )}
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                >
                                    {/* صورة/شعار */}
                                    {item.icon && (
                                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.icon}
                                                alt={item.label}
                                                className="w-full h-full object-contain"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                    {/* النص */}
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="font-bold text-[13px] leading-tight truncate max-w-full">
                                            {highlightMatch(item.label, value)}
                                        </span>
                                        {item.sublabel && (
                                            <span className="text-[10px] text-white/30 mt-0.5 truncate max-w-full">
                                                {item.sublabel}
                                            </span>
                                        )}
                                    </div>
                                    {/* مؤشر التحديد */}
                                    {activeIndex === index && (
                                        <div className="ml-auto mr-auto flex-shrink-0 w-1 h-5 bg-[#C9A96E] rounded-full" />
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* عدد النتائج */}
                        <div className="px-4 py-2 border-t border-white/5 text-[9px] text-white/20 font-black uppercase tracking-widest">
                            {filtered.length} {isRTL ? 'نتيجة' : 'results'}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
