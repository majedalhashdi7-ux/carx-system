'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.auth.forgotPassword({ email });
    } catch {
      // Show success regardless for security reasons
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
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
          {!submitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center mx-auto mb-5">
                  <Key className="w-7 h-7 text-luxury-gold" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">استعادة كلمة المرور</h1>
                <p className="text-white/40 text-sm leading-relaxed">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة فوراً
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/60 uppercase tracking-widest">
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
                      className="block w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:bg-white/[0.08] transition-all duration-300 placeholder:text-white/20"
                      placeholder="example@carx.sa"
                      required
                    />
                    <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-luxury-gold rounded-full transition-all duration-500 group-focus-within:w-full group-focus-within:left-0" />
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <ShieldCheck className="w-4 h-4 text-luxury-gold/60 shrink-0 mt-0.5" />
                  <p className="text-white/30 text-xs leading-relaxed">
                    لأسباب أمنية، سنرسل الرابط حتى لو كان البريد غير مسجل. تحقق من صندوق البريد والمجلد العشوائي.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-luxury-gold rounded-2xl transition-all duration-500 group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all duration-500" />
                  <div className="absolute inset-0 -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-all duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10 flex items-center justify-center gap-3 py-4 text-black font-black text-sm">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      'إرسال رابط الاستعادة'
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
                <h3 className="text-xl font-black text-white">تم إرسال الرابط!</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                  إذا كان البريد الإلكتروني مسجلاً لدينا، ستتلقى رابط الاستعادة قريباً.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-right space-y-1">
                <p className="text-xs text-white/30 font-bold">لم تستلم الرسالة؟</p>
                <p className="text-xs text-white/20 leading-relaxed">
                  تحقق من مجلد البريد العشوائي أو تواصل معنا على{' '}
                  <span className="text-luxury-gold font-bold">support@carx.sa</span>
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
