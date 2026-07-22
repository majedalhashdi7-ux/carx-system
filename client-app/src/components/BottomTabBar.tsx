'use client';

/**
 * شريط التنقل السفلي — تصميم فاخر وثابت بالجوال
 * ترتيب الأيقونات من اليمين إلى اليسار:
 * اليمين: [الرئيسية | السيارات | قطع] — الوسط: [واتساب] — اليسار: [المزاد | العملات | دخول/حسابي]
 * عند ضغط زر العملة يتم التبديل المباشر بين العملات (SAR -> USD -> KRW)
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Car, User, Gavel } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { useEffect, useState } from 'react';

export default function BottomTabBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const { isLoggedIn, isAdmin } = useAuth();
    const { socialLinks, displayCurrency, setDisplayCurrency } = useSettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const whatsappNumber = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');

    const isActive = (paths: string[]) => paths.some(p => p === '/' ? pathname === '/' : pathname?.startsWith(p));

    const handleWhatsApp = () => {
        const msg = isRTL ? 'مرحباً، أريد الاستفسار عن سيارة' : 'Hello, I want to inquire about a car';
        const url = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(msg);
        window.open(url, '_blank');
    };

    const currencies = [
        { code: 'SAR' as const, symbol: 'ر.س', label: isRTL ? 'ريال' : 'SAR', color: '#10b981' },
        { code: 'USD' as const, symbol: '$',   label: isRTL ? 'دولار' : 'USD', color: '#3b82f6' },
        { code: 'KRW' as const, symbol: '₩',   label: isRTL ? 'وون' : 'KRW',   color: '#a855f7' },
    ];

    const currentCurrency = currencies.find(c => c.code === displayCurrency) || currencies[0];

    const handleCycleCurrency = () => {
        const codes: Array<'SAR' | 'USD' | 'KRW'> = ['SAR', 'USD', 'KRW'];
        const idx = codes.indexOf(displayCurrency as any);
        const nextCode = codes[(idx + 1) % codes.length];
        setDisplayCurrency(nextCode);
    };

    // ─── اليمين (في النظام العربي): الرئيسية | السيارات | قطع ───
    const rightTabs = [
        { href: '/',         icon: Home,          labelAr: 'الرئيسية', labelEn: 'Home',     paths: ['/'] },
        { href: '/cars',     icon: Car,           labelAr: 'السيارات', labelEn: 'Cars',     paths: ['/cars', '/showroom', '/gallery'] },
        { href: '/parts',    icon: SparePartIcon,  labelAr: 'قطع',      labelEn: 'Parts',    paths: ['/parts'] },
    ];

    // ─── اليسار: المزاد | دخول/حسابي ───
    const leftTabs = [
        { href: '/auctions', icon: Gavel,         labelAr: 'المزاد',   labelEn: 'Auctions', paths: ['/auctions'] },
        {
            href: isLoggedIn ? (isAdmin ? '/admin/dashboard' : '/client/dashboard') : '/login',
            icon: User,
            labelAr: isLoggedIn ? 'حسابي' : 'دخول',
            labelEn: isLoggedIn ? 'Account' : 'Login',
            paths: ['/client', '/admin', '/login', '/register'],
        },
    ];

    if (!mounted) return null;

    return (
        <div
            className="fixed bottom-0 inset-x-0 z-[200] lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {/* ─── الشريط الرئيسي ─── */}
            <nav
                className="relative mx-0 bg-[#09090f]/98 border-t border-white/8 backdrop-blur-3xl"
                style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.6)' }}
            >
                <div className="flex items-center justify-around px-1 pt-1.5 pb-safe max-w-lg mx-auto" dir="rtl">

                    {/* ─── 1. اليمين: الرئيسية - السيارات - قطع ─── */}
                    {rightTabs.map(tab => {
                        const active = isActive(tab.paths);
                        const Icon = tab.icon;
                        return (
                            <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center gap-[2px] py-1.5" prefetch>
                                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-[2px]">
                                    <div className={`relative flex items-center justify-center w-7 h-7 rounded-2xl transition-all duration-300 ${active ? 'bg-[#C9A96E]/20' : ''}`}>
                                        {active && (
                                            <motion.div layoutId="activeTabRight" className="absolute inset-0 rounded-2xl bg-[#C9A96E]/15" transition={{ type: 'spring', damping: 25 }} />
                                        )}
                                        <Icon
                                            className={`w-[17px] h-[17px] relative z-10 transition-all duration-300 ${active ? 'text-[#C9A96E]' : 'text-white/40'}`}
                                            strokeWidth={active ? 2.5 : 1.8}
                                        />
                                    </div>
                                    <span className={`text-[8.5px] font-black tracking-wider leading-none transition-colors ${active ? 'text-[#C9A96E]' : 'text-white/35'}`}>
                                        {isRTL ? tab.labelAr : tab.labelEn}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}

                    {/* ─── 2. زر واتساب المركزي الفاخر ─── */}
                    <div className="flex-none flex flex-col items-center relative -mt-6 gap-1 px-1">
                        <motion.button
                            whileTap={{ scale: 0.88 }}
                            whileHover={{ scale: 1.06 }}
                            onClick={handleWhatsApp}
                            className="w-[52px] h-[52px] rounded-full flex items-center justify-center relative border-[3px] border-white shadow-xl"
                            style={{
                                background: 'linear-gradient(145deg, #25D366, #128C7E)',
                                boxShadow: '0 4px 20px rgba(37,211,102,0.55)',
                                borderRadius: '50%',
                            }}
                            aria-label="WhatsApp"
                        >
                            <svg viewBox="0 0 24 24" className="w-[24px] h-[24px] fill-white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </motion.button>
                        <span className="text-[8px] font-black text-[#25D366] tracking-widest">
                            {isRTL ? 'واتساب' : 'WhatsApp'}
                        </span>
                    </div>

                    {/* ─── 3. اليسار: المزاد ─── */}
                    {leftTabs.slice(0, 1).map(tab => {
                        const active = isActive(tab.paths);
                        const Icon = tab.icon;
                        return (
                            <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center gap-[2px] py-1.5" prefetch>
                                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-[2px]">
                                    <div className={`relative flex items-center justify-center w-7 h-7 rounded-2xl transition-all duration-300 ${active ? 'bg-[#C9A96E]/20' : ''}`}>
                                        {active && (
                                            <motion.div layoutId="activeTabAuction" className="absolute inset-0 rounded-2xl bg-[#C9A96E]/15" transition={{ type: 'spring', damping: 25 }} />
                                        )}
                                        <Icon
                                            className={`w-[17px] h-[17px] relative z-10 transition-all duration-300 ${active ? 'text-[#C9A96E]' : 'text-white/40'}`}
                                            strokeWidth={active ? 2.5 : 1.8}
                                        />
                                    </div>
                                    <span className={`text-[8.5px] font-black tracking-wider leading-none transition-colors ${active ? 'text-[#C9A96E]' : 'text-white/35'}`}>
                                        {isRTL ? tab.labelAr : tab.labelEn}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}

                    {/* ─── 4. اليسار: أيقونة تبديل العملات الفوري ─── */}
                    <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={handleCycleCurrency}
                        className="flex-1 flex flex-col items-center gap-[2px] py-1.5"
                        title={isRTL ? 'اضغط لتبديل العملة' : 'Tap to switch currency'}
                    >
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-2xl transition-all duration-300">
                            <span
                                className="w-[19px] h-[19px] rounded-full flex items-center justify-center text-[9px] font-black relative z-10 shadow-md transition-all"
                                style={{ background: currentCurrency.color, color: 'white' }}
                            >
                                {currentCurrency.symbol}
                            </span>
                        </div>
                        <span className="text-[8.5px] font-black tracking-wider leading-none text-[#C9A96E]">
                            {currentCurrency.code}
                        </span>
                    </motion.button>

                    {/* ─── 5. اليسار: دخول / حسابي ─── */}
                    {leftTabs.slice(1).map(tab => {
                        const active = isActive(tab.paths);
                        const Icon = tab.icon;
                        return (
                            <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center gap-[2px] py-1.5" prefetch>
                                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-[2px]">
                                    <div className={`relative flex items-center justify-center w-7 h-7 rounded-2xl transition-all duration-300 ${active ? 'bg-[#C9A96E]/20' : ''}`}>
                                        {active && (
                                            <motion.div layoutId="activeTabUser" className="absolute inset-0 rounded-2xl bg-[#C9A96E]/15" transition={{ type: 'spring', damping: 25 }} />
                                        )}
                                        <Icon
                                            className={`w-[17px] h-[17px] relative z-10 transition-all duration-300 ${active ? 'text-[#C9A96E]' : 'text-white/40'}`}
                                            strokeWidth={active ? 2.5 : 1.8}
                                        />
                                    </div>
                                    <span className={`text-[8.5px] font-black tracking-wider leading-none transition-colors ${active ? 'text-[#C9A96E]' : 'text-white/35'}`}>
                                        {isRTL ? tab.labelAr : tab.labelEn}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}

                </div>
            </nav>
        </div>
    );
}

// أيقونة قطع الغيار
function SparePartIcon({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
    );
}
