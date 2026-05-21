'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2'}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'carx'
        },
        body: JSON.stringify({ identifier: email, password, role: 'admin' })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        // حفظ التوكن في localStorage للاستخدام في API calls
        localStorage.setItem('carx_token', data.token);
        localStorage.setItem('carx_user', JSON.stringify(data.user));
        // حفظ التوكن في cookie ليقرأه الـ middleware (حماية المسارات)
        document.cookie = `carx_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
        window.location.href = redirectTo;
      } else {
        setError(data.message || 'فشل تسجيل الدخول');
      }
    } catch (_err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <span className="text-4xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold">X</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h1>
          <p className="text-gray-400 text-sm">مرحباً بك مجدداً في عالم الرفاهية</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors"
                placeholder="أدخل بريدك الإلكتروني"
                required
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-300">كلمة المرور</label>
              <Link href="/forgot-password" className="text-xs text-luxury-gold hover:underline">نسيت كلمة المرور؟</Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors"
                placeholder="أدخل كلمة المرور"
                required
                dir="rtl"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-luxury-gold text-black font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-xl shadow-luxury-gold/20 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                الدخول للنظام
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="text-luxury-gold font-bold hover:underline flex items-center justify-center gap-1 mt-2">
              إنشاء حساب جديد
              <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="text-3xl font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>
          <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
