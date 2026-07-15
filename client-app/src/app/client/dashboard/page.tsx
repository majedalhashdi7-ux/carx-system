'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Car,
    Gavel,
    ShoppingBag,
    Heart,
    Sparkles,
    ArrowRight,
    Clock,
    Bell,
    User,
    Compass,
    ShieldCheck,
    TrendingUp,
    CheckCircle2,
    Calendar,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { api } from "@/lib/api-original";
import Link from "next/link";
import Image from "next/image";

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

// ── Skeleton Loader للمظهر الفاخر ──
function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6 lg:p-8 animate-pulse">
            <div className="h-40 rounded-3xl bg-white/5 border border-white/10" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 rounded-2xl bg-white/3 border border-white/5" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 rounded-2xl bg-white/3 border border-white/5" />
                <div className="h-96 rounded-2xl bg-white/3 border border-white/5" />
            </div>
        </div>
    );
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
        recentOrders?: { id?: string; carTitle: string; status: string; date: string }[];
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
                if (data.success) {
                    setDashboardData(data.data);
                }
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
        { label: isRTL ? 'التنبيهات المحفوظة' : 'Saved Alerts', value: savedAlerts.length, icon: Sparkles, color: '#a78bfa', href: '/client/smart-alerts' },
    ];

    const quickActions = [
        {
            icon: Compass,
            label: isRTL ? 'تصفح السيارات' : 'Browse Cars',
            desc: isRTL ? 'أحدث السيارات المتاحة' : 'Latest vehicles',
            href: '/cars',
            color: '#D4AF37',
        },
        {
            icon: Gavel,
            label: isRTL ? 'المزادات' : 'Live Auctions',
            desc: isRTL ? 'مزادات مباشرة وحية' : 'Join live auctions',
            href: '/auctions',
            color: '#ef4444',
        },
        {
            icon: ShoppingBag,
            label: isRTL ? 'قطع الغيار' : 'Spare Parts',
            desc: isRTL ? 'قطع غيار كورية أصلية' : 'Korean spare parts',
            href: '/parts',
            color: '#f59e0b',
        },
        {
            icon: Sparkles,
            label: isRTL ? 'طلب استيراد' : 'Import Request',
            desc: isRTL ? 'اطلب استيراد سيارة خاصة' : 'Custom Korean import',
            href: '/concierge',
            color: '#a78bfa',
        },
    ];

    // مراحل طلب الاستيراد كدليل بصري مميز للعميل
    const mockOrderSteps = [
        { label: isRTL ? 'الطلب' : 'Request', status: 'completed' },
        { label: isRTL ? 'الفحص بكوريا' : 'Inspection', status: 'completed' },
        { label: isRTL ? 'الشحن البحري' : 'Shipping', status: 'active' },
        { label: isRTL ? 'التخليص والوصول' : 'Delivery', status: 'pending' },
    ];

    if (authLoading || loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className={cn("min-h-full pb-16 text-white", isRTL && "rtl")} dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* ── Premium Welcome Hero ── */}
            <div className="px-4 lg:px-8 pt-6">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 p-6 lg:p-8 bg-gradient-to-br from-[#0d0d1e] to-[#15152a]">
                    
                    {/* Gold glow accent */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-luxury-gold/15 text-[10px] font-black text-luxury-gold tracking-widest uppercase">
                                    {isRTL ? 'عضوية مميزة VIP' : 'VIP MEMBER'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-white/50">
                                    <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold" />
                                    <span>{isRTL ? 'حساب نشط' : 'Active Account'}</span>
                                </div>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white italic">
                                {greeting}، <span className="text-luxury-gold">{userName}</span>
                            </h1>
                            <p className="text-xs text-white/60 max-w-md leading-relaxed">
                                {isRTL 
                                    ? 'مرحباً بك في لوحة تحكم HM CAR. تتبع طلبات الاستيراد الخاصة بك، وأدر تنبيهات البحث الذكي واستكشف السيارات المتاحة فوراً.'
                                    : 'Welcome to your HM CAR dashboard. Track your import orders, manage smart alerts, and search for your next vehicle.'
                                }
                            </p>
                        </div>

                        {/* User profile capsule */}
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

            {/* ── Stats Row ── */}
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
                                        
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-[#D4AF37]/10 transition-colors">
                                                <Icon className="w-4.5 h-4.5 text-white/60 group-hover:text-[#D4AF37] transition-colors" />
                                            </div>
                                            <span className="text-[10px] font-bold text-luxury-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isRTL ? 'تصفح' : 'Go'} →
                                            </span>
                                        </div>
                                        <div className="text-2xl font-black text-white leading-none mb-1">
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

            {/* ── Main Layout Split ── */}
            <div className="px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Section: Progress, Actions, Alerts */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Live Order Progress (Visual Import Stepper) */}
                    {stats.myOrders > 0 && (
                        <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
                                    {isRTL ? 'حالة شحن طلب الاستيراد الحالي' : 'Active Import Shipping Status'}
                                </h2>
                                <span className="text-[10px] font-bold text-luxury-gold flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {isRTL ? 'تحديث: منذ ساعتين' : 'Updated: 2h ago'}
                                </span>
                            </div>
                            
                            {/* Stepper display */}
                            <div className="grid grid-cols-4 gap-2 relative pt-2">
                                <div className="absolute top-5 left-1/8 right-1/8 h-0.5 bg-white/10 -z-10" />
                                {mockOrderSteps.map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all",
                                            step.status === 'completed' && "bg-[#D4AF37] border-[#D4AF37] text-black",
                                            step.status === 'active' && "bg-black border-[#D4AF37] text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)] animate-pulse",
                                            step.status === 'pending' && "bg-white/5 border-white/10 text-white/30"
                                        )}>
                                            {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black",
                                            step.status === 'completed' && "text-white/80",
                                            step.status === 'active' && "text-luxury-gold",
                                            step.status === 'pending' && "text-white/20"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Panel */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {quickActions.map((action, i) => {
                                const Icon = action.icon;
                                return (
                                    <Link key={i} href={action.href}>
                                        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-luxury-gold/20 transition-all group cursor-pointer flex flex-col justify-between h-full">
                                            <div>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 mb-3 group-hover:scale-105 transition-transform duration-300">
                                                    <Icon className="w-4 h-4 text-white/70" />
                                                </div>
                                                <h3 className="text-xs font-black text-white mb-1">{action.label}</h3>
                                                <p className="text-[10px] text-white/40 leading-relaxed">{action.desc}</p>
                                            </div>
                                            <div className="pt-4 text-[9px] font-black text-luxury-gold flex items-center gap-0.5">
                                                {isRTL ? 'دخول' : 'Go'} <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Saved Alerts */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
                                {isRTL ? 'التنبيهات الذكية النشطة' : 'Active Smart Alerts'}
                            </h2>
                            <Link href="/client/smart-alerts" className="text-[10px] font-bold text-luxury-gold hover:text-white transition-colors">
                                {isRTL ? 'تعديل التنبيهات' : 'Manage Alerts'}
                            </Link>
                        </div>

                        {savedAlerts.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-white/10 rounded-xl bg-black/10">
                                <Sparkles className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                <p className="text-xs font-bold text-white/40">{isRTL ? 'لا توجد تنبيهات ذكية نشطة' : 'No active smart alerts'}</p>
                                <p className="text-[10px] text-white/20 mt-1">
                                    {isRTL ? 'احفظ نتائج بحث الفلتر لتلقي إشعارات السيارات الجديدة المتطابقة.' : 'Save filter searches to get instant matches.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedAlerts.slice(0, 3).map((alert, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <span className="text-xs font-black text-white">
                                                    {alert.brand || (isRTL ? 'كل الماركات' : 'All Brands')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[10px] text-white/40 font-bold">
                                                {alert.q && <span>{isRTL ? 'كلمة البحث:' : 'Keyword:'} "{alert.q}"</span>}
                                                {alert.fuelType && <span>{alert.fuelType}</span>}
                                                {alert.priceRange && <span>{alert.priceRange}</span>}
                                            </div>
                                        </div>
                                        <Link href={`/cars?brand=${alert.brand || ''}&price=${alert.priceRange || ''}&q=${alert.q || ''}`}>
                                            <button className="px-3 py-1.5 rounded-lg bg-luxury-gold text-black text-[10px] font-black uppercase tracking-wider">
                                                {isRTL ? 'ابحث الآن' : 'Run Search'}
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Live Auctions, Recommended Cars, Activity Timeline */}
                <div className="space-y-6">
                    
                    {/* Live Auctions Panel */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">
                                {isRTL ? 'المزادات المباشرة الحالية' : 'Live Auctions'}
                            </h2>
                        </div>

                        {dashboardData?.auctions && dashboardData.auctions.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.auctions.slice(0, 3).map((auc, i) => (
                                    <div key={i} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-bold text-white truncate max-w-[130px]">{auc.label}</div>
                                            <div className="text-[10px] text-white/40 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-red-400" />
                                                <span>{auc.endsIn}</span>
                                            </div>
                                        </div>
                                        <Link href="/auctions">
                                            <span className="text-[10px] font-black text-red-400 hover:underline">
                                                {isRTL ? 'دخول' : 'Join'} →
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
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                            {isRTL ? 'مقترحات مخصصة لك' : 'Recommended Cars'}
                        </h2>

                        {dashboardData?.recentCars && dashboardData.recentCars.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.recentCars.slice(0, 2).map((car, i) => (
                                    <Link key={car.id || i} href={`/cars/${car.id || ''}`}>
                                        <div className="group flex gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/25 transition-all cursor-pointer">
                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/5 shrink-0">
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
                                <p className="text-xs font-bold text-white/40">{isRTL ? 'تصفح السيارات للحصول على مقترحات' : 'Browse to get recommendations'}</p>
                            </div>
                        )}
                    </div>

                    {/* Timeline Activity Feed */}
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-5">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">
                            {isRTL ? 'سجل الأنشطة الأخيرة' : 'Activity History'}
                        </h2>
                        <div className="space-y-4">
                            {[
                                { title: isRTL ? 'تسجيل دخول ناجح' : 'Successful Login', desc: isRTL ? 'من جهاز جوال' : 'From mobile device', time: isRTL ? 'الآن' : 'Just now' },
                                { title: isRTL ? 'تحديث المفضلة' : 'Favorites Updated', desc: isRTL ? 'أضفت سيارة Hyundai Palisade' : 'Added Hyundai Palisade', time: isRTL ? 'أمس' : 'Yesterday' }
                            ].map((act, i) => (
                                <div key={i} className="flex gap-3 text-xs">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-1" />
                                        {i === 0 && <div className="w-0.5 h-8 bg-white/10" />}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="font-bold text-white">{act.title}</div>
                                        <div className="text-[10px] text-white/40">{act.desc}</div>
                                        <div className="text-[9px] text-[#D4AF37] mt-0.5">{act.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
