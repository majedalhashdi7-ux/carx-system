'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, Share2, Calendar, Gauge, Fuel, ArrowRight,
    Settings2, MessageCircle, Eye, CheckCircle
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import Link from "next/link";
import Image from "next/image";

interface CarCardProps {
    car: {
        id: string;
        title: string;
        titleAr?: string;
        make: string;
        makeAr?: string;
        model: string;
        year: number;
        price: number;
        priceSar?: number;
        priceUsd?: number;
        priceKrw?: number;
        images: string[];
        imageUrl?: string;
        mileage?: number;
        fuelType?: string;
        fuelAr?: string;
        transmission?: string;
        transmissionAr?: string;
        category?: string;
        isActive?: boolean;
        isSold?: boolean;
        source?: string;
        listingType?: string;
        badge?: string;
    };
    index?: number;
    formatPrice?: (price: number) => string;
    whatsappNumber?: string;
}

export default function ModernCarCard({ car, index = 0, formatPrice: propFormatPrice, whatsappNumber }: CarCardProps) {
    const { isRTL, t } = useLanguage() as any;
    const { formatPrice: ctxFormatPrice, formatPriceFromUsd, displayCurrency, currency } = useSettings();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showHoverInfo, setShowHoverInfo] = useState(false);

    // ── تحديد مصدر السيارة ───────────────────────────────
    const isKoreanImport = car.source === 'korean_import' || car.source === 'encar_korea' || car.listingType === 'showroom';

    // ── الصور ────────────────────────────────────────────
    const images = (car.images?.filter(Boolean) || []);
    if (car.imageUrl && !images.includes(car.imageUrl)) images.unshift(car.imageUrl);
    const currentImage = images[currentImageIndex] || '/images/placeholder-car.jpg';

    // ── السعر بالعملة الصحيحة ────────────────────────────
    const getFormattedPrice = () => {
        if (propFormatPrice) return propFormatPrice(car.price || car.priceSar || 0);

        // إذا كانت سيارة كورية لها سعر بالدولار
        if (isKoreanImport && car.priceUsd && car.priceUsd > 0) {
            return formatPriceFromUsd(car.priceUsd);
        }
        // سيارة عادية لها سعر بالريال
        const sarPrice = car.priceSar || car.price || 0;
        if (sarPrice > 0) return ctxFormatPrice(sarPrice);
        return isRTL ? 'عند الطلب' : 'On Request';
    };

    // ── واتساب ───────────────────────────────────────────
    const wa = whatsappNumber || '+821080880014';
    const carTitle = isRTL ? (car.titleAr || car.title) : car.title;
    const waMsg = encodeURIComponent(
        isRTL
            ? `مرحباً، أريد الاستفسار عن: ${carTitle} (${car.year})\nالسعر: ${getFormattedPrice()}`
            : `Hello, I'm interested in: ${car.title} (${car.year})\nPrice: ${getFormattedPrice()}`
    );
    const waUrl = `https://wa.me/${wa.replace(/\D/g, '')}?text=${waMsg}`;

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (images.length > 1) setCurrentImageIndex(p => (p + 1) % images.length);
    };
    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (images.length > 1) setCurrentImageIndex(p => (p - 1 + images.length) % images.length);
    };

    const fuelLabel = isRTL ? (car.fuelAr || car.fuelType || '') : (car.fuelType || '');
    const transmLabel = isRTL ? (car.transmissionAr || car.transmission || '') : (car.transmission || '');
    const displayTitle = isRTL ? (car.titleAr || car.title || `${car.makeAr || car.make} ${car.model}`) : (car.title || `${car.make} ${car.model}`);

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.4) }}
            onHoverStart={() => setShowHoverInfo(true)}
            onHoverEnd={() => setShowHoverInfo(false)}
            className="group relative flex flex-col bg-gradient-to-b from-[#1e1612] to-[#140f0a] rounded-2xl overflow-hidden border border-[#3d2c18]/60 hover:border-amber-500/40 transition-all duration-400 hover:shadow-2xl hover:shadow-amber-900/20 cursor-pointer"
            style={{ willChange: 'transform' }}
        >
            {/* ── منطقة الصورة ─────────────────────────────── */}
            <Link href={`/cars/${car.id}`} className="block">
                <div className="relative h-56 overflow-hidden bg-[#1a1108]">

                    {/* الصورة الرئيسية */}
                    {!imageError && currentImage ? (
                        <Image
                            src={currentImage}
                            alt={displayTitle}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImageError(true)}
                            priority={index < 3}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a1e10] to-[#1a1108]">
                            <div className="text-center text-amber-900/60">
                                <Eye className="w-10 h-10 mx-auto mb-2" />
                                <p className="text-xs">{isRTL ? 'لا توجد صورة' : 'No image'}</p>
                            </div>
                        </div>
                    )}

                    {/* تدرج لوني سفلي */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1612]/80 via-transparent to-transparent" />

                    {/* شارة مباع */}
                    {car.isSold && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                            <div className="px-5 py-2 bg-red-600 text-white text-sm font-black rounded-xl rotate-[-12deg] shadow-xl">
                                {isRTL ? '🔴 تم البيع' : '🔴 SOLD'}
                            </div>
                        </div>
                    )}

                    {/* شارة المصدر */}
                    <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-10">
                        {isKoreanImport && (
                            <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                🇰🇷 {isRTL ? 'استيراد كوريا' : 'Korean Import'}
                            </span>
                        )}
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="absolute top-3 end-3 flex flex-col gap-2 z-10">
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={e => { e.preventDefault(); setIsLiked(!isLiked); }}
                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all"
                        >
                            <Heart className={`w-4 h-4 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white/80'}`} />
                        </motion.button>
                    </div>

                    {/* أسهم التنقل بين الصور */}
                    {images.length > 1 && (
                        <AnimatePresence>
                            {showHoverInfo && (
                                <>
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={prevImage}
                                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'end-2' : 'start-2'} w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white z-10`}
                                    >
                                        <ArrowRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                                    </motion.button>
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={nextImage}
                                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'start-2' : 'end-2'} w-8 h-8 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white z-10`}
                                    >
                                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                                    </motion.button>
                                </>
                            )}
                        </AnimatePresence>
                    )}

                    {/* نقاط الصور */}
                    {images.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                            {images.slice(0, 6).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={e => { e.preventDefault(); setCurrentImageIndex(idx); }}
                                    className={`rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-white/40'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* عدد الصور */}
                    {images.length > 1 && (
                        <div className="absolute bottom-2 end-3 text-[10px] text-white/60 font-mono z-10">
                            {currentImageIndex + 1}/{images.length}
                        </div>
                    )}
                </div>
            </Link>

            {/* ── محتوى البطاقة ────────────────────────────── */}
            <div className="flex flex-col flex-1 p-4 gap-3">

                {/* العنوان */}
                <Link href={`/cars/${car.id}`}>
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors duration-300">
                        {displayTitle}
                    </h3>
                </Link>

                {/* المواصفات السريعة */}
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-amber-200/60">
                        <Calendar className="w-3 h-3" />
                        {car.year}
                    </span>
                    {car.mileage ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-200/60">
                            <Gauge className="w-3 h-3" />
                            {Number(car.mileage).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                            {isRTL ? ' كم' : ' km'}
                        </span>
                    ) : null}
                    {fuelLabel ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-200/60">
                            <Fuel className="w-3 h-3" />
                            {fuelLabel}
                        </span>
                    ) : null}
                    {transmLabel ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-200/60">
                            <Settings2 className="w-3 h-3" />
                            {transmLabel}
                        </span>
                    ) : null}
                </div>

                {/* فاصل */}
                <div className="border-t border-[#3d2c18]/60" />

                {/* السعر والأزرار */}
                <div className="flex items-end justify-between gap-2 mt-auto">
                    <div>
                        <p className="text-[10px] text-amber-300/50 font-medium mb-0.5">
                            {isRTL ? 'السعر الإجمالي' : 'Total Price'}
                        </p>
                        <p className="text-xl font-black text-amber-400 leading-none tracking-tight">
                            {getFormattedPrice()}
                        </p>
                        {/* سعر ثانوي بالعملة الأخرى */}
                        {isKoreanImport && car.priceUsd && car.priceUsd > 0 && displayCurrency !== 'USD' && (
                            <p className="text-[10px] text-amber-200/40 mt-0.5">
                                ≈ ${Number(car.priceUsd).toLocaleString('en-US')}
                            </p>
                        )}
                    </div>

                    {/* زر واتساب + زر التفاصيل */}
                    <div className="flex items-center gap-2">
                        <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 transition-all duration-300"
                            title={isRTL ? 'تواصل عبر واتساب' : 'WhatsApp'}
                        >
                            <MessageCircle className="w-4 h-4 text-emerald-400" />
                        </a>
                        <Link
                            href={`/cars/${car.id}`}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500 hover:border-amber-400 text-amber-300 hover:text-black text-xs font-bold transition-all duration-300"
                        >
                            <span>{isRTL ? 'التفاصيل' : 'Details'}</span>
                            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* توهج عند الـ hover */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-amber-500/0 group-hover:ring-amber-500/20 transition-all duration-400 pointer-events-none" />
        </motion.div>
    );
}