'use client';

import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { 
  Car, Gavel, Wrench, User, LogIn, UserPlus, Globe, 
  MessageCircle, HelpCircle, Menu, X, Play, Pause, Volume2, VolumeX,
  ArrowRight, Star, Zap, Shield, Award, Instagram, Facebook, Youtube
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useTenant } from "@/lib/TenantContext";
import { api, mockData } from "@/lib/api";
import AuthModals from "./AuthModals";

// بطاقة القسم المحسنة للأداء
const SectionCard = memo(({ section, index, isRTL }: { section: any; index: number; isRTL: boolean }) => {
    const Icon = section.icon;
    
    return (
        <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: index * 0.2 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group"
        >
            <Link href={section.href}>
                <div className={`relative overflow-hidden h-80 rounded-3xl bg-gradient-to-br ${section.color} ${section.hoverColor} p-8 cursor-pointer transition-all duration-500 border border-white/10 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20`}>
                    
                    {/* تأثير الإضاءة */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* الأيقونة */}
                    <div className="absolute top-8 end-8 w-16 h-16 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-red-600/30 group-hover:border-red-400/50 transition-all duration-500 group-hover:scale-110">
                        <Icon className="w-8 h-8 text-white group-hover:text-red-300 transition-colors duration-300" />
                    </div>

                    {/* خط متوهج */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

                    {/* المحتوى */}
                    <div className="relative z-10 h-full flex flex-col justify-end">
                        <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-red-100 transition-colors duration-300">
                            {section.title}
                        </h3>
                        <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                            {section.desc}
                        </p>
                        
                        {/* سهم الانتقال */}
                        <div className="mt-6 flex items-center gap-2 text-red-400 group-hover:text-red-300 transition-colors duration-300">
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {isRTL ? 'استكشف' : 'Explore'}
                            </span>
                            <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

// ميزة محسنة للأداء
const FeatureItem = memo(({ feature, index, isRTL }: { feature: any; index: number; isRTL: boolean }) => (
    <motion.div
        key={index}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 }}
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
));

// أيقونة اجتماعية محسنة
const SocialLink = memo(({ icon: Icon, href, color, isRTL, index }: { icon: any; href: string; color: string; isRTL: boolean; index: number }) => (
    <motion.a
        key={index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
        animate={{ 
            opacity: 1, 
            x: 0,
            y: [0, -5, 0]
        }}
        transition={{ 
            delay: index * 0.1,
            y: {
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut"
            }
        }}
        whileHover={{ 
            scale: 1.2,
            rotate: 5,
            boxShadow: "0 0 25px rgba(255,0,0,0.5)"
        }}
        className={`w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center ${color} transition-all duration-300 hover:bg-white/10`}
    >
        <Icon className="w-5 h-5" />
    </motion.a>
));

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

    // جلب بيانات السيارات للشريط الإعلاني
    useEffect(() => {
        const cars = mockData.cars;
        if (cars && Array.isArray(cars) && cars.length > 0) {
            const labels = cars.map((c: any) => {
                const make = (isRTL && c.makeAr) ? c.makeAr : c.make;
                const model = (isRTL && c.modelAr) ? c.modelAr : c.model;
                const priceStr = c.price ? ` (${c.price.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'})` : '';
                return `${make} ${model} ${c.year}${priceStr}`;
            });
            setMarqueeItems(labels);
        }
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
        },
        {
            title: isRTL ? 'قطع الغيار' : 'Spare Parts',
            desc: isRTL ? 'قطع غيار أصلية محلية وقطع مستوردة' : 'Genuine local & imported spare parts',
            icon: Wrench,
            href: '/parts',
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
            
            {/* ── Header ثابت مع الاسم وأزرار التسجيل ── */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-red-600/20">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    
                    {/* الشعار والاسم */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-wider">
                            {tenant?.name || 'CAR X'}
                        </h1>
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
                    <SocialLink
                        key={idx}
                        icon={social.icon}
                        href={social.href}
                        color={social.color}
                        isRTL={isRTL}
                        index={idx}
                    />
                ))}
            </div>

            {/* ── فيديو الخلفية مع تحكم ── */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* خلفية بديلة متدرجة */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
                    style={{ 
                        backgroundImage: 'url(/images/hero-bg.svg)',
                        zIndex: 0
                    }} 
                />

                {/* الفيديو */}
                <video
                    autoPlay
                    loop
                    muted={videoMuted}
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-10"
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onError={(e) => {
                        // إخفاء الفيديو عند الخطأ وإظهار الخلفية البديلة
                        e.currentTarget.style.display = 'none';
                    }}
                >
                    <source src="/videos/CAR_X.mp4" type="video/mp4" />
                </video>

                {/* طبقة التعتيم */}
                <div className="absolute inset-0 bg-black/60 z-20" />

                {/* جسيمات متحركة */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-red-400 rounded-full opacity-60"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [-20, -100],
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                            }}
                        />
                    ))}
                </div>

                {/* أزرار التحكم في الفيديو */}
                <div className="absolute bottom-8 right-8 flex gap-3 z-30">
                    <button
                        onClick={() => {
                            const video = document.querySelector('video');
                            if (video) {
                                if (videoPlaying) {
                                    video.pause();
                                } else {
                                    video.play();
                                }
                            }
                        }}
                        className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        {videoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => setVideoMuted(!videoMuted)}
                        className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        {videoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>

                {/* المحتوى الرئيسي */}
                <div className="relative z-30 text-center px-4 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <motion.h1 
                            className="text-6xl md:text-8xl font-black text-white mb-6 tracking-wider drop-shadow-2xl"
                            animate={{
                                textShadow: [
                                    "0 0 20px rgba(255,0,0,0.5)",
                                    "0 0 40px rgba(255,0,0,0.8)",
                                    "0 0 20px rgba(255,0,0,0.5)"
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {tenant?.name || 'CAR X'}
                        </motion.h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 font-light">
                            {isRTL ? tenant?.description || 'منصة السيارات المتقدمة' : tenant?.descriptionEn || 'Advanced Car Platform'}
                        </p>
                        
                        {/* أزرار الإجراءات */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            {!isLoggedIn && (
                                <motion.button
                                    onClick={() => setShowRegisterModal(true)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all shadow-2xl hover:shadow-red-500/25"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    {isRTL ? 'إنشاء حساب جديد' : 'Create New Account'}
                                </motion.button>
                            )}
                            <Link href="/showroom">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all"
                                >
                                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                    {isRTL ? 'استكشف المعرض' : 'Explore Showroom'}
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── الشريط الإعلاني تحت الفيديو ── */}
            <section className="relative z-10 py-4 bg-gradient-to-r from-red-900/20 via-black to-red-900/20 border-y border-red-900/20">
                <div className="overflow-hidden">
                    <motion.div 
                        className="flex whitespace-nowrap"
                        animate={{
                            x: [0, -1920]
                        }}
                        transition={{
                            duration: 40,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {repeatedItems.map((text, i) => (
                            <span key={i} className="inline-flex items-center gap-4 mx-6 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-sm font-bold text-white/80 tracking-wide">
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

                    {/* بطاقات الأقسام المحدثة */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {mainSections.map((section, idx) => (
                            <SectionCard
                                key={idx}
                                section={section}
                                index={idx}
                                isRTL={isRTL}
                            />
                        ))}
                    </div>
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
                            <FeatureItem
                                key={idx}
                                feature={feature}
                                index={idx}
                                isRTL={isRTL}
                            />
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
