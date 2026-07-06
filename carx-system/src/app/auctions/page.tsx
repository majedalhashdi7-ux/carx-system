'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Radio, Car, Clock, ChevronLeft, 
  AlertTriangle, Loader2, Sparkles
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { api } from "../../lib/api";
import Link from "next/link";

export default function AuctionsListPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const res = await api.liveAuctions.list();
        if (res.data?.success) {
          setSessions(res.data.data);
        } else if (res.data) {
          setSessions(res.data as any);
        }
      } catch (err) {
        console.error("Failed to fetch auctions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuctions();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between selection:bg-luxury-gold selection:text-black" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-10">
        {/* Page Header */}
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
        </div>

        {/* Live sessions container */}
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
          <div className="grid grid-cols-1 gap-6">
            {sessions.map((item, idx) => (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-luxury-gold/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group"
              >
                <div className="flex-1 space-y-4 text-right">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                      item.status === 'live'
                        ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {item.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
                      {item.status === 'live' ? 'مباشر الآن' : 'جلسة منتهية'}
                    </span>
                    <span className="text-xs text-white/40 font-mono font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-luxury-gold/60" />
                      {item.startTime ? new Date(item.startTime).toLocaleString('ar-SA') : 'قريباً'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-xs text-white/40 leading-relaxed max-w-xl">
                      تصفح السيارات المتاحة للمزايدة في المزاد والتقييمات المتاحة لها.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-white/30">
                    <span className="flex items-center gap-1">
                      <Car className="w-4 h-4 text-luxury-gold" />
                      {item.cars?.length || 0} سيارات متوفرة
                    </span>
                  </div>
                </div>

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
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
