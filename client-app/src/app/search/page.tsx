'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Tag, AlertCircle, ArrowRight, ShoppingBag, Sparkles, Bell, CheckCircle2,
    SlidersHorizontal, ChevronDown, X } from "lucide-react";
import Link from 'next/link';
import NextImage from 'next/image';
import ClientPageHeader from '@/components/ClientPageHeader';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';

// ── Types ──
interface CarResult {
    id?: string; _id?: string; title?: string;
    make?: string | { name: string }; model?: string;
    year?: number; price?: number; priceSar?: number;
    images?: string[]; fuelType?: string; transmission?: string;
}
interface PartResult {
    id?: string; _id?: string; name?: string;
    brand?: string; price?: number; img?: string;
    condition?: string;
}
interface BrandResult { name: string; logoUrl?: string; }

// ── Filter Panel Component ──
function AdvancedFilters({
    isRTL, onApply, currentFilters
}: {
    isRTL: boolean;
    onApply: (f: FilterValues) => void;
    currentFilters: FilterValues;
}) {
    const [open, setOpen] = useState(false);
    const [local, setLocal] = useState<FilterValues>(currentFilters);

    const fuelOptions = [
        { value: '', label: isRTL ? 'كل الأنواع' : 'All Fuels' },
        { value: 'Petrol', label: isRTL ? 'بنزين' : 'Petrol' },
        { value: 'Diesel', label: isRTL ? 'ديزل' : 'Diesel' },
        { value: 'Hybrid', label: isRTL ? 'هجين' : 'Hybrid' },
        { value: 'Electric', label: isRTL ? 'كهربائي' : 'Electric' },
    ];
    const transmissionOptions = [
        { value: '', label: isRTL ? 'كل الأنواع' : 'All' },
        { value: 'Automatic', label: isRTL ? 'أوتوماتيك' : 'Automatic' },
        { value: 'Manual', label: isRTL ? 'يدوي' : 'Manual' },
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

    const hasActiveFilters = local.fuel || local.transmission || local.yearFrom || local.yearTo ||
        local.minPrice || local.maxPrice;

    return (
        <div className="mb-8">
            <button
                onClick={() => setOpen(v => !v)}
                className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black transition-all',
                    hasActiveFilters
                        ? 'bg-[#C9A96E]/15 border-[#C9A96E]/50 text-[#C9A96E]'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                )}
            >
                <SlidersHorizontal className="w-4 h-4" />
                {isRTL ? 'فلاتر متقدمة' : 'Advanced Filters'}
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />}
                <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
                >
                    {/* نوع الوقود */}
                    <div>
                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                            {isRTL ? 'نوع الوقود' : 'Fuel Type'}
                        </label>
                        <select
                            value={local.fuel}
                            onChange={e => setLocal(p => ({ ...p, fuel: e.target.value }))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                        >
                            {fuelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    {/* ناقل الحركة */}
                    <div>
                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                            {isRTL ? 'ناقل الحركة' : 'Transmission'}
                        </label>
                        <select
                            value={local.transmission}
                            onChange={e => setLocal(p => ({ ...p, transmission: e.target.value }))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                        >
                            {transmissionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    {/* سنة من */}
                    <div>
                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                            {isRTL ? 'السنة من' : 'Year From'}
                        </label>
                        <select
                            value={local.yearFrom}
                            onChange={e => setLocal(p => ({ ...p, yearFrom: e.target.value }))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                        >
                            <option value="">{isRTL ? 'أي سنة' : 'Any'}</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* سنة إلى */}
                    <div>
                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                            {isRTL ? 'السنة إلى' : 'Year To'}
                        </label>
                        <select
                            value={local.yearTo}
                            onChange={e => setLocal(p => ({ ...p, yearTo: e.target.value }))}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                        >
                            <option value="">{isRTL ? 'أي سنة' : 'Any'}</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* نطاق السعر */}
                    <div>
                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">
                            {isRTL ? 'نطاق السعر (ر.س)' : 'Price Range (SAR)'}
                        </label>
                        <div className="flex gap-1 items-center">
                            <input
                                type="number" placeholder={isRTL ? 'من' : 'Min'}
                                value={local.minPrice}
                                onChange={e => setLocal(p => ({ ...p, minPrice: e.target.value }))}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                            />
                            <span className="text-white/20 text-xs">—</span>
                            <input
                                type="number" placeholder={isRTL ? 'إلى' : 'Max'}
                                value={local.maxPrice}
                                onChange={e => setLocal(p => ({ ...p, maxPrice: e.target.value }))}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:border-[#C9A96E]/50 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* أزرار */}
                    <div className="col-span-full flex gap-3 pt-2">
                        <button
                            onClick={() => { onApply(local); setOpen(false); }}
                            className="px-5 py-2 rounded-xl bg-[#C9A96E] text-black text-xs font-black hover:bg-[#b8955b] transition-all"
                        >
                            {isRTL ? 'تطبيق الفلاتر' : 'Apply Filters'}
                        </button>
                        <button
                            onClick={() => {
                                const empty = { fuel: '', transmission: '', yearFrom: '', yearTo: '', minPrice: '', maxPrice: '' };
                                setLocal(empty); onApply(empty); setOpen(false);
                            }}
                            className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-black hover:text-white transition-all flex items-center gap-1"
                        >
                            <X className="w-3 h-3" /> {isRTL ? 'مسح الكل' : 'Clear All'}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

interface FilterValues {
    fuel: string;
    transmission: string;
    yearFrom: string;
    yearTo: string;
    minPrice: string;
    maxPrice: string;
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-black uppercase tracking-[0.5em] italic animate-pulse">Synchronizing Matrix...</div>}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const brand = searchParams.get('brand') || '';
    const price = searchParams.get('price') || '';
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();

    const [cars, setCars] = useState<CarResult[]>([]);
    const [parts, setParts] = useState<PartResult[]>([]);
    const [brands, setBrands] = useState<BrandResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasResults, setHasResults] = useState(false);
    const [advFilters, setAdvFilters] = useState<FilterValues>({
        fuel: '', transmission: '', yearFrom: '', yearTo: '', minPrice: '', maxPrice: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const brandsRes = await api.brands.list().catch(() => ({ brands: [] }));
                setBrands((brandsRes as any)?.brands || []);

                let minPrice: string | undefined = advFilters.minPrice || undefined;
                let maxPrice: string | undefined = advFilters.maxPrice || undefined;

                // URL-based price shortcuts (backward compat)
                if (!minPrice && !maxPrice) {
                    if (price === '0-100' || price === '0-100k') { maxPrice = '100000'; }
                    else if (price === '100-300' || price === '100-500k') { minPrice = '100000'; maxPrice = '500000'; }
                    else if (price === '300+' || price === '500k+') { minPrice = '500000'; }
                }

                const carsRes = await api.cars.list({
                    page: 1, limit: 100, search: q, make: brand || '',
                    minPrice: minPrice ?? '',
                    maxPrice: maxPrice ?? '',
                    ...(advFilters.fuel ? { fuelType: advFilters.fuel } : {}),
                    ...(advFilters.transmission ? { transmission: advFilters.transmission } : {}),
                    ...(advFilters.yearFrom ? { yearFrom: advFilters.yearFrom } : {}),
                    ...(advFilters.yearTo ? { yearTo: advFilters.yearTo } : {}),
                }).catch(() => ({ data: { cars: [] } }));

                const partsRes = await api.parts.list({
                    page: 1, limit: 100, q: q,
                    ...(brand !== '' && { category: brand })
                }).catch(() => ({ data: { parts: [] } }));

                const fetchedCars: CarResult[] = Array.isArray((carsRes as any)?.data)
                    ? (carsRes as any).data
                    : ((carsRes as any)?.data?.cars || (carsRes as any)?.cars || []);
                const fetchedParts: PartResult[] = Array.isArray((partsRes as any)?.data)
                    ? (partsRes as any).data
                    : ((partsRes as any)?.data?.parts || (partsRes as any)?.parts || []);

                // Client-side filtering for year/fuel/transmission if API doesn't support
                const filtered = fetchedCars.filter(c => {
                    if (advFilters.yearFrom && c.year && Number(c.year) < Number(advFilters.yearFrom)) return false;
                    if (advFilters.yearTo && c.year && Number(c.year) > Number(advFilters.yearTo)) return false;
                    if (advFilters.fuel && c.fuelType && !c.fuelType.toLowerCase().includes(advFilters.fuel.toLowerCase())) return false;
                    if (advFilters.transmission && c.transmission && !c.transmission.toLowerCase().includes(advFilters.transmission.toLowerCase())) return false;
                    return true;
                });

                setCars(filtered);
                setParts(fetchedParts);
                setHasResults(filtered.length > 0 || fetchedParts.length > 0);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [q, brand, price, advFilters]);


    const handleConciergeRequest = () => {
        router.push('/concierge');
    };

    // ── حفظ البحث كـ Smart Alert ──
    const [alertSaved, setAlertSaved] = useState(false);
    const handleSaveAlert = () => {
        if (!q && !brand) return;
        try {
            const alerts: any[] = JSON.parse(localStorage.getItem('hm_smart_alerts') || '[]');
            const newAlert = {
                id: Date.now().toString(),
                label: q ? `بحث: "${q}"` : `ماركة: ${brand}`,
                q, brand, price,
                createdAt: new Date().toISOString(),
            };
            if (!alerts.find((a: any) => a.q === q && a.brand === brand)) {
                alerts.unshift(newAlert);
                localStorage.setItem('hm_smart_alerts', JSON.stringify(alerts.slice(0, 20)));
            }
            setAlertSaved(true);
            setTimeout(() => setAlertSaved(false), 3000);
        } catch {}
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black font-sans perspective-1000 overflow-x-hidden">
            <Navbar />

            <div className="bg-grid-overlay opacity-20 fixed inset-0 z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent opacity-60" />
            </div>

            <main className="relative z-10 pt-40 pb-32 px-6 max-w-[1800px] mx-auto">

                <ClientPageHeader
                    title={q || brand ? (
                        <span className="flex flex-col md:flex-row md:gap-3">{isRTL ? "نتائج" : "RESULT"} <span className="text-luxury-gold">{isRTL ? "البحث" : "STREAM"}</span></span>
                    ) : (
                        <span className="flex flex-col md:flex-row md:gap-3">{isRTL ? "المخزون" : "GLOBAL"} <span className="text-luxury-gold">{isRTL ? "الشامل" : "INVENTORY"}</span></span>
                    )}
                    subtitle={loading ? (isRTL ? "جاري المسح..." : "SCANNING MATRIX...") : `${cars.length + parts.length} ${isRTL ? "أصل متاح" : "IDENTIFIED ASSETS"}`}
                    icon={Search}
                />

                {/* Advanced Filters */}
                <AdvancedFilters
                    isRTL={isRTL}
                    currentFilters={advFilters}
                    onApply={setAdvFilters}
                />

                {/* Smart Alert Save Button */}
                {(q || brand) && (
                    <div className="mb-8 flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handleSaveAlert}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black transition-all ${
                                alertSaved
                                    ? 'bg-green-500/15 border-green-500/40 text-green-400'
                                    : 'bg-[#C9A96E]/10 border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/20'
                            }`}
                        >
                            {alertSaved
                                ? <><CheckCircle2 className="w-4 h-4" />{isRTL ? 'تم حفظ التنبيه ✔' : 'Alert Saved ✔'}</>
                                : <><Bell className="w-4 h-4" />{isRTL ? '🔔 نبّهني عند توفر هذا البحث' : '🔔 Alert me when available'}</>
                            }
                        </button>
                        <Link href="/client/smart-alerts"
                            className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors underline">
                            {isRTL ? 'إدارة التنبيهات' : 'Manage Alerts'}
                        </Link>
                    </div>
                )}

                {/* Agencies / Brands Filter Bar */}
                {brands.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16 pb-8 border-b border-white/5 scrollbar-hide overflow-x-auto flex gap-6 items-center px-2"
                    >
                        <Link
                            href="/search"
                            className={cn(
                                "shrink-0 px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all",
                                !brand ? "bg-luxury-gold text-black border-luxury-gold shadow-[0_0_20px_rgba(197,160,89,0.3)]" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                            )}
                        >
                            {isRTL ? "الكل" : "ALL"}
                        </Link>
                        {brands.map((b, i) => (
                            <Link
                                key={i}
                                href={`/search?brand=${b.name}${q ? `&q=${q}` : ''}`}
                                className={cn(
                                    "shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all group",
                                    brand === b.name
                                        ? "bg-luxury-gold/10 border-luxury-gold text-luxury-gold shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                                        : "bg-white/[0.02] border-white/5 text-white/30 hover:border-white/20 hover:text-white"
                                )}
                            >
                                {b.logoUrl ? (
                                    <div className="relative w-5 h-5">
                                        <NextImage src={b.logoUrl} alt={b.name} fill className={cn("object-contain", brand === b.name ? "grayscale-0" : "grayscale")} />
                                    </div>
                                ) : <Tag className="w-3 h-3" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{b.name}</span>
                            </Link>
                        ))}
                    </motion.div>
                )}

                {q && (
                    <div className="mb-20">
                        <span className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter opacity-50">&quot;{q.toUpperCase()}&quot;</span>
                    </div>
                )}

                {loading ? (
                    <div className="py-48 flex flex-col items-center justify-center space-y-12">
                        <div className="relative w-24 h-24 perspective-500">
                            <motion.div
                                animate={{ rotateX: 360, rotateY: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-4 border-luxury-gold/20 rounded-full border-t-luxury-gold shadow-[0_0_30px_rgba(197,160,89,0.2)]"
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.8em] animate-pulse text-white/40">Synchronizing Global Database...</span>
                    </div>
                ) : (
                    <div className="space-y-48">

                        {/* No Findings Module */}
                        {!hasResults && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="obsidian-card p-12 md:p-32 text-center relative overflow-hidden group border-dashed border-white/10"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 via-transparent to-transparent opacity-50" />
                                <div className="relative z-10 flex flex-col items-center gap-12 max-w-2xl mx-auto">
                                    <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold/10 transition-all duration-700 shadow-2xl">
                                        <AlertCircle className="w-12 h-12 text-luxury-gold/40" />
                                    </div>
                                    <div className="space-y-6">
                                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter gold-glow">
                                            {isRTL ? "لم يتم العثور على تطابق" : "ZERO MATCHES"}
                                        </h2>
                                        <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.4em] leading-loose italic max-w-lg mx-auto">
                                            {isRTL
                                                ? "لم نجد طلبك في المخزون المباشر. كحل بديل، يمكن لفريقنا العالمي توفيره لك."
                                                : "The current stream yielded no results. Our acquisition specialists can manually source this from the dark network."}
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-8 mt-12 w-full max-w-lg">
                                        <button
                                            onClick={handleConciergeRequest}
                                            className="btn-luxury flex-1 py-6 rounded-2xl group"
                                        >
                                            <span>{isRTL ? "خدمة الطلبات الخاصة" : "ACTIVATE CONCIERGE"}</span>
                                            <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
                                        </button>
                                        <Link href="/" className="flex-1">
                                            <button className="w-full py-6 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all text-xs font-black uppercase tracking-widest text-white/60 hover:text-white">
                                                {isRTL ? "العودة للمركز" : "EXIT TERMINAL"}
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Cars Matrix */}
                        {cars.length > 0 && (
                            <section className="space-y-16">
                                <div className="flex items-end justify-between border-b border-white/5 pb-8 relative">
                                    <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-luxury-gold/50" />
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cinematic-neon-blue animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue">Vehicle Data</span>
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">IDENTIFIED <span className="text-white/20">MACHINERY</span></h2>
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{cars.length} UNITS</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                                    {cars.map((car, i) => (
                                        <motion.div
                                            key={car.id}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group obsidian-card obsidian-card-hover"
                                        >
                                            <Link href={`/cars/${car.id || car._id}`}>
                                                <div className="relative h-72 overflow-hidden rounded-t-[2.5rem] bg-black">
                                                    <NextImage src={car.images?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1000'} alt={car.title} fill className="object-cover grayscale transition-all duration-[1.5s] group-hover:grayscale-0 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                                    <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                                                        <span className="text-[9px] font-black text-white tracking-widest">{car.year}</span>
                                                    </div>
                                                </div>
                                                <div className="p-8 space-y-8 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
                                                    <div className="space-y-3">
                                                        <span className="text-[8px] font-black text-luxury-gold/50 tracking-[0.4em] uppercase italic">{typeof car.make === 'object' ? car.make?.name : car.make}</span>
                                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic line-clamp-2 min-h-[4rem] group-hover:text-luxury-gold transition-colors">{car.title}</h3>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                                        <span className="text-xl font-black italic gold-glow">{formatPrice ? formatPrice(Number(car.price || 0)) : `${Number(car.price || 0).toLocaleString()} SAR`}</span>
                                                        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:text-black group-hover:border-luxury-gold transition-all">
                                                            <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:-rotate-45", isRTL && "rotate-180")} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Parts Index */}
                        {parts.length > 0 && (
                            <section className="space-y-16">
                                <div className="flex items-end justify-between border-b border-white/5 pb-8 relative">
                                    <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-cinematic-neon-yellow/50" />
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cinematic-neon-yellow animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-yellow">Component Registry</span>
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">SPARE <span className="text-white/20">LOGS</span></h2>
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{parts.length} COMPONENTS</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {parts.map((part, i) => (
                                        <motion.div
                                            key={part.id}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="group obsidian-card obsidian-card-hover p-6"
                                        >
                                            <Link href={`/parts/${part.id}`}>
                                                <div className="aspect-square bg-white/[0.02] rounded-[2rem] overflow-hidden mb-6 border border-white/5 relative">
                                                    <NextImage src={part.img} alt={part.name} fill className="object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 p-8" />
                                                    <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-white/20 border border-white/10 px-3 py-1 rounded-full">{part.brand}</div>
                                                </div>
                                                <div className="space-y-4">
                                                    <span className="text-[8px] font-black uppercase text-cinematic-neon-yellow tracking-widest block">{part.condition}</span>
                                                    <h3 className="text-lg font-black uppercase italic line-clamp-1 group-hover:text-luxury-gold transition-colors">{part.name}</h3>
                                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                                        <span className="text-lg font-black italic gold-glow">{formatPrice ? formatPrice(Number(part.price || 0)) : `${Number(part.price || 0).toLocaleString()} SAR`}</span>
                                                        <ShoppingBag className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Sourcing Request Matrix */}
                        {hasResults && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="obsidian-card p-12 lg:p-20 overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 via-transparent to-transparent opacity-50" />
                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                    <div className="space-y-8 text-center lg:text-left">
                                        <div className="flex items-center gap-4 justify-center lg:justify-start">
                                            <div className="w-12 h-12 rounded-full bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
                                                <Sparkles className="w-6 h-6 text-luxury-gold" />
                                            </div>
                                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">BEYOND THE MATRIX</h2>
                                        </div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold max-w-2xl leading-[2.2]">
                                            {isRTL
                                                ? "لم تجد ما تبحث عنه بدقة؟ شبكتنا العالمية من الموردين والخبراء جاهزة للانطلاق وتوفير أي مركبة أو قطعة غيار نادرة."
                                                : "Direct results limited? Our global reconnaissance units can traverse multiple networks to identify and source any obscure automotive machinery."
                                            }
                                        </p>
                                    </div>
                                    <button onClick={handleConciergeRequest} className="btn-luxury px-12 py-6 rounded-2xl group shrink-0">
                                        <span>{isRTL ? "تفعيل البحث المتقدم" : "INITIATE SOURCING"}</span>
                                        <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", isRTL && "rotate-180")} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

            </main>

            {/* Matrix Data Footer */}
            <div className="fixed bottom-12 right-12 opacity-20 pointer-events-none hidden md:block">
                <div className="text-[8px] font-black uppercase tracking-[1em] italic text-right">
                    HM SCANNER SYSTEM v4.0.5 <br />
                    ENCRYPTED BROADCAST
                </div>
            </div>
        </div>
    );
}
