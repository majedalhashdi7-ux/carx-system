'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User, UserPlus, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();

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
        type: 'spring', 
        stiffness: 100, 
        damping: 15 
      } 
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      const res = await api.auth.register({ name, email, phone, password });

      if (!res.error && res.data) {
        setSuccess(true);
        const token = (res.data as any).token;
        const userData = (res.data as any).user;
        if (token && userData) {
          login(token, userData);
        }
        setTimeout(() => { window.location.href = '/'; }, 2500);
      } else {
        setError(res.error || 'حدث خطأ أثناء إنشاء الحساب');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['ضعيف', 'مقبول', 'جيد', 'قوي'];
  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-black flex overflow-hidden" dir="rtl">
      {/* ===== Right Panel - Visual Side ===== */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden order-last">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1400"
            alt="Luxury Car"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
        </div>

        {/* Animated accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-between p-16 h-full">
          {/* Top Logo */}
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-2xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold">X</span>
            </span>
          </Link>

          {/* Bottom Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-8 bg-luxury-gold" />
              <span className="text-luxury-gold font-black uppercase tracking-[0.4em] text-xs">انضم إلينا</span>
            </div>

            <h2 className="text-4xl font-black tracking-tighter leading-tight text-white">
              ابدأ رحلة<br />
              <span className="text-luxury-gold">الرفاهية</span><br />
              معنا اليوم
            </h2>

            {/* Benefits */}
            <div className="space-y-4 pt-2">
              {[
                'وصول حصري لأحدث السيارات',
                'خدمة عملاء على مدار الساعة',
                'ضمان شامل على جميع المشتريات',
                'توصيل آمن لأي مكان في العالم',
              ].map((benefit, i) => (
                <motion.div 
                  key={benefit} 
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-luxury-gold/20 border border-luxury-gold/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-luxury-gold" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Left Panel - Register Form ===== */}
      <div className="w-full lg:w-7/12 flex items-center justify-center relative px-6 py-12 overflow-y-auto">
        {/* BG Glow */}
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-luxury-gold/6 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-lg py-8"
        >
          {/* Mobile Logo */}
          <motion.div variants={itemVariants} className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold">X</span>
              </span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div variants={itemVariants} className="mb-10">
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
              إنشاء حساب جديد
            </h1>
            <p className="text-white/40 text-sm font-medium">
              انضم إلى مجتمع صفوة ملاك ومحبي السيارات الفارهة
            </p>
          </motion.div>

          {/* Success State */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 bg-luxury-gold/10 border border-luxury-gold/30 rounded-3xl text-center space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-luxury-gold rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(212,175,55,0.4)]"
              >
                <CheckCircle2 className="w-10 h-10 text-black" />
              </motion.div>
              <h2 className="text-2xl font-black text-white">تم إنشاء الحساب بنجاح!</h2>
              <p className="text-white/50 text-sm">جاري تسجيل دخولك وتوجيهك للصفحة الرئيسية...</p>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <motion.div
                  variants={itemVariants}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center font-semibold"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Name */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                    الاسم الكامل
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                      <User className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                      placeholder="أدخل الاسم الثنائي أو الثلاثي"
                      required
                    />
                    <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
                  </div>
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                      <Mail className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                      placeholder="example@carx.sa"
                      required
                    />
                    <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                    رقم الجوال <span className="text-white/30 font-normal normal-case">(اختياري)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                      <Phone className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                      placeholder="0500000000"
                    />
                    <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
                  </div>
                </motion.div>

                {/* Passwords Row */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                      كلمة المرور
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                        placeholder="••••••••"
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
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                      تأكيد المرور
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
                        <Lock className="h-4 w-4 text-white/30 group-focus-within:text-luxury-gold transition-colors" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] focus:ring-2 focus:ring-luxury-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.02)] focus:shadow-[0_0_30px_rgba(212,175,55,0.15)] transition-all duration-300 placeholder:text-white/20"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 hover:text-luxury-gold transition-colors z-10"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
                    </div>
                  </div>
                </motion.div>

                {/* Password Strength Indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                            strength >= level ? strengthColors[strength - 1] : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/40 font-bold">
                      قوة كلمة المرور: <span className={`text-${strength > 0 ? ['red', 'orange', 'yellow', 'green'][strength - 1] : 'white'}-400`}>
                        {strength > 0 ? strengthLabels[strength - 1] : 'غير محدد'}
                      </span>
                    </p>
                  </motion.div>
                )}

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
                          <UserPlus className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                          إنشاء حسابي الآن
                        </>
                      )}
                    </span>
                  </motion.button>
                </motion.div>
              </form>

              {/* Login Link */}
              <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-white/40 text-sm font-medium">
                  لديك حساب بالفعل؟
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-3 text-luxury-gold font-black text-sm hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:translate-x-[4px] transition-transform" />
                  تسجيل الدخول الآن
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
