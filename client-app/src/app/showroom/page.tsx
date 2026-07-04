'use client';

/* oxlint-disable react-native/no-raw-text, tailwindcss/no-unnecessary-arbitrary-value */
/* eslint-disable */

/**
 * صفحة المعرض - The Showroom
 * ──────────────────────────
 * تعرض سيارات كورية من موقع Encar.com + سيارات المعرض المحلي HM CAR
 * مع قسم المزادات المباشرة التي يضيفها الأدمن
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    Car, MessageCircle, Search,
    ChevronLeft, ChevronRight, RefreshCw,
    MapPin, Gauge, Fuel, Settings2, Sparkles,
    ExternalLink, X, ArrowLeft, Heart, ShoppingBag,
    Gavel, SlidersHorizontal, Filter, Zap, Star,
    Clock, TrendingUp, Building2, Globe, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api-original';
import { WhatsAppService } from '@/lib/WhatsAppService';
import Image from 'next/image';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useRouter } from 'next/navigation';
import UltraModernCarCard from '@/components/UltraModernCarCard';
import { useTenant } from '@/lib/TenantContext';
import { getTenantApiUrl } from '@/lib/tenant-config';

const rawText = (value: string) => value;

// ─── نوع بيانات السيارة الكورية ───
interface KoreanCar {
    id: string;
    manufacturer: string;
    manufacturerAr: string;
    model: string;
    badge: string;
    title: string;
    titleKr: string;
    year: number;
    mileage: number;
    priceKrw: number;
    priceUsd?: number;
    priceSar?: number;
    fuel: string;
    fuelAr: string;
    transmission: string;
    transmissionAr: string;
    region: string;
    regionAr: string;
    imageUrl: string | null;
    images?: string[];
    image?: string | null;
    makeLogoUrl?: string;
    encarUrl: string;
    isInspected: boolean;
    source?: 'korean_import' | 'hm_local';
}

// ─── نوع بيانات سيارة المعرض المحلي ───
interface LocalCar {
    _id: string;
    make: string;
    makeAr?: string;
    model: string;
    modelAr?: string;
    year: number;
    price: number;
    images?: string[];
    imageUrl?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    description?: string;
    isActive?: boolean;
    isSold?: boolean;
    source?: string;
    category?: string;
    condition?: string;
}

// ─── نوع بيانات المزاد ───
interface LiveAuction {
    _id: string;
    title?: string;
    car?: {
        make?: string;
        makeAr?: string;
        model?: string;
        year?: number;
        images?: string[];
        imageUrl?: string;
    };
    currentBid?: number;
    startingBid?: number;
    endDate?: string;
    status?: string;
    isActive?: boolean;
    bidsCount?: number;
    externalUrl?: string;
    description?: string;
    imageUrl?: string;
}

function resolveCarImage(car: KoreanCar): string {
    let candidate = car.imageUrl || car.images?.[0] || car.image || null;
    if (!candidate || typeof candidate !== 'string') {
        return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
    }
    let url = candidate.trim();
    if (!url) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
    if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
        url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
    }
    if (url.endsWith('_')) {
        return url.startsWith('http') ? `${url}001.jpg` : `https://ci.encar.com${url}001.jpg`;
    }
    if (url.startsWith('/carpicture')) return `https://ci.encar.com${url}`;
    if (url.startsWith('/') && !url.startsWith('http')) return `https://ci.encar.com/carpicture${url}`;
    return url;
}

function formatMileage(km: number): string {
    if (km >= 10000) return `${(km / 10000).toFixed(1)} 만km`;
    return `${km.toLocaleString()} km`;
}

// ─── كارد المزاد المباشر ───
function LiveAuctionCard({ auction, isRTL }: { auction: LiveAuction; isRTL: boolean }) {
    const img = auction.imageUrl || auction.car?.images?.[0] || auction.car?.imageUrl || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800';
    const carName = isRTL
        ? `${auction.car?.makeAr || auction.car?.make || ''} ${auction.car?.model || ''} ${auction.car?.year || ''}`.trim()
        : `${auction.car?.make || ''} ${auction.car?.model || ''} ${auction.car?.year || ''}`.trim();
    const title = auction.title || carName || (isRTL ? 'مزاد حصري' : 'Exclusive Auction');
    const currentPrice = auction.currentBid || auction.startingBid || 0;

    const endDate = auction.endDate ? new Date(auction.endDate) : null;
    const now = new Date();
    const diffMs = endDate ? endDate.getTime() - now.getTime() : 0;
    const diffHrs = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const diffMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-gradient-to-br from-amber-950/30 via-zinc-900 to-black border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-400/40 transition-all duration-300 flex flex-col cursor-pointer"
        >
            <div className="relative h-44 overflow-hidden bg-zinc-900">
                <Image src={img} alt={title} fill sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    {isRTL ? 'مزاد مباشر' : 'LIVE'}
                </div>
                {endDate && diffMs > 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-400">
                        <Clock className="w-3 h-3" />
                        {diffHrs}h {diffMins}m
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-1 gap-3">
                <div>
                    <div className="text-[9px] text-amber-400/70 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Gavel className="w-3 h-3" />
                        {isRTL ? 'مزاد' : 'Auction'}
                    </div>
                    <h3 className="text-sm font-black text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
                        {title}
                    </h3>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                    <div>
                        <div className="text-[9px] text-amber-400/60 uppercase tracking-widest mb-0.5">{isRTL ? 'السعر الحالي' : 'Current Bid'}</div>
                        <div className="text-lg font-black text-amber-400">
                            {currentPrice > 0 ? `${currentPrice.toLocaleString()} ر.س` : (isRTL ? 'لم يبدأ' : 'No bids')}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-white/30 uppercase tracking-widest mb-0.5">{isRTL ? 'عروض' : 'Bids'}</div>
                        <div className="text-sm font-black text-white/60">{auction.bidsCount || 0}</div>
                    </div>
                </div>

                {auction.externalUrl ? (
                    <a href={auction.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Gavel className="w-3.5 h-3.5" />
                        {isRTL ? 'المشاركة في المزاد' : 'Join Auction'}
                    </a>
                ) : (
                    <Link href={`/auctions`}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        <Gavel className="w-3.5 h-3.5" />
                        {isRTL ? 'المشاركة في المزاد' : 'Join Auction'}
                    </Link>
                )}
            </div>
        </motion.div>
    );
}

// ─── مودال تفاصيل السيارة ───
function CarModal({ car, onClose, onContact, isRTL, priceText }: {
    car: KoreanCar;
    onClose: () => void;
    onContact: () => void;
    isRTL: boolean;
    priceText: string;
}) {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const carImage = resolveCarImage(car);
    const { currency, formatPriceFromUsd } = useSettings();
    const { tenant } = useTenant();
    const tenantApiUrl = getTenantApiUrl();
    const [selectedPort, setSelectedPort] = useState<'jeddah' | 'dammam' | 'dubai' | 'muscat'>('jeddah');
    const [showCalculator, setShowCalculator] = useState(false);

    const getModalImage = (index: number): string => {
        const img = car.images?.[index];
        if (!img) return carImage;
        return resolveCarImage({ ...car, imageUrl: img, images: [img] } as KoreanCar);
    };

    const getBaseUsd = (car: KoreanCar) => {
        const asAny = car as any;
        if (Number(asAny.priceUsd) > 0) return Number(asAny.priceUsd);
        if (Number(car.priceKrw) > 0) return Number(car.priceKrw) / Number(currency.usdToKrw || 1350);
        if (Number(asAny.priceSar) > 0) return Number(asAny.priceSar) / Number(currency.usdToSar || 3.75);
        return 0;
    };

    const carUsd = getBaseUsd(car);
    const ports = {
        jeddah: { label: isRTL ? 'ميناء جدة الإسلامي' : 'Jeddah Islamic Port', cost: 1200 },
        dammam: { label: isRTL ? 'ميناء الملك عبد العزيز بالدمام' : 'Dammam Port', cost: 1300 },
        dubai: { label: isRTL ? 'ميناء جبل علي دبي' : 'Jebel Ali Port Dubai', cost: 1400 },
        muscat: { label: isRTL ? 'ميناء السلطان قابوس مسقط' : 'Sultan Qaboos Port Muscat', cost: 1500 }
    };

    const shippingCostUsd = ports[selectedPort].cost;
    const customsUsd = (carUsd + shippingCostUsd) * 0.05;
    const vatUsd = (carUsd + shippingCostUsd + customsUsd) * 0.15;
    const totalUsd = carUsd + shippingCostUsd + customsUsd + vatUsd + 500;

    const detailsRows = [
        { label: rawText('السنة'), value: car.year.toString() },
        { label: rawText('المسافة'), value: formatMileage(car.mileage) },
        { label: rawText('الوقود'), value: car.fuelAr },
        { label: rawText('ناقل الحركة'), value: car.transmissionAr },
        { label: isRTL ? 'المنطقة' : 'Region', value: car.regionAr },
        { label: rawText('الفحص'), value: car.isInspected ? rawText('✅ مفحوصة') : rawText('غير مفحوص') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-cinematic-dark border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-y-auto max-h-[90vh] sm:max-h-[85vh] scrollbar-hide"
            >
                <div className="relative group/modal-img">
                    <div className="relative h-64 sm:h-72 bg-zinc-900">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
                                <Image src={getModalImage(activeImageIndex)} alt={car.title} fill className="object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'; }} />
                            </motion.div>
                        </AnimatePresence>
                        {tenant?.logo ? (
                            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-[0.12] select-none mix-blend-overlay"
                                style={{ backgroundImage: `url(${tenant.logo.startsWith('http') ? tenant.logo : tenantApiUrl + tenant.logo})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '45% auto' }} />
                        ) : (
                            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-[0.06] select-none">
                                <span className="text-white text-2xl font-bold tracking-widest uppercase rotate-12">{tenant?.name || 'HM CAR'}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-cinematic-dark via-transparent to-transparent" />
                        {car.images && car.images.length > 1 && (
                            <>
                                <button onClick={() => setActiveImageIndex(prev => (prev === 0 ? car.images!.length - 1 : prev - 1))}
                                    title={isRTL ? "السابق" : "Previous"}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/modal-img:opacity-100">
                                    <ChevronRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                </button>
                                <button onClick={() => setActiveImageIndex(prev => (prev === car.images!.length - 1 ? 0 : prev + 1))}
                                    title={isRTL ? "التالي" : "Next"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/modal-img:opacity-100">
                                    <ChevronLeft className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                </button>
                            </>
                        )}
                        <button onClick={onClose} title={isRTL ? "إغلاق" : "Close"}
                            className="absolute top-4 left-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/20 transition-all z-20">
                            <X className="w-5 h-5 text-white" />
                        </button>
                        {car.images && car.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                                {car.images.slice(0, 10).map((_, idx) => (
                                    <div key={idx} onClick={() => setActiveImageIndex(idx)}
                                        className={cn("w-1.5 h-1.5 rounded-full transition-all cursor-pointer", idx === activeImageIndex ? "bg-white w-4" : "bg-white/30")} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                            {car.source === 'hm_local' ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                            {car.source === 'hm_local' ? (isRTL ? 'معرض HM CAR المحلي' : 'HM CAR Local Showroom') : car.manufacturerAr}
                        </div>
                        <h2 className="text-2xl font-black text-white">{car.title}</h2>
                        <div className="text-xs text-white/30 mt-1">{car.titleKr}</div>
                    </div>

                    {/* مسار الشحن - فقط للسيارات الكورية */}
                    {car.source !== 'hm_local' && (
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-4 overflow-hidden relative">
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">{rawText('Seoul')}</span>
                                    <span className="text-[8px] text-white/30 font-bold">{rawText('Origin Port')}</span>
                                </div>
                                <div className="flex-1 px-4 relative">
                                    <div className="h-px bg-white/10 w-full" />
                                    <motion.div animate={{ left: ['0%', '100%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cinematic-dark px-2">
                                        <Car className="w-3 h-3 text-white/20" />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">{rawText('Destination')}</span>
                                    <span className="text-[8px] text-white/30 font-bold">{rawText('Port of Entry')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {detailsRows.map(({ label, value }) => (
                            <div key={label} className="bg-white/3 border border-white/5 p-3 rounded-xl">
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{label}</div>
                                <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* حاسبة الاستيراد - فقط للكورية */}
                    {car.source !== 'hm_local' && (
                        <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-3">
                            <button type="button" onClick={() => setShowCalculator(!showCalculator)}
                                className="w-full flex items-center justify-between text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                <span>{isRTL ? '🧮 حاسبة تكاليف الاستيراد الكلية' : '🧮 Total Import Cost Calculator'}</span>
                                <span className="text-base">{showCalculator ? '−' : '+'}</span>
                            </button>
                            {showCalculator && (
                                <div className="space-y-3 pt-3 border-t border-white/5 text-xs">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-white/30 font-bold uppercase">{isRTL ? 'ميناء الوصول' : 'Destination Port'}</label>
                                        <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value as any)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/70 outline-none text-[11px] font-bold">
                                            <option value="jeddah">{isRTL ? 'ميناء جدة الإسلامي (السعودية)' : 'Jeddah Islamic Port (KSA)'}</option>
                                            <option value="dammam">{isRTL ? 'ميناء الملك عبد العزيز بالدمام (السعودية)' : 'Dammam Port (KSA)'}</option>
                                            <option value="dubai">{isRTL ? 'ميناء جبل علي (الإمارات)' : 'Jebel Ali Port (UAE)'}</option>
                                            <option value="muscat">{isRTL ? 'ميناء السلطان قابوس (عُمان)' : 'Sultan Qaboos Port (Oman)'}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
                                        {[
                                            [isRTL ? 'سعر السيارة في كوريا' : 'Car Price in Korea', carUsd],
                                            [isRTL ? 'تكلفة الشحن البحري' : 'Ocean Shipping', shippingCostUsd],
                                            [isRTL ? 'الجمارك (5%)' : 'Customs Duty (5%)', customsUsd],
                                            [isRTL ? 'ضريبة القيمة المضافة (15%)' : 'VAT (15%)', vatUsd],
                                            [isRTL ? 'رسوم الميناء والتخليص' : 'Clearance & Port Fees', 500],
                                        ].map(([label, val]) => (
                                            <div key={label as string} className="flex justify-between text-white/40">
                                                <span>{label}</span>
                                                <span className="font-bold text-white/60">{formatPriceFromUsd(val as number)}</span>
                                            </div>
                                        ))}
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex justify-between text-blue-400 font-bold text-sm">
                                            <span>{isRTL ? 'التكلفة الإجمالية التقريبية' : 'Approx. Landed Cost'}</span>
                                            <span className="text-white font-black">{formatPriceFromUsd(totalUsd)}</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-white/20 italic text-center leading-tight">
                                        {isRTL ? '*التكلفة أعلاه تقديرية.' : '*The cost above is approximate.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <div className="text-[9px] text-blue-400 uppercase tracking-widest">{isRTL ? 'السعر التقديري' : 'Price Estimation'}</div>
                        <div className="text-3xl font-black text-white mt-1">{priceText}</div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onContact}
                            className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <MessageCircle className="w-4 h-4" />
                            {rawText('تواصل للشراء')}
                        </button>
                        {car.source !== 'hm_local' && car.encarUrl && (
                            <a href={car.encarUrl} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-3.5 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all flex items-center gap-2 text-sm font-bold">
                                <ExternalLink className="w-4 h-4" />
                                {rawText('الإعلان')}
                            </a>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── الصفحة الرئيسية ───
export default function ShowroomPage() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const { socialLinks, currency, formatPriceFromUsd } = useSettings();

    // بيانات السيارات الكورية
    const [koreanCars, setKoreanCars] = useState<KoreanCar[]>([]);
    const [loadingKorean, setLoadingKorean] = useState(true);
    const [koreanPage, setKoreanPage] = useState(1);
    const [koreanTotalPages, setKoreanTotalPages] = useState(1);
    const [koreanTotal, setKoreanTotal] = useState(0);

    // بيانات سيارات المعرض المحلي
    const [localCars, setLocalCars] = useState<LocalCar[]>([]);
    const [loadingLocal, setLoadingLocal] = useState(true);

    // بيانات المزادات
    const [auctions, setAuctions] = useState<LiveAuction[]>([]);
    const [loadingAuctions, setLoadingAuctions] = useState(true);

    // حالة التحكم في العرض
    const [activeTab, setActiveTab] = useState<'all' | 'korean' | 'local' | 'auctions'>('all');
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const [ping, setPing] = useState(48);

    // البحث المتقدم
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'mileage_low' | 'price_high'>('latest');
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // شجرة الفلاتر
    const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
    const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>({});
    const [modelFilter, setModelFilter] = useState('');
    const [badgeFilter, setBadgeFilter] = useState('');

    const [selectedCar, setSelectedCar] = useState<KoreanCar | null>(null);

    // ─ جلب السيارات الكورية ─
    const fetchKoreanCars = useCallback(async (p: number) => {
        setLoadingKorean(true);
        try {
            const res = await api.showroom.getCars(p);
            if (res.success) {
                setKoreanCars(res.data?.map((c: any) => ({ ...c, source: 'korean_import' })) || []);
                setKoreanTotalPages(res.totalPages || 1);
                setKoreanTotal(res.total || 0);
                setPing(Math.floor(Math.random() * 20) + 40);
            } else {
                setError(res.message || 'فشل تحميل السيارات');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'فشل الاتصال بالخادم');
        } finally {
            setLoadingKorean(false);
        }
    }, []);

    // ─ جلب السيارات المحلية ─
    const fetchLocalCars = useCallback(async () => {
        setLoadingLocal(true);
        try {
            const res = await api.cars.list({ status: 'available', limit: 50, isActive: true });
            const cars = res?.data || res?.cars || [];
            setLocalCars(Array.isArray(cars) ? cars.filter((c: any) => !c.isSold && c.isActive !== false) : []);
        } catch (err) {
            console.error('Failed to load local cars:', err);
            setLocalCars([]);
        } finally {
            setLoadingLocal(false);
        }
    }, []);

    // ─ جلب المزادات ─
    const fetchAuctions = useCallback(async () => {
        setLoadingAuctions(true);
        try {
            const res = await api.auctions.list({ status: 'active', limit: 6 });
            const items = res?.data || res?.auctions || [];
            setAuctions(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error('Failed to load auctions:', err);
            setAuctions([]);
        } finally {
            setLoadingAuctions(false);
        }
    }, []);

    useEffect(() => {
        fetchKoreanCars(koreanPage);
    }, [koreanPage, refreshKey, fetchKoreanCars]);

    useEffect(() => {
        fetchLocalCars();
        fetchAuctions();
    }, [refreshKey, fetchLocalCars, fetchAuctions]);

    // إغلاق الاقتراحات عند النقر خارج
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // اقتراحات البحث
    useEffect(() => {
        if (search.length < 2) { setSearchSuggestions([]); return; }
        const q = search.toLowerCase();
        const allTerms = new Set<string>();
        koreanCars.forEach(c => {
            if (c.manufacturerAr?.toLowerCase().includes(q)) allTerms.add(c.manufacturerAr);
            if (c.model?.toLowerCase().includes(q)) allTerms.add(c.model);
            if (c.title?.toLowerCase().includes(q)) allTerms.add(c.title);
        });
        localCars.forEach(c => {
            const make = c.makeAr || c.make;
            if (make?.toLowerCase().includes(q)) allTerms.add(make);
            if (c.model?.toLowerCase().includes(q)) allTerms.add(c.model);
        });
        setSearchSuggestions(Array.from(allTerms).slice(0, 6));
        setShowSuggestions(true);
    }, [search, koreanCars, localCars]);

    // استعادة الفلاتر من URL
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qp = new URLSearchParams(window.location.search);
        setSearch(qp.get('q') || '');
        setYearFrom(qp.get('from') || '');
        setYearTo(qp.get('to') || '');
        setBrandFilter(qp.get('brand') || '');
        setModelFilter(qp.get('model') || '');
        setBadgeFilter(qp.get('badge') || '');
        const s = qp.get('sort');
        if (s === 'latest' || s === 'mileage_low' || s === 'price_high') setSortBy(s);
    }, []);

    // مزامنة URL
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qp = new URLSearchParams();
        if (search) qp.set('q', search);
        if (yearFrom) qp.set('from', yearFrom);
        if (yearTo) qp.set('to', yearTo);
        if (brandFilter) qp.set('brand', brandFilter);
        if (modelFilter) qp.set('model', modelFilter);
        if (badgeFilter) qp.set('badge', badgeFilter);
        if (sortBy !== 'latest') qp.set('sort', sortBy);
        const qs = qp.toString();
        window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }, [search, yearFrom, yearTo, brandFilter, modelFilter, badgeFilter, sortBy]);

    const getBaseUsd = (car: KoreanCar) => {
        const asAny = car as any;
        if (Number(asAny.priceUsd) > 0) return Number(asAny.priceUsd);
        if (Number(car.priceKrw) > 0) return Number(car.priceKrw) / Number(currency.usdToKrw || 1);
        if (Number(asAny.priceSar) > 0) return Number(asAny.priceSar) / Number(currency.usdToSar || 1);
        return 0;
    };

    const openWhatsApp = async (car: KoreanCar) => {
        ReactGA.event({ category: 'Conversion', action: 'Showroom_WhatsApp_Click', label: car.title });
        try {
            let buyerName = '', buyerPhone = '';
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    const u = JSON.parse(userJson);
                    buyerName = u?.name || '';
                    buyerPhone = u?.phone || '';
                }
            }
            api.concierge.create({
                type: 'car', name: buyerName || 'عميل زائر', phone: buyerPhone || '000',
                carName: car.manufacturerAr || car.manufacturer, model: car.model,
                year: String(car.year || ''), source: car.source === 'hm_local' ? 'hm_local' : 'korean_showroom',
                contactPreference: 'whatsapp', externalUrl: car.encarUrl,
                description: `طلب شراء: ${car.title} | السعر: ${formatPriceFromUsd(getBaseUsd(car))}`,
            }).catch(() => {});
        } catch { }
        const url = WhatsAppService.generateCarLink(car as unknown as Record<string, unknown>, socialLinks?.whatsapp || '', isRTL, formatPriceFromUsd);
        window.open(url, '_blank');
        setSelectedCar(null);
    };

    // تحويل السيارة المحلية لنوع KoreanCar للمودال
    const localCarToKorean = (c: LocalCar): KoreanCar => ({
        id: c._id,
        manufacturer: c.make,
        manufacturerAr: c.makeAr || c.make,
        model: c.model,
        badge: '',
        title: `${c.makeAr || c.make} ${c.model} ${c.year}`,
        titleKr: `${c.make} ${c.model} ${c.year}`,
        year: c.year,
        mileage: c.mileage || 0,
        priceKrw: 0,
        priceUsd: c.price / (Number(currency.usdToSar) || 3.75),
        priceSar: c.price,
        fuel: c.fuelType || 'بنزين',
        fuelAr: c.fuelType || 'بنزين',
        transmission: c.transmission || '',
        transmissionAr: c.transmission || '',
        region: '',
        regionAr: '',
        imageUrl: c.imageUrl || c.images?.[0] || null,
        images: c.images || [],
        encarUrl: '',
        isInspected: false,
        source: 'hm_local',
    });

    // الفلترة الموحدة
    const allKoreanFiltered = koreanCars.filter(car => {
        const q = search.toLowerCase();
        const matchSearch = !q || car.title?.toLowerCase().includes(q) || car.manufacturerAr?.includes(q) || car.model?.toLowerCase().includes(q);
        const cYear = Number(car.year || 0);
        const matchYear = (!yearFrom || cYear >= Number(yearFrom)) && (!yearTo || cYear <= Number(yearTo));
        const matchBrand = !brandFilter || car.manufacturerAr === brandFilter || car.manufacturer === brandFilter;
        const matchModel = !modelFilter || car.model === modelFilter;
        const matchBadge = !badgeFilter || car.badge === badgeFilter;
        return matchSearch && matchYear && matchBrand && matchModel && matchBadge;
    }).sort((a, b) => {
        if (sortBy === 'mileage_low') return Number(a.mileage || 0) - Number(b.mileage || 0);
        if (sortBy === 'price_high') return getBaseUsd(b) - getBaseUsd(a);
        return Number(b.year || 0) - Number(a.year || 0);
    });

    const allLocalFiltered = localCars.filter(c => {
        const q = search.toLowerCase();
        const make = (c.makeAr || c.make || '').toLowerCase();
        const model = (c.model || '').toLowerCase();
        return !q || make.includes(q) || model.includes(q);
    });

    // شجرة الماركات
    const brandTree = koreanCars.reduce((acc, car) => {
        const brand = car.manufacturerAr || car.manufacturer || 'أخرى';
        const model = car.model || '';
        const badge = car.badge || '';
        if (!acc[brand]) acc[brand] = { name: brand, count: 0, models: {} };
        acc[brand].count++;
        if (model) {
            if (!acc[brand].models[model]) acc[brand].models[model] = { name: model, count: 0, badges: {} };
            acc[brand].models[model].count++;
            if (badge) {
                if (!acc[brand].models[model].badges[badge]) acc[brand].models[model].badges[badge] = 0;
                acc[brand].models[model].badges[badge]++;
            }
        }
        return acc;
    }, {} as Record<string, { name: string; count: number; models: Record<string, { name: string; count: number; badges: Record<string, number> }> }>);

    const years = [...new Set(koreanCars.map(c => c.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    const availableBrands = [...new Set(koreanCars.map(c => c.manufacturerAr).filter(Boolean))].sort();
    const loading = loadingKorean && loadingLocal;

    const handleSelectBrand = (brand: string) => {
        setBrandFilter(prev => prev === brand ? '' : brand);
        setModelFilter('');
        setBadgeFilter('');
    };
    const handleSelectModel = (brand: string, model: string) => {
        setBrandFilter(brand);
        setModelFilter(prev => prev === model ? '' : model);
        setBadgeFilter('');
    };
    const handleSelectBadge = (brand: string, model: string, badge: string) => {
        setBrandFilter(brand);
        setModelFilter(model);
        setBadgeFilter(prev => prev === badge ? '' : badge);
    };

    const TreeFilterContent = () => {
        const brands = Object.values(brandTree).sort((a, b) => b.count - a.count);
        return (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10" dir={isRTL ? 'rtl' : 'ltr'}>
                {brands.length === 0 ? (
                    <div className="text-xs text-white/30 italic text-center py-4">{isRTL ? 'لا تتوفر ماركات' : 'No brands'}</div>
                ) : brands.map(brand => {
                    const isBrandExpanded = !!expandedBrands[brand.name];
                    const isBrandSelected = brandFilter === brand.name;
                    const models = Object.values(brand.models).sort((a, b) => b.count - a.count);
                    return (
                        <div key={brand.name} className="space-y-0.5">
                            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all">
                                <button onClick={() => handleSelectBrand(brand.name)}
                                    className={cn("flex items-center gap-2 flex-1 text-right text-xs font-bold transition-all", isBrandSelected ? "text-blue-400" : "text-white/70 hover:text-white")}>
                                    {isBrandSelected && <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />}
                                    <span>{brand.name}</span>
                                    <span className="text-[10px] text-white/30 font-normal">({brand.count})</span>
                                </button>
                                {models.length > 0 && (
                                    <button onClick={() => setExpandedBrands(p => ({ ...p, [brand.name]: !p[brand.name] }))}
                                        className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xs">
                                        {isBrandExpanded ? '−' : '+'}
                                    </button>
                                )}
                            </div>
                            {isBrandExpanded && models.length > 0 && (
                                <div className={cn("space-y-0.5 ms-3", isRTL ? "border-r border-white/10 pr-3" : "border-l border-white/10 pl-3")}>
                                    {models.map(model => {
                                        const isModelExpanded = !!expandedModels[model.name];
                                        const isModelSelected = modelFilter === model.name;
                                        const badges = Object.entries(model.badges).sort((a, b) => b[1] - a[1]);
                                        return (
                                            <div key={model.name}>
                                                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5">
                                                    <button onClick={() => handleSelectModel(brand.name, model.name)}
                                                        className={cn("flex items-center gap-1 flex-1 text-right text-[11px] font-medium", isModelSelected ? "text-green-400" : "text-white/55 hover:text-white")}>
                                                        <span>{model.name}</span>
                                                        <span className="text-[9px] text-white/30">({model.count})</span>
                                                    </button>
                                                    {badges.length > 0 && (
                                                        <button onClick={() => setExpandedModels(p => ({ ...p, [model.name]: !p[model.name] }))}
                                                            className="w-4 h-4 rounded flex items-center justify-center text-white/30 hover:text-white text-[10px]">
                                                            {isModelExpanded ? '−' : '+'}
                                                        </button>
                                                    )}
                                                </div>
                                                {isModelExpanded && badges.map(([badgeName, cnt]) => (
                                                    <button key={badgeName} onClick={() => handleSelectBadge(brand.name, model.name, badgeName)}
                                                        className={cn("w-full text-right py-1 px-2 rounded text-[10px] flex items-center gap-1.5 ms-2", badgeFilter === badgeName ? "text-yellow-400 font-bold" : "text-white/35 hover:text-white/70")}>
                                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                                        {badgeName || 'عامة'} <span className="text-white/20">({cnt})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const hasActiveFilters = search || yearFrom || yearTo || brandFilter || modelFilter || badgeFilter;

    return (
        <>
            <AnimatePresence>
                {selectedCar && (
                    <CarModal car={selectedCar} isRTL={isRTL}
                        priceText={selectedCar.source === 'hm_local'
                            ? `${(selectedCar.priceSar || 0).toLocaleString()} ر.س`
                            : formatPriceFromUsd(getBaseUsd(selectedCar))}
                        onClose={() => setSelectedCar(null)}
                        onContact={() => openWhatsApp(selectedCar)} />
                )}
            </AnimatePresence>

            <div className={cn('min-h-screen bg-cinematic-darker text-white selection:bg-blue-500/30', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />

                {/* خلفية سينمائية */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-blue-600/8 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)' }} />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-32">

                    {/* زر الرجوع */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <button onClick={() => router.push('/client/dashboard')} title={isRTL ? 'رجوع' : 'Back'}
                            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group">
                            <ArrowLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        </button>
                    </motion.div>

                    {/* ── لوحة الاتصال ── */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-10 p-3 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-xl flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75", loading && "bg-yellow-400")} />
                                <span className={cn("relative inline-flex rounded-full h-2 w-2 bg-blue-500", loading && "bg-yellow-500")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {loading ? rawText('Loading...') : rawText('Live Connection')}
                            </span>
                        </div>
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase">Market</span><span className="text-xs font-black text-white/60">SEOUL, KR</span></div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block" />
                            <div className="flex flex-col hidden sm:flex"><span className="text-[9px] text-white/20 uppercase">Latency</span><span className="text-xs font-black text-green-400">{ping}ms</span></div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block" />
                            <div className="flex flex-col"><span className="text-[9px] text-white/20 uppercase">Korean Cars</span><span className="text-xs font-black text-white/60">{koreanTotal.toLocaleString()}</span></div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block" />
                            <div className="flex flex-col hidden sm:flex"><span className="text-[9px] text-white/20 uppercase">Local Cars</span><span className="text-xs font-black text-white/60">{localCars.length}</span></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setRefreshKey(k => k + 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{rawText('تحديث')}</span>
                            </button>
                            <CurrencySwitcher variant="full" className="hidden md:block" />
                        </div>
                    </motion.div>

                    {/* ── العنوان والبحث ── */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                            <div className="h-1 w-12 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.85]">
                                {isRTL ? rawText('المعرض') : rawText('SHOWROOM')}
                                <span className="block text-xl md:text-2xl font-light not-italic tracking-[0.3em] text-white/20 mt-2">
                                    {isRTL ? rawText('سيارات كورية · معرض HM CAR') : rawText('KOREAN CARS · HM CAR SHOWROOM')}
                                </span>
                            </h1>
                        </motion.div>

                        {/* ─── نظام البحث المتطور ─── */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full lg:max-w-md space-y-3">
                            {/* شريط البحث الذكي */}
                            <div ref={searchRef} className="relative">
                                <div className={cn(
                                    "relative flex items-center bg-white/5 border rounded-2xl px-4 py-3 transition-all duration-300",
                                    showSuggestions && searchSuggestions.length > 0 ? "border-blue-500/50 rounded-b-none" : "border-white/10 focus-within:border-blue-500/40"
                                )}>
                                    <Search className="w-4 h-4 text-white/30 shrink-0" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
                                        onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                                        placeholder={isRTL ? "ابحث بالماركة أو الموديل..." : "Search brand or model..."}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/25 mx-3"
                                    />
                                    <div className="flex items-center gap-2">
                                        {search && (
                                            <button onClick={() => { setSearch(''); setSearchSuggestions([]); setShowSuggestions(false); }}
                                                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                                <X className="w-3 h-3 text-white/60" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowFilters(p => !p)}
                                            title={isRTL ? "الفلاتر المتقدمة" : "Advanced Filters"}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border",
                                                showFilters ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                                            )}>
                                            <SlidersHorizontal className="w-3.5 h-3.5" />
                                            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                                        </button>
                                    </div>
                                </div>

                                {/* قائمة الاقتراحات */}
                                <AnimatePresence>
                                    {showSuggestions && searchSuggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="absolute top-full left-0 right-0 bg-zinc-900/98 border border-blue-500/30 border-t-0 rounded-b-2xl overflow-hidden z-50 shadow-2xl"
                                        >
                                            {searchSuggestions.map(s => (
                                                <button key={s} onClick={() => { setSearch(s); setShowSuggestions(false); }}
                                                    className="w-full px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all text-right flex items-center gap-3 border-b border-white/5 last:border-0">
                                                    <Search className="w-3 h-3 text-white/25 shrink-0" />
                                                    <span>{s}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* لوحة الفلاتر المتقدمة */}
                            <AnimatePresence>
                                {showFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-4">
                                            {/* فلتر السنة */}
                                            {years.length > 0 && (
                                                <div>
                                                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-2">{isRTL ? 'السنة' : 'Year'}</label>
                                                    <div className="flex gap-2">
                                                        <select value={yearFrom} onChange={e => setYearFrom(e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 outline-none">
                                                            <option value="">{isRTL ? 'من' : 'From'}</option>
                                                            {years.map(y => <option key={`from-${y}`} value={String(y)}>{y}</option>)}
                                                        </select>
                                                        <select value={yearTo} onChange={e => setYearTo(e.target.value)}
                                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60 outline-none">
                                                            <option value="">{isRTL ? 'إلى' : 'To'}</option>
                                                            {years.map(y => <option key={`to-${y}`} value={String(y)}>{y}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {/* فلتر الماركة */}
                                            {availableBrands.length > 0 && (
                                                <div>
                                                    <label className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-2">{isRTL ? 'الماركة' : 'Brand'}</label>
                                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                        {availableBrands.map(b => (
                                                            <button key={b} onClick={() => setBrandFilter(prev => prev === b ? '' : b)}
                                                                className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                                                    brandFilter === b ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20")}>
                                                                {b}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* الترتيب */}
                                            <div>
                                                <label className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-2">{isRTL ? 'الترتيب' : 'Sort'}</label>
                                                <div className="flex gap-1.5">
                                                    {[
                                                        { value: 'latest', labelAr: 'الأحدث', labelEn: 'Latest' },
                                                        { value: 'mileage_low', labelAr: 'أقل عداد', labelEn: 'Low KM' },
                                                        { value: 'price_high', labelAr: 'الأعلى سعراً', labelEn: 'High Price' },
                                                    ].map(opt => (
                                                        <button key={opt.value} onClick={() => setSortBy(opt.value as any)}
                                                            className={cn("flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border",
                                                                sortBy === opt.value ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white")}>
                                                            {isRTL ? opt.labelAr : opt.labelEn}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* زر مسح الفلاتر */}
                                            {hasActiveFilters && (
                                                <button onClick={() => { setSearch(''); setYearFrom(''); setYearTo(''); setBrandFilter(''); setModelFilter(''); setBadgeFilter(''); setSortBy('latest'); }}
                                                    className="w-full py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/10 text-[11px] font-bold transition-all">
                                                    {isRTL ? 'مسح جميع الفلاتر' : 'Clear All Filters'}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* ── تبويبات (Tabs) ── */}
                    <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { key: 'all', labelAr: 'الكل', labelEn: 'All', icon: Car, count: allKoreanFiltered.length + allLocalFiltered.length },
                            { key: 'korean', labelAr: 'المعرض الكوري', labelEn: 'Korean', icon: Globe, count: allKoreanFiltered.length },
                            { key: 'local', labelAr: 'معرض HM CAR', labelEn: 'HM CAR', icon: Building2, count: allLocalFiltered.length },
                            { key: 'auctions', labelAr: 'المزادات المباشرة', labelEn: 'Live Auctions', icon: Gavel, count: auctions.length },
                        ].map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all shrink-0 border",
                                    activeTab === tab.key
                                        ? "bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                                        : "bg-white/4 border-white/8 text-white/50 hover:text-white hover:bg-white/8"
                                )}>
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{isRTL ? tab.labelAr : tab.labelEn}</span>
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeTab === tab.key ? "bg-white/20 text-white" : "bg-white/10 text-white/40")}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* ── المزادات المباشرة ── */}
                    <AnimatePresence mode="wait">
                        {(activeTab === 'all' || activeTab === 'auctions') && (
                            <motion.div key="auctions-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <Gavel className="w-3.5 h-3.5 text-red-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-red-400">
                                            {isRTL ? 'المزادات المباشرة' : 'LIVE AUCTIONS'}
                                        </span>
                                    </div>
                                    <Link href="/auctions" className="text-[10px] font-bold text-white/30 hover:text-white transition-colors underline-offset-4 hover:underline">
                                        {isRTL ? 'عرض الكل' : 'View All'} →
                                    </Link>
                                </div>

                                {loadingAuctions ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="h-72 rounded-2xl bg-white/2 border border-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : auctions.length === 0 ? (
                                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                                        <Gavel className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                        <p className="text-white/25 text-sm">{isRTL ? 'لا توجد مزادات نشطة حالياً' : 'No active auctions at the moment'}</p>
                                        <Link href="/auctions" className="mt-3 inline-block text-xs text-blue-400 hover:underline">
                                            {isRTL ? 'تصفح جميع المزادات' : 'Browse all auctions'}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {auctions.map(auction => (
                                            <LiveAuctionCard key={auction._id} auction={auction} isRTL={isRTL} />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── سيارات المعرض المحلي HM CAR ── */}
                    <AnimatePresence mode="wait">
                        {(activeTab === 'all' || activeTab === 'local') && (
                            <motion.div key="local-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                                        <Building2 className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-purple-400">
                                            {isRTL ? 'معرض HM CAR المحلي' : 'HM CAR LOCAL SHOWROOM'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-white/20">({allLocalFiltered.length} {isRTL ? 'سيارة' : 'cars'})</span>
                                </div>

                                {loadingLocal ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="aspect-[3/4] rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : allLocalFiltered.length === 0 ? (
                                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                                        <Building2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                        <p className="text-white/25 text-sm">{isRTL ? 'لا توجد سيارات في المعرض المحلي حالياً' : 'No local showroom cars at the moment'}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {allLocalFiltered.map((lc, i) => {
                                            const asKorean = localCarToKorean(lc);
                                            return (
                                                <motion.div key={lc._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                                    <UltraModernCarCard
                                                        car={{
                                                            id: lc._id, title: `${lc.makeAr || lc.make} ${lc.model} ${lc.year}`,
                                                            make: lc.makeAr || lc.make, model: lc.model, year: lc.year,
                                                            price: lc.price, priceUsd: lc.price / (Number(currency.usdToSar) || 3.75),
                                                            images: lc.images || [], imageUrl: lc.imageUrl || lc.images?.[0] || '',
                                                            mileage: lc.mileage || 0, fuelType: lc.fuelType || 'بنزين',
                                                            transmission: lc.transmission || '', category: 'local_showroom',
                                                            isActive: true, isSold: false, source: 'hm_local', isInspected: false, condition: lc.condition || 'used'
                                                        }}
                                                        index={i}
                                                        formatPrice={(p) => `${p.toLocaleString()} ر.س`}
                                                        onContact={() => openWhatsApp(asKorean)}
                                                        onViewDetails={() => setSelectedCar(asKorean)}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── السيارات الكورية مع الفلترة الجانبية ── */}
                    <AnimatePresence mode="wait">
                        {(activeTab === 'all' || activeTab === 'korean') && (
                            <motion.div key="korean-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-blue-400">
                                            {isRTL ? 'المعرض الكوري المباشر' : 'LIVE KOREAN MARKET'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-white/20">({allKoreanFiltered.length} {isRTL ? 'سيارة' : 'cars'})</span>
                                </div>

                                {loadingKorean && koreanCars.length === 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="aspect-[3/4] rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="py-20 flex flex-col items-center gap-4 text-center">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                            <X className="w-8 h-8 text-red-500" />
                                        </div>
                                        <p className="text-white/40">{error}</p>
                                        <button onClick={() => setRefreshKey(k => k + 1)}
                                            className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all">
                                            {isRTL ? 'إعادة الإتصال' : 'RECONNECT'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                                        {/* شريط التصفية الجانبي - Desktop */}
                                        <div className="hidden lg:block lg:col-span-1 bg-white/2 border border-white/5 rounded-3xl p-5 backdrop-blur-3xl sticky top-36">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-5 flex items-center gap-2">
                                                <Filter className="w-3.5 h-3.5" />
                                                {isRTL ? 'فلاتر شجرة البحث' : 'Tree Filter'}
                                            </h3>
                                            <TreeFilterContent />
                                        </div>

                                        {/* شبكة السيارات */}
                                        <div className="lg:col-span-3 space-y-8">
                                            {/* فلاتر شجرية للجوال */}
                                            <div className="block lg:hidden">
                                                <details className="group bg-white/2 border border-white/5 rounded-2xl overflow-hidden">
                                                    <summary className="flex items-center justify-between p-4 cursor-pointer select-none">
                                                        <span className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                                            <Filter className="w-4 h-4" />
                                                            {isRTL ? 'فلاتر الماركات والموديلات' : 'Brand & Model Filters'}
                                                        </span>
                                                        <ChevronLeft className="w-4 h-4 text-white/30 transition-transform group-open:-rotate-90" />
                                                    </summary>
                                                    <div className="p-4 border-t border-white/5">
                                                        <TreeFilterContent />
                                                    </div>
                                                </details>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {allKoreanFiltered.map((car, i) => (
                                                    <motion.div key={car.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                                                        <UltraModernCarCard
                                                            car={{
                                                                id: car.id, title: car.title,
                                                                make: car.manufacturerAr || car.manufacturer,
                                                                model: car.model, year: car.year,
                                                                price: getBaseUsd(car) * Number(currency.usdToSar || 3.75),
                                                                priceUsd: getBaseUsd(car),
                                                                images: car.images || [car.imageUrl, car.image].filter((img): img is string => Boolean(img)),
                                                                imageUrl: car.imageUrl || car.image || '',
                                                                mileage: car.mileage, fuelType: car.fuelAr || car.fuel,
                                                                transmission: car.transmissionAr || car.transmission,
                                                                category: 'korean_import', isActive: true, isSold: false,
                                                                source: 'korean_import', isInspected: car.isInspected, condition: 'used'
                                                            }}
                                                            index={i}
                                                            formatPrice={(p) => formatPriceFromUsd(p / Number(currency.usdToSar || 3.75))}
                                                            onContact={() => openWhatsApp(car)}
                                                            onViewDetails={() => setSelectedCar(car)}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {allKoreanFiltered.length === 0 && !loadingKorean && (
                                                <div className="py-20 text-center opacity-40 italic text-sm">
                                                    {isRTL ? 'لا توجد نتائج مطابقة' : 'No results match your filters'}
                                                </div>
                                            )}

                                            {/* ترقيم الصفحات */}
                                            {koreanTotalPages > 1 && (
                                                <div className="mt-16 flex items-center justify-center gap-2">
                                                    <button onClick={() => { setKoreanPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        disabled={koreanPage === 1} title={isRTL ? "السابق" : "Previous"}
                                                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 hover:border-blue-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                                                        <ChevronRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                                    </button>
                                                    <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black">
                                                        <span className="text-blue-400">{koreanPage}</span>
                                                        <span className="text-white/20">/</span>
                                                        <span className="text-white/40">{koreanTotalPages}</span>
                                                    </div>
                                                    <button onClick={() => { setKoreanPage(p => Math.min(koreanTotalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        disabled={koreanPage === koreanTotalPages} title={isRTL ? "التالي" : "Next"}
                                                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 hover:border-blue-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                                                        <ChevronLeft className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-white/5 py-10 px-6 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-xl hide-in-app">
                    <div className="flex items-center gap-4 text-white/15 font-black text-[10px] tracking-[0.5em] uppercase">
                        <span>HM CAR</span>
                        <div className="h-0.5 w-8 bg-white/5" />
                        <span>KOREA AUTO</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
