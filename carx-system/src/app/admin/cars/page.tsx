'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Filter, 
  CheckCircle2, XCircle, ArrowRight, Globe, Car,
  RefreshCw, Loader2, Download, Clock, AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

// ─── ثوابت ──────────────────────────────────────────────────────────────────
const IMPORT_BATCH = 20;           // عدد السيارات لكل دفعة (تحدده النظام)
const COOLDOWN_MS  = 45_000;      // 45 ثانية بين كل استيراد والتالي
const STORAGE_KEY  = 'hmcar_last_encar_import';

const KOREAN_MAP: Record<string, string> = {
  '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس', '쌍용': 'سانغ يونغ',
  'KG모빌리티': 'كي جي موبيليتي', '르노코리아': 'رينو الكورية', '르노삼성': 'سامسونج رينو',
  '쉐보레': 'شيفروليه', '벤츠': 'مرسيدس بنز', 'BMW': 'بي إم دبليو', '아우디': 'أودي',
  '포르쉐': 'بورشه', '폭스바겐': 'فولكس فاجن', '재규어': 'جاغوار', '시리즈': 'فئة',
  '팰리세이드': 'باليساد', '그랜저': 'جرانديور', '아반떼': 'إلانترا', '쏘나타': 'سوناتا',
  '투싼': 'توسان', '싼타페': 'سانتافي', '코나': 'كونا', '카니발': 'كارنيفال',
  '쏘렌토': 'سورينتو', '스포티지': 'سبورتاج', '셀토스': 'سيلتوس', '모닝': 'مورنينج',
  '휘발유': 'بنزين', '가솔린': 'بنزين', '경유': 'ديزل', '디젤': 'ديزل',
  '하이브리드': 'هايبرد', '전기': 'كهرباء', 'LPG': 'غاز (LPG)', '오토': 'أوتوماتيك'
};

function cleanKoreanText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let res = text.trim();
  Object.keys(KOREAN_MAP).forEach(k => { res = res.replace(new RegExp(k, 'gi'), KOREAN_MAP[k]); });
  res = res.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
  return res.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim() || text;
}

function formatCarTitle(title: string): string {
  return cleanKoreanText(title || '');
}

// ─── مكون صورة آمن ──────────────────────────────────────────────────────────
function SafeCarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [imgSrc, setImgSrc] = React.useState(src || '');
  const [errored, setErrored] = React.useState(false);
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop';

  React.useEffect(() => { setImgSrc(src || ''); setErrored(false); }, [src]);

  const resolved = !imgSrc || errored
    ? PLACEHOLDER
    : imgSrc.startsWith('http') && !imgSrc.includes('cloudinary') && !imgSrc.includes('unsplash')
      ? `/api/v2/image-proxy?url=${encodeURIComponent(imgSrc)}`
      : imgSrc;

  return (
    <img src={resolved} alt={alt || ''} className={className}
      onError={() => { if (resolved !== PLACEHOLDER && resolved !== imgSrc) setImgSrc(imgSrc); else setErrored(true); }}
    />
  );
}

// ─── مكون زر الاستيراد مع Cooldown ──────────────────────────────────────────
function KoreanImportButton({ onImported }: { onImported: () => void }) {
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg]         = useState('');
  const [cooldown, setCooldown] = useState(0);       // ثواني متبقية

  // احسب الـ cooldown عند تحميل الصفحة
  useEffect(() => {
    const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
    const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - last));
    if (remaining > 0) {
      setCooldown(Math.ceil(remaining / 1000));
    }
  }, []);

  // عداد Cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleImport = useCallback(async () => {
    if (cooldown > 0 || status === 'loading') return;
    setStatus('loading');
    setMsg('');

    try {
      const res = await api.import.showroom(IMPORT_BATCH) as any;
      const d = res.data || res;

      if (res.error) {
        setStatus('error');
        setMsg(res.error);
        return;
      }

      const imported = d?.totalImported ?? d?.data?.totalImported ?? 0;
      const skipped  = d?.totalSkipped  ?? d?.data?.totalSkipped  ?? 0;

      setStatus('success');
      setMsg(`✅ تم استيراد ${imported} سيارة جديدة${skipped > 0 ? ` · تجاوز ${skipped} مكرر` : ''}`);

      // حفظ وقت الاستيراد وتشغيل الـ cooldown
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setCooldown(Math.ceil(COOLDOWN_MS / 1000));

      // إعادة تحميل القائمة
      onImported();

      // إخفاء رسالة النجاح بعد 8 ثواني
      setTimeout(() => setStatus('idle'), 8000);
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message || 'فشل الاستيراد، حاول مرة أخرى');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [cooldown, status, onImported]);

  const isDisabled = cooldown > 0 || status === 'loading';

  return (
    <div className="flex flex-col gap-3">
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        onClick={handleImport}
        disabled={isDisabled}
        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all relative overflow-hidden
          ${isDisabled
            ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            : 'bg-luxury-gold text-black hover:bg-white shadow-[0_0_25px_rgba(212,175,55,0.2)] cursor-pointer'
          }`}
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : cooldown > 0 ? (
          <Clock className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}

        {status === 'loading'
          ? 'جاري جلب السيارات...'
          : cooldown > 0
            ? `انتظر ${cooldown}ث`
            : 'جلب سيارات كوريا'}

        {/* شريط التقدم للـ Cooldown */}
        {cooldown > 0 && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-luxury-gold/40 transition-all"
            style={{ width: `${(cooldown / (COOLDOWN_MS / 1000)) * 100}%` }}
          />
        )}
      </motion.button>

      {/* رسالة الحالة */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-bold
              ${status === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'korean_import' | 'hm_local' | null>(null);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.cars.getAll({ status: 'all', limit: '300' }) as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const fetchedCars = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result?.data?.cars || result?.cars || []);
        setCars(fetchedCars);
      }
    } catch {
      setError('فشل جلب السيارات من الخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
      try {
        const res = await api.cars.delete(id);
        if (!res.error) fetchCars();
        else alert(res.error || 'فشل حذف السيارة');
      } catch {
        alert('فشل الاتصال بالخادم لحذف السيارة');
      }
    }
  };

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const koreanCarsCount = cars.filter(car => car.source === 'korean_import' || car.source === 'encar_korea').length;
  const localCarsCount  = cars.filter(car => car.source !== 'korean_import' && car.source !== 'encar_korea').length;

  const filteredCars = cars.filter(car => {
    const matchesSearch =
      car.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.brand || car.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.model || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeSection === 'korean_import') return car.source === 'korean_import' || car.source === 'encar_korea';
    if (activeSection === 'hm_local')     return car.source !== 'korean_import' && car.source !== 'encar_korea';
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <AnimatePresence mode="wait">
        {activeSection === null ? (

          /* ════ اختيار القسم ════ */
          <motion.div key="selection"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-black">إدارة السيارات</h1>
              <p className="text-white/40 text-sm mt-2">اختر المعرض المراد إدارته والتحكم في مخزونه</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-6">

              {/* بطاقة المعرض الكوري */}
              <div
                onClick={() => setActiveSection('korean_import')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Globe className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">المعرض الكوري</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    إدارة واستعراض السيارات المستوردة من كوريا الجنوبية والمدخلة تلقائياً عبر نظام السحب.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                    {loading ? '...' : `${koreanCarsCount} سيارة مستوردة`}
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 text-[10px] font-black text-luxury-gold uppercase tracking-wider">
                    Encar Korea
                  </div>
                </div>
              </div>

              {/* بطاقة معرض CAR X */}
              <div
                onClick={() => setActiveSection('hm_local')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Car className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">معرض CAR X</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    إدارة واستعراض السيارات الفاخرة والمحلية المضافة يدوياً من قبل إدارة المعرض.
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                  {loading ? '...' : `${localCarsCount} سيارة محلية`}
                </div>
              </div>
            </div>
          </motion.div>

        ) : (

          /* ════ قائمة السيارات ════ */
          <motion.div key="list"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* رجوع */}
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-4"
            >
              <ArrowRight className="w-4 h-4" />
              الرجوع لاختيار المعرض
            </button>

            {/* رأس الصفحة */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black">
                  إدارة السيارات —{' '}
                  <span className="text-luxury-gold">
                    {activeSection === 'korean_import' ? 'المعرض الكوري' : 'معرض CAR X'}
                  </span>
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {activeSection === 'korean_import'
                    ? 'سيارات مستوردة من كوريا الجنوبية عبر Encar — ترجمة كاملة + علامة مائية HM CAR'
                    : 'تحكم في مخزون السيارات المحلية والفاخرة المضافة يدوياً'}
                </p>
              </div>
              {activeSection === 'hm_local' && (
                <Link
                  href="/admin/cars/new"
                  className="flex items-center gap-2 px-5 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  إضافة سيارة جديدة
                </Link>
              )}
            </div>

            {/* ── زر الاستيراد التلقائي (للمعرض الكوري فقط) ── */}
            {activeSection === 'korean_import' && (
              <div className="bg-gradient-to-br from-luxury-gold/5 to-transparent border border-luxury-gold/15 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-luxury-gold" />
                      <h3 className="text-sm font-black text-white">استيراد تلقائي من Encar Korea</h3>
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed max-w-md">
                      يجلب <strong className="text-white/60">{IMPORT_BATCH} سيارة</strong> جديدة غير مكررة مع جميع الصور والمواصفات الكاملة — مترجمة تلقائياً من الكورية مع علامة مائية HM CAR.
                    </p>
                  </div>
                  <KoreanImportButton onImported={fetchCars} />
                </div>

                {/* إحصائيات سريعة */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    لا تكرار — تُتجاوز السيارات الموجودة مسبقاً
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                    ترجمة كاملة عربي / إنجليزي
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <Download className="w-3 h-3 text-luxury-gold" />
                    علامة مائية HM CAR شفافة
                  </div>
                </div>
              </div>
            )}

            {/* البحث */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="ابحث عن سيارة بالاسم أو الماركة أو الموديل..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all text-right"
                  dir="rtl"
                />
              </div>
              <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2 hover:bg-white/10">
                <Filter className="w-4 h-4" />
                تصفية
              </button>
            </div>

            {/* الجدول */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right" dir="rtl">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السيارة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الماركة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السعر</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الحالة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">تاريخ الإضافة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-6 py-8 h-20 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : filteredCars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-white/20 font-bold">
                          {error || 'لا توجد سيارات مطابقة للبحث في هذا القسم'}
                        </td>
                      </tr>
                    ) : (
                      filteredCars.map(car => (
                        <tr key={car._id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <SafeCarImage
                                src={car.mainImage || car.imageUrl || car.images?.[0]}
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                                alt={car.title || ''}
                              />
                              <div>
                                <div className="font-bold text-sm">{formatCarTitle(car.title)}</div>
                                <div className="text-[10px] text-white/30 uppercase">{car.year}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-white/60">
                            {cleanKoreanText(car.brand || car.make || 'غير محدد')}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-sm">
                            {car.price?.toLocaleString()} <span className="text-[10px] text-white/20">ريال</span>
                          </td>
                          <td className="px-6 py-4">
                            {car.isActive ? (
                              <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> نشط
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-white/20 text-xs font-bold">
                                <XCircle className="w-3.5 h-3.5" /> مخفي
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-white/40">
                            {car.createdAt ? new Date(car.createdAt).toLocaleDateString('ar-SA') : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/cars/${car._id}/edit`}
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-luxury-gold transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(car._id)}
                                className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* عداد النتائج */}
              {!loading && filteredCars.length > 0 && (
                <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
                  <p className="text-xs text-white/20 font-medium">
                    عرض {filteredCars.length} سيارة
                  </p>
                  <button
                    onClick={fetchCars}
                    className="flex items-center gap-1.5 text-xs text-white/20 hover:text-luxury-gold transition-colors font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    تحديث
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
