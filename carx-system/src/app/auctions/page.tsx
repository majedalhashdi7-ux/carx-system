'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio, Car, Clock, ChevronLeft,
  AlertTriangle, Loader2, Sparkles, RefreshCw, Gavel, Eye
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { api } from "../../lib/api";
import Link from "next/link";

// ── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(endTime: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('انتهى'); setIsExpired(true); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        h > 0
          ? `${h}س ${String(m).padStart(2, '0')}د ${String(s).padStart(2, '0')}ث`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return { timeLeft, isExpired };
}

// ── Session Card ────────────────────────────────────────────────────────────
function SessionCard({ item, idx }: { item: any; idx: number }) {
  const isLive = item.status === 'live';
  const isUpcoming = item.status === 'upcoming' || item.status === 'scheduled';
  const endTime = item.endTime || item.endsAt;
  const { timeLeft, isExpired } = useCountdown(isLive ? endTime : undefined);

  const statusLabel = isLive ? 'مباشر الآن' : isUpcoming ? 'قادم قريباً' : 'منتهي';
  const statusCls = isLive
    ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
    : isUpcoming
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-white/5 text-white/30 border-white/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-luxury-gold/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group"
    >
      {/* Info */}
      <div className="flex-1 space-y-4 text-right">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${statusCls}`}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
            {statusLabel}
          </span>

          <span className="text-xs text-white/40 font-mono font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-luxury-gold/60" />
            {item.startTime ? new Date(item.startTime).toLocaleString('ar-SA') : 'قريباً'}
          </span>

          {/* Countdown (live only) */}
          {isLive && timeLeft && (
            <span className={`text-xs font-black font-mono flex items-center gap-1 ${isExpired ? 'text-red-400' : 'text-luxury-gold'}`}>
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">
            {item.title}
          </h2>
          <p className="text-xs text-white/40 leading-relaxed max-w-xl">
            تصفح السيارات المتاحة للمزايدة في المزاد والتقييمات المتاحة لها.
          </p>
        </div>

        <div className="flex items-center gap-5 text-xs font-bold text-white/30 flex-wrap">
          <span className="flex items-center gap-1">
            <Car className="w-4 h-4 text-luxury-gold" />
            {item.cars?.length || 0} سيارة متوفرة
          </span>
          {item.highestBid && (
            <span className="flex items-center gap-1 text-luxury-gold/70">
              <Gavel className="w-4 h-4" />
              أعلى مزايدة: {Number(item.highestBid).toLocaleString('ar-SA')} ر.س
            </span>
          )}
          {typeof item.totalBids === 'number' && (
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-white/20" />
              {item.totalBids} مزايدة
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
        <Link
          href={`/auctions/live/${item._id || item.id}`}
          className="w-full md:w-auto px-6 py-4 bg-luxury-gold text-black hover:bg-white transition-all rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
        >
          <span>دخول المزاد المباشر</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AuctionsListPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAuctions = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.liveAuctions.list();
      const raw = res.data as any;

      if (raw?.success && Array.isArray(raw?.data)) {
        setSessions(raw.data);
      } else if (Array.isArray(raw)) {
        setSessions(raw);
      } else if (raw?.data && Array.isArray(raw.data)) {
        setSessions(raw.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch auctions:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + Smart Polling every 4 seconds
  useEffect(() => {
    fetchAuctions(false);
    pollingRef.current = setInterval(() => fetchAuctions(true), 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchAuctions]);

  const liveSessions  = sessions.filter(s => s.status === 'live');
  const otherSessions = sessions.filter(s => s.status !== 'live');

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between selection:bg-luxury-gold selection:text-black" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-10">

        {/* Header */}
        <div className="text-right space-y-4">
          <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-luxury-gold" />
            <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">فرص شراء حصرية</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            المزادات <span className="text-luxury-gold">المباشرة والحيّة</span>
          </h1>
          <p className="text-white/40 text-sm md:text-base font-medium max-w-2xl">
            انضم إلى جلسات المزاد المباشر، وتصفح قائمة السيارات المستوردة من أرقى دور المزاد العالمية وقدم عروضك مباشرة.
          </p>
          {lastUpdated && (
            <p className="text-[10px] text-white/20 font-mono flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-luxury-gold/40" style={{ animation: 'spin 3s linear infinite' }} />
              تحديث تلقائي كل 4 ثوانٍ • آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
            </p>
          )}
        </div>

        {/* Live badge */}
        {!loading && liveSessions.length > 0 && (
          <div>
            <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black px-4 py-2 rounded-full animate-pulse">
              <Radio className="w-4 h-4" />
              {liveSessions.length} مزاد مباشر الآن
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
            <p className="text-white/40 text-sm font-bold">جاري تحميل جلسات المزاد المتاحة...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel p-16 text-center border border-white/5 rounded-3xl space-y-4">
            <AlertTriangle className="w-12 h-12 text-white/10 mx-auto" />
            <h3 className="text-xl font-black text-white/40">لا توجد مزادات نشطة حالياً</h3>
            <p className="text-xs text-white/30 max-w-md mx-auto leading-relaxed">
              يرجى التحقق لاحقاً أو متابعة حساباتنا لمعرفة مواعيد انطلاق جلسات المزاد المباشر القادمة.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {liveSessions.length > 0 && (
              <div className="space-y-4">
                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> مباشر الآن
                </p>
                <AnimatePresence>
                  <div className="grid grid-cols-1 gap-4">
                    {liveSessions.map((item, idx) => (
                      <SessionCard key={item._id || idx} item={item} idx={idx} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}

            {otherSessions.length > 0 && (
              <div className="space-y-4">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> جلسات أخرى
                </p>
                <AnimatePresence>
                  <div className="grid grid-cols-1 gap-4">
                    {otherSessions.map((item, idx) => (
                      <SessionCard key={item._id || idx} item={item} idx={liveSessions.length + idx} />
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
