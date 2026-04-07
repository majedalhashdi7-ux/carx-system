'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    siteName: 'CAR X',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '+967781007805',
    currency: 'SAR',
    language: 'ar',
  });

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn || user?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [loading, isLoggedIn, user, router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminSidebar />

      <div className="lg:mr-64 pt-16 lg:pt-0 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black">الإعدادات</h1>
          <p className="text-gray-400 mt-1">ضبط إعدادات الموقع</p>
        </div>

        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          {saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4" />
              تم الحفظ بنجاح
            </motion.div>
          )}

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-400" />
              الإعدادات العامة
            </h2>

            {[
              { label: 'اسم الموقع', key: 'siteName', type: 'text', placeholder: 'CAR X' },
              { label: 'رقم واتساب', key: 'whatsapp', type: 'tel', placeholder: '+967...' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">العملة الافتراضية</label>
              <select title="العملة الافتراضية" value={form.currency} onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="SAR" className="bg-zinc-900">ريال سعودي (SAR)</option>
                <option value="USD" className="bg-zinc-900">دولار أمريكي (USD)</option>
                <option value="KRW" className="bg-zinc-900">وون كوري (KRW)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">اللغة الافتراضية</label>
              <select title="اللغة الافتراضية" value={form.language} onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="ar" className="bg-zinc-900">العربية</option>
                <option value="en" className="bg-zinc-900">English</option>
              </select>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <h2 className="font-black text-lg mb-4">معلومات النظام</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'إصدار النظام', value: 'CAR X v1.0' },
                { label: 'البيئة', value: process.env.NODE_ENV || 'production' },
                { label: 'المشرف', value: user?.email || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-bold text-white/80">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-xl transition-colors"
          >
            <Save className="w-5 h-5" />
            حفظ الإعدادات
          </motion.button>
        </form>
      </div>
    </div>
  );
}
