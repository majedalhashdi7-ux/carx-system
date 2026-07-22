'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    ChevronLeft, ChevronRight, MessageCircle, Fuel, Gauge, Settings2,
    Calendar, Car, Tag, CheckCircle, AlertCircle, Image as ImageIcon, Globe,
    FileCheck2, ShieldCheck, ListFilter
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import WatermarkImage from '@/components/WatermarkImage';
import ModernCarCard from '@/components/ModernCarCard';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/lib/ToastContext';
import { WhatsAppService } from '@/lib/WhatsAppService';
import { cn } from '@/lib/utils';
import { formatCarTitle } from '@/lib/brandTranslations';

const DEFAULT_WHATSAPP = '+821080880014';
const CURRENCY_SAR = 'SAR';
const rawText = (value: string) => value;

const toFiniteNumber = (value: unknown): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

export default function LocalCarDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, formatPriceFromUsd, currency } = useSettings();
    const { showToast } = useToast();
    const [is360Mode, setIs360Mode] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [activeTab, setActiveTab] = useState<'INSPECTION' | 'SPECS' | 'SIMILAR'>('INSPECTION');

    const handle360Drag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!is360Mode || !images.length || images.length <= 1) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        
        if (dragStartX === 0) {
            setDragStartX(clientX);
            return;
        }

        const diff = clientX - dragStartX;
        if (Math.abs(diff) > 12) {
            const step = diff > 0 ? -1 : 1;
            setActiveImage((prev) => {
                let next = prev + step;
                if (next < 0) next = images.length - 1;
                if (next >= images.length) next = 0;
                return next;
            });
            setDragStartX(clientX);
        }
    };

    const stop360Drag = () => {
        setDragStartX(0);
    };

    const [car, setCar] = useState<{
        title: string;
        make: string | { name: string } | null;
        model: string;
        year: number;
        mileage?: number;
        price?: number;
        priceSar?: number;
        priceUsd?: number;
        basePriceUsd?: number;
        priceKrw?: number;
        fuelType?: string;
        transmission?: string;
        category?: string;
        color?: string;
        description?: string;
        images?: string[];
        isActive?: boolean;
        agency?: {
            name: string;
            logoUrl?: string;
            location?: string;
        };
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [whatsapp, setWhatsapp] = useState('');
    const [similarCars, setSimilarCars] = useState<any[]>([]);

    const loadSimilarCars = useCallback(async (currentMake: any, currentId: string) => {
        try {
            const makeName = typeof currentMake === 'object' ? currentMake?.name : currentMake;
            const makeStr = String(makeName || '').trim();

            const res = await api.cars.list({ limit: 12, isActive: true });
            let list: any[] = [];
            if (res?.data?.cars) {
                list = res.data.cars;
            } else if (res?.cars) {
                list = res.cars;
            } else if (Array.isArray(res)) {
                list = res;
            } else if (res?.data && Array.isArray(res.data)) {
                list = res.data;
            }

            const currentIdStr = String(currentId);
            const filtered = list
                .filter((c: any) => {
                    const cId = String(c._id || c.id);
                    return cId !== currentIdStr;
                })
                .sort((a: any, b: any) => {
                    const aMake = String(a.makeAr || a.make || '').toLowerCase();
                    const bMake = String(b.makeAr || b.make || '').toLowerCase();
                    const matchA = aMake.includes(makeStr.toLowerCase()) ? 1 : 0;
                    const matchB = bMake.includes(makeStr.toLowerCase()) ? 1 : 0;
                    return matchB - matchA;
                })
                .slice(0, 4)
                .map((c: any) => ({
                    id: String(c._id || c.id),
                    title: formatCarTitle(c.title || `${c.makeAr || c.make} ${c.model} ${c.year}`, c.makeAr || c.make, isRTL),
                    make: c.make || '',
                    model: c.model || '',
                    year: Number(c.year) || 0,
                    price: Number(c.price) || Number(c.priceSar) || 0,
                    priceSar: Number(c.price) || Number(c.priceSar) || 0,
                    images: Array.isArray(c.images) ? c.images : [c.imageUrl].filter(Boolean),
                    mileage: Number(c.mileage) || 0,
                    fuelType: c.fuelType || c.fuel,
                    transmission: c.transmission,
                    isActive: c.isActive !== false,
                    isSold: c.isSold === true
                }));

            setSimilarCars(filtered);
        } catch (err) {
            console.error('Failed to load similar cars:', err);
        }
    }, [isRTL]);

    const loadCar = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.cars.getById(id as string);
            if (res?.success && res.data) {
                const rawCar = res.data;
                const formattedTitle = formatCarTitle(rawCar.title || `${rawCar.make} ${rawCar.model}`, rawCar.make, isRTL);
                setCar({ ...rawCar, title: formattedTitle });
                const carMake = rawCar.make;
                const carId = rawCar._id || rawCar.id || (id as string);
                loadSimilarCars(carMake, carId);
            } else {
                setError(isRTL ? 'لم يتم العثور على السيارة' : 'Car not found');
            }
        } catch (err) {
            console.error('Failed to load car:', err);
            setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Failed to load car data');
        } finally {
            setLoading(false);
        }
    }, [id, isRTL, loadSimilarCars]);

    useEffect(() => {
        if (id) loadCar();
    }, [id, loadCar]);

    useEffect(() => {
        api.settings.getPublic().then((res: { success: boolean; data?: { socialLinks?: { whatsapp?: string } } }) => {
            if (res?.success && res.data?.socialLinks?.whatsapp) {
                setWhatsapp(res.data.socialLinks.whatsapp);
            } else {
                setWhatsapp(DEFAULT_WHATSAPP);
            }
        }).catch(() => {
            setWhatsapp(DEFAULT_WHATSAPP);
        });
    }, []);

    const handleWhatsappOrder = async () => {
        if (!car) return;
        
        ReactGA.event({
            category: 'Conversion',
            action: 'WhatsApp_Order_Click',
            label: car.title,
            value: Number(car.price || 0)
        });

        try {
            let buyerId = null;
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try {
                        const u = JSON.parse(userJson);
                        buyerId = u?._id || u?.id;
                    } catch { }
                }
            }

            await api.orders.create({
                buyerId: buyerId || null,
                items: [{
                    itemType: 'car',
                    refId: (car as any)._id || (car as any).id || id,
                    titleSnapshot: car.title,
                    qty: 1,
                    unitPriceSar: car.priceSar || car.price || 0
                }],
                pricing: {
                    grandTotalSar: car.priceSar || car.price || 0
                },
                channel: 'whatsapp',
                notes: `طلب شراء عبر الواتساب من صفحة السيارة الكورية`
            });
        } catch (err) {
            console.error('Failed to log order:', err);
        }

        const phone = (whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, '');
        const msg = encodeURIComponent(
            isRTL 
                ? `مرحباً إتش إم كار 👋\nأود طلب وتأكيد شراء سيارة المعرض/المزاد:\n🚗 *${car.title}*\n💰 السعر: ${displayPrice}\n🆔 رمز السيارة: #${(car as any)._id || id}`
                : `Hello HM CAR 👋\nI want to order car:\n🚗 *${car.title}*\n💰 Price: ${displayPrice}\n🆔 ID: #${(car as any)._id || id}`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Navbar />
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin mx-auto" />
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.4em] font-black animate-pulse">
                        {isRTL ? rawText('جاري التحميل...') : rawText('LOADING...')}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !car) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <Navbar />
                <AlertCircle className="w-20 h-20 text-white/10" />
                <h1 className="text-2xl font-black uppercase text-white/30 tracking-widest">
                    {error || (isRTL ? rawText('لم يتم العثور على السيارة') : rawText('Car not found'))}
                </h1>
                <button
                    onClick={() => router.push('/cars')}
                    className="px-8 py-4 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-2xl text-[#C9A96E] text-[11px] font-black uppercase tracking-widest hover:bg-[#C9A96E]/20 transition-all"
                >
                    {isRTL ? rawText('العودة للمعرض') : rawText('GO BACK')}
                </button>
            </div>
        );
    }

    const getBaseUsd = (payload: { basePriceUsd?: number; priceUsd?: number; priceSar?: number; price?: number; priceKrw?: number }) => {
        const baseUsd = toFiniteNumber(payload?.basePriceUsd);
        if (baseUsd && baseUsd > 0) return baseUsd;

        const priceUsd = toFiniteNumber(payload?.priceUsd);
        if (priceUsd && priceUsd > 0) return priceUsd;

        const priceSar = toFiniteNumber(payload?.priceSar ?? payload?.price);
        if (priceSar && priceSar > 0) return priceSar / Number(currency.usdToSar || 1);

        const priceKrw = toFiniteNumber(payload?.priceKrw);
        if (priceKrw && priceKrw > 0) return priceKrw / Number(currency.usdToKrw || 1);

        return 0;
    };

    const carMake = typeof car.make === 'object' ? car.make?.name : car.make;
    const images = car.images?.filter(Boolean) || [];
    const baseUsd = getBaseUsd(car);
    const displayPrice = formatPriceFromUsd
        ? formatPriceFromUsd(baseUsd)
        : (formatPrice ? formatPrice(Number(car.priceSar || car.price || 0)) : `${Number(car.priceSar || car.price || 0).toLocaleString()} ${CURRENCY_SAR}`);

    const specs = [
        { icon: Calendar, label: isRTL ? 'سنة الصنع' : 'YEAR', value: car.year },
        { icon: Gauge, label: isRTL ? 'المسافة المقطوعة' : 'MILEAGE', value: car.mileage ? `${car.mileage.toLocaleString()} ${isRTL ? 'كم' : 'KM'}` : '—' },
        { icon: Fuel, label: isRTL ? 'نوع الوقود' : 'FUEL', value: car.fuelType || '—' },
        { icon: Settings2, label: isRTL ? 'ناقل الحركة' : 'TRANSMISSION', value: car.transmission || '—' },
        { icon: Car, label: isRTL ? 'الفئة والهيكل' : 'CATEGORY', value: car.category || '—' },
        { icon: Tag, label: isRTL ? 'اللون الخارجي' : 'COLOR', value: car.color || '—' },
    ];

    return (
        <div className="relative min-h-screen bg-[#08080c] text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <main className="relative z-10 pt-24 sm:pt-28 pb-28 px-3 sm:px-6 max-w-7xl mx-auto">
                {/* Back button — سهم عودة أنيق بدون نص */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => router.push('/cars')}
                    className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-[#C9A96E]/50 flex items-center justify-center transition-all shadow-lg mb-6 group cursor-pointer"
                    title={isRTL ? 'العودة لقائمة السيارات' : 'Back to cars list'}
                >
                    <ChevronLeft className={cn('w-5 h-5 transition-transform group-hover:-translate-x-0.5', isRTL && 'rotate-180 group-hover:translate-x-0.5')} />
                </motion.button>

                {/* ── Top Header Section (Title & Price Banner matching Desert Korea Auto) ── */}
                <div className="bg-[#10101a] border border-white/8 rounded-3xl p-5 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                    <div>
                        <span className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest block mb-1">
                            {carMake} · {car.year}
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                            {car.title}
                        </h1>
                    </div>
                    <div className="flex flex-col items-start sm:items-end bg-white/4 border border-white/8 px-5 py-3 rounded-2xl">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? 'السعر الشامل التقديري' : 'ESTIMATED PRICE'}</span>
                        <span className="text-2xl sm:text-3xl font-black text-[#C9A96E] cockpit-num">{displayPrice}</span>
                    </div>
                </div>

                {/* ── Image Carousel Container with Navigation Arrows & Dots ── */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[550px] rounded-3xl overflow-hidden border border-white/10 bg-[#08080d] mb-6 shadow-2xl group">
                    {images.length > 0 ? (
                        <WatermarkImage src={images[activeImage]} alt={car.title} fill className="object-cover" unoptimized watermarkPosition="br" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-20 h-20 text-white/10" />
                        </div>
                    )}

                    {/* ── أسهم التبديل فوق الصورة الرئيسية (< >) ── */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1)); }}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-30"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1)); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-black flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 z-30"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                            </button>
                        </>
                    )}

                    {/* ── نقاط التنفيذ أسفل الصورة الرئيسية (Pagination Dots) ── */}
                    {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        activeImage === idx ? "bg-[#C9A96E] w-5" : "bg-white/30 hover:bg-white/60"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── الشريط المصغر للصور (Thumbnails Row) ── */}
                {images.length > 1 && (
                    <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-none mb-10">
                        {images.map((img: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(idx)}
                                className={cn(
                                    'relative w-20 h-16 sm:w-24 sm:h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all',
                                    activeImage === idx ? 'border-[#C9A96E] shadow-[0_0_15px_rgba(201,169,110,0.4)] scale-105' : 'border-white/10 opacity-50 hover:opacity-80'
                                )}
                            >
                                <WatermarkImage src={img} alt={`img ${idx + 1}`} fill className="object-cover" unoptimized showWatermark={false} />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── زر الطلب الرئيسي المباشر عبر الواتساب (WhatsApp Direct Order) ── */}
                <div className="mb-10">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleWhatsappOrder}
                        className="w-full py-4.5 sm:py-5 rounded-2xl text-white font-black uppercase text-sm sm:text-base tracking-wider flex items-center justify-center gap-3 shadow-2xl transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #25D366, #128C7E)',
                            boxShadow: '0 8px 30px rgba(37,211,102,0.4)'
                        }}
                    >
                        <MessageCircle className="w-6 h-6 fill-white" />
                        <span>{isRTL ? 'طلب عبر الواتساب' : 'Order via WhatsApp'}</span>
                    </motion.button>
                </div>

                {/* ── التبويبات التفاعلية (Tabs: تقرير الفحص | المواصفات | سيارات مشابهة) ── */}
                <div className="bg-[#101018] border border-white/8 rounded-3xl p-4 sm:p-6 mb-12">
                    <div className="flex items-center gap-2 border-b border-white/8 pb-4 mb-6 overflow-x-auto">
                        {[
                            { key: 'INSPECTION', labelAr: 'تقرير الفحص 📋', labelEn: 'Inspection Report 📋', icon: FileCheck2 },
                            { key: 'SPECS', labelAr: 'المواصفات ⚙️', labelEn: 'Specifications ⚙️', icon: ListFilter },
                            { key: 'SIMILAR', labelAr: 'سيارات مشابهة 🚗', labelEn: 'Similar Cars 🚗', icon: Car },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={cn(
                                    "px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border",
                                    activeTab === tab.key
                                        ? "bg-[#d97706] text-white border-[#d97706] shadow-[0_0_20px_rgba(217,119,6,0.4)]"
                                        : "bg-white/4 text-white/50 border-white/8 hover:text-white hover:bg-white/8"
                                )}
                            >
                                <span>{isRTL ? tab.labelAr : tab.labelEn}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: تقرير الفحص والتخطيط التوضيحي للهيكل (Inspection Body Diagram) */}
                    {activeTab === 'INSPECTION' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#C9A96E]" />
                                    {isRTL ? 'تقرير الفحص الفني المعتمد' : 'Certified Technical Inspection'}
                                </h3>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black">
                                    ✓ {isRTL ? 'مفحوصة بالكامل' : 'Fully Inspected'}
                                </span>
                            </div>

                            {/* رسم توضيحي لمجسم الفحص الهيكلي 2D Diagram */}
                            <div className="bg-[#08080d] border border-white/8 rounded-2xl p-6 flex flex-col items-center">
                                <div className="text-xs font-bold text-white/40 mb-4">{isRTL ? 'مخطط حالة جسم السيارة (الهيكل الخارجي)' : 'Vehicle Body Inspection Diagram'}</div>
                                
                                {/* SVG/Image 2D Inspection Diagram matching Desert Korea Auto */}
                                <div className="relative w-full max-w-md aspect-[16/10] bg-white/95 rounded-2xl p-4 flex items-center justify-center border-2 border-[#C9A96E]/30 shadow-inner">
                                    <svg viewBox="0 0 400 240" className="w-full h-full text-zinc-800">
                                        {/* Car contour shapes */}
                                        <rect x="50" y="30" width="300" height="180" rx="40" fill="none" stroke="#27272a" strokeWidth="3" />
                                        <circle cx="100" cy="40" r="22" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                        <circle cx="300" cy="40" r="22" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                        <circle cx="100" cy="200" r="22" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                        <circle cx="300" cy="200" r="22" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                        
                                        {/* Body Panels */}
                                        <rect x="130" y="50" width="140" height="40" rx="8" fill="#f4f4f5" stroke="#71717a" strokeWidth="1.5" />
                                        <text x="200" y="75" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#18181b">P (وكالة)</text>

                                        <rect x="130" y="100" width="140" height="40" rx="8" fill="#f4f4f5" stroke="#71717a" strokeWidth="1.5" />
                                        <text x="200" y="125" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#18181b">A (سليم)</text>

                                        <rect x="130" y="150" width="140" height="40" rx="8" fill="#f4f4f5" stroke="#71717a" strokeWidth="1.5" />
                                        <text x="200" y="175" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#18181b">P (سليم)</text>
                                    </svg>
                                </div>

                                {/* Legend guide (دليل الفحص) */}
                                <div className="mt-6 flex flex-wrap justify-center gap-3 w-full">
                                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                        P : {isRTL ? 'طلاء وكالة (سليم)' : 'Original Paint'}
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                                        A : {isRTL ? 'خالي من الحوادث' : 'No Accident'}
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                                        W : {isRTL ? 'رش مصنع تجميلي' : 'Factory Touch-up'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: المواصفات والتفاصيل */}
                    {activeTab === 'SPECS' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {specs.map((spec) => (
                                    <div key={spec.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-1.5">
                                        <spec.icon className="w-4 h-4 text-[#C9A96E]" />
                                        <div className="text-[9px] font-black uppercase tracking-widest text-white/40">{spec.label}</div>
                                        <div className="text-sm font-black text-white capitalize">{spec.value}</div>
                                    </div>
                                ))}
                            </div>
                            {car.description && (
                                <div className="bg-white/2 border border-white/8 rounded-2xl p-5 mt-4">
                                    <h4 className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">{isRTL ? 'الوصف والملاحظات' : 'Description'}</h4>
                                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{car.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: سيارات مشابهة */}
                    {activeTab === 'SIMILAR' && (
                        <div>
                            {similarCars.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {similarCars.map((item, idx) => (
                                        <ModernCarCard key={item.id} car={item} index={idx} formatPrice={formatPrice} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40 text-center py-8">{isRTL ? 'لا توجد سيارات مشابهة حالياً' : 'No similar cars found'}</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* ── Floating Mobile WhatsApp Order Button ── */}
            <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none lg:hidden">
                <div className="max-w-lg mx-auto pointer-events-auto">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={handleWhatsappOrder}
                        className="w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl"
                        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                    >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>{isRTL ? 'طلب عبر الواتساب' : 'Order via WhatsApp'}</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
