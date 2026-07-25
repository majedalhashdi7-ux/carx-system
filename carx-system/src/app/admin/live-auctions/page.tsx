'use client';

import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit2, ChevronLeft, X, 
  Link as LinkIcon, Play, Square, ExternalLink, 
  Download, CheckCircle, AlertCircle, Radio, 
  RefreshCw, ToggleLeft, ToggleRight, Zap, Clock,
  Loader2, Eye, Settings2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

// ── Toast System ──────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'loading';
interface Toast { id: number; type: ToastType; message: string; }

let _toastCounter = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-6 left-6 z-[999] flex flex-col gap-3 pointer-events-none" dir="rtl">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border text-sm font-bold shadow-2xl min-w-[280px] max-w-[380px] ${
              t.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' :
              t.type === 'error'   ? 'bg-red-950 border-red-500/40 text-red-300' :
              t.type === 'info'    ? 'bg-blue-950 border-blue-500/40 text-blue-300' :
                                     'bg-zinc-900 border-white/10 text-white/60'
            }`}
          >
            {t.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'error'   && <AlertCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'loading' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin" />}
            <span className="flex-1 text-[13px] leading-tight">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="opacity-40 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; dot: string }> = {
    live:     { label: 'مباشر الآن', cls: 'bg-red-500/15 text-red-400 border-red-500/30',   dot: 'bg-red-400 animate-pulse' },
    upcoming: { label: 'قادم',       cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
    ended:    { label: 'منتهي',      cls: 'bg-white/5 text-white/30 border-white/10',        dot: 'bg-white/20' },
  };
  const s = cfg[status] || cfg['upcoming'];
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────
export default function AdminLiveAuctions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generalWhatsapp, setGeneralWhatsapp] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    externalUrl: '',
    whatsappNumber: '',
    auctionUsername: '',
    auctionPassword: '',
    autoSync: false,
    startTime: '',
    cars: [] as any[]
  });

  // ── Toast helpers ──
  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = ++_toastCounter;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    loadSessions();
    api.settings.getPublic().then((res: any) => {
      if (res?.data?.contactInfo?.whatsapp) setGeneralWhatsapp(res.data.contactInfo.whatsapp);
    }).catch(() => {});
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.liveAuctions.list();
      if (res.data?.success) setSessions(res.data.data);
      else if (Array.isArray(res.data)) setSessions(res.data);
    } catch {
      addToast('error', 'فشل تحميل جلسات المزاد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return addToast('error', 'يرجى إدخال عنوان جلسة المزاد');
    const loadId = addToast('loading', 'جاري الحفظ...', 0);
    setIsLoading(true);
    try {
      if (editingId) {
        await api.liveAuctions.update(editingId, formData);
      } else {
        await api.liveAuctions.create(formData);
      }
      dismissToast(loadId);
      addToast('success', editingId ? 'تم تحديث الجلسة بنجاح ✓' : 'تم إنشاء الجلسة بنجاح ✓');
      setIsModalOpen(false);
      resetForm();
      loadSessions();
    } catch (e: any) {
      dismissToast(loadId);
      addToast('error', e.message || 'فشل حفظ الجلسة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف جلسة "${title}"؟`)) return;
    const loadId = addToast('loading', 'جاري الحذف...', 0);
    try {
      await api.liveAuctions.delete(id);
      dismissToast(loadId);
      addToast('success', 'تم حذف الجلسة بنجاح');
      loadSessions();
    } catch (e: any) {
      dismissToast(loadId);
      addToast('error', e.message || 'فشل الحذف');
    }
  };

  const handleStatus = async (id: string, action: 'start' | 'end') => {
    setIsStarting(id);
    const loadId = addToast('loading', action === 'start' ? 'جاري بدء البث المباشر...' : 'جاري إيقاف المزاد...', 0);
    try {
      if (action === 'start') await api.liveAuctions.start(id);
      else await api.liveAuctions.end(id);
      dismissToast(loadId);
      addToast('success', action === 'start' ? '🔴 تم بدء البث المباشر' : '⏹ تم إيقاف المزاد');
      loadSessions();
    } catch (e: any) {
      dismissToast(loadId);
      addToast('error', e.message || 'حدث خطأ');
    } finally {
      setIsStarting(null);
    }
  };

  const handleImportCars = async (id: string) => {
    const session = sessions.find(s => s._id === id);
    if (!session?.externalUrl) {
      return addToast('error', 'لا يوجد رابط خارجي. أضف الرابط أولاً في إعدادات الجلسة.');
    }
    if (!confirm('سيتم استيراد السيارات من الرابط الخارجي. السيارات التي اختفت ستُلغى تلقائياً. هل تريد المتابعة؟')) return;

    setIsImporting(id);
    const loadId = addToast('loading', 'جاري استيراد السيارات من الرابط... قد يستغرق دقيقة', 0);
    try {
      const res = await api.liveAuctions.importExternal(id);
      dismissToast(loadId);
      if (res.data?.success) {
        addToast('success', `✅ ${res.data.message || 'تم استيراد السيارات بنجاح!'}`);
        loadSessions();
      } else {
        addToast('error', res.error || 'فشل الاستيراد. تحقق من صحة الرابط الخارجي.');
      }
    } catch (err: any) {
      dismissToast(loadId);
      addToast('error', 'خطأ في الاتصال بالخادم: ' + err.message);
    } finally {
      setIsImporting(null);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', autoSync: false, startTime: '', cars: [] });
    setEditingId(null);
  };

  const openEdit = (session: any) => {
    setFormData({
      title: session.title || '',
      externalUrl: session.externalUrl || '',
      whatsappNumber: session.whatsappNumber || '',
      auctionUsername: session.auctionUsername || '',
      auctionPassword: session.auctionPassword || '',
      autoSync: session.autoSync || false,
      startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
      cars: session.cars || []
    });
    setEditingId(session._id);
    setIsModalOpen(true);
  };

  const addCar = () => {
    setFormData({ ...formData, cars: [...formData.cars, { title: '', images: [], condition: 'مستعملة', description: '', priceEstimate: '', lotNumber: '' }] });
  };

  const removeCar = (index: number) => {
    const newCars = [...formData.cars];
    newCars.splice(index, 1);
    setFormData({ ...formData, cars: newCars });
  };

  const updateCar = (index: number, field: string, value: any) => {
    const newCars = [...formData.cars];
    newCars[index] = { ...newCars[index], [field]: value };
    setFormData({ ...formData, cars: newCars });
  };

  const liveSessions = sessions.filter(s => s.status === 'live').length;
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* ── الرأس ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <Link href="/admin" className="flex items-center gap-1 text-white/40 hover:text-white mb-3 transition-colors text-xs font-bold uppercase tracking-widest w-fit">
            <ChevronLeft className="w-4 h-4 rotate-180" />
            العودة للوحة القيادة
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            إدارة <span className="text-luxury-gold">المزادات المباشرة</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm">أنشئ جلسات بث مباشر، استورد السيارات تلقائياً، وفعّل التحديث كل 24 ساعة.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* إحصائيات سريعة */}
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">{liveSessions} مباشر</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{upcomingSessions} قادم</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-6 py-3 bg-luxury-gold text-black font-black rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:bg-white transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إنشاء جلسة
          </motion.button>
        </div>
      </div>

      {/* ── دليل الاستخدام ── */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-wrap items-center gap-5">
        {[
          { n: '1', t: 'أنشئ جلسة مزاد جديدة' },
          { n: '2', t: 'أدخل رابط المزاد الخارجي واحفظ' },
          { n: '3', t: 'اضغط «استيراد» لجلب السيارات تلقائياً' },
          { n: '4', t: 'فعّل التحديث التلقائي أو ابدأ البث' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <div className="w-6 h-px bg-white/10 hidden sm:block" />}
            <div className="w-7 h-7 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-[11px] font-black text-luxury-gold">{step.n}</div>
            <span className="text-[11px] text-white/50 font-medium">{step.t}</span>
          </div>
        ))}
      </div>

      {/* ── قائمة الجلسات ── */}
      <div className="space-y-4">
        {isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl gap-4">
            <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">جاري التحميل...</p>
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl gap-5">
            <Radio className="w-14 h-14 text-white/5" />
            <div className="text-center">
              <h3 className="text-xl font-black text-white/20 uppercase tracking-tighter">لا توجد جلسات بعد</h3>
              <p className="text-white/20 text-xs mt-1">أنشئ أول جلسة مزاد مباشر</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="px-6 py-3 bg-luxury-gold text-black font-black text-xs rounded-xl hover:bg-white transition-all"
            >
              <Plus className="w-4 h-4 inline ml-2" />
              إنشاء جلسة جديدة
            </button>
          </div>
        )}

        <AnimatePresence>
          {sessions.map((session, i) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.04 }}
              className={`border rounded-2xl p-6 transition-all ${
                session.status === 'live'
                  ? 'border-red-500/30 bg-red-500/[0.03]'
                  : 'border-white/5 bg-white/[0.01] hover:border-white/10'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                {/* معلومات الجلسة */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={session.status} />
                    <h3 className="text-xl font-black text-white truncate">{session.title}</h3>
                  </div>

                  {/* الرابط الخارجي */}
                  {session.externalUrl ? (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3 h-3 text-luxury-gold/50 shrink-0" />
                      <a href={session.externalUrl} target="_blank" rel="noopener noreferrer"
                        className="text-luxury-gold/60 hover:text-luxury-gold text-[11px] font-mono truncate transition-colors">
                        {session.externalUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-500/60 shrink-0" />
                      <span className="text-yellow-500/60 text-[11px]">لا يوجد رابط خارجي — أضفه عبر تعديل الجلسة</span>
                    </div>
                  )}

                  {/* إحصائيات */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-white/50 uppercase tracking-widest">
                      {session.cars?.length || 0} سيارة
                    </span>
                    {session.autoSync ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400">
                        <ToggleRight className="w-3.5 h-3.5" />
                        تحديث تلقائي كل 24 ساعة
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-white/30">
                        <ToggleLeft className="w-3.5 h-3.5" />
                        تحديث يدوي
                      </span>
                    )}
                    {session.whatsappNumber && (
                      <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-400">
                        📱 {session.whatsappNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
                  {/* بث / إيقاف */}
                  {session.status !== 'live' ? (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatus(session._id, 'start')}
                      disabled={isStarting === session._id}
                      className="flex flex-col items-center gap-1 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-40"
                    >
                      {isStarting === session._id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      <span className="text-[7px] font-black uppercase">بث مباشر</span>
                    </motion.button>
                  ) : (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatus(session._id, 'end')}
                      className="flex flex-col items-center gap-1 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Square className="w-5 h-5" />
                      <span className="text-[7px] font-black uppercase">إيقاف</span>
                    </motion.button>
                  )}

                  {/* استيراد السيارات */}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleImportCars(session._id)}
                    disabled={isImporting === session._id || !session.externalUrl}
                    title={!session.externalUrl ? 'أضف رابطاً خارجياً أولاً' : 'استيراد السيارات من الرابط'}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all ${
                      session.externalUrl
                        ? 'bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold/20'
                        : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                    } ${isImporting === session._id ? 'animate-pulse' : ''}`}
                  >
                    <Download className={`w-5 h-5 ${isImporting === session._id ? 'animate-bounce' : ''}`} />
                    <span className="text-[7px] font-black uppercase">استيراد</span>
                  </motion.button>

                  {/* تعديل */}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => openEdit(session)}
                    className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                    <span className="text-[7px] font-black uppercase">تعديل</span>
                  </motion.button>

                  {/* عرض صفحة العميل */}
                  <Link href={`/auctions/live/${session._id}`} target="_blank"
                    className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-cyan-400 hover:border-cyan-500/20 transition-all"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-[7px] font-black uppercase">معاينة</span>
                  </Link>

                  {/* حذف */}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(session._id, session.title)}
                    className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/20 hover:text-red-400 hover:border-red-500/20 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[7px] font-black uppercase">حذف</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════
          نافذة الإنشاء / التعديل
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* رأس النافذة */}
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {editingId ? '✏️ تعديل جلسة المزاد' : '➕ جلسة مزاد مباشر جديدة'}
                  </h2>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">
                    أدخل البيانات ثم احفظ — السيارات تُستورد تلقائياً من الرابط
                  </p>
                </div>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* جسم النافذة */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">

                {/* القسم 1: المعلومات الأساسية */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <span className="w-6 h-6 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">معلومات الجلسة</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-white/60">عنوان الجلسة *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="مثال: مزاد سيارات كوريا - الاثنين 21 يوليو"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-white/60">رابط المزاد الخارجي</label>
                      <input
                        type="url"
                        value={formData.externalUrl}
                        onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                        placeholder="https://www.copart.com/... أو https://encar.com/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 font-mono text-left transition-colors"
                        dir="ltr"
                      />
                      <p className="text-[10px] text-white/30">💡 سيتم استخدام هذا الرابط لكشط واستيراد بيانات السيارات تلقائياً.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/60">رقم واتساب التواصل</label>
                      <input
                        type="text"
                        value={formData.whatsappNumber}
                        onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder={generalWhatsapp || "+96650000000"}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-left font-mono transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/60">تاريخ ووقت البدء</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 transition-colors text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white/60">اسم مستخدم الحساب الخارجي (اختياري)</label>
                      <input
                        type="text"
                        value={formData.auctionUsername}
                        onChange={e => setFormData({ ...formData, auctionUsername: e.target.value })}
                        placeholder="ID"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-left font-mono transition-colors"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* القسم 2: التحديث التلقائي */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black flex items-center justify-center">
                      <Zap className="w-3 h-3" />
                    </span>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">التحديث التلقائي</h4>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, autoSync: !formData.autoSync })}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                      formData.autoSync
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${formData.autoSync ? 'text-cyan-400' : 'text-white/30'}`} />
                          <span className={`text-sm font-black ${formData.autoSync ? 'text-cyan-300' : 'text-white/60'}`}>
                            التحديث التلقائي كل 24 ساعة
                          </span>
                          {formData.autoSync && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[9px] font-black rounded-full uppercase">مفعّل</span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/30 mr-6">
                          عند التفعيل: يتم استيراد السيارات كل 24 ساعة تلقائياً، وإلغاء السيارات التي اختفت من المزاد، وإيقاف المزاد إذا انتهى.
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full border-2 transition-all flex items-center ${
                        formData.autoSync ? 'bg-cyan-500 border-cyan-400' : 'bg-white/10 border-white/20'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${
                          formData.autoSync ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* القسم 2: إدارة السيارات */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-luxury-gold/20 text-luxury-gold text-xs font-black flex items-center justify-center">3</span>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                        سيارات الجلسة ({formData.cars?.length || 0})
                      </h4>
                    </div>
                    <button type="button" onClick={addCar}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      إضافة يدوية
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[30vh] overflow-y-auto">
                    {formData.cars?.length === 0 ? (
                      <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
                        <p className="text-xs text-white/30 font-medium">لا توجد سيارات مضافة حالياً.</p>
                        <p className="text-[10px] text-white/20 mt-1">احفظ الجلسة ثم اضغط «استيراد» لجلب السيارات من الرابط تلقائياً.</p>
                      </div>
                    ) : (
                      formData.cars.map((car, index) => (
                        <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group">
                          <button type="button" onClick={() => removeCar(index)}
                            className="absolute top-4 left-4 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] text-white/40">عنوان السيارة *</label>
                              <input type="text" value={car.title} onChange={e => updateCar(index, 'title', e.target.value)}
                                placeholder="مثال: Hyundai Grandeur 2022"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-white/40">رقم اللوت</label>
                              <input type="text" value={car.lotNumber || ''} onChange={e => updateCar(index, 'lotNumber', e.target.value)}
                                placeholder="569874" dir="ltr"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50 text-left font-mono" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-white/40">تقدير السعر</label>
                              <input type="text" value={car.priceEstimate || ''} onChange={e => updateCar(index, 'priceEstimate', e.target.value)}
                                placeholder="45,000 ر.س"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-white/40">الحالة</label>
                              <input type="text" value={car.condition || ''} onChange={e => updateCar(index, 'condition', e.target.value)}
                                placeholder="نظيف / صدمة خفيفة"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-white/40">رابط صورة</label>
                              <input type="text" value={car.images?.[0] || ''} onChange={e => updateCar(index, 'images', e.target.value ? [e.target.value] : [])}
                                placeholder="https://..." dir="ltr"
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50 text-left font-mono" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* أزرار الحفظ */}
              <div className="p-6 border-t border-white/5 flex gap-3 shrink-0">
                <button type="button" onClick={handleSave} disabled={isLoading}
                  className="flex-1 py-3.5 bg-luxury-gold text-black font-black text-sm rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer disabled:opacity-50">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'حفظ الجلسة'}
                </button>
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-6 py-3.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
