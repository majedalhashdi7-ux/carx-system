'use client';

/**
 * ImportSystem - نظام استيراد السيارات وقطع الغيار من الروابط
 * استيراد ذكي مع ضغط الصور وعدم التكرار
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, Upload, CheckCircle, AlertCircle,
  Loader, Image as ImageIcon, Car, Wrench, X, Eye,
  Download, Zap, Shield, Info, RefreshCw
} from 'lucide-react';
import Image from 'next/image';

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
    { name: 'Korean Auctions', domain: 'encar.com', icon: Car },
    { name: 'Custom URL', domain: 'any', icon: LinkIcon },
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
      // استدعاء API الاستيراد
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type })
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data.data);
        setShowPreview(true);
        setResult({
          success: true,
          message: data.duplicate 
            ? 'تم العثور على هذا العنصر مسبقاً في النظام'
            : 'تم استخراج البيانات بنجاح',
          data: data.data,
          images: data.images,
          duplicate: data.duplicate
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'فشل الاستيراد'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'حدث خطأ أثناء الاستيراد'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/${type}s`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData)
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: 'تم الحفظ بنجاح!'
        });
        onImportComplete?.(data.data);
        // إعادة تعيين النموذج
        setTimeout(() => {
          setUrl('');
          setPreviewData(null);
          setShowPreview(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'فشل الحفظ'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'حدث خطأ أثناء الحفظ'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس النظام */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
          {type === 'car' ? (
            <Car className="w-7 h-7 text-white" />
          ) : (
            <Wrench className="w-7 h-7 text-white" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            استيراد {type === 'car' ? 'السيارات' : 'قطع الغيار'}
          </h2>
          <p className="text-gray-400">
            استيراد من الروابط مع ضغط الصور تلقائياً
          </p>
        </div>
      </div>

      {/* المصادر المدعومة */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-bold text-white">المصادر المدعومة</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {supportedSources.map((source, idx) => {
            const Icon = source.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <Icon className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-sm font-bold text-white">{source.name}</p>
                  <p className="text-xs text-gray-500">{source.domain}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* نموذج الاستيراد */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-white/10">
        <div className="space-y-4">
          {/* حقل الرابط */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              رابط {type === 'car' ? 'السيارة' : 'القطعة'}
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/item/12345"
                disabled={loading}
                className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50"
              />
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* الميزات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-bold">استيراد سريع</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-bold">ضغط الصور</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-bold">عدم التكرار</span>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg hover:shadow-red-500/50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>جاري الاستيراد...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>استيراد</span>
                </>
              )}
            </motion.button>

            {showPreview && !result?.duplicate && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                <span>حفظ</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* نتيجة الاستيراد */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl border ${
              result.success
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* معاينة البيانات */}
      <AnimatePresence>
        {showPreview && previewData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">معاينة البيانات</h3>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {type === 'car' ? (
              <CarPreview data={previewData} />
            ) : (
              <PartPreview data={previewData} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// معاينة السيارة
function CarPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* الصور */}
      {data.images && data.images.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">الصور ({data.images.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {data.images.slice(0, 8).map((img: string, idx: number) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-zinc-950">
                <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* المعلومات */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="العنوان" value={data.title} />
        <InfoItem label="الماركة" value={data.make} />
        <InfoItem label="الموديل" value={data.model} />
        <InfoItem label="السنة" value={data.year} />
        <InfoItem label="السعر" value={data.price ? `${data.price.toLocaleString()} ر.س` : '—'} />
        <InfoItem label="الكيلومترات" value={data.mileage ? `${data.mileage.toLocaleString()} كم` : '—'} />
        <InfoItem label="نوع الوقود" value={data.fuelType} />
        <InfoItem label="ناقل الحركة" value={data.transmission} />
      </div>

      {/* الوصف */}
      {data.description && (
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">الوصف</p>
          <p className="text-sm text-gray-300 leading-relaxed">{data.description}</p>
        </div>
      )}
    </div>
  );
}

// معاينة قطعة الغيار
function PartPreview({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* الصور */}
      {data.images && data.images.length > 0 && (
        <div>
          <p className="text-sm font-bold text-gray-400 mb-2">الصور ({data.images.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {data.images.slice(0, 4).map((img: string, idx: number) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-950">
                <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-contain p-2" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* المعلومات */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="الاسم" value={data.name} />
        <InfoItem label="رقم القطعة" value={data.partNumber} />
        <InfoItem label="الفئة" value={data.category} />
        <InfoItem label="العلامة التجارية" value={data.brand} />
        <InfoItem label="السعر" value={data.price ? `${data.price.toLocaleString()} ر.س` : '—'} />
        <InfoItem label="الكمية" value={data.stock} />
        <InfoItem label="الحالة" value={data.condition} />
        <InfoItem label="الضمان" value={data.warranty} />
      </div>
    </div>
  );
}

// عنصر معلومات
function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value || '—'}</p>
    </div>
  );
}
