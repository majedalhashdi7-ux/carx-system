'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const SIDEBAR_ITEMS = [
  { href: '/admin', label: 'الإحصائيات' },
  { href: '/admin/cars', label: 'السيارات' },
  { href: '/admin/parts', label: 'قطع الغيار' },
  { href: '/admin/brands', label: 'الوكالات' },
  { href: '/admin/users', label: 'المستخدمون' },
  { href: '/admin/settings', label: 'الإعدادات', active: true },
];

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
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <div>
              <p className="font-black text-white">CAR X</p>
              <p className="text-xs text-gray-500">لوحة الإدارة</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${item.active ? 'bg-red-600/20 text-white border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowRight className="w-3 h-3" />
            العودة للموقع
          </Link>
        </div>
      </div>

      <div className="mr-64 p-8">
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
              <select value={form.currency} onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors">
                <option value="SAR" className="bg-zinc-900">ريال سعودي (SAR)</option>
                <option value="USD" className="bg-zinc-900">دولار أمريكي (USD)</option>
                <option value="KRW" className="bg-zinc-900">وون كوري (KRW)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">اللغة الافتراضية</label>
              <select value={form.language} onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
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
