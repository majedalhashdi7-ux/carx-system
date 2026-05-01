'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface PartForm {
  name: string; nameAr: string; partType: string; carMake: string; carModel: string;
  price: string; priceSar: string; priceUsd: string; condition: string;
  stockQty: string; description: string; images: string[];
}

const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
const labelClass = "block text-sm text-gray-400 mb-1.5";

export default function EditPartPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<PartForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPart, setLoadingPart] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user, router]);

  useEffect(() => {
    if (id) fetchPart();
  }, [id]);

  const fetchPart = async () => {
    try {
      const res = await fetch(`/api/parts/${id}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        const p = data.data;
        setForm({
          name: p.name || '', nameAr: p.nameAr || '', partType: p.partType || '',
          carMake: p.carMake || '', carModel: p.carModel || '',
          price: p.price?.toString() || '', priceSar: p.priceSar?.toString() || '',
          priceUsd: p.priceUsd?.toString() || '', condition: p.condition || 'NEW',
          stockQty: p.stockQty?.toString() || '1', description: p.description || '',
          images: p.images?.length ? p.images : [''],
        });
      } else {
        setError('لم يتم العثور على القطعة');
      }
    } catch {
      setError('تعذر تحميل بيانات القطعة');
    } finally {
      setLoadingPart(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => prev ? ({ ...prev, [e.target.name]: e.target.value }) : prev);
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
      const body = {
        ...form,
        price: parseFloat(form.priceSar || form.price) || 0,
        priceSar: form.priceSar ? parseFloat(form.priceSar) : undefined,
        priceUsd: form.priceUsd ? parseFloat(form.priceUsd) : undefined,
        stockQty: parseInt(form.stockQty) || 1,
        images: form.images.filter(img => img.trim()),
        inStock: parseInt(form.stockQty) > 0,
      };
      const res = await fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/parts');
      } else {
        setError(data.error || 'فشل الحفظ');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingPart) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>;
  }

  if (!form) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminSidebar />

      <div className="lg:mr-64 pt-16 lg:pt-0 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/parts" className="text-gray-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">تعديل القطعة</h1>
            <p className="text-gray-400 mt-1 truncate">{form.nameAr || form.name}</p>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">المعلومات الأساسية</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>اسم القطعة (عربي) *</label><input name="nameAr" value={form.nameAr} onChange={handleChange} required className={fieldClass} /></div>
              <div><label className={labelClass}>اسم القطعة (إنجليزي)</label><input name="name" value={form.name} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>الفئة</label><input name="partType" value={form.partType} onChange={handleChange} className={fieldClass} /></div>
              <div>
                <label className={labelClass}>الحالة</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={fieldClass} title="الحالة">
                  <option value="NEW" className="bg-zinc-900">جديد</option>
                  <option value="USED" className="bg-zinc-900">مستعمل</option>
                  <option value="REFURBISHED" className="bg-zinc-900">مجدد</option>
                </select>
              </div>
              <div><label className={labelClass}>ماركة السيارة</label><input name="carMake" value={form.carMake} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>موديل السيارة</label><input name="carModel" value={form.carModel} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">الأسعار والمخزون</h2>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass}>السعر (ر.س) *</label><input name="priceSar" type="number" value={form.priceSar} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>السعر (USD)</label><input name="priceUsd" type="number" value={form.priceUsd} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>الكمية</label><input name="stockQty" type="number" min="0" value={form.stockQty} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">الصور</h2>
              <button type="button" onClick={addImage} className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input type="url" value={img} onChange={(e) => handleImageChange(i, e.target.value)}
                  placeholder="https://..." className={`flex-1 ${fieldClass}`} />
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 px-2" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4">الوصف</h2>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={4} className={`${fieldClass} resize-none`} />
          </div>

          <div className="flex gap-4 justify-end">
            <Link href="/admin/parts" className="flex items-center gap-2 text-gray-400 border border-white/10 px-6 py-3 rounded-xl hover:text-white transition-colors">
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
