'use client';

/**
 * صفحة نظام الاستيراد الرئيسية - HMCAR v2
 * مُحسَّنة مع: إحصائيات حية، أسعار الصرف، متابعة Queue، بطاقات محسّنة
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Car, Wrench, Radio, RefreshCw, ArrowLeft, ChevronLeft, Shield, Zap, Edit2,
  TrendingUp, DollarSign, Activity, Clock, CheckCircle, AlertCircle,
  Pause, Play, RotateCcw, Package, BarChart2, Globe, Database
} from 'lucide-react';
import { SyncToolsPanel } from '../../../components/admin/ImportSystem';
import { api } from '../../../lib/api';

// ─── أنواع البيانات ───────────────────────────────────────────────────────
interface CurrencyRates {
  USD_TO_SAR: number;
  USD_TO_KRW: number;
  USD_TO_AED: number;
  source: string;
  updatedAt: string | null;
}

interface QueueStatus {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  percent: number;
  isPaused: boolean;
  isIdle: boolean;
}

// ─── مكوّن بطاقة إحصائية ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-${color}/20 transition-all`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-${color}/10 flex items-center justify-center shrink-0`}>
          <Icon className={`w-4 h-4 text-${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</p>
          <p className="text-lg font-black text-white leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminImportPage() {
  const [showSync, setShowSync] = useState(false);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [queue, setQueue] = useState<QueueStatus | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ─── جلب أسعار الصرف ────────────────────────────────────────────────────
  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/v2/import/currency-rates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) setRates(data.rates);
    } catch {}
    setRatesLoading(false);
  }, []);

  // ─── تحديث أسعار الصرف ──────────────────────────────────────────────────
  const refreshRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch('/api/v2/import/currency-rates/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) setRates(data.rates);
    } catch {}
    setRatesLoading(false);
  }, []);

  // ─── جلب حالة Queue ──────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/import/queue-status', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch {}
  }, []);

  // ─── جلب سجل الاستيراد ──────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/v2/import/logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      const data = await res.json();
      if (data.success) setLogs((data.logs || []).slice(0, 5));
    } catch {}
    setLogsLoading(false);
  }, []);

  // ─── تحكم Queue ──────────────────────────────────────────────────────────
  const controlQueue = useCallback(async (action: 'pause' | 'resume' | 'reset') => {
    try {
      const res = await fetch('/api/v2/import/queue-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) setQueue(data.queue);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRates();
    fetchLogs();
    fetchQueue();
    // تحديث القائمة كل 10 ثوانٍ
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [fetchRates, fetchLogs, fetchQueue]);

  // ─── بطاقات الاستيراد ────────────────────────────────────────────────────
  const importCards = [
    {
      href: '/admin/import/cars',
      icon: Car,
      iconBg: 'bg-luxury-gold',
      iconColor: 'text-black',
      borderColor: 'border-luxury-gold/20',
      hoverBorder: 'hover:border-luxury-gold/50',
      glowColor: 'shadow-luxury-gold/10',
      title: 'استيراد السيارات',
      subtitle: 'سيارة واحدة من رابط مزاد أو معرض',
      badge: 'Copart · IAAI · Encar',
      badgeColor: 'bg-luxury-gold/10 text-luxury-gold',
      features: [
        { icon: Zap, text: 'استخراج فوري للبيانات والصور بجودة 1200px' },
        { icon: Edit2, text: 'تعديل كامل بعد الحفظ مباشرة' },
        { icon: Shield, text: 'كشف تلقائي للسيارات المكررة (Fingerprint)' },
      ],
    },
    {
      href: '/admin/import/parts',
      icon: Wrench,
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      borderColor: 'border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50',
      glowColor: 'shadow-blue-500/10',
      title: 'استيراد قطع الغيار',
      subtitle: 'قطعة غيار من موقع متخصص أو مورد',
      badge: 'PartsGeek · RockAuto · AutoZone',
      badgeColor: 'bg-blue-500/10 text-blue-400',
      features: [
        { icon: Zap, text: 'استخراج رقم القطعة والفئة' },
        { icon: Edit2, text: 'تعديل السعر والكمية قبل الحفظ' },
        { icon: Shield, text: 'توجيه مباشر لصفحة التعديل' },
      ],
    },
    {
      href: '/admin/live-auctions',
      icon: Radio,
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      borderColor: 'border-red-500/20',
      hoverBorder: 'hover:border-red-500/50',
      glowColor: 'shadow-red-500/10',
      title: 'استيراد المزاد المباشر',
      subtitle: 'استيراد سيارات من جلسات المزاد المباشر',
      badge: 'Live Auction · Auto-Sync',
      badgeColor: 'bg-red-500/10 text-red-400',
      features: [
        { icon: Radio, text: 'إنشاء جلسة مزاد وربطها برابط' },
        { icon: RefreshCw, text: 'تحديث تلقائي كل 24 ساعة' },
        { icon: Zap, text: 'استيراد فوري عبر الضغط على الزر' },
      ],
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">

      {/* رأس الصفحة */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-5"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          لوحة القيادة
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          نظام الاستيراد <span className="text-luxury-gold">الذكي</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm font-medium">
          استيراد سيارات كورية · قطع غيار · مزادات — مع ترجمة تلقائية وأسعار صرف حية
        </p>
      </div>

      {/* ─── لوحة أسعار الصرف الحية ─────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-black text-white">أسعار الصرف المباشرة</p>
            {rates?.source && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-bold uppercase">
                {rates.source === 'env_fallback' ? 'احتياطي' : 'مباشر'}
              </span>
            )}
          </div>
          <button
            onClick={refreshRates}
            disabled={ratesLoading}
            className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ratesLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {rates ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-center">
              <p className="text-[10px] text-white/30 font-bold mb-1">USD → SAR</p>
              <p className="text-xl font-black text-luxury-gold">{rates.USD_TO_SAR?.toFixed(4)}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-center">
              <p className="text-[10px] text-white/30 font-bold mb-1">USD → KRW</p>
              <p className="text-xl font-black text-blue-400">{Math.round(rates.USD_TO_KRW)?.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04] text-center">
              <p className="text-[10px] text-white/30 font-bold mb-1">USD → AED</p>
              <p className="text-xl font-black text-purple-400">{rates.USD_TO_AED?.toFixed(4)}</p>
            </div>
          </div>
        ) : (
          <div className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />
        )}
        {rates?.updatedAt && (
          <p className="text-[10px] text-white/20 mt-2 font-medium">
            آخر تحديث: {new Date(rates.updatedAt).toLocaleString('ar-SA')}
          </p>
        )}
      </div>

      {/* ─── Queue Monitor (يظهر فقط إذا كان هناك عمل) ────────────────────── */}
      <AnimatePresence>
        {queue && !queue.isIdle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white/[0.02] border border-blue-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                <p className="text-sm font-black text-white">استيراد جماعي نشط</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${
                  queue.isPaused ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {queue.isPaused ? 'موقوف مؤقتاً' : 'جارٍ...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {queue.isPaused ? (
                  <button onClick={() => controlQueue('resume')} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => controlQueue('pause')} className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all">
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => controlQueue('reset')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* شريط التقدم */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-white/40 font-bold mb-1.5">
                <span>{queue.completed} مكتمل · {queue.failed} فشل · {queue.active} جارٍ</span>
                <span>{queue.percent}%</span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-luxury-gold rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${queue.percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'إجمالي', value: queue.total, color: 'text-white' },
                { label: 'قيد الانتظار', value: queue.pending, color: 'text-white/40' },
                { label: 'ناجح', value: queue.completed, color: 'text-green-400' },
                { label: 'فشل', value: queue.failed, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-2 rounded-xl bg-black/30">
                  <p className="text-[10px] text-white/30 font-bold">{label}</p>
                  <p className={`text-lg font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── بطاقات الاستيراد الرئيسية ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {importCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={card.href}
                className={`group block p-6 bg-white/[0.02] border ${card.borderColor} ${card.hoverBorder} rounded-3xl transition-all duration-300 hover:bg-white/[0.04] hover:shadow-xl ${card.glowColor} space-y-5`}
              >
                {/* أيقونة + عنوان */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white group-hover:text-white transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-white/40 text-xs mt-1 font-medium leading-relaxed">
                      {card.subtitle}
                    </p>
                    <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                </div>

                {/* الميزات */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  {card.features.map((feat, fi) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div key={fi} className="flex items-center gap-2.5">
                        <FeatIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                        <span className="text-xs text-white/40 font-medium">{feat.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* سهم الانتقال */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-black text-white/20 uppercase tracking-widest group-hover:text-white/60 transition-colors">
                    فتح الصفحة
                  </span>
                  <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:-translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* ─── استيراد جماعي سريع (Bulk) ──────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-4 h-4 text-purple-400" />
          <p className="text-sm font-black text-white">استيراد جماعي (Bulk Import)</p>
          <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-lg font-bold">NEW</span>
        </div>
        <p className="text-xs text-white/30 font-medium mb-4">
          استيراد 50-500 سيارة كورية دفعة واحدة من Encar بالتوازي — يعمل في الخلفية
        </p>
        <BulkImportWidget onStart={() => fetchQueue()} />
      </div>

      {/* ─── سجل آخر عمليات الاستيراد ───────────────────────────────────────── */}
      {logs.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-white/40" />
            <p className="text-sm font-black text-white">آخر عمليات الاستيراد</p>
          </div>
          <div className="space-y-2">
            {logs.map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {log.importType === 'showroom_cars' ? 'سيارات المعرض' :
                     log.importType === 'parts' ? 'قطع الغيار' : log.importType}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {log.totalImported || 0} مستورد · {new Date(log.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
                {log.status === 'completed'
                  ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── أدوات المزامنة والصيانة ─────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          onClick={() => setShowSync(!showSync)}
          className="flex items-center gap-3 w-full p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-black text-white">أدوات المزامنة والصيانة</p>
            <p className="text-xs text-white/30 mt-0.5">تزامن البيانات القديمة، إصلاح الصور، فحص الصحة</p>
          </div>
          <RefreshCw className={`w-4 h-4 text-white/30 transition-transform duration-300 ${showSync ? 'rotate-180' : ''}`} />
        </button>

        {showSync && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl"
          >
            <SyncToolsPanel />
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── مكوّن الاستيراد الجماعي ─────────────────────────────────────────────
function BulkImportWidget({ onStart }: { onStart: () => void }) {
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBulk = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v2/import/bulk-showroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ limit }),
      });
      const data = await res.json();
      setMessage(data.message || '✅ تم الإطلاق');
      onStart();
    } catch (e: any) {
      setMessage('❌ ' + (e.message || 'خطأ في الاتصال'));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start">
      <div className="flex-1">
        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
          عدد السيارات (الحد الأقصى 500)
        </label>
        <input
          type="number"
          min={10} max={500} value={limit}
          onChange={e => setLimit(Math.min(500, Math.max(10, parseInt(e.target.value) || 50)))}
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
          dir="ltr"
        />
      </div>
      <div className="flex flex-col gap-2 sm:mt-5">
        <button
          onClick={handleBulk}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-black text-sm hover:bg-purple-400 transition-all disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? 'جاري...' : 'استيراد جماعي'}
        </button>
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/60 font-bold sm:mt-5 w-full sm:w-auto"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
