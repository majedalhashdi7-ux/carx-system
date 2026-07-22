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
import WatermarkImage from '@/components/WatermarkImage';
import Link from 'next/link';
import { WhatsAppService } from '@/lib/WhatsAppService';
import { getBrandDisplayName, formatCarTitle } from '@/lib/brandTranslations';

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

/* ─── Car Card — تصميم فاخر ─── */
function CarCard({ car, onWhatsApp }: { car: CarItem; onWhatsApp: (car: CarItem) => void }) {
    const [liked, setLiked] = useState(false);
    const [imgErr, setImgErr] = useState(false);
    const { isRTL } = useLanguage();
    const img = imgErr ? 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800' : resolveImg(car);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const favs = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            setLiked(favs.some((f: any) => f.id === car.id));
        }
    }, [car.id]);

    const toggleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const favs = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
        let updated;
        if (liked) {
            updated = favs.filter((f: any) => f.id !== car.id);
        } else {
            updated = [...favs, {
                id: car.id, type: 'car',
                title: car.title || car.model,
                price: car.priceSar || car.price || 0,
                image: resolveImg(car),
                brand: car.makeAr || car.make
            }];
        }
        localStorage.setItem('hm_favorites', JSON.stringify(updated));
        setLiked(!liked);
        window.dispatchEvent(new CustomEvent('hm_favorites_updated'));
    };

    const displayPrice = car.priceSar || car.price || 0;
    const rawMake      = car.makeAr || car.make || '';
    const displayName  = getBrandDisplayName(rawMake, isRTL);
    const displayTitle = formatCarTitle(car.title || `${rawMake} ${car.model} ${car.badge || ''}`, rawMake, isRTL);
    const fuelLabel    = car.fuelAr || car.fuelType || '';
    const transLabel   = car.transmissionAr || car.transmission || '';
    const isKorean     = car.source === 'korean';

    return (
        <Link href={`/cars/${car.id}`} className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
                className="group relative bg-[#0c0c14]/80 backdrop-blur-xl border border-white/[0.06] rounded-[24px] overflow-hidden hover:border-[#C9A96E]/50 transition-all duration-300 cursor-pointer h-full flex flex-col shadow-[0_12px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_rgba(201,169,110,0.12)]"
            >
                {/* ─── صورة السيارة ─── */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#07070c] shrink-0">
                    <WatermarkImage
                        src={img} alt={displayTitle} fill
                        className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        onError={() => setImgErr(true)}
                        unoptimized watermarkPosition="br"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c14] via-transparent to-black/30" />

                    {/* Year badge — top-left */}
                    <div className="absolute top-3 left-3 bg-[#C9A96E] text-black text-[10px] font-black px-2.5 py-[4px] rounded-lg leading-none shadow-md">
                        {car.year}
                    </div>

                    {/* Like button — top-right بتصميم شفاف أنيق */}
                    <button
                        onClick={toggleLike}
                        className={cn(
                            "absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-10 shadow-xl",
                            liked
                                ? "bg-red-500/80 border-red-400/60 shadow-red-500/40"
                                : "bg-black/30 border-white/20 hover:bg-red-500/30 hover:border-red-400/50"
                        )}
                    >
                        <Heart className={cn('w-4.5 h-4.5 transition-colors duration-300', liked ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-white/90 drop-shadow-md')} />
                    </button>

                    {/* Inspected badge */}
                    {car.isInspected && (
                        <div className="absolute bottom-3 left-3 bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-[8.5px] font-black px-2 py-[4px] rounded-lg backdrop-blur-md shadow-sm">
                            ✓ مفحوصة
                        </div>
                    )}
                </div>

                {/* ─── بيانات السيارة ─── */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                    {/* Source chip + brand */}
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            'text-[9px] font-black px-2 py-[4px] rounded-lg border leading-none uppercase tracking-wider',
                            isKorean
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20'
                        )}>
                            {isKorean ? (isRTL ? '🇰🇷 وارد كوري' : '🇰🇷 KOREAN IMPORT') : (isRTL ? '🏢 معرض HM CAR' : '🏢 HM SHOWROOM')}
                        </span>
                        <span className="text-[10px] font-black text-white/50">{displayName}</span>
                    </div>

                    {/* Model name — main title */}
                    <h3 className="text-sm sm:text-base font-black text-white leading-snug line-clamp-1 group-hover:text-[#C9A96E] transition-colors duration-300" title={displayTitle}>
                        {displayTitle}
                    </h3>

                    {/* Specs chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {car.mileage > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-white/50 bg-white/4 border border-white/5 px-2 py-[4px] rounded-lg">
                                <Gauge className="w-3 h-3 text-[#C9A96E]/60 shrink-0" />{fmtKm(car.mileage)}
                            </span>
                        )}
                        {fuelLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-white/50 bg-white/4 border border-white/5 px-2 py-[4px] rounded-lg">
                                <Fuel className="w-3 h-3 text-[#C9A96E]/60 shrink-0" />{fuelLabel}
                            </span>
                        )}
                        {transLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-white/50 bg-white/4 border border-white/5 px-2 py-[4px] rounded-lg">
                                <Settings2 className="w-3 h-3 text-[#C9A96E]/60 shrink-0" />{transLabel}
                            </span>
                        )}
                    </div>

                    {/* Price and CTA Row */}
                    <div className="mt-auto pt-3 border-t border-white/[0.05] flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{isRTL ? 'السعر' : 'Price'}</span>
                            <span className="text-base sm:text-lg font-black tracking-tight" style={{ background: 'linear-gradient(135deg,#C9A96E,#F5D9A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {displayPrice > 0
                                    ? fmtPrice(displayPrice)
                                    : <span className="text-xs text-white/40" style={{ WebkitTextFillColor: 'rgba(255,255,255,0.4)' }}>{isRTL ? 'اتصل للسعر' : 'Call for price'}</span>
                                }
                            </span>
                        </div>
                        
                        <button
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onWhatsApp(car); }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-[10.5px] font-black transition-all hover:scale-105 shrink-0"
                            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)', boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white shrink-0">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            {isRTL ? 'استفسار' : 'Inquire'}
                        </button>
                    </div>
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
    const [showFilters, setShowFilters] = useState(false);

    const toggleSection = (key: string) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

    /* ── Fetch merged cars ── */
    const fetchAllCars = useCallback(async () => {
        setLoading(true);
        try {
            // Single unified fetch - gets all cars (local + imported) from one endpoint
            const res = await api.cars.list({ limit: 300, isActive: true });
            
            const merged: CarItem[] = [];

            if (res.success) {
                const carsData = res.data?.cars || (Array.isArray(res.data) ? res.data : []);
                carsData.forEach((c: any) => {
                    if (c.isSold || c.isActive === false) return;
                    const price = Number(c.price) || Number(c.priceSar) || 0;
                    const priceUsd = Number(c.priceUsd) || Number(c.usdPrice) || (Number(c.priceKrw) / (Number(currency.usdToKrw) || 1350));
                    const isKoreanImport = c.source === 'korean_import' || c.listingType === 'showroom' || (c.priceKrw && Number(c.priceKrw) > 0) || (c.externalUrl && String(c.externalUrl).includes('encar'));
                    merged.push({
                        id: String(c._id || c.id),
                        title: c.title || `${c.makeAr || c.make} ${c.model} ${c.year}`,
                        titleKr: c.titleKr,
                        make: c.make || '',
                        makeAr: c.makeAr || c.make,
                        model: c.model || '',
                        badge: c.badge || '',
                        year: Number(c.year) || 0,
                        mileage: Number(c.mileage) || 0,
                        fuelType: c.fuelType || c.fuel,
                        fuelAr: c.fuelAr || c.fuelType || c.fuel,
                        transmission: c.transmission,
                        transmissionAr: c.transmissionAr || c.transmission,
                        color: c.color,
                        seats: c.seats,
                        bodyType: c.bodyType,
                        price: isKoreanImport ? (priceUsd * (Number(currency.usdToSar) || 3.75)) : price,
                        priceUsd: isKoreanImport ? priceUsd : undefined,
                        priceSar: isKoreanImport ? (c.priceSar || priceUsd * (Number(currency.usdToSar) || 3.75)) : price,
                        images: Array.isArray(c.images) ? c.images : [c.imageUrl].filter(Boolean),
                        imageUrl: c.imageUrl || c.images?.[0],
                        source: isKoreanImport ? 'korean' : 'local',
                        isInspected: Boolean(c.isInspected),
                        encarUrl: c.encarUrl,
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
            <FilterSection title={isRTL ? "نوع المعرض" : "Showroom Type"} expanded={expandedSections.source} onToggle={() => toggleSection('source')}>
                {[
                    { val: 'all', label: isRTL ? 'الكل' : 'All', icon: '🌐' },
                    { val: 'korean', label: isRTL ? 'المعرض الكوري' : 'Korean Showroom', icon: '🇰🇷' },
                    { val: 'local', label: isRTL ? 'معرض HM CAR' : 'HM CAR Showroom', icon: '🏢' },
                ].map(opt => (
                    <FilterOption key={opt.val} label={`${opt.icon} ${opt.label}`}
                        count={opt.val === 'all' ? allCars.length : allCars.filter(c => c.source === opt.val).length}
                        checked={sourceFilter === opt.val} onChange={() => { setSourceFilter(opt.val as any); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Brand */}
            <FilterSection title={isRTL ? "الشركة المصنعة" : "Manufacturer"} expanded={expandedSections.brand} onToggle={() => toggleSection('brand')}>
                {allBrands.slice(0, 20).map(b => (
                    <FilterOption key={b} label={b}
                        count={allCars.filter(c => (c.makeAr || c.make) === b).length}
                        checked={brandFilters.includes(b)}
                        onChange={() => { setBrandFilters(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Year */}
            <FilterSection title={isRTL ? "السنة" : "Year"} expanded={expandedSections.year} onToggle={() => toggleSection('year')}>
                <div className="flex gap-2 px-1 pt-1 pb-2">
                    <select value={yearTo} onChange={e => { setYearTo(e.target.value); setPage(1); }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white/60 outline-none">
                        <option value="">{isRTL ? 'إلى' : 'To'}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={yearFrom} onChange={e => { setYearFrom(e.target.value); setPage(1); }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white/60 outline-none">
                        <option value="">{isRTL ? 'من' : 'From'}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </FilterSection>

            {/* Fuel */}
            <FilterSection title={isRTL ? "الوقود" : "Fuel"} expanded={expandedSections.fuel} onToggle={() => toggleSection('fuel')}>
                {allFuels.map(f => (
                    <FilterOption key={f} label={f}
                        count={allCars.filter(c => (c.fuelAr || c.fuelType) === f).length}
                        checked={fuelFilters.includes(f)}
                        onChange={() => { setFuelFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Transmission */}
            <FilterSection title={isRTL ? "ناقل الحركة" : "Transmission"} expanded={expandedSections.trans} onToggle={() => toggleSection('trans')}>
                {allTrans.map(t => (
                    <FilterOption key={t} label={t}
                        count={allCars.filter(c => (c.transmissionAr || c.transmission) === t).length}
                        checked={transFilters.includes(t)}
                        onChange={() => { setTransFilters(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]); setPage(1); }} />
                ))}
            </FilterSection>

            {/* Price */}
            <FilterSection title={isRTL ? "السعر (بالريال)" : "Price (SAR)"} expanded={expandedSections.price} onToggle={() => toggleSection('price')}>
                <div className="px-1 pt-1 pb-2 space-y-2">
                    {['50000', '100000', '200000', '300000', '500000'].map(val => (
                        <FilterOption key={val} label={isRTL ? `أقل من ${Number(val).toLocaleString()} ر.س` : `Less than ${Number(val).toLocaleString()} SAR`}
                            checked={priceMax === val} onChange={() => { setPriceMax(priceMax === val ? '' : val); setPage(1); }} />
                    ))}
                </div>
            </FilterSection>

            {/* Mileage */}
            <FilterSection title={isRTL ? "المسافة (كم)" : "Mileage (KM)"} expanded={expandedSections.km} onToggle={() => toggleSection('km')}>
                <div className="px-1 pt-1 pb-2">
                    {['50000', '100000', '150000', '200000'].map(val => (
                        <FilterOption key={val} label={isRTL ? `أقل من ${Number(val).toLocaleString()} كم` : `Less than ${Number(val).toLocaleString()} KM`}
                            checked={kmMax === val} onChange={() => { setKmMax(kmMax === val ? '' : val); setPage(1); }} />
                    ))}
                </div>
            </FilterSection>

            {/* Apply button */}
            {hasFilters && (
                <div className="pt-3 pb-1 px-1">
                    <button onClick={clearFilters}
                        className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/10 text-xs font-bold transition-all">
                        {isRTL ? 'مسح جميع الفلاتر' : 'Clear All Filters'}
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
                                    {loading ? '...' : isRTL ? `${allCars.length.toLocaleString()} سيارة` : `${allCars.length.toLocaleString()} cars`}
                                </span>
                            </div>
                            <button onClick={fetchAllCars} title={isRTL ? 'تحديث' : 'Refresh'} disabled={loading}
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
                    <div className="relative flex items-center gap-2 bg-[#111118] border border-white/8 rounded-2xl px-4 py-3 focus-within:border-[#C9A96E]/40 transition-all">
                        <Search className="w-4 h-4 text-white/25 shrink-0 ml-1" />
                        <input
                            type="text" value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
                            placeholder={isRTL ? "ابحث بالماركة أو الموديل أو السنة..." : "Search by brand, model, or year..."}
                            className="flex-1 bg-transparent outline-none text-sm font-medium text-white placeholder:text-white/20"
                        />
                        {searchInput && (
                            <button onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-all ml-1">
                                <X className="w-3.5 h-3.5 text-white/50" />
                            </button>
                        )}
                        <button
                            onClick={() => { setSearch(searchInput); setPage(1); }}
                            className="bg-[#C9A96E] hover:bg-[#b8934d] text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shrink-0">
                            {isRTL ? 'بحث' : 'Search'}
                        </button>
                        
                        {/* Toggle Filters Button for Mobile */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all border shrink-0",
                                showFilters 
                                    ? "bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/30" 
                                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {isRTL ? 'تصفية' : 'Filter'}
                        </button>
                    </div>
                </div>

                {/* ── Smart Filter Chips (Mobile Only — Collapsible) ── */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="lg:hidden overflow-hidden mb-4 bg-[#111118]/40 border border-white/5 rounded-2xl p-3"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">{isRTL ? 'الفلاتر السريعة' : 'Quick Filters'}</span>
                                <button 
                                    onClick={() => setMobileSidebar(true)}
                                    className="text-[11px] font-black text-[#C9A96E] hover:underline flex items-center gap-1"
                                >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    {isRTL ? 'فلاتر متقدمة' : 'Advanced Filters'}
                                </button>
                            </div>
                            <div className="overflow-x-auto pb-1 -mx-1 px-1" dir="rtl">
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
                                            {src === 'all' ? (isRTL ? '🌐 الكل' : '🌐 All') : src === 'korean' ? (isRTL ? '🇰🇷 كوري' : '🇰🇷 Korean') : '🏢 HM CAR'}
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
                                    {[
                                        [isRTL ? 'جديد (2022+)' : 'New (2022+)', '2022', ''], 
                                        ['2019-2021', '2019', '2021'], 
                                        [isRTL ? 'قبل 2019' : 'Before 2019', '', '2018']
                                    ].map(([label, from, to]) => (
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
                                    {[
                                        {v: 'latest', l: isRTL ? '🕐 الأحدث' : '🕐 Latest'}, 
                                        {v: 'price_asc', l: isRTL ? '💰 الأرخص' : '💰 Cheapest'}, 
                                        {v: 'price_desc', l: isRTL ? '💎 الأغلى' : '💎 Most Expensive'}, 
                                        {v: 'km_asc', l: isRTL ? '📏 أقل كم' : '📏 Lowest KM'}
                                    ].map(s => (
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
                                            ✕ {isRTL ? 'مسح' : 'Clear'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Results bar ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-2 mb-4">
                    <div className="text-xs text-white/30 font-bold">
                        <span className="text-[#C9A96E] font-black text-sm">{filtered.length.toLocaleString()}</span> {isRTL ? 'نتيجة' : 'results'}
                        {loading && <span className="mr-2 text-white/20">{isRTL ? 'جاري التحديث...' : 'Updating...'}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/25 uppercase tracking-widest">{isRTL ? 'الترتيب:' : 'Sort by:'}</span>
                        <select value={sortBy} onChange={e => { setSortBy(e.target.value as any); setPage(1); }}
                            className="bg-[#111118] border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white/60 outline-none focus:border-[#C9A96E]/40">
                            <option value="latest">{isRTL ? 'الأحدث' : 'Latest'}</option>
                            <option value="price_asc">{isRTL ? 'السعر: الأقل' : 'Price: Low to High'}</option>
                            <option value="price_desc">{isRTL ? 'السعر: الأعلى' : 'Price: High to Low'}</option>
                            <option value="km_asc">{isRTL ? 'العداد: الأقل' : 'KM: Low to High'}</option>
                        </select>
                    </div>
                </div>

                {/* ── Main Layout ── */}
                <div className="flex gap-6 items-start">

                    {/* ══ Sidebar ══ */}
                    <aside className="hidden lg:block w-64 shrink-0 bg-[#0e0e1a] border border-white/6 rounded-2xl p-4 sticky top-24">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={clearFilters} className={cn("text-[10px] text-red-400/60 hover:text-red-400 transition-colors font-bold", !hasFilters && "invisible")}>
                                {isRTL ? 'مسح الكل' : 'Clear All'}
                            </button>
                            <h2 className="text-xs font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A96E]" />
                                {isRTL ? 'الفلاتر' : 'Filters'}
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
                                <h2 className="text-lg font-black text-white/30 mb-2">{isRTL ? 'لا توجد سيارات' : 'No Cars Found'}</h2>
                                <p className="text-xs text-white/20 mb-6">{isRTL ? 'جرب تعديل الفلاتر' : 'Try adjusting the filters'}</p>
                                <button onClick={clearFilters} className="px-6 py-2.5 bg-[#C9A96E] text-black text-xs font-black rounded-xl">
                                    {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                                    {paginated.map((car, i) => (
                                        <CarCard key={`${car.source}-${car.id}-${i}`} car={car} onWhatsApp={handleWhatsApp} />
                                    ))}
                                </div>

                                {/* ── Pagination بالنمط الدائري الأنيق ── */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex flex-col items-center gap-3">
                                        <div className="flex items-center justify-center gap-2 flex-wrap" dir="ltr">
                                            {/* Previous Button - Arrow < */}
                                            <button
                                                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={page === 1}
                                                className="w-11 h-11 rounded-2xl border border-[#C9A96E]/30 bg-[#121018] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-black disabled:opacity-20 flex items-center justify-center transition-all shadow-md active:scale-95"
                                                title={isRTL ? 'السابق' : 'Previous'}
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>

                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p: number;
                                                if (totalPages <= 5) p = i + 1;
                                                else if (page <= 3) p = i + 1;
                                                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                                else p = page - 2 + i;
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={cn(
                                                            "min-w-[44px] h-11 px-3 rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center border",
                                                            p === page
                                                                ? "bg-[#d97706] text-white border-[#d97706] shadow-[0_0_20px_rgba(217,119,6,0.5)] scale-105"
                                                                : "bg-[#161420] border-white/10 text-[#fef08a] hover:bg-[#C9A96E]/20 hover:border-[#C9A96E]/50"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}

                                            {/* Ellipsis if totalPages > 5 */}
                                            {totalPages > 5 && page < totalPages - 2 && (
                                                <>
                                                    <span className="text-white/30 text-xs px-1">...</span>
                                                    <button
                                                        onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className="min-w-[44px] h-11 px-3 rounded-2xl text-xs font-black bg-[#161420] border border-white/10 text-[#fef08a] hover:bg-[#C9A96E]/20 transition-all flex items-center justify-center"
                                                    >
                                                        {totalPages}
                                                    </button>
                                                </>
                                            )}

                                            {/* Next Button - Arrow > */}
                                            <button
                                                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                disabled={page === totalPages}
                                                className="w-11 h-11 rounded-2xl border border-[#C9A96E]/30 bg-[#121018] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-black disabled:opacity-20 flex items-center justify-center transition-all shadow-md active:scale-95"
                                                title={isRTL ? 'التالي' : 'Next'}
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <p className="text-center text-xs font-bold text-[#C9A96E]/80">
                                            {isRTL ? `صفحة ${page} من ${totalPages.toLocaleString()}` : `Page ${page} of ${totalPages.toLocaleString()}`}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>



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
                                    <h2 className="text-sm font-black text-white/80">{isRTL ? 'الفلاتر' : 'Filters'}</h2>
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
                                        {isRTL ? 'مسح الكل' : 'Clear All'}
                                    </button>
                                )}
                                <button onClick={() => setMobileSidebar(false)}
                                    className="flex-1 py-2.5 bg-[#C9A96E] text-black font-black text-xs rounded-xl hover:bg-[#b8934d] transition-all">
                                    {isRTL ? `عرض ${filtered.length.toLocaleString()} سيارة` : `Show ${filtered.length.toLocaleString()} cars`}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
