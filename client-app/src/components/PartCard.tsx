'use client';

/**
 * PartCard - بطاقة قطعة الغيار الإبداعية
 * تصميم حديث مع تأثيرات متقدمة وتجربة مستخدم محسّنة
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ShoppingCart, Check, Wrench, Package, DollarSign, Coins, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import type { PartCardProps } from '@/types';
import CurrencySwitcher from '@/components/CurrencySwitcher';

const FAVORITES_KEY = 'hm_favorites';
const CART_KEY = 'hm_cart';

function getFavorites(): string[] {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}
function getCart(): any[] {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
}
function dispatchCartUpdate() {
    window.dispatchEvent(new CustomEvent('cart_updated'));
}

export default function PartCard({ part, index = 0, onClick, onLoginRequired }: PartCardProps) {
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { formatPrice, displayCurrency, setDisplayCurrency } = useSettings() as any;

    const cardKey = String(part.id || part._id || `part-${index}`);
    const imageSrc = part.img || part.images?.[0] || '';
    const name = isRTL ? (part.nameAr || part.name) : (part.name || part.nameAr);
    const stock = part.stockQty ?? part.stock ?? 0;

    // Motion values للتأثيرات ثلاثية الأبعاد
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const [imgError, setImgError] = useState(false);
    const [isFav, setIsFav] = useState(() => getFavorites().includes(cardKey));
    const [inCart, setInCart] = useState(() => getCart().some((i: any) => i.id === cardKey));
    const [cartAdded, setCartAdded] = useState(false);

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
        cart.push({ ...part, id: cardKey, type: 'part' });
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        dispatchCartUpdate();
        setInCart(true);
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
    }, [part, cardKey, inCart, stock, isLoggedIn, onLoginRequired]);

    const toggleCurrency = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const currencies = ['SAR', 'KRW', 'USD'];
        const currentIndex = currencies.indexOf(displayCurrency || 'SAR');
        const nextCurrency = currencies[(currentIndex + 1) % currencies.length];
        setDisplayCurrency?.(nextCurrency);
    }, [displayCurrency, setDisplayCurrency]);

    const price = Number(part.price || part.priceSar || 0);
    const displayPrice = formatPrice ? formatPrice(price) : `${price.toLocaleString()} SAR`;

    const stockColor = stock > 5 ? 'text-emerald-400' : stock > 0 ? 'text-amber-400' : 'text-red-400';
    const stockBg = stock > 5 ? 'bg-emerald-500/10' : stock > 0 ? 'bg-amber-500/10' : 'bg-red-500/10';
    const stockLabel = stock > 5
        ? (isRTL ? 'متوفر' : 'Available')
        : stock > 0
            ? (isRTL ? `${stock} فقط` : `${stock} left`)
            : (isRTL ? 'نفد' : 'Sold Out');

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(e.clientX - centerX);
        y.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
                delay: (index % 4) * 0.08, 
                duration: 0.5,
                type: "spring",
                stiffness: 100
            }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative"
        >
            <div
                onClick={onClick}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-amber-400/40 transition-all duration-500 cursor-pointer shadow-2xl hover:shadow-amber-400/20"
            >
                {/* خلفية متحركة */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* شبكة خلفية */}
                <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                </div>

                {/* ── صورة القطعة ── */}
                <div className="relative aspect-square bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
                    {!imgError && imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={name || ''}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={() => setImgError(true)}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Wrench className="w-16 h-16 text-white/10" />
                        </div>
                    )}

                    {/* تدرج متقدم */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    
                    {/* تأثير إضاءة */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-2/3 bg-amber-500/10 blur-3xl" />
                    </div>

                    {/* ── شارة الحالة ── */}
                    <div className="absolute top-3 left-3">
                        <motion.span 
                            whileHover={{ scale: 1.05 }}
                            className="bg-black/80 backdrop-blur-xl border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-400 shadow-lg"
                        >
                            {part.condition || 'NEW'}
                        </motion.span>
                    </div>

                    {/* ── أزرار علوية ── */}
                    <div className="absolute top-3 right-3 flex gap-2">
                        {/* زر التفاصيل (الوصف) */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xl bg-black/60 border border-white/20 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all duration-300 shadow-lg"
                            title={isRTL ? 'التفاصيل' : 'Details'}
                        >
                            <FileText className="w-4 h-4 text-white/70" />
                        </motion.button>

                        {/* زر القلب */}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleFav}
                            className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg",
                                isFav
                                    ? "bg-red-500/90 border-red-400/50"
                                    : "bg-black/60 border-white/20 hover:bg-red-500/20 hover:border-red-400/40"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", isFav ? "fill-white text-white" : "text-white/70")} />
                        </motion.button>
                    </div>

                    {/* ── حالة المخزون ── */}
                    <div className="absolute bottom-3 left-3">
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-lg",
                            stockBg,
                            stock > 0 ? "border-white/20" : "border-red-500/30"
                        )}>
                            <Package className={cn("w-3.5 h-3.5", stockColor)} />
                            <span className={cn("text-[10px] font-black uppercase tracking-wider", stockColor)}>
                                {stockLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── معلومات القطعة ── */}
                <div className="p-5 space-y-4">
                    {/* الماركة */}
                    {(part.brand || part.brandName) && (
                        <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                            <p className="text-[9px] font-black text-amber-400/70 tracking-[0.3em] uppercase">
                                {part.brand || part.brandName}
                            </p>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                        </div>
                    )}

                    {/* الاسم */}
                    <h3 className="text-base font-black leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors duration-300 min-h-[2.5rem]">
                        {name}
                    </h3>

                    {/* الفئة */}
                    {(part.categoryAr || part.category) && (
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                            {part.categoryAr || part.category}
                        </p>
                    )}

                    {/* السعر وزر الشراء والعملة */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                        {/* السعر */}
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mb-0.5">
                                {isRTL ? 'السعر' : 'PRICE'}
                            </p>
                            <p className="text-xl font-black text-amber-400 leading-none truncate">
                                {displayPrice}
                            </p>
                        </div>
                        
                        <div onClick={e => e.stopPropagation()}>
                            <CurrencySwitcher variant="minimal" />
                        </div>

                        {/* زر الشراء */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addToCart}
                            disabled={stock === 0}
                            title={isRTL ? 'شراء' : 'Buy'}
                            className={cn(
                                "h-10 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all duration-400",
                                inCart
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-400/50"
                                    : stock === 0
                                        ? "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
                                        : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-white/10 hover:from-amber-500 hover:to-orange-500 hover:text-black hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                            )}
                        >
                            {cartAdded || inCart ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{isRTL ? 'تم' : 'ADDED'}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'شراء' : 'BUY'}</span>
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* خط متوهج في الأسفل */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500" />
            </div>
        </motion.div>
    );
}
