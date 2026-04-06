'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface BrandForm {
  name: string;
  nameEn: string;
  key: string;
  logoUrl: string;
  description: string;
  description_ar: string;
  phone: string;
  whatsapp: string;
  location: string;
}

const defaultForm: BrandForm = {
  name: '', nameEn: '', key: '', logoUrl: '',
  description: '', description_ar: '',
  phone: '', whatsapp: '', location: '',
};

const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";
const labelClass = "block text-sm text-gray-400 mb-1.5";

export default function NewBrandPage() {
  const router = useRouter();
  const { isLoggedIn, loading, user } = useAuth();
  const [form, setForm] = useState<BrandForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'nameEn' ? { key: value.toLowerCase().replace(/\s+/g, '_') } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('اسم الوكالة مطلوب'); return; }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('carx-token');
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...form, isActive: true }),
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

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <div><p className="font-black text-white">CAR X</p><p className="text-xs text-gray-500">لوحة الإدارة</p></div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/admin', label: 'الإحصائيات' },
            { href: '/admin/cars', label: 'السيارات' },
            { href: '/admin/parts', label: 'قطع الغيار' },
            { href: '/admin/brands', label: 'الوكالات', active: true },
            { href: '/admin/users', label: 'المستخدمون' },
            { href: '/admin/settings', label: 'الإعدادات' },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${item.active ? 'bg-red-600/20 text-white border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowRight className="w-3 h-3" /> العودة للموقع
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="mr-64 p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/brands" className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black">إضافة وكالة</h1>
            <p className="text-gray-400 mt-1">أضف وكالة معتمدة جديدة</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">معلومات الوكالة</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>الاسم (عربي) *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="تويوتا..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>الاسم (إنجليزي)</label>
                <input name="nameEn" value={form.nameEn} onChange={handleChange} placeholder="Toyota..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>المفتاح (key)</label>
                <input name="key" value={form.key} onChange={handleChange} placeholder="toyota" className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>رابط الشعار (logo URL)</label>
                <input name="logoUrl" value={form.logoUrl} onChange={handleChange} placeholder="https://..." className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">معلومات التواصل</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>رقم الهاتف</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+967..." className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>واتساب</label>
                <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+967..." className={fieldClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>الموقع</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="صنعاء، اليمن" className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-black text-lg">الوصف</h2>
            <div>
              <label className={labelClass}>وصف (عربي)</label>
              <textarea name="description_ar" value={form.description_ar} onChange={handleChange}
                rows={3} placeholder="وصف الوكالة بالعربية..." className={`${fieldClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>وصف (إنجليزي)</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Brand description in English..." className={`${fieldClass} resize-none`} />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-black px-8 py-4 rounded-xl transition-colors"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'جاري الحفظ...' : 'حفظ الوكالة'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
