'use client';

/**
 * @file parts/[id]/page.tsx
 * @description صفحة تفاصيل قطعة الغيار المستقلة — Spare Part Detail Page
 * تعرض تفاصيل القطعة والصور وسعرها وإمكانية إضافتها للسلة والمشاركة
 */

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Wrench, Package, ShieldCheck, Check, ShoppingCart,
    Star, Truck, Tag, Share2, AlertCircle, Heart, Phone, MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import WatermarkImage from '@/components/WatermarkImage';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api-original';

const CART_KEY = 'hm_cart';
const FAVORITES_KEY = 'hm_favorites';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PartDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, socialLinks } = useSettings();
    const { isLoggedIn } = useAuth();

    const [part, setPart] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedImage, setSelectedImage] = useState(0);
    const [inCart, setInCart] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadPart = async () => {
            setLoading(true);
            try {
                const res: any = await api.parts.getById(id);
                const data = res?.data || res?.part || res;
                if (data && (data._id || data.id)) {
                    setPart(data);
                } else {
                    setError(isRTL ? 'القطعة المطلوبة غير موجودة' : 'Part not found');
                }
            } catch (err: any) {
                console.error('Failed to fetch part', err);
                setError(isRTL ? 'تعذر تحميل بيانات القطعة' : 'Failed to load part details');
            } finally {
                setLoading(false);
            }
        };

        if (id) loadPart();
    }, [id, isRTL]);

    // تحقق من السلة والمفضلة
    useEffect(() => {
        if (!id) return;
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            setInCart(cart.some((item: any) => item.id === id || item._id === id));

            const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            setIsFav(favs.includes(id));
        } catch { }
    }, [id]);

    const handleAddToCart = () => {
        if (!part) return;
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            const cardKey = part._id || part.id;
            if (!cart.some((i: any) => i.id === cardKey)) {
                cart.push({
                    ...part,
                    id: cardKey,
                    type: 'part',
                    price: part.price || part.priceSar || 0,
                    quantity: 1
                });
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
                window.dispatchEvent(new Event('cart_updated'));
            }
            setInCart(true);
        } catch { }
    };

    const handleToggleFav = () => {
        if (!part) return;
        const cardKey = part._id || part.id;
        try {
            const favs: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            const next = favs.includes(cardKey)
                ? favs.filter(i => i !== cardKey)
                : [...favs, cardKey];
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
            setIsFav(!isFav);
            window.dispatchEvent(new Event('favorites_updated'));
        } catch { }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: part?.name || 'HM CAR',
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const images: string[] = part?.images && part.images.length > 0
        ? part.images
        : (part?.imageUrl || part?.img ? [part.imageUrl || part.img] : []);

    const name = isRTL ? (part?.nameAr || part?.name) : (part?.name || part?.nameAr);
    const price = Number(part?.price || part?.priceSar || 0);
    const stock = Number(part?.stock ?? part?.stockQty ?? 1);
    const whatsappNum = socialLinks?.whatsapp || '821080880014';
    const whatsappUrl = `https://wa.me/${whatsappNum.replace(/\D/g, '')}?text=${encodeURIComponent(
        isRTL
            ? `مرحباً، أود الاستفسار عن قطعة الغيار: ${name} (كود: ${part?.partNumber || id})`
            : `Hello, I would like to inquire about part: ${name} (Ref: ${part?.partNumber || id})`
    )}`;

    return (
        <div className="min-h-screen bg-[#080810] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
                    <span className="text-sm font-bold">{isRTL ? 'العودة لقطع الغيار' : 'Back to Parts'}</span>
                </button>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
                        <div className="aspect-square bg-white/5 rounded-3xl" />
                        <div className="space-y-6">
                            <div className="h-8 bg-white/5 rounded-xl w-3/4" />
                            <div className="h-6 bg-white/5 rounded-xl w-1/3" />
                            <div className="h-32 bg-white/5 rounded-2xl w-full" />
                            <div className="h-14 bg-white/5 rounded-2xl w-full" />
                        </div>
                    </div>
                ) : error || !part ? (
                    <div className="text-center py-28 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                        <AlertCircle className="w-16 h-16 text-amber-500/40 mx-auto mb-4" />
                        <h2 className="text-2xl font-black uppercase mb-2">{error || (isRTL ? 'القطعة غير متوفرة' : 'Part not found')}</h2>
                        <p className="text-white/40 text-sm mb-6">
                            {isRTL ? 'ربما تم بيع هذه القطعة أو تغيير الرابط' : 'This component might be sold or the link has changed'}
                        </p>
                        <Link href="/parts">
                            <button className="px-8 py-3.5 bg-amber-500 text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-amber-400 transition-all">
                                {isRTL ? 'تصفح كل القطع' : 'Browse All Parts'}
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* 1. Images Gallery */}
                        <div className="space-y-4">
                            <div className="relative aspect-square rounded-3xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
                                {images.length > 0 ? (
                                    <WatermarkImage
                                        src={images[selectedImage]}
                                        alt={name || 'Spare Part'}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Wrench className="w-24 h-24 text-white/10" />
                                    </div>
                                )}

                                {/* Floating badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {part.carMake && (
                                        <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase">
                                            {part.carMake}
                                        </span>
                                    )}
                                    {part.category && (
                                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
                                            {part.category}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Thumbnail selector */}
                            {images.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImage === idx ? 'border-amber-400 shadow-lg shadow-amber-500/20' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                                        >
                                            <WatermarkImage
                                                src={img}
                                                alt={`thumb-${idx}`}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Details & Actions */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                                        {part.carModel || part.carMake || (isRTL ? 'قطع غيار أصلية' : 'GENUINE SPARE PART')}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleToggleFav}
                                            className={`p-2.5 rounded-full border transition-all ${isFav ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                                        >
                                            <Heart className="w-4 h-4 fill-current" />
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-3">
                                    {name}
                                </h1>
                                {part.partNumber && (
                                    <p className="text-xs font-mono text-white/40">
                                        {isRTL ? 'رقم القطعة (OEM):' : 'PART NO:'} <span className="text-white/80">{part.partNumber}</span>
                                    </p>
                                )}
                            </div>

                            {/* Price Card */}
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 space-y-2">
                                <span className="text-xs text-white/40 block font-bold uppercase">
                                    {isRTL ? 'السعر النهائي' : 'TOTAL PRICE'}
                                </span>
                                <div className="text-3xl sm:text-4xl font-black text-amber-400">
                                    {price > 0 ? formatPrice(price) : (isRTL ? 'تواصل معنا لمعرفة السعر' : 'Contact us for price')}
                                </div>
                                <div className="flex items-center gap-2 text-xs pt-2">
                                    <span className={`w-2 h-2 rounded-full ${stock > 0 ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                                    <span className={stock > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                        {stock > 0 ? (isRTL ? `متوفر في المستودع (${stock} قطعة)` : `In Stock (${stock} available)`) : (isRTL ? 'نفدت الكمية' : 'Out of stock')}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            {part.description && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60">
                                        {isRTL ? 'الوصف والمواصفات' : 'DESCRIPTION & SPECS'}
                                    </h3>
                                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                        {part.description}
                                    </p>
                                </div>
                            )}

                            {/* Compatibility */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <span className="text-[10px] text-white/40 font-bold uppercase block mb-1">
                                        {isRTL ? 'صانع السيارة' : 'VEHICLE MAKE'}
                                    </span>
                                    <span className="text-sm font-black text-white">{part.carMake || '—'}</span>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <span className="text-[10px] text-white/40 font-bold uppercase block mb-1">
                                        {isRTL ? 'الموديلات المتوافقة' : 'COMPATIBLE MODEL'}
                                    </span>
                                    <span className="text-sm font-black text-white">{part.carModel || '—'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={stock === 0}
                                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${inCart ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-black hover:bg-amber-400 shadow-xl shadow-amber-500/20 disabled:opacity-50'}`}
                                >
                                    {inCart ? (
                                        <>
                                            <Check className="w-5 h-5" />
                                            {isRTL ? 'تمت الإضافة للسلة' : 'ADDED TO CART'}
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="w-5 h-5" />
                                            {isRTL ? 'إضافة إلى السلة' : 'ADD TO CART'}
                                        </>
                                    )}
                                </button>

                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                                    <span>{isRTL ? 'استفسار واتساب' : 'WhatsApp'}</span>
                                </a>
                            </div>

                            {copied && (
                                <p className="text-xs text-center text-emerald-400 font-bold">
                                    {isRTL ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard!'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
