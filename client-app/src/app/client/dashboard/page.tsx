'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Car,
    Gavel,
    ShoppingBag,
    Heart,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Clock,
    Bell,
    User,
    Compass,
    ShieldCheck,
    ChevronRight,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { api } from "@/lib/api-original";
import Link from "next/link";
import Image from "next/image";

const rawText = (value: string) => value;

interface SavedAlert {
    q?: string;
    brand?: string;
    priceRange?: string;
    yearMin?: string;
    yearMax?: string;
    fuelType?: string;
    colorFilter?: string;
    savedAt?: string;
}

export default function ClientDashboard() {
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { user, isLoading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState<{
        stats?: {
            availableCars: number;
            liveAuctions: number;
            myOrders: number;
            myFavorites: number;
        };
        recentCars?: { id?: string; title: string; image?: string; img?: string; price?: number }[];
        auctions?: { id?: string; label: string; endsIn: string }[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [savedAlerts, setSavedAlerts] = useState<SavedAlert[]>([]);

    const userName = user?.name || (isRTL ? 'العميل' : 'Guest');
    const userEmail = user?.email || '';
    const hour = new Date().getHours();
    const greeting = isRTL
        ? (hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور')
        : (hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await api.dashboard.getClientData();
                if (data.success) setDashboardData(data.data);
            } catch (err) {
                console.error("Failed to load dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) loadDashboard();

        // Load saved smart alerts from localStorage
        try {
            const alerts = JSON.parse(localStorage.getItem('hm_smart_alerts') || '[]');
            setSavedAlerts(alerts);
        } catch { }
    }, [authLoading]);

    const stats = dashboardData?.stats || {
        availableCars: 0,
        liveAuctions: 0,
        myOrders: 0,
        myFavorites: 0,
    };

    const statCards = [
        { label: isRTL ? 'سيارات متاحة' : 'Available Cars', value: stats.availableCars, icon: Car, color: '#D4AF37', href: '/cars' },
        { label: isRTL ? 'مزادات مباشرة' : 'Live Auctions', value: stats.liveAuctions, icon: Gavel, color: '#ef4444', href: '/auctions' },
        { label: isRTL ? 'طلباتي' : 'My Orders', value: stats.myOrders, icon: ShoppingBag, color: '#3b82f6', href: '/orders' },
        { label: isRTL ? 'المفضلة' : 'Favorites', value: stats.myFavorites, icon: Heart, color: '#ec4899', href: '/favorites' },
    ];

    const quickActions = [
        {
            icon: Compass,
            label: isRTL ? 'تصفح السيارات كوري' : 'Browse Korean Cars',
            desc: isRTL ? 'أحدث الواردات المتاحة للطلب' : 'Latest available vehicles',
            href: '/cars',
            color: '#D4AF37',
        },
        {
            icon: Sparkles,
            label: isRTL ? 'تنبيهاتي الذكية' : 'Smart Alerts',
            desc: isRTL ? 'تتبع السيارات والمزادات المفضلة' : 'Track your filters and alerts',
            href: '/client/smart-alerts',
            color: '#a78bfa',
        },
        {
            icon: User,
            label: isRTL ? 'الملف الشخصي' : 'My Profile',
            desc: isRTL ? 'تعديل البيانات ومعلومات الشحن' : 'Update profile & contact info',
            href: '/client/profile',
            color: '#10b981',
        }
    ];

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full"
                />
            </div>
        );
    }

    return (
        <div className={cn("min-h-full pb-12", isRTL && "rtl")} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* ── Welcome Premium Hero Card ── */}
            <div className="px-4 lg:px-8 pt-6">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 lg:p-8"
                    style={{ background: 'linear-gradient(135deg, #0d0d1e 0%, #15152a 100%)' }}>
                    
                    {/* Background gold glow accent */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-luxury-gold/10 text-[10px] font-black text-luxury-gold tracking-widest uppercase">
                                    {isRTL ? 'عضوية مميزة VIP' : 'VIP MEMBER'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-white/50">
                                    <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold" />
                                    <span>{isRTL ? 'حساب موثق' : 'Verified Account'}</span>
                                </div>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white italic">
                                {greeting}، <span className="text-luxury-gold">{userName}</span>
                            </h1>
                            <p className="text-xs text-white/50 max-w-md">
                                {isRTL 
                                    ? 'مرحباً بك في لوحة تحكم HM CAR. يمكنك من هنا متابعة طلبات الاستيراد، وإدارة تنبيهات البحث، ومتابعة آخر المزادات الكورية المباشرة.'
                                    : 'Welcome to your HM CAR dashboard. Manage import orders, customize search alerts, and check real-time auctions.'
                                }
                            </p>
                        </div>

                        {/* Quick user profile overview */}
                        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold font-black text-lg">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white">{userName}</div>
                                <div className="text-[10px] text-white/40">{userEmail}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="px-4 lg:px-8 mt-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={stat.href}>
                                    <div className="relative p-5 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 hover:border-luxury-gold/30 transition-all group overflow-hidden">
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            style={{ background: `radial-gradient(circle at top right, ${stat.color}08 0%, transparent 60%)` }} />
                                        
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-luxury-gold/10 transition-colors">
                                                <Icon className="w-5 h-5 text-white/60 group-hover:text-luxury-gold transition-colors" />
                                            </div>
                                            <span className="text-[10px] font-bold text-luxury-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isRTL ? 'عرض' : 'View'} →
                                            </span>
                                        </div>
                                        <div className="text-3xl font-black text-white leading-none mb-1">
                                            {stat.value}
                                        </div>
                                        <div className="text-xs font-bold text-white/40">{stat.label}</div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Main Dashboard Split Area ── */}
            <div className="px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns (Quick Actions & Alerts) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Quick Actions Panel */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">
                            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {quickActions.map((action, i) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={i} href={action.href}>
                                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-luxury-gold/20 transition-all group cursor-pointer h-full flex flex-col justify-between">
                                            <div>
                                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 mb-3 group-hover:scale-105 transition-transform duration-300">
                                                    <Icon className="w-4.5 h-4.5 text-white/70" />
                                                </div>
                                                <h3 className="text-xs font-black text-white mb-1">{action.label}</h3>
                                                <p className="text-[10px] text-white/40 leading-relaxed">{action.desc}</p>
                                            </div>
                                            <div className="pt-4 text-[9px] font-black text-luxury-gold flex items-center gap-1">
                                                {isRTL ? 'ابدأ الآن' : 'Start now'} →
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Smart Alerts Overview */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/30">
                                {isRTL ? 'التنبيهات النشطة المحفوظة' : 'Active Saved Alerts'}
                            </h2>
                            <Link href="/client/smart-alerts" className="text-[10px] font-bold text-luxury-gold hover:text-white transition-colors">
                                {isRTL ? 'إدارة التنبيهات' : 'Manage Alerts'}
                            </Link>
                        </div>

                        {savedAlerts.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/10">
                                <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                <p className="text-xs font-bold text-white/40">{isRTL ? 'لا توجد تنبيهات ذكية حالياً' : 'No active smart alerts'}</p>
                                <p className="text-[10px] text-white/25 mt-1">
                                    {isRTL ? 'يمكنك تفعيل تنبيه عند بحثك عن سيارات في صفحة السيارات.' : 'Save searches to receive automated notifications.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedAlerts.slice(0, 3).map((alert, i) => (
                                    <div key={i} className="p-3.5 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <span className="text-xs font-black text-white">
                                                    {alert.brand || (isRTL ? 'كل الوكالات' : 'All Brands')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] text-white/40 font-bold">
                                                {alert.q && <span>{isRTL ? 'بحث:' : 'Query:'} "{alert.q}"</span>}
                                                {alert.fuelType && <span>{alert.fuelType}</span>}
                                                {alert.yearMin && <span>{alert.yearMin} - {alert.yearMax || '2026'}</span>}
                                                {alert.priceRange && <span>{alert.priceRange}</span>}
                                            </div>
                                        </div>
                                        <Link href={`/cars?brand=${alert.brand || ''}&price=${alert.priceRange || ''}&q=${alert.q || ''}`}>
                                            <button className="px-3 py-1.5 rounded-lg bg-luxury-gold text-black text-[10px] font-black uppercase tracking-wider">
                                                {isRTL ? 'البحث الآن' : 'Run Search'}
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Recommended / Live Auctions) */}
                <div className="space-y-6">
                    
                    {/* Live Auctions Panel */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/30">
                                {isRTL ? 'المزادات المباشرة' : 'Live Auctions'}
                            </h2>
                        </div>

                        {dashboardData?.auctions && dashboardData.auctions.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.auctions.map((auc, i) => (
                                    <div key={i} className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-white">{auc.label}</div>
                                            <div className="text-[10px] text-white/40 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-red-400" />
                                                <span>{isRTL ? 'ينتهي في:' : 'Ends in:'} {auc.endsIn}</span>
                                            </div>
                                        </div>
                                        <Link href="/auctions">
                                            <span className="text-[10px] font-black text-red-400 hover:underline">
                                                {isRTL ? 'دخول' : 'Enter'} →
                                            </span>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-black/10 border border-white/5 rounded-xl">
                                <Gavel className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                <p className="text-xs font-bold text-white/40">{isRTL ? 'لا توجد مزادات نشطة' : 'No active auctions'}</p>
                            </div>
                        )}
                    </div>

                    {/* Curated Recommendations */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-4">
                            {isRTL ? 'سيارات مقترحة لك' : 'Recommended Cars'}
                        </h2>

                        {dashboardData?.recentCars && dashboardData.recentCars.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardData.recentCars.slice(0, 2).map((car, i) => (
                                    <Link key={car.id || i} href={`/cars/${car.id || ''}`}>
                                        <div className="group flex gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-luxury-gold/20 transition-all cursor-pointer">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                                <Image
                                                    src={car.image || car.img || '/images/placeholder.jpg'}
                                                    alt={car.title}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                                                <h3 className="text-xs font-bold text-white truncate group-hover:text-luxury-gold transition-colors">
                                                    {car.title}
                                                </h3>
                                                <div className="text-[11px] font-black text-luxury-gold">
                                                    {formatPrice ? formatPrice(Number(car.price || 0)) : `${Number(car.price || 0).toLocaleString()} SAR`}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-black/10 border border-white/5 rounded-xl">
                                <Car className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                <p className="text-xs font-bold text-white/40">{isRTL ? 'تصفح المعرض للمقترحات' : 'Browse gallery for recommendations'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
