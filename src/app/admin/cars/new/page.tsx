'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface CarForm {
  title: string;
  make: string;
  model: string;
  year: string;
  price: string;
  priceSar: string;
  priceUsd: string;
  priceKrw: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  color: string;
  condition: string;
  source: string;
  listingType: string;
  description: string;
  images: string[];
  externalUrl: string;
}

const defaultForm: CarForm = {
  title: '',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  price: '',
  priceSar: '',
  priceUsd: '',
  priceKrw: '',
  mileage: '',
  fuelType: 'Petrol',
  transmission: 'Automatic',
  color: '',
  condition: 'good',
  source: 'korean_import',
  listingType: 'showroom',
  description: '',
  images: [''],
  externalUrl: '',
};

export default function NewCarPage() {
  const router = useRouter();
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<CarForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Auto-generate title
    if (['make', 'model', 'year'].includes(e.target.name)) {
      const updated = { ...form, [e.target.name]: e.target.value };
      if (updated.make && updated.model && updated.year) {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value, title: `${updated.make} ${updated.model} ${updated.year}` }));
      }
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...form.images];
    newImages[index] = value;
    setForm(prev => ({ ...prev, images: newImages }));
  };

  const addImage = () => setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  const removeImage = (index: number) => {
    if (form.images.length === 1) return;
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.make || !form.price) {
      setError('العنوان والماركة والسعر مطلوبة');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('carx-token');
      const body = {
        ...form,
        year: parseInt(form.year) || undefined,
        price: parseFloat(form.price) || 0,
        priceSar: form.priceSar ? parseFloat(form.priceSar) : undefined,
        priceUsd: form.priceUsd ? parseFloat(form.priceUsd) : undefined,
        priceKrw: form.priceKrw ? parseFloat(form.priceKrw) : undefined,
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
        images: form.images.filter(img => img.trim()),
      };

      const res = await fetch('/api/admin/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/cars');
      } else {
        setError(data.error || 'فشل الحفظ');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
  const labelClass = "block text-sm text-gray-400 mb-1.5";

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/cars" className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">إضافة سيارة جديدة</h1>
            <p className="text-gray-400">أضف سيارة جديدة للمعرض</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">المعلومات الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>عنوان السيارة *</label>
                <input name="title" type="text" required value={form.title} onChange={handleChange}
                  placeholder="مثال: هيونداي سوناتا 2023" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الماركة *</label>
                <input name="make" type="text" required value={form.make} onChange={handleChange}
                  placeholder="هيونداي" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الموديل</label>
                <input name="model" type="text" value={form.model} onChange={handleChange}
                  placeholder="سوناتا" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>السنة</label>
                <input name="year" type="number" min="1990" max="2030" value={form.year} onChange={handleChange} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>اللون</label>
                <input name="color" type="text" value={form.color} onChange={handleChange}
                  placeholder="أبيض" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الكيلومترات</label>
                <input name="mileage" type="number" value={form.mileage} onChange={handleChange}
                  placeholder="50000" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الحالة</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={fieldClass}>
                  <option value="excellent">ممتازة</option>
                  <option value="good">جيدة</option>
                  <option value="fair">مقبولة</option>
                  <option value="needs work">تحتاج عمل</option>
                </select>
              </div>
            </div>
          </div>

          {/* Engine */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">المحرك والمواصفات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>نوع الوقود</label>
                <select name="fuelType" value={form.fuelType} onChange={handleChange} className={fieldClass}>
                  <option value="Petrol">بنزين</option>
                  <option value="Diesel">ديزل</option>
                  <option value="Electric">كهرباء</option>
                  <option value="Hybrid">هجين</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ناقل الحركة</label>
                <select name="transmission" value={form.transmission} onChange={handleChange} className={fieldClass}>
                  <option value="Automatic">أوتوماتيك</option>
                  <option value="Manual">يدوي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>المصدر</label>
                <select name="source" value={form.source} onChange={handleChange} className={fieldClass}>
                  <option value="korean_import">مستورد من كوريا</option>
                  <option value="hm_local">محلي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>نوع الإدراج</label>
                <select name="listingType" value={form.listingType} onChange={handleChange} className={fieldClass}>
                  <option value="showroom">معرض</option>
                  <option value="store">متجر</option>
                  <option value="auction">مزاد</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">الأسعار</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>السعر الرئيسي * (ر.س أو وون)</label>
                <input name="price" type="number" required value={form.price} onChange={handleChange}
                  placeholder="85000" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>السعر بالريال السعودي</label>
                <input name="priceSar" type="number" value={form.priceSar} onChange={handleChange}
                  placeholder="85000" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>السعر بالدولار</label>
                <input name="priceUsd" type="number" value={form.priceUsd} onChange={handleChange}
                  placeholder="22666" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>السعر بالوون الكوري</label>
                <input name="priceKrw" type="number" value={form.priceKrw} onChange={handleChange}
                  placeholder="30000000" className={fieldClass} />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">روابط الصور</h2>
              <button type="button" onClick={addImage}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors">
                <Plus className="w-4 h-4" />
                إضافة صورة
              </button>
            </div>
            <div className="space-y-3">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => handleImageChange(i, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`${fieldClass} flex-1`}
                  />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)}
                      className="text-red-400 hover:text-red-300 transition-colors px-2">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">الوصف</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>رابط خارجي (اختياري - مثال encar.com)</label>
                <input name="externalUrl" type="url" value={form.externalUrl} onChange={handleChange}
                  placeholder="https://www.encar.com/..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>وصف السيارة</label>
                <textarea name="description" value={form.description} onChange={handleChange as any}
                  rows={4} placeholder="وصف تفصيلي للسيارة، المميزات، الحالة..."
                  className={`${fieldClass} resize-none`} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/admin/cars"
              className="flex items-center gap-2 text-gray-400 hover:text-white border border-white/10 px-6 py-3 rounded-xl transition-colors">
              <X className="w-5 h-5" />
              إلغاء
            </Link>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold px-8 py-3 rounded-xl transition-colors">
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'جاري الحفظ...' : 'حفظ السيارة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
