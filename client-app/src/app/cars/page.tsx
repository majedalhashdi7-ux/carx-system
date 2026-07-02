'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ArrowRight, X, SlidersHorizontal, ArrowLeft, Car,
    Bell, BellPlus, CheckCircle, Fuel, Palette, CalendarRange
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

/* ═══ Skeleton card للتحميل ═══ */
function CarSkeletonCard() {
    return (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-white/5" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-white/8 rounded-lg w-3/4" />
                <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                <div className="flex gap-2 pt-1">
                    <div className="h-6 bg-white/5 rounded-full w-16" />
                    <div className="h-6 bg-white/5 rounded-full w-16" />
                </div>
                <div className="h-9 bg-white/8 rounded-xl w-full mt-2" />
            </div>
        </div>
    );
}

export default function CarsBrowserPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-cinematic-darker text-white flex items-center justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-7xl px-4 pt-28">
                    {Array.from({ length: 8 }).map((_, i) => <CarSkeletonCard key={i} />)}
                </div>
            </div>
        }>
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
    const [totalCars, setTotalCars] = useState(0);
    const [page, setPage] = useState(1);
    const [alertSaved, setAlertSaved] = useState(false);

    // ── Filters state ──
    const [q, setQ] = useState(searchParams.get('q') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
    const [yearMin, setYearMin] = useState('');
    const [yearMax, setYearMax] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchCars = useCallback(async (isInitial = false) => {
        setLoading(true);
        try {
            let minPrice: number | undefined;
            let maxPrice: number | undefined;
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

            if (minPrice !== undefined) listParams.minPrice = minPrice;
            if (maxPrice !== undefined) listParams.maxPrice = maxPrice;
            if (yearMin) listParams.yearMin = yearMin;
            if (yearMax) listParams.yearMax = yearMax;
            if (fuelType) listParams.fuelType = fuelType;
            if (colorFilter) listParams.color = colorFilter;

            const res = await api.cars.list(listParams);

            if (res.success) {
                setCars(res.data.cars || []);
                setTotalPages(res.data.pagination?.pages || 1);
                setTotalCars(res.data.pagination?.total || res.data.cars?.length || 0);
            }
        } catch (err) {
            console.error("Failed to fetch cars", err);
        } finally {
            setLoading(false);
        }
    }, [page, q, brand, priceRange, yearMin, yearMax, fuelType, colorFilter]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
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
        setQ(''); setBrand(''); setPriceRange('');
        setYearMin(''); setYearMax(''); setFuelType(''); setColorFilter('');
        setPage(1);
    };

    const saveAsAlert = () => {
        if (!isLoggedIn) { router.push('/login'); return; }
        const alert = { q, brand, priceRange, yearMin, yearMax, fuelType, colorFilter, savedAt: new Date().toISOString() };
        try {
            const existing = JSON.parse(localStorage.getItem('hm_smart_alerts') || '[]');
            existing.unshift(alert);
            localStorage.setItem('hm_smart_alerts', JSON.stringify(existing.slice(0, 10)));
            setAlertSaved(true);
            setTimeout(() => setAlertSaved(false), 3000);
        } catch { }
    };

    const hasActiveFilters = q || brand || priceRange || yearMin || yearMax || fuelType || colorFilter;

    const priceRanges = [
        { id: '0-100k', label: isRTL ? 'تحت ١٠٠ ألف' : '< 100K' },
        { id: '100-500k', label: isRTL ? '١٠٠ - ٥٠٠ ألف' : '100K - 500K' },
        { id: '500k+', label: isRTL ? 'فوق ٥٠٠ ألف' : '> 500K' },
    ];

    const fuelTypes = [
        { id: 'gasoline', label: isRTL ? 'بنزين' : 'Gasoline' },
        { id: 'diesel', label: isRTL ? 'ديزل' : 'Diesel' },
        { id: 'hybrid', label: isRTL ? 'هجين' : 'Hybrid' },
        { id: 'electric', label: isRTL ? 'كهربائي' : 'Electric' },
    ];

    const colors = [
        { id: 'white', label: isRTL ? 'أبيض' : 'White', hex: '#ffffff' },
        { id: 'black', label: isRTL ? 'أسود' : 'Black', hex: '#1a1a1a' },
        { id: 'silver', label: isRTL ? 'فضي' : 'Silver', hex: '#c0c0c0' },
        { id: 'gray', label: isRTL ? 'رمادي' : 'Gray', hex: '#808080' },
        { id: 'red', label: isRTL ? 'أحمر' : 'Red', hex: '#dc2626' },
        { id: 'blue', label: isRTL ? 'أزرق' : 'Blue', hex: '#2563eb' },
        { id: 'green', label: isRTL ? 'أخضر' : 'Green', hex: '#16a34a' },
        { id: 'brown', label: isRTL ? 'بني' : 'Brown', hex: '#92400e' },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

    /* ── مكون الفلتر المشترك للسايدبار والجوال ── */
    const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={cn("space-y-5", mobile ? "p-5" : "")}>
            {/* بحث نصي */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Search className="w-3 h-3" />
                    {isRTL ? "ابحث بالاسم" : "Search Name"}
                </label>
                <div className="relative">
                    <Search className={cn("absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30", isRTL ? "right-3" : "left-3")} />
                    <input
                        type="text" value={q} onChange={handleSearchChange}
                        placeholder={isRTL ? "اسم السيارة..." : "Car name..."}
                        className={cn("w-full bg-black/40 border border-white/10 rounded-xl py-2.5 text-xs font-bold outline-none focus:border-luxury-gold/50 transition-all text-white placeholder:text-white/25", isRTL ? "pr-9 pl-3" : "pl-9 pr-3")}
                    />
                </div>
            </div>

            {/* الشركة المصنعة */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "الشركة المصنعة" : "Manufacturer"}</label>
                <select value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white">
                    <option value="">{isRTL ? "كل الشركات" : "All Manufacturers"}</option>
                    {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
            </div>

            {/* السنة من/إلى */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarRange className="w-3 h-3" />
                    {isRTL ? "السنة" : "Year Range"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <select value={yearMin} onChange={e => { setYearMin(e.target.value); setPage(1); }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white">
                        <option value="">{isRTL ? "من" : "From"}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={yearMax} onChange={e => { setYearMax(e.target.value); setPage(1); }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white">
                        <option value="">{isRTL ? "إلى" : "To"}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* نوع الوقود */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Fuel className="w-3 h-3" />
                    {isRTL ? "نوع الوقود" : "Fuel Type"}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                    {fuelTypes.map(f => (
                        <button key={f.id} onClick={() => { setFuelType(fuelType === f.id ? '' : f.id); setPage(1); }}
                            className={cn("py-2 rounded-lg text-[10px] font-bold border transition-all",
                                fuelType === f.id
                                    ? "bg-luxury-gold/15 border-luxury-gold/50 text-luxury-gold"
                                    : "bg-black/30 border-white/8 text-white/50 hover:border-white/20 hover:text-white/80"
                            )}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* اللون */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />
                    {isRTL ? "اللون" : "Color"}
                </label>
                <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                        <button key={c.id} onClick={() => { setColorFilter(colorFilter === c.id ? '' : c.id); setPage(1); }}
                            title={c.label}
                            className={cn("w-7 h-7 rounded-full border-2 transition-all relative",
                                colorFilter === c.id ? "border-luxury-gold scale-110 shadow-lg shadow-luxury-gold/30" : "border-white/20 hover:border-white/60"
                            )}
                            style={{ backgroundColor: c.hex }}>
                            {colorFilter === c.id && (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <CheckCircle className="w-3 h-3 text-luxury-gold drop-shadow" />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* النطاق السعري */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? "النطاق السعري" : "Price Range"}</label>
                <div className="space-y-1.5">
                    {priceRanges.map(r => (
                        <button key={r.id} onClick={() => { setPriceRange(priceRange === r.id ? '' : r.id); setPage(1); }}
                            className={cn("w-full py-2 rounded-lg text-[10px] font-bold border text-right px-3 transition-all",
                                priceRange === r.id
                                    ? "bg-luxury-gold/15 border-luxury-gold/50 text-luxury-gold"
                                    : "bg-black/30 border-white/8 text-white/50 hover:border-white/20 hover:text-white/80"
                            )}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* أزرار الأكشن */}
            <div className="space-y-2 pt-1">
                <button onClick={() => { fetchCars(); if (mobile) setShowFilters(false); }}
                    className="w-full py-3 bg-luxury-gold hover:bg-luxury-gold/90 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_8px_20px_rgba(212,175,55,0.2)]">
                    {isRTL ? "عرض النتائج" : "Show Results"}
                </button>

                {/* زر حفظ التنبيه الذكي */}
                <button onClick={saveAsAlert}
                    className={cn("w-full py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2",
                        alertSaved
                            ? "bg-green-500/15 border-green-500/50 text-green-400"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                    )}>
                    {alertSaved ? <CheckCircle className="w-3.5 h-3.5" /> : <BellPlus className="w-3.5 h-3.5" />}
                    {alertSaved
                        ? (isRTL ? "تم حفظ التنبيه ✓" : "Alert Saved ✓")
                        : (isRTL ? "حفظ كتنبيه ذكي" : "Save as Smart Alert")
                    }
                </button>

                {hasActiveFilters && (
                    <button onClick={clearFilters}
                        className="w-full py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1">
                        <X className="w-3 h-3" />
                        {isRTL ? "مسح كل الفلاتر" : "Clear All Filters"}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className={cn("min-h-screen bg-cinematic-darker text-white selection:bg-luxury-gold selection:text-black", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* خلفية سينمائية */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-28">

                {/* ═══ البانر الإعلاني ═══ */}
                <div className="relative overflow-hidden rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #8B6914 0%, #D4AF37 40%, #a88520 70%, #6B4F0A 100%)' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)' }} />
                    <div className={`relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-5 sm:p-7 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                        <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
                            <div className="flex items-center gap-2">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/20 text-[10px] font-black text-white/90 tracking-widest uppercase">HM CAR</span>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white/80">{isRTL ? 'استيراد مباشر من كوريا' : 'Direct Import from Korea'}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">{isRTL ? 'سيارات كورية مستوردة' : 'Imported Korean Cars'}</h2>
                            <p className="text-xs text-white/75 leading-relaxed max-w-md">
                                {isRTL
                                    ? 'الأسعار المعروضة هي السعر الفعلي للسيارة. وتبقى رسوم إضافية (شحن وجمارك).'
                                    : 'Prices shown are the actual vehicle price. Additional fees (shipping & customs) apply.'}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                <div className="flex items-center gap-1.5 bg-black/20 rounded-full px-3 py-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[11px] font-black text-white">
                                        {totalCars > 0 ? `${totalCars.toLocaleString()}` : rawText('5,500')} {isRTL ? 'سيارة' : 'Cars'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/60">{isRTL ? 'متوفرة اليوم' : 'Available Today'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="overflow-hidden rounded-xl border-2 border-white/20 shadow-xl shadow-black/40">
                                <Image src="/images/hmcar.jpg" alt="HM CAR Korean Cars" width={160} height={90} className="object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ شبكة الوكالات (Brands) ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {/* الكل */}
                        <button onClick={() => { setBrand(''); setPage(1); }}
                            className={cn("flex-shrink-0 flex flex-col items-center gap-1.5",
                            )}>
                            <div className={cn("w-14 h-14 rounded-full border flex items-center justify-center transition-all shadow-lg",
                                brand === '' ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_20px_rgba(197,160,89,0.2)]" : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40"
                            )}>
                                <SlidersHorizontal className={cn("w-5 h-5", brand === '' ? "text-luxury-gold" : "text-white/20")} />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-wider", brand === '' ? "text-luxury-gold" : "text-white/40")}>{isRTL ? 'الكل' : 'ALL'}</span>
                        </button>

                        {brands.map((b: any) => (
                            <button key={b._id || b.name} onClick={() => { setBrand(b.name); setPage(1); }}
                                className="flex-shrink-0 flex flex-col items-center gap-1.5">
                                <div className={cn("w-14 h-14 rounded-full border flex items-center justify-center transition-all shadow-lg relative overflow-hidden",
                                    brand === b.name ? "bg-luxury-gold/20 border-luxury-gold/50 shadow-[0_0_20px_rgba(197,160,89,0.2)]" : "bg-white/[0.03] border-white/10 hover:border-luxury-gold/40"
                                )}>
                                    {b.logoUrl ? (
                                        <div className="w-9 h-9 relative">
                                            <Image src={b.logoUrl} alt={b.name} fill
                                                className={cn("object-contain", brand === b.name ? "" : "brightness-0 invert opacity-40")} />
                                        </div>
                                    ) : (
                                        <Car className={cn("w-5 h-5", brand === b.name ? "text-luxury-gold" : "text-white/20")} />
                                    )}
                                </div>
                                <span className={cn("text-[9px] font-black uppercase tracking-wider max-w-[56px] truncate text-center", brand === b.name ? "text-luxury-gold" : "text-white/40")}>{b.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ═══ المحتوى الرئيسي: سايدبار + شبكة السيارات ═══ */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* سايدبار Desktop */}
                    <div className="hidden lg:block w-64 shrink-0 bg-[#0f0f23]/80 border border-white/8 rounded-2xl overflow-hidden sticky top-20 backdrop-blur-md">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                {isRTL ? "فلاتر البحث" : "Filters"}
                            </h3>
                            {hasActiveFilters && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-gold font-bold">
                                    {isRTL ? "نشط" : "Active"}
                                </span>
                            )}
                        </div>
                        <div className="p-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
                            <FilterPanel />
                        </div>
                    </div>

                    {/* منطقة السيارات */}
                    <div className="flex-1 w-full min-w-0">

                        {/* شريط الإحصاءات + فلتر الجوال */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-luxury-gold text-black text-xs font-black">
                                    {isRTL ? 'سيارات' : 'Cars'}
                                    <span className="mr-1 ml-1 opacity-70">{totalCars > 0 ? totalCars.toLocaleString() : '—'}</span>
                                </button>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 flex items-center gap-1">
                                        <X className="w-3 h-3" />
                                        {isRTL ? 'مسح' : 'Clear'}
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-luxury-gold">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                {isRTL ? 'ابحث سيارة مخصصة' : 'Advanced Filter'}
                                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />}
                            </button>
                        </div>

                        {/* فلاتر الجوال المنسدلة */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-4 lg:hidden">
                                    <div className="bg-[#0f0f23]/90 border border-white/8 rounded-2xl backdrop-blur-md">
                                        <FilterPanel mobile />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* شبكة السيارات */}
                        {loading && page === 1 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                {Array.from({ length: 9 }).map((_, i) => <CarSkeletonCard key={i} />)}
                            </div>
                        ) : cars.length === 0 ? (
                            <div className="py-24 text-center bg-white/1 border border-dashed border-white/10 rounded-2xl">
                                <Car className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                <h2 className="text-lg font-black uppercase tracking-tight mb-2">{isRTL ? 'لا توجد نتائج' : 'No Results Found'}</h2>
                                <p className="text-white/40 text-xs mb-6">{isRTL ? 'جرب تعديل خيارات البحث أو مسح الفلاتر' : 'Try adjusting your filters or clear all'}</p>
                                <button onClick={clearFilters} className="px-6 py-2.5 rounded-xl bg-luxury-gold text-black text-xs font-black">{isRTL ? 'مسح الفلاتر' : 'Clear Filters'}</button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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
                                    <div className="mt-12 flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === 1}
                                            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2">
                                            <ArrowLeft className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                                            {isRTL ? 'السابق' : 'Prev'}
                                        </button>
                                        <div className="flex items-center gap-2 text-sm font-black">
                                            <span className="text-luxury-gold">{page}</span>
                                            <span className="text-white/20">/</span>
                                            <span className="text-white/40">{totalPages}</span>
                                        </div>
                                        <button
                                            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === totalPages}
                                            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2">
                                            {isRTL ? 'التالي' : 'Next'}
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
