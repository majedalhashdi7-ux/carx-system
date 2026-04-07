'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface CarForm {
  title: string; make: string; model: string; year: string;
  price: string; priceSar: string; priceUsd: string; priceKrw: string;
  mileage: string; fuelType: string; transmission: string; color: string;
  condition: string; source: string; listingType: string;
  description: string; images: string[]; externalUrl: string;
  isActive: boolean; isSold: boolean;
}

const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
const labelClass = "block text-sm text-gray-400 mb-1.5";


export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<CarForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingCar, setLoadingCar] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user, router]);

  useEffect(() => {
    if (id) fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      const token = localStorage.getItem('carx-token');
      const res = await fetch(`/api/admin/cars/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        const c = data.data;
        setForm({
          title: c.title || '', make: c.make || '', model: c.model || '',
          year: c.year?.toString() || '', price: c.price?.toString() || '',
          priceSar: c.priceSar?.toString() || '', priceUsd: c.priceUsd?.toString() || '',
          priceKrw: c.priceKrw?.toString() || '', mileage: c.mileage?.toString() || '',
          fuelType: c.fuelType || 'Petrol', transmission: c.transmission || 'Automatic',
          color: c.color || '', condition: c.condition || 'good',
          source: c.source || 'korean_import', listingType: c.listingType || 'showroom',
          description: c.description || '', images: c.images?.length ? c.images : [''],
          externalUrl: c.externalUrl || '', isActive: c.isActive ?? true, isSold: c.isSold ?? false,
        });
      } else {
        setError('لم يتم العثور على السيارة');
      }
    } catch {
      setError('تعذر تحميل بيانات السيارة');
    } finally {
      setLoadingCar(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => prev ? ({ ...prev, [name]: type === 'checkbox' ? checked : value }) : prev);
  };

  const handleImageChange = (index: number, value: string) => {
    setForm(prev => {
      if (!prev) return prev;
      const imgs = [...prev.images];
      imgs[index] = value;
      return { ...prev, images: imgs };
    });
  };

  const addImage = () => setForm(prev => prev ? ({ ...prev, images: [...prev.images, ''] }) : prev);
  const removeImage = (i: number) => setForm(prev => {
    if (!prev || prev.images.length === 1) return prev;
    return { ...prev, images: prev.images.filter((_, idx) => idx !== i) };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
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
      const res = await fetch(`/api/admin/cars/${id}`, {
        method: 'PUT',
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

  if (loading || loadingCar) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>;
  }

  if (!form) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">{error || 'السيارة غير موجودة'}</p>
        <Link href="/admin/cars" className="text-gray-400 hover:text-white">العودة للقائمة</Link>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminSidebar />

      {/* Main */}
      <div className="lg:mr-64 pt-16 lg:pt-0 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/cars" className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">تعديل السيارة</h1>
            <p className="text-gray-400 mt-1 truncate">{form.title}</p>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Status toggles */}
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-5 flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="w-5 h-5 rounded accent-red-600" />
              <span className="text-sm font-medium">نشط (ظاهر في المعرض)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isSold" checked={form.isSold} onChange={handleChange} className="w-5 h-5 rounded accent-red-600" />
              <span className="text-sm font-medium">تم البيع</span>
            </label>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">المعلومات الأساسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>عنوان السيارة *</label>
                <input name="title" required value={form.title} onChange={handleChange} className={fieldClass} />
              </div>
              <div><label className={labelClass}>الماركة *</label><input name="make" required value={form.make} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>الموديل</label><input name="model" value={form.model} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>السنة</label><input name="year" type="number" value={form.year} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>اللون</label><input name="color" value={form.color} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>الكيلومترات</label><input name="mileage" type="number" value={form.mileage} onChange={handleChange} className={fieldClass} /></div>
              <div>
                <label className={labelClass}>الحالة</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={fieldClass}>
                  <option value="excellent">ممتازة</option><option value="good">جيدة</option>
                  <option value="fair">مقبولة</option><option value="needs work">تحتاج عمل</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>نوع الوقود</label>
                <select name="fuelType" value={form.fuelType} onChange={handleChange} className={fieldClass}>
                  <option value="Petrol">بنزين</option><option value="Diesel">ديزل</option>
                  <option value="Electric">كهرباء</option><option value="Hybrid">هجين</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ناقل الحركة</label>
                <select name="transmission" value={form.transmission} onChange={handleChange} className={fieldClass}>
                  <option value="Automatic">أوتوماتيك</option><option value="Manual">يدوي</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>المصدر</label>
                <select name="source" value={form.source} onChange={handleChange} className={fieldClass}>
                  <option value="korean_import">مستورد من كوريا</option><option value="hm_local">محلي</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-5">الأسعار</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={labelClass}>السعر الرئيسي *</label><input name="price" type="number" required value={form.price} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>ريال سعودي</label><input name="priceSar" type="number" value={form.priceSar} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>دولار</label><input name="priceUsd" type="number" value={form.priceUsd} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>وون كوري</label><input name="priceKrw" type="number" value={form.priceKrw} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">الصور</h2>
              <button type="button" onClick={addImage} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
            <div className="space-y-3">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={img} onChange={(e) => handleImageChange(i, e.target.value)}
                    placeholder="https://..." className={`flex-1 ${fieldClass}`} />
                  {form.images.length > 1 && (
                    <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 px-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">الوصف</h2>
            <div>
              <label className={labelClass}>رابط خارجي</label>
              <input name="externalUrl" type="url" value={form.externalUrl} onChange={handleChange} placeholder="https://..." className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>الوصف</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                className={`${fieldClass} resize-none`} />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Link href="/admin/cars" className="flex items-center gap-2 text-gray-400 border border-white/10 px-6 py-3 rounded-xl hover:text-white transition-colors">
              <X className="w-4 h-4" /> إلغاء
            </Link>
            <motion.button type="submit" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-black px-8 py-3 rounded-xl transition-colors">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
