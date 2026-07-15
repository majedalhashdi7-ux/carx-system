'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Gavel, AlertCircle, Radio, Car, Clock, Users,
    ChevronLeft, ChevronRight, MessageCircle, ExternalLink,
    TrendingUp, Zap, Trophy, Timer, ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

/* ── Tabs ── */
const TABS = [
    { id: 'LIVE', labelAr: 'مباشر الآن', labelEn: 'LIVE NOW', icon: Radio, color: '#ef4444' },
    { id: 'SHOWROOM', labelAr: 'قاعة العرض', labelEn: 'SHOWROOM', icon: Gavel, color: '#C9A96E' },
    { id: 'UPCOMING', labelAr: 'القادمة', labelEn: 'UPCOMING', icon: Clock, color: '#3b82f6' },
];

/* ── Countdown Hook ── */
function useCountdown(targetDate?: string) {
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

    useEffect(() => {
        if (!targetDate) return;
        const update = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft({ d, h, m, s, expired: false });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    return timeLeft;
}

/* ── Skeleton Card ── */
function AuctionSkeleton() {
    return (
        <div className="bg-[#111118] border border-white/6 rounded-2xl overflow-hidden flex flex-col sm:flex-row animate-pulse">
            <div className="sm:w-72 h-52 sm:h-auto bg-white/5 shrink-0" />
            <div className="flex-1 p-6 flex flex-col gap-4">
                <div className="space-y-2">
                    <div className="h-3 bg-white/5 rounded-lg w-24" />
                    <div className="h-7 bg-white/8 rounded-lg w-3/4" />
                </div>
                <div className="flex gap-6 border-y border-white/5 py-4">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="space-y-1">
                            <div className="h-2 bg-white/5 rounded w-16" />
                            <div className="h-5 bg-white/8 rounded w-20" />
                        </div>
                    ))}
                </div>
                <div className="h-10 bg-white/8 rounded-xl w-36" />
            </div>
        </div>
    );
}

/* ── Countdown Display ── */
function CountdownDisplay({ endsAt, isRTL }: { endsAt?: string; isRTL: boolean }) {
    const { d, h, m, s, expired } = useCountdown(endsAt);
    if (!endsAt) return null;
    if (expired) return (
        <span className="text-xs font-black text-red-400 uppercase tracking-wider">
            {isRTL ? 'انتهى' : 'ENDED'}
        </span>
    );
    return (
        <div className="flex items-center gap-1.5">
            {d > 0 && (
                <span className="flex flex-col items-center">
                    <span className="text-sm font-black text-white tabular-nums">{d}</span>
                    <span className="text-[8px] text-white/30 uppercase">{isRTL ? 'يوم' : 'd'}</span>
                </span>
            )}
            {[h, m, s].map((val, i) => (
                <span key={i} className="flex items-baseline gap-0.5">
                    {i > 0 && <span className="text-white/20 text-xs">:</span>}
                    <span className="flex flex-col items-center">
                        <span className={cn(
                            "text-sm font-black tabular-nums",
                            i === 2 && s < 10 ? "text-red-400" : "text-white"
                        )}>
                            {String(val).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] text-white/30 uppercase">
                            {isRTL
                                ? (['س', 'د', 'ث'][i])
                                : (['h', 'm', 's'][i])}
                        </span>
                    </span>
                </span>
            ))}
        </div>
    );
}

export default function AuctionsPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('LIVE');
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [totalLive, setTotalLive] = useState(0);

    const normalizeImage = (src?: string) => (typeof src === 'string' ? src.trim() : '');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'SHOWROOM') {
                const data = await api.liveAuctions.list();
                if (data.success) setAuctions(data.data || []);
            } else {
                const status = activeTab === 'LIVE' ? 'live' : 'upcoming';
                const data = await api.auctions.list({ status });
                if (data.success) {
                    setAuctions(data.data || []);
                    if (activeTab === 'LIVE') setTotalLive(data.data?.length || 0);
                }
            }
        } catch (err) {
            console.error("Failed to load auctions", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleJoin = (item: any) => {
        if (!isLoggedIn) { router.push('/login'); return; }
        if (activeTab === 'SHOWROOM') router.push(`/auctions/live/${item._id || item.id}`);
        else router.push(`/auctions/${item.id || item._id}`);
    };

    const activeTabData = TABS.find(t => t.id === activeTab);

    return (
        <div className={cn("min-h-screen bg-[#08080f] text-white", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── Hero Banner ── */}
            <div className="pt-16 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#08080f]" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Gold top line */}
                <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/60 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 py-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">

                        {/* Title */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">
                                        {totalLive > 0
                                            ? (isRTL ? `${totalLive} مزاد مباشر` : `${totalLive} LIVE AUCTION${totalLive > 1 ? 'S' : ''}`)
                                            : (isRTL ? 'منصة المزادات' : 'AUCTION PLATFORM')}
                                    </span>
                                </div>
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter uppercase text-white">
                                {isRTL ? 'المزادات' : 'AUCTIONS'}
                                <span className="block text-sm not-italic font-light tracking-[0.4em] text-white/25 mt-2">
                                    {isRTL ? 'مباشر · معرض · قادم' : 'LIVE · SHOWROOM · UPCOMING'}
                                </span>
                            </h1>
                        </div>

                        {/* Stats bar */}
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Trophy, label: isRTL ? 'مزادات ناجحة' : 'Successful Bids', value: '2,400+' },
                                { icon: Users, label: isRTL ? 'مزايدون نشطون' : 'Active Bidders', value: '890+' },
                                { icon: TrendingUp, label: isRTL ? 'أعلى مزايدة' : 'Top Bid', value: '480K SAR' },
                            ].map((stat, i) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={i} className="hidden sm:flex flex-col items-center gap-1 px-4 py-3 bg-white/3 border border-white/6 rounded-2xl">
                                        <Icon className="w-4 h-4 text-[#C9A96E]" />
                                        <div className="text-base font-black text-white">{stat.value}</div>
                                        <div className="text-[9px] text-white/30 uppercase tracking-wider text-center">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex mt-8 bg-[#0d0d1a] border border-white/8 rounded-2xl p-1.5 gap-1 w-full sm:w-fit">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300",
                                        isActive
                                            ? "text-black shadow-lg"
                                            : "text-white/30 hover:text-white/60 hover:bg-white/4"
                                    )}
                                    style={isActive ? { background: tab.color, boxShadow: `0 4px 20px ${tab.color}40` } : {}}>
                                    <Icon className={cn("w-3.5 h-3.5 shrink-0", tab.id === 'LIVE' && isActive && "animate-pulse")} />
                                    <span className="hidden sm:inline">{isRTL ? tab.labelAr : tab.labelEn}</span>
                                    <span className="sm:hidden">{isRTL ? tab.labelAr.split(' ')[0] : tab.labelEn.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-28 pt-8">

                {/* Loading Skeletons */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => <AuctionSkeleton key={n} />)}
                    </div>
                )}

                {/* Empty State */}
                {!loading && auctions.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-32 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto mb-6">
                            <Gavel className="w-10 h-10 text-white/15" />
                        </div>
                        <h2 className="text-xl font-black text-white/25 uppercase tracking-widest mb-2">
                            {isRTL ? "لا توجد جلسات حالياً" : "NO SESSIONS FOUND"}
                        </h2>
                        <p className="text-sm text-white/20">
                            {activeTab === 'LIVE'
                                ? (isRTL ? 'لا توجد مزادات مباشرة الآن. تحقق من الجلسات القادمة.' : 'No live auctions right now. Check upcoming sessions.')
                                : activeTab === 'UPCOMING'
                                    ? (isRTL ? 'لا توجد مزادات مجدولة حالياً.' : 'No scheduled auctions yet.')
                                    : (isRTL ? 'لا توجد جلسات عرض حالياً.' : 'No showroom sessions available.')}
                        </p>
                        {activeTab === 'LIVE' && (
                            <button
                                onClick={() => setActiveTab('UPCOMING')}
                                className="mt-6 flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl text-xs font-black text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-all"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                {isRTL ? 'عرض الجلسات القادمة' : 'View Upcoming Sessions'}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Auction Cards */}
                <AnimatePresence mode="popLayout">
                    {!loading && auctions.map((item, i) => {
                        const isShowroom = activeTab === 'SHOWROOM';
                        const isLive = item.status === 'live' || item.status === 'running';
                        const imgSrc = normalizeImage(
                            isShowroom
                                ? (item.cars?.[0]?.images?.[0] || '')
                                : (item.car?.images?.[0] || '')
                        );
                        const imgKey = `${item._id || item.id}-${i}`;
                        const hasImg = imgSrc && !imageErrors[imgKey];

                        return (
                            <motion.div key={item._id || item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                                transition={{ delay: i * 0.06, type: 'spring', damping: 22, stiffness: 280 }}
                                className="group mb-4 bg-[#111118] border border-white/6 rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-[#C9A96E]/25 hover:shadow-[0_8px_40px_rgba(201,169,110,0.07)] transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="sm:w-72 h-52 sm:h-auto relative bg-[#0a0a12] shrink-0 overflow-hidden">
                                    {hasImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imgSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            onError={() => setImageErrors(p => ({ ...p, [imgKey]: true }))} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="w-12 h-12 text-white/8" />
                                        </div>
                                    )}

                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-l from-[#111118]/80 via-transparent to-transparent" />

                                    {/* Status badge */}
                                    {isLive && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-lg px-2.5 py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">LIVE</span>
                                        </div>
                                    )}
                                    {item.status === 'upcoming' && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-blue-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-2.5 py-1">
                                            <Timer className="w-3 h-3 text-blue-400" />
                                            <span className="text-[9px] font-black text-blue-300 uppercase tracking-wider">
                                                {isRTL ? 'قادم' : 'SOON'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Car count for showroom */}
                                    {isShowroom && item.cars?.length > 0 && (
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1">
                                            <Car className="w-3 h-3 text-[#C9A96E]" />
                                            <span className="text-[9px] font-black text-white">{item.cars.length}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                    <div>
                                        {isShowroom ? (
                                            <>
                                                <div className="text-[10px] font-black text-[#C9A96E]/60 uppercase tracking-[0.35em] mb-1.5">
                                                    {isRTL ? 'قاعة عرض مباشر' : 'LIVE SHOWROOM'}
                                                </div>
                                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">
                                                    {item.title}
                                                </h2>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-white/30">
                                                    <span className="flex items-center gap-1.5">
                                                        <Car className="w-3.5 h-3.5" />
                                                        {item.cars?.length || 0} {isRTL ? 'سيارة' : 'cars'}
                                                    </span>
                                                    <span className={cn(
                                                        "flex items-center gap-1 font-black uppercase tracking-wider",
                                                        item.status === 'live' ? "text-red-400" : "text-[#C9A96E]/60"
                                                    )}>
                                                        {item.status === 'live' && <Zap className="w-3 h-3" />}
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[10px] font-black text-[#C9A96E]/60 uppercase tracking-[0.35em] mb-1.5">
                                                    {item.car?.make || item.car?.brand}
                                                </div>
                                                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white line-clamp-2">
                                                    {item.car?.title || item.title}
                                                </h2>
                                            </>
                                        )}
                                    </div>

                                    {/* Stats row */}
                                    {!isShowroom && (
                                        <div className="flex flex-wrap gap-6 border-y border-white/5 py-4">
                                            <div>
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
                                                    {isRTL ? 'المزايدة الحالية' : 'CURRENT BID'}
                                                </div>
                                                <div className="text-xl font-black text-[#C9A96E]">
                                                    {formatPrice(Number(item.currentBid || 0))}
                                                </div>
                                            </div>

                                            {/* Countdown */}
                                            <div>
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
                                                    {isRTL ? 'الوقت المتبقي' : 'TIME LEFT'}
                                                </div>
                                                <CountdownDisplay endsAt={item.endsAt} isRTL={isRTL} />
                                            </div>

                                            <div>
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
                                                    {isRTL ? 'المزايدون' : 'BIDDERS'}
                                                </div>
                                                <div className="text-sm font-black text-white/60 flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5" />{item.bidders || 0}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <button onClick={() => handleJoin(item)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A96E] hover:bg-[#b8934d] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_20px_rgba(201,169,110,0.25)] hover:shadow-[0_6px_30px_rgba(201,169,110,0.4)] hover:scale-[1.02] active:scale-95">
                                            <Gavel className="w-4 h-4" />
                                            {isShowroom
                                                ? (isRTL ? 'دخول قاعة العرض' : 'ENTER SHOWROOM')
                                                : (isRTL ? 'زايد الآن' : 'PLACE BID')}
                                        </button>

                                        {/* WhatsApp enquiry */}
                                        <a href="https://wa.me/821080880014" target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-3 bg-green-500/8 border border-green-500/15 rounded-xl text-xs font-bold text-green-400/70 hover:text-green-400 hover:border-green-500/30 transition-all">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            {isRTL ? 'استفسار' : 'Enquire'}
                                        </a>

                                        {item.externalUrl && (
                                            <a href={item.externalUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-3 bg-white/4 border border-white/8 rounded-xl text-xs font-bold text-white/40 hover:text-white transition-all">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                {isRTL ? 'رابط' : 'Link'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Browse all link */}
                {!loading && auctions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 text-center"
                    >
                        <button
                            onClick={() => setActiveTab(activeTab === 'LIVE' ? 'UPCOMING' : 'LIVE')}
                            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-[#C9A96E] transition-colors font-bold"
                        >
                            {isRTL ? 'عرض' : 'Switch to'}
                            {' '}{activeTab === 'LIVE'
                                ? (isRTL ? 'الجلسات القادمة' : 'Upcoming Sessions')
                                : (isRTL ? 'المباشر' : 'Live')}
                            <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                        </button>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
