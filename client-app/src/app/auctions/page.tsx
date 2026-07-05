'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Gavel, AlertCircle, Radio, Car, Clock, Users,
    ChevronLeft, ChevronRight, MessageCircle, ExternalLink
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
    { id: 'LIVE', labelAr: 'مباشر الآن', labelEn: 'LIVE', icon: Radio },
    { id: 'SHOWROOM', labelAr: 'قاعة العرض', labelEn: 'SHOWROOM', icon: Gavel },
    { id: 'UPCOMING', labelAr: 'القادمة', labelEn: 'UPCOMING', icon: Clock },
];

export default function AuctionsPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('LIVE');
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const normalizeImage = (src?: string) => (typeof src === 'string' ? src.trim() : '');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'SHOWROOM') {
                    const data = await api.liveAuctions.list();
                    if (data.success) setAuctions(data.data || []);
                } else {
                    const status = activeTab === 'LIVE' ? 'live' : 'upcoming';
                    const data = await api.auctions.list({ status });
                    if (data.success) setAuctions(data.data || []);
                }
            } catch (err) {
                console.error("Failed to load auctions", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab]);

    const handleJoin = (item: any) => {
        if (!isLoggedIn) { router.push('/login'); return; }
        if (activeTab === 'SHOWROOM') router.push(`/auctions/live/${item._id || item.id}`);
        else router.push(`/auctions/${item.id || item._id}`);
    };

    return (
        <div className={cn("min-h-screen bg-[#08080f] text-white", isRTL && "font-arabic")} dir="rtl">
            <Navbar />

            {/* ── Page Header ── */}
            <div className="pt-20">
                <div className="h-1.5 bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-60" />
                <div className="bg-gradient-to-b from-[#0e0e1a] to-[#08080f] py-8 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-white">
                                {isRTL ? 'المزادات' : 'AUCTIONS'}
                                <span className="block text-sm not-italic font-light tracking-[0.4em] text-white/25 mt-1">
                                    Live · Showroom · Upcoming
                                </span>
                            </h1>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-[#111118] border border-white/8 rounded-2xl p-1.5 gap-1">
                            {TABS.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                                            isActive
                                                ? "bg-[#C9A96E] text-black shadow-[0_0_16px_rgba(201,169,110,0.3)]"
                                                : "text-white/30 hover:text-white/60"
                                        )}>
                                        <Icon className={cn("w-3.5 h-3.5", tab.id === 'LIVE' && isActive && "animate-pulse")} />
                                        {isRTL ? tab.labelAr : tab.labelEn}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-28 pt-8">

                {/* Loading */}
                {loading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-56 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                )}

                {/* Empty */}
                {!loading && auctions.length === 0 && (
                    <div className="py-28 text-center border border-dashed border-white/8 rounded-2xl">
                        <Gavel className="w-14 h-14 text-white/8 mx-auto mb-4" />
                        <h2 className="text-lg font-black text-white/25 uppercase tracking-widest">
                            {isRTL ? "لا توجد جلسات حالياً" : "NO SESSIONS FOUND"}
                        </h2>
                    </div>
                )}

                {/* Auction Cards */}
                <AnimatePresence mode="popLayout">
                    {!loading && auctions.map((item, i) => {
                        const isShowroom = activeTab === 'SHOWROOM';
                        const imgSrc = normalizeImage(
                            isShowroom
                                ? (item.cars?.[0]?.images?.[0] || '')
                                : (item.car?.images?.[0] || '')
                        );
                        const imgKey = `${item._id || item.id}-${i}`;
                        const hasImg = imgSrc && !imageErrors[imgKey];

                        return (
                            <motion.div key={item._id || item.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ delay: i * 0.06 }}
                                className="group mb-4 bg-[#111118] border border-white/6 rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-[#C9A96E]/25 hover:shadow-[0_8px_32px_rgba(201,169,110,0.06)] transition-all duration-300"
                            >
                                {/* Image */}
                                <div className="sm:w-72 h-52 sm:h-auto relative bg-[#0a0a12] shrink-0 overflow-hidden">
                                    {hasImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imgSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={() => setImageErrors(p => ({ ...p, [imgKey]: true }))} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="w-12 h-12 text-white/8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-l from-[#111118]/80 to-transparent" />

                                    {/* Status badge */}
                                    {(item.status === 'live' || item.status === 'running') && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-lg px-2.5 py-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">LIVE</span>
                                        </div>
                                    )}
                                    {item.status === 'upcoming' && (
                                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg px-2.5 py-1">
                                            <Clock className="w-3 h-3 text-blue-400" />
                                            <span className="text-[9px] font-black text-blue-300 uppercase">قادم</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                                    <div>
                                        {isShowroom ? (
                                            <>
                                                <div className="text-[10px] font-black text-[#C9A96E]/60 uppercase tracking-widest mb-1">
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
                                                        "font-black uppercase tracking-wider",
                                                        item.status === 'live' ? "text-red-400" : "text-white/30"
                                                    )}>{item.status}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-[10px] font-black text-[#C9A96E]/60 uppercase tracking-widest mb-1">
                                                    {item.car?.make}
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
                                            <div>
                                                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
                                                    {isRTL ? 'تنتهي في' : 'ENDS'}
                                                </div>
                                                <div className="text-sm font-black text-white/60">
                                                    {item.endsAt ? new Date(item.endsAt).toLocaleDateString('ar-SA') : '—'}
                                                </div>
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
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleJoin(item)}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A96E] hover:bg-[#b8934d] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_20px_rgba(201,169,110,0.2)]">
                                            <Gavel className="w-4 h-4" />
                                            {isShowroom
                                                ? (isRTL ? 'دخول قاعة العرض' : 'ENTER SHOWROOM')
                                                : (isRTL ? 'زايد الآن' : 'PLACE BID')}
                                        </button>
                                        {item.externalUrl && (
                                            <a href={item.externalUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-3 bg-white/4 border border-white/8 rounded-xl text-xs font-bold text-white/40 hover:text-white transition-all">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                {isRTL ? 'رابط خارجي' : 'Link'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </main>
        </div>
    );
}
