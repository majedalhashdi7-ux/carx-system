'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Car, Fuel, Settings2, Gauge,
    ChevronLeft, ChevronRight, ChevronDown,
    MessageCircle, Heart, SlidersHorizontal,
    Globe, Building2, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import Image from 'next/image';
import Link from 'next/link';
import { WhatsAppService } from '@/lib/WhatsAppService';

/* ─── Types ─── */
interface CarItem {
    id: string;
    title: string;
    titleKr?: string;
    make: string;
    makeAr?: string;
    model: string;
    badge?: string;
    year: number;
    mileage: number;
    fuelType?: string;
    fuelAr?: string;
    transmission?: string;
    transmissionAr?: string;
    color?: string;
    seats?: number;
    bodyType?: string;
    price: number;
    priceUsd?: number;
    priceSar?: number;
    images: string[];
    imageUrl?: string;
    source: 'korean' | 'local';
    isInspected?: boolean;
    encarUrl?: string;
    condition?: string;
}

/* ─── Helpers ─── */
function resolveImg(car: CarItem): string {
    const fallback = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800';
    let url = car.images?.[0] || car.imageUrl || '';
    if (!url) return fallback;
    url = url.trim();
    if (url.includes('https://ci.encar.comhttps://')) url = url.replace('https://ci.encar.comhttps://', 'https://');
    if (url.endsWith('_')) url = url.startsWith('http') ? `${url}001.jpg` : `https://ci.encar.com${url}001.jpg`;
    if (url.startsWith('/carpicture')) return `https://ci.encar.com${url}`;
    if (url.startsWith('/') && !url.startsWith('http')) return `https://ci.encar.com/carpicture${url}`;
    return url || fallback;
}

function fmtKm(km: number) {
    if (!km) return '—';
    return km >= 10000 ? `${(km / 1000).toFixed(0)}k كم` : `${km.toLocaleString()} كم`;
}

function fmtPrice(n: number) {
    if (!n || n <= 0) return '—';
    return `${Math.round(n).toLocaleString('ar-SA')} ر.س`;
}

/* ─── Car Card ─── */
function CarCard({ car, onWhatsApp }: { car: CarItem; onWhatsApp: (car: CarItem) => void }) {
    const [liked, setLiked] = useState(false);
    const [imgErr, setImgErr] = useState(false);
    const img = imgErr ? 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800' : resolveImg(car);

    const displayPrice = car.priceSar || car.price || 0;
    const displayName = car.makeAr || car.make;

    const fuelLabel = car.fuelAr || car.fuelType || '';
    const transLabel = car.transmissionAr || car.transmission || '';

    const sourceBadge = car.source === 'korean'
        ? { label: 'كوري 🇰🇷', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
        : { label: 'معرض HM', color: 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/30' };

    return (
        <Link href={`/cars/${car.id}`} className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="group relative bg-[#111118] border border-white/6 rounded-2xl overflow-hidden hover:border-[#C9A96E]/40 hover:shadow-[0_12px_40px_rgba(201,169,110,0.1)] transition-all duration-300 flex flex-col cursor-pointer h-full"
            >
                {/* Image */}
                <div className="relative aspect-[4/3] sm:aspect-[16/9] bg-[#0a0a12] overflow-hidden shrink-0">
                    <Image
                        src={img} alt={car.title} fill sizes="(max-width:640px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={() => setImgErr(true)}
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Top badges row */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between">
                        <div className={cn("text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md border tracking-wide backdrop-blur-sm", sourceBadge.color)}>
                            {sourceBadge.label}
                        </div>
                        <div className="bg-[#C9A96E] text-black text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md tracking-wide">
                            {car.year}
                        </div>
                    </div>

                    {/* Like button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setLiked(p => !p); }}
                        className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                        <Heart className={cn("w-3.5 h-3.5 transition-colors", liked ? "fill-red-500 text-red-500" : "text-white/60")} />
                    </button>

                    {/* Inspected badge */}
                    {car.isInspected && (
                        <div className="absolute bottom-2 right-2 bg-green-500/20 border border-green-500/40 text-green-400 text-[8px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            ✓ مفحوصة
                        </div>
                    )}

                    {/* Price overlay on image bottom */}
                    <div className="absolute bottom-0 inset-x-0 px-3 pb-2 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="text-[15px] sm:text-base font-black text-[#C9A96E] leading-none">
                            {displayPrice > 0 ? fmtPrice(displayPrice) : <span className="text-[11px] text-white/50">اتصل للسعر</span>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-3.5 flex flex-col flex-1 gap-2">
                    {/* Make + Title */}
                    <div>
                        <div className="flex items-center gap-1 mb-0.5">
                            {car.source === 'korean' ? <Globe className="w-2.5 h-2.5 text-blue-400/70 shrink-0" /> : <Building2 className="w-2.5 h-2.5 text-[#C9A96E]/60 shrink-0" />}
                            <span className="text-[9px] text-white/35 font-bold tracking-wider truncate">{displayName}</span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-1 group-hover:text-[#C9A96E] transition-colors">
                            {car.model} {car.badge || ''}
                        </h3>
                    </div>

                    {/* Specs row - visible on all sizes */}
                    <div className="flex flex-wrap gap-1">
                        {car.mileage > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-white/45 bg-white/4 border border-white/8 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                                <Gauge className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C9A96E]/50 shrink-0" />{fmtKm(car.mileage)}
                            </span>
                        )}
                        {fuelLabel && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-white/45 bg-white/4 border border-white/8 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
                                <Fuel className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[#C9A96E]/50 shrink-0" />{fuelLabel}
                            </span>
                        )}
                        {transLabel && (
                            <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-white/45 bg-white/4 border border-white/8 px-2 py-1 rounded-lg">
                                <Settings2 className="w-2.5 h-2.5 text-[#C9A96E]/50 shrink-0" />{transLabel}
                            </span>
                        )}
                    </div>

                    {/* WhatsApp CTA */}
                    <button
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onWhatsApp(car); }}
                        className="mt-auto flex items-center justify-center gap-1.5 w-full bg-green-600/90 hover:bg-green-500 active:bg-green-700 text-white text-[10px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl transition-all shadow-[0_2px_12px_rgba(22,163,74,0.25)] hover:shadow-[0_4px_20px_rgba(22,163,74,0.4)]"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        تواصل عبر واتساب
                    </button>
                </div>
            </motion.div>
        </Link>
    );
}

/* ─── Filter Checkbox ─── */
function FilterOption({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
    return (
        <label className="flex items-center justify-between gap-2 cursor-pointer group py-1.5 px-2 rounded-xl hover:bg-white/4 transition-all">
            <div className="flex items-center gap-2">
                <div
                    onClick={onChange}
                    className={cn(
                        "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                        checked ? "border-[#C9A96E] bg-[#C9A96E]" : "border-white/20 bg-transparent group-hover:border-white/40"
                    )}
                >
                    {checked && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>}
                </div>
                <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">{label}</span>
            </div>
            {count !== undefined && <span className="text-[9px] text-white/20 font-bold">{count}</span>}
        </label>
    );
}

/* ─── Filter Section ─── */
function FilterSection({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="border-b border-white/5 py-3">
            <button onClick={onToggle} className="w-full flex items-center justify-between px-1 py-1 text-right">
                <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform", expanded && "rotate-180")} />
                <span className="text-xs font-black text-white/70 tracking-wide">{title}</span>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-2 space-y-0.5 px-1">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Main Page ─── */
export default function CarsBrowserPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#08080f] text-white flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
            </div>
        }>
            <CarsContent />
        </Suspense>
    );
}

function CarsContent() {
    const { isRTL } = useLanguage();
    const { socialLinks, currency, formatPriceFromUsd } = useSettings();
    const router = useRouter();

    /* ── State ── */
    const [allCars, setAllCars] = useState<CarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    /* ── Filters ── */
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [brandFilters, setBrandFilters] = useState<string[]>([]);
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [fuelFilters, setFuelFilters] = useState<string[]>([]);
    const [transFilters, setTransFilters] = useState<string[]>([]);
    const [sourceFilter, setSourceFilter] = useState<'all' | 'korean' | 'local'>('all');
    const [priceMax, setPriceMax] = useState('');
    const [kmMax, setKmMax] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'km_asc'>('latest');

    /* ── Sidebar ── */
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        brand: true, year: true, fuel: true, trans: true, source: true, price: false, km: false,
    });
    const [mobileSidebar, setMobileSidebar] = useState(false);

    const toggleSection = (key: string) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

    /* ── Fetch merged cars ── */
    const fetchAllCars = useCallback(async () => {
        setLoading(true);
        try {
            const [koreanRes, localRes] = await Promise.allSettled([
                api.showroom.getCars(1),
                api.cars.list({ limit: 200, isActive: true }),
            ]);

            const merged: CarItem[] = [];

            // Korean cars
            if (koreanRes.status === 'fulfilled' && koreanRes.value?.success) {
                const kCars = koreanRes.value.data || [];
                kCars.forEach((c: any) => {
                    const priceUsd = Number(c.priceUsd) || (Number(c.priceKrw) / (Number(currency.usdToKrw) || 1350));
                    merged.push({
                        id: String(c.id || c._id),
                        title: c.title || `${c.manufacturerAr || c.manufacturer} ${c.model}`,
                        titleKr: c.titleKr,
                        make: c.manufacturer || '',
                        makeAr: c.manufacturerAr || c.manufacturer,
                        model: c.model || '',
                        badge: c.badge || '',
                        year: Number(c.year) || 0,
                        mileage: Number(c.mileage) || 0,
                        fuelType: c.fuel,
                        fuelAr: c.fuelAr || c.fuel,
                        transmission: c.transmission,
                        transmissionAr: c.transmissionAr || c.transmission,
                        price: priceUsd * (Number(currency.usdToSar) || 3.75),
                        priceUsd,
                        priceSar: c.priceSar || priceUsd * (Number(currency.usdToSar) || 3.75),
                        images: c.images || [c.imageUrl, c.image].filter(Boolean),
                        imageUrl: c.imageUrl || c.image,
                        source: 'korean',
                        isInspected: Boolean(c.isInspected),
                        encarUrl: c.encarUrl,
                    });
                });
            }

            // Local HM CAR
            if (localRes.status === 'fulfilled') {
                const lData = localRes.value?.data;
                const lCars = lData?.cars || (Array.isArray(lData) ? lData : []);
                lCars.forEach((c: any) => {
                    if (c.isSold || c.isActive === false) return;
                    const price = Number(c.price) || Number(c.priceSar) || 0;
                    merged.push({
                        id: String(c._id || c.id),
                        title: c.title || `${c.makeAr || c.make} ${c.model} ${c.year}`,
                        make: c.make || '',
                        makeAr: c.makeAr || c.make,
                        model: c.model || '',
                        year: Number(c.year) || 0,
                        mileage: Number(c.mileage) || 0,
                        fuelType: c.fuelType,
                        fuelAr: c.fuelAr || c.fuelType,
                        transmission: c.transmission,
                        transmissionAr: c.transmissionAr || c.transmission,
                        color: c.color,
                        seats: c.seats,
                        bodyType: c.bodyType,
                        price,
                        priceSar: price,
                        images: Array.isArray(c.images) ? c.images : [c.imageUrl].filter(Boolean),
                        imageUrl: c.imageUrl || c.images?.[0],
                        source: 'local',
                        condition: c.condition,
                    });
                });
            }

            setAllCars(merged);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [currency.usdToKrw, currency.usdToSar]);

    useEffect(() => { fetchAllCars(); }, [fetchAllCars]);

    /* ── Derived filter options ── */
    const allBrands = [...new Set(allCars.map(c => c.makeAr || c.make).filter(Boolean))].sort();
    const allFuels = [...new Set(allCars.map(c => c.fuelAr || c.fuelType).filter(Boolean))].sort() as string[];
    const allTrans = [...new Set(allCars.map(c => c.transmissionAr || c.transmission).filter(Boolean))].sort() as string[];
    const years = [...new Set(allCars.map(c => c.year).filter(Boolean))].sort((a, b) => b - a);

    /* ── Filtering ── */
    const filtered = allCars.filter(c => {
        const q = search.toLowerCase();
        if (q && !c.title.toLowerCase().includes(q) && !(c.makeAr || c.make).toLowerCase().includes(q) && !c.model.toLowerCase().includes(q)) return false;
        if (brandFilters.length && !brandFilters.includes(c.makeAr || c.make)) return false;
        if (yearFrom && c.year < Number(yearFrom)) return false;
        if (yearTo && c.year > Number(yearTo)) return false;
        if (fuelFilters.length && !fuelFilters.includes(c.fuelAr || c.fuelType || '')) return false;
        if (transFilters.length && !transFilters.includes(c.transmissionAr || c.transmission || '')) return false;
        if (sourceFilter !== 'all' && c.source !== sourceFilter) return false;
        const price = c.priceSar || c.price || 0;
        if (priceMax && price > Number(priceMax)) return false;
        if (kmMax && c.mileage > Number(kmMax)) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'price_asc') return (a.priceSar || a.price) - (b.priceSar || b.price);
        if (sortBy === 'price_desc') return (b.priceSar || b.price) - (a.priceSar || a.price);
        if (sortBy === 'km_asc') return a.mileage - b.mileage;
        return b.year - a.year;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
    const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);

    const clearFilters = () => {
        setSearch(''); setSearchInput(''); setBrandFilters([]); setYearFrom(''); setYearTo('');
        setFuelFilters([]); setTransFilters([]); setSourceFilter('all'); setPriceMax(''); setKmMax('');
        setPage(1);
    };
    const hasFilters = search || brandFilters.length || yearFrom || yearTo || fuelFilters.length || transFilters.length || sourceFilter !== 'all' || priceMax || kmMax;

    const handleWhatsApp = (car: CarItem) => {
        const phone = socialLinks?.whatsapp || '+821080880014';
        const url = WhatsAppService.generateCarLink(car as any, phone, isRTL, (p) => fmtPrice(p));
        window.open(url, '_blank');
    };

    /* ── Sidebar Component ── */
    const SidebarContent = () => (
        <div className="space-y-0" dir="rtl">
            {/* Source */}
            <FilterSection title="نوع المعرض" expanded={expandedSections.source} onToggle={() => toggleSection('source')}>
                {[
                    { val: 'all', label: 'الكل', icon: '🌐' },
                    { val: 'korean', label: 'المعرض الكوري', icon: '🇰🇷' },
                    { val: 'local', label: 'معرض HM CAR', icon: '🏢' },
                ].map(opt => (
                    <FilterOption key={opt.val} label={`${opt.icon} ${opt.label}`}
                        count={opt.val === 'all' ? allCars.length : allCars.filter(c => c.source === opt.val).length}
                        checked={sourceFilter === opt.val} onChange={() => { setSourceFilter(opt.val as any); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Brand */}
            <FilterSection title="الشركة المصنعة" expanded={expandedSections.brand} onToggle={() => toggleSection('brand')}>
                {allBrands.slice(0, 20).map(b => (
                    <FilterOption key={b} label={b}
                        count={allCars.filter(c => (c.makeAr || c.make) === b).length}
                        checked={brandFilters.includes(b)}
                        onChange={() => { setBrandFilters(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Year */}
            <FilterSection title="السنة" expanded={expandedSections.year} onToggle={() => toggleSection('year')}>
                <div className="flex gap-2 px-1 pt-1 pb-2">
                    <select value={yearTo} onChange={e => { setYearTo(e.target.value); setPage(1); }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white/60 outline-none">
                        <option value="">إلى</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={yearFrom} onChange={e => { setYearFrom(e.target.value); setPage(1); }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white/60 outline-none">
                        <option value="">من</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </FilterSection>

            {/* Fuel */}
            <FilterSection title="الوقود" expanded={expandedSections.fuel} onToggle={() => toggleSection('fuel')}>
                {allFuels.map(f => (
                    <FilterOption key={f} label={f}
                        count={allCars.filter(c => (c.fuelAr || c.fuelType) === f).length}
                        checked={fuelFilters.includes(f)}
                        onChange={() => { setFuelFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Transmission */}
            <FilterSection title="ناقل الحركة" expanded={expandedSections.trans} onToggle={() => toggleSection('trans')}>
                {allTrans.map(t => (
                    <FilterOption key={t} label={t}
                        count={allCars.filter(c => (c.transmissionAr || c.transmission) === t).length}
                        checked={transFilters.includes(t)}
                        onChange={() => { setTransFilters(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Price */}
            <FilterSection title="السعر (بالريال)" expanded={expandedSections.price} onToggle={() => toggleSection('price')}>
                <div className="px-1 pt-1 pb-2 space-y-2">
                    {['50000', '100000', '200000', '300000', '500000'].map(val => (
                        <FilterOption key={val} label={`أقل من ${Number(val).toLocaleString()} ر.س`}
                            checked={priceMax === val} onChange={() => { setPriceMax(priceMax === val ? '' : val); setPage(1); }} />
                    ))}
                </div>
            </FilterSection>

            {/* Mileage */}
            <FilterSection title="المسافة (كم)" expanded={expandedSections.km} onToggle={() => toggleSection('km')}>
                <div className="px-1 pt-1 pb-2">
                    {['50000', '100000', '150000', '200000'].map(val => (
                        <FilterOption key={val} label={`أقل من ${Number(val).toLocaleString()} كم`}
                            checked={kmMax === val} onChange={() => { setKmMax(kmMax === val ? '' : val); setPage(1); }} />
                    ))}
                </div>
            </FilterSection>

            {/* Apply button */}
            {hasFilters && (
                <div className="pt-3 pb-1 px-1">
                    <button onClick={clearFilters}
                        className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/10 text-xs font-bold transition-all">
                        مسح جميع الفلاتر
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className={cn('min-h-screen bg-[#08080f] text-white', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── Hero Banner ── */}
            <div className="relative pt-16 sm:pt-20">
                <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
                <div className="bg-gradient-to-b from-[#0e0e1a] to-[#08080f] py-5 sm:py-8 px-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter text-white uppercase">
                                HM <span className="text-[#C9A96E]">CAR</span>
                            </h1>
                            <p className="text-[10px] sm:text-sm font-medium tracking-[0.3em] text-white/30 mt-0.5">
                                {isRTL ? 'استعرض مئات السيارات بأفضل الأسعار' : 'Browse hundreds of cars at best prices'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-white/4 border border-white/8 rounded-xl px-3 py-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" />
                                <span className="text-[10px] sm:text-xs font-black text-white/50">
                                    {loading ? '...' : `${allCars.length.toLocaleString()} سيارة`}
                                </span>
                            </div>
                            <button onClick={fetchAllCars} title="تحديث" disabled={loading}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center hover:bg-white/8 transition-all disabled:opacity-50">
                                <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40", loading && "animate-spin")} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-3 sm:px-4 pb-32 lg:pb-12">

                {/* ── Search bar ── */}
                <div className="py-4">
                    <div className="relative flex items-center bg-[#111118] border border-white/8 rounded-2xl px-4 py-3 focus-within:border-[#C9A96E]/40 transition-all">
                        <Search className="w-4 h-4 text-white/25 shrink-0 ml-3" />
                        <input
                            type="text" value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                            placeholder="ابحث بالماركة أو الموديل أو السنة..."
                            className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-white/20"
                        />
                        {searchInput && (
                            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-all ml-2">
                                <X className="w-3.5 h-3.5 text-white/50" />
                            </button>
                        )}
                        <button
                            onClick={() => { setSearch(searchInput); setPage(1); }}
                            className="bg-[#C9A96E] hover:bg-[#b8934d] text-black font-black text-xs px-4 py-2 rounded-xl transition-all">
                            بحث
                        </button>
                    </div>
                </div>

                {/* ── Smart Filter Chips (Mobile Only — Auto-hidden on desktop) ── */}
                <div className="lg:hidden overflow-x-auto pb-1 -mx-1 px-1" dir="rtl">
                    <div className="flex gap-2 w-max py-1">
                        {/* Chip: Source */}
                        {['all', 'korean', 'local'].map(src => (
                            <button key={src}
                                onClick={() => { setSourceFilter(src as any); setPage(1); }}
                                className={cn(
                                    'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                                    sourceFilter === src
                                        ? 'bg-[#C9A96E] text-black border-[#C9A96E]'
                                        : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                                )}>
                                {src === 'all' ? '🌐 الكل' : src === 'korean' ? '🇰🇷 كوري' : '🏢 HM CAR'}
                            </button>
                        ))}

                        <div className="w-px bg-white/10 mx-0.5" />

                        {/* Chips: Brands (first 5) */}
                        {allBrands.slice(0, 6).map(b => (
                            <button key={b}
                                onClick={() => { setBrandFilters(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]); setPage(1); }}
                                className={cn(
                                    'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                                    brandFilters.includes(b)
                                        ? 'bg-[#C9A96E] text-black border-[#C9A96E]'
                                        : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                                )}>
                                {b}
                            </button>
                        ))}

                        <div className="w-px bg-white/10 mx-0.5" />

                        {/* Chips: Year ranges */}
                        {[['2022+', '2022', ''], ['2019-2021', '2019', '2021'], ['قبل 2019', '', '2018']].map(([label, from, to]) => (
                            <button key={label}
                                onClick={() => { setYearFrom(from); setYearTo(to); setPage(1); }}
                                className={cn(
                                    'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                                    yearFrom === from && yearTo === to && (from || to)
                                        ? 'bg-[#C9A96E] text-black border-[#C9A96E]'
                                        : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                                )}>
                                📅 {label}
                            </button>
                        ))}

                        <div className="w-px bg-white/10 mx-0.5" />

                        {/* Chips: Sort */}
                        {[{v: 'latest', l: '🕐 الأحدث'}, {v: 'price_asc', l: '💰 الأرخص'}, {v: 'price_desc', l: '💎 الأغلى'}, {v: 'km_asc', l: '📏 أقل كم'}].map(s => (
                            <button key={s.v}
                                onClick={() => { setSortBy(s.v as any); setPage(1); }}
                                className={cn(
                                    'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                                    sortBy === s.v
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                        : 'bg-white/5 text-white/50 border-white/10'
                                )}>
                                {s.l}
                            </button>
                        ))}

                        {/* Chip: Clear all */}
                        {hasFilters && (
                            <button onClick={clearFilters}
                                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                                ✕ مسح
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Results bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-2 mb-4">
                    <div className="text-xs text-white/30 font-bold">
                        <span className="text-[#C9A96E] font-black text-sm">{filtered.length.toLocaleString()}</span> نتيجة
                        {loading && <span className="mr-2 text-white/20">جاري التحديث...</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25 uppercase tracking-widest">الترتيب:</span>
                        <select value={sortBy} onChange={e => { setSortBy(e.target.value as any); setPage(1); }}
                            className="bg-[#111118] border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white/60 outline-none focus:border-[#C9A96E]/40">
                            <option value="latest">الأحدث</option>
                            <option value="price_asc">السعر: الأقل</option>
                            <option value="price_desc">السعر: الأعلى</option>
                            <option value="km_asc">العداد: الأقل</option>
                        </select>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className="flex gap-6 items-start">

                    {/* ══ Sidebar ══ */}
                    <aside className="hidden lg:block w-64 shrink-0 bg-[#0e0e1a] border border-white/6 rounded-2xl p-4 sticky top-24">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={clearFilters} className={cn("text-[10px] text-red-400/60 hover:text-red-400 transition-colors font-bold", !hasFilters && "invisible")}>
                                مسح الكل
                            </button>
                            <h2 className="text-xs font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A96E]" />
                                الفلاتر
                            </h2>
                        </div>
                        <SidebarContent />
                    </aside>

                    {/* ══ Cars Grid ══ */}
                    <div className="flex-1 min-w-0">
                        {loading && allCars.length === 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl bg-[#111118] border border-white/5 animate-pulse overflow-hidden">
                                        <div className="aspect-[4/3] sm:aspect-[16/9] bg-white/4" />
                                        <div className="p-3 space-y-2.5">
                                            <div className="flex gap-1.5">
                                                <div className="h-2.5 bg-white/5 rounded-full w-1/3" />
                                            </div>
                                            <div className="h-3.5 bg-white/6 rounded-full w-3/4" />
                                            <div className="flex gap-1.5">
                                                <div className="h-5 bg-white/4 rounded-lg w-16" />
                                                <div className="h-5 bg-white/4 rounded-lg w-14" />
                                            </div>
                                            <div className="h-8 bg-green-900/20 rounded-xl mt-1" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : paginated.length === 0 ? (
                            <div className="py-24 text-center border border-dashed border-white/8 rounded-2xl">
                                <Car className="w-14 h-14 text-white/8 mx-auto mb-4" />
                                <h2 className="text-lg font-black text-white/30 mb-2">لا توجد سيارات</h2>
                                <p className="text-xs text-white/20 mb-6">جرب تعديل الفلاتر</p>
                                <button onClick={clearFilters} className="px-6 py-2.5 bg-[#C9A96E] text-black text-xs font-black rounded-xl">
                                    مسح الفلاتر
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                                    {paginated.map((car, i) => (
                                        <CarCard key={`${car.source}-${car.id}-${i}`} car={car} onWhatsApp={handleWhatsApp} />
                                    ))}
                                </div>

                                {/* ── Pagination ── */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === totalPages}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black text-white/50 hover:bg-[#C9A96E] hover:text-black hover:border-[#C9A96E] disabled:opacity-20 transition-all">
                                            <ChevronLeft className="w-4 h-4" />
                                            التالي
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                                let p: number;
                                                if (totalPages <= 7) p = i + 1;
                                                else if (page <= 4) p = i + 1;
                                                else if (page >= totalPages - 3) p = totalPages - 6 + i;
                                                else p = page - 3 + i;
                                                return (
                                                    <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={cn(
                                                            "w-9 h-9 rounded-xl text-xs font-black transition-all",
                                                            p === page ? "bg-[#C9A96E] text-black shadow-[0_0_16px_rgba(201,169,110,0.4)]" : "bg-white/4 border border-white/8 text-white/40 hover:bg-white/10"
                                                        )}>
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            disabled={page === 1}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black text-white/50 hover:bg-[#C9A96E] hover:text-black hover:border-[#C9A96E] disabled:opacity-20 transition-all">
                                            السابق
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <p className="text-center text-[10px] text-white/15 mt-4">
                                    صفحة {page} من {totalPages} · إجمالي {filtered.length} سيارة
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Floating Filter Button (Mobile Only) ── */}
            <AnimatePresence>
                {!mobileSidebar && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={() => setMobileSidebar(true)}
                        className="lg:hidden fixed bottom-20 left-4 z-30 flex items-center gap-2 bg-[#C9A96E] text-black font-black text-xs px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(201,169,110,0.4)] hover:bg-[#b8934d] transition-all"
                        whileTap={{ scale: 0.95 }}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        الفلاتر
                        {hasFilters && (
                            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[9px]">
                                {[brandFilters, fuelFilters, transFilters].flat().length + (sourceFilter !== 'all' ? 1 : 0) + (yearFrom || yearTo ? 1 : 0) + (priceMax ? 1 : 0) + (kmMax ? 1 : 0)}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ── Mobile Sidebar Overlay ── */}
            <AnimatePresence>
                {mobileSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileSidebar(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" />
                        <motion.aside
                            initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className={cn(
                                "fixed top-0 h-full w-[300px] bg-[#0e0e1a] z-50 overflow-y-auto p-4 lg:hidden",
                                isRTL ? 'right-0 border-l border-white/10' : 'left-0 border-r border-white/10'
                            )}
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                <button onClick={() => setMobileSidebar(false)}
                                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-[#C9A96E]" />
                                    <h2 className="text-sm font-black text-white/80">الفلاتر</h2>
                                    {hasFilters && (
                                        <span className="text-[10px] font-black bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30 px-1.5 py-0.5 rounded-full">
                                            {[brandFilters, fuelFilters, transFilters].flat().length + (sourceFilter !== 'all' ? 1 : 0) + (yearFrom || yearTo ? 1 : 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <SidebarContent />
                            <div className="mt-4 flex gap-2">
                                {hasFilters && (
                                    <button onClick={() => { clearFilters(); setMobileSidebar(false); }}
                                        className="flex-1 py-2.5 border border-red-500/20 text-red-400/70 hover:bg-red-500/10 text-xs font-bold rounded-xl transition-all">
                                        مسح الكل
                                    </button>
                                )}
                                <button onClick={() => setMobileSidebar(false)}
                                    className="flex-1 py-2.5 bg-[#C9A96E] text-black font-black text-xs rounded-xl hover:bg-[#b8934d] transition-all">
                                    عرض {filtered.length.toLocaleString()} سيارة
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
