'use client';

/**
 * شريط التنقل السفلي (Bottom Tab Bar) المطور للعميل
 * يحتوي على: الرئيسية، السيارات، المزادات، المفضلة، حسابي
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Car, User, Heart, Gavel } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useUI } from '@/lib/UIContext';
import { useEffect, useState, useRef } from 'react';

export default function BottomTabBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { setFavoritesOpen } = useUI();
    const [favCount, setFavCount] = useState(0);
    const [visible, setVisible] = useState(true);
    const lastScrollY = useRef(0);

    // تحديث عدد المفضلة عند تحميل المكون وعند حدوث حدث التحديث
    const updateFavCount = () => {
        try {
            const data = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            setFavCount(Array.isArray(data) ? data.length : 0);
        } catch {
            setFavCount(0);
        }
    };

    useEffect(() => {
        updateFavCount();
        window.addEventListener('favorites_updated', updateFavCount);
        window.addEventListener('storage', updateFavCount);
        return () => {
            window.removeEventListener('favorites_updated', updateFavCount);
            window.removeEventListener('storage', updateFavCount);
        };
    }, []);

    // إخفاء الشريط عند التمرير لأسفل وإظهاره عند التمرير لأعلى
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
                setVisible(false); // تمرير لأسفل -> إخفاء
            } else {
                setVisible(true); // تمرير لأعلى -> إظهار
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (matchPaths: string[], exact = false) => {
        if (exact) return pathname === '/';
        return matchPaths.some(p => pathname.startsWith(p));
    };

    const tabs = [
        {
            href: '/',
            icon: Home,
            labelAr: 'الرئيسية',
            labelEn: 'Home',
            exact: true,
            matchPaths: ['/'],
        },
        {
            href: '/cars',
            icon: Car,
            labelAr: 'السيارات',
            labelEn: 'Cars',
            exact: false,
            matchPaths: ['/cars', '/gallery', '/showroom'],
        },
        {
            href: '/auctions',
            icon: Gavel,
            labelAr: 'المزاد',
            labelEn: 'Auctions',
            exact: false,
            matchPaths: ['/auctions'],
        },
        {
            href: '#favorites',
            icon: Heart,
            labelAr: 'المفضلة',
            labelEn: 'Favorites',
            exact: false,
            matchPaths: [],
            isFavorites: true,
        },
        {
            href: isLoggedIn ? '/client/dashboard' : '/login',
            icon: User,
            labelAr: isLoggedIn ? 'حسابي' : 'دخول',
            labelEn: isLoggedIn ? 'Account' : 'Login',
            exact: false,
            matchPaths: ['/client', '/login', '/register'],
        }
    ];

    return (
        <AnimatePresence>
            {visible && (
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A]/95 border-t border-white/10 backdrop-blur-3xl shadow-2xl lg:hidden"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
                >
                    <div className="flex items-center justify-around px-2 pt-3 pb-2 max-w-lg mx-auto relative">
                        {tabs.map((tab) => {
                            const isFav = tab.isFavorites;
                            const active = isFav ? false : isActive(tab.matchPaths, tab.exact);
                            const Icon = tab.icon;

                            const content = (
                                <motion.div
                                    whileTap={{ scale: 0.88 }}
                                    className="flex flex-col items-center gap-1 cursor-pointer relative py-1"
                                >
                                    <div className="relative">
                                        {active && (
                                            <motion.div
                                                layoutId="tab-bg"
                                                className="absolute -inset-3 rounded-xl bg-amber-500/10"
                                                transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                            />
                                        )}
                                        <Icon
                                            className={`w-5.5 h-5.5 relative z-10 transition-all duration-300 ${
                                                active
                                                    ? 'text-[#C9A96E] scale-110 drop-shadow-[0_0_8px_rgba(201,169,110,0.5)]'
                                                    : 'text-white/40 group-hover:text-white/70'
                                            }`}
                                            strokeWidth={active ? 2.5 : 2}
                                        />
                                        {isFav && favCount > 0 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0A0A0A]">
                                                {favCount}
                                            </span>
                                        )}
                                    </div>

                                    <span
                                        className={`text-[9px] font-black tracking-wide transition-all duration-300 ${
                                            active ? 'text-[#C9A96E]' : 'text-white/35 group-hover:text-white/60'
                                        }`}
                                    >
                                        {isRTL ? tab.labelAr : tab.labelEn}
                                    </span>

                                    {active && (
                                        <motion.div
                                            layoutId="tab-dot"
                                            className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#C9A96E]"
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                        />
                                    )}
                                </motion.div>
                            );

                            if (isFav) {
                                return (
                                    <button
                                        key="favorites-tab"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFavoritesOpen(true);
                                        }}
                                        className="flex-1 group outline-none"
                                    >
                                        {content}
                                    </button>
                                );
                            }

                            return (
                                <Link key={tab.href} href={tab.href} className="flex-1 group" prefetch={true}>
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
