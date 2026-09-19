'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Wrench, Sparkles, Link2, Loader2, CheckCircle,
  AlertCircle, Edit3, Download, Globe, Save, AlertTriangle, Package
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import MultiImageUploader from '../../../../components/admin/MultiImageUploader';

type Mode = 'url' | 'manual';

export default function ImportPartsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('url');

  // ── URL import state ──
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlSuccess, setUrlSuccess] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Manual state ──
  const [images, setImages] = useState<string[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manual, setManual] = useState({
    name: '', partType: 'Engine', carMake: '', carModel: '',
    year: new Date().getFullYear(), price: 0, stockQty: 1,
    condition: 'New', description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManual(prev => ({
      ...prev,
      [name]: ['year', 'price', 'stockQty'].includes(name) ? Number(value) : value
    }));
  };

  // ── URL Import ──
  const handleUrlImport = async () => {
    if (!url.trim()) { setUrlError('أدخل رابطاً صحيحاً'); return; }
    setUrlLoading(true); setUrlError(''); setUrlSuccess(''); setPreviewData(null);
    try {
      const res = await api.import.preview(url, 'part');
      const d = res.data as any;
      if (d?.success) {
        setPreviewData(d.data);
        setIsDuplicate(!!d.duplicate);
        setUrlSuccess(d.duplicate
          ? '⚠️ هذه القطعة موجودة مسبقاً — ستُحدَّث بياناتها'
          : '✅ تم استخراج البيانات — راجع ثم اضغط "حفظ القطعة"'
        );
      } else {
        setUrlError(d?.error || 'فشل استخراج البيانات. جرّب وضع الإدخال اليدوي.');
      }
    } catch (e: any) {
      setUrlError(e.message || 'حدث خطأ في الاتصال');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleUrlSave = async () => {
    if (!previewData) return;
    setSaveLoading(true);
    try {
      const res = await api.import.save(previewData, 'part');
      const d = res.data as any;
      if (d?.success) {
        setUrlSuccess('✅ تم الحفظ بنجاح! جاري التوجيه...');
        const id = d?.data?._id || d?.data?.id;
        setTimeout(() => router.push(id ? `/admin/parts/${id}` : '/admin/parts'), 1000);
        setPreviewData(null);
      } else {
        setUrlError(d?.error || 'فشل الحفظ');
      }
    } catch (e: any) {
      setUrlError(e.message || 'حدث خطأ');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Manual Save ──
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { setManualError('أضف صورة واحدة على الأقل'); return; }
    setManualLoading(true); setManualError('');
    try {
      const res = await api.parts.create({
        ...manual,
        images,
        img: images[0],
        image: images[0],
        inStock: true,
        source: 'manual',
      });
      if (res.error) throw new Error(res.error);
      setManualSuccess(true);
      setTimeout(() => router.push('/admin/parts'), 1200);
    } catch (err: any) {
      setManualError(err.message || 'فشل الحفظ');
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Link href="/admin/import" className="hover:text-white transition-colors">نظام الاستيراد</Link>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-white/70 font-bold">استيراد قطع الغيار</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)] shrink-0">
          <Wrench className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            استيراد <span className="text-blue-400">قطع الغيار</span>
          </h1>
          <p className="text-white/40 mt-2 font-medium text-sm">
            استورد قطعة من رابط أو أضفها يدوياً في المخزون
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-3">
        {[
          { key: 'url' as Mode, icon: Globe, label: 'استيراد من رابط', sub: 'AutoSpare · أي موقع' },
          { key: 'manual' as Mode, icon: Edit3, label: 'إدخال يدوي', sub: 'أدخل البيانات مباشرة' },
        ].map(({ key, icon: Icon, label, sub }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
              mode === key
                ? 'bg-blue-500/10 border-blue-500/30 text-white'
                : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === key ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/30'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm">{label}</p>
              <p className="text-xs text-white/30 mt-0.5">{sub}</p>
            </div>
            {mode === key && <div className="mr-auto w-2 h-2 rounded-full bg-blue-400" />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── URL Mode ── */}
        {mode === 'url' && (
          <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-400/80 font-medium">
                إذا فشل الاستيراد التلقائي، استخدم وضع <strong>الإدخال اليدوي</strong> للإضافة المباشرة.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl space-y-4">
              <label className="block text-xs font-black text-white/50 uppercase tracking-widest">
                رابط صفحة القطعة
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="url" value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                    placeholder="https://autospare.com.eg/..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl pr-11 pl-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-400/50 font-mono"
                    dir="ltr"
                  />
                </div>
                <button onClick={handleUrlImport} disabled={urlLoading || !url.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 text-white font-black text-sm hover:bg-blue-400 transition-all disabled:opacity-50 shrink-0">
                  {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {urlLoading ? 'جاري...' : 'استيراد'}
                </button>
              </div>

              <AnimatePresence>
                {urlError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p>{urlError}</p>
                      {urlError.includes('فشل') && (
                        <button onClick={() => setMode('manual')} className="mt-2 underline text-red-300 hover:text-white">
                          ← انتقل للإدخال اليدوي
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
                {urlSuccess && !urlError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
                      isDuplicate ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                    {isDuplicate ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                    {urlSuccess}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preview */}
            <AnimatePresence>
              {previewData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white/[0.02] border border-blue-500/20 p-6 rounded-3xl space-y-5">
                  <h3 className="font-black text-blue-400 flex items-center gap-2">
                    <Package className="w-4 h-4" /> معاينة البيانات
                  </h3>

                  {previewData.images?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 font-bold mb-3">الصور ({previewData.images.length})</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {previewData.images.slice(0, 6).map((img: string, i: number) => (
                          <img key={i} src={`/api/v2/image-proxy?url=${encodeURIComponent(img)}`}
                            alt="" className="h-20 w-28 object-cover rounded-xl shrink-0 border border-white/10"
                            onError={e => { (e.target as HTMLImageElement).src = img; }} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <p className="text-xs font-black text-blue-400 mb-2">💰 السعر بالريال (يمكن التعديل)</p>
                    <input type="number" defaultValue={previewData.price || ''}
                      onChange={e => setPreviewData((d: any) => ({ ...d, price: Number(e.target.value) }))}
                      className="w-full bg-black/50 border border-blue-400/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-400 font-mono"
                      dir="ltr" placeholder="0" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['الاسم', previewData.name || previewData.title],
                      ['الفئة', previewData.category],
                    ].map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-black text-white/30 mb-1">{k}</p>
                        <p className="text-xs font-bold text-white truncate">{v || '—'}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={handleUrlSave} disabled={saveLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-500 text-white font-black text-sm hover:bg-blue-400 transition-all disabled:opacity-50">
                      {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isDuplicate ? 'تحديث وحفظ' : 'حفظ القطعة'}
                    </button>
                    <button onClick={() => { setPreviewData(null); setUrlSuccess(''); }}
                      className="px-5 py-3.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm font-bold">
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Manual Mode ── */}
        {mode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl">
              {manualSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-blue-400">تمت الإضافة بنجاح!</h3>
                  <p className="text-white/40 text-sm">جاري التوجيه لقائمة قطع الغيار...</p>
                </div>
              ) : (
                <form onSubmit={handleManualSave} className="space-y-7">
                  {manualError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {manualError}
                    </div>
                  )}

                  {/* Basic Info */}
                  <div>
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5" /> معلومات القطعة
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-white/50 mb-1.5">اسم القطعة *</label>
                        <input type="text" name="name" required value={manual.name} onChange={handleChange}
                          placeholder="مثال: فلتر زيت تويوتا كامري"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">نوع القطعة</label>
                        <select name="partType" value={manual.partType} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors">
                          <option value="Engine">محرك</option>
                          <option value="Brakes">مكابح</option>
                          <option value="Suspension">تعليق</option>
                          <option value="Electrical">كهرباء</option>
                          <option value="Body">هيكل</option>
                          <option value="Transmission">ناقل حركة</option>
                          <option value="Cooling">تبريد</option>
                          <option value="Exhaust">عادم</option>
                          <option value="Filters">فلاتر</option>
                          <option value="Accessories">إكسسوارات</option>
                          <option value="Other">أخرى</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الحالة</label>
                        <select name="condition" value={manual.condition} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors">
                          <option value="New">جديد</option>
                          <option value="Used">مستعمل</option>
                          <option value="Refurbished">مجدد</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">ماركة السيارة المناسبة</label>
                        <input type="text" name="carMake" value={manual.carMake} onChange={handleChange}
                          placeholder="Toyota / BMW / Mercedes"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">موديل السيارة</label>
                        <input type="text" name="carModel" value={manual.carModel} onChange={handleChange}
                          placeholder="Camry / X5 / C200"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">سنة التصنيع</label>
                        <input type="number" name="year" min={1990} max={new Date().getFullYear() + 2} value={manual.year} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Stock */}
                  <div className="pt-5 border-t border-white/5">
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-4">السعر والمخزون</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">السعر (ريال) *</label>
                        <input type="number" name="price" required min={0} value={manual.price} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" dir="ltr" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الكمية في المخزون</label>
                        <input type="number" name="stockQty" min={1} value={manual.stockQty} onChange={handleChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="pt-5 border-t border-white/5">
                    <MultiImageUploader images={images} onChange={setImages} maxImages={10}
                      label="صور القطعة *"
                      hint="الصورة الأولى هي الصورة الرئيسية — حتى 10 صور"
                    />
                  </div>

                  {/* Description */}
                  <div className="pt-5 border-t border-white/5">
                    <label className="block text-xs font-bold text-white/50 mb-1.5">الوصف</label>
                    <textarea name="description" rows={3} value={manual.description} onChange={handleChange}
                      placeholder="تفاصيل إضافية عن القطعة..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400/50 transition-colors resize-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Link href="/admin/parts"
                      className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm font-bold">
                      إلغاء
                    </Link>
                    <button type="submit" disabled={manualLoading}
                      className="flex items-center gap-2 bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-blue-400 transition-all disabled:opacity-50">
                      {manualLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {manualLoading ? 'جاري الحفظ...' : 'حفظ القطعة'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
