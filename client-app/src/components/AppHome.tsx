'use client';

/**
 * الواجهة الرئيسية لنمط التطبيق (AppHome)
 * مصممة خصيصاً لتجربة الجوال (PWA)
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Gavel, Car, ShoppingBag,
    Bell, User, ChevronRight, MessageCircle, Star, Send,
    Package, Heart, TrendingUp, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api-original';
import PullToRefresh from './PullToRefresh';

export default function AppHome({ isRTL, latestCars, formatPrice }: { isRTL: boolean; latestCars: any[]; formatPrice: (p: number) => string }) {
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();

    // البيانات الحقيقية للعميل
    const [activeOrders, setActiveOrders] = useState<number | null>(null);
    const [watchedAuctions, setWatchedAuctions] = useState<number | null>(null);
    const [favoriteCars, setFavoriteCars] = useState<number | null>(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);

    const handleRefresh = async () => {
        router.refresh();
        await fetchClientStats();
    };

    const fetchClientStats = async () => {
        if (!isLoggedIn) { setLoadingStats(false); return; }
        setLoadingStats(true);
        try {
            const res = await api.dashboard.getClientData();
            const data = res?.data || res;
            const stats = data?.stats || data;
            
            setActiveOrders(stats?.activeOrders ?? stats?.ordersCount ?? stats?.myOrders ?? 0);
            setWatchedAuctions(stats?.watchedAuctions ?? stats?.auctionsCount ?? stats?.liveAuctions ?? 0);
            setFavoriteCars(stats?.favoriteCars ?? stats?.favoritesCount ?? stats?.myFavorites ?? 0);
            setUnreadNotifications(data?.unreadNotifications ?? stats?.unreadNotifications ?? 0);
        } catch {
            // fallback: جلب منفصل
            try {
                const [ord, fav] = await Promise.allSettled([
                    api.orders.list({ limit: 1 }),
                    api.favorites.list(),
                ]);
                if (ord.status === 'fulfilled') {
                    setActiveOrders(ord.value?.data?.pagination?.total ?? ord.value?.data?.length ?? 0);
                }
                if (fav.status === 'fulfilled') {
                    setFavoriteCars(Array.isArray(fav.value?.data) ? fav.value.data.length : 0);
                }
                setWatchedAuctions(0);
            } catch { /* silent */ }
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchClientStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const quickActions = [
        { href: '/auctions/live', labelAr: 'المزاد المباشر', labelEn: 'Live Auction', icon: Gavel, color: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20' },
        { href: '/gallery', labelAr: 'المعرض', labelEn: 'Showroom', icon: Car, color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' },
        { href: '/parts', labelAr: 'قطع الغيار', labelEn: 'Parts Store', icon: ShoppingBag, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        { href: '/concierge', labelAr: 'طلب خاص', labelEn: 'Concierge', icon: Send, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        { href: '/orders', labelAr: 'طلباتي', labelEn: 'My Orders', icon: Package, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
        { href: '/favorites', labelAr: 'المفضلة', labelEn: 'Favorites', icon: Heart, color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    ];

    const userProfileImage = (user as any)?.image || null;

    const StatBox = ({ value, labelAr, labelEn, color = 'text-white' }: { value: number | null; labelAr: string; labelEn: string; color?: string }) => (
        <div className="relative text-center">
            {loadingStats ? (
                <Loader2 className="w-5 h-5 text-white/20 animate-spin mx-auto mb-1" />
            ) : (
                <p className={`text-3xl font-black tracking-tighter ${color}`}>{value ?? 0}</p>
            )}
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">
                {isRTL ? labelAr : labelEn}
            </p>
        </div>
    );

    return (
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex flex-col gap-6 pb-10 px-4 pt-6 max-w-lg mx-auto overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* 1. Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {isLoggedIn && userProfileImage ? (
                                <Image src={userProfileImage} alt="User" width={48} height={48} className="object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-white/20" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                {isRTL ? 'أهلاً بك' : 'Welcome back'}
                            </p>
                            <h1 className="text-base font-black text-white leading-tight">
                                {isLoggedIn
                                    ? (user?.name?.split(' ')[0] || (isRTL ? 'عميلنا' : 'Client'))
                                    : (isRTL ? 'زائرنا العزيز' : 'Guest User')}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/notifications"
                            className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            )}
                        </Link>
                        {!isLoggedIn && (
                            <Link
                                href="/login"
                                className="px-4 py-2 rounded-xl bg-accent-gold text-black text-[10px] font-black uppercase tracking-widest"
                            >
                                {isRTL ? 'دخول' : 'LOGIN'}
                            </Link>
                        )}
                    </div>
                </header>

                {/* 2. Status Card (للمسجلين فقط) */}
                {isLoggedIn && (
                    <motion.section
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-[2rem] bg-gradient-to-br from-white/[0.07] to-transparent border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-28 h-28 bg-accent-gold/10 blur-3xl rounded-full" />
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-3 h-3 text-accent-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                                {isRTL ? 'لوحة نشاطي' : 'MY ACTIVITY'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <StatBox value={activeOrders} labelAr="طلبات نشطة" labelEn="Orders" color="text-white" />
                            <StatBox value={watchedAuctions} labelAr="مزادات متابعة" labelEn="Auctions" color="text-accent-gold" />
                            <StatBox value={favoriteCars} labelAr="مفضلاتي" labelEn="Favorites" color="text-pink-400" />
                        </div>
                        <Link
                            href="/client/dashboard"
                            className="mt-4 flex items-center gap-1 text-[9px] font-black text-accent-gold/60 uppercase tracking-widest hover:text-accent-gold transition-colors"
                        >
                            {isRTL ? 'عرض لوحة التحكم' : 'VIEW DASHBOARD'}
                            <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                        </Link>
                    </motion.section>
                )}

                {/* 3. Quick Actions Grid */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-4 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-accent-gold" />
                        {isRTL ? 'وصول سريع' : 'QUICK ACCESS'}
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {quickActions.map((action, i) => {
                            const Icon = action.icon;
                            return (
                                <Link key={i} href={action.href}>
                                    <motion.div
                                        whileTap={{ scale: 0.93 }}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${action.color}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-[9px] font-black uppercase tracking-wide text-center leading-tight">
                                            {isRTL ? action.labelAr : action.labelEn}
                                        </span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* 4. آخر السيارات */}
                {latestCars.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-white italic uppercase tracking-[0.3em] flex items-center gap-2">
                                <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
                                {isRTL ? 'أحدث السيارات' : 'LATEST CARS'}
                            </h2>
                            <Link href="/gallery" className="text-[9px] font-black text-accent-gold/70 uppercase tracking-widest flex items-center gap-1 hover:text-accent-gold">
                                {isRTL ? 'عرض الكل' : 'ALL'}
                                <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                            </Link>
                        </div>

                        <div className="flex flex-col gap-3">
                            {latestCars.slice(0, 4).map((car, i) => (
                                <Link
                                    key={car.id || car._id || i}
                                    href={`/cars/${car.id || car._id || ''}`}
                                    className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <Image
                                            src={car.images?.[0] || '/images/placeholder.jpg'}
                                            alt={car.title || 'Car'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-white uppercase truncate mb-1">
                                            {car.title || car.name}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[9px] font-bold text-white/40">{car.year}</span>
                                            {(car.make?.name || car.make) && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                                    <span className="text-[9px] font-bold text-white/40 truncate">{car.make?.name || car.make}</span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs font-black text-accent-gold">
                                            {formatPrice(Number(car.price || car.priceSar || (Number(car.priceUsd || 0) * 3.75) || 0))}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 text-white/10 group-hover:text-accent-gold transition-colors shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. تواصل سريع */}
                <a
                    href="https://wa.me/967781007805"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 rounded-[2rem] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
                >
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">
                            {isRTL ? 'تحتاج مساعدة؟' : 'NEED HELP?'}
                        </h3>
                        <p className="text-[10px] text-white/40 font-bold">
                            {isRTL ? 'فريقنا متاح 24/7 لمساعدتك' : 'Our team is available 24/7'}
                        </p>
                    </div>
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </motion.div>
                </a>

            </div>
        </PullToRefresh>
    );
}
