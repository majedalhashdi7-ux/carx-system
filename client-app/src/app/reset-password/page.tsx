'use client';

/**
 * صفحة إعادة تعيين كلمة المرور
 * تتلقى token من الرابط وتسمح للمستخدم بإدخال كلمة مرور جديدة
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { Lock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";

function ResetPasswordForm() {
    const { isRTL } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError(isRTL ? 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.' : 'Invalid or expired reset link.');
        }
    }, [token, isRTL]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError(isRTL ? 'كلمة المرور وتأكيدها غير متطابقتين.' : 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/v2/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setError(data.error || (isRTL ? 'فشل إعادة التعيين. الرابط قد يكون منتهياً.' : 'Reset failed. The link may have expired.'));
            }
        } catch {
            setError(isRTL ? 'خطأ في الاتصال. حاول مجدداً.' : 'Connection error. Please try again.');
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

            {/* البطاقة الرئيسية */}
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
                            {success ? (
                                /* ─── حالة النجاح ─── */
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-400" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-xl font-black text-white mb-2">
                                            {isRTL ? '✅ تم تغيير كلمة المرور' : '✅ Password Changed'}
                                        </h2>
                                        <p className="text-white/50 text-sm">
                                            {isRTL ? 'سيتم توجيهك لتسجيل الدخول...' : 'Redirecting to login...'}
                                        </p>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-green-400 rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 3 }}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                /* ─── نموذج إعادة التعيين ─── */
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* الرأس */}
                                    <div className="text-center mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center mx-auto mb-4">
                                            <Lock className="w-7 h-7 text-[#c9a96e]" />
                                        </div>
                                        <h1 className="text-2xl font-black text-white mb-1">
                                            {isRTL ? 'كلمة مرور جديدة' : 'New Password'}
                                        </h1>
                                        <p className="text-white/40 text-xs">
                                            {isRTL ? 'اختر كلمة مرور قوية لحسابك' : 'Choose a strong password for your account'}
                                        </p>
                                    </div>

                                    {/* رسالة خطأ */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                            <span className="text-xs text-red-300">{error}</span>
                                        </motion.div>
                                    )}

                                    {/* النموذج */}
                                    {token && (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {/* كلمة المرور */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="reset-password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={e => setPassword(e.target.value)}
                                                        required
                                                        minLength={8}
                                                        placeholder={isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(p => !p)}
                                                        className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors`}
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* تأكيد كلمة المرور */}
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="reset-confirm-password"
                                                        type={showConfirm ? 'text' : 'password'}
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        required
                                                        minLength={8}
                                                        placeholder={isRTL ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirm(p => !p)}
                                                        className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors`}
                                                    >
                                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* مؤشر قوة كلمة المرور */}
                                            {password && (
                                                <div className="space-y-1">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4].map(i => (
                                                            <div
                                                                key={i}
                                                                className={`h-1 flex-1 rounded-full transition-all ${
                                                                    password.length >= i * 3
                                                                        ? i <= 1 ? 'bg-red-400'
                                                                            : i <= 2 ? 'bg-yellow-400'
                                                                                : i <= 3 ? 'bg-blue-400'
                                                                                    : 'bg-green-400'
                                                                        : 'bg-white/10'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-white/30">
                                                        {password.length < 3 ? (isRTL ? 'ضعيفة جداً' : 'Too weak')
                                                            : password.length < 6 ? (isRTL ? 'ضعيفة' : 'Weak')
                                                                : password.length < 9 ? (isRTL ? 'متوسطة' : 'Moderate')
                                                                    : (isRTL ? 'قوية' : 'Strong')}
                                                    </p>
                                                </div>
                                            )}

                                            {/* زر التأكيد */}
                                            <button
                                                id="reset-password-submit"
                                                type="submit"
                                                disabled={loading || !token}
                                                className="w-full py-3.5 rounded-xl bg-[#c9a96e] hover:bg-[#d4b87e] text-black font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,169,110,0.3)] flex items-center justify-center gap-2 mt-2"
                                            >
                                                {loading ? (
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                ) : (
                                                    isRTL ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'
                                                )}
                                            </button>
                                        </form>
                                    )}

                                    {/* رابط تسجيل الدخول */}
                                    <p className="text-center text-xs text-white/30 mt-6">
                                        {isRTL ? 'تتذكر كلمة مرورك؟' : 'Remember your password?'}{' '}
                                        <Link href="/login" className="text-[#c9a96e] hover:underline font-bold">
                                            {isRTL ? 'سجّل دخولك' : 'Sign in'}
                                        </Link>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
