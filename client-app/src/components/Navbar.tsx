'use client';

/**
 * مكون مسطرة التنقل العلوي (Navbar) - تصميم HM CAR المحدّث
 * هيدر احترافي: شعار يمين + روابط وسط + عملة/لغة/تسجيل يسار (RTL)
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, ChevronDown,
    Car, MessageCircle, Bell, LogIn, UserPlus, Home, Wrench, Gavel
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import { useStandalone } from '@/lib/useStandalone';
import { useUI } from '@/lib/UIContext';
import { useTenant } from '@/lib/TenantContext';

const rawText = (value: string) => value;

const CURRENCIES = [
    { code: 'SAR', label: 'SAR ريال' },
    { code: 'USD', label: 'USD دولار' },
    { code: 'KRW', label: 'KRW وون' },
];

export default function Navbar() {
    const isStandalone = useStandalone();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const currencyRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const { isLoggedIn, isAdmin } = useAuth();
    const accountHref = isAdmin ? '/admin/dashboard' : '/client/dashboard';
    const { isRTL, toggleLanguage } = useLanguage();
    const { siteInfo, displayCurrency, setDisplayCurrency } = useSettings();
    const { setNotificationsOpen } = useUI();
    const { tenant } = useTenant();
    const isCarX = tenant?.id === 'carx';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { if (isOpen) setIsOpen(false); }, 0);
        return () => clearTimeout(timer);
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // إغلاق قائمة العملة عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
                setCurrencyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // روابط التنقل الرئيسية
    const navLinks = [
        { href: '/', label: isRTL ? 'الرئيسية' : 'Home', icon: Home },
        { href: '/cars', label: isRTL ? 'السيارات' : 'Cars', icon: Car },
        { href: '/parts', label: isRTL ? 'قطع الغيار' : 'Parts', icon: Wrench },
        { href: '/auctions', label: isRTL ? 'المزادات' : 'Auctions', icon: Gavel },
        { href: '/contact', label: isRTL ? 'تواصل معنا' : 'Contact', icon: MessageCircle },
    ];

    const isActive = (href: string) => pathname === href || (href !== '/' && pathname?.startsWith(href));

    const siteName = tenant?.name || siteInfo?.siteName || 'HM CAR';

    // لا يظهر في صفحات الأدمن
    if (pathname?.startsWith('/admin')) return null;
    // في وضع PWA المثبت، BottomTabBar يتولى التنقل
    if (isStandalone) return null;

    // ── تصميم CAR X المنفصل ──
    if (isCarX) {
        return (
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
                    scrolled
                        ? "bg-black/80 backdrop-blur-xl border-b border-red-600/30 shadow-[0_10px_40px_rgba(255,0,0,0.1)]"
                        : "bg-gradient-to-b from-black/60 to-transparent py-4"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="max-w-7xl mx-auto px-6 relative flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Link href="/" className="group flex flex-col items-center text-center">
                            <span className="text-4xl md:text-5xl font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-all group-hover:text-red-600">
                                CAR X
                            </span>
                        </Link>
                        {!isLoggedIn ? (
                            <Link href="/login">
                                <div className="px-8 py-2.5 rounded-full bg-red-600 border border-red-500 text-sm font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,0,0.5)]">
                                    {isRTL ? rawText('تسجيل الدخول') : rawText('SIGN IN')}
                                </div>
                            </Link>
                        ) : (
                            <Link href="/profile">
                                <div className="px-8 py-2.5 rounded-full bg-white/10 border border-red-500/50 text-sm font-black text-white hover:bg-white/20 transition-all cursor-pointer">
                                    {isRTL ? rawText('حسابي') : rawText('MY ACCOUNT')}
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </motion.nav>
        );
    }

    // ── تصميم HM CAR الاحترافي المحدّث ──
    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                    scrolled
                        ? "bg-[#0A0A14]/95 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/80"
                        : "bg-[#0A0A14]/80 backdrop-blur-xl border-b border-white/5"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center h-16 sm:h-18 gap-4">

                        {/* ── شعار HM CAR (يمين في RTL) ── */}
                        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#a88520] flex items-center justify-center shadow-lg shadow-[#D4AF37]/35 border border-white/20 group-hover:scale-105 transition-transform duration-300">
                                <Car className="w-5 h-5 text-black" strokeWidth={2.5} />
                            </div>
                            <span className="text-lg font-black tracking-wide text-white group-hover:text-[#D4AF37] transition-colors italic">
                                {siteName}
                            </span>
                        </Link>

                        {/* ── روابط التنقل (Desktop فقط - وسط) ── */}
                        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-300 relative group tracking-wide",
                                        isActive(link.href)
                                            ? "text-[#D4AF37] bg-[#D4AF37]/8 border border-[#D4AF37]/20"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {link.label}
                                    {isActive(link.href) && (
                                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* ── أدوات اليسار (Desktop) - تصميم أيقونات فاخر وموحد ── */}
                        <div className="hidden lg:flex items-center gap-3 shrink-0">

                            {/* مبدل العملة */}
                            <div className="relative" ref={currencyRef}>
                                <button
                                    onClick={() => setCurrencyOpen(!currencyOpen)}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 text-xs font-black text-white/80 hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    <span>{displayCurrency || 'SAR'}</span>
                                    <ChevronDown className={cn("w-3.5 h-3.5 text-white/40 transition-transform", currencyOpen && "rotate-180")} />
                                </button>
                                <AnimatePresence>
                                    {currencyOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                            transition={{ duration: 0.15 }}
                                            className={cn(
                                                "absolute top-full mt-2 w-36 bg-[#0f0f23] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50",
                                                isRTL ? "right-0" : "left-0"
                                            )}
                                        >
                                            {CURRENCIES.map((c) => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => { setDisplayCurrency(c.code as any); setCurrencyOpen(false); }}
                                                    className={cn(
                                                        "w-full px-4 py-2.5 text-xs font-bold text-right hover:bg-white/5 transition-colors",
                                                        displayCurrency === c.code ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-white/70"
                                                    )}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* مبدل اللغة */}
                            <button
                                onClick={toggleLanguage}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 flex items-center justify-center text-xs font-black text-white/80 hover:bg-white/10 transition-all cursor-pointer"
                                title={isRTL ? 'English' : 'العربية'}
                            >
                                {isRTL ? 'EN' : 'عر'}
                            </button>

                            {/* الإشعارات */}
                            {isLoggedIn && (
                                <button
                                    onClick={() => setNotificationsOpen(true)}
                                    className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                                >
                                    <Bell className="w-4.5 h-4.5" />
                                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                </button>
                            )}

                            {/* حسابي أو تسجيل الدخول */}
                            {isLoggedIn ? (
                                <Link
                                    href={accountHref}
                                    className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 text-xs font-black text-white/80 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <User className="w-4.5 h-4.5" />
                                    <span>{isRTL ? 'حسابي' : 'Account'}</span>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white/70 hover:text-white transition-all"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        <span>{isRTL ? 'دخول' : 'Sign In'}</span>
                                    </Link>
                                    <Link href="/register">
                                        <motion.div
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-xs font-black hover:bg-[#c9a030] transition-all shadow-md shadow-[#D4AF37]/15 cursor-pointer"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>{isRTL ? 'تسجيل' : 'Register'}</span>
                                        </motion.div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* ── أزرار الجوال ── */}
                        <div className="flex lg:hidden items-center gap-2 ml-auto">
                            {/* زر القائمة */}
                            <button
                                onClick={() => setIsOpen(true)}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                                aria-label="Open Menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                    </div>
                </div>
            </motion.nav>

            {/* ═══ قائمة الجوال الجانبية ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] lg:hidden"
                    >
                        {/* خلفية شفافة */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* اللوح الجانبي */}
                        <motion.div
                            initial={{ x: isRTL ? '-100%' : '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? '-100%' : '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className={cn(
                                "absolute top-0 bottom-0 w-80 max-w-[85vw] bg-[#0A0A14] border-white/10 flex flex-col shadow-2xl",
                                isRTL ? "left-0 border-r" : "right-0 border-l"
                            )}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* رأس القائمة */}
                            <div className="flex items-center justify-between p-5 border-b border-white/8">
                                <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#a88520] flex items-center justify-center">
                                        <Car className="w-3.5 h-3.5 text-black" />
                                    </div>
                                    <span className="font-black text-white text-base">{siteName}</span>
                                </Link>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* روابط التنقل */}
                            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: isRTL ? -16 : 16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all",
                                                isActive(link.href)
                                                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <link.icon className="w-4.5 h-4.5 shrink-0" />
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* أدوات أسفل القائمة */}
                            <div className="p-4 border-t border-white/8 space-y-3">
                                {/* مبدل اللغة والعملة */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleLanguage}
                                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:bg-white/10 transition-all"
                                    >
                                        {isRTL ? '🌐 English' : '🌐 العربية'}
                                    </button>
                                    <select
                                        value={displayCurrency}
                                        onChange={(e) => setDisplayCurrency(e.target.value as any)}
                                        className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70 outline-none text-center cursor-pointer"
                                    >
                                        {CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code} className="bg-[#0f0f23]">{c.code}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* تسجيل الدخول أو حسابي */}
                                {isLoggedIn ? (
                                    <Link
                                        href={accountHref}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/8 border border-white/10 text-sm font-bold text-white hover:bg-white/12 transition-all"
                                    >
                                        <User className="w-4 h-4" />
                                        {isRTL ? 'حسابي' : 'My Account'}
                                    </Link>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/80 hover:bg-white/10 transition-all cursor-pointer">
                                                <LogIn className="w-4 h-4" />
                                                {isRTL ? 'دخول' : 'Sign In'}
                                            </div>
                                        </Link>
                                        <Link href="/register" onClick={() => setIsOpen(false)}>
                                            <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#D4AF37] text-black text-sm font-black hover:bg-[#c9a030] transition-all cursor-pointer">
                                                <UserPlus className="w-4 h-4" />
                                                {isRTL ? 'سجل' : 'Register'}
                                            </div>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
