'use client';

/**
 * UltraModernPartCard - بطاقة قطعة الغيار الإبداعية المذهلة
 * تصميم ثوري مع تأثيرات ثلاثية الأبعاد وحركات متقدمة
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import WatermarkImage from '@/components/WatermarkImage';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { 
    Heart, ShoppingCart, Check, Wrench, Package, Coins, FileText, 
    Home, Star, Crown, Settings, Cog, Diamond, Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { useRouter } from 'next/navigation';
import type { CartItem } from '@/types';
import CurrencySwitcher from '@/components/CurrencySwitcher';

const FAVORITES_KEY = 'hm_favorites';
const CART_KEY = 'hm_cart';

function getFavorites(): string[] {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}
function getCart(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function dispatchCartUpdate() {
    window.dispatchEvent(new CustomEvent('cart_updated'));
}

interface UltraModernPartCardProps {
    part: {
        id?: string;
        _id?: string;
        name: string;
        nameAr?: string;
        img?: string;
        images?: string[];
        price?: number;
        priceSar?: number;
        priceUsd?: number;
        stockQty?: number;
        stock?: number;
        brand?: string;
        brandName?: string;
        category?: string;
        categoryAr?: string;
        condition?: string;
        description?: string;
        descriptionAr?: string;
    };
    index?: number;
    onClick?: () => void;
    onLoginRequired?: () => void;
}

function resolvePartCardImg(part: any): string {
    const raw = part.img || part.image || (Array.isArray(part.images) && part.images.length > 0 ? part.images[0] : '') || '';
    if (!raw || typeof raw !== 'string') return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1000';
    let url = raw.trim();
    if (url.startsWith('//')) url = `https:${url}`;
    else if (url.startsWith('/')) {
        if (url.startsWith('/uploads') || url.startsWith('/images')) return url;
        url = `https://autospare.com.eg${url}`;
    } else if (!url.startsWith('http')) {
        url = `https://autospare.com.eg/${url}`;
    }
    if (url.includes('autospare.com.eg') || url.includes('encar.com')) {
        return `/api/v2/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

export default function UltraModernPartCard({ 
    part, 
    index = 0, 
    onClick, 
    onLoginRequired 
}: UltraModernPartCardProps) {
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { formatPrice, socialLinks } = useSettings() as any;
    const router = useRouter();

    const cardKey = String(part.id || part._id || `part-${index}`);
    const imageSrc = resolvePartCardImg(part);
    const name = isRTL ? (part.nameAr || part.name) : (part.name || part.nameAr);
    const stock = part.stockQty ?? part.stock ?? 0;

    // Motion values للتأثيرات ثلاثية الأبعاد المتقدمة
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-200, 200], [15, -15]);
    const rotateY = useTransform(x, [-200, 200], [-15, 15]);
    const scale = useSpring(1, { stiffness: 300, damping: 30 });

    const [imgError, setImgError] = useState(false);
    const [isFav, setIsFav] = useState(() => getFavorites().includes(cardKey));
    const [inCart, setInCart] = useState(() => getCart().some((i: CartItem) => i.id === cardKey));
    const [cartAdded, setCartAdded] = useState(false);

    const handleBackToHome = () => {
        router.push('/');
    };

    const toggleFav = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn) { onLoginRequired?.(); return; }
        const favs = getFavorites();
        const next = favs.includes(cardKey)
            ? favs.filter(id => id !== cardKey)
            : [...favs, cardKey];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        setIsFav(!isFav);
        window.dispatchEvent(new CustomEvent('favorites_updated'));
    }, [cardKey, isFav, isLoggedIn, onLoginRequired]);

    const addToCart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn) { onLoginRequired?.(); return; }
        if (inCart || stock === 0) return;
        const cart = getCart();
        cart.push({ ...part, price: part.price ?? part.priceSar ?? 0, id: cardKey, type: 'part', quantity: 1 });
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        dispatchCartUpdate();
        setInCart(true);
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
    }, [part, cardKey, inCart, stock, isLoggedIn, onLoginRequired]);

    const price = Number(part.price || part.priceSar || 0);
    const displayPrice = formatPrice ? formatPrice(price) : `${price.toLocaleString()} SAR`;

    const stockColor = stock > 5 ? 'text-emerald-400' : stock > 0 ? 'text-amber-400' : 'text-red-400';
    const stockBg = stock > 5 ? 'bg-emerald-500/10' : stock > 0 ? 'bg-amber-500/10' : 'bg-red-500/10';
    const stockBorder = stock > 5 ? 'border-emerald-500/30' : stock > 0 ? 'border-amber-500/30' : 'border-red-500/30';
    const stockLabel = stock > 5
        ? (isRTL ? 'متوفر' : 'Available')
        : stock > 0
            ? (isRTL ? `${stock} فقط` : `${stock} left`)
            : (isRTL ? 'نفد' : 'Sold Out');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.1);
        y.set((e.clientY - centerY) * 0.1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);
    };

    const handleMouseEnter = () => {
        scale.set(1.02);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ 
                delay: (index % 4) * 0.1, 
                duration: 0.7,
                type: "spring",
                stiffness: 100
            }}
            style={{
                rotateX,
                rotateY,
                scale,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            className="group relative perspective-1000"
        >
            <div
                onClick={onClick}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/90 via-black to-gray-900/90 border border-white/10 hover:border-amber-400/40 transition-all duration-700 cursor-pointer shadow-2xl hover:shadow-amber-400/20"
            >
                {/* خلفية هولوجرافية متحركة */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 animate-pulse" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(245,158,11,0.15)_0%,transparent_70%)] animate-pulse" />
                </div>

                {/* شبكة نيون متحركة */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse" />
                </div>

                {/* جسيمات متحركة */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-amber-400 rounded-full"
                            style={{
                                left: `${15 + i * 7}%`,
                                top: `${20 + i * 6}%`,
                            }}
                            animate={{
                                y: [-15, -40, -15],
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                delay: i * 0.15,
                            }}
                        />
                    ))}
                </div>

                {/* ── صورة القطعة ── */}
                <div className="relative aspect-square bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
                    {!imgError && imageSrc ? (
                        <WatermarkImage
                            src={imageSrc}
                            alt={name || ''}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-1000 group-hover:rotate-2"
                            onError={() => setImgError(true)}
                            unoptimized
                            watermarkPosition="br"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <Wrench className="w-20 h-20 text-white/10 group-hover:text-amber-500/30 transition-colors duration-500" />
                                {/* تأثير التوهج للأيقونة */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Wrench className="w-20 h-20 text-amber-500/0 group-hover:text-amber-500/20 transition-colors duration-500 blur-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* تدرج متقدم */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* تأثير الإضاءة */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-amber-500/15 blur-3xl" />
                    </div>

                    {/* ── شارة الحالة ── */}
                    <div className="absolute top-4 left-4">
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/20 px-3 py-2 rounded-2xl shadow-lg"
                        >
                            <Settings className="w-3 h-3 text-amber-400" />
                            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                                {part.condition || 'NEW'}
                            </span>
                        </motion.div>
                    </div>

                    {/* زر الرجوع للصفحة الرئيسية */}
                    <div className="absolute top-4 right-4">
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleBackToHome();
                            }}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-11 h-11 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 hover:border-amber-500/50 flex items-center justify-center text-white/80 hover:text-amber-400 hover:bg-black/90 transition-all duration-300 group/back shadow-lg"
                            title={isRTL ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
                        >
                            <Home className="w-5 h-5 group-hover/back:scale-110 transition-transform" />
                        </motion.button>
                    </div>

                    {/* ── أزرار علوية ── */}
                    <div className="absolute top-20 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        {/* زر التفاصيل */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            className="w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-xl bg-black/70 border border-white/20 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-lg"
                            title={isRTL ? 'التفاصيل' : 'Details'}
                        >
                            <FileText className="w-5 h-5 text-white/70 hover:text-blue-400 transition-colors" />
                        </motion.button>

                        {/* زر القلب */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFav}
                            className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg",
                                isFav
                                    ? "bg-red-500/90 border-red-400/50 shadow-red-500/30"
                                    : "bg-black/70 border-white/20 hover:bg-red-500/20 hover:border-red-400/40"
                            )}
                        >
                            <Heart className={cn("w-5 h-5 transition-all", isFav ? "fill-white text-white" : "text-white/70")} />
                        </motion.button>
                    </div>

                    {/* ── حالة المخزون ── */}
                    <div className="absolute bottom-4 left-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border shadow-lg transition-all duration-300",
                                stockBg,
                                stockBorder,
                                stock > 0 ? "hover:scale-105" : ""
                            )}
                        >
                            <Package className={cn("w-4 h-4", stockColor)} />
                            <span className={cn("text-xs font-black uppercase tracking-wider", stockColor)}>
                                {stockLabel}
                            </span>
                            {stock > 0 && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className={cn("w-2 h-2 rounded-full", 
                                        stock > 5 ? "bg-emerald-400" : "bg-amber-400"
                                    )}
                                />
                            )}
                        </motion.div>
                    </div>

                    {/* شارات مميزة */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg backdrop-blur-md">
                            <Crown className="w-3 h-3 text-purple-400" />
                            <span className="text-xs font-bold text-purple-400">{isRTL ? 'أصلي' : 'Original'}</span>
                        </div>
                    </div>
                </div>

                {/* ── معلومات القطعة ── */}
                <div className="p-6 space-y-5">
                    {/* الماركة */}
                    {(part.brand || part.brandName) && (
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <Diamond className="w-3 h-3 text-amber-400" />
                                <p className="text-xs font-black text-amber-400/80 tracking-[0.2em] uppercase">
                                    {part.brand || part.brandName}
                                </p>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                        </div>
                    )}

                    {/* الاسم */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-black leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors duration-300 min-h-[3rem] flex items-center">
                            {name}
                        </h3>
                        
                        {/* الفئة */}
                        {(part.categoryAr || part.category) && (
                            <div className="flex items-center gap-2">
                                <Cog className="w-3 h-3 text-white/40" />
                                <p className="text-xs text-white/50 uppercase tracking-widest font-bold">
                                    {part.categoryAr || part.category}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* زر الطلب عبر الواتساب مع الفاتورة المرفقة */}
                    <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                                    {isRTL ? 'متاح للطلب المباشر' : 'AVAILABLE UPON REQUEST'}
                                </p>
                            </div>
                            <p className="text-xs font-bold text-white/70 line-clamp-1">
                                {isRTL ? 'اطلب وتواصل فورياً' : 'Order via WhatsApp'}
                            </p>
                        </div>

                        {/* زر الطلب عبر الواتساب */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const phone = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');
                                const imgUrl = imageSrc.startsWith('http') ? imageSrc : `${window.location.origin}${imageSrc}`;
                                const invoiceMsg = isRTL
                                    ? `📋 *فاتورة طلب قطعة غيار - HM CAR*\n───────────────\n📦 *القطعة:* ${name}\n🏢 *الوكالة:* ${part.brand || part.brandName || 'غير محدد'}\n🏷️ *التصنيف:* ${part.categoryAr || part.category || 'عام'}\n🖼️ *صورة القطعة:* ${imgUrl}\n───────────────\nالسلام عليكم، أرجو تزويدي بالسعر وتأكيد إمكانية شحن هذه القطعة.`
                                    : `📋 *SPARE PART ORDER INVOICE - HM CAR*\n───────────────\n📦 *Part:* ${name}\n🏢 *Brand:* ${part.brand || part.brandName || 'General'}\n🏷️ *Category:* ${part.category || 'General'}\n🖼️ *Part Image:* ${imgUrl}\n───────────────\nHello, please provide the price and confirm shipping availability for this part.`;
                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(invoiceMsg)}`, '_blank');
                            }}
                            className="h-11 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                        >
                            <span>{isRTL ? 'طلب عبر الواتساب' : 'Order via WhatsApp'}</span>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.988l-1.413 5.164 5.283-1.386c1.455.795 3.1 1.218 4.789 1.218 5.507 0 9.989-4.478 9.989-9.984s-4.482-9.984-9.989-9.984zm5.792 14.126c-.244.686-1.42 1.309-1.968 1.353-.51.041-1.157.184-3.771-.84-3.136-1.226-5.132-4.39-5.288-4.597-.156-.207-1.267-1.688-1.267-3.22 0-1.533.805-2.287 1.09-2.58.286-.293.626-.367.834-.367.208 0 .416.002.598.01.194.008.455-.074.71.539.26.626.885 2.159.963 2.316.078.157.13.34.026.547-.104.207-.156.335-.312.516-.156.182-.328.406-.468.545-.156.156-.319.327-.137.64.182.313.809 1.334 1.734 2.159 1.189 1.06 2.193 1.388 2.506 1.544.313.156.495.13.677-.078.182-.208.781-.911.989-1.224.208-.313.416-.26.703-.156.286.104 1.821.859 2.133 1.015.312.156.52.234.598.365.078.13.078.756-.166 1.442z" />
                            </svg>
                        </motion.button>
                    </div>

                    {/* تقييم القطعة */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                            <span className="text-xs text-white/50 font-bold ml-2">4.8</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-white/40">
                            <Flame className="w-3 h-3 text-orange-400" />
                            <span className="font-bold">{isRTL ? 'الأكثر مبيعاً' : 'Best Seller'}</span>
                        </div>
                    </div>
                </div>

                {/* خط متوهج في الأسفل */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/60 transition-all duration-700" />
                
                {/* Holographic Border */}
                <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                     style={{ 
                         background: 'linear-gradient(45deg, transparent, rgba(245,158,11,0.3), transparent)',
                         mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                         maskComposite: 'xor'
                     }} 
                />
            </div>
        </motion.div>
    );
}