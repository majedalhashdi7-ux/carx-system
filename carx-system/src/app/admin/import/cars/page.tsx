'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Car, Sparkles, Link2, Loader2, CheckCircle,
  AlertCircle, Edit3, Download, Globe, Plus, Save, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import MultiImageUploader from '../../../../components/admin/MultiImageUploader';

// ── وضع الاستيراد: رابط أو إدخال يدوي ──
type Mode = 'url' | 'manual';

export default function ImportCarsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('url');

  // ── حالة الاستيراد بالرابط ──
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlSuccess, setUrlSuccess] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── حالة الإدخال اليدوي ──
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [manual, setManual] = useState({
    title: '', make: '', model: '',
    year: new Date().getFullYear(),
    price: 0, priceKrw: 0, mileage: 0,
    category: 'sedan', fuelType: 'petrol',
    transmission: 'automatic', color: '', description: '',
  });

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setManual(prev => ({
      ...prev,
      [name]: ['year', 'price', 'priceKrw', 'mileage'].includes(name) ? Number(value) : value
    }));
  };

  // ── استيراد من رابط ──
  const handleUrlImport = async () => {
    if (!url.trim()) { setUrlError('أدخل رابطاً صحيحاً'); return; }
    setUrlLoading(true); setUrlError(''); setUrlSuccess(''); setPreviewData(null);
    try {
      const res = await api.import.preview(url, 'car');
      const d = res.data as any;
      if (d?.success) {
        setPreviewData(d.data);
        setIsDuplicate(!!d.duplicate);
        setUrlSuccess(d.duplicate
          ? '⚠️ هذه السيارة موجودة مسبقاً — ستُحدَّث بياناتها عند الحفظ'
          : '✅ تم استخراج البيانات — راجع البيانات ثم اضغط "نشر في المعرض"'
        );
      } else {
        setUrlError(res.error || d?.error || 'فشل استخراج البيانات من الرابط. جرّب وضع الإدخال اليدوي.');
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
      const res = await api.import.save({ ...previewData, isActive: true, status: 'available' }, 'car');
      const d = res.data as any;
      if (d?.success) {
        const id = d?.data?._id || d?.data?.id;
        if (id) {
          setTimeout(() => router.push(`/admin/cars/${id}/edit`), 1000);
        } else {
          setTimeout(() => router.push('/admin/cars'), 1000);
        }
        setUrlSuccess('✅ تم النشر بنجاح! جاري التوجيه لصفحة التعديل...');
        setPreviewData(null);
      } else {
        setUrlError(res.error || d?.error || 'فشل الحفظ');
      }
    } catch (e: any) {
      setUrlError(e.message || 'حدث خطأ في الحفظ');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── الإدخال اليدوي ──
  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { setManualError('أضف صورة واحدة على الأقل'); return; }
    setManualLoading(true); setManualError('');
    try {
      const res = await api.cars.create({
        ...manual,
        images,
        mainImage: images[0],
        imageUrl: images[0],
        isActive: true,
        source: 'hm_local',
      });
      if (res.error) throw new Error(res.error);
      setManualSuccess(true);
      setTimeout(() => router.push('/admin/cars'), 1200);
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
        <span className="text-white/70 font-bold">استيراد السيارات</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-luxury-gold flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)] shrink-0">
          <Car className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            استيراد <span className="text-luxury-gold">السيارات</span>
          </h1>
          <p className="text-white/40 mt-2 font-medium text-sm">
            استورد سيارة من رابط مزاد أو أدخلها يدوياً في المعرض
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex gap-3">
        {[
          { key: 'url' as Mode, icon: Globe, label: 'استيراد من رابط', sub: 'Encar · Copart · IAAI' },
          { key: 'manual' as Mode, icon: Edit3, label: 'إدخال يدوي', sub: 'أدخل البيانات مباشرة' },
        ].map(({ key, icon: Icon, label, sub }) => (
          <button key={key} onClick={() => setMode(key)}
            className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
              mode === key
                ? 'bg-luxury-gold/10 border-luxury-gold/40 text-white'
                : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mode === key ? 'bg-luxury-gold text-black' : 'bg-white/5 text-white/30'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm">{label}</p>
              <p className="text-xs text-white/30 mt-0.5">{sub}</p>
            </div>
            {mode === key && <div className="mr-auto w-2 h-2 rounded-full bg-luxury-gold" />}
          </button>
        ))}
      </div>

      {/* ── وضع الاستيراد من رابط ── */}
      <AnimatePresence mode="wait">
        {mode === 'url' && (
          <motion.div key="url" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* تلميح */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/15">
              <Sparkles className="w-4 h-4 text-luxury-gold shrink-0" />
              <p className="text-xs text-luxury-gold/80 font-medium">
                بعد الاستيراد الناجح ستنتقل لصفحة التعديل لمراجعة كافة التفاصيل قبل النشر.
                إذا فشل الاستيراد التلقائي، استخدم وضع <strong>الإدخال اليدوي</strong>.
              </p>
            </div>

            {/* حقل الرابط */}
            <div className="bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl space-y-4">
              <label className="block text-xs font-black text-white/50 uppercase tracking-widest">
                رابط صفحة السيارة
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="url" value={url} onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlImport()}
                    placeholder="https://www.encar.com/dc/dc_cardetail.do?carid=..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl pr-11 pl-4 py-3.5 text-sm text-white focus:outline-none focus:border-luxury-gold/50 font-mono"
                    dir="ltr"
                  />
                </div>
                <button onClick={handleUrlImport} disabled={urlLoading || !url.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-luxury-gold text-black font-black text-sm hover:bg-white transition-all disabled:opacity-50 shrink-0"
                >
                  {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {urlLoading ? 'جاري...' : 'استيراد'}
                </button>
              </div>

              {/* رسائل الحالة */}
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
                {urlSuccess && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
                      isDuplicate
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                    {isDuplicate ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                    {urlSuccess}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* معاينة البيانات */}
            <AnimatePresence>
              {previewData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-white/[0.02] border border-luxury-gold/20 p-6 rounded-3xl space-y-5">
                  <h3 className="font-black text-luxury-gold flex items-center gap-2">
                    <Car className="w-4 h-4" /> معاينة البيانات المستخرجة
                  </h3>

                  {/* صور */}
                  {previewData.images?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 font-bold mb-3">الصور ({previewData.images.length})</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {previewData.images.slice(0, 6).map((img: string, i: number) => (
                          <img key={i} src={`/api/v2/image-proxy?url=${encodeURIComponent(img)}`}
                            alt="" className="h-20 w-32 object-cover rounded-xl shrink-0 border border-white/10"
                            onError={e => { (e.target as HTMLImageElement).src = img; }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* تعديل السعر */}
                  <div className="bg-luxury-gold/5 border border-luxury-gold/20 rounded-2xl p-4">
                    <p className="text-xs font-black text-luxury-gold mb-2">💰 السعر بالريال السعودي (يمكن التعديل)</p>
                    <input type="number" defaultValue={previewData.price || ''}
                      onChange={e => setPreviewData((d: any) => ({ ...d, price: Number(e.target.value) }))}
                      className="w-full bg-black/50 border border-luxury-gold/30 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-luxury-gold font-mono"
                      dir="ltr" placeholder="0"
                    />
                  </div>

                  {/* تفاصيل */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['العنوان', previewData.title],
                      ['الماركة', previewData.make],
                      ['الموديل', previewData.model],
                      ['السنة', previewData.year],
                    ].map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <p className="text-[10px] font-black text-white/30 mb-1">{k}</p>
                        <p className="text-xs font-bold text-white truncate">{v || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* أزرار */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleUrlSave} disabled={saveLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-luxury-gold text-black font-black text-sm hover:bg-white transition-all disabled:opacity-50">
                      {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {isDuplicate ? 'تحديث وحفظ' : 'نشر في المعرض'}
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

        {/* ── وضع الإدخال اليدوي ── */}
        {mode === 'manual' && (
          <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl">
              {manualSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-luxury-gold flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-black text-luxury-gold">تمت الإضافة بنجاح!</h3>
                  <p className="text-white/40 text-sm">جاري التوجيه لقائمة السيارات...</p>
                </div>
              ) : (
                <form onSubmit={handleManualSave} className="space-y-7">
                  {manualError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {manualError}
                    </div>
                  )}

                  {/* المعلومات الأساسية */}
                  <div>
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Car className="w-3.5 h-3.5" /> المعلومات الأساسية
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-white/50 mb-1.5">اسم / عنوان السيارة *</label>
                        <input type="text" name="title" required value={manual.title} onChange={handleManualChange}
                          placeholder="مثال: مرسيدس G63 AMG 2024"
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الماركة *</label>
                        <input type="text" name="make" required value={manual.make} onChange={handleManualChange}
                          placeholder="Mercedes" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الموديل</label>
                        <input type="text" name="model" value={manual.model} onChange={handleManualChange}
                          placeholder="G63 AMG" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">سنة الصنع</label>
                        <input type="number" name="year" min={1990} max={new Date().getFullYear() + 2} value={manual.year} onChange={handleManualChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors" dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الكيلومترات</label>
                        <input type="number" name="mileage" min={0} value={manual.mileage} onChange={handleManualChange}
                          placeholder="0" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors" dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">اللون</label>
                        <input type="text" name="color" value={manual.color} onChange={handleManualChange}
                          placeholder="أبيض" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الفئة</label>
                        <select name="category" value={manual.category} onChange={handleManualChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors">
                          <option value="sedan">سيدان</option>
                          <option value="suv">SUV</option>
                          <option value="pickup">بيك آب</option>
                          <option value="sports">رياضية</option>
                          <option value="luxury">فاخرة</option>
                          <option value="hatchback">هاتشباك</option>
                          <option value="coupe">كوبيه</option>
                          <option value="van">فان</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">الوقود</label>
                        <select name="fuelType" value={manual.fuelType} onChange={handleManualChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors">
                          <option value="petrol">بنزين</option>
                          <option value="diesel">ديزل</option>
                          <option value="electric">كهرباء</option>
                          <option value="hybrid">هجين</option>
                          <option value="lpg">غاز (LPG)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">ناقل الحركة</label>
                        <select name="transmission" value={manual.transmission} onChange={handleManualChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors">
                          <option value="automatic">أوتوماتيك</option>
                          <option value="manual">يدوي</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* الأسعار */}
                  <div className="pt-5 border-t border-white/5">
                    <p className="text-xs font-black text-white/30 uppercase tracking-widest mb-4">الأسعار</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">السعر (ريال سعودي) *</label>
                        <input type="number" name="price" required min={0} value={manual.price} onChange={handleManualChange}
                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors" dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">السعر (وون كوري) — اختياري</label>
                        <input type="number" name="priceKrw" min={0} value={manual.priceKrw} onChange={handleManualChange}
                          placeholder="0" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/50 focus:outline-none focus:border-luxury-gold/50 transition-colors" dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* الصور */}
                  <div className="pt-5 border-t border-white/5">
                    <MultiImageUploader images={images} onChange={setImages} maxImages={15}
                      label="صور السيارة *"
                      hint="الصورة الأولى هي الصورة الرئيسية — يمكن رفع حتى 15 صورة"
                    />
                  </div>

                  {/* الوصف */}
                  <div className="pt-5 border-t border-white/5">
                    <label className="block text-xs font-bold text-white/50 mb-1.5">الوصف والملاحظات</label>
                    <textarea name="description" rows={3} value={manual.description} onChange={handleManualChange}
                      placeholder="أضف وصفاً أو ملاحظات للمشترين..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold/50 transition-colors resize-none"
                    />
                  </div>

                  {/* أزرار */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Link href="/admin/cars"
                      className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm font-bold">
                      إلغاء
                    </Link>
                    <button type="submit" disabled={manualLoading}
                      className="flex items-center gap-2 bg-luxury-gold text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-white transition-all disabled:opacity-50">
                      {manualLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {manualLoading ? 'جاري الحفظ...' : 'حفظ السيارة'}
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
