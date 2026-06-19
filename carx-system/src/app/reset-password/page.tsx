'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('رمز إعادة التعيين غير موجود أو غير صالح. الرجاء طلب رابط جديد.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      setError('يجب أن تتكون كلمة المرور من 6 خانات على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.auth.resetPassword(token, password);
      if (!response.error && response.data) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response.error || 'فشل إعادة تعيين كلمة المرور. قد يكون الرابط قد انتهت صلاحيته.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ في الاتصال بالخادم');
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-6" dir="rtl">
      {/* BG Orbs */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-luxury-gold/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 group mb-8">
            <span className="text-4xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold group-hover:text-white transition-colors duration-300">X</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-7 h-7 text-luxury-gold" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">إعادة تعيين كلمة المرور</h1>
                <p className="text-white/40 text-sm leading-relaxed">
                  أدخل كلمة المرور الجديدة والمؤكدة لحسابك
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 text-right font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password field */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-4 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] transition-all duration-300 placeholder:text-white/20 text-right"
                      placeholder="••••••••"
                      disabled={!token}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center z-10 text-white/30 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-bold text-white/40">
                        <span>قوة كلمة المرور</span>
                        <span className="text-luxury-gold">
                          {passwordStrength() === 1 && 'ضعيفة'}
                          {passwordStrength() === 2 && 'متوسطة'}
                          {passwordStrength() === 3 && 'قوية'}
                          {passwordStrength() === 4 && 'ممتازة'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full rounded-full transition-all duration-500 ${passwordStrength() >= 1 ? (passwordStrength() === 1 ? 'w-1/4 bg-red-500' : passwordStrength() === 2 ? 'w-2/4 bg-yellow-500' : passwordStrength() === 3 ? 'w-3/4 bg-blue-500' : 'w-full bg-luxury-gold') : 'w-0'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-4 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] transition-all duration-300 placeholder:text-white/20 text-right"
                      placeholder="••••••••"
                      disabled={!token}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 left-0 pl-4 flex items-center z-10 text-white/30 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <ShieldCheck className="w-4 h-4 text-luxury-gold/60 shrink-0 mt-0.5" />
                  <p className="text-white/30 text-xs leading-relaxed">
                    احرص على اختيار كلمة مرور قوية تحتوي على أرقام وحروف وتجنب الكلمات السهلة لضمان حماية حسابك.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="relative w-full overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-luxury-gold rounded-2xl transition-all duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all duration-500" />
                  <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center justify-center gap-3 py-4 text-black font-black text-sm">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      'تحديث كلمة المرور'
                    )}
                  </span>
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(212,175,55,0.2)]"
              >
                <CheckCircle2 className="w-10 h-10 text-luxury-gold" />
              </motion.div>

              <div className="space-y-3">
                <h3 className="text-xl font-black text-white">تم تغيير كلمة المرور!</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                  تم تحديث كلمة المرور بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول الآن...
                </p>
              </div>
            </motion.div>
          )}

          {/* Back Link */}
          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold text-sm font-bold transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-3px] transition-transform" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center text-white" dir="rtl">
        <div className="w-8 h-8 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin mb-4" />
        <span className="mr-3 text-sm">جاري التحميل...</span>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
