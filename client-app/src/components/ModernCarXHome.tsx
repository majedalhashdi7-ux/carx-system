'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Car, Gavel, Wrench, User, LogIn, UserPlus, Globe, 
  MessageCircle, Instagram, Facebook, Youtube, 
  HelpCircle, Menu, X, Play, Pause, Volume2, VolumeX,
  ArrowRight, Shield, Zap, Award
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { api } from "@/lib/api-original";
import { cn } from "@/lib/utils";
import AuthModals from "./AuthModals";

const PARTICLES = Array.from({ length: 15 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
}));

export default function ModernCarXHome() {
    const { isRTL, toggleLanguage } = useLanguage();
    const { user, isLoggedIn } = useAuth();
    const { tenant } = useTenant();
    const [marqueeItems, setMarqueeItems] = useState<string[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [videoPlaying, setVideoPlaying] = useState(true);
    const [videoMuted, setVideoMuted] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // تتبع حركة الفأرة للتأثيرات البصرية الفاخرة
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        setMousePosition({ x: clientX, y: clientY });
    };

    // جلب بيانات السيارات للشريط الإعلاني
    useEffect(() => {
        api.cars.list({ limit: 12, status: 'available' })
            .then(res => {
                const cars = res?.data || res?.cars;
                if (cars && Array.isArray(cars) && cars.length > 0) {
                    const labels = cars.map((c: any) => {
                        const make = (isRTL && c.makeAr) ? c.makeAr : c.make;
                        const model = (isRTL && c.modelAr) ? c.modelAr : c.model;
                        const priceStr = c.price ? ` (${c.price.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'})` : '';
                        return `${make} ${model} ${c.year}${priceStr}`;
                    });
                    setMarqueeItems(labels);
                }
            }).catch(() => {});
    }, [isRTL]);

    const displayItems = marqueeItems.length > 0 
        ? marqueeItems 
        : [isRTL ? 'CAR X — المعرض · المزاد · قطع الغيار' : 'CAR X — SHOWROOM · AUCTIONS · PARTS'];
    
    const repeatedItems = Array(20).fill(0).map((_, i) => displayItems[i % displayItems.length]);

    // الأقسام الرئيسية
    const mainSections = [
        {
            title: isRTL ? 'المعارض' : 'Showrooms',
            desc: isRTL ? 'معرض CAR X المحلي ومعرض السيارات المستوردة' : 'Local CAR X & Imported Car Showrooms',
            icon: Car,
            href: '/showroom',
            color: 'from-red-600 to-red-800',
            hoverColor: 'hover:from-red-500 hover:to-red-700',
        },
        {
            title: isRTL ? 'المزادات المباشرة' : 'Live Auctions',
            desc: isRTL ? 'مزادات حصرية داخلية أو استيراد مزادات عالمية' : 'Exclusive auctions or import global auction links',
            icon: Gavel,
            href: '/auctions',
            color: 'from-gray-700 to-gray-900',
            hoverColor: 'hover:from-gray-600 hover:to-gray-800',
        }
    ];

    // روابط التواصل الاجتماعي
    const socialLinks = [
        { icon: Instagram, href: '#', color: 'text-pink-400 hover:text-pink-300' },
        { icon: Facebook, href: '#', color: 'text-blue-400 hover:text-blue-300' },
        { icon: Youtube, href: '#', color: 'text-red-400 hover:text-red-300' },
        { icon: MessageCircle, href: `https://wa.me/${tenant?.contact?.whatsapp?.replace(/\D/g, '')}`, color: 'text-green-400 hover:text-green-300' },
    ];

    return (
        <main className="relative min-h-screen overflow-x-hidden bg-black text-white" dir={isRTL ? "rtl" : "ltr"}>
            
            {/* ── التنقل العلوي (Luxury Header) ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    
                    {/* الشعار والاسم بتأثير زجاجي متوهج */}
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <motion.div 
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.8 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-black flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:shadow-red-600/60 transition-all"
                        >
                            <Car className="w-7 h-7 text-white" />
                        </motion.div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-white tracking-[0.2em] uppercase group-hover:text-red-500 transition-colors">
                                {tenant?.name?.split(' ')[0] || 'CAR'} <span className="text-red-600 group-hover:text-white transition-colors">{tenant?.name?.split(' ')[1] || 'X'}</span>
                            </h1>
                            <div className="h-0.5 w-0 group-hover:w-full bg-red-600 transition-all duration-500" />
                        </div>
                    </div>

                    {/* أزرار التسجيل والدخول - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* زر اللغة */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-sm font-bold">{isRTL ? 'EN' : 'عربي'}</span>
                        </button>

                        {/* خدمة العملاء */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all">
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-sm font-bold">{isRTL ? 'خدمة العملاء' : 'Support'}</span>
                        </button>

                        {!isLoggedIn ? (
                            <>
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span className="text-sm font-bold">{isRTL ? 'تسجيل الدخول' : 'Login'}</span>
                                </button>
                                <button
                                    onClick={() => setShowRegisterModal(true)}
                                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    <span className="text-sm font-bold">{isRTL ? 'حساب جديد' : 'Sign Up'}</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-bold">{user?.name}</span>
                            </div>
                        )}
                    </div>

                    {/* زر القائمة - Mobile */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
                    >
                        {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* القائمة المنسدلة - Mobile */}
                <AnimatePresence>
                    {showMobileMenu && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-black/95 border-t border-red-600/20 px-4 py-6"
                        >
                            <div className="space-y-4">
                                <button
                                    onClick={toggleLanguage}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10"
                                >
                                    <Globe className="w-5 h-5" />
                                    <span>{isRTL ? 'English' : 'عربي'}</span>
                                </button>
                                
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10">
                                    <HelpCircle className="w-5 h-5" />
                                    <span>{isRTL ? 'خدمة العملاء' : 'Support'}</span>
                                </button>

                                {!isLoggedIn ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowLoginModal(true);
                                                setShowMobileMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20"
                                        >
                                            <LogIn className="w-5 h-5" />
                                            <span>{isRTL ? 'تسجيل الدخول' : 'Login'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowRegisterModal(true);
                                                setShowMobileMenu(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            <span>{isRTL ? 'حساب جديد' : 'Sign Up'}</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span>{user?.name}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ── أيقونات التواصل الاجتماعي الثابتة ── */}
            <div className={`fixed top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 ${isRTL ? 'right-4' : 'left-4'}`}>
                {socialLinks.map((social, idx) => (
                    <motion.a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        animate={{ 
                            opacity: 1, 
                            x: 0,
                            y: [0, -5, 0]
                        }}
                        transition={{ 
                            delay: idx * 0.1,
                            y: {
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.3,
                                ease: "easeInOut"
                            }
                        }}
                        whileHover={{ 
                            scale: 1.2,
                            rotate: 5,
                            boxShadow: "0 0 25px rgba(255,0,0,0.5)"
                        }}
                        className={`w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center ${social.color} transition-all duration-300 hover:bg-white/10`}
                    >
                        <social.icon className="w-5 h-5" />
                    </motion.a>
                ))}
            </div>

            {/* ── فيديو الخلفية مع تحكم وتأثير عمق ── */}
            <section 
                className="relative h-[110vh] flex items-center justify-center overflow-hidden"
                onMouseMove={handleMouseMove}
            >
                {/* تأثير الإضاءة الملاحقة (Spotlight) */}
                <div 
                    className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-1000"
                    style={{
                        background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(220, 38, 38, 0.05), transparent 80%)`
                    }}
                />

                {/* الفيديو بتأثير Parallax */}
                <motion.div 
                    className="absolute inset-0 w-full h-[120%]"
                    style={{ y: -50 }}
                >
                    <video
                        autoPlay
                        loop
                        muted={videoMuted}
                        playsInline
                        className="w-full h-full object-cover scale-110"
                        onPlay={() => setVideoPlaying(true)}
                        onPause={() => setVideoPlaying(false)}
                    >
                        <source src="/videos/CAR_X.mp4" type="video/mp4" />
                    </video>
                </motion.div>

                {/* طبقة التعتيم بتأثير نسيج الكربون (Carbon Fiber Texture) */}
                <div className="absolute inset-0 bg-black/60 backdrop-brightness-50" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

                {/* جسيمات متحركة */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {PARTICLES.map((p, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-red-500 rounded-full opacity-40"
                            style={{ left: `${p.left}%`, top: `${p.top}%` }}
                            animate={{ 
                                y: [-20, -150], 
                                opacity: [0, 0.8, 0], 
                                x: [0, Math.random() * 50 - 25] 
                            }}
                            transition={{ duration: p.duration + 2, repeat: Infinity, delay: p.delay }}
                        />
                    ))}
                </div>

                {/* أزرار التحكم في الفيديو */}
                <div className="absolute bottom-20 right-12 flex gap-4 z-40">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
                        onClick={() => {
                            const video = document.querySelector('video');
                            if (video) { if (videoPlaying) { video.pause(); } else { video.play(); } }
                        }}
                        className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all shadow-xl"
                    >
                        {videoPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
                        onClick={() => setVideoMuted(!videoMuted)}
                        className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all shadow-xl"
                    >
                        {videoMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </motion.button>
                </div>

                {/* المحتوى الرئيسي بتصميم ثلاثي الأبعاد */}
                <div className="relative z-20 text-center px-4 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{ perspective: 1000 }}
                    >
                        <motion.div
                            animate={{ 
                                y: [0, -15, 0],
                                rotate: [0, 0.5, 0]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <h1 
                                className="text-7xl md:text-[10rem] font-black text-white mb-4 tracking-[-0.05em] leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                                style={{
                                    textShadow: "0 0 30px rgba(220,38,38,0.2)"
                                }}
                            >
                                {tenant?.name?.split(' ')[0] || 'CAR'}<span className="text-red-600 italic">X</span>
                            </h1>
                        </motion.div>
                        
                        <p className="text-xl md:text-3xl text-white/60 mb-12 font-medium tracking-[0.4em] uppercase">
                            {isRTL ? tenant?.description || 'فخامة بلا حدود' : tenant?.descriptionEn || 'UNLIMITED LUXURY'}
                        </p>
                        
                        {/* أزرار الإجراءات الفخمة */}
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            {!isLoggedIn && (
                                <motion.button
                                    onClick={() => setShowRegisterModal(true)}
                                    whileHover={{ 
                                        scale: 1.05,
                                        boxShadow: "0 0 50px rgba(220,38,38,0.5)"
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-5 bg-red-600 hover:bg-red-500 rounded-full font-black text-sm tracking-[0.2em] uppercase flex items-center gap-4 transition-all shadow-2xl relative overflow-hidden group/btn"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                    <UserPlus className="w-5 h-5" />
                                    {isRTL ? 'ابدأ تجربتك الفاخرة' : 'START YOUR LUXURY JOURNEY'}
                                </motion.button>
                            )}
                            <Link href="/showroom">
                                <motion.button 
                                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-12 py-5 bg-white/5 backdrop-blur-2xl border border-white/10 hover:border-red-500/50 rounded-full font-black text-sm tracking-[0.2em] uppercase flex items-center gap-4 transition-all"
                                >
                                    {isRTL ? 'استكشف الأسطول' : 'EXPLORE THE FLEET'}
                                    <ArrowRight className={`w-5 h-5 group-hover:translate-x-2 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-2' : ''}`} />
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* تأثير توهج سفلي */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent z-10" />
            </section>

            {/* ── الشريط الإعلاني تحت الفيديو ── */}
            <section className="relative z-10 py-8 bg-gradient-to-r from-red-900/20 via-black to-red-900/20 border-y border-red-900/20">
                <div className="overflow-hidden">
                    <motion.div 
                        className="flex animate-marquee whitespace-nowrap"
                        animate={{
                            x: [0, -50]
                        }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {repeatedItems.map((text, i) => (
                            <span key={i} className="inline-flex items-center gap-6 mx-8 shrink-0">
                                <motion.span 
                                    className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(255,0,0,1)]"
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.7, 1, 0.7]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.1
                                    }}
                                />
                                <span className="text-lg font-black text-white/90 tracking-wider uppercase">
                                    {text}
                                </span>
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── الأقسام الرئيسية ── */}
            <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black">
                <div className="max-w-7xl mx-auto">
                    
                    {/* عنوان القسم */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider mb-4">
                            {isRTL ? 'اختر قسمك' : 'Choose Your Section'}
                        </h2>
                        <p className="text-white/60 text-lg">
                            {isRTL ? 'كل ما تحتاجه في مكان واحد' : 'Everything you need in one place'}
                        </p>
                    </motion.div>

                    {/* بطاقات الأقسام المحدثة بتأثير 3D Spotlight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                        {mainSections.map((section, idx) => {
                            const Icon = section.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 60 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, delay: idx * 0.2 }}
                                    className="relative group h-[500px]"
                                >
                                    <Link href={section.href} className="block h-full">
                                        <motion.div 
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const x = e.clientX - rect.left;
                                                const y = e.clientY - rect.top;
                                                e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                                                e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                                            }}
                                            whileHover={{ 
                                                rotateY: isRTL ? -12 : 12,
                                                rotateX: 8,
                                                scale: 1.05
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className={cn(
                                                "relative h-full overflow-hidden rounded-[3.5rem] p-12 flex flex-col justify-between transition-all duration-500 border border-white/5 group-hover:border-red-600/50 shadow-2xl",
                                                "bg-gradient-to-br from-white/[0.05] via-transparent to-black"
                                            )}
                                            style={{ transformStyle: 'preserve-3d' }}
                                        >
                                            {/* تأثير الإضاءة المتوهجة الديناميكي (Follows Mouse) */}
                                            <div 
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                style={{
                                                    background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(220, 38, 38, 0.2), transparent 40%)`
                                                }}
                                            />

                                            {/* محتوى البطاقة بتأثير عمق */}
                                            <div style={{ transform: 'translateZ(50px)' }} className="relative z-10">
                                                <div className="w-20 h-20 rounded-[2rem] bg-red-600/10 border border-red-600/20 flex items-center justify-center mb-8 group-hover:bg-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all duration-500">
                                                    <Icon className="w-10 h-10 text-red-500 group-hover:text-white transition-colors" />
                                                </div>
                                                <h3 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">
                                                    {section.title}
                                                </h3>
                                                <p className="text-white/40 text-lg leading-relaxed group-hover:text-white/80 transition-colors">
                                                    {section.desc}
                                                </p>
                                            </div>

                                            {/* زر الانتقال السفلي */}
                                            <div style={{ transform: 'translateZ(30px)' }} className="relative z-10 flex items-center justify-between mt-auto">
                                                <div className="flex -space-x-4">
                                                    {[1,2,3].map(i => (
                                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-[10px] font-bold text-white/40 group-hover:text-red-400 group-hover:border-red-900/50 transition-all">
                                                            {i}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-500">
                                                    <ArrowRight className={cn("w-6 h-6 text-white transition-transform group-hover:translate-x-1", isRTL && "rotate-180 group-hover:-translate-x-1")} />
                                                </div>
                                            </div>

                                            {/* خلفية تزيينية (رقم القسم) */}
                                            <span className="absolute -bottom-10 -right-10 text-[15rem] font-black text-white/[0.02] pointer-events-none group-hover:text-red-600/[0.05] transition-colors">
                                                0{idx + 1}
                                            </span>
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── قسم التميز (Exclusive Spotlight) - إبداعي وغير تقليدي ── */}
            <section className="relative z-10 py-32 bg-black overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
                
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-8 italic leading-tight uppercase">
                            {isRTL ? 'نحن لا نبيع السيارات، نحن نصنع التجارب' : 'WE DON\'T SELL CARS, WE CREATE EXPERIENCES'}
                        </h2>
                        <div className="space-y-6 text-white/50 text-xl leading-relaxed max-w-xl">
                            <p>
                                {isRTL ? 'في CAR X، نتجاوز الحدود التقليدية لخدمات السيارات. نقدم لك بوابة حصرية لأفخم الموديلات وأفضل قطع الغيار مع تجربة رقمية لا تضاهى.' : 'At CAR X, we go beyond traditional car services. We provide you with an exclusive gateway to the most luxurious models and the best spare parts with an unmatched digital experience.'}
                            </p>
                            <motion.div 
                                className="flex items-center gap-4 text-red-500 font-black tracking-widest uppercase text-sm"
                                whileHover={{ x: 10 }}
                            >
                                <div className="w-12 h-[1px] bg-red-600" />
                                {isRTL ? 'استكشف الفلسفة' : 'DISCOVER THE PHILOSOPHY'}
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] rounded-[4rem] overflow-hidden border border-white/10 group"
                    >
                        <motion.img 
                            src="/images/hmcar.jpg" 
                            alt="Luxury Car" 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-12 left-12 right-12">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="px-4 py-1 rounded-full bg-red-600 text-white text-[10px] font-black tracking-widest uppercase">
                                    {isRTL ? 'حصري' : 'EXCLUSIVE'}
                                </div>
                                <div className="h-[1px] flex-1 bg-white/20" />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2 uppercase">Luxe Horizon 2026</h3>
                            <p className="text-white/60 uppercase tracking-[0.2em] text-xs">Limited Edition / Global Access</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── قسم المميزات ── */}
            <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-wider mb-4">
                            {isRTL ? 'لماذا CAR X؟' : 'Why CAR X?'}
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: isRTL ? 'موثوقية تامة' : 'Complete Trust',
                                desc: isRTL ? 'فحص شامل لجميع السيارات' : 'Comprehensive inspection of all vehicles'
                            },
                            {
                                icon: Zap,
                                title: isRTL ? 'سرعة في الخدمة' : 'Fast Service',
                                desc: isRTL ? 'معاملات سريعة وآمنة' : 'Quick and secure transactions'
                            },
                            {
                                icon: Award,
                                title: isRTL ? 'جودة عالية' : 'High Quality',
                                desc: isRTL ? 'أفضل السيارات وقطع الغيار' : 'Best cars and spare parts'
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                whileHover={{ 
                                    y: -10,
                                    scale: 1.05,
                                    boxShadow: "0 20px 40px rgba(255,0,0,0.1)"
                                }}
                                className="text-center p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-red-500/30 transition-all duration-500 hover:bg-white/10 group"
                            >
                                <motion.div 
                                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <feature.icon className="w-8 h-8 text-white" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-100 transition-colors">{feature.title}</h3>
                                <p className="text-white/60 group-hover:text-white/80 transition-colors">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 py-12 bg-black border-t border-red-900/20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-white/40 text-sm">
                        © 2026 {tenant?.name || 'CAR X'}. {isRTL ? 'جميع الحقوق محفوظة.' : 'All Rights Reserved.'}
                    </p>
                </div>
            </footer>

            {/* ── CSS للحركات ── */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>

            {/* ── Auth Modals ── */}
            <AuthModals
                showLoginModal={showLoginModal}
                showRegisterModal={showRegisterModal}
                onCloseLogin={() => setShowLoginModal(false)}
                onCloseRegister={() => setShowRegisterModal(false)}
                onSwitchToRegister={() => setShowRegisterModal(true)}
                onSwitchToLogin={() => setShowLoginModal(true)}
            />
        </main>
    );
}