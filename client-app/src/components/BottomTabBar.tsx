'use client';

/**
 * شريط التنقل السفلي (Bottom Tab Bar) المطور للعميل
 * يحتوي على: الرئيسية، السيارات، واتساب العائم، العملة، ودخول/حسابي
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Car, User, Wrench } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-original';

const SocialSVGIcons = {
    whatsapp: ({ className }: { className?: string }) => (
        <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
};

export default function BottomTabBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { displayCurrency, setDisplayCurrency } = useSettings();
    const [whatsappNumber, setWhatsappNumber] = useState('+821080880014');

    useEffect(() => {
        const fetchSocial = async () => {
            try {
                const response = await api.settings.getPublic();
                if (response.success && response.data.socialLinks?.whatsapp) {
                    setWhatsappNumber(response.data.socialLinks.whatsapp);
                }
            } catch { /* ignored */ }
        };
        fetchSocial();
    }, []);

    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;

    const toggleCurrency = () => {
        const order: ('SAR' | 'USD' | 'KRW')[] = ['SAR', 'USD', 'KRW'];
        const nextIdx = (order.indexOf(displayCurrency) + 1) % order.length;
        setDisplayCurrency(order[nextIdx]);
    };

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
            isWhatsapp: false,
            isCurrency: false,
            isSpareParts: false,
        },
        {
            href: '/cars',
            icon: Car,
            labelAr: 'السيارات',
            labelEn: 'Cars',
            exact: false,
            matchPaths: ['/cars', '/gallery', '/showroom'],
            isWhatsapp: false,
            isCurrency: false,
            isSpareParts: false,
        },
        {
            href: '',
            icon: undefined,
            labelAr: '',
            labelEn: '',
            exact: false,
            matchPaths: [],
            isWhatsapp: true,
            isCurrency: false,
            isSpareParts: false,
        },
        {
            href: '/parts',
            icon: Wrench,
            labelAr: 'قطع الغيار',
            labelEn: 'Parts',
            exact: false,
            matchPaths: ['/parts'],
            isWhatsapp: false,
            isCurrency: false,
            isSpareParts: true,
        },
        {
            href: '',
            icon: undefined,
            labelAr: '',
            labelEn: '',
            exact: false,
            matchPaths: [],
            isWhatsapp: false,
            isCurrency: true,
            isSpareParts: false,
        },
        {
            href: isLoggedIn ? '/client/dashboard' : '/login',
            icon: User,
            labelAr: isLoggedIn ? 'حسابي' : 'دخول',
            labelEn: isLoggedIn ? 'Account' : 'Login',
            exact: false,
            matchPaths: ['/client', '/login', '/register'],
            isWhatsapp: false,
            isCurrency: false,
            isSpareParts: false,
        }
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A]/95 border-t border-white/10 backdrop-blur-3xl shadow-2xl lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
        >
            <div className="flex items-center justify-around px-2 pt-3 pb-2 max-w-lg mx-auto relative">
                {tabs.map((tab, idx) => {
                    if (tab.isWhatsapp) {
                        return (
                            <a
                                key="whatsapp-tab"
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex flex-col items-center group relative -mt-7"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-green-500/30 border-4 border-[#0a0a0a] group-hover:scale-105 transition-transform">
                                    <SocialSVGIcons.whatsapp className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-[#25D366] tracking-wide mt-1">
                                    {isRTL ? "واتساب" : "WhatsApp"}
                                </span>
                            </a>
                        );
                    }

                    if (tab.isCurrency) {
                        return (
                            <div
                                key="currency-tab"
                                onClick={toggleCurrency}
                                className="flex-1 flex flex-col items-center group cursor-pointer"
                            >
                                <div className="relative py-1">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400">
                                        {displayCurrency === 'SAR' ? 'ر.س' : displayCurrency === 'USD' ? '$' : '₩'}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-white/30 group-hover:text-white/60 mt-1">
                                    {isRTL ? "العملة" : "Currency"}
                                </span>
                            </div>
                        );
                    }

                    const active = isActive(tab.matchPaths, tab.exact);
                    const Icon = tab.icon!;

                    return (
                        <Link key={tab.href} href={tab.href} className="flex-1 group" prefetch={true}>
                            <motion.div
                                whileTap={{ scale: 0.88 }}
                                className="flex flex-col items-center gap-1 cursor-pointer relative py-1"
                            >
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
                                </div>

                                <span
                                    className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                                        active ? 'text-accent-gold' : 'text-white/30 group-hover:text-white/60'
                                    }`}
                                >
                                    {isRTL ? tab.labelAr : tab.labelEn}
                                </span>

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
