'use client';

/**
 * صفحة تفاصيل السيارة — /cars/[id]
 * Gallery تفاعلي + مواصفات كاملة + زر WhatsApp ثابت + سيارات مشابهة
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, X, Share2, Heart,
    Gauge, Fuel, Settings2, Calendar, Car,
    MessageCircle, ArrowRight, CheckCircle2, Shield,
    MapPin, Package, Wrench, Phone, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api-original';
import { formatCarTitle, cleanKoreanText } from '@/lib/brandTranslations';
import { cn } from '@/lib/utils';

/* ─── Helpers ─── */
function fixImageUrl(url: string): string {
    if (!url) return '';
    let u = url.trim();
    if (u.includes('https://ci.encar.comhttps://ci.encar.com'))
        u = u.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
    if (u.endsWith('_'))
        u = u.startsWith('http') ? `${u}001.jpg` : `https://ci.encar.com${u}001.jpg`;
    if (u.startsWith('/carpicture')) u = `https://ci.encar.com${u}`;
    else if (u.startsWith('/') && !u.startsWith('http')) u = `https://ci.encar.com/carpicture${u}`;
    if (u.includes('encar.com') || u.includes('encar.co.kr'))
        return `/api/v2/image-proxy?url=${encodeURIComponent(u)}`;
    return u;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200&auto=format&fit=crop';

/* ─── Skeleton ─── */
function CarDetailSkeleton() {
    return (
        <div className="min-h-screen bg-[#08080c] pt-20 animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="aspect-[4/3] rounded-3xl bg-white/5" />
                    <div className="space-y-4 pt-4">
                        <div className="h-4 bg-white/5 rounded w-1/4" />
                        <div className="h-8 bg-white/5 rounded w-3/4" />
                        <div className="h-6 bg-white/5 rounded w-1/2" />
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl" />)}
                        </div>
                        <div className="h-14 bg-white/5 rounded-2xl mt-6" />
                        <div className="h-14 bg-[#C9A96E]/10 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Lightbox ─── */
function Lightbox({ images, index, onClose, onPrev, onNext }: {
    images: string[]; index: number;
    onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, onPrev, onNext]);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
                <X className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 z-10">
                <ChevronRight className="w-6 h-6" />
            </button>
            <motion.img
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={images[index]}
                alt={`Photo ${index + 1}`}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-bold">
                {index + 1} / {images.length}
            </div>
        </motion.div>
    );
}

export default function CarDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { isRTL } = useLanguage();
    const { formatPriceFromUsd, socialLinks } = useSettings();

    const [car, setCar] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [copied, setCopied] = useState(false);

    const whatsapp = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');

    const loadCar = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.cars.getById(id);
            const data = res?.data || res?.car || res;
            if (data && (data._id || data.id)) {
                setCar(data);
                // جلب سيارات مشابهة
                const rawMake = typeof data.make === 'object' ? data.make?.name : data.make;
                if (rawMake) {
                    api.cars.list({ make: rawMake, limit: 5, status: 'all' })
                        .then((r: any) => {
                            const list = Array.isArray(r?.data) ? r.data : (r?.data?.cars || r?.cars || []);
                            setRelated(list.filter((c: any) => (c._id || c.id) !== id).slice(0, 4));
                        }).catch(() => {});
                }
                // فحص المفضلة
                try {
                    const favs = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
                    setIsFav(favs.includes(id));
                } catch {}
            }
        } catch (e) {
            console.error('Car detail error:', e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadCar(); }, [loadCar]);

    if (loading) return <CarDetailSkeleton />;
    if (!car) return (
        <div className="min-h-screen bg-[#08080c] flex flex-col items-center justify-center text-white gap-4">
            <Navbar />
            <Car className="w-16 h-16 text-white/10" />
            <p className="text-white/40 font-bold">{isRTL ? 'السيارة غير موجودة' : 'Car not found'}</p>
            <Link href="/cars" className="px-5 py-2.5 rounded-xl bg-[#C9A96E] text-black font-black text-xs">
                {isRTL ? 'تصفح السيارات' : 'Browse Cars'}
            </Link>
        </div>
    );

    const rawMake = typeof car.make === 'object' ? car.make?.name : car.make;
    const title = formatCarTitle(car.title || `${rawMake} ${car.model} ${car.year}`, rawMake, isRTL);
    const images: string[] = (Array.isArray(car.images) && car.images.length > 0
        ? car.images : (car.image ? [car.image] : [FALLBACK_IMG])
    ).map(fixImageUrl).filter(Boolean);
    if (images.length === 0) images.push(FALLBACK_IMG);

    const price = car.priceSar || car.price || 0;
    const priceStr = price > 0 ? formatPriceFromUsd(price) : (isRTL ? 'اتصل للسعر' : 'Call for price');
    const mileage = car.mileage || car.km || 0;
    const fuel = cleanKoreanText(car.fuelAr || car.fuelType || '', isRTL) || (isRTL ? 'ديزل' : 'Diesel');
    const transmission = cleanKoreanText(car.transmissionAr || car.transmission || '', isRTL) || (isRTL ? 'أوتوماتيك' : 'Auto');
    const color = car.color || car.colorAr || (isRTL ? 'غير محدد' : 'N/A');

    const waMsg = encodeURIComponent(
        isRTL
            ? `مرحباً، أريد الاستفسار عن هذه السيارة:\n${title}\nالسعر: ${priceStr}\nالرابط: ${typeof window !== 'undefined' ? window.location.href : ''}`
            : `Hi, I'm interested in this car:\n${title}\nPrice: ${priceStr}\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`
    );
    const waUrl = `https://wa.me/${whatsapp}?text=${waMsg}`;

    const toggleFav = () => {
        try {
            const favs: string[] = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            const next = isFav ? favs.filter(f => f !== id) : [...favs, id];
            localStorage.setItem('hm_favorites', JSON.stringify(next));
            setIsFav(!isFav);
        } catch {}
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {}
    };

    const specs = [
        { icon: Calendar, labelAr: 'سنة الصنع', labelEn: 'Year', value: car.year },
        { icon: Gauge, labelAr: 'الكيلومترات', labelEn: 'Mileage', value: mileage > 0 ? `${mileage.toLocaleString()} ${isRTL ? 'كم' : 'km'}` : '—' },
        { icon: Fuel, labelAr: 'نوع الوقود', labelEn: 'Fuel', value: fuel },
        { icon: Settings2, labelAr: 'ناقل الحركة', labelEn: 'Transmission', value: transmission },
        { icon: Car, labelAr: 'الماركة', labelEn: 'Brand', value: rawMake || '—' },
        { icon: Package, labelAr: 'الموديل', labelEn: 'Model', value: car.model || '—' },
        { icon: MapPin, labelAr: 'اللون', labelEn: 'Color', value: color },
        { icon: Wrench, labelAr: 'الفئة', labelEn: 'Category', value: car.category || car.bodyType || '—' },
    ];

    return (
        <div className="min-h-screen bg-[#08080c] text-white pb-28 lg:pb-0" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxOpen && (
                    <Lightbox
                        images={images} index={activeImg} onClose={() => setLightboxOpen(false)}
                        onPrev={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                        onNext={() => setActiveImg(i => (i + 1) % images.length)}
                    />
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-white/30 mb-6 pt-4">
                    <Link href="/" className="hover:text-white/60 transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</Link>
                    <ChevronLeft className={cn('w-3 h-3', isRTL && 'rotate-180')} />
                    <Link href="/cars" className="hover:text-white/60 transition-colors">{isRTL ? 'السيارات' : 'Cars'}</Link>
                    <ChevronLeft className={cn('w-3 h-3', isRTL && 'rotate-180')} />
                    <span className="text-white/50 line-clamp-1">{title}</span>
                </div>

                {/* ─── Main Grid ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

                    {/* ─── LEFT: Image Gallery ─── */}
                    <div className="space-y-3">
                        {/* Main Image */}
                        <div
                            className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-zinc-900 cursor-zoom-in group"
                            onClick={() => setLightboxOpen(true)}
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImg}
                                    initial={{ opacity: 0, scale: 1.03 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    src={images[activeImg]}
                                    alt={title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                                />
                            </AnimatePresence>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                            {/* Photo count badge */}
                            <div className="absolute bottom-3 end-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white/80">
                                {activeImg + 1} / {images.length}
                            </div>
                            {/* Navigation arrows on main */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); }}
                                        className="absolute start-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); }}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={cn(
                                            'flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all',
                                            i === activeImg
                                                ? 'border-[#C9A96E] scale-105 shadow-[0_0_12px_rgba(201,169,110,0.4)]'
                                                : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
                                        )}
                                    >
                                        <img src={img} alt={`thumb ${i}`} className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ─── RIGHT: Car Info ─── */}
                    <div className="flex flex-col gap-5">
                        {/* Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[10px] font-black uppercase tracking-widest text-[#C9A96E]">
                                <Car className="w-3 h-3 inline me-1" />
                                {isRTL ? 'معرض HM CAR' : 'HM CAR Showroom'}
                            </span>
                            {car.year && (
                                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                                    {car.year}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                            {title}
                        </h1>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 py-4 border-y border-white/8">
                            <div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-0.5">
                                    {isRTL ? 'السعر' : 'PRICE'}
                                </span>
                                <span className="text-3xl sm:text-4xl font-black text-[#C9A96E]">{priceStr}</span>
                            </div>
                            <div className="ms-auto flex items-center gap-2">
                                {/* Favorite */}
                                <button
                                    onClick={toggleFav}
                                    className={cn(
                                        'p-2.5 rounded-xl border transition-all',
                                        isFav
                                            ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30'
                                    )}
                                    title={isRTL ? 'أضف للمفضلة' : 'Add to favorites'}
                                >
                                    <Heart className={cn('w-5 h-5', isFav && 'fill-current')} />
                                </button>
                                {/* Share */}
                                <button
                                    onClick={handleShare}
                                    className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all relative"
                                    title={isRTL ? 'مشاركة' : 'Share'}
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {specs.slice(0, 4).map((spec, i) => (
                                <div key={i} className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] border border-white/6 gap-1.5">
                                    <spec.icon className="w-4 h-4 text-[#C9A96E]" />
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wide">
                                        {isRTL ? spec.labelAr : spec.labelEn}
                                    </span>
                                    <span className="text-xs font-black text-white line-clamp-1">{spec.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-green-500/5 border border-green-500/15">
                            <Shield className="w-5 h-5 text-green-400 shrink-0" />
                            <p className="text-xs text-white/50 leading-relaxed">
                                {isRTL
                                    ? 'السيارة مفحوصة فنياً قبل الشحن — ضمان الجودة من HM CAR'
                                    : 'Vehicle inspected before shipping — HM CAR quality guarantee'}
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3">
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl bg-[#25D366] hover:bg-[#1db954] text-white font-black text-sm transition-all shadow-xl shadow-[#25D366]/20 hover:scale-[1.01] active:scale-[0.99]"
                            >
                                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.988l-1.413 5.164 5.283-1.386c1.455.795 3.1 1.218 4.789 1.218 5.507 0 9.989-4.478 9.989-9.984s-4.482-9.984-9.989-9.984z" />
                                </svg>
                                {isRTL ? 'اطلب عبر واتساب' : 'Inquire via WhatsApp'}
                            </a>
                            <a
                                href={`tel:${whatsapp}`}
                                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-black text-sm transition-all"
                            >
                                <Phone className="w-4.5 h-4.5 text-[#C9A96E]" />
                                {isRTL ? 'اتصل بنا' : 'Call Us'}
                            </a>
                        </div>
                    </div>
                </div>

                {/* ─── Full Specs Table ─── */}
                <section className="mt-12">
                    <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-[#C9A96E]" />
                        {isRTL ? 'المواصفات الكاملة' : 'Full Specifications'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {specs.map((spec, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center gap-2 text-white/40">
                                    <spec.icon className="w-4 h-4" />
                                    <span className="text-xs font-bold">{isRTL ? spec.labelAr : spec.labelEn}</span>
                                </div>
                                <span className="text-xs font-black text-white">{spec.value}</span>
                            </div>
                        ))}
                        {/* Additional specs if available */}
                        {car.engine && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-xs font-bold text-white/40">{isRTL ? 'المحرك' : 'Engine'}</span>
                                <span className="text-xs font-black text-white">{car.engine}</span>
                            </div>
                        )}
                        {car.seats && (
                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-xs font-bold text-white/40">{isRTL ? 'عدد المقاعد' : 'Seats'}</span>
                                <span className="text-xs font-black text-white">{car.seats}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ─── Description ─── */}
                {(car.description || car.descriptionAr) && (
                    <section className="mt-8">
                        <h2 className="text-lg font-black text-white mb-3">{isRTL ? 'وصف السيارة' : 'Description'}</h2>
                        <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line">
                            {isRTL ? (car.descriptionAr || car.description) : (car.description || car.descriptionAr)}
                        </p>
                    </section>
                )}

                {/* ─── Related Cars ─── */}
                {related.length > 0 && (
                    <section className="mt-12">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-black text-white">{isRTL ? 'سيارات مشابهة' : 'Similar Cars'}</h2>
                            <Link href={`/cars?make=${encodeURIComponent(rawMake || '')}`}
                                className="flex items-center gap-1.5 text-xs font-black text-[#C9A96E] hover:underline">
                                {isRTL ? 'عرض الكل' : 'View All'}
                                <ArrowRight className={cn('w-3.5 h-3.5', isRTL && 'rotate-180')} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {related.map((rc, i) => {
                                const rcId = rc._id || rc.id;
                                const rcMake = typeof rc.make === 'object' ? rc.make?.name : rc.make;
                                const rcTitle = formatCarTitle(rc.title || `${rcMake} ${rc.model}`, rcMake, isRTL);
                                const rcImg = fixImageUrl(
                                    (Array.isArray(rc.images) && rc.images[0]) || rc.image || ''
                                ) || FALLBACK_IMG;
                                const rcPrice = formatPriceFromUsd(rc.priceSar || rc.price || 0);
                                return (
                                    <Link key={rcId || i} href={`/cars/${rcId}`}
                                        className="group rounded-2xl overflow-hidden bg-[#101018] border border-white/8 hover:border-[#C9A96E]/40 transition-all">
                                        <div className="aspect-[4/3] overflow-hidden bg-zinc-900">
                                            <img src={rcImg} alt={rcTitle}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#C9A96E] transition-colors">{rcTitle}</p>
                                            <p className="text-xs font-black text-[#C9A96E] mt-1">{rcPrice}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* ─── Sticky WhatsApp CTA (Mobile) ─── */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 p-4 bg-gradient-to-t from-[#08080c] to-transparent">
                <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#25D366] text-white font-black text-sm shadow-2xl shadow-[#25D366]/30 hover:bg-[#1db954] transition-all active:scale-[0.98]"
                >
                    <MessageCircle className="w-5 h-5" />
                    {isRTL ? 'اطلب هذه السيارة عبر واتساب' : 'Inquire via WhatsApp'}
                </a>
            </div>
        </div>
    );
}
