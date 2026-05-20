'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Client-side validations
    if (name.trim().split(/\s+/).length < 2) {
      setError('الرجاء إدخال الاسم الثنائي أو الثلاثي بالكامل (اسمان على الأقل)');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.register({
        name,
        email,
        phone,
        password,
      });

      if (!res.error && res.data) {
        setSuccess(true);
        // Automatically save token and redirect
        const token = (res.data as any).token;
        const user = (res.data as any).user;
        if (token) {
          localStorage.setItem('carx_token', token);
          localStorage.setItem('carx_user', JSON.stringify(user));
        }
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError(res.error || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden py-12 px-4">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-luxury-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-4xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold">X</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-400 text-sm">انضم إلى مجتمع صفوة ملاك ومحبي السيارات الفارهة</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-luxury-gold/10 border border-luxury-gold/30 rounded-2xl text-center text-luxury-gold space-y-4"
          >
            <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto text-black text-3xl font-bold">✓</div>
            <h2 className="text-xl font-bold">تم إنشاء الحساب بنجاح!</h2>
            <p className="text-sm text-gray-300">جاري تسجيل دخولك وتوجيهك إلى الصفحة الرئيسية...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-semibold"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors"
                  placeholder="أدخل الاسم الثنائي أو الثلاثي"
                  required
                  dir="rtl"
                />
              </div>
            </div>

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
              <label className="block text-sm font-bold text-gray-300 mb-2">رقم الجوال (اختياري)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors"
                  placeholder="مثال: 0500000000"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">كلمة المرور</label>
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

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">تأكيد كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors"
                    placeholder="أعد إدخال كلمة المرور"
                    required
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-luxury-gold text-black font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-xl shadow-luxury-gold/20 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  إنشاء حساب
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <p className="text-gray-400 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-luxury-gold font-bold hover:underline flex items-center justify-center gap-1 mt-2">
              تسجيل الدخول الآن
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
