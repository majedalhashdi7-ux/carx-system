'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ArrowRight, X, SlidersHorizontal, ArrowLeft, Car,
    Bell, BellPlus, CheckCircle, Fuel, Palette, CalendarRange, Sparkles, HelpCircle
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

    // Filters state
    const [q, setQ] = useState(searchParams.get('q') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
    const [yearMin, setYearMin] = useState('');
    const [yearMax, setYearMax] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [colorFilter, setColorFilter] = useState('');

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
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 15 }, (_, i) => currentYear - i);

    return (
        <div className={cn("min-h-screen bg-[#06060c] text-white selection:bg-luxury-gold selection:text-black", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* خلفية بصرية */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-[60vh] bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-28">

                {/* ═══ البانر الإعلاني المحدث مع الشعار واسم المتجر ═══ */}
                <div className="relative overflow-hidden rounded-3xl mb-8 border border-white/10" style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #171736 100%)' }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
                    
                    <div className={`relative flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-10 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                        
                        {/* الشعار واسم المتجر في البانر */}
                        <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'} flex-1`}>
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#a88520] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 border border-white/10">
                                    <Car className="w-8 h-8 text-black" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-wide uppercase">
                                        HM <span className="text-[#D4AF37]">CAR</span>
                                    </h2>
                                    <p className="text-[10px] text-white/45 tracking-widest uppercase font-black">
                                        {isRTL ? 'بوابتك لاستيراد السيارات من كورية' : 'Korea Auto Export Leader'}
                                    </p>
                                </div>
                            </div>
                            
                            <h3 className="text-xl sm:text-2xl font-black text-white italic">
                                {isRTL ? 'من المنصة الكورية إلى باب منزلك مباشرة' : 'Direct Import From Korean Auctions'}
                            </h3>
                            
                            <p className="text-xs text-white/50 leading-relaxed max-w-lg">
                                {isRTL
                                    ? 'نقدم لكم سيارات كورية مفحوصة بالكامل بأفضل الأسعار. الأسعار المعروضة هي سعر السيارة الفعلي، مع إمكانية التوصيل والشحن الدولي الآمن.'
                                    : 'Fully inspected Korean cars directly to your port. We handle logistics, documents, and secure shipping.'}
                            </p>
                            
                            <div className="flex items-center gap-4 pt-1">
                                <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3.5 py-1.5 border border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-[11px] font-black text-white">
                                        {totalCars > 0 ? `${totalCars.toLocaleString()}` : rawText('5,500')} {isRTL ? 'سيارة متاحة' : 'Cars Available'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* جانب الشعار ثلاثي الأبعاد أو العلامة الكبيرة */}
                        <div className="relative shrink-0 flex items-center justify-center p-4">
                            <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-luxury-gold/10 to-transparent blur-3xl absolute" />
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-44 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-2xl p-4"
                            >
                                <div className="text-center">
                                    <div className="text-3xl font-black text-[#D4AF37] tracking-widest italic">{rawText('HM')}</div>
                                    <div className="text-[9px] text-white/40 tracking-widest uppercase font-bold">{rawText('Premium Cars')}</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* ═══ السيارات على شكل بطاقات متحركة (Showroom Slideshow) ═══ */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                            {isRTL ? 'سيارات المعرض المتحركة' : 'Showroom Live Carousel'}
                        </h3>
                    </div>
                    
                    {/* شريط السيارات المتحرك تلقائياً */}
                    <div className="relative overflow-hidden w-full py-2 bg-white/[0.02] border-y border-white/5">
                        <div className="flex gap-6 animate-marquee whitespace-nowrap scrollbar-none py-2 px-4 hover:[animation-play-state:paused]">
                            {cars.slice(0, 10).map((car, idx) => (
                                <div 
                                    key={String(car.id || idx)}
                                    onClick={() => router.push(`/cars/${car.id || car._id}`)}
                                    className="inline-block w-64 rounded-2xl bg-[#0d0d1a] border border-white/5 p-3 shrink-0 cursor-pointer hover:border-luxury-gold/30 transition-all select-none"
                                >
                                    <div className="relative h-32 rounded-xl overflow-hidden bg-white/5 mb-2.5">
                                        {car.images?.[0] ? (
                                            <Image src={car.images[0]} alt={car.title} fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Car className="w-8 h-8 text-white/10" /></div>
                                        )}
                                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-wider">
                                            {car.year}
                                        </div>
                                    </div>
                                    <h4 className="text-xs font-black text-white truncate">{car.title}</h4>
                                    <div className="flex justify-between items-center mt-1.5">
                                        <span className="text-[10px] text-white/40">{car.fuel}</span>
                                        <span className="text-xs font-black text-[#D4AF37]">
                                            {car.priceSar ? `${Number(car.priceSar).toLocaleString()} SAR` : car.price ? `${Number(car.price).toLocaleString()} $` : '—'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══ فلاتر البحث الأفقية المحسنة (Premium Custom Header Filter) ═══ */}
                <div className="mb-10 bg-[#0d0d1e]/90 border border-white/8 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl relative z-20">
                    <div className="flex flex-col gap-5">
                        
                        {/* الصف الأول: البحث بالاسم واختيار الشركة */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* حقل البحث */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-[#D4AF37]" />
                                    {isRTL ? 'البحث بالاسم' : 'Search by Name'}
                                </label>
                                <input
                                    type="text"
                                    value={q}
                                    onChange={handleSearchChange}
                                    placeholder={isRTL ? 'ادخل اسم السيارة للبحث...' : 'Search car model...'}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white placeholder:text-white/20"
                                />
                            </div>

                            {/* الشركة المصنعة */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest">
                                    {isRTL ? 'الشركة المصنعة' : 'Make'}
                                </label>
                                <select 
                                    value={brand}
                                    onChange={e => { setBrand(e.target.value); setPage(1); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer"
                                >
                                    <option value="">{isRTL ? 'كل الشركات' : 'All Makes'}</option>
                                    {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* النطاق السعري */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest">
                                    {isRTL ? 'النطاق السعري' : 'Price Range'}
                                </label>
                                <select
                                    value={priceRange}
                                    onChange={e => { setPriceRange(e.target.value); setPage(1); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer"
                                >
                                    <option value="">{isRTL ? 'كل الأسعار' : 'All Prices'}</option>
                                    {priceRanges.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* الصف الثاني: فلاتر تفصيلية (سنة، نوع وقود، لون) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* السنة من وإلى */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest">
                                    {isRTL ? 'السنة (من - إلى)' : 'Year (From - To)'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select value={yearMin} onChange={e => { setYearMin(e.target.value); setPage(1); }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer">
                                        <option value="">{isRTL ? 'من' : 'From'}</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <select value={yearMax} onChange={e => { setYearMax(e.target.value); setPage(1); }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer">
                                        <option value="">{isRTL ? 'إلى' : 'To'}</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* نوع الوقود */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest">
                                    {isRTL ? 'نوع الوقود' : 'Fuel Type'}
                                </label>
                                <select
                                    value={fuelType}
                                    onChange={e => { setFuelType(e.target.value); setPage(1); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer"
                                >
                                    <option value="">{isRTL ? 'كل الأنواع' : 'All Fuels'}</option>
                                    {fuelTypes.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                </select>
                            </div>

                            {/* فلتر اللون */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/45 uppercase tracking-widest">
                                    {isRTL ? 'اللون الخارجي' : 'Color'}
                                </label>
                                <select
                                    value={colorFilter}
                                    onChange={e => { setColorFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-luxury-gold/50 text-white cursor-pointer"
                                >
                                    <option value="">{isRTL ? 'كل الألوان' : 'All Colors'}</option>
                                    {colors.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>

                            {/* أزرار الإجراءات */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchCars()}
                                    className="flex-1 py-3.5 bg-[#D4AF37] hover:bg-[#c9a030] text-black font-black uppercase text-xs rounded-xl transition-all shadow-md shadow-[#D4AF37]/15 flex items-center justify-center gap-1.5"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    {isRTL ? 'تطبيق الفلاتر' : 'Filter'}
                                </button>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-all"
                                        title={isRTL ? 'تصفير الفلاتر' : 'Clear Filters'}
                                    >
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* صف حفظ التنبيه */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-white/40">
                            <div>{isRTL ? 'تخصيص البحث الخاص بك للحصول على التحديثات' : 'Save your criteria for alerts'}</div>
                            <button
                                onClick={saveAsAlert}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold",
                                    alertSaved
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                )}
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {alertSaved ? (isRTL ? 'تم الحفظ ✓' : 'Saved ✓') : (isRTL ? 'حفظ كتنبيه ذكي' : 'Save Alert')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ قائمة السيارات ═══ */}
                <div className="w-full">
                    {/* الإحصاءات */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-xs font-black uppercase tracking-wider text-white/50">
                            {isRTL ? 'جميع الموديلات المعروضة' : 'ALL SHOWROOM CARS'}
                            <span className="mx-2 text-[#D4AF37] font-bold">({totalCars})</span>
                        </div>
                    </div>

                    {/* شبكة السيارات */}
                    {loading && page === 1 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 8 }).map((_, i) => <CarSkeletonCard key={i} />)}
                        </div>
                    ) : cars.length === 0 ? (
                        <div className="py-24 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                            <Car className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <h2 className="text-lg font-black uppercase tracking-tight mb-2">{isRTL ? 'لا توجد نتائج مطابقة' : 'No Cars Found'}</h2>
                            <p className="text-white/40 text-xs mb-6">{isRTL ? 'جرب تعديل خيارات البحث أو تصفير الفلاتر' : 'Try adjusting your search query or reset filters'}</p>
                            <button onClick={clearFilters} className="px-6 py-2.5 bg-[#D4AF37] text-black text-xs font-black rounded-xl">{isRTL ? 'مسح الفلاتر' : 'Reset Filters'}</button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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

                            {/* التصفح الصفحات */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === 1}
                                        className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2">
                                        <ArrowLeft className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                                        {isRTL ? 'السابق' : 'Prev'}
                                    </button>
                                    <div className="flex items-center gap-2 text-sm font-black">
                                        <span className="text-[#D4AF37]">{page}</span>
                                        <span className="text-white/20">/</span>
                                        <span className="text-white/40">{totalPages}</span>
                                    </div>
                                    <button
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === totalPages}
                                        className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-2">
                                        {isRTL ? 'التالي' : 'Next'}
                                        <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
