'use client';

/**
 * ImportSystem - نظام استيراد السيارات وقطع الغيار من الروابط لـ CAR X
 * استيراد ذكي مع ضغط الصور وعدم التكرار، بتصميم فاخر أسود وذهبي
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, CheckCircle, AlertCircle,
  Loader2, Image as ImageIcon, Car, Wrench, X, Eye,
  Download, Zap, Shield, Info
} from 'lucide-react';
import { api } from '../../lib/api';

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
      setResult({
        success: false,
        message: 'الرجاء إدخال رابط صحيح'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.import.preview(url, type);

      if (res.data?.success) {
        setPreviewData(res.data.data);
        setShowPreview(true);
        setResult({
          success: true,
          message: res.data.duplicate 
            ? 'تنبيه: هذا العنصر موجود مسبقاً في النظام (رابط مكرر)'
            : 'تم استخراج البيانات بنجاح',
          data: res.data.data,
          images: res.data.images,
          duplicate: res.data.duplicate
        });
      } else {
        setResult({
          success: false,
          message: res.error || res.data?.error || 'فشل الاستيراد'
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'حدث خطأ أثناء الاتصال بالخادم'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      // حفظ كسيارة نشطة ومرئية للعملاء فوراً
      const dataToSave = {
        ...previewData,
        isActive: true,
        status: 'available',
      };
      const res = await api.import.save(dataToSave, type);

      if (res.data?.success) {
        setResult({
          success: true,
          message: `✅ تم النشر في المعرض! السيارة ظاهرة الآن للعملاء.`
        });
        onImportComplete?.(res.data.data);
        
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
      setResult({
        success: false,
        message: error.message || 'حدث خطأ تقني أثناء الحفظ'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white text-right" dir="rtl">
      {/* رأس المكون */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-luxury-gold flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          {type === 'car' ? (
            <Car className="w-7 h-7 text-black" />
          ) : (
            <Wrench className="w-7 h-7 text-black" />
          )}
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
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-luxury-gold/20 transition-all duration-300"
              >
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
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري معالجة الرابط واستخراج البيانات...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>بدء استيراد البيانات</span>
              </>
            )}
          </button>

          {showPreview && !result?.duplicate && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-luxury-gold hover:bg-white disabled:opacity-50 text-black font-black text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>نشر في المعرض</span>
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
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <p className="text-xs font-black">
                {result.message}
              </p>
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
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
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

// مكون معاينة السيارة المستخرجة
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
                <img src={img} alt={`صورة السيارة ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
        <InfoItem label="السعر المحدد" value={data.price ? `${Number(data.price).toLocaleString('ar-SA')} ر.س` : 'لم يحدد بعد'} />
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

// مكون معاينة قطعة الغيار المستخرجة
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
                <img src={img} alt={`صورة القطعة ${idx + 1}`} className="max-w-full max-h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تفاصيل قطعة الغيار */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="اسم القطعة" value={data.name || data.title} />
        <InfoItem label="رقم القطعة (Part Number)" value={data.partNumber} />
        <InfoItem label="فئة قطعة الغيار" value={data.category} />
        <InfoItem label="السعر" value={data.price ? `${data.price.toLocaleString('ar-SA')} ر.س` : 'سيتم تحديده لاحقاً'} />
        <InfoItem label="الكمية المتوفرة" value={data.stock} />
        <InfoItem label="رابط المصدر" value={data.sourceUrl} isLink />
      </div>
    </div>
  );
}

// مكون فرعي لعرض خانات المعاينة
function InfoItem({ label, value, isLink = false }: { label: string; value: any; isLink?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
      <p className="text-[10px] font-black text-white/40 mb-1">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-luxury-gold hover:underline truncate block max-w-full dir-ltr">
          {value || '—'}
        </a>
      ) : (
        <p className="text-xs font-bold text-white truncate">{value || '—'}</p>
      )}
    </div>
  );
}
