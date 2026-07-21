'use client';

/**
 * ImportSystem - نظام استيراد السيارات وقطع الغيار من الروابط
 * مع نموذج تعديل كامل قبل الحفظ
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link as LinkIcon, CheckCircle, AlertCircle,
  Loader, Image as ImageIcon, Car, Wrench, X, Edit3,
  Download, Zap, Shield, RefreshCw, Trash2, DollarSign,
  Package, Hash, Tag, FileText, Calendar, Gauge
} from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api-original';

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

// حالة النموذج الافتراضي للسيارة
const defaultCarForm = {
  title: '', make: '', model: '', year: new Date().getFullYear(),
  price: 0, mileage: 0, fuelType: 'Petrol', transmission: 'Automatic',
  color: '', description: '', images: [] as string[],
};

// حالة النموذج الافتراضي لقطع الغيار
const defaultPartForm = {
  name: '', partNumber: '', category: 'Engine', brand: '',
  price: 0, stock: 1, condition: 'New', warranty: '',
  description: '', images: [] as string[],
};

export default function ImportSystem({ type, onImportComplete }: ImportSystemProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [carForm, setCarForm] = useState({ ...defaultCarForm });
  const [partForm, setPartForm] = useState({ ...defaultPartForm });
  const [sourceUrl, setSourceUrl] = useState('');

  // مصادر الاستيراد المدعومة
  const supportedSources = [
    { name: 'Copart', domain: 'copart.com', icon: Car },
    { name: 'IAAI', domain: 'iaai.com', icon: Car },
    { name: 'Korean (Encar)', domain: 'encar.com', icon: Car },
    { name: 'أي رابط آخر', domain: 'any', icon: LinkIcon },
  ];

  const usdToSar = 3.75;

  const handleImport = async () => {
    if (!url.trim()) {
      setResult({ success: false, message: 'الرجاء إدخال رابط صحيح' });
      return;
    }
    setLoading(true);
    setResult(null);
    setShowEditor(false);
    try {
      const data = await api.import.preview(url, type);
      if (data.success) {
        setSourceUrl(url);
        if (type === 'car') {
          setCarForm({
            title: data.data?.title || '',
            make: data.data?.make || '',
            model: data.data?.model || '',
            year: data.data?.year || new Date().getFullYear(),
            price: data.data?.price || 0,
            mileage: data.data?.mileage || 0,
            fuelType: data.data?.fuelType || 'Petrol',
            transmission: data.data?.transmission || 'Automatic',
            color: data.data?.color || '',
            description: data.data?.description || '',
            images: data.images || data.data?.images || [],
          });
        } else {
          setPartForm({
            name: data.data?.name || data.data?.title || '',
            partNumber: data.data?.partNumber || `IMP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            category: data.data?.category || 'Engine',
            brand: data.data?.brand || '',
            price: data.data?.price || 0,
            stock: data.data?.stock || 1,
            condition: data.data?.condition || 'New',
            warranty: data.data?.warranty || '',
            description: data.data?.description || '',
            images: data.images || data.data?.images || [],
          });
        }
        setShowEditor(true);
        setResult({
          success: true,
          message: data.duplicate
            ? '⚠️ تنبيه: هذا العنصر موجود مسبقاً في النظام'
            : '✅ تم استخراج البيانات — راجع وعدّل قبل الحفظ',
          duplicate: data.duplicate
        });
      } else {
        setResult({ success: false, message: data.error || 'فشل استخراج البيانات' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'حدث خطأ أثناء الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = type === 'car'
        ? { ...carForm, sourceUrl, price: Number(carForm.price), year: Number(carForm.year), mileage: Number(carForm.mileage) }
        : { ...partForm, sourceUrl, price: Number(partForm.price), stock: Number(partForm.stock) };

      const data = await api.import.save(payload, type);
      if (data.success) {
        setResult({ success: true, message: '🎉 تم الحفظ بنجاح!' });
        onImportComplete?.(data.data);
        setTimeout(() => {
          setUrl(''); setShowEditor(false); setResult(null);
          setCarForm({ ...defaultCarForm }); setPartForm({ ...defaultPartForm });
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'فشل الحفظ' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'خطأ تقني أثناء الحفظ' });
    } finally {
      setSaving(false);
    }
  };

  const removeImage = (idx: number) => {
    if (type === 'car') {
      setCarForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    } else {
      setPartForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    }
  };

  const currentImages = type === 'car' ? carForm.images : partForm.images;

  return (
    <div className="space-y-5">
      {/* رأس النظام */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A96E] to-[#b8934d] flex items-center justify-center shadow-lg shadow-[#C9A96E]/20">
          {type === 'car' ? <Car className="w-6 h-6 text-black" /> : <Wrench className="w-6 h-6 text-black" />}
        </div>
        <div>
          <h2 className="text-xl font-black text-white">استيراد {type === 'car' ? 'السيارات' : 'قطع الغيار'}</h2>
          <p className="text-xs text-gray-400">استيراد من رابط خارجي مع إمكانية التعديل قبل الحفظ</p>
        </div>
      </div>

      {/* المصادر المدعومة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {supportedSources.map((source, idx) => {
          const Icon = source.icon;
          return (
            <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/8 text-sm">
              <Icon className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{source.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{source.domain}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* نموذج الرابط */}
      <div className="bg-white/3 rounded-2xl p-4 border border-white/8 space-y-3">
        <label className="block text-sm font-bold text-white mb-1">
          رابط {type === 'car' ? 'السيارة' : 'القطعة'}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url" value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              placeholder="https://encar.com/..."
              disabled={loading}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#C9A96E]/50 text-white placeholder-gray-500 outline-none transition-all text-sm disabled:opacity-50"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleImport} disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b8934d] hover:from-[#b8934d] hover:to-[#a7823c] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black text-sm transition-all shadow-lg"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{loading ? 'جاري...' : 'استيراد'}</span>
          </motion.button>
        </div>

        {/* مزايا */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: Zap, label: 'سريع', color: 'text-yellow-400' },
            { icon: ImageIcon, label: 'ضغط الصور', color: 'text-blue-400' },
            { icon: Shield, label: 'بدون تكرار', color: 'text-green-400' },
            { icon: Edit3, label: 'قابل للتعديل', color: 'text-purple-400' },
          ].map((f, i) => (
            <div key={i} className={`flex items-center gap-1 text-xs font-bold ${f.color}`}>
              <f.icon className="w-3 h-3" /> {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* نتيجة الاستيراد */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold ${result.success
              ? result.duplicate ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {result.success
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{result.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* محرر البيانات */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="bg-gradient-to-br from-zinc-900/80 to-black rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* رأس المحرر */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-black text-white">مراجعة وتعديل البيانات</h3>
                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">كل الحقول قابلة للتعديل</span>
              </div>
              <button onClick={() => { setShowEditor(false); setResult(null); }}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* معرض الصور */}
              {currentImages.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    الصور ({currentImages.length}) — اضغط على الصورة لحذفها
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {currentImages.slice(0, 12).map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-950 group cursor-pointer" onClick={() => removeImage(idx)}>
                        <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/60 transition-all flex items-center justify-center">
                          <Trash2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        {idx === 0 && (
                          <span className="absolute top-1 right-1 text-[8px] bg-blue-500 text-white px-1 rounded font-bold">رئيسية</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* حقول السيارة */}
              {type === 'car' ? (
                <div className="space-y-4">
                  {/* العنوان */}
                  <FormField label="العنوان" icon={<FileText className="w-3.5 h-3.5 text-gray-400" />}>
                    <input value={carForm.title} onChange={e => setCarForm(p => ({ ...p, title: e.target.value }))}
                      className="form-input" placeholder="مثال: Toyota Camry 2022" />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="الماركة" icon={<Car className="w-3.5 h-3.5 text-gray-400" />}>
                      <input value={carForm.make} onChange={e => setCarForm(p => ({ ...p, make: e.target.value }))}
                        className="form-input" placeholder="Toyota" />
                    </FormField>
                    <FormField label="الموديل" icon={<Car className="w-3.5 h-3.5 text-gray-400" />}>
                      <input value={carForm.model} onChange={e => setCarForm(p => ({ ...p, model: e.target.value }))}
                        className="form-input" placeholder="Camry" />
                    </FormField>
                    <FormField label="السنة" icon={<Calendar className="w-3.5 h-3.5 text-gray-400" />}>
                      <input type="number" value={carForm.year} onChange={e => setCarForm(p => ({ ...p, year: Number(e.target.value) }))}
                        className="form-input" min={1990} max={2030} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="السعر (ريال سعودي)" icon={<DollarSign className="w-3.5 h-3.5 text-gray-400" />}>
                      <input type="number" value={carForm.price} onChange={e => setCarForm(p => ({ ...p, price: Number(e.target.value) }))}
                        className="form-input" min={0} step={100} />
                      {carForm.price > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">≈ ${(carForm.price / usdToSar).toLocaleString('en', { maximumFractionDigits: 0 })} دولار</p>
                      )}
                    </FormField>
                    <FormField label="عداد الكيلومترات" icon={<Gauge className="w-3.5 h-3.5 text-gray-400" />}>
                      <input type="number" value={carForm.mileage} onChange={e => setCarForm(p => ({ ...p, mileage: Number(e.target.value) }))}
                        className="form-input" min={0} />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="نوع الوقود">
                      <select value={carForm.fuelType} onChange={e => setCarForm(p => ({ ...p, fuelType: e.target.value }))} className="form-input">
                        {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'].map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </FormField>
                    <FormField label="ناقل الحركة">
                      <select value={carForm.transmission} onChange={e => setCarForm(p => ({ ...p, transmission: e.target.value }))} className="form-input">
                        {['Automatic', 'Manual', 'CVT', 'Semi-Auto'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </FormField>
                    <FormField label="اللون">
                      <input value={carForm.color} onChange={e => setCarForm(p => ({ ...p, color: e.target.value }))}
                        className="form-input" placeholder="أبيض" />
                    </FormField>
                  </div>

                  <FormField label="الوصف" icon={<FileText className="w-3.5 h-3.5 text-gray-400" />}>
                    <textarea value={carForm.description} onChange={e => setCarForm(p => ({ ...p, description: e.target.value }))}
                      className="form-input min-h-[80px] resize-none" rows={3} placeholder="وصف السيارة..." />
                  </FormField>
                </div>
              ) : (
                /* حقول قطع الغيار */
                <div className="space-y-4">
                  <FormField label="اسم القطعة" icon={<Package className="w-3.5 h-3.5 text-gray-400" />}>
                    <input value={partForm.name} onChange={e => setPartForm(p => ({ ...p, name: e.target.value }))}
                      className="form-input" placeholder="مثال: فلتر زيت Toyota" />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="رقم القطعة" icon={<Hash className="w-3.5 h-3.5 text-gray-400" />}>
                      <input value={partForm.partNumber} onChange={e => setPartForm(p => ({ ...p, partNumber: e.target.value }))}
                        className="form-input" placeholder="04152-YZZA6" />
                    </FormField>
                    <FormField label="الفئة" icon={<Tag className="w-3.5 h-3.5 text-gray-400" />}>
                      <select value={partForm.category} onChange={e => setPartForm(p => ({ ...p, category: e.target.value }))} className="form-input">
                        {['Engine', 'Brakes', 'Suspension', 'Electrical', 'Body', 'Transmission', 'Cooling', 'Exhaust', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="السعر (ريال)" icon={<DollarSign className="w-3.5 h-3.5 text-gray-400" />}>
                      <input type="number" value={partForm.price} onChange={e => setPartForm(p => ({ ...p, price: Number(e.target.value) }))}
                        className="form-input" min={0} step={1} />
                      {partForm.price > 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">≈ ${(partForm.price / usdToSar).toFixed(2)} دولار</p>
                      )}
                    </FormField>
                    <FormField label="الكمية المتوفرة">
                      <input type="number" value={partForm.stock} onChange={e => setPartForm(p => ({ ...p, stock: Number(e.target.value) }))}
                        className="form-input" min={1} />
                    </FormField>
                    <FormField label="الحالة">
                      <select value={partForm.condition} onChange={e => setPartForm(p => ({ ...p, condition: e.target.value }))} className="form-input">
                        {['New', 'Used', 'Refurbished'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="العلامة التجارية">
                      <input value={partForm.brand} onChange={e => setPartForm(p => ({ ...p, brand: e.target.value }))}
                        className="form-input" placeholder="Toyota" />
                    </FormField>
                    <FormField label="الضمان">
                      <input value={partForm.warranty} onChange={e => setPartForm(p => ({ ...p, warranty: e.target.value }))}
                        className="form-input" placeholder="12 شهر" />
                    </FormField>
                  </div>

                  <FormField label="الوصف">
                    <textarea value={partForm.description} onChange={e => setPartForm(p => ({ ...p, description: e.target.value }))}
                      className="form-input min-h-[70px] resize-none" rows={2} placeholder="وصف القطعة..." />
                  </FormField>
                </div>
              )}

              {/* أزرار الحفظ */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm transition-all shadow-lg shadow-green-900/30"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {saving ? 'جاري الحفظ...' : `حفظ ${type === 'car' ? 'السيارة' : 'القطعة'}`}
                </motion.button>
                <button
                  onClick={() => { setShowEditor(false); setResult(null); }}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-sm font-bold transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS مضمّن للحقول */}
      <style jsx global>{`
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: rgba(201, 169, 110, 0.5);
        }
        .form-input option {
          background: #1a1a2e;
          color: white;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
