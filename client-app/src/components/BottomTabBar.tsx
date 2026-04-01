'use client';

/**
 * شريط التنقل السفلي (Bottom Tab Bar)
 * يظهر badge الإشعارات غير المقروءة والطلبات النشطة والمفضلة
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Car, Bell, Wrench, User, Heart } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-original';

const FAVORITES_KEY = 'hm_favorites';
const CART_KEY = 'hm_cart';

const TABS = [
    {
        href: '/gallery',
        icon: Car,
        labelAr: 'السيارات',
        labelEn: 'Cars',
        matchPaths: ['/gallery', '/showroom', '/cars'],
        badgeKey: null,
    },
    {
        href: '/parts',
        icon: Wrench,
        labelAr: 'قطع الغيار',
        labelEn: 'Parts',
        matchPaths: ['/parts'],
        badgeKey: null,
    },
    {
        href: '/',
        icon: Home,
        labelAr: 'الرئيسية',
        labelEn: 'Home',
        matchPaths: ['/'],
        exact: true,
        badgeKey: null,
    },
    {
        href: '/notifications',
        icon: Bell,
        labelAr: 'الإشعارات',
        labelEn: 'Notifications',
        matchPaths: ['/notifications'],
        badgeKey: 'notifications',
    },
    {
        href: '/client/dashboard',
        icon: User,
        labelAr: 'حسابي',
        labelEn: 'Account',
        matchPaths: ['/client', '/profile', '/orders'],
        badgeKey: 'orders',
    },
];

export default function BottomTabBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const { user, isLoggedIn } = useAuth();
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [activeOrders, setActiveOrders] = useState(0);
    const [favCount, setFavCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    // جلب عدد المفضلة والسلة من localStorage
    const refreshLocalCounts = () => {
        try {
            const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
            setFavCount(Array.isArray(favs) ? favs.length : 0);
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            setCartCount(Array.isArray(cart) ? cart.length : 0);
        } catch { /* silent */ }
    };

    useEffect(() => {
        refreshLocalCounts();
        window.addEventListener('favorites_updated', refreshLocalCounts);
        window.addEventListener('cart_updated', refreshLocalCounts);
        return () => {
            window.removeEventListener('favorites_updated', refreshLocalCounts);
            window.removeEventListener('cart_updated', refreshLocalCounts);
        };
    }, []);

    // جلب عدد الإشعارات والطلبات غير المقروءة
    useEffect(() => {
        if (!isLoggedIn) return;

        const fetchBadges = async () => {
            try {
                const dashRes = await api.dashboard.getClientData();
                const data = dashRes?.data || dashRes;
                const stats = data?.stats || data;

                if (stats?.unreadNotifications !== undefined) {
                    setUnreadNotifs(stats.unreadNotifications);
                }
                if (stats?.activeOrders !== undefined) {
                    setActiveOrders(stats.activeOrders);
                } else if (stats?.myOrders !== undefined) {
                    setActiveOrders(stats.myOrders);
                }
            } catch { /* silent */ }
        };

        fetchBadges();
        const interval = setInterval(fetchBadges, 3 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isLoggedIn, user]);

    const isActive = (tab: typeof TABS[0]) => {
        if (tab.exact) return pathname === tab.href;
        return tab.matchPaths.some(p => pathname.startsWith(p));
    };

    const getBadge = (tab: typeof TABS[0]) => {
        if (tab.badgeKey === 'notifications') return isLoggedIn ? unreadNotifs : 0;
        if (tab.badgeKey === 'orders') return isLoggedIn ? activeOrders : 0;
        return 0;
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A]/95 border-t border-white/10 backdrop-blur-3xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
            dir="ltr"
        >
            <div className="flex items-center justify-around px-2 pt-3 pb-2 max-w-lg mx-auto">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    const badge = getBadge(tab);

                    return (
                        <Link key={tab.href} href={tab.href} className="flex-1 group" prefetch={true}>
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center gap-1 cursor-pointer relative py-1"
                            >
                                {/* أيقونة مع badge */}
                                <div className="relative">
                                    {active && (
                                        <motion.div
                                            layoutId="tab-bg"
                                            className="absolute -inset-3 rounded-xl bg-accent-gold/10"
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-6 h-6 relative z-10 transition-all duration-300 ${
                                            active
                                                ? 'text-accent-gold scale-110 drop-shadow-[0_0_8px_rgba(201,169,110,0.5)]'
                                                : 'text-white/40 group-hover:text-white/70'
                                        }`}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                    {/* Badge الإشعارات */}
                                    {badge > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center z-20 shadow-lg"
                                        >
                                            {badge > 99 ? '99+' : badge}
                                        </motion.span>
                                    )}
                                </div>

                                {/* التسمية */}
                                <span
                                    className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                                        active ? 'text-accent-gold' : 'text-white/30 group-hover:text-white/60'
                                    }`}
                                >
                                    {isRTL ? tab.labelAr : tab.labelEn}
                                </span>

                                {/* نقطة النشاط */}
                                {active && (
                                    <motion.div
                                        layoutId="tab-dot"
                                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent-gold"
                                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
