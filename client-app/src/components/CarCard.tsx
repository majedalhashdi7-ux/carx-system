'use client';

/**
 * CarCard - بطاقة السيارة المحسّنة
 * تحتوي على: صورة، معلومات، سعر، قلب (مفضلة)، سلة، زر تفاصيل
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Gauge, Fuel, ArrowRight, Car, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
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

interface CarCardProps {
    car: any;
    index?: number;
    onClick?: () => void;
    onLoginRequired?: () => void;
}

export default function CarCard({ car, index = 0, onClick, onLoginRequired }: CarCardProps) {
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { formatPrice } = useSettings() as any;

    const cardKey = String(car.id || car._id || `car-${index}`);
    const imageSrc = car.images?.[0] || car.imageUrl || '';

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
        if (inCart) return;
        const cart = getCart();
        cart.push({ ...car, id: cardKey, type: 'car' });
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        dispatchCartUpdate();
        setInCart(true);
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
    }, [car, cardKey, inCart, isLoggedIn, onLoginRequired]);

    const price = Number(car.price || car.priceSar || 0);
    const displayPrice = formatPrice ? formatPrice(price) : `${price.toLocaleString()} SAR`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 4) * 0.08, duration: 0.4 }}
            className="group relative"
        >
            {/* بطاقة رئيسية */}
            <div
                onClick={onClick}
                className="relative overflow-hidden rounded-3xl bg-black border border-white/8 hover:border-white/20 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-black/60"
            >
                {/* ── صورة السيارة ── */}
                <div className="relative h-32 sm:h-56 w-full bg-zinc-900 overflow-hidden">
                    {!imgError && imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={car.title || ''}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover transition-all duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/3 to-black/60">
                            <Car className="w-12 h-12 text-white/10" />
                        </div>
                    )}

                    {/* تدرج سفلي */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* ── شارة السنة ── */}
                    <div className="absolute top-3 left-3">
                        <span className="bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-amber-400 tracking-widest">
                            {car.year}
                        </span>
                    </div>

                    {/* ── أزرار القلب والسلة ── */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        {/* قلب المفضلة - أيقونة قلب حرة وشفافة بدون أي مربع محيط */}
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={toggleFav}
                            className="p-1.5 border-none bg-transparent hover:scale-110 transition-all duration-300 cursor-pointer shadow-none outline-none focus:outline-none"
                            title={isRTL ? 'المفضلة' : 'Favorite'}
                        >
                            <Heart className={cn(
                                "w-6 h-6 transition-all duration-300",
                                isFav
                                    ? "fill-red-500 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.95)] scale-110"
                                    : "text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] hover:text-red-400"
                            )} />
                        </motion.button>

                        {/* زر التفاصيل (الوصف) */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 bg-black/30 hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-300 shadow-xl"
                            title={isRTL ? 'الوصف والتفاصيل' : 'Details'}
                        >
                            <FileText className="w-4 h-4 text-white/90" />
                        </motion.button>

                        {/* سلة التسوق */}
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={addToCart}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-xl",
                                inCart
                                    ? "bg-emerald-500/90 border-emerald-400/60 shadow-emerald-500/40"
                                    : "bg-black/30 border-white/20 hover:bg-amber-500/30 hover:border-amber-400/50"
                            )}
                            title={isRTL ? 'أضف للسلة' : 'Add to Cart'}
                        >
                            {cartAdded || inCart
                                ? <Check className="w-4 h-4 text-white" />
                                : <ShoppingCart className="w-4 h-4 text-white/90" />
                            }
                        </motion.button>
                    </div>

                    {/* ── شارة المصدر ── */}
                    {car.source === 'korean_import' && (
                        <div className="absolute bottom-3 left-3">
                            <span className="bg-blue-500/80 backdrop-blur-md border border-blue-400/30 px-2.5 py-1 rounded-full text-[8px] font-black text-white tracking-widest uppercase">
                                🇰🇷 {isRTL ? 'كوري' : 'Korean'}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── معلومات السيارة ── */}
                <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
                    {/* الماركة والعنوان */}
                    <div>
                        <p className="text-[9px] font-black text-amber-400/60 tracking-[0.35em] uppercase mb-1">
                            {car.make || ''}
                        </p>
                        <h3 className="text-xs sm:text-base font-black tracking-tight leading-tight line-clamp-1 group-hover:text-amber-400 transition-colors duration-300">
                            {car.title || car.model || ''}
                        </h3>
                    </div>

                    {/* المواصفات */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/35 font-bold">
                            <Gauge className="w-3 h-3 text-amber-400/40" />
                            <span>{car.mileage?.toLocaleString() || '—'} km</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-white/35 font-bold">
                            <Fuel className="w-3 h-3 text-amber-400/40" />
                            <span>{car.fuelType || car.fuel || '—'}</span>
                        </div>
                    </div>

                    {/* السعر وزر الشراء والعملة */}
                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-white/10 gap-2">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[7px] sm:text-[8px] text-white/40 font-bold uppercase tracking-widest mb-0.5">
                                {isRTL ? 'السعر' : 'PRICE'}
                            </p>
                            <p className="text-xs sm:text-xl font-black text-amber-400 leading-none truncate">
                                {displayPrice}
                            </p>
                        </div>
                        <div className="hidden sm:block" onClick={e => e.stopPropagation()}>
                            <CurrencySwitcher variant="minimal" />
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                            title={isRTL ? 'شراء الآن' : 'Buy Now'}
                            className={cn(
                                "h-8 sm:h-10 px-2 sm:px-4 rounded-xl border border-white/10 flex items-center justify-center gap-2",
                                "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400",
                                "hover:from-amber-500 hover:to-orange-500 hover:text-black hover:border-amber-400",
                                "transition-all duration-400 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]",
                                "hidden sm:flex"
                        )}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'شراء' : 'BUY'}</span>
                            <ArrowRight className={cn("w-3.5 h-3.5 transition-transform", isRTL && "rotate-180")} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
