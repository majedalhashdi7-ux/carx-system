'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
  const [form, setForm] = useState({
    setupKey: '',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });
    } catch {
      setResult({ success: false, message: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-900/40">
            <Zap className="w-8 h-8 text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-white">
            CAR<span className="text-red-500"> X</span> Setup
          </h1>
          <p className="text-gray-400 mt-2 text-sm">إنشاء حساب المشرف الأول</p>
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl border text-center ${
              result.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            )}
            <p className={`font-bold text-lg mb-4 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </p>
            {result.success && (
              <Link
                href="/login"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-xl transition-colors"
              >
                تسجيل الدخول الآن
              </Link>
            )}
            {!result.success && (
              <button
                onClick={() => setResult(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                حاول مجدداً
              </button>
            )}
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-zinc-950 border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm mb-2">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>هذه الصفحة تعمل مرة واحدة فقط. احذفها بعد الإعداد.</span>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">مفتاح الإعداد (Setup Key)</label>
              <input
                type="password"
                placeholder="أدخل مفتاح الإعداد"
                value={form.setupKey}
                onChange={(e) => setForm(p => ({ ...p, setupKey: e.target.value }))}
                className={inputClass}
                required
              />
              <p className="text-xs text-gray-600 mt-1">القيمة الافتراضية: carx-setup-2024 (غيّرها في SETUP_SECRET_KEY)</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                placeholder="محمد أحمد"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                placeholder="6 أحرف على الأقل"
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className={inputClass}
                required
                minLength={6}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  إنشاء حساب المشرف
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
