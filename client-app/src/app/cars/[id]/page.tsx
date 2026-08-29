'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    ChevronLeft, ChevronRight, MessageCircle, Fuel, Gauge, Settings2,
    Calendar, Car, Tag, CheckCircle, AlertCircle, Image as ImageIcon, Globe,
    FileCheck2, ShieldCheck, ListFilter, Calculator, Scale, ExternalLink,
    X, Check, DollarSign, Info, UserCheck, Shield, Heart, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import WatermarkImage from '@/components/WatermarkImage';
import ModernCarCard from '@/components/ModernCarCard';
import { api } from '@/lib/api-original';
import { processCarImages, getProxiedImageUrl } from '@/lib/imageUtils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/lib/ToastContext';
import { cn } from '@/lib/utils';
import { formatCarTitle, cleanKoreanText } from '@/lib/brandTranslations';

const DEFAULT_WHATSAPP = '+821080880014';
const PLATFORM_NAME = 'HM CAR';
const CURRENCY_SAR = 'ر.س';

// ── قائمة المميزات الافتراضية ──
const DEFAULT_CAR_FEATURES = [
    'نظام منع انغلاق المكابح (ABS)',
    'مشغل أقراص مدمجة',
    'شاشة AV للمقاعد الأمامية',
    'نظام ملاحة متطور',
    'قفل أبواب كهربائي',
    'نوافذ كهربائية',
    'عجلة قيادة كهربائية',
    'مقاعد جلدية فاخرة',
    'مكيف هواء أوتوماتيكي ثنائي المناطق',
    'عجلات ألومنيوم',
    'مرآة داخلية خافضة للإضاءة تلقائياً',
    'مرايا جانبية كهربائية قابلة للطي',
    'وسائد هوائية جانبية وللركب',
    'نظام التثبيت الإلكتروني (ESC)',
    'حساسات ركن أمامية وخلفية',
    'كاميرا خلفية عالية الدقة',
    'مقاعد كهربائية مع ذاكرة',
    'مصابيح أمامية LED',
    'زر تشغيل المحرك ودخول بدون مفتاح',
    'فرامل يد إلكترونية (EPB)'
];

const DEFAULT_CAR_FEATURES_EN = [
    'Anti-lock Braking System (ABS)',
    'CD / MP3 Player',
    'Front AV Navigation Display',
    'Advanced Navigation System',
    'Electric Central Door Lock',
    'Power Electric Windows',
    'Power Steering Wheel',
    'Premium Leather Seats',
    'Dual Automatic Climate Control',
    'Alloy Rims & Wheels',
    'Auto-Dimming ECM Rear Mirror',
    'Electric Folding Side Mirrors',
    'Side & Knee Airbags',
    'Electronic Stability Control (ESC)',
    'Front & Rear Parking Sensors',
    'High-Resolution Rear Camera',
    'Electric Power Seats with Memory',
    'Full LED Headlamps',
    'Engine Start Button & Smart Key',
    'Electronic Parking Brake (EPB)'
];

export default function DesertStyleCarDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, formatPriceFromUsd, currency } = useSettings();
    const { showToast } = useToast();

    const [car, setCar] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [whatsapp, setWhatsapp] = useState('');
    const [similarCars, setSimilarCars] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'SPECS' | 'INSPECTION' | 'SIMILAR'>('SPECS');
    const [isFav, setIsFav] = useState(false);
    const [favAnimating, setFavAnimating] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxZoomed, setLightboxZoomed] = useState(false);

    // Modals
    const [showCalcModal, setShowCalcModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

    // ── دوال التنقل بين الصور (يجب تعريفها قبل أي return مشروط)
    // [[FIX]] جمع كل مصادر الصور المتاحة لضمان ظهور الأسهم حتى لو images فارغة
    const allImages = car ? (() => {
        const c = car as any;
        // جمع كل الصور من جميع الحقول
        const rawImgs: string[] = [
            ...(Array.isArray(c.watermarkedImages) ? c.watermarkedImages : []),
            ...(Array.isArray(c.images) ? c.images : []),
            ...(c.mainImage ? [c.mainImage] : []),
            ...(c.imageUrl ? [c.imageUrl] : []),
            ...(c.image ? [c.image] : []),
        ].filter((img): img is string => !!img && typeof img === 'string' && img.trim() !== '');
        // إزالة المكررات مع الحفاظ على الترتيب
        const unique = [...new Set(rawImgs)];
        return processCarImages(unique);
    })() : [];

    const goNextImage = useCallback(() => {
        if (!allImages || allImages.length === 0) return;
        setActiveImage(prev => (prev + 1) % allImages.length);
    }, [allImages]);

    const goPrevImage = useCallback(() => {
        if (!allImages || allImages.length === 0) return;
        setActiveImage(prev => (prev - 1 + allImages.length) % allImages.length);
    }, [allImages]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') { if (isRTL) { goNextImage(); } else { goPrevImage(); } }
            else if (e.key === 'ArrowLeft') { if (isRTL) { goPrevImage(); } else { goNextImage(); } }
            else if (e.key === 'Escape' && lightboxOpen) { setLightboxOpen(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [goNextImage, goPrevImage, isRTL, lightboxOpen]);

    const loadSimilarCars = useCallback(async (currentMake: any, currentId: string) => {

        try {
            const makeName = typeof currentMake === 'object' ? currentMake?.name : currentMake;
            const makeStr = String(makeName || '').trim();

            const res = await api.cars.list({ limit: 12, isActive: true });
            let list: any[] = [];
            if (res?.data?.cars) list = res.data.cars;
            else if (res?.cars) list = res.cars;
            else if (Array.isArray(res)) list = res;
            else if (res?.data && Array.isArray(res.data)) list = res.data;

            const currentIdStr = String(currentId);
            const filtered = list
                .filter((c: any) => String(c._id || c.id) !== currentIdStr)
                .sort((a: any, b: any) => {
                    const aMake = String(a.makeAr || a.make || '').toLowerCase();
                    const bMake = String(b.makeAr || b.make || '').toLowerCase();
                    return (bMake.includes(makeStr.toLowerCase()) ? 1 : 0) - (aMake.includes(makeStr.toLowerCase()) ? 1 : 0);
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
                loadSimilarCars(rawCar.make, rawCar._id || rawCar.id || (id as string));
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
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res.data?.socialLinks?.whatsapp) {
                setWhatsapp(res.data.socialLinks.whatsapp);
            } else {
                setWhatsapp(DEFAULT_WHATSAPP);
            }
        }).catch(() => setWhatsapp(DEFAULT_WHATSAPP));
    }, []);

    // Favorites logic
    useEffect(() => {
        if (!id) return;
        try {
            const favs: string[] = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            setIsFav(favs.includes(String(id)));
        } catch {}
    }, [id]);

    const toggleFav = useCallback(() => {
        if (!id) return;
        const key = String(id);
        try {
            const favs: string[] = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            const next = favs.includes(key) ? favs.filter((f: string) => f !== key) : [...favs, key];
            localStorage.setItem('hm_favorites', JSON.stringify(next));
            setIsFav(!isFav);
            setFavAnimating(true);
            window.dispatchEvent(new CustomEvent('favorites_updated'));
            setTimeout(() => setFavAnimating(false), 600);
        } catch {}
    }, [id, isFav]);



    const handleWhatsappOrder = async () => {
        if (!car) return;
        ReactGA.event({
            category: 'Conversion',
            action: 'WhatsApp_Order_Click',
            label: car.title,
            value: Number(car.price || 0)
        });

        const priceText = formatPrice(Number(car.priceSar || car.price || 0));

        try {
            let buyerId = null;
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try { buyerId = JSON.parse(userJson)?._id; } catch { }
                }
            }

            await api.orders.create({
                buyerId: buyerId || null,
                items: [{
                    itemType: 'car',
                    refId: car._id || car.id || id,
                    titleSnapshot: car.title,
                    qty: 1,
                    unitPriceSar: car.priceSar || car.price || 0
                }],
                pricing: { grandTotalSar: car.priceSar || car.price || 0 },
                channel: 'whatsapp',
                notes: isRTL ? `طلب شراء عبر الواتساب من موقع HM CAR` : `Purchase request via WhatsApp from HM CAR website`
            });
        } catch (err) {
            console.error('Order log error:', err);
        }

        const phone = (whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, '');
        const carMileage = car.mileage ? car.mileage.toLocaleString() + (isRTL ? ' كم' : ' km') : '—';
        const msg = encodeURIComponent(
            isRTL
                ? `مرحباً إتش إم كار 👋\nأود طلب وتأكيد شراء سيارة المعرض:\n🚗 *${car.title}*\n💰 السعر: ${priceText}\n📅 سنة الصنع: ${car.year}\n🛣️ المسافة: ${carMileage}\n🆔 رمز السيارة: #${car.externalId || car._id || id}`
                : `Hello HM CAR 👋\nI'd like to order this showroom car:\n🚗 *${car.title}*\n💰 Price: ${priceText}\n📅 Year: ${car.year}\n🛣️ Mileage: ${carMileage}\n🆔 Car ID: #${car.externalId || car._id || id}`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0a07] flex items-center justify-center">
                <Navbar />
                <div className="text-center space-y-4">
                    <div className="w-14 h-14 border-3 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin mx-auto" />
                    <p className="text-[#c9a96e] text-xs font-bold uppercase tracking-widest animate-pulse">
                        {isRTL ? 'جاري تحميل تفاصيل السيارة...' : 'LOADING CAR DETAILS...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !car) {
        return (
            <div className="min-h-screen bg-[#0d0a07] flex flex-col items-center justify-center gap-6">
                <Navbar />
                <AlertCircle className="w-20 h-20 text-red-500/30" />
                <h1 className="text-xl font-bold text-white">
                    {error || (isRTL ? 'لم يتم العثور على السيارة' : 'Car not found')}
                </h1>
                <button
                    onClick={() => router.push('/cars')}
                    className="px-6 py-3 bg-[#c9a96e] text-slate-950 font-bold rounded-xl hover:bg-[#b8985d] transition-all"
                >
                    {isRTL ? 'العودة لمعرض السيارات' : 'BACK TO CARS'}
                </button>
            </div>
        );
    }

    const images = allImages;
    const mainImg = images[activeImage] || getProxiedImageUrl((car as any).image || (car as any).imageUrl) || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200';
    const carPriceSar = Number((car as any).priceSar || (car as any).price || 0);
    const formattedPriceSar = carPriceSar > 0 ? formatPrice(carPriceSar) : (isRTL ? 'عند الطلب' : 'Call for price');
    const isKoreanImport = (car as any).source === 'korean_import' || (car as any).source === 'encar_korea' || (car as any).listingType === 'showroom';

    // حساب الجمارك والشحن التقريبي (حاسبة الاستيراد)
    const baseCarCost = Math.round(carPriceSar * 0.72);
    const shippingCost = 6500;
    const customsDuty = car.year < 2021 ? 7300 : Math.round(baseCarCost * 0.05);
    const vatAmount = Math.round((baseCarCost + shippingCost + customsDuty) * 0.15);
    const systemCommission = 3500;

    const specsList = [
        { label: isRTL ? 'الشركة المصنعة' : 'Manufacturer', value: cleanKoreanText(isRTL ? (car.specs?.makeAr || car.make) : (car.specs?.makeEn || car.make || 'Unspecified'), isRTL) },
        { label: isRTL ? 'الموديل' : 'Model', value: cleanKoreanText(isRTL ? (car.specs?.modelAr || car.model) : (car.specs?.modelEn || car.model || 'Unspecified'), isRTL) },
        { label: isRTL ? 'الفئة / الدرجة' : 'Trim Level', value: cleanKoreanText(isRTL ? (car.specs?.trimAr || 'برستيج') : (car.specs?.trimEn || 'Prestige'), isRTL) },
        { label: isRTL ? 'سنة الصنع' : 'Year', value: String(car.year || '—') },
        { label: isRTL ? 'المسافة المقطوعة' : 'Mileage', value: car.mileage ? `${Number(car.mileage).toLocaleString('en-US')} ${isRTL ? 'كم' : 'km'}` : '—' },
        { label: isRTL ? 'ناقل الحركة' : 'Transmission', value: cleanKoreanText(isRTL ? (car.specs?.transmissionAr || car.transmission || 'أوتوماتيك') : (car.specs?.transmissionEn || car.transmission || 'Automatic'), isRTL) },
        { label: isRTL ? 'نوع الوقود' : 'Fuel Type', value: cleanKoreanText(isRTL ? (car.specs?.fuelTypeAr || car.fuelType || 'بنزين') : (car.specs?.fuelTypeEn || car.fuelType || 'Gasoline'), isRTL) },
        { label: isRTL ? 'سعة المحرك' : 'Engine Displ.', value: car.specs?.engineCc || '1000cc' },
        { label: isRTL ? 'اللون الخارجي' : 'Exterior Color', value: cleanKoreanText(isRTL ? (car.specs?.colorAr || car.color || 'أسود') : (car.specs?.colorEn || car.color || 'Black'), isRTL) },
        { label: isRTL ? 'رقم الهيكل (VIN)' : 'VIN Number', value: car.specs?.vin || car.vin || '—' },
        { label: isRTL ? 'نظام الدفع' : 'Drive Type', value: cleanKoreanText(isRTL ? (car.specs?.driveTypeAr || 'دفع أمامي 2WD') : (car.specs?.driveTypeEn || 'Front Wheel Drive 2WD'), isRTL) }
    ];

    return (
        <div className="relative min-h-screen bg-[#0a0b10] text-slate-100 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── Top Header Bar ── */}
            <div className="pt-24 pb-6 bg-[#12141d]/90 border-b border-[#C9A96E]/20 backdrop-blur-2xl shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* زر العودة */}
                    <button
                        onClick={() => router.push('/cars')}
                        className="flex items-center gap-2 text-xs font-bold text-[#C9A96E] hover:text-white transition-colors mb-4"
                    >
                        <ChevronRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
                        <span>{isRTL ? 'العودة لمعرض السيارات' : 'Back to Showroom'}</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* العنوان والتفاصيل */}
                        <div>
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                    {formatCarTitle(car.title, car.make, isRTL)}
                                </h1>
                                <span className="px-3 py-1 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-xs font-bold text-amber-300">
                                    {cleanKoreanText(car.specs?.badge || car.model || '', isRTL) || (isRTL ? 'معرض HM CAR' : 'HM SHOWROOM')}
                                </span>
                            </div>

                            {/* شارات الحالة + مواصفات سريعة */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    {isRTL ? 'متاح الآن' : 'Available Now'}
                                </span>
                                {car.year && <span className="px-2 py-1 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">📅 {car.year}</span>}
                                {car.mileage && <span className="px-2 py-1 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">🛣️ {Number(car.mileage).toLocaleString()} {isRTL ? 'كم' : 'km'}</span>}
                                {car.transmission && <span className="px-2 py-1 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">⚙️ {cleanKoreanText(car.transmission, isRTL)}</span>}
                                {car.fuelType && <span className="px-2 py-1 rounded-full bg-white/5 text-white/60 text-xs font-bold border border-white/10">⛽ {cleanKoreanText(car.fuelType, isRTL)}</span>}
                            </div>
                        </div>

                        {/* سعر السيارة + زر المفضلة المريح */}
                        <div className="bg-[#181a26] border border-[#C9A96E]/40 rounded-2xl p-4 md:text-left flex flex-col md:items-end justify-center shadow-xl gap-2">
                            <div className="text-[11px] text-[#C9A96E] font-bold uppercase tracking-wider">{isRTL ? 'السعر الإجمالي الشامل' : 'Total Included Price'}</div>
                            <div className="flex items-center gap-3">
                                <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">{formattedPriceSar}</div>
                                <motion.button
                                    onClick={toggleFav}
                                    animate={favAnimating ? { scale: [1, 1.3, 0.9, 1.1, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg transition-all duration-300",
                                        isFav
                                            ? "bg-red-500 border-red-400 text-white shadow-red-500/40"
                                            : "bg-white/10 border-white/20 text-white/70 hover:bg-red-500/20 hover:border-red-400/50 hover:text-red-400"
                                    )}
                                    title={isFav ? (isRTL ? 'إزالة من المفضلة' : 'Remove from Favorites') : (isRTL ? 'إضافة للمفضلة' : 'Add to Favorites')}
                                >
                                    <Heart className={cn("w-5 h-5 transition-all", isFav && "fill-white text-white")} />
                                </motion.button>
                            </div>
                            {car.year < 2021 && (
                                <p className="text-[10px] text-slate-400 max-w-xs">
                                    {isRTL ? '* رسوم جمركية إضافية (+7300 ر.س للموديلات قبل 2021)' : '* Extra customs fee for pre-2021 models'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT GRID ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ────── LEFT COLUMN: Sticky Action Card ────── */}
                    <div className="lg:col-span-4 space-y-5 lg:order-1">
                        <div className="bg-[#141622] text-slate-100 rounded-3xl p-6 border border-[#C9A96E]/30 shadow-2xl space-y-6 lg:sticky lg:top-28">

                            {/* شارة التوفر والسعر */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                                    متاح الآن
                                </span>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block font-bold">السعر الكامل</span>
                                    <span className="text-2xl font-black text-amber-300 font-mono">{formattedPriceSar}</span>
                                </div>
                            </div>

                            {/* الجدول السريع للمواصفات */}
                            <div className="space-y-3 text-xs border-b border-white/10 pb-4">
                                <div className="flex justify-between py-1.5 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">سنة الصنع:</span>
                                    <span className="font-bold text-white font-mono">{car.year}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">المسافة المقطوعة:</span>
                                    <span className="font-bold text-white font-mono">{car.mileage ? `${Number(car.mileage).toLocaleString('en-US')} كم` : '—'}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">ناقل الحركة:</span>
                                    <span className="font-bold text-white">{cleanKoreanText(car.transmission || 'أوتوماتيك', isRTL)}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-bold">نوع الوقود:</span>
                                    <span className="font-bold text-white">{cleanKoreanText(car.fuelType || 'بنزين', isRTL)}</span>
                                </div>
                            </div>

                            {/* 🟢 زر الطلب الفاخر والمباشر عبر الواتساب بحواف دائرية كاملة */}
                            <button
                                onClick={handleWhatsappOrder}
                                style={{ borderRadius: '9999px' }}
                                className="relative w-full group overflow-hidden py-4 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-black text-base flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 border border-emerald-400/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/50 active:scale-98 cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.168L2 22l4.98-1.39A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.615 0-3.116-.437-4.407-1.198l-.316-.188-2.956.825.84-2.883-.207-.328A7.954 7.954 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
                                    </svg>
                                </div>
                                <span className="tracking-wide text-white drop-shadow-md">اطلب الآن عبر الواتساب</span>
                                <ChevronLeft className="w-5 h-5 opacity-75 group-hover:-translate-x-1 transition-transform" />
                            </button>

                            {/* أزرار الأدوات التفاعلية بحواف دائرية كاملة */}
                            <div className="space-y-2.5 pt-2">
                                <button
                                    onClick={() => setShowCalcModal(true)}
                                    style={{ borderRadius: '9999px' }}
                                    className="w-full py-3.5 rounded-full bg-[#C9A96E]/10 hover:bg-[#C9A96E]/20 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-[#C9A96E]/40 transition-all hover:scale-[1.01]"
                                >
                                    <Calculator className="w-4 h-4 text-amber-300" />
                                    <span>حاسبة تكلفة الاستيراد</span>
                                </button>

                                <button
                                    onClick={() => setShowCompareModal(true)}
                                    style={{ borderRadius: '9999px' }}
                                    className="w-full py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all hover:scale-[1.01]"
                                >
                                    <Scale className="w-4 h-4 text-amber-400" />
                                    <span>مقارنة بسعر الجديد</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ────── RIGHT COLUMN: Gallery & Interactive Tabs (الجانب الأيمن للصور والتبويبات) ────── */}
                    <div className="lg:col-span-8 space-y-8 lg:order-2">

                        {/* 1. Main Hero Image Viewer with Navigation + Zoom */}
                        <div className="relative aspect-[16/10] bg-slate-950 rounded-3xl overflow-hidden border-2 border-[#8a683a] shadow-2xl group">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeImage}
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.35 }}
                                    className="absolute inset-0"
                                >
                                    <WatermarkImage
                                        src={mainImg}
                                        alt={car.title}
                                        fill
                                        className="object-cover cursor-zoom-in"
                                        unoptimized
                                        watermarkPosition="br"
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* زر التكبير / Lightbox */}
                            <button
                                onClick={() => setLightboxOpen(true)}
                                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[#C9A96E] hover:border-[#C9A96E] transition-all shadow-xl"
                                title="تكبير الصورة"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>

                             {/* أسهم التصفح الفاخرة */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={isRTL ? goNextImage : goPrevImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#C9A96E] hover:text-black border border-white/20 hover:border-[#C9A96E] text-white shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 active:scale-90 z-20 flex items-center justify-center group"
                                        aria-label="Previous Image"
                                    >
                                        <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={isRTL ? goPrevImage : goNextImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-[#C9A96E] hover:text-black border border-white/20 hover:border-[#C9A96E] text-white shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 active:scale-90 z-20 flex items-center justify-center group"
                                        aria-label="Next Image"
                                    >
                                        <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    </button>
                                </>
                            )}

                            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-mono">
                                {activeImage + 1} / {images.length || 1}
                            </div>
                        </div>

                        {/* Lightbox Modal - عارض الصور المكبّر */}
                        <AnimatePresence>
                            {lightboxOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
                                    onClick={() => { setLightboxOpen(false); setLightboxZoomed(false); }}
                                >
                                    {/* زر الإغلاق */}
                                    <button
                                        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10"
                                        onClick={() => { setLightboxOpen(false); setLightboxZoomed(false); }}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    {/* زر التكبير/التصغير */}
                                    <button
                                        className="absolute top-4 left-16 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-[#C9A96E]/30 transition-all z-10"
                                        onClick={(e) => { e.stopPropagation(); setLightboxZoomed(!lightboxZoomed); }}
                                    >
                                        {lightboxZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                                    </button>

                                    {/* العداد */}
                                    <div className="absolute top-5 left-4 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono">
                                        {activeImage + 1} / {images.length}
                                    </div>

                                    {/* الصورة الرئيسية */}
                                    <motion.div
                                        className="relative w-full h-full flex items-center justify-center px-16"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <motion.img
                                            key={activeImage}
                                            src={mainImg}
                                            alt={car.title}
                                            animate={{ scale: lightboxZoomed ? 1.8 : 1 }}
                                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl cursor-pointer select-none"
                                            onClick={() => setLightboxZoomed(!lightboxZoomed)}
                                            draggable={false}
                                        />
                                    </motion.div>

                                    {/* أسهم التنقل الفاخرة في الـ Lightbox */}
                                    {images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if (isRTL) { goNextImage(); } else { goPrevImage(); } }} 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:text-black hover:border-[#C9A96E] transition-all shadow-2xl backdrop-blur-xl group z-20"
                                            >
                                                <ChevronRight className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if (isRTL) { goPrevImage(); } else { goNextImage(); } }} 
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:text-black hover:border-[#C9A96E] transition-all shadow-2xl backdrop-blur-xl group z-20"
                                            >
                                                <ChevronLeft className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </>
                                    )}

                                    {/* الصور المصغرة في أسفل الـ Lightbox */}
                                    {images.length > 1 && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4">
                                            {images.map((img: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                                                    className={cn(
                                                        "relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                                                        activeImage === idx ? "border-[#C9A96E] scale-110" : "border-white/20 opacity-50 hover:opacity-80"
                                                    )}
                                                >
                                                    <img src={img} alt={`${idx}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 2. Photo Thumbnails Grid */}
                        {images.length > 1 && (
                            <div className="bg-[#141622] border border-[#C9A96E]/20 rounded-2xl p-3">
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#C9A96E]">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={cn(
                                                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0",
                                                activeImage === idx ? "border-[#C9A96E] scale-105 shadow-xl" : "border-white/10 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Image src={img} alt={`thumb ${idx}`} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. INTERACTIVE TABS */}
                        <div className="bg-[#141622] border border-[#C9A96E]/30 rounded-3xl p-6 shadow-2xl space-y-6">

                            {/* Tab Header Buttons */}
                            <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
                                {[
                                    { key: 'SPECS', label: 'المواصفات', icon: ListFilter },
                                    { key: 'INSPECTION', label: 'الفحص والمميزات', icon: FileCheck2 },
                                    { key: 'SIMILAR', label: 'سيارات مشابهة', icon: Car },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border",
                                            activeTab === tab.key
                                                ? "bg-[#C9A96E] text-slate-950 border-[#C9A96E] shadow-xl shadow-[#C9A96E]/20"
                                                : "bg-white/5 text-amber-200/80 border-white/10 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* TAB 1: المواصفات */}
                            {activeTab === 'SPECS' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-amber-300 border-r-4 border-[#C9A96E] pr-3">
                                        المواصفات التفصيلية للسيارة
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {specsList.map(spec => (
                                            <div key={spec.label} className="flex justify-between items-center p-3.5 rounded-2xl bg-[#1a1c2b] border border-white/10 text-sm">
                                                <span className="text-slate-400 font-bold">{spec.label}</span>
                                                <span className="font-bold text-white font-mono">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {car.description && (
                                        <div className="p-4 rounded-2xl bg-[#1a1c2b] border border-white/10">
                                            <h4 className="text-xs font-bold text-[#C9A96E] uppercase mb-2">الوصف الكامل والملاحظات</h4>
                                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{cleanKoreanText(car.description, isRTL)}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: الفحص والمميزات (Inspection & Features) */}
                            {activeTab === 'INSPECTION' && (
                                <div className="space-y-8">

                                    {/* المميزات العامة (Features Badges) */}
                                    <div>
                                        <h3 className="text-base font-black text-amber-300 border-r-4 border-[#C9A96E] pr-3 mb-4">
                                            {isRTL ? 'المميزات والخيارات المتاحة' : 'Features & Available Options'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {((isRTL ? car.featuresAr : car.featuresEn) || (isRTL ? DEFAULT_CAR_FEATURES : DEFAULT_CAR_FEATURES_EN)).map((feat: string, idx: number) => (
                                                <span key={idx} className="px-3 py-2 rounded-xl bg-[#1a1c2b] border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>{feat}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* تقرير الفحص والهيكل التفاعلي */}
                                    <div className="bg-[#1a1c2b] border border-white/10 rounded-2xl p-6 space-y-6">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                <span>{isRTL ? 'تقرير الفحص الهيكلي وتفاصيل الأضرار' : 'Vehicle Body Inspection & Condition Report'}</span>
                                            </h3>
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                                                {isRTL ? '✓ فحص HM CAR معتمد' : '✓ HM CAR Certified Inspection'}
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>{(isRTL ? car.inspectionReport?.statusAr : car.inspectionReport?.statusEn) || (isRTL ? 'لا توجد أضرار مُسجّلة على هيكل هذه السيارة' : 'No accident damage recorded on vehicle body')}</span>
                                        </div>

                                        {/* الرسم التوضيحي الواقعي المعتمد للهيكل والشاسيه */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0e1017] p-6 rounded-3xl border border-white/10 shadow-2xl">
                                                {/* 1. Outer Body Parts */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-[#C9A96E]">خريطة الهيكل الخارجي (Outer Body Status)</span>
                                                        <span className="text-[10px] font-bold text-slate-400">فحص كوري معتمد</span>
                                                    </div>

                                                    <div className="relative bg-[#141622] rounded-2xl p-4 flex flex-col justify-between border border-white/10 space-y-2">
                                                        <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-bold">
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>الكبوت (Hood)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ سليم (وكالة)</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>السقف (Roof)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ سليم (وكالة)</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>الأبواب الأمامية (Front Doors)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ طلاء فابريكا</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>الأبواب الخلفية (Rear Doors)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ طلاء فابريكا</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>الرفارف (Fenders)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ سليم</div>
                                                            </div>
                                                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                                                <div>غطاء الشنطة (Trunk Lid)</div>
                                                                <div className="text-[10px] font-black text-emerald-400 font-mono">✓ سليم</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Chassis & Frame Status */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-[#C9A96E]">سلامة الشاسيه والأعمدة (Chassis & Pillars)</span>
                                                        <span className="text-[10px] font-bold text-emerald-400">100% خالية من التلحيم</span>
                                                    </div>

                                                    <div className="bg-[#141622] rounded-2xl p-4 flex flex-col justify-between border border-white/10 space-y-2">
                                                        <div className="space-y-2 text-[11px] font-bold">
                                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#1a1c2b] border border-white/10">
                                                                <span className="text-slate-300">الشاسيه الأمامي (Front Frame)</span>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black">سليم 100%</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#1a1c2b] border border-white/10">
                                                                <span className="text-slate-300">الأعمدة الجانبية (A/B/C Pillars)</span>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black">سليم 100%</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#1a1c2b] border border-white/10">
                                                                <span className="text-slate-300">أرضية الشنطة (Trunk Floor)</span>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black">بدون تعديل</span>
                                                            </div>
                                                            <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#1a1c2b] border border-white/10">
                                                                <span className="text-slate-300">الشاسيه الخلفي (Rear Frame)</span>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black">سليم 100%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* سجل التأمين والملكية المعتمد */}
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-bold text-[#C9A96E]">سجل التأمين والملكية والملاحظات</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                                                    <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 shadow-lg">
                                                        <div className="text-slate-400 text-[11px] font-bold">إجمالي الحوادث</div>
                                                        <div className="font-black text-emerald-400 text-sm font-mono mt-1">
                                                            {car.inspectionReport?.accidentCount || 0} {!(car.inspectionReport?.accidentCount > 0) ? '(خالية تماماً)' : ''}
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 shadow-lg">
                                                        <div className="text-slate-400 text-[11px] font-bold">مطالبات التأمين</div>
                                                        <div className="font-black text-emerald-400 text-sm font-mono mt-1">
                                                            {car.inspectionReport?.myAccidentCount || 0}
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 shadow-lg">
                                                        <div className="text-slate-400 text-[11px] font-bold">تغييرات الملكية</div>
                                                        <div className="font-black text-amber-300 text-sm font-mono mt-1">
                                                            {car.inspectionReport?.ownerChangeCount || 1} {!(car.inspectionReport?.ownerChangeCount > 1) ? '(مالك واحد)' : 'مالكين'}
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-white/10 shadow-lg">
                                                        <div className="text-slate-400 text-[11px] font-bold">سلامة الغرق والحريق</div>
                                                        <div className="font-black text-emerald-400 text-sm mt-1">
                                                            {car.inspectionReport?.hasFloodDamage || car.inspectionReport?.hasFireDamage ? '⚠️ توجد ملاحظات' : '✓ خالية 100%'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: سيارات مشابهة (Similar Cars) */}
                            {activeTab === 'SIMILAR' && (
                                <div className="space-y-4">
                                    <h3 className="text-base font-black text-amber-300 border-r-4 border-[#C9A96E] pr-3">
                                        سيارات أخرى قد تهمك
                                    </h3>
                                    {similarCars.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {similarCars.map((item, idx) => (
                                                <ModernCarCard key={item.id} car={item} index={idx} formatPrice={formatPrice} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center py-8">لا توجد سيارات مشابهة حالياً في المعرض</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* ── MODAL 1: حاسبة تكلفة الاستيراد (Import Cost Calculator Modal) ── */}
            <AnimatePresence>
                {showCalcModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#141622] text-slate-100 max-w-lg w-full rounded-3xl p-6 border border-[#C9A96E]/40 shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="font-black text-lg text-amber-300 flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-[#C9A96E]" />
                                    <span>{isRTL ? 'حاسبة تكلفة الاستيراد الشاملة' : 'Full Import Cost Calculator'}</span>
                                </h3>
                                <button onClick={() => setShowCalcModal(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{isRTL ? 'سعر السيارة الأساسي:' : 'Base Car Price:'}</span>
                                    <span className="font-bold font-mono text-white">{formatPrice(baseCarCost)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{isRTL ? 'الشحن والتأمين البحري:' : 'Shipping & Marine Insurance:'}</span>
                                    <span className="font-bold font-mono text-white">{formatPrice(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{isRTL ? 'الجمارك ورسوم التصدير:' : 'Customs & Export Fees:'}</span>
                                    <span className="font-bold font-mono text-amber-400">{formatPrice(customsDuty)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{isRTL ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                                    <span className="font-bold font-mono text-white">{formatPrice(vatAmount)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-white/5">
                                    <span className="text-slate-400 font-bold">{isRTL ? 'عمولة ومصاريف التخليص:' : 'Service & Clearance Fees:'}</span>
                                    <span className="font-bold font-mono text-white">{formatPrice(systemCommission)}</span>
                                </div>

                                <div className="flex justify-between py-3 rounded-2xl bg-[#1a1c2b] px-4 text-sm font-black text-amber-300 border border-[#C9A96E]/40">
                                    <span>{isRTL ? 'التكلفة التقديرية الكلية:' : 'Total Estimated Cost:'}</span>
                                    <span className="font-mono text-base">{formatPrice(
                                        (() => {
                                            const base = Number(car?.priceUsd || car?.basePriceUsd || 0) * 3.75;
                                            const ship = Number(car?.shippingCost || 1800);
                                            const customs = base * 0.05;
                                            const vat = (base + ship + customs) * 0.15;
                                            const commission = 1200;
                                            return Math.round(base + ship + customs + vat + commission);
                                        })()
                                    )}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setShowCalcModal(false); handleWhatsappOrder(); }}
                                className="w-full py-3.5 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all hover:scale-[1.01] shadow-lg shadow-emerald-950/40"
                            >
                                <MessageCircle className="w-4 h-4 fill-white" />
                                <span>تأكيد الطلب بهذا السعر عبر واتساب</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── MODAL 2: مقارنة بسعر الجديد (New Price Compare Modal) ── */}
            <AnimatePresence>
                {showCompareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#141622] text-slate-100 max-w-lg w-full rounded-3xl p-6 border border-[#C9A96E]/40 shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="font-black text-lg text-amber-300 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-[#C9A96E]" />
                                    <span>{isRTL ? 'مقارنة السعر مع الوكالة (الجديد)' : 'Price Comparison vs. Dealership (New)'}</span>
                                </h3>
                                <button onClick={() => setShowCompareModal(false)} className="p-1 rounded-full text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div className="p-4 rounded-2xl bg-[#1a1c2b] border border-white/10 space-y-2">
                                    <div className="flex justify-between font-bold">
                                        <span className="text-slate-400">{isRTL ? 'سعر السيارة الجديدة في الوكالة:' : 'New Car Price at Dealership:'}</span>
                                        <span className="text-slate-500 line-through font-mono">{formatPrice(carPriceSar * 1.65)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-400">
                                        <span>{isRTL ? 'سعر هذه السيارة المستوردة:' : 'This Imported Car Price:'}</span>
                                        <span className="font-mono text-sm">{formatPrice(carPriceSar)}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center font-bold">
                                    {isRTL
                                        ? <>🎉 نسبة التوفير: توفير قدره <span className="text-emerald-400 font-mono text-sm font-black">+{formatPrice(Math.round(carPriceSar * 0.65))}</span> مقارنة بالشراء جديداً!</>
                                        : <>🎉 Total Savings: You save <span className="text-emerald-400 font-mono text-sm font-black">+{formatPrice(Math.round(carPriceSar * 0.65))}</span> vs. buying new!</>
                                    }
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCompareModal(false)}
                                className="w-full py-3 rounded-full bg-[#C9A96E]/10 text-amber-300 border border-[#C9A96E]/30 font-bold text-xs hover:bg-[#C9A96E]/20 transition-colors"
                            >
                                {isRTL ? 'إغلاق النافذة' : 'Close'}
                            </button>
                        </motion.div>
                    </div>
                )}

            </AnimatePresence>
        </div>
    );
}
