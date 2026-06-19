'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Car, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

export default function SearchSection() {
    const { t, isRTL, lang } = useLanguage();
    const [brands, setBrands] = useState<any[]>([]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const res = await api.brands.list();
                if (res?.data?.brands) {
                    setBrands(res.data.brands);
                }
            } catch (err) {
                console.error("Failed to fetch brands", err);
            }
        };
        fetchBrands();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.2 }}
            className="w-full max-w-6xl mt-12 px-6"
        >
            <div className="obsidian-card p-2 md:p-4 bg-black/40 backdrop-blur-[60px] border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                <form action="/search" method="GET" className="flex flex-col lg:flex-row gap-3">

                    {/* Keyword Search */}
                    <div className="lg:flex-[2] relative group">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-luxury-gold transition-all duration-500",
                            isRTL ? "right-8" : "left-8"
                        )} />
                        <input
                            type="text"
                            name="q"
                            placeholder={t('searchPlaceholder')}
                            className={cn(
                                "w-full bg-white/[0.03] border border-white/5 rounded-3xl py-5 text-sm text-white focus:outline-none focus:border-luxury-gold/30 focus:bg-white/[0.06] transition-all duration-500 placeholder:text-white/20 font-bold tracking-tight",
                                isRTL ? "pr-16 pl-8" : "pl-16 pr-8"
                            )}
                        />
                    </div>

                    {/* Brand Select */}
                    <div className="flex-1 relative group">
                        <Car className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-luxury-gold transition-all duration-500",
                            isRTL ? "right-8" : "left-8"
                        )} />
                        <select
                            name="brand"
                            className={cn(
                                "w-full appearance-none bg-white/[0.03] border border-white/5 rounded-3xl py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 focus:outline-none focus:border-luxury-gold/30 focus:bg-white/[0.06] transition-all duration-500 cursor-pointer",
                                isRTL ? "pr-16 pl-12 text-right" : "pl-16 pr-12 text-left"
                            )}
                        >
                            <option value="" className="bg-black">{t('allBrands')}</option>
                            {brands.map(b => (
                                <option key={b.id || b._id} value={b.slug || b.name.toLowerCase()} className="bg-black">
                                    {lang.toLowerCase() === 'ar' && b.nameAr ? b.nameAr : b.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* نطاق السعر (Price Range) - مخفي حالياً */}
                    <div className="flex-1 relative group hidden">
                        <Banknote className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-luxury-gold transition-all duration-500",
                            isRTL ? "right-8" : "left-8"
                        )} />
                        <select
                            name="price"
                            className={cn(
                                "w-full appearance-none bg-white/[0.03] border border-white/5 rounded-3xl py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white/50 focus:outline-none focus:border-luxury-gold/30 focus:bg-white/[0.06] transition-all duration-500 cursor-pointer",
                                isRTL ? "pr-16 pl-12 text-right" : "pl-16 pr-12 text-left"
                            )}
                        >
                            <option value="" className="bg-black text-white/50">{t('priceRange')}</option>
                            <option value="0-100k" className="bg-black">UNDER 100K SAR</option>
                            <option value="100-500k" className="bg-black">100K - 500K SAR</option>
                            <option value="500k+" className="bg-black">ELITE (500K+)</option>
                        </select>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="px-12 py-5 bg-white text-black font-black text-[10px] uppercase tracking-[0.4em] rounded-3xl hover:bg-luxury-gold transition-all duration-500 shadow-2xl shrink-0"
                    >
                        {t('searchBtn')}
                    </motion.button>

                </form>
            </div>

            {/* Matrix Quick Filters (hidden) */}
            <div className="hidden" />
        </motion.div>
    );
}
