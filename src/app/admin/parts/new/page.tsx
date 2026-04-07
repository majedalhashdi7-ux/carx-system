'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface PartForm {
  name: string;
  nameAr: string;
  partType: string;
  carMake: string;
  carModel: string;
  price: string;
  priceSar: string;
  priceUsd: string;
  condition: string;
  stockQty: string;
  description: string;
  images: string[];
}

const defaultForm: PartForm = {
  name: '', nameAr: '', partType: '', carMake: '', carModel: '',
  price: '', priceSar: '', priceUsd: '', condition: 'NEW',
  stockQty: '1', description: '', images: [''],
};

const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
const labelClass = "block text-sm text-gray-400 mb-1.5";

export default function NewPartPage() {
  const router = useRouter();
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<PartForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const imgs = [...form.images];
    imgs[index] = value;
    setForm(prev => ({ ...prev, images: imgs }));
  };

  const addImage = () => setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
  const removeImage = (i: number) => {
    if (form.images.length === 1) return;
    setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.price) { setError('اسم القطعة والسعر مطلوبان'); return; }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('carx-token');
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        priceSar: form.priceSar ? parseFloat(form.priceSar) : undefined,
        priceUsd: form.priceUsd ? parseFloat(form.priceUsd) : undefined,
        stockQty: parseInt(form.stockQty) || 1,
        images: form.images.filter(img => img.trim()),
        isActive: true,
        inStock: true,
      };
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminSidebar />

      {/* Main */}
      <div className="lg:mr-64 pt-16 lg:pt-0 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/parts" className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">إضافة قطعة غيار</h1>
            <p className="text-gray-400 mt-1">أضف قطعة جديدة للمخزون</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">المعلومات الأساسية</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>اسم القطعة (عربي) *</label>
                <input name="nameAr" value={form.nameAr} onChange={handleChange} required placeholder="فلتر زيت..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>اسم القطعة (إنجليزي)</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Oil Filter..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الفئة</label>
                <input name="partType" value={form.partType} onChange={handleChange} placeholder="فلاتر، مكابح..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الحالة</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={fieldClass}>
                  <option value="NEW" className="bg-zinc-900">جديد</option>
                  <option value="USED" className="bg-zinc-900">مستعمل</option>
                  <option value="REFURBISHED" className="bg-zinc-900">مجدد</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>ماركة السيارة</label>
                <input name="carMake" value={form.carMake} onChange={handleChange} placeholder="Toyota..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>موديل السيارة</label>
                <input name="carModel" value={form.carModel} onChange={handleChange} placeholder="Camry..." className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">الأسعار والمخزون</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>السعر (ر.س) *</label>
                <input name="priceSar" type="number" value={form.priceSar} onChange={handleChange} placeholder="0" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>السعر (USD)</label>
                <input name="priceUsd" type="number" value={form.priceUsd} onChange={handleChange} placeholder="0" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الكمية في المخزون</label>
                <input name="stockQty" type="number" value={form.stockQty} onChange={handleChange} min="0" className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">الصور</h2>
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  placeholder="https://..."
                  className={`flex-1 ${fieldClass}`}
                />
                <button type="button" onClick={() => removeImage(i)}
                  className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addImage}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
              <Plus className="w-4 h-4" /> إضافة صورة
            </button>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4">الوصف</h2>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="وصف القطعة..."
              className={`${fieldClass} resize-none`}
            />
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-black px-8 py-4 rounded-xl transition-colors"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ القطعة'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
