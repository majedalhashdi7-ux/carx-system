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

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-24">

                {/* Top Banner Block - سيارات كورية مستوردة */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-luxury-gold/15 via-luxury-gold/5 to-transparent border border-luxury-gold/20 p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl text-center md:text-right">
                        <h2 className="text-2xl md:text-3xl font-black text-luxury-gold tracking-wide">
                            {isRTL ? "سيارات كورية مستوردة" : "Imported Korean Cars"}
                        </h2>
                        <p className="text-xs text-white/60 leading-relaxed">
                            {isRTL 
                                ? "الأسعار المعروضة هي السعر الفعلي للسيارة. وتبقى رسوم إضافية (شحن وجمارك). استخدم حاسبة الاستيراد لمعرفة التكلفة الكاملة." 
                                : "Prices shown are the actual car prices. Additional fees (shipping & customs) apply. Use the import calculator for full cost."}
                        </p>
                        <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/25 px-4 py-1.5 rounded-full">
                            <span className="text-[10px] font-black text-luxury-gold tracking-wider">
                                {isRTL ? "5,500 أضيفت اليوم" : "5,500 Added Today"}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-2">
                        <Image src="/images/hmcar.jpg" alt="Korean Cars" width={180} height={100} className="object-cover rounded-xl" />
                    </div>
                </div>

                {/* Brands Grid (Circle Design Selector) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center">
                        {/* All Makes Circle */}
                        <div className="group flex flex-col items-center gap-2">
                            <button
                                onClick={() => { setBrand(''); setPage(1); }}
                                title={isRTL ? rawText('الكل') : rawText('All Brands')}
                                className={cn(
                                    "w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center transition-all duration-300 relative overflow-hidden group/btn shadow-lg",
                                    brand === '' 
                                        ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_20px_rgba(197,160,89,0.2)] scale-105" 
                                        : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40 hover:bg-luxury-gold/5"
                                )}
                            >
                                <SlidersHorizontal className={cn("w-5 h-5 transition-all", brand === '' ? "text-luxury-gold" : "text-white/20 group-hover/btn:text-luxury-gold")} />
                            </button>
                            <span className={cn("text-[9px] font-black uppercase tracking-wider transition-colors text-center", brand === '' ? "text-luxury-gold" : "text-white/40 group-hover:text-white")}>
                                {isRTL ? rawText('الكل') : rawText('ALL')}
                            </span>
                        </div>

                        {loading && brands.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/3 border border-white/5 animate-pulse" />
                            ))
                        ) : (
                            brands.map((b: any) => (
                                <div key={b._id || b.id || b.name} className="group flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => { setBrand(b.name); setPage(1); }}
                                        title={b.name}
                                        className={cn(
                                            "w-16 h-16 sm:w-20 sm:h-20 rounded-full border flex items-center justify-center transition-all duration-300 relative overflow-hidden group/btn shadow-lg",
                                            brand === b.name
                                                ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_20px_rgba(197,160,89,0.2)] scale-105"
                                                : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40 hover:bg-luxury-gold/5"
                                        )}
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 relative z-10">
                                            {b.logoUrl ? (
                                                <Image 
                                                    src={b.logoUrl} alt={b.name} fill 
                                                    className={cn("object-contain transition-all duration-300", brand === b.name ? "" : "brightness-0 invert opacity-45 group-hover/btn:opacity-100 group-hover/btn:brightness-100")} 
                                                />
                                            ) : (
                                                <Car className={cn("w-6 h-6", brand === b.name ? "text-luxury-gold" : "text-white/20")} />
                                            )}
                                        </div>
                                    </button>
                                    <span className={cn("text-[9px] font-black uppercase tracking-wider transition-colors text-center truncate w-16", brand === b.name ? "text-luxury-gold" : "text-white/40 group-hover:text-white")}>
                                        {b.name}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Main Content Split: Sidebar Filters on desktop, Cars listing next to it */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Desktop Sidebar Filters */}
                    <div className="hidden lg:block w-72 shrink-0 bg-white/3 border border-white/10 rounded-3xl p-6 space-y-6 sticky top-24 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                {isRTL ? "فلاتر البحث" : "Search Filters"}
                            </h3>
                            <button onClick={clearFilters} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors">
                                {isRTL ? "مسح الكل" : "Clear All"}
                            </button>
                        </div>
                        
                        {/* Search Input */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "ابحث بالاسم" : "Search Name"}</label>
                            <div className="relative">
                                <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-white/30" />
                                <input
                                    type="text" value={q} onChange={handleSearchChange}
                                    placeholder={isRTL ? "ابحث بالاسم..." : "Search..."}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-xs font-bold outline-none focus:border-luxury-gold/50 transition-all text-white"
                                />
                            </div>
                        </div>

                        {/* Brand/Make selector */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "الشركة المصنعة" : "Manufacturer"}</label>
                            <select
                                value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white"
                            >
                                <option value="">{isRTL ? "كل الشركات" : "All Manufacturers"}</option>
                                {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* Price Range selector */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "النطاق السعري" : "Price Spectrum"}</label>
                            <select
                                value={priceRange} onChange={e => { setPriceRange(e.target.value); setPage(1); }}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white"
                            >
                                <option value="">{isRTL ? "كل الأسعار" : "All Prices"}</option>
                                {priceRanges.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                        </div>

                        {/* Damage Type filter */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "استبعاد حسب نوع الضرر" : "Filter by Damage"}</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white"
                            >
                                <option value="">{isRTL ? "بدون استبعاد" : "No Exclusion"}</option>
                                <option value="none">{isRTL ? "سليم بدون صدمات" : "No Accidents"}</option>
                            </select>
                        </div>

                        <button
                            onClick={() => fetchCars()}
                            className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-gold/95 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_10px_20px_rgba(212,175,55,0.15)]"
                        >
                            {isRTL ? "عرض النتائج" : "Show Results"}
                        </button>
                    </div>

                    {/* Cars Listing Area */}
                    <div className="flex-1 w-full">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-6">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-luxury-gold"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                {isRTL ? "تصفية النتائج" : "Filter Results"}
                            </button>
                        </div>

                        {/* Search & Mobile Filter Bar */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-12 lg:hidden"
                                >
                                    <div className="bg-white/3 border border-white/10 rounded-3xl p-6 grid grid-cols-1 gap-6">
                                        {/* Mobile search & selects */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('بحث نصي') : rawText('TEXT SEARCH')}</label>
                                            <input
                                                type="text" value={q} onChange={handleSearchChange}
                                                placeholder={isRTL ? rawText('اسم السيارة...') : rawText('Car name...')}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-luxury-gold/50"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('الوكالة') : rawText('AGENCY')}</label>
                                            <select
                                                value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-luxury-gold/50"
                                            >
                                                <option value="">{isRTL ? rawText('كل الماركات') : rawText('ALL MAKES')}</option>
                                                {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('النطاق السعري') : rawText('PRICE RANGE')}</label>
                                            <select
                                                value={priceRange} onChange={e => { setPriceRange(e.target.value); setPage(1); }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-luxury-gold/50"
                                            >
                                                <option value="">{isRTL ? rawText('كل الأسعار') : rawText('ALL PRICES')}</option>
                                                {priceRanges.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                            </select>
                                        </div>

                                        <button onClick={clearFilters} className="w-full py-3 text-xs font-black uppercase text-red-400 hover:text-red-300">
                                            {isRTL ? rawText('تصفير الفلاتر') : rawText('CLEAR SETTINGS')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Grid */}
                        {loading && page === 1 ? (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="aspect-4/5 rounded-[2.5rem] bg-white/2 border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : cars.length === 0 ? (
                            <div className="py-24 text-center bg-white/1 border border-dashed border-white/10 rounded-[3rem]">
                                <Car className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                <h2 className="text-xl font-black uppercase italic tracking-tighter mb-2">{isRTL ? rawText('لا توجد نتائج') : rawText('OFF-LINE')}</h2>
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">{isRTL ? rawText('جرب تعديل خيارات البحث') : rawText('RECONFIGURE SEARCH PARAMETERS')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
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
                                    <div className="mt-16 flex items-center justify-center gap-6">
                                        <button
                                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === 1}
                                            className="px-4 py-2.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2"
                                        >
                                            <ArrowLeft className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                                            {isRTL ? rawText('السابق') : rawText('PREVIOUS')}
                                        </button>
                                        <div className="flex items-center gap-3 text-[10px] font-black italic">
                                            <span className="text-luxury-gold">{page}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20" />
                                            <span className="text-white/40">{totalPages}</span>
                                        </div>
                                        <button
                                            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === totalPages}
                                            className="px-4 py-2.5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2"
                                        >
                                            {isRTL ? rawText('التالي') : rawText('NEXT')}
                                            <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
