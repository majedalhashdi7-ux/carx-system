'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirectTo = searchParams.get('redirect') || '/';
  const isRequestingAdmin = redirectTo.startsWith('/admin') || redirectTo === '/admin';
  const role = isRequestingAdmin ? 'admin' : 'buyer';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring' as const, 
        stiffness: 100, 
        damping: 15 
      } 
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.auth.login(email, password, role);

      if (!response.error && response.data) {
        const data = response.data as any;
        // استخدام AuthContext.login لتحديث الحالة عبر التطبيق
        login(data.token, data.user);

        const userData = data.user;
        if (userData && (userData.role === 'admin' || userData.role === 'super_admin' || userData.role === 'manager')) {
          window.location.href = '/admin';
        } else {
          window.location.href = redirectTo;
        }
      } else {
        setError(response.error || 'فشل تسجيل الدخول');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden" dir="rtl">
      {/* ===== Left Panel - Luxury Visual ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1400"
            alt="Luxury Car Interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Animated Gold Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-luxury-gold rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-luxury-gold rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 bg-luxury-gold rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }} />

        {/* Gold glow orb */}
        <div className="absolute bottom-1/3 left-1/2 w-96 h-96 bg-luxury-gold/10 rounded-full blur-[100px]" />

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-end p-16 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-[1px] w-8 bg-luxury-gold" />
              <span className="text-luxury-gold font-black uppercase tracking-[0.4em] text-xs">عالم الرفاهية</span>
            </div>

            <h2 className="text-5xl font-black tracking-tighter leading-tight text-white">
              قيادة<br />
              <span className="text-luxury-gold">استثنائية</span><br />
              كل يوم
            </h2>

            <p className="text-white/50 text-base leading-relaxed max-w-xs">
              انضم إلى نخبة من محبي السيارات الفارهة وعش تجربة تسوق لا مثيل لها.
            </p>

            {/* Stats */}
            <div className="flex gap-6 pt-4">
              {[
                { num: '٥٠٠+', label: 'سيارة فاخرة' },
                { num: '١٢٠٠+', label: 'عميل راضٍ' },
                { num: '١٠', label: 'سنوات خبرة' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="space-y-1 cursor-default p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:border-luxury-gold/30 hover:bg-white/[0.05] transition-all duration-300"
                >
                  <p className="text-2xl font-black text-luxury-gold">{stat.num}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Right Panel - Login Form ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative px-6 py-12 overflow-y-auto">
        {/* Background Glow Effects */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-luxury-gold/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-md"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
              <span className="text-3xl font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold group-hover:text-white transition-colors duration-300">X</span>
              </span>
              <div className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
            </Link>

            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
              مرحباً بعودتك
            </h1>
            <p className="text-white/40 text-sm font-medium">
              سجّل دخولك للوصول إلى عالم الرفاهية
            </p>
          </motion.div>

          {/* Admin Mode Badge */}
          {isRequestingAdmin && (
            <motion.div
              variants={itemVariants}
              className="mb-6 flex items-center gap-3 p-4 bg-luxury-gold/10 border border-luxury-gold/30 rounded-2xl"
            >
              <Shield className="w-5 h-5 text-luxury-gold shrink-0" />
              <p className="text-sm font-bold text-luxury-gold">وضع الدخول للوحة التحكم</p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              variants={itemVariants}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center font-semibold"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-sm font-black text-white/70 uppercase tracking-widest">
                البريد الإلكتروني
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                  <Mail className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors duration-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                  placeholder="example@carx.sa"
                  required
                />
                {/* Gold underline on focus */}
                <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-black text-white/70 uppercase tracking-widest">
                  كلمة المرور
                </label>
                <Link href="/forgot-password" className="text-xs text-luxury-gold/80 hover:text-luxury-gold transition-colors font-bold">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors duration-300" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 hover:text-luxury-gold transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl bg-luxury-gold hover:bg-white transition-all duration-500 group disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_45px_rgba(212,175,55,0.55)] cursor-pointer text-black font-black text-base"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                <span className="relative z-10 flex items-center justify-center gap-3 py-4 text-black font-black text-base">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-[-4px]" />
                      الدخول للنظام
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div variants={itemVariants} className="my-8 flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/[0.06]" />
            <span className="text-xs text-white/20 font-bold uppercase tracking-widest">أو</span>
            <div className="flex-1 h-[1px] bg-white/[0.06]" />
          </motion.div>

          {/* Register Link */}
          <motion.div variants={itemVariants} className="text-center">
            <p className="text-white/40 text-sm font-medium">
              ليس لديك حساب؟
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 mt-3 text-luxury-gold font-black text-sm hover:text-white transition-colors group"
            >
              إنشاء حساب جديد مجاناً
              <ArrowRight className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-6">
          <span className="text-4xl font-black tracking-tighter text-white">
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
