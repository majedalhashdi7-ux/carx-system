'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // محاكاة إرسال الطلب أو استدعاء حقيقي للـ API في حالة وجوده
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2';
      await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'carx'
        },
        body: JSON.stringify({ email })
      });

      // نقبل الاستجابة حتى لو كانت محاكاة أو نجاح محلي لتجنب تسريب وجود البريد الإلكتروني لأسباب أمنية
      setSubmitted(true);
    } catch (_err) {
      // في حالة فشل الاتصال، نظهر رسالة نجاح عامة لأسباب أمنية أو نوجه العميل للتواصل مع الدعم
      setSubmitted(true);
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
          <h1 className="text-2xl font-bold text-white mb-2">استعادة كلمة المرور</h1>
          <p className="text-gray-400 text-sm">أدخل بريدك الإلكتروني لإرسال تعليمات الاستعادة</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-sm font-bold text-gray-300 mb-2">البريد الإلكتروني للغسيل/المدير</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-colors text-right"
                  placeholder="name@example.com"
                  required
                  dir="ltr"
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
                  إرسال رابط الاستعادة
                </>
              )}
            </button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="w-16 h-16 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center mx-auto text-luxury-gold">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">تم إرسال الطلب بنجاح</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                إذا كان هذا البريد مسجلاً لدينا كمدير للنظام، فستتلقى رسالة تحتوي على رابط وتوجيهات تعيين كلمة مرور جديدة قريباً.
              </p>
            </div>
            <p className="text-xs text-white/30">
              لم تصلك الرسالة؟ يرجى التحقق من صندوق البريد العشوائي أو التواصل مع دعم النظام عبر <span className="text-luxury-gold">support@okigo.net</span>
            </p>
          </motion.div>
        )}

        <div className="mt-8 text-center pt-4 border-t border-white/5">
          <Link href="/login" className="text-gray-400 hover:text-white text-sm font-bold inline-flex items-center gap-2 transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
