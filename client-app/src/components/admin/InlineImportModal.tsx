'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, X, RefreshCw, CheckCircle2, AlertCircle,
  Car, Layers, Gavel, ExternalLink, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/lib/ToastContext';

interface InlineImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'car' | 'part' | 'auction';
  onSuccess: () => void;
}

export default function InlineImportModal({ isOpen, onClose, type, onSuccess }: InlineImportModalProps) {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  if (!isOpen) return null;

  const titles = {
    car: isRTL ? 'استيراد سيارة من رابط (كوري / خارجي)' : 'Import Car from URL',
    part: isRTL ? 'استيراد قطعة غيار من رابط' : 'Import Spare Part from URL',
    auction: isRTL ? 'استيراد جلسة مزاد مباشر من رابط' : 'Import Auction Session from URL'
  };

  const icons = {
    car: Car,
    part: Layers,
    auction: Gavel
  };

  const IconComp = icons[type];

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !url.startsWith('http')) {
      showToast(isRTL ? 'يرجى إدخال رابط صحيح يبدأ بـ http' : 'Please enter a valid HTTP URL', 'error');
      return;
    }

    setLoading(true);
    setPreviewData(null);
    setIsDuplicate(false);

    try {
      const token = localStorage.getItem('hm_token');
      const res = await fetch('/api/v2/import/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar'
        },
        body: JSON.stringify({ url, type })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewData(data.data);
        setIsDuplicate(!!data.duplicate);
        showToast(isRTL ? '✅ تم معاينة البيانات وتعريبها بنجاح' : 'Data previewed successfully', 'success');
      } else {
        throw new Error(data.error || 'فشل الاستخراج');
      }
    } catch (err: any) {
      showToast(err.message || (isRTL ? '❌ فشل الاستخراج من الرابط' : 'Failed to extract data'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!previewData) return;
    setSaving(true);

    try {
      const token = localStorage.getItem('hm_token');
      let endpoint = '/api/v2/import/save';

      if (type === 'car') endpoint = '/api/v2/import/korean-cars';
      else if (type === 'part') endpoint = '/api/v2/import/parts';
      else if (type === 'auction') endpoint = '/api/v2/import/live-auctions';

      const bodyPayload = type === 'auction' 
        ? { targetUrl: url, limit: 20 } 
        : previewData;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar'
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (res.ok && (data.success !== false)) {
        showToast(isRTL ? '🎉 تم الاستيراد والتوقيع بالعلامة المائية وتحديث القائمة فوراً!' : 'Imported & saved successfully!', 'success');
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || data.message || 'فشل الحفظ');
      }
    } catch (err: any) {
      showToast(err.message || (isRTL ? '❌ فشل حفظ البيانات' : 'Failed to save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0c0c1e] border border-orange-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-white relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <IconComp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{titles[type]}</h3>
              <p className="text-xs text-white/40">{isRTL ? 'استيراد فوري بدون الخروج من الصفحة' : 'Instant inline import'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handlePreview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/60 mb-2">
              {isRTL ? 'رابط الموقع المستهدف (Encar / رابط خارجي):' : 'Target URL:'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={type === 'car' ? 'https://www.encar.com/dc/dc_cardetailview.do...' : 'https://...'}
                className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors dir-ltr"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 rounded-2xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isRTL ? 'معاينة واستخراج' : 'Extract Preview'}
              </button>
            </div>
          </div>
        </form>

        {/* Duplicate Warning */}
        {isDuplicate && (
          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{isRTL ? '⚠️ تنبيه: تم استيراد هذا الرابط سابقاً. يمكن إعادة استيراده لطلب تحديث.' : '⚠️ Warning: Previously imported.'}</span>
          </div>
        )}

        {/* Preview Container */}
        {previewData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-white/[0.03] border border-white/10 p-5 rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isRTL ? 'معرب ومفحوص جاهز' : 'Translated & Ready'}
                </span>
                <h4 className="text-base font-bold text-white mt-1">{previewData.title || previewData.name}</h4>
                <p className="text-xs text-white/50 line-clamp-2 mt-1">{previewData.description || (isRTL ? 'لا يوجد وصف متاح' : 'No description')}</p>
              </div>
              {previewData.price > 0 && (
                <div className="text-left shrink-0">
                  <span className="text-xs text-white/40 block">{isRTL ? 'السعر التقديري' : 'Est. Price'}</span>
                  <span className="text-lg font-black text-orange-400">{previewData.price.toLocaleString('ar-SA')} SAR</span>
                </div>
              )}
            </div>

            {/* Images Preview */}
            {previewData.images && previewData.images.length > 0 && (
              <div>
                <p className="text-xs text-white/40 font-bold mb-2">{isRTL ? `الصور المستخرجة (${previewData.images.length}) مع العلامة المائية:` : 'Images:'}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {previewData.images.slice(0, 6).map((imgUrl: string, idx: number) => (
                    <img key={idx} src={imgUrl} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0" />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 text-black font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isRTL ? 'تأكيد الحفظ المباشر وتظليل الصورة' : 'Confirm Import & Apply Watermark'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
