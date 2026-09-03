'use client';

/**
 * @file showroom/page.tsx
 * @description معرض السيارات الكورية المستوردة — Korean Import Showroom
 * يعرض السيارات المستوردة من كوريا (listingType: showroom) بتصميم مميز
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api-original';
import { Ship, Car, ArrowLeft, SlidersHorizontal, Fuel, Gauge } from 'lucide-react';

function CarSkeleton() {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-video bg-white/5" />
            <div className="p-4 space-y-3">
                <div className="h-5 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/4 rounded w-1/2" />
                <div className="h-8 bg-white/5 rounded w-full mt-2" />
            </div>
        </div>
    );
}

export default function ShowroomPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();

    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [makeFilter, setMakeFilter] = useState('');
    const [makes, setMakes] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const LIMIT = 18;

    const loadCars = useCallback(async (p = 1, make = '') => {
        setLoading(true);
        try {
            const params: any = { listingType: 'showroom', limit: LIMIT, page: p };
            if (make) params.make = make;
            const res = await api.cars.list(params);
            const data = res?.data || res?.cars || [];
            setCars(p === 1 ? data : prev => [...prev, ...data]);
            setTotal(res?.total || data.length);
        } catch (err) {
            console.error('Showroom load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCars(1, makeFilter);
        setPage(1);
    }, [loadCars, makeFilter]);

    // جلب قائمة الماركات من السيارات الكورية
    useEffect(() => {
        api.cars.list({ listingType: 'showroom', limit: 200 })
            .then((res: any) => {
                const data: any[] = res?.data || res?.cars || [];
                const uniqueMakes = [...new Set(data.map((c: any) => c.make || c.makeAr).filter(Boolean))];
                setMakes(uniqueMakes.sort());
            })
            .catch(() => {});
    }, []);

    const getImage = (car: any) => {
        const imgs = car.images || [];
        const img = imgs[0] || car.imageUrl || '';
        if (!img) return '';
        if (img.includes('encar.com') || img.includes('encar.co.kr') || img.includes('carpicture')) {
            return `/api/v2/image-proxy?url=${encodeURIComponent(img)}`;
        }
        return img;
    };

    const getTitle = (car: any) => {
        const t = isRTL ? (car.titleAr || car.title) : (car.title || car.titleAr);
        return (t || `${car.make || ''} ${car.model || ''} ${car.year || ''}`).trim();
    };

    const hasMore = cars.length < total;

    return (
        <div className="min-h-screen bg-[#080810] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Hero */}
            <div className="pt-24 pb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-3xl rounded-full pointer-events-none" />
                <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 py-10">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
                    >
                        <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
                        <span className="text-sm">{isRTL ? 'رجوع' : 'Back'}</span>
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                    <Ship className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
                                        {isRTL ? 'مستورد من كوريا' : 'IMPORTED FROM KOREA'}
                                    </span>
                                </div>
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase text-white">
                                {isRTL ? 'المعرض الكوري' : 'KOREAN SHOWROOM'}
                                <span className="block text-xs not-italic font-light tracking-[0.4em] text-white/25 mt-2">
                                    {isRTL ? 'سيارات كورية مستوردة بجودة عالية' : 'PREMIUM KOREAN IMPORTED VEHICLES'}
                                </span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {!loading && (
                                <span className="text-sm text-white/30">
                                    {total} {isRTL ? 'سيارة' : 'vehicles'}
                                </span>
                            )}
                            <button
                                onClick={() => setShowFilters(v => !v)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all ${showFilters ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                {isRTL ? 'فلتر' : 'Filter'}
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-2 p-4 bg-white/3 border border-white/8 rounded-2xl">
                                    <button
                                        onClick={() => setMakeFilter('')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!makeFilter ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                    >
                                        {isRTL ? 'الكل' : 'All'}
                                    </button>
                                    {makes.map(make => (
                                        <button
                                            key={make}
                                            onClick={() => setMakeFilter(make === makeFilter ? '' : make)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${makeFilter === make ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                        >
                                            {make}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            {/* Cars Grid */}
            <main className="max-w-7xl mx-auto px-4 pb-28 pt-8">
                {loading && cars.length === 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[...Array(9)].map((_, i) => <CarSkeleton key={i} />)}
                    </div>
                ) : cars.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center">
                        <Car className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-white/20 uppercase tracking-widest mb-2">
                            {isRTL ? 'لا توجد سيارات حالياً' : 'NO VEHICLES AVAILABLE'}
                        </h2>
                        <p className="text-sm text-white/15">
                            {isRTL ? 'سيتم إضافة سيارات جديدة قريباً' : 'New vehicles will be added soon'}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {cars.map((car, idx) => {
                                const img = getImage(car);
                                const title = getTitle(car);
                                const price = car.priceSar ? formatPrice(car.priceSar) : (isRTL ? 'تواصل معنا' : 'Contact us');
                                return (
                                    <motion.div
                                        key={car._id || car.id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        whileHover={{ y: -4 }}
                                        onClick={() => router.push(`/cars/${car._id || car.id}`)}
                                        className="bg-white/[0.02] border border-white/6 rounded-2xl overflow-hidden cursor-pointer group hover:border-blue-500/30 transition-all duration-300"
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                                            {img ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={img}
                                                    alt={title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Car className="w-10 h-10 text-white/10" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2">
                                                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] font-black text-blue-400 uppercase tracking-wider">
                                                    {isRTL ? 'مستورد' : 'IMPORT'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 space-y-2">
                                            <h3 className="text-sm font-black uppercase truncate text-white group-hover:text-blue-300 transition-colors" title={title}>
                                                {title}
                                            </h3>
                                            <div className="flex items-center gap-3 text-[10px] text-white/30">
                                                {car.year && <span>{car.year}</span>}
                                                {car.mileage && (
                                                    <span className="flex items-center gap-1">
                                                        <Gauge className="w-3 h-3" />
                                                        {Number(car.mileage).toLocaleString()} km
                                                    </span>
                                                )}
                                                {car.fuelType && (
                                                    <span className="flex items-center gap-1">
                                                        <Fuel className="w-3 h-3" />
                                                        {isRTL ? car.fuelAr || car.fuelType : car.fuelType}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                                                <span className="text-sm font-black text-[#C9A96E]">{price}</span>
                                                <span className="text-[9px] text-blue-400/70 font-bold uppercase tracking-wider">
                                                    {isRTL ? 'تفاصيل' : 'Details →'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Load More */}
                        {hasMore && (
                            <div className="flex justify-center mt-10">
                                <button
                                    onClick={() => { const next = page + 1; setPage(next); loadCars(next, makeFilter); }}
                                    disabled={loading}
                                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                                >
                                    {loading ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? 'تحميل المزيد' : 'Load More')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
