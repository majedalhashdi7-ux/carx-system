'use client';

/**
 * الشريط الإعلاني الذكي (Smart Ad Banner)
 * مكون ديناميكي يعرض مجموعة من السيارات (مزادات مباشرة أو سيارات المعرض) بشكل شريط متحرك (Marquee).
 * يعتمد بشكل كلي على الإعدادات التي يحددها المسؤول (Admin) في لوحة التحكم.
 */

/**
 * الشريط الإعلاني الذكي - SmartAdBanner
 * ─────────────────────────────────────────
 * يُعرض في الصفحة الرئيسية ويعمل وفق إعدادات الأدمن:
 * - إذا فعّل الأدمن "المزاد المباشر": يعرض سيارات المزادات المباشرة
 * - إذا اختار الأدمن "معرض":           يعرض سيارات المعرض المحدد
 * - عند النقر على سيارة:               تظهر نافذة مواصفاتها
 * - زر الشراء/المزايدة:                 (غير مسجل) → صفحة تسجيل الدخول
 *                                       (مسجل)     → واتساب
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X, ArrowLeft, ArrowRight, ExternalLink, Zap,
    Car, Radio, ChevronRight, MessageCircle,
    Fuel, Gauge, Calendar, Tag, LogIn
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';

// ── نوع السيارة المستخدمة في الشريط ──
interface BannerCar {
    id: string;
    title?: string;
    name?: string;
    images?: string[];
    price?: number | string;
    year?: number | string;
    make?: string | { name?: string };
    model?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    source: 'live' | 'korean' | 'hmcar'; // مصدر السيارة (مزاد مباشر، كوري، أو محلي)
    auctionUrl?: string;   // رابط صفحة المزاد إن وُجد
}

// ── نوع إعدادات الإعلانات ──
interface AdvertisingSettings {
    showLiveAuction?: boolean;
    showroomSource?: 'none' | 'korean' | 'hmcar' | 'both';
    bannerLabel?: string;
    bannerLabelEn?: string;
}

// ── استخراج اسم الشركة الصانعة بشكل نظيف ──
const getMakeName = (make: BannerCar['make']): string => {
    if (!make) return '';
    if (typeof make === 'object') return make.name || '';
    return make;
};

// ── مكوّن نافذة مواصفات السيارة (مُحسّن) ──
function CarModal({
    car,
    onClose,
    isRTL,
    formatPrice,
    whatsappNumber,
    isLoggedIn,
}: {
    car: BannerCar;
    onClose: () => void;
    isRTL: boolean;
    formatPrice: (p: number) => string;
    whatsappNumber?: string;
    isLoggedIn: boolean;
}) {
    const router = useRouter();
    const [imgIndex, setImgIndex] = useState(0);
    const images = car.images || [];

    // ── سلوك زر الشراء ──
    const handleBuy = () => {
        if (!isLoggedIn) {
            // غير مسجل → صفحة تسجيل الدخول ثم يرجع
            router.push('/auth/login?redirect=back');
            onClose();
            return;
        }
        // مسجل → واتساب مع رسالة تلقائية
        const phone = whatsappNumber ? String(whatsappNumber).replace(/\D/g, '') : '';
        const carTitle = car.title || car.name || 'سيارة';
        const priceText = formatPrice(Number(car.price || 0));
        const msg = isRTL
            ? `مرحباً، أرغب في شراء:\n🚗 ${carTitle}\n📅 موديل: ${car.year || '-'}\n💰 السعر: ${priceText}\n\nأرجو التواصل معي للتفاصيل.`
            : `Hello, I'd like to purchase:\n🚗 ${carTitle}\n📅 Year: ${car.year || '-'}\n💰 Price: ${priceText}\n\nPlease contact me for details.`;
        const url = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    // ── عنوان السيارة النظيف ──
    const carTitle = car.title || car.name || (isRTL ? 'سيارة' : 'Car');
    const makeName = getMakeName(car.make);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%', scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full md:max-w-2xl bg-gradient-to-b from-[#0a0a1a] to-[#000] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* زر الإغلاق */}
                <button
                    onClick={onClose}
                    title={isRTL ? 'إغلاق' : 'Close'}
                    className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* ── معرض الصور ── */}
                <div className="relative w-full aspect-[16/9] bg-black/60 overflow-hidden">
                    {images.length > 0 ? (
                        <>
                            <Image
                                src={images[imgIndex]}
                                alt={carTitle}
                                fill
                                className="object-cover"
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                                        title={isRTL ? 'السابقة' : 'Previous'}
                                        className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setImgIndex(i => (i + 1) % images.length)}
                                        title={isRTL ? 'التالية' : 'Next'}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.slice(0, 8).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setImgIndex(i)}
                                                title={`صورة ${i + 1}`}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-accent-gold w-4' : 'bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-16 h-16 text-white/10" />
                        </div>
                    )}

                    {/* شارة المصدر */}
                    <div className="absolute top-5 right-5">
                        {car.source === 'live' ? (
                            <span className="px-3 py-1 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Radio className="w-3 h-3 animate-pulse" /> {isRTL ? 'مزاد مباشر' : 'LIVE AUCTION'}
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-accent-gold/20 border border-accent-gold/40 text-accent-gold text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Car className="w-3 h-3" /> {car.source === 'korean' ? (isRTL ? 'كوري' : 'KOREAN') : 'HM CAR'}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── تفاصيل السيارة ── */}
                <div className="p-6 space-y-5">
                    {/* العنوان والسعر */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                                {carTitle}
                            </h3>
                            {makeName && (
                                <p className="text-white/40 text-sm mt-1">{makeName} {car.model || ''}</p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xl md:text-2xl font-black text-accent-gold">
                                {formatPrice(Number(car.price || 0))}
                            </p>
                        </div>
                    </div>

                    {/* المواصفات في بطاقات */}
                    <div className="grid grid-cols-2 gap-3">
                        {car.year && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-accent-gold" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{isRTL ? 'الموديل' : 'Year'}</p>
                                    <p className="text-sm font-bold text-white">{car.year}</p>
                                </div>
                            </div>
                        )}
                        {car.mileage !== undefined && car.mileage > 0 && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                    <Gauge className="w-4 h-4 text-accent-gold" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{isRTL ? 'الكيلومترات' : 'Mileage'}</p>
                                    <p className="text-sm font-bold text-white">{Number(car.mileage).toLocaleString()} km</p>
                                </div>
                            </div>
                        )}
                        {car.fuelType && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                    <Fuel className="w-4 h-4 text-accent-gold" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{isRTL ? 'الوقود' : 'Fuel'}</p>
                                    <p className="text-sm font-bold text-white">{car.fuelType}</p>
                                </div>
                            </div>
                        )}
                        {car.transmission && (
                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-accent-gold" />
                                </div>
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">{isRTL ? 'ناقل الحركة' : 'Transmission'}</p>
                                    <p className="text-sm font-bold text-white">{car.transmission}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── أزرار الإجراءات ── */}
                    <div className="flex gap-3 pt-2">
                        {/* زر الشراء الرئيسي - واضح ومميز */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBuy}
                            className={cn(
                                "flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all",
                                isLoggedIn
                                    ? "bg-gradient-to-r from-[#D4AF37] via-[#c9a96e] to-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)]"
                                    : "bg-gradient-to-r from-[#D4AF37] via-[#c9a96e] to-[#D4AF37] text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)]"
                            )}
                        >
                            {isLoggedIn ? (
                                <>
                                    <MessageCircle className="w-5 h-5" />
                                    {isRTL ? 'شراء الآن' : 'Buy Now'}
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {isRTL ? 'سجّل دخولك للشراء' : 'Login to Buy'}
                                </>
                            )}
                        </motion.button>

                        {/* زر عرض التفاصيل - فقط لسيارات HM CAR المحلية */}
                        {car.source === 'hmcar' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    router.push(`/cars/${car.id}`);
                                    onClose();
                                }}
                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                className="px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </motion.button>
                        )}

                        {/* للسيارات الكورية: رابط الموقع الأصلي */}
                        {car.source === 'korean' && car.auctionUrl && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.open(car.auctionUrl, '_blank')}
                                title={isRTL ? 'عرض في الموقع الكوري' : 'View on Encar'}
                                className="px-5 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── المكوّن الرئيسي: الشريط الإعلاني الذكي ──
export default function SmartAdBanner() {
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { formatPrice, socialLinks } = useSettings();
    const router = useRouter();

    // ── الحالة ──
    const [adSettings, setAdSettings] = useState<AdvertisingSettings>({});
    const [liveCars, setLiveCars] = useState<BannerCar[]>([]);
    const [showroomCars, setShowroomCars] = useState<BannerCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<BannerCar | null>(null);

    // ── تحميل إعدادات الإعلانات وسيارات الشريط ──
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const settingsRes = await api.settings.getPublic();
                const adsConfig: AdvertisingSettings = settingsRes?.data?.advertisingSettings || {};
                setAdSettings(adsConfig);

                const lCars: BannerCar[] = [];
                const sCars: BannerCar[] = [];

                if (adsConfig.showLiveAuction) {
                    try {
                        const liveRes = await api.liveAuctions.list({ limit: 20 });
                        if (liveRes.success && liveRes.data) {
                            liveRes.data.forEach((session: any) => {
                                const sessionCars = session.cars || [];
                                if (sessionCars.length > 0) {
                                    sessionCars.forEach((c: any) => {
                                        lCars.push({
                                            id: c._id || c.id || session._id,
                                            title: c.title || session.title,
                                            name: c.name,
                                            images: c.images || [],
                                            price: c.price || 0,
                                            year: c.year,
                                            make: c.make,
                                            model: c.model,
                                            mileage: c.mileage,
                                            fuelType: c.fuelType,
                                            transmission: c.transmission,
                                            source: 'live',
                                            auctionUrl: `/auctions/live/${session._id}`,
                                        });
                                    });
                                } else {
                                    lCars.push({
                                        id: session._id,
                                        title: session.title,
                                        images: session.images || [],
                                        price: 0,
                                        source: 'live',
                                        auctionUrl: `/auctions/live/${session._id}`,
                                    });
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('فشل جلب المزادات المباشرة:', e);
                    }
                }

                const src = adsConfig.showroomSource || 'none';
                if (src !== 'none') {
                    try {
                        if (src === 'hmcar' || src === 'both') {
                            const carsRes = await api.cars.list({ status: 'active', limit: 20 });
                            if (carsRes.success && carsRes.data?.cars) {
                                carsRes.data.cars.forEach((c: any) => {
                                    sCars.push({
                                        id: c._id || c.id,
                                        title: c.title,
                                        images: c.images || [],
                                        price: c.price || 0,
                                        year: c.year,
                                        make: c.make,
                                        model: c.model,
                                        mileage: c.mileage,
                                        fuelType: c.fuelType,
                                        transmission: c.transmission,
                                        source: 'hmcar',
                                    });
                                });
                            }
                        }
                        if (src === 'korean' || src === 'both') {
                            const korRes = await api.showroom.getCars(1);
                            const korCars = Array.isArray(korRes.data) ? korRes.data : (korRes.data?.cars || []);
                            if (korRes.success && korCars.length > 0) {
                                korCars.slice(0, 15).forEach((c: any) => {
                                    sCars.push({
                                        id: c._id || c.id || String(Math.random()),
                                        title: c.title || c.name,
                                        images: c.images || [],
                                        price: c.price || c.priceKrw || 0,
                                        year: c.year,
                                        make: c.make,
                                        model: c.model,
                                        mileage: c.mileage,
                                        fuelType: c.fuelType,
                                        transmission: c.transmission,
                                        source: 'korean',
                                    });
                                });
                            }
                        }
                    } catch (e) {
                        console.warn('فشل جلب سيارات المعرض:', e);
                    }
                }

                setLiveCars(lCars);
                setShowroomCars(sCars);
            } catch (err) {
                console.error('فشل تحميل بيانات الشريط الإعلاني:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    const isEnabled = adSettings.showLiveAuction || (adSettings.showroomSource && adSettings.showroomSource !== 'none');
    if (!isEnabled || (!loading && liveCars.length === 0 && showroomCars.length === 0)) return null;

    const bannerLabel = isRTL
        ? (adSettings.bannerLabel || 'الأفضل اليوم')
        : (adSettings.bannerLabelEn || 'BEST TODAY');

    const BannerRow = ({ cars, title, href, isLive }: { cars: BannerCar[], title: string, href: string, isLive: boolean }) => {
        const [isPaused, setIsPaused] = useState(false);
        if (cars.length === 0 && !loading) return null;
        const displayCars = cars.length > 0 ? [...cars, ...cars] : [];

        return (
            <div className="relative mb-8" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-white/[0.02] to-black pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                <div className="relative z-20 flex items-center justify-between px-6 py-2 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                        {isLive ? <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse" /> : <Zap className="w-4 h-4 text-accent-gold" />}
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                            {title}
                        </span>
                    </div>
                    <motion.button onClick={() => router.push(href)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-accent-gold/40 transition-all group">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/80">{isRTL ? 'عرض الكل' : 'View All'}</span>
                        <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-accent-gold" />
                    </motion.button>
                </div>

                <div className="py-4 border-y border-white/[0.05] overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                    {loading ? (
                        <div className="flex gap-4 px-6 animate-pulse">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="flex-shrink-0 w-52 h-24 rounded-2xl bg-white/5 border border-white/10" />)}
                        </div>
                    ) : (
                        <div className={cn("flex gap-4 w-max px-6", isRTL ? "animate-marquee-rtl" : "animate-marquee", "pause-marquee")} style={{ animationDuration: `${Math.max(20, cars.length * 7)}s`, animationPlayState: isPaused ? 'paused' : 'running' }}>
                            {displayCars.map((car, idx) => (
                                <motion.button
                                    key={`${car.id}-${idx}`}
                                    onClick={() => setSelectedCar(car)}
                                    whileHover={{ y: -4, scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-shrink-0 relative w-56 h-32 rounded-3xl overflow-hidden border border-white/10 hover:border-accent-gold/40 transition-colors group cursor-pointer shadow-lg"
                                >
                                    {car.images?.[0] ? (
                                        <Image src={car.images[0]} alt={car.title || 'Car'} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center"><Car className="w-8 h-8 text-white/20" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 text-left" dir={isRTL ? 'rtl' : 'ltr'}>
                                        <p className="text-[10px] sm:text-xs font-black uppercase text-white/80 line-clamp-1 mb-1">{car.title}</p>
                                        <p className="text-xs sm:text-sm font-black text-accent-gold">{formatPrice(Number(car.price || 0))}</p>
                                    </div>
                                    {isLive && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]" />}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <section className="relative z-20 my-10 overflow-hidden">
            {adSettings.showLiveAuction && (
                <BannerRow
                    cars={liveCars}
                    title={isRTL ? 'المزاد التفاعلي المباشر' : 'LIVE INTERACTIVE AUCTION'}
                    href="/auctions/live"
                    isLive={true}
                />
            )}
            
            {adSettings.showroomSource && adSettings.showroomSource !== 'none' && (
                <BannerRow
                    cars={showroomCars}
                    title={bannerLabel}
                    href="/cars"
                    isLive={false}
                />
            )}

            <AnimatePresence>
                {selectedCar && (
                    <CarModal
                        car={selectedCar}
                        onClose={() => setSelectedCar(null)}
                        isRTL={isRTL}
                        formatPrice={formatPrice}
                        whatsappNumber={(socialLinks as any)?.whatsapp}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
