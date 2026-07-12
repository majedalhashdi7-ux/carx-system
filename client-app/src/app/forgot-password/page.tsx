'use client';

/**
 * صفحة "نسيت كلمة المرور" 
 * تتيح للمستخدم إدخال بريده الإلكتروني وإرسال رابط إعادة التعيين
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Mail, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";

export default function ForgotPasswordPage() {
    const { isRTL } = useLanguage();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/v2/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (data.success || res.status === 200) {
                setSent(true);
            } else {
                // عرض نجاح أيضاً لعدم كشف وجود البريد الإلكتروني (أمان)
                setSent(true);
            }
        } catch {
            // عرض نجاح لمنع brute force
            setSent(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`relative min-h-screen bg-black text-white flex items-center justify-center p-4 overflow-hidden ${isRTL ? 'font-arabic' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <CinematicVideoBackground
                videoSrc="/videos/hero.mp4"
                fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                mobileImage="/images/hmcar.jpg"
                overlayOpacity={0.7}
            />

            {/* كرات ضوئية */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="absolute w-[400px] h-[400px] top-[-100px] left-[-100px] rounded-full bg-[#c9a96e]/8 blur-[100px]" />
                <div className="absolute w-[300px] h-[300px] bottom-[-100px] right-[-50px] rounded-full bg-blue-500/6 blur-[80px]" />
            </div>

            {/* زر الرجوع */}
            <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`fixed top-6 ${isRTL ? 'right-6' : 'left-6'} z-50`}
            >
                <Link
                    href="/login"
                    className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-[#c9a96e] transition-all"
                >
                    <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#c9a96e]/40 backdrop-blur-md bg-black/20 transition-all">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                </Link>
            </motion.div>

            {/* البطاقة */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-sm"
            >
                <div className="relative bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    {/* خط ذهبي علوي */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a96e]/60 to-transparent" />

                    <div className="p-8 sm:p-10">
                        <AnimatePresence mode="wait">
                            {!sent ? (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {/* رأس الصفحة */}
                                    <div className="text-center mb-8">
                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 mb-4"
                                        >
                                            <Sparkles className="w-3 h-3 text-[#c9a96e]" />
                                            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c9a96e]/80">
                                                {isRTL ? 'استعادة الوصول' : 'ACCOUNT RECOVERY'}
                                            </span>
                                        </motion.div>

                                        <h1 className="text-3xl font-black tracking-tight uppercase mb-2">
                                            {isRTL ? 'نسيت' : 'FORGOT'}
                                            <br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#c9a96e] to-[#a07840]">
                                                {isRTL ? 'كلمة المرور؟' : 'PASSWORD?'}
                                            </span>
                                        </h1>
                                        <p className="text-white/30 text-xs leading-relaxed">
                                            {isRTL
                                                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                                                : 'Enter your email and we\'ll send you a reset link'
                                            }
                                        </p>
                                    </div>

                                    {/* النموذج */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <AnimatePresence>
                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                                                >
                                                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                                    <span className="text-[11px] font-bold text-red-400">{error}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                                {isRTL ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}
                                                <span className="text-red-400 ms-1">*</span>
                                            </label>
                                            <div className="relative group">
                                                <Mail className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                                    isRTL ? "right-4" : "left-4"
                                                )} />
                                                <input
                                                    type="email"
                                                    required
                                                    autoFocus
                                                    autoComplete="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className={cn(
                                                        "w-full bg-white/5 border border-white/10 rounded-xl py-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all text-sm placeholder:text-white/20",
                                                        isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                                    )}
                                                    placeholder={isRTL ? "example@email.com" : "example@email.com"}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !email.trim()}
                                            className="w-full bg-gradient-to-r from-[#c9a96e] to-[#d4b57d] hover:from-[#d4b57d] hover:to-[#e0c08a] text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#c9a96e]/20 mt-2"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="uppercase tracking-widest text-sm">
                                                        {isRTL ? 'إرسال رابط الاستعادة' : 'SEND RESET LINK'}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>

                                        <div className="text-center pt-2">
                                            <span className="text-[10px] text-white/30 uppercase tracking-widest">
                                                {isRTL ? 'تذكرت كلمة المرور؟ ' : 'REMEMBER IT? '}
                                                <Link href="/login" className="text-[#c9a96e] hover:text-[#d4b57d] hover:underline transition-all font-bold">
                                                    {isRTL ? 'سجل الدخول' : 'LOGIN NOW'}
                                                </Link>
                                            </span>
                                        </div>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-5"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.08, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto"
                                    >
                                        <ShieldCheck className="w-10 h-10 text-green-400" />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-2xl font-black text-white mb-2">
                                            {isRTL ? 'تم الإرسال! ✉️' : 'Email Sent! ✉️'}
                                        </h2>
                                        <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
                                            {isRTL
                                                ? `إذا كان البريد الإلكتروني "${email}" مسجلاً لدينا، ستصل رسالة خلال دقائق.`
                                                : `If "${email}" is registered, you'll receive an email shortly.`
                                            }
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 text-start space-y-2">
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                            {isRTL ? 'لم تصلك الرسالة؟' : "Didn't receive it?"}
                                        </p>
                                        <ul className="text-[11px] text-white/40 space-y-1.5 list-none">
                                            <li>{'→ '}{isRTL ? 'تحقق من مجلد البريد المزعج (Spam)' : 'Check your spam/junk folder'}</li>
                                            <li>{'→ '}{isRTL ? 'تأكد من صحة البريد الإلكتروني' : 'Verify the email address is correct'}</li>
                                            <li>{'→ '}{isRTL ? 'انتظر بضع دقائق ثم أعد المحاولة' : 'Wait a few minutes then retry'}</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => { setSent(false); setEmail(''); }}
                                            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            {isRTL ? 'إعادة المحاولة' : 'Try Again'}
                                        </button>
                                        <Link
                                            href="/login"
                                            className="px-5 py-2.5 rounded-xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 text-[#c9a96e] text-xs font-bold uppercase tracking-widest hover:bg-[#c9a96e]/20 transition-all"
                                        >
                                            {isRTL ? 'الدخول' : 'Login'}
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-center mt-6 opacity-20">
                    <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                        HM CAR // SECURE RECOVERY
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
