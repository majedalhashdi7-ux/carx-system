'use client';

/**
 * ImportSystem - نظام استيراد السيارات وقطع الغيار من الروابط لـ CAR X
 * استيراد ذكي مع ضغط الصور وعدم التكرار، بتصميم فاخر أسود وذهبي
 * [[FIX v2]] إضافة: لوحة أدوات المزامنة + فحص الصحة + إصلاح الصور + عرض الصور بـ fallback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, CheckCircle, AlertCircle,
  Loader2, Image as ImageIcon, Car, Wrench, X, Eye,
  Download, Zap, Shield, Info, RefreshCw, Activity,
  AlertTriangle, CheckCircle2, Database, Settings2,
  TrendingUp, ImageOff, FileSearch
} from 'lucide-react';
import { api } from '../../lib/api';

// ─── الأنواع ──────────────────────────────────────────────────

interface ImportResult {
  success: boolean;
  message: string;
  data?: any;
  images?: string[];
  duplicate?: boolean;
}

interface ImportSystemProps {
  type: 'car' | 'part';
  onImportComplete?: (data: any) => void;
}

interface HealthData {
  health: string;
  summary: { totalCars: number; totalParts: number; totalIssues: number };
  issues: {
    cars: { noImages: number; externalImages: number; missingMainImage: number; koreanText: number; noSpecs: number; hasExternalUrl: number };
    parts: { noImages: number; externalImages: number; missingImgField: number };
  };
}

// ─── مكون الصورة الآمن (مع fallback) ─────────────────────────

function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  // إذا تغير الـ src من الخارج نُعيد المحاولة
  useEffect(() => {
    setImgSrc(src);
    setFailed(false);
  }, [src]);

  if (failed || !imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`}>
        <ImageOff className="w-5 h-5 text-white/20" />
      </div>
    );
  }

  // استخدم image-proxy إذا كانت الصورة خارجية
  const proxySrc = imgSrc.startsWith('http') && !imgSrc.includes('cloudinary')
    ? `/api/v2/image-proxy?url=${encodeURIComponent(imgSrc)}`
    : imgSrc;

  return (
    <img
      src={proxySrc}
      alt={alt}
      className={className}
      onError={() => {
        // عند فشل الـ proxy جرب الرابط الأصلي
        if (proxySrc !== imgSrc) {
          setImgSrc(imgSrc);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

// ─── المكون الرئيسي ────────────────────────────────────────────

export default function ImportSystem({ type, onImportComplete }: ImportSystemProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // مصادر الاستيراد المدعومة
  const supportedSources = [
    { name: 'Copart', domain: 'copart.com', icon: Car },
    { name: 'IAAI', domain: 'iaai.com', icon: Car },
    { name: 'Encar كوريا', domain: 'encar.com', icon: Car },
    { name: 'روابط مخصصة', domain: 'أي موقع متوافق', icon: LinkIcon },
  ];

  const handleImport = async () => {
    if (!url.trim()) {
      setResult({ success: false, message: 'الرجاء إدخال رابط صحيح' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.import.preview(url, type);

      const d = res.data as any;
      if (d?.success) {
        setPreviewData(d.data);
        setShowPreview(true);
        setResult({
          success: true,
          message: d.duplicate
            ? 'تنبيه: هذا العنصر موجود مسبقاً في النظام (رابط مكرر) - سيتم تحديثه'
            : 'تم استخراج البيانات بنجاح',
          data: d.data,
          images: d.images,
          duplicate: d.duplicate
        });
      } else {
        setResult({
          success: false,
          message: res.error || d?.error || 'فشل الاستيراد'
        });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'حدث خطأ أثناء الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      const dataToSave = { ...previewData, isActive: true, status: 'available' };
      const res = await api.import.save(dataToSave, type);

      if (res.data?.success) {
        setResult({
          success: true,
          message: (res.data as any)?.message || `✅ تم النشر في المعرض! ${type === 'car' ? 'السيارة' : 'القطعة'} ظاهرة الآن للعملاء.`
        });
        onImportComplete?.((res.data as any)?.data || res.data);

        setTimeout(() => {
          setUrl('');
          setPreviewData(null);
          setShowPreview(false);
          setResult(null);
        }, 3000);
      } else {
        setResult({
          success: false,
          message: res.error || res.data?.error || 'فشل الحفظ في قاعدة البيانات'
        });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'حدث خطأ تقني أثناء الحفظ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white text-right" dir="rtl">
      {/* رأس المكون */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-luxury-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          {type === 'car' ? <Car className="w-7 h-7 text-black" /> : <Wrench className="w-7 h-7 text-black" />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            استيراد {type === 'car' ? 'السيارات' : 'قطع الغيار'} الذكي
          </h2>
          <p className="text-white/40 text-sm mt-1">
            أدخل رابط الصفحة الخارجية ليقوم النظام بسحب تفاصيلها وصورها تلقائياً.
          </p>
        </div>
      </div>

      {/* المصادر المدعومة */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-luxury-gold/5 blur-[50px] pointer-events-none" />
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Shield className="w-5 h-5 text-luxury-gold" />
          <h3 className="text-base font-black">المصادر المتوافقة والمدعومة</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {supportedSources.map((source, idx) => {
            const Icon = source.icon;
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-luxury-gold/20 transition-all duration-300">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Icon className="w-4 h-4 text-luxury-gold" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{source.name}</p>
                  <p className="text-[10px] text-white/30 font-mono">{source.domain}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* حقل الإدخال */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
            رابط {type === 'car' ? 'السيارة أو موقع المعرض' : 'القطعة أو موقع القطع'}
          </label>
          <p className="text-[11px] text-white/30">
            💡 رابط سيارة محددة → يستورد سيارة واحدة &nbsp;|&nbsp; رابط موقع معرض → يستورد قائمة السيارات
          </p>
          <div className="relative group">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              placeholder="https://www.encar.com/dc/dc_cardetail.do?carid=123 أو https://encar.com/cars/list"
              disabled={loading}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pr-4 pl-12 text-sm text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/[0.03] transition-all font-mono"
              dir="ltr"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
            </div>
          </div>
        </div>

        {/* الميزات الذكية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-green-500/5 border border-green-500/10 text-green-400">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-black">استخراج فوري للبيانات والوصف</span>
          </div>
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
            <ImageIcon className="w-4 h-4" />
            <span className="text-xs font-black">حفظ ورفع الصور تلقائياً</span>
          </div>
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-purple-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-black">التحقق الذكي لمنع تكرار الروابط</span>
          </div>
        </div>

        {/* أزرار التشغيل */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-luxury-gold text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-black text-sm transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري معالجة الرابط...</span></>
            ) : (
              <><Download className="w-4 h-4" /><span>بدء استيراد البيانات</span></>
            )}
          </button>

          {showPreview && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-luxury-gold hover:bg-white disabled:opacity-50 text-black font-black text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{result?.duplicate ? 'تحديث وحفظ' : 'نشر في المعرض'}</span>
            </button>
          )}
        </div>
      </div>

      {/* صندوق النتيجة */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`p-4 rounded-2xl border ${
              result.success
                ? result.duplicate
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  : 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.success ? (
                result.duplicate
                  ? <AlertTriangle className="w-5 h-5 shrink-0" />
                  : <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <p className="text-xs font-black">{result.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* معاينة البيانات المستخرجة */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-luxury-gold" />
                <h3 className="text-lg font-black">معاينة البيانات المستخرجة</h3>
              </div>
              <button
                onClick={() => { setShowPreview(false); setPreviewData(null); }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {type === 'car' ? (
              <CarPreview data={previewData} onDataChange={(updated) => setPreviewData(updated)} />
            ) : (
              <PartPreview data={previewData} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── مكون معاينة السيارة ──────────────────────────────────────

function CarPreview({ data, onDataChange }: { data: any; onDataChange?: (updated: any) => void }) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onDataChange?.({ ...data, price: isNaN(val) ? data.price : val });
  };

  return (
    <div className="space-y-6 text-right">
      {/* عرض الصور */}
      {data.images && data.images.length > 0 && (
        <div>
          <p className="text-xs font-black text-white/40 mb-3">الصور المستخرجة ({data.images.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.images.slice(0, 8).map((img: string, idx: number) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group">
                <SafeImage
                  src={img}
                  alt={`صورة السيارة ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تعديل السعر قبل النشر */}
      <div className="p-4 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/20">
        <p className="text-xs font-black text-luxury-gold mb-2">💰 تعديل السعر قبل النشر (ريال سعودي)</p>
        <input
          type="number"
          defaultValue={data.price || ''}
          onChange={handlePriceChange}
          placeholder="أدخل السعر بالريال السعودي..."
          className="w-full bg-black/50 border border-luxury-gold/30 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold transition-all font-mono text-left"
          dir="ltr"
        />
      </div>

      {/* تفاصيل السيارة */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="عنوان السيارة" value={data.title} />
        <InfoItem label="الشركة المصنعة" value={data.make} />
        <InfoItem label="الموديل" value={data.model} />
        <InfoItem label="سنة الصنع" value={data.year} />
        <InfoItem label="السعر" value={data.price ? `${Number(data.price).toLocaleString('ar-SA')} ر.س` : 'لم يحدد بعد'} />
        <InfoItem label="ناقل الحركة" value={data.transmission === 'Automatic' ? 'أوتوماتيك' : data.transmission || '—'} />
        <InfoItem label="نوع الوقود" value={data.fuelType} />
        <InfoItem label="رابط المصدر" value={data.sourceUrl} isLink />
      </div>

      {/* الوصف */}
      {data.description && (
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <p className="text-xs font-black text-white/40 mb-2">الوصف المستخرج</p>
          <p className="text-xs text-white/70 leading-relaxed font-medium">{data.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── مكون معاينة قطعة الغيار ─────────────────────────────────

function PartPreview({ data }: { data: any }) {
  return (
    <div className="space-y-6 text-right">
      {/* عرض الصور */}
      {data.images && data.images.length > 0 && (
        <div>
          <p className="text-xs font-black text-white/40 mb-3">الصور المستخرجة ({data.images.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.images.slice(0, 4).map((img: string, idx: number) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-black border border-white/10 p-2 flex items-center justify-center">
                <SafeImage
                  src={img}
                  alt={`صورة القطعة ${idx + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تفاصيل قطعة الغيار */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="اسم القطعة" value={data.name || data.title} />
        <InfoItem label="رقم القطعة" value={data.partNumber} />
        <InfoItem label="فئة القطعة" value={data.category} />
        <InfoItem label="السعر" value={data.price ? `${data.price.toLocaleString('ar-SA')} ر.س` : 'سيتم تحديده'} />
        <InfoItem label="الكمية" value={data.stock} />
        <InfoItem label="رابط المصدر" value={data.sourceUrl} isLink />
      </div>
    </div>
  );
}

// ─── مكون فرعي لعرض خانات المعاينة ──────────────────────────

function InfoItem({ label, value, isLink = false }: { label: string; value: any; isLink?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
      <p className="text-[10px] font-black text-white/40 mb-1">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-luxury-gold hover:underline truncate block max-w-full" dir="ltr">
          {value || '—'}
        </a>
      ) : (
        <p className="text-xs font-bold text-white truncate">{value !== undefined && value !== null && value !== '' ? String(value) : '—'}</p>
      )}
    </div>
  );
}

// ─── لوحة أدوات المزامنة والصيانة (exported separately) ──────

interface SyncStats {
  cars: { processed: number; updated: number; errors: number };
  parts: { processed: number; updated: number; errors: number };
  totalIssues?: number;
}

interface SyncToolsProps {}

export function SyncToolsPanel(_: SyncToolsProps) {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await api.import.health();
      if (res.data?.success) setHealthData(res.data as HealthData);
    } catch (e) {}
    setHealthLoading(false);
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const runAction = async (actionKey: string, action: () => Promise<any>, label: string) => {
    setSyncLoading(actionKey);
    setSyncResult(null);
    try {
      const res = await action();
      const d = (res as any).data;
      setSyncResult({
        success: d?.success ?? false,
        message: d?.message || (d?.success ? `✅ ${label} اكتمل بنجاح` : 'حدث خطأ')
      });
      // تحديث بيانات الصحة بعد أي عملية
      await fetchHealth();
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message || 'فشل العملية' });
    }
    setSyncLoading(null);
  };

  const healthColor = !healthData ? 'white/20' :
    healthData.health === 'excellent' ? 'green-400' :
    healthData.health === 'good' ? 'yellow-400' : 'red-400';

  const healthLabel = !healthData ? '...' :
    healthData.health === 'excellent' ? 'ممتاز ✅' :
    healthData.health === 'good' ? 'جيد ⚠️' : 'يحتاج مزامنة 🔴';

  return (
    <div className="space-y-6 text-white" dir="rtl">
      {/* رأس القسم */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
          <Database className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">أدوات المزامنة والصيانة</h2>
          <p className="text-white/40 text-sm mt-1">
            تزامن بيانات قاعدة البيانات القديمة مع الميزات والتحديثات الجديدة
          </p>
        </div>
      </div>

      {/* بطاقة صحة البيانات */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[60px] pointer-events-none" />
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-black">صحة قاعدة البيانات</h3>
          </div>
          <button
            onClick={fetchHealth}
            disabled={healthLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 text-xs font-bold transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {healthLoading && !healthData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : healthData ? (
          <div className="space-y-4 relative z-10">
            {/* الحالة العامة */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <span className="text-sm font-bold text-white/60">الحالة العامة</span>
              </div>
              <span className={`text-sm font-black text-${healthColor}`}>{healthLabel}</span>
            </div>

            {/* الإحصائيات */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'إجمالي السيارات', value: healthData.summary.totalCars, icon: Car, color: 'text-luxury-gold' },
                { label: 'إجمالي القطع', value: healthData.summary.totalParts, icon: Wrench, color: 'text-blue-400' },
                { label: 'مشاكل السيارات', value: Object.values(healthData.issues.cars).reduce((a, b) => a + b, 0), icon: AlertTriangle, color: 'text-yellow-400' },
                { label: 'مشاكل القطع', value: Object.values(healthData.issues.parts).reduce((a, b) => a + b, 0), icon: AlertTriangle, color: 'text-orange-400' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                    <p className="text-xl font-black text-white">{item.value}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{item.label}</p>
                  </div>
                );
              })}
            </div>

            {/* تفاصيل المشاكل */}
            {healthData.summary.totalIssues > 0 && (
              <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10">
                <p className="text-xs font-black text-yellow-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  تفاصيل المشاكل المكتشفة
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(healthData.issues.cars).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-white/40">{getIssueLabelCar(k)}</span>
                      <span className="text-yellow-400 font-bold">{v}</span>
                    </div>
                  ))}
                  {Object.entries(healthData.issues.parts).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-white/40">{getIssueLabelPart(k)}</span>
                      <span className="text-orange-400 font-bold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* أدوات الإصلاح */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="w-5 h-5 text-luxury-gold" />
          <h3 className="text-base font-black">أدوات الإصلاح والمزامنة</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* المزامنة الشاملة */}
          <SyncActionCard
            icon={<RefreshCw className="w-5 h-5" />}
            title="مزامنة شاملة"
            description="تُصلح السيارات وقطع الغيار: الصور + النصوص الكورية + الحقول الفارغة + تحديث البيانات القديمة"
            color="gold"
            loading={syncLoading === 'full'}
            onClick={() => runAction('full', () => api.import.fullSync(20), 'المزامنة الشاملة')}
          />

          {/* إصلاح الصور فقط */}
          <SyncActionCard
            icon={<ImageIcon className="w-5 h-5" />}
            title="إصلاح الصور"
            description="تُحمّل الصور الخارجية محلياً وتُضيف علامة مائية HM CAR. تُصلح أيضاً حقول mainImage الفارغة"
            color="blue"
            loading={syncLoading === 'images'}
            onClick={() => runAction('images', () => api.import.fixImages(), 'إصلاح الصور')}
          />

          {/* مسح الروابط الخارجية */}
          <SyncActionCard
            icon={<FileSearch className="w-5 h-5" />}
            title="مسح الروابط الخارجية"
            description="يحول externalUrl إلى externalRef الداخلي لمنع ظهور روابط Encar في الموقع"
            color="purple"
            loading={syncLoading === 'clearUrls'}
            onClick={() => runAction('clearUrls', () => api.import.clearExternalUrls(), 'مسح الروابط')}
          />

          {/* فحص الصحة */}
          <SyncActionCard
            icon={<Activity className="w-5 h-5" />}
            title="إعادة فحص الصحة"
            description="يُعيد حساب إحصائيات المشاكل دون تغيير أي بيانات"
            color="green"
            loading={healthLoading}
            onClick={fetchHealth}
          />
        </div>
      </div>

      {/* نتيجة العملية */}
      <AnimatePresence>
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border ${
              syncResult.success
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-start gap-3">
              {syncResult.success
                ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              }
              <p className="text-xs font-black leading-relaxed">{syncResult.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ملاحظة مهمة */}
      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-400/80 leading-relaxed font-medium">
          أدوات المزامنة تعمل على البيانات القديمة فقط. السيارات والقطع الجديدة تُعالَج تلقائياً عند الاستيراد. يُنصح بتشغيل المزامنة الشاملة بعد كل تحديث للنظام يُضيف حقولاً جديدة.
        </p>
      </div>
    </div>
  );
}

// ─── بطاقة أداة المزامنة ──────────────────────────────────────

function SyncActionCard({
  icon, title, description, color, loading, onClick
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'gold' | 'blue' | 'purple' | 'green';
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    gold: { bg: 'bg-luxury-gold/5', border: 'border-luxury-gold/20', hover: 'hover:border-luxury-gold/40', text: 'text-luxury-gold', btn: 'bg-luxury-gold text-black hover:bg-white' },
    blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40', text: 'text-blue-400', btn: 'bg-blue-500 text-white hover:bg-blue-400' },
    purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40', text: 'text-purple-400', btn: 'bg-purple-500 text-white hover:bg-purple-400' },
    green: { bg: 'bg-green-500/5', border: 'border-green-500/20', hover: 'hover:border-green-500/40', text: 'text-green-400', btn: 'bg-green-500 text-white hover:bg-green-400' },
  };
  const c = colors[color];

  return (
    <div className={`p-5 rounded-2xl ${c.bg} border ${c.border} ${c.hover} transition-all duration-300 space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-white/5 ${c.text}`}>{icon}</div>
        <h4 className="font-black text-sm text-white">{title}</h4>
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed">{description}</p>
      <button
        onClick={onClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${c.btn}`}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        {loading ? 'جاري التنفيذ...' : title}
      </button>
    </div>
  );
}

// ─── دوال مساعدة لعرض أسماء المشاكل ──────────────────────────

function getIssueLabelCar(key: string): string {
  const map: Record<string, string> = {
    noImages: 'سيارات بلا صور',
    externalImages: 'صور خارجية',
    missingMainImage: 'mainImage مفقود',
    koreanText: 'نص كوري',
    noSpecs: 'specs مفقود',
    hasExternalUrl: 'externalUrl موجود',
  };
  return map[key] || key;
}

function getIssueLabelPart(key: string): string {
  const map: Record<string, string> = {
    noImages: 'قطع بلا صور',
    externalImages: 'صور خارجية',
    missingImgField: 'حقل img مفقود',
  };
  return map[key] || key;
}
