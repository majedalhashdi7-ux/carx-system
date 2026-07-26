'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    ChevronLeft, ChevronRight, MessageCircle, Fuel, Gauge, Settings2,
    Calendar, Car, Tag, CheckCircle, AlertCircle, Image as ImageIcon, Globe,
    FileCheck2, ShieldCheck, ListFilter, Calculator, Scale, ExternalLink,
    X, Check, DollarSign, Info, UserCheck, Shield
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import WatermarkImage from '@/components/WatermarkImage';
import ModernCarCard from '@/components/ModernCarCard';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/lib/ToastContext';
import { cn } from '@/lib/utils';
import { formatCarTitle } from '@/lib/brandTranslations';

const DEFAULT_WHATSAPP = '+821080880014';
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

    // Modals
    const [showCalcModal, setShowCalcModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

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

    const handleWhatsappOrder = async () => {
        if (!car) return;
        ReactGA.event({
            category: 'Conversion',
            action: 'WhatsApp_Order_Click',
            label: car.title,
            value: Number(car.price || 0)
        });

        const priceText = Number(car.priceSar || car.price || 0).toLocaleString('ar-SA') + ' ر.س';

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
                notes: `طلب شراء عبر الواتساب من موقع HMCar (طراز كوري مستورد)`
            });
        } catch (err) {
            console.error('Order log error:', err);
        }

        const phone = (whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, '');
        const msg = encodeURIComponent(
            `مرحباً إتش إم كار 👋\nأود طلب وتأكيد شراء سيارة المعرض الكورية:\n🚗 *${car.title}*\n💰 السعر: ${priceText}\n📅 سنة الصنع: ${car.year}\n🛣️ المسافة: ${car.mileage ? car.mileage.toLocaleString() + ' كم' : '—'}\n🆔 رمز السيارة: #${car.externalId || car._id || id}`
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
                        {isRTL ? 'جاري تحميل تفاصيل السيارة الكورية...' : 'LOADING CAR DETAILS...'}
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

    const images = car.images?.filter(Boolean) || [];
    const mainImg = images[activeImage] || car.image || car.imageUrl || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200';
    const carPriceSar = Number(car.priceSar || car.price || 0);
    const formattedPriceSar = carPriceSar > 0 ? `${carPriceSar.toLocaleString('ar-SA')} ر.س` : 'عند الطلب';
    const externalEncarUrl = car.externalUrl || (car.externalId ? `https://www.encar.com/dc/dc/dcCarDetlView.do?carid=${car.externalId.replace('encar-', '')}` : 'https://www.encar.com');

    // حساب الجمارك والشحن التقريبي (حاسبة الاستيراد)
    const baseCarCost = Math.round(carPriceSar * 0.72);
    const shippingCost = 6500;
    const customsDuty = car.year < 2021 ? 7300 : Math.round(baseCarCost * 0.05);
    const vatAmount = Math.round((baseCarCost + shippingCost + customsDuty) * 0.15);
    const systemCommission = 3500;
    const calculatedTotal = baseCarCost + shippingCost + customsDuty + vatAmount + systemCommission;

    const specsList = [
        { label: 'الشركة المصنعة', value: car.makeAr || car.make || 'غير محدد' },
        { label: 'الموديل', value: car.model || 'غير محدد' },
        { label: 'تفاصيل الموديل', value: car.specs?.badge || car.category || 'Standard' },
        { label: 'سنة الصنع', value: String(car.year || '—') },
        { label: 'المسافة المقطوعة', value: car.mileage ? `${Number(car.mileage).toLocaleString('ar-SA')} كم` : '—' },
        { label: 'ناقل الحركة', value: car.transmission || 'أوتوماتيك' },
        { label: 'نوع الوقود', value: car.fuelType || 'بنزين' },
        { label: 'سعة المحرك', value: car.specs?.displacement || 'Gasoline 3300cc' },
        { label: 'اللون الخارجي', value: car.color || car.specs?.color || 'رمادي' },
        { label: 'عدد المقاعد', value: car.specs?.seats || '5' },
    ];

    return (
        <div className="relative min-h-screen bg-[#614828] text-amber-50 font-sans" dir="rtl">
            <Navbar />

            {/* ── Top Header Bar (شريط الترويسة العلوي الداكن المصمم بنفس أسلوب Desert Korea Auto) ── */}
            <div className="pt-24 pb-6 bg-[#3d2c18] border-b border-[#7c5d33] shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* زر العودة */}
                    <button
                        onClick={() => router.push('/cars')}
                        className="flex items-center gap-2 text-xs font-bold text-amber-200/80 hover:text-white transition-colors mb-4"
                    >
                        <ChevronRight className="w-4 h-4" />
                        <span>العودة لمعرض السيارات</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* العنوان والتفاصيل */}
                        <div>
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                                    {car.title}
                                </h1>
                                <span className="px-3 py-1 rounded-lg bg-[#543b1f] border border-[#8a683a] text-xs font-bold text-amber-300">
                                    {car.specs?.badge || car.model || '3.3 GDI AWD'}
                                </span>
                            </div>

                            {/* شارات الحالة وتوفر إنكار */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                    متاح
                                </span>
                                <a
                                    href={externalEncarUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>متاح على إنكار (Encar)</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* سعر السيارة ورسوم التصدير */}
                        <div className="bg-[#4d381e] border border-[#8a683a] rounded-2xl p-4 md:text-left flex flex-col md:items-end justify-center">
                            <div className="text-[11px] text-amber-300/70 font-bold uppercase">السعر الإجمالي الشامل</div>
                            <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">{formattedPriceSar}</div>
                            {car.year < 2021 && (
                                <p className="text-[10px] text-amber-200/80 mt-1 max-w-xs">
                                    * رسوم جمركية إضافية (+7300 SAR عند التصدير إلى السعودية للموديلات الأقدم من 2021)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT GRID (تخطيط العمودين المائل نحو Desert Korea Auto) ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ────── LEFT COLUMN: Sticky Action Card (بطاقة إجراءات الطلب الثابتة على اليسار) ────── */}
                    <div className="lg:col-span-4 space-y-5 lg:order-1">
                        <div className="bg-[#fcf8f2] text-slate-900 rounded-3xl p-6 border-2 border-[#d6c4a8] shadow-2xl space-y-6 lg:sticky lg:top-28">

                            {/* شارة التوفر والسعر */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                    متاح للاستيراد المباشر
                                </span>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500 block font-bold">السعر الكامل</span>
                                    <span className="text-2xl font-black text-[#614828] font-mono">{formattedPriceSar}</span>
                                </div>
                            </div>

                            {/* الجدول السريع للمواصفات */}
                            <div className="space-y-3 text-xs border-b border-slate-200 pb-4">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">سنة الصنع:</span>
                                    <span className="font-bold text-slate-900">{car.year}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">المسافة المقطوعة:</span>
                                    <span className="font-bold text-slate-900">{car.mileage ? `${Number(car.mileage).toLocaleString('ar-SA')} كم` : '—'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500 font-bold">ناقل الحركة:</span>
                                    <span className="font-bold text-slate-900">{car.transmission || 'أوتوماتيك'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500 font-bold">نوع الوقود:</span>
                                    <span className="font-bold text-slate-900">{car.fuelType || 'بنزين'}</span>
                                </div>
                            </div>

                            {/* 🟢 زر الطلب الرئيسي المباشر عبر الواتساب */}
                            <button
                                onClick={handleWhatsappOrder}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-3 shadow-xl transition-all active:scale-98"
                            >
                                <MessageCircle className="w-6 h-6 fill-white" />
                                <span>اطلب عبر واتساب</span>
                            </button>

                            {/* بطاقة مسؤول المبيعات (بن زايد - مسؤول المبيعات) */}
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-100/60 border border-amber-200/80">
                                <div className="w-10 h-10 rounded-full bg-[#614828] text-white flex items-center justify-center font-bold text-sm">
                                    ب
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-900">بن زايد</div>
                                    <div className="text-[11px] text-slate-600 font-medium">مسؤول المبيعات المباشرة</div>
                                </div>
                                <UserCheck className="w-5 h-5 text-emerald-600" />
                            </div>

                            {/* أزرار الأدوات التفاعلية (حاسبة الاستيراد ومقارنة الأسعار) */}
                            <div className="space-y-2.5 pt-2">
                                <button
                                    onClick={() => setShowCalcModal(true)}
                                    className="w-full py-3 rounded-xl bg-[#614828] hover:bg-[#4d381e] text-amber-100 font-bold text-xs flex items-center justify-center gap-2 border border-[#8a683a] transition-colors"
                                >
                                    <Calculator className="w-4 h-4 text-amber-300" />
                                    <span>حاسبة تكلفة الاستيراد</span>
                                </button>

                                <button
                                    onClick={() => setShowCompareModal(true)}
                                    className="w-full py-3 rounded-xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition-colors"
                                >
                                    <Scale className="w-4 h-4 text-amber-700" />
                                    <span>مقارنة بسعر الجديد</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ────── RIGHT COLUMN: Gallery & Interactive Tabs (الجانب الأيمن للصور والتبويبات) ────── */}
                    <div className="lg:col-span-8 space-y-8 lg:order-2">

                        {/* 1. Main Hero Image Viewer with Navigation */}
                        <div className="relative aspect-[16/10] bg-slate-950 rounded-3xl overflow-hidden border-2 border-[#8a683a] shadow-2xl group">
                            <WatermarkImage
                                src={mainImg}
                                alt={car.title}
                                fill
                                className="object-cover cursor-pointer"
                                unoptimized
                                watermarkPosition="br"
                            />

                            {/* أسهم التصفح */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl backdrop-blur transition-transform active:scale-90 z-20"
                                    >
                                        <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-2xl backdrop-blur transition-transform active:scale-90 z-20"
                                    >
                                        <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                                    </button>
                                </>
                            )}

                            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-mono">
                                {activeImage + 1} / {images.length || 1}
                            </div>
                        </div>

                        {/* 2. Photo Thumbnails Grid (عرض جميع صور السيارة المصغرة) */}
                        {images.length > 1 && (
                            <div className="bg-[#4d381e]/80 border border-[#7c5d33] rounded-2xl p-3">
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-700">
                                    {images.map((img: string, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={cn(
                                                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all shrink-0",
                                                activeImage === idx ? "border-amber-300 scale-105 shadow-lg" : "border-amber-900/50 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Image src={img} alt={`thumb ${idx}`} fill className="object-cover" unoptimized />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. INTERACTIVE TABS (المواصفات | الفحص والمميزات | سيارات مشابهة) */}
                        <div className="bg-[#543b1f] border border-[#8a683a] rounded-3xl p-6 shadow-2xl space-y-6">

                            {/* Tab Header Buttons */}
                            <div className="flex items-center gap-2 border-b border-[#7c5d33] pb-4 overflow-x-auto">
                                {[
                                    { key: 'SPECS', label: 'المواصفات', icon: ListFilter },
                                    { key: 'INSPECTION', label: 'الفحص والمميزات', icon: FileCheck2 },
                                    { key: 'SIMILAR', label: 'سيارات مشابهة', icon: Car },
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        className={cn(
                                            "px-6 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap border",
                                            activeTab === tab.key
                                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg"
                                                : "bg-[#3d2c18] text-amber-200/70 border-[#7c5d33] hover:text-white"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* TAB 1: المواصفات (Specifications Grid) */}
                            {activeTab === 'SPECS' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-black text-amber-200 border-r-4 border-amber-400 pr-3">
                                        المواصفات التفصيلية للسيارة
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {specsList.map(spec => (
                                            <div key={spec.label} className="flex justify-between items-center p-3.5 rounded-2xl bg-[#3d2c18] border border-[#7c5d33] text-sm">
                                                <span className="text-amber-200/70 font-bold">{spec.label}</span>
                                                <span className="font-bold text-white font-mono">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {car.description && (
                                        <div className="p-4 rounded-2xl bg-[#3d2c18] border border-[#7c5d33]">
                                            <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">الوصف الكامل والملاحظات</h4>
                                            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">{car.description}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: الفحص والمميزات (Inspection & Features) */}
                            {activeTab === 'INSPECTION' && (
                                <div className="space-y-8">

                                    {/* المميزات العامة (Features Badges) */}
                                    <div>
                                        <h3 className="text-base font-black text-amber-200 border-r-4 border-amber-400 pr-3 mb-4">
                                            المميزات والخيارات المتاحة
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {DEFAULT_CAR_FEATURES.map((feat, idx) => (
                                                <span key={idx} className="px-3 py-2 rounded-xl bg-[#3d2c18] border border-[#7c5d33] text-xs font-bold text-amber-100 flex items-center gap-1.5">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>{feat}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* الخيارات الإضافية (Additional Options) */}
                                    <div className="bg-[#3d2c18] border border-[#7c5d33] rounded-2xl p-4 space-y-3">
                                        <h4 className="text-sm font-bold text-amber-300">الخيارات الإضافية المدرجة</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                <span>فتحة سقف بانورامية</span>
                                                <span className="font-bold text-amber-300">+3,108 ر.س</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                <span>حزمة Genesis Smart Sense</span>
                                                <span className="font-bold text-amber-300">+6,074 ر.س</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* رسم تقرير الفحص التفاعلي 2D Diagram */}
                                    <div className="bg-[#3d2c18] border border-[#7c5d33] rounded-2xl p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                                <span>تقرير الفحص الهيكلي التفاعلي 2D</span>
                                            </h3>
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                                                ✓ فحص إنكار معتمد
                                            </span>
                                        </div>

                                        {/* الرسم التوضيحي للهيكل (Outer Body & Main Chassis) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                            {/* الهيكل الخارجي */}
                                            <div className="text-center space-y-3">
                                                <div className="text-xs font-bold text-amber-300">الهيكل الخارجي (Outer Body)</div>
                                                <div className="relative aspect-[4/3] bg-white rounded-xl p-4 flex items-center justify-center border-2 border-amber-500/30">
                                                    <svg viewBox="0 0 300 200" className="w-full h-full">
                                                        <rect x="30" y="20" width="240" height="160" rx="30" fill="none" stroke="#3f3f46" strokeWidth="3" />
                                                        <circle cx="70" cy="30" r="18" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                                        <circle cx="230" cy="30" r="18" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                                        <circle cx="70" cy="170" r="18" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                                        <circle cx="230" cy="170" r="18" fill="#e4e4e7" stroke="#27272a" strokeWidth="2" />
                                                        <rect x="90" y="40" width="120" height="35" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                                                        <text x="150" y="62" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#047857">P (سليم)</text>
                                                        <rect x="90" y="85" width="120" height="35" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                                                        <text x="150" y="107" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#047857">A (طلاء وكالة)</text>
                                                        <rect x="90" y="130" width="120" height="35" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                                                        <text x="150" y="152" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#047857">P (سليم)</text>
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* الهيكل الأساسي (Main Chassis) */}
                                            <div className="text-center space-y-3">
                                                <div className="text-xs font-bold text-amber-300">الهيكل الأساسي (Main Chassis)</div>
                                                <div className="relative aspect-[4/3] bg-white rounded-xl p-4 flex items-center justify-center border-2 border-amber-500/30">
                                                    <svg viewBox="0 0 300 200" className="w-full h-full">
                                                        <rect x="30" y="20" width="240" height="160" rx="30" fill="none" stroke="#3f3f46" strokeWidth="3" />
                                                        <line x1="70" y1="20" x2="230" y2="180" stroke="#d4d4d8" strokeWidth="2" />
                                                        <line x1="230" y1="20" x2="70" y2="180" stroke="#d4d4d8" strokeWidth="2" />
                                                        <rect x="90" y="60" width="120" height="80" rx="10" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                                                        <text x="150" y="105" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#15803d">شاسيه سليم 100%</text>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* سجل التأمين والحوادث */}
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-bold text-amber-300">سجل التأمين والملكية</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                                                <div className="p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                    <div className="text-amber-200/70">إجمالي الحوادث</div>
                                                    <div className="font-bold text-emerald-400 text-sm mt-1">0 (خالية تماماً)</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                    <div className="text-amber-200/70">حوادث من جانبي</div>
                                                    <div className="font-bold text-emerald-400 text-sm mt-1">0</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                    <div className="text-amber-200/70">حوادث الطرف الآخر</div>
                                                    <div className="font-bold text-emerald-400 text-sm mt-1">0</div>
                                                </div>
                                                <div className="p-3 rounded-xl bg-[#543b1f] border border-[#8a683a]">
                                                    <div className="text-amber-200/70">تغييرات الملكية</div>
                                                    <div className="font-bold text-amber-300 text-sm mt-1">مالك واحد (1)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: سيارات مشابهة (Similar Cars) */}
                            {activeTab === 'SIMILAR' && (
                                <div className="space-y-4">
                                    <h3 className="text-base font-black text-amber-200 border-r-4 border-amber-400 pr-3">
                                        سيارات أخرى قد تهمك
                                    </h3>
                                    {similarCars.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {similarCars.map((item, idx) => (
                                                <ModernCarCard key={item.id} car={item} index={idx} formatPrice={formatPrice} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-200/60 text-center py-8">لا توجد سيارات مشابهة حالياً في المعرض</p>
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
                            className="bg-[#fcf8f2] text-slate-900 max-w-lg w-full rounded-3xl p-6 border-2 border-[#d6c4a8] shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h3 className="font-black text-lg text-[#614828] flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-amber-700" />
                                    <span>حاسبة تكلفة الاستيراد الشاملة</span>
                                </h3>
                                <button onClick={() => setShowCalcModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-bold">سعر السيارة الأساسي في كوريا:</span>
                                    <span className="font-bold font-mono">{baseCarCost.toLocaleString('ar-SA')} ر.س</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-bold">الشحن والتأمين البحري:</span>
                                    <span className="font-bold font-mono">{shippingCost.toLocaleString('ar-SA')} ر.س</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-bold">الجمارك ورسوم التصدير (حسب الموديل):</span>
                                    <span className="font-bold font-mono text-amber-700">{customsDuty.toLocaleString('ar-SA')} ر.س</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-bold">ضريبة القيمة المضافة (15%):</span>
                                    <span className="font-bold font-mono">{vatAmount.toLocaleString('ar-SA')} ر.س</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-200">
                                    <span className="text-slate-600 font-bold">عمولة ومصاريف التخليص:</span>
                                    <span className="font-bold font-mono">{systemCommission.toLocaleString('ar-SA')} ر.س</span>
                                </div>

                                <div className="flex justify-between py-3 rounded-2xl bg-amber-100/80 px-4 text-sm font-black text-[#614828] border border-amber-300">
                                    <span>التكلفة التقديرية الكلية:</span>
                                    <span className="font-mono text-base">{calculatedTotal.toLocaleString('ar-SA')} ر.س</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setShowCalcModal(false); handleWhatsappOrder(); }}
                                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
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
                            className="bg-[#fcf8f2] text-slate-900 max-w-lg w-full rounded-3xl p-6 border-2 border-[#d6c4a8] shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h3 className="font-black text-lg text-[#614828] flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-amber-700" />
                                    <span>مقارنة السعر مع الوكالة (الجديد)</span>
                                </h3>
                                <button onClick={() => setShowCompareModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
                                    <div className="flex justify-between font-bold">
                                        <span>سعر السيارة الجديدة في الوكالة:</span>
                                        <span className="text-slate-500 line-through font-mono">{(carPriceSar * 1.65).toLocaleString('ar-SA')} ر.س</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-700">
                                        <span>سعر هذه السيارة المستوردة بحالة الوكالة:</span>
                                        <span className="font-mono text-sm">{carPriceSar.toLocaleString('ar-SA')} ر.س</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-center font-bold">
                                    🎉 نسبة التوفير الكلية: تكتسب توفيراً قدره <span className="text-emerald-700 font-mono text-sm font-black">+{Math.round(carPriceSar * 0.65).toLocaleString('ar-SA')} ر.س</span> مقارنة بالشراء جديداً!
                                </div>
                            </div>

                            <button
                                onClick={() => setShowCompareModal(false)}
                                className="w-full py-3 rounded-xl bg-[#614828] text-amber-100 font-bold text-xs hover:bg-[#4d381e] transition-colors"
                            >
                                إغلاق النافذة
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
