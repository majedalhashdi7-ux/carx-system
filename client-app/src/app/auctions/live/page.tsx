'use client';

/**
 * صفحة المزادات المباشرة — عرض جميع الجلسات النشطة والقادمة
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Radio, Calendar, ChevronLeft, ExternalLink, Gavel, Clock, Car } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function LiveAuctionsListPage() {
    const { isRTL } = useLanguage();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.liveAuctions.list();
                if (res.success) {
                    // عرض المزادات: المباشرة أولاً، ثم القادمة، ثم المنتهية
                    const sorted = (res.data || []).sort((a: any, b: any) => {
                        const order: Record<string, number> = { live: 0, upcoming: 1, ended: 2 };
                        return (order[a.status] ?? 1) - (order[b.status] ?? 1);
                    });
                    setSessions(sorted);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statusMap: Record<string, { labelAr: string; labelEn: string; color: string; dot: string; glow: string }> = {
        live:     { labelAr: '🔴 مباشر الآن', labelEn: '🔴 LIVE NOW',   color: 'bg-red-500/15 text-red-400 border-red-500/30',    dot: 'bg-red-400 animate-pulse', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]' },
        upcoming: { labelAr: '🕐 قادم قريباً', labelEn: '🕐 UPCOMING',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',  dot: 'bg-blue-400', glow: '' },
        ended:    { labelAr: '✓ منتهي',        labelEn: '✓ ENDED',      color: 'bg-white/5 text-white/30 border-white/10',          dot: 'bg-white/20', glow: '' },
    };

    return (
        <div className="min-h-screen bg-[#08080f] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Header */}
            <div className="pt-20 pb-6 px-4 border-b border-white/6 bg-gradient-to-b from-[#0e0e1a] to-[#08080f]">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">{isRTL ? 'المزادات المباشرة' : 'Live Auctions'}</h1>
                            <p className="text-xs text-white/30 font-bold tracking-widest">{isRTL ? 'تابع المزادات الحية وقدّم طلبك' : 'Follow live auctions and place your bid'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-48 rounded-3xl bg-white/3 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <Gavel className="w-16 h-16 text-white/10 mx-auto" />
                        <h2 className="text-xl font-black text-white/20">{isRTL ? 'لا توجد مزادات حالياً' : 'No Auctions Available'}</h2>
                        <p className="text-white/15 text-sm">{isRTL ? 'تابعنا على واتساب لمعرفة مواعيد المزادات القادمة' : 'Follow us on WhatsApp for upcoming auction schedules'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session: any, idx: number) => {
                            const st = statusMap[session.status] || statusMap['upcoming'];
                            const isLive = session.status === 'live';
                            const isEnded = session.status === 'ended';
                            const thumb = session.cars?.[0]?.images?.[0];

                            return (
                                <motion.div
                                    key={session._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.07 }}
                                    className={cn(
                                        'relative bg-[#0e0e18] border rounded-3xl overflow-hidden transition-all',
                                        isLive
                                            ? 'border-red-500/30 ' + st.glow
                                            : isEnded
                                                ? 'border-white/6 opacity-60'
                                                : 'border-white/10 hover:border-[#C9A96E]/30'
                                    )}
                                >
                                    {/* Live pulsing bar */}
                                    {isLive && (
                                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />
                                    )}

                                    <div className="flex flex-col sm:flex-row">
                                        {/* Thumbnail */}
                                        <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-[#0a0a12]">
                                            {thumb ? (
                                                <Image src={thumb} alt={session.title} fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Car className="w-12 h-12 text-white/10" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0e0e18]/80 to-transparent" />

                                            {/* Cars count badge */}
                                            {session.cars?.length > 0 && (
                                                <div className="absolute bottom-2 left-2 sm:bottom-auto sm:top-2 bg-black/70 backdrop-blur-sm border border-white/10 text-white/60 text-[9px] font-black px-2 py-1 rounded-lg">
                                                    {session.cars.length} {isRTL ? 'سيارة' : 'cars'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border mb-2', st.color)}>
                                                        <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
                                                        {isRTL ? st.labelAr : st.labelEn}
                                                    </span>
                                                    <h2 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-2">
                                                        {session.title}
                                                    </h2>
                                                </div>
                                            </div>

                                            {/* External URL */}
                                            {session.externalUrl && !isEnded && (
                                                <a
                                                    href={session.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-[10px] text-[#C9A96E]/60 hover:text-[#C9A96E] transition-colors"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {isRTL ? 'رابط المزاد الخارجي' : 'External Auction Link'}
                                                </a>
                                            )}

                                            {/* Action buttons */}
                                            <div className="flex items-center gap-2 mt-auto">
                                                {!isEnded && (
                                                    <Link
                                                        href={`/auctions/live/${session._id}`}
                                                        className={cn(
                                                            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black transition-all',
                                                            isLive
                                                                ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_4px_20px_rgba(239,68,68,0.35)]'
                                                                : 'bg-[#C9A96E] hover:bg-[#b8934d] text-black'
                                                        )}
                                                    >
                                                        <Radio className={cn('w-3.5 h-3.5', isLive && 'animate-pulse')} />
                                                        {isLive
                                                            ? (isRTL ? 'شاهد المزاد المباشر' : 'Watch Live')
                                                            : (isRTL ? 'عرض التفاصيل' : 'View Details')
                                                        }
                                                    </Link>
                                                )}
                                                {session.whatsappNumber && (
                                                    <a
                                                        href={`https://wa.me/${session.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(isRTL ? `أريد الاستفسار عن مزاد: ${session.title}` : `Inquiry about auction: ${session.title}`)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black text-white transition-all"
                                                        style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
                                                    >
                                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                        </svg>
                                                        {isRTL ? 'واتساب' : 'WhatsApp'}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
