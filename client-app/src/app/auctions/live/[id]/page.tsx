'use client';

// صفحة تفاصيل المزاد المباشر — تصميم Premium مع Encar
// تعرض: جميع الصور + تقرير الفحص + المواصفات + toggle العملة + طلب واتساب

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, ChevronRight, MessageCircle, X, ExternalLink,
    ShieldCheck, ZapIcon, Globe, Gauge, Fuel, Settings,
    FileText, ClipboardList, ListChecks, Car, Radio,
    ArrowLeft, Eye, BadgeCheck, Info
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import Image from 'next/image';
import { api } from '@/lib/api-original';

type Currency = 'SAR' | 'USD' | 'KRW';
type InspectionTab = 'report' | 'guide' | 'specs';

// ── دليل الفحص ──────────────────────────────────────────────────────────────
const GRADE_GUIDE = [
    { code: 'A',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', ar: 'وكالة / لم يُلمس',       en: 'New / Untouched' },
    { code: 'B',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',          ar: 'تآكل طبيعي',              en: 'Normal Wear' },
    { code: 'C',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',    ar: 'خدش أو طرشة خفيفة',      en: 'Minor Scratch/Dent' },
    { code: 'W',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',    ar: 'موجة طلاء',               en: 'Wave / Ripple' },
    { code: 'P',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',    ar: 'استبدال',                 en: 'Panel Replacement' },
    { code: 'PP',  color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',    ar: 'استبدال جزئي',            en: 'Partial Replacement' },
    { code: 'Q',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       ar: 'تصليح',                  en: 'Repair Needed' },
    { code: 'X',   color: 'bg-red-500/20 text-red-400 border-red-500/30',             ar: 'تصليح كبير',              en: 'Major Repair' },
    { code: 'X1',  color: 'bg-red-700/20 text-red-300 border-red-700/30',             ar: 'لحام / مسح',              en: 'Weld / Fusion' },
    { code: 'WR',  color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',          ar: 'موجة + تصليح',            en: 'Wave + Repair' },
    { code: 'R',   color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',          ar: 'صدأ',                    en: 'Rust / Corrosion' },
    { code: 'XXP', color: 'bg-red-900/30 text-red-200 border-red-900/40',             ar: 'تشوّه / استبدال أمامي',   en: 'Deformation' },
];

function getGradeStyle(code: string) {
    return GRADE_GUIDE.find(g => g.code === code) || {
        code, color: 'bg-white/5 text-white/40 border-white/10', ar: code, en: code
    };
}

// ── تنسيق السعر ──────────────────────────────────────────────────────────────
function formatPrice(amount: number, currency: Currency, isRTL: boolean) {
    if (!amount) return isRTL ? 'تواصل معنا' : 'Contact Us';
    const num = amount.toLocaleString('en-US');
    switch (currency) {
        case 'SAR': return isRTL ? `${num} ر.س` : `SAR ${num}`;
        case 'USD': return `$${amount.toLocaleString('en-US')}`;
        case 'KRW': return `₩${amount.toLocaleString('en-US')}`;
    }
}

export default function LiveAuctionDetails() {
    const { isRTL } = useLanguage();
    const { id } = useParams();
    const router = useRouter();

    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<any>(null);
    const [currency, setCurrency] = useState<Currency>('SAR');
    const [inspTab, setInspTab] = useState<InspectionTab>('report');
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImg, setLightboxImg] = useState('');
    const [globalWhatsapp, setGlobalWhatsapp] = useState('+967781007805');

    useEffect(() => {
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res.data?.socialLinks?.whatsapp) {
                setGlobalWhatsapp(res.data.socialLinks.whatsapp);
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.liveAuctions.getById(id as string);
                if (res.success) setSession(res.data);
            } catch { }
            finally { setLoading(false); }
        };
        load();
        const iv = setInterval(load, 15000);
        return () => clearInterval(iv);
    }, [id]);

    const handleWhatsApp = useCallback((car: any) => {
        const phone = (session?.whatsappNumber || globalWhatsapp).replace(/\D/g, '');
        const price = formatPrice(
            currency === 'SAR' ? (car.priceSar || car.priceEstimate || 0)
                : currency === 'USD' ? (car.priceUsd || 0)
                    : (car.priceKrw || 0),
            currency, isRTL
        );
        const text = isRTL
            ? `السلام عليكم، أريد الاستفسار عن هذه السيارة من المزاد:
🚗 السيارة: ${car.title || car.titleAr || ''}
🏷️ المزاد: ${session?.title || ''}
💰 السعر: ${price}
📸 المصدر: Encar Korea
👤 الرجاء التواصل معي للتفاصيل.`
            : `Hello, I'm interested in this car from the live auction:
🚗 Car: ${car.titleEn || car.title || ''}
🏷️ Session: ${session?.title || ''}
💰 Price: ${price}
📸 Source: Encar Korea
Please contact me for details.`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    }, [session, globalWhatsapp, currency, isRTL]);

    const getPriceForCar = (car: any) => {
        if (currency === 'SAR') return car.priceSar || car.priceEstimate || 0;
        if (currency === 'USD') return car.priceUsd || Math.round((car.priceSar || 0) / 3.75);
        return car.priceKrw || Math.round((car.priceSar || 0) * 360);
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                <span className="text-white/30 text-xs uppercase tracking-widest font-bold">
                    {isRTL ? 'جاري التحميل...' : 'LOADING...'}
                </span>
            </div>
        </div>
    );

    if (!session) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/20 text-center px-6">
            <div>
                <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="uppercase tracking-widest text-sm font-bold">
                    {isRTL ? 'لم يتم العثور على الجلسة' : 'Session not found'}
                </p>
            </div>
        </div>
    );

    const cars = session.cars || [];
    const isLive = session.status === 'live';

    return (
        <div className={cn('min-h-screen bg-[#050505] text-white', isRTL ? 'font-arabic' : '')} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── Top Bar ──────────────────────────────────────────────────── */}
            <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all shrink-0">
                            <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">
                                    {isLive ? (isRTL ? 'مباشر الآن' : 'LIVE NOW') : (isRTL ? 'قادم' : 'UPCOMING')}
                                </span>
                            </div>
                            <h1 className="text-sm md:text-lg font-black tracking-tight truncate">{session.title}</h1>
                        </div>
                    </div>

                    {/* Currency Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 shrink-0">
                        {(['SAR', 'USD', 'KRW'] as Currency[]).map(c => (
                            <button key={c} onClick={() => setCurrency(c)}
                                className={cn(
                                    'px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all',
                                    currency === c
                                        ? 'bg-[#C9A96E] text-black'
                                        : 'text-white/40 hover:text-white'
                                )}>
                                {c === 'SAR' ? '🇸🇦 SAR' : c === 'USD' ? '🇺🇸 USD' : '🇰🇷 KRW'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <main className="pt-36 md:pt-40 pb-24 px-4 max-w-7xl mx-auto">

                {/* Source badge */}
                <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-xs text-blue-300 font-bold">
                        {isRTL
                            ? '🇰🇷 السيارات مستوردة مباشرةً من Encar Korea — إنكار | أكبر منصة سيارات مستعملة في كوريا الجنوبية'
                            : '🇰🇷 Cars imported directly from Encar Korea — South Korea\'s largest used car marketplace'}
                    </p>
                    {session.externalUrl && (
                        <a href={session.externalUrl} target="_blank" rel="noopener noreferrer"
                            className="mr-auto ml-0 flex items-center gap-1 text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors shrink-0">
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>

                {/* Cars count */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-[2px] w-10 bg-[#C9A96E]" />
                    <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight">
                        {isRTL ? 'السيارات المتاحة للمزايدة' : 'AVAILABLE FOR BIDDING'}
                    </h2>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                        {cars.length} {isRTL ? 'سيارة' : 'CARS'}
                    </span>
                </div>

                {/* ── Car Grid ─────────────────────────────────────────────── */}
                {cars.length === 0 ? (
                    <div className="text-center py-32">
                        <Car className="w-20 h-20 mx-auto text-white/5 mb-4" />
                        <p className="text-white/20 uppercase tracking-widest text-sm font-bold">
                            {isRTL ? 'لا توجد سيارات بعد' : 'No cars yet'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cars.map((car: any, idx: number) => {
                            const price = getPriceForCar(car);
                            const hasInspection = !!car.inspectionReport;
                            const images = car.images || [];

                            return (
                                <motion.div key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    onClick={() => { setSelectedCar(car); setGalleryIndex(0); setInspTab('report'); }}
                                    className="group cursor-pointer bg-[#0e0e18] border border-white/8 rounded-3xl overflow-hidden hover:border-[#C9A96E]/30 transition-all hover:shadow-[0_8px_32px_rgba(201,169,110,0.1)]"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] bg-[#0a0a12] overflow-hidden">
                                        {images[0] ? (
                                            <Image
                                                src={images[0]}
                                                alt={car.titleAr || car.title || ''}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="w-16 h-16 text-white/5" />
                                            </div>
                                        )}

                                        {/* Watermark overlay */}
                                        <div className="absolute bottom-3 right-3 text-white/40 text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                                            HMCar
                                        </div>

                                        {/* Images count */}
                                        {images.length > 1 && (
                                            <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-1 rounded-lg">
                                                <Eye className="w-3 h-3 text-white/40" />
                                                <span className="text-[9px] font-black text-white/40">{images.length}</span>
                                            </div>
                                        )}

                                        {/* Inspection badge */}
                                        {hasInspection && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 px-2 py-1 rounded-lg">
                                                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                                                <span className="text-[9px] font-black text-emerald-400">
                                                    {isRTL ? 'مفحوص' : 'INSPECTED'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e18] via-transparent to-transparent opacity-60" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-3">
                                        <div>
                                            <h3 className="font-black text-sm leading-snug line-clamp-1">
                                                {isRTL ? (car.titleAr || car.title) : (car.titleEn || car.title)}
                                            </h3>
                                            <p className="text-[10px] text-white/30 mt-0.5">
                                                {car.specs?.year} · {car.mileage ? `${Number(car.mileage).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} ${isRTL ? 'كم' : 'km'}` : ''} · {isRTL ? (car.fuelType || '') : (car.fuelType_en || '')}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                            <div>
                                                <span className="text-[9px] text-white/20 uppercase tracking-widest block">
                                                    {currency === 'SAR' ? (isRTL ? 'السعر (ريال)' : 'Price (SAR)') : currency === 'USD' ? 'Price (USD)' : 'السعر (وون)'}
                                                </span>
                                                <span className="text-base font-black text-[#C9A96E]">
                                                    {formatPrice(price, currency, isRTL)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleWhatsApp(car); }}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black text-white bg-green-500/15 border border-green-500/30 hover:bg-green-500/30 transition-all"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                {isRTL ? 'واتساب' : 'WhatsApp'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ── Car Detail Modal ─────────────────────────────────────────── */}
            <AnimatePresence>
                {selectedCar && (() => {
                    const car = selectedCar;
                    const images = car.images || [];
                    const price = getPriceForCar(car);
                    const insp = car.inspectionReport;
                    const specs = car.specs || {};

                    return (
                        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="min-h-screen flex flex-col"
                            >
                                {/* Modal Header */}
                                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-2xl border-b border-white/5 px-4 py-3">
                                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                                        <button onClick={() => setSelectedCar(null)}
                                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="font-black text-sm md:text-base truncate">
                                                {isRTL ? (car.titleAr || car.title) : (car.titleEn || car.title)}
                                            </h2>
                                        </div>
                                        {/* Currency toggle in modal */}
                                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 shrink-0">
                                            {(['SAR', 'USD', 'KRW'] as Currency[]).map(c => (
                                                <button key={c} onClick={() => setCurrency(c)}
                                                    className={cn(
                                                        'px-2 py-1 rounded-lg text-[9px] font-black transition-all',
                                                        currency === c ? 'bg-[#C9A96E] text-black' : 'text-white/30 hover:text-white'
                                                    )}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* Left: Gallery */}
                                    <div className="space-y-4">
                                        {/* Main Image */}
                                        <div className="relative aspect-video bg-[#0a0a12] rounded-2xl overflow-hidden border border-white/8">
                                            {images[galleryIndex] ? (
                                                <Image
                                                    src={images[galleryIndex]}
                                                    alt=""
                                                    fill
                                                    className="object-cover cursor-zoom-in"
                                                    unoptimized
                                                    onClick={() => { setLightboxImg(images[galleryIndex]); setLightboxOpen(true); }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Car className="w-20 h-20 text-white/5" />
                                                </div>
                                            )}

                                            {/* HMCar watermark */}
                                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                                <Radio className="w-3 h-3 text-[#C9A96E]" />
                                                <span className="text-[10px] font-black text-white/60 tracking-widest">HMCar</span>
                                            </div>

                                            {/* Nav arrows */}
                                            {images.length > 1 && (
                                                <>
                                                    <button onClick={() => setGalleryIndex(i => (i - 1 + images.length) % images.length)}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl hover:bg-black/80 transition-all">
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => setGalleryIndex(i => (i + 1) % images.length)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-xl hover:bg-black/80 transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-black text-white/50">
                                                        {galleryIndex + 1} / {images.length}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail Strip */}
                                        {images.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                                {images.map((img: string, i: number) => (
                                                    <button key={i} onClick={() => setGalleryIndex(i)}
                                                        className={cn(
                                                            'relative shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all',
                                                            galleryIndex === i ? 'border-[#C9A96E]' : 'border-white/10 hover:border-white/30'
                                                        )}>
                                                        <Image src={img} alt="" fill className="object-cover" unoptimized />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Encar link */}
                                        {car.externalUrl && (
                                            <a href={car.externalUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[11px] text-blue-400/60 hover:text-blue-400 transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>{isRTL ? 'عرض الإعلان الأصلي على Encar ↗' : 'View original listing on Encar ↗'}</span>
                                            </a>
                                        )}
                                    </div>

                                    {/* Right: Info */}
                                    <div className="space-y-6">

                                        {/* Title & Price */}
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                                                {isRTL ? (car.titleAr || car.title) : (car.titleEn || car.title)}
                                            </h2>
                                            <div className="flex items-end gap-4">
                                                <div>
                                                    <span className="text-[10px] text-white/20 uppercase tracking-widest block mb-1">
                                                        {currency === 'SAR' ? (isRTL ? 'السعر التقديري (ريال سعودي)' : 'Estimated Price (SAR)')
                                                            : currency === 'USD' ? 'Estimated Price (USD)'
                                                                : (isRTL ? 'السعر (وون كوري)' : 'Price (KRW)')}
                                                    </span>
                                                    <div className="text-3xl font-black text-[#C9A96E]">
                                                        {formatPrice(price, currency, isRTL)}
                                                    </div>
                                                </div>
                                                {car.priceKrw > 0 && currency !== 'KRW' && (
                                                    <div className="text-xs text-white/20 pb-1">
                                                        ₩{Number(car.priceKrw).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick specs chips */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { icon: Car, label: isRTL ? 'الماركة' : 'Make', val: isRTL ? (specs.manufacturer_ar || car.makeAr || car.make) : (specs.manufacturer_en || car.make) },
                                                { icon: Settings, label: isRTL ? 'السنة' : 'Year', val: specs.year || car.year || '' },
                                                { icon: Gauge, label: isRTL ? 'المسافة' : 'Mileage', val: car.mileage ? `${Number(car.mileage).toLocaleString()} ${isRTL ? 'كم' : 'km'}` : '—' },
                                                { icon: Fuel, label: isRTL ? 'الوقود' : 'Fuel', val: isRTL ? (car.fuelType || '—') : (car.fuelType_en || '—') },
                                                { icon: ZapIcon, label: isRTL ? 'ناقل الحركة' : 'Transmission', val: isRTL ? (car.transmission || '—') : (specs.transmission_en || '—') },
                                                { icon: Globe, label: isRTL ? 'المصدر' : 'Source', val: 'Encar 🇰🇷' },
                                            ].map(({ icon: Icon, label, val }) => (
                                                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                                                    <Icon className="w-4 h-4 text-[#C9A96E] shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] text-white/30 uppercase tracking-widest">{label}</p>
                                                        <p className="text-xs font-bold truncate">{val || '—'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* WhatsApp CTA */}
                                        <button
                                            onClick={() => handleWhatsApp(car)}
                                            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                                            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 8px 32px rgba(37,211,102,0.25)' }}
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            {isRTL ? '📱 اطلب هذه السيارة عبر واتساب' : '📱 Request via WhatsApp'}
                                        </button>

                                        {/* ── Inspection / Specs Tabs ───────────────────────── */}
                                        <div className="space-y-4">
                                            <div className="flex gap-1 p-1 bg-white/3 rounded-2xl border border-white/6">
                                                {[
                                                    { key: 'report' as InspectionTab, icon: FileText, ar: 'تقرير الفحص', en: 'Inspection' },
                                                    { key: 'guide' as InspectionTab, icon: ListChecks, ar: 'دليل الفحص', en: 'Grade Guide' },
                                                    { key: 'specs' as InspectionTab, icon: ClipboardList, ar: 'المواصفات', en: 'Specs' },
                                                ].map(t => (
                                                    <button key={t.key} onClick={() => setInspTab(t.key)}
                                                        className={cn(
                                                            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black transition-all',
                                                            inspTab === t.key ? 'bg-[#C9A96E] text-black' : 'text-white/30 hover:text-white'
                                                        )}>
                                                        <t.icon className="w-3.5 h-3.5" />
                                                        {isRTL ? t.ar : t.en}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Inspection Report Tab */}
                                            {inspTab === 'report' && (
                                                <div className="space-y-3">
                                                    {!insp ? (
                                                        <div className="text-center py-8 text-white/20">
                                                            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                                            <p className="text-xs">{isRTL ? 'لا يوجد تقرير فحص لهذه السيارة' : 'No inspection report available'}</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {insp.grade && (
                                                                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20">
                                                                    <BadgeCheck className="w-4 h-4 text-[#C9A96E]" />
                                                                    <span className="text-xs font-bold text-[#C9A96E]">
                                                                        {isRTL ? `تقييم الفحص الكلي: ${insp.grade}` : `Overall Inspection Grade: ${insp.grade}`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {insp.points?.length > 0 ? (
                                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                                                        {isRTL ? 'نقاط تحتاج انتباهاً:' : 'Points of Note:'}
                                                                    </p>
                                                                    {insp.points.map((p: any, i: number) => {
                                                                        const style = getGradeStyle(p.grade);
                                                                        return (
                                                                            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/3 border border-white/5">
                                                                                <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-md border', style.color)}>
                                                                                    {p.grade}
                                                                                </span>
                                                                                <span className="text-xs flex-1">{isRTL ? p.partAr : p.part}</span>
                                                                                <span className="text-[10px] text-white/30">{isRTL ? p.gradeAr : p.gradeEn}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                                                    <BadgeCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                                                                    <p className="text-xs text-emerald-400 font-bold">
                                                                        {isRTL ? '✅ السيارة بحالة ممتازة — لا توجد نقاط تحتاج انتباهاً' : '✅ Excellent condition — No issues found'}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Grade Guide Tab */}
                                            {inspTab === 'guide' && (
                                                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                                                    {GRADE_GUIDE.map(g => (
                                                        <div key={g.code} className="flex items-center gap-2 p-2 rounded-xl bg-white/3 border border-white/5">
                                                            <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0', g.color)}>
                                                                {g.code}
                                                            </span>
                                                            <span className="text-[10px] leading-tight">
                                                                {isRTL ? g.ar : g.en}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Specs Tab */}
                                            {inspTab === 'specs' && (
                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                    {[
                                                        { label: isRTL ? 'الشركة المصنعة' : 'Manufacturer', val: isRTL ? (specs.manufacturer_ar || car.makeAr) : (specs.manufacturer_en || car.make) },
                                                        { label: isRTL ? 'الموديل' : 'Model', val: specs.model || car.model },
                                                        { label: isRTL ? 'الفئة' : 'Badge', val: specs.badge },
                                                        { label: isRTL ? 'سنة الصنع' : 'Year', val: specs.year || car.year },
                                                        { label: isRTL ? 'المسافة المقطوعة' : 'Mileage', val: car.mileage ? `${Number(car.mileage).toLocaleString()} ${isRTL ? 'كم' : 'km'}` : null },
                                                        { label: isRTL ? 'نوع الوقود' : 'Fuel Type', val: isRTL ? car.fuelType : car.fuelType_en },
                                                        { label: isRTL ? 'ناقل الحركة' : 'Transmission', val: isRTL ? car.transmission : specs.transmission_en },
                                                        { label: isRTL ? 'اللون' : 'Color', val: specs.color },
                                                        { label: isRTL ? 'نظام الدفع' : 'Drive Type', val: specs.driveType },
                                                        { label: isRTL ? 'المقاعد' : 'Seats', val: specs.seats },
                                                        { label: isRTL ? 'حجم المحرك' : 'Displacement', val: specs.displacement ? `${specs.displacement}cc` : null },
                                                        { label: isRTL ? 'رقم الهيكل (VIN)' : 'VIN', val: specs.vin },
                                                        { label: isRTL ? 'تاريخ التسجيل' : 'Registration', val: specs.registrationDate },
                                                        { label: isRTL ? 'مدينة البائع' : 'Seller City', val: specs.officeCityState },
                                                        { label: isRTL ? 'السعر (وون)' : 'Price (KRW)', val: car.priceKrw ? `₩${Number(car.priceKrw).toLocaleString()}` : null },
                                                        { label: isRTL ? 'السعر (ريال)' : 'Price (SAR)', val: car.priceSar ? `${Number(car.priceSar).toLocaleString()} SAR` : null },
                                                        { label: isRTL ? 'السعر (دولار)' : 'Price (USD)', val: car.priceUsd ? `$${Number(car.priceUsd).toLocaleString()}` : null },
                                                    ].filter(r => r.val).map(row => (
                                                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/4">
                                                            <span className="text-[10px] text-white/30">{row.label}</span>
                                                            <span className="text-[11px] font-bold text-right max-w-[55%] truncate" dir="ltr">{row.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/98 flex items-center justify-center p-4"
                        onClick={() => setLightboxOpen(false)}
                    >
                        <button className="absolute top-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-10">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="relative max-w-5xl w-full max-h-[90vh] aspect-video" onClick={e => e.stopPropagation()}>
                            <Image src={lightboxImg} alt="" fill className="object-contain" unoptimized />
                            <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1.5 rounded-xl text-[10px] font-black text-white/60 tracking-widest">
                                HMCar
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
