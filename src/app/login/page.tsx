'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(form.email, form.password);
        if (result.success) {
          setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setError(result.error || 'فشل تسجيل الدخول');
        }
      } else {
        const result = await register(form.name, form.email, form.password, form.phone);
        if (result.success) {
          setSuccess('تم إنشاء الحساب بنجاح! جاري التحويل...');
          setTimeout(() => router.push('/'), 1000);
        } else {
          setError(result.error || 'فشل التسجيل');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.15),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-2xl">X</span>
            </div>
            <span className="text-3xl font-black text-white">CAR X</span>
          </Link>
          <p className="text-gray-400 mt-2">
            {mode === 'login' ? 'مرحباً بك مجدداً' : 'انضم إلى CAR X'}
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/80 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
        >
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  mode === m
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>
            ))}
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 mb-4 text-sm"
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-1.5">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      name="name"
                      type="text"
                      required={mode === 'register'}
                      placeholder="اسمك الكامل"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Phone (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-1.5">رقم الهاتف (اختياري)</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+967..."
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={mode === 'register' ? 'على الأقل 6 أحرف' : '••••••••'}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-11 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-colors mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'جاري الدخول...' : 'جاري التسجيل...'}
                </span>
              ) : (
                mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
