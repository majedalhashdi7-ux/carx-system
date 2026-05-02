'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface BrandForm {
  name: string; nameEn: string; key: string; logoUrl: string;
  description: string; description_ar: string; phone: string; whatsapp: string; location: string;
}

const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
const labelClass = "block text-sm text-gray-400 mb-1.5";

export default function EditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<BrandForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user, router]);

  useEffect(() => {
    if (id) fetchBrand();
  }, [id]);

  const fetchBrand = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success) {
        const brand = data.data.find((b: any) => b._id === id);
        if (brand) {
          setForm({
            name: brand.name || '', nameEn: brand.nameEn || '', key: brand.key || '',
            logoUrl: brand.logoUrl || '', description: brand.description || '',
            description_ar: brand.description_ar || '', phone: brand.phone || '',
            whatsapp: brand.whatsapp || '', location: brand.location || '',
          });
        } else {
          setError('لم يتم العثور على الوكالة');
        }
      }
    } catch {
      setError('تعذر تحميل بيانات الوكالة');
    } finally {
      setLoadingBrand(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => prev ? ({ ...prev, [e.target.name]: e.target.value }) : prev);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/brands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/brands');
      } else {
        setError(data.error || 'فشل الحفظ');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingBrand) {
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
          <Link href="/admin/brands" className="text-gray-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">تعديل الوكالة</h1>
            <p className="text-gray-400 mt-1">{form.name}</p>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">معلومات الوكالة</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>الاسم (عربي) *</label><input name="name" value={form.name} onChange={handleChange} required className={fieldClass} /></div>
              <div><label className={labelClass}>الاسم (إنجليزي)</label><input name="nameEn" value={form.nameEn} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>المفتاح</label><input name="key" value={form.key} onChange={handleChange} className={fieldClass} /></div>
              <div><label className={labelClass}>رابط الشعار</label><input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." className={fieldClass} /></div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">معلومات التواصل</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>رقم الهاتف</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+967..." className={fieldClass} /></div>
              <div><label className={labelClass}>واتساب</label><input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+967..." className={fieldClass} /></div>
              <div className="col-span-2"><label className={labelClass}>الموقع</label><input name="location" value={form.location} onChange={handleChange} className={fieldClass} /></div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">الوصف</h2>
            <div><label className={labelClass}>وصف (عربي)</label>
              <textarea name="description_ar" value={form.description_ar} onChange={handleChange} rows={3} className={`${fieldClass} resize-none`} /></div>
            <div><label className={labelClass}>وصف (إنجليزي)</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={`${fieldClass} resize-none`} /></div>
          </div>

          <div className="flex gap-4 justify-end">
            <Link href="/admin/brands" className="flex items-center gap-2 text-gray-400 border border-white/10 px-6 py-3 rounded-xl hover:text-white transition-colors">
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
