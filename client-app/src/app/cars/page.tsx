'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ArrowRight, X, SlidersHorizontal, ArrowLeft, Car
} from "lucide-react";
import Navbar from '@/components/Navbar';
import CarCard from '@/components/CarCard';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const rawText = (value: string) => value;

interface CarModel {
    id?: string;
    _id?: string;
    title: string;
    make: string | { name: string };
    year: number;
    price: number;
    priceSar?: number;
    priceUsd?: number;
    mileage: number;
    fuel: string;
    images: string[];
}

interface BrandModel {
    id: string;
    name: string;
    logoUrl?: string;
}

export default function CarsBrowserPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cinematic-darker text-white flex items-center justify-center font-black uppercase tracking-[0.5em] italic animate-pulse">{rawText('Syncing Machinery...')}</div>}>
            <CarsContent />
        </Suspense>
    );
}

function CarsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();

    const [cars, setCars] = useState<CarModel[]>([]);
    const [brands, setBrands] = useState<BrandModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

    // Filters state
    const [q, setQ] = useState(searchParams.get('q') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
    const [showFilters, setShowFilters] = useState(false);

    const fetchCars = useCallback(async (isInitial = false) => {
        setLoading(true);
        try {
            let minPrice = undefined;
            let maxPrice = undefined;
            if (priceRange === '0-100k') { maxPrice = 100000; }
            else if (priceRange === '100-500k') { minPrice = 100000; maxPrice = 500000; }
            else if (priceRange === '500k+') { minPrice = 500000; }

            const listParams: Record<string, string | number | boolean> = {
                page: isInitial ? 1 : page,
                limit: 12,
                search: q,
                make: brand,
                source: 'hm_local',
            };

            if (minPrice !== undefined) listParams.minPrice = minPrice.toString();
            if (maxPrice !== undefined) listParams.maxPrice = maxPrice.toString();

            const res = await api.cars.list(listParams);

            if (res.success) {
                setCars(res.data.cars || []);
                setTotalPages(res.data.pagination?.pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch cars", err);
        } finally {
            setLoading(false);
        }
    }, [page, q, brand, priceRange]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                // [[ARABIC_COMMENT]] جلب الوكالات المخصصة للمعرض المحلي
                const res = await api.brands.list('cars', { targetShowroom: 'hm_local' });
                if (res.success) setBrands(res.brands || []);
            } catch (err) {
                console.error("Failed to fetch brands", err);
            }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQ(e.target.value);
        setPage(1);
    };

    const clearFilters = () => {
        setQ('');
        setBrand('');
        setPriceRange('');
        setPage(1);
    };

    const priceRanges = [
        { id: rawText('0-100k'), label: isRTL ? rawText('تحت ١٠٠ ألف') : rawText('< 100K') },
        { id: rawText('100-500k'), label: isRTL ? rawText('١٠٠ - ٥٠٠ ألف') : rawText('100K - 500K') },
        { id: rawText('500k+'), label: isRTL ? rawText('فوق ٥٠٠ ألف') : rawText('> 500K') },
    ];

    return (
        <div className={cn("min-h-screen bg-cinematic-darker text-white selection:bg-luxury-gold selection:text-black", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-200 bg-linear-to-b from-luxury-gold/5 via-transparent to-transparent opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[6rem_6rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <main className="relative z-10 max-w-400 mx-auto px-6 pt-32 pb-24">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16 relative">
                    {/* Back Button */}
                    <motion.div 
                        initial={{ opacity: 0, x: isRTL ? -10 : 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className={cn("absolute top-0 hidden md:block", isRTL ? "right-0" : "left-0")}
                    >
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
                            title={isRTL ? rawText('رجوع') : rawText('Back')}
                        >
                            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                        </button>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                        <div className="flex items-center gap-3 text-luxury-gold mb-4 bg-luxury-gold/10 px-6 py-2 rounded-full border border-luxury-gold/20">
                            <Car className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isRTL ? rawText('المعرض المحلي') : rawText('LOCAL SHOWROOM')}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest leading-tight mb-4 font-display">
                            {isRTL ? rawText('اختر') : rawText('CHOOSE')} <span className="text-luxury-gold">{isRTL ? rawText('الوكالة') : rawText('AGENCY')}</span>
                        </h1>
                    </motion.div>

                     <div className={cn("md:hidden mb-4 w-full flex", isRTL ? "justify-end" : "justify-start")}>
                          <button
                             onClick={() => router.back()}
                             title={isRTL ? rawText('رجوع') : rawText('Back')}
                             className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
                         >
                             <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                         </button>
                     </div>
                </div>

                {/* Filter / Stats Bar (REMOVED CURRENCY AND COUNT AS REQUESTED) */}
                <div className="flex flex-col items-center mb-16">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-2 flex items-center gap-4 backdrop-blur-3xl">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">{isRTL ? rawText('المعرض الرقمي') : rawText('DIGITAL CATALOG')}</span>
                            <div className="w-px h-6 bg-white/10" />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                                    showFilters ? "bg-luxury-gold text-black" : "text-white/40 hover:text-white"
                                )}
                                title={isRTL ? rawText('البحث المتقدم') : rawText('Advanced Search')}
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span>{isRTL ? rawText('بحث') : rawText('FIND')}</span>
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Brands Grid (NEW CIRCLE DESIGN - 2 PER ROW ON MOBILE) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-32"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-6">
                        {/* All Makes Circle */}
                        <div className="group flex flex-col items-center gap-4">
                            <button
                                onClick={() => { setBrand(''); setPage(1); }}
                                title={isRTL ? rawText('الكل') : rawText('All Brands')}
                                className={cn(
                                    "w-32 h-32 md:w-40 md:h-40 rounded-full border flex items-center justify-center transition-all duration-500 relative overflow-hidden group/btn shadow-2xl",
                                    brand === '' 
                                        ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_50px_rgba(197,160,89,0.2)] scale-110" 
                                        : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40 hover:bg-luxury-gold/5 hover:scale-105"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 flex items-center justify-center transition-all",
                                    brand === '' ? "text-luxury-gold" : "text-white/20 group-hover/btn:text-luxury-gold"
                                )}>
                                    <SlidersHorizontal className="w-8 h-8" />
                                </div>
                            </button>
                            <span className={cn(
                                "text-[12px] font-black uppercase tracking-[0.2em] transition-colors text-center",
                                brand === '' ? "text-luxury-gold" : "text-white/40 group-hover:text-white"
                            )}>
                                {isRTL ? rawText('الكل') : rawText('ALL')}
                            </span>
                        </div>

                        {loading && brands.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="w-[100px] h-[120px] rounded-[2rem] bg-white/3 border border-white/5 animate-pulse" />
                            ))
                        ) : (
                            brands.map((b: any) => (
                                <div key={b._id || b.id || b.name} className="group flex flex-col items-center gap-4">
                                    <button
                                        onClick={() => { setBrand(b.name); setPage(1); }}
                                        title={b.name}
                                        className={cn(
                                            "w-32 h-32 md:w-40 md:h-40 rounded-full border flex items-center justify-center transition-all duration-500 relative overflow-hidden group/btn shadow-2xl",
                                            brand === b.name
                                                ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_50px_rgba(197,160,89,0.2)] scale-110"
                                                : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40 hover:bg-luxury-gold/5 hover:scale-105"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-16 h-16 relative z-10 transition-all duration-500",
                                            brand === b.name ? "scale-110" : "group-hover/btn:scale-110"
                                        )}>
                                            {b.logoUrl ? (
                                                <Image 
                                                    src={b.logoUrl} alt={b.name} fill 
                                                    className={cn("object-contain transition-all duration-500", brand === b.name ? "" : "brightness-0 invert opacity-40 group-hover/btn:opacity-100 group-hover/btn:brightness-100")} 
                                                />
                                            ) : (
                                                <Car className={cn("w-10 h-10", brand === b.name ? "text-luxury-gold" : "text-white/20")} />
                                            )}
                                        </div>
                                    </button>
                                    <span className={cn(
                                        "text-[12px] font-black uppercase tracking-[0.2em] transition-colors text-center",
                                        brand === b.name ? "text-luxury-gold" : "text-white/40 group-hover:text-white"
                                    )}>
                                        {b.name}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Search & Mobile Filter Bar */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="bg-white/3 border border-white/10 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Search */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('بحث نصي') : rawText('TEXT SEARCH')}</label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 text-white/20" />
                                        <input
                                            type="text" value={q} onChange={handleSearchChange}
                                            placeholder={isRTL ? rawText('اسم السيارة...') : rawText('Car name...')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-luxury-gold/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Agency */}
                                <div className="space-y-4">
                                    <label htmlFor="agency-select" className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('الوكالة (الماركة)') : rawText('AGENCY (MAKE)')}</label>
                                    <select
                                        id="agency-select"
                                        title={isRTL ? rawText('اختر الوكالة') : rawText('Select Agency')}
                                        value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold outline-none focus:border-luxury-gold/50 appearance-none"
                                    >
                                        <option value="">{isRTL ? rawText('كل الماركات') : rawText('ALL MAKES')}</option>
                                        {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>

                                {/* Price Range */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('النطاق السعري') : rawText('PRICE SPECTRUM')}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {priceRanges.map(r => (
                                            <button
                                                key={r.id} onClick={() => { setPriceRange(priceRange === r.id ? '' : r.id); setPage(1); }}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    priceRange === r.id ? "bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30" : "bg-white/5 text-white/40 border border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        {isRTL ? rawText('تصفير الفلاتر') : rawText('CLEAR SETTINGS')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid */}
                {loading && page === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="aspect-4/5 rounded-[2.5rem] bg-white/2 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : cars.length === 0 ? (
                    <div className="py-48 text-center bg-white/1 border border-dashed border-white/10 rounded-[3rem]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                            <Car className="w-10 h-10 text-white/10" />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{isRTL ? rawText('لا توجد نتائج') : rawText('OFF-LINE')}</h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">{isRTL ? rawText('جرب تعديل خيارات البحث') : rawText('RECONFIGURE SEARCH PARAMETERS')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                            {cars.map((car, i) => (
                                <CarCard
                                    key={String(car.id || car._id || `car-${i}`)}
                                    car={car}
                                    index={i}
                                    onClick={() => {
                                        if (!isLoggedIn) router.push('/login');
                                        else router.push(`/cars/${car.id || car._id}`);
                                    }}
                                    onLoginRequired={() => router.push('/login')}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-24 flex items-center justify-center gap-12">
                                <button
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === 1}
                                    className="px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-3"
                                >
                                    <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                    {isRTL ? rawText('السابق') : rawText('PREVIOUS')}
                                </button>
                                <div className="flex items-center gap-4 text-xs font-black italic">
                                    <span className="text-luxury-gold">{page}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-white/40">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === totalPages}
                                    className="px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-3"
                                >
                                    {isRTL ? rawText('التالي') : rawText('NEXT')}
                                    <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                </button>
                            </div>
                        )}
                    </>
                )}

            </main>
        </div>
    );
}
