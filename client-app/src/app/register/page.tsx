'use client';

/**
 * صفحة إنشاء حساب جديد (Register Page)
 * تصميم محسّن بالكامل مع تحقق من المدخلات ومؤشر قوة كلمة المرور
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User, Mail, Lock, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Phone, Eye, EyeOff, CheckCircle, XCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { cn } from "@/lib/utils";

export default function Register() {
    const { isRTL } = useLanguage();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // خطوتان: بيانات أساسية، ثم كلمة المرور

    const { socket, isConnected } = useSocket();
    const { user, login } = useAuth();

    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('user_navigation', {
                userName: user?.name || (isRTL ? 'زائر جديد' : 'New Guest'),
                page: isRTL ? 'صفحة إنشاء حساب' : 'Register Page',
                timestamp: new Date()
            });
        }
    }, [socket, isConnected, isRTL, user]);

    // مؤشر قوة كلمة المرور
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const pwdStrength = getPasswordStrength(formData.password);
    const strengthLabels = [
        { ar: '', en: '' },
        { ar: 'ضعيفة', en: 'Weak' },
        { ar: 'مقبولة', en: 'Fair' },
        { ar: 'جيدة', en: 'Good' },
        { ar: 'قوية', en: 'Strong' },
    ];
    const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];

    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
    const passwordMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const trimmedName = formData.name.trim().replace(/\s+/g, ' ');
        if (trimmedName.length < 2) {
            setError(isRTL ? 'يرجى إدخال الاسم الكامل (حرفين على الأقل)' : 'Please enter your full name (at least 2 characters)');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError(isRTL ? 'كلمة المرور يجب أن تكون 6 خانات على الأقل' : 'Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const response = await api.auth.clientRegister({
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                name: formData.name.trim() || undefined,
                phone: formData.phone.trim() || undefined
            });

            if (response.success && response.token && response.user) {
                login(response.token, response.user);
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = "/cars";

                }, 1200);
            } else {
                const msg = response.message || response.error || '';
                if (msg.toLowerCase().includes('already') || msg.includes('Conflict') || msg.includes('مستخدم')) {
                    setError(isRTL ? '⚠️ البريد الإلكتروني مستخدم بالفعل' : '⚠️ Email already in use');
                } else {
                    setError(isRTL ? (response.message || 'فشل إنشاء الحساب، حاول مرة أخرى') : (response.message || 'Registration failed, please try again'));
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '';
            if (message.toLowerCase().includes('already')) {
                setError(isRTL ? '⚠️ البريد الإلكتروني مستخدم بالفعل' : '⚠️ Email already in use');
            } else {
                setError(isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`relative min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* الخلفية */}
            <CinematicVideoBackground
                videoSrc="/videos/hero.mp4"
                fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                mobileImage="/images/hmcar.jpg"
                overlayOpacity={0.65}
            />

            {/* كرات ضوئية */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="absolute w-[500px] h-[500px] top-[-150px] right-[-150px] rounded-full bg-[#c9a96e]/10 blur-[120px]" />
                <div className="absolute w-[400px] h-[400px] bottom-[-100px] left-[-100px] rounded-full bg-blue-500/8 blur-[100px]" />
            </div>

            {/* زر الرجوع */}
            <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`fixed top-6 ${isRTL ? 'right-6' : 'left-6'} z-50`}
            >
                <Link
                    href="/"
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
                className="relative z-10 w-full max-w-md"
            >
                <div className="relative bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    {/* خط علوي ذهبي */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a96e]/60 to-transparent" />

                    <div className="p-7 sm:p-10">
                        {/* رأس الصفحة */}
                        <div className="text-center mb-8">
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c9a96e]/10 border border-[#c9a96e]/20 mb-4"
                            >
                                <Sparkles className="w-3 h-3 text-[#c9a96e]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#c9a96e]/80">
                                    {isRTL ? 'انضم إلى المنصة' : 'JOIN THE PLATFORM'}
                                </span>
                            </motion.div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-tight text-white">
                                {isRTL ? 'حساب' : 'CREATE'}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#c9a96e] to-[#a07840]">
                                    {isRTL ? 'جديد' : 'ACCOUNT'}
                                </span>
                            </h1>
                            <p className="text-white/30 text-xs uppercase tracking-widest mt-2">
                                {isRTL ? 'مجاناً وبدون رسوم' : 'FREE & NO FEES'}
                            </p>
                        </div>

                        {/* حالة النجاح */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8 space-y-4"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto"
                                    >
                                        <ShieldCheck className="w-10 h-10 text-green-400" />
                                    </motion.div>
                                    <h2 className="text-2xl font-black text-white">
                                        {isRTL ? '🎉 تم إنشاء الحساب!' : '🎉 Account Created!'}
                                    </h2>
                                    <p className="text-white/50 text-sm">
                                        {isRTL ? 'جاري التوجيه إلى لوحة التحكم...' : 'Redirecting to dashboard...'}
                                    </p>
                                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* النموذج */}
                        {!success && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                {/* رسالة الخطأ */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center"
                                        >
                                            <span className="text-[11px] font-bold text-red-400">{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* الاسم */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? 'الاسم الكامل' : 'FULL NAME'}
                                        <span className="text-white/20 normal-case ms-1">{isRTL ? '(اختياري)' : '(optional)'}</span>
                                    </label>
                                    <div className="relative group">
                                        <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors", isRTL ? "right-4" : "left-4")} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all text-sm placeholder:text-white/20",
                                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                            )}
                                            placeholder={isRTL ? "مثال: محمد العلي" : "e.g. John Doe"}
                                        />
                                    </div>
                                </div>

                                {/* البريد الإلكتروني */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}
                                        <span className="text-red-400 ms-1">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors", isRTL ? "right-4" : "left-4")} />
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all text-sm placeholder:text-white/20",
                                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                            )}
                                            placeholder={isRTL ? "example@email.com" : "example@email.com"}
                                        />
                                    </div>
                                </div>

                                {/* رقم الهاتف */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? 'رقم الهاتف' : 'PHONE NUMBER'}
                                        <span className="text-white/20 normal-case ms-1">{isRTL ? '(اختياري)' : '(optional)'}</span>
                                    </label>
                                    <div className="relative group">
                                        <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors", isRTL ? "right-4" : "left-4")} />
                                        <input
                                            type="tel"
                                            autoComplete="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all text-sm placeholder:text-white/20",
                                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                            )}
                                            placeholder="+966 5X XXX XXXX"
                                        />
                                    </div>
                                </div>

                                {/* كلمة المرور */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? 'كلمة المرور' : 'PASSWORD'}
                                        <span className="text-red-400 ms-1">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors", isRTL ? "right-4" : "left-4")} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={cn(
                                                "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 outline-none focus:border-[#c9a96e]/50 focus:bg-white/8 transition-all text-sm placeholder:text-white/20",
                                                isRTL ? "pr-12 pl-12" : "pl-12 pr-12"
                                            )}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className={cn("absolute top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors", isRTL ? "left-4" : "right-4")}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* مؤشر قوة كلمة المرور */}
                                    {formData.password && (
                                        <div className="px-1 space-y-1.5">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div
                                                        key={i}
                                                        className="flex-1 h-1 rounded-full transition-all duration-300"
                                                        style={{ backgroundColor: i <= pwdStrength ? strengthColors[pwdStrength] : 'rgba(255,255,255,0.08)' }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[9px] font-bold" style={{ color: strengthColors[pwdStrength] || 'transparent' }}>
                                                {isRTL ? strengthLabels[pwdStrength]?.ar : strengthLabels[pwdStrength]?.en}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* تأكيد كلمة المرور */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? 'تأكيد كلمة المرور' : 'CONFIRM PASSWORD'}
                                        <span className="text-red-400 ms-1">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors", isRTL ? "right-4" : "left-4")} />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            minLength={6}
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className={cn(
                                                "w-full bg-white/5 border rounded-xl py-3.5 outline-none transition-all text-sm placeholder:text-white/20",
                                                isRTL ? "pr-12 pl-12" : "pl-12 pr-12",
                                                passwordsMatch ? "border-green-500/40 focus:border-green-500/60" :
                                                passwordMismatch ? "border-red-500/40 focus:border-red-500/60" :
                                                "border-white/10 focus:border-[#c9a96e]/50"
                                            )}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className={cn("absolute top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors", isRTL ? "left-4" : "right-4")}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        {/* أيقونة التحقق */}
                                        {formData.confirmPassword && (
                                            <div className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "left-10" : "right-10")}>
                                                {passwordsMatch
                                                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                                                    : <XCircle className="w-4 h-4 text-red-400" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                    {passwordMismatch && (
                                        <p className="text-[10px] text-red-400 font-bold px-1">
                                            {isRTL ? '⚠ كلمتا المرور غير متطابقتين' : '⚠ Passwords do not match'}
                                        </p>
                                    )}
                                </div>

                                {/* زر الإنشاء */}
                                <button
                                    type="submit"
                                    disabled={loading || (!!formData.confirmPassword && formData.password !== formData.confirmPassword)}
                                    className="w-full bg-gradient-to-r from-[#c9a96e] to-[#d4b57d] hover:from-[#d4b57d] hover:to-[#e0c08a] text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#c9a96e]/20 mt-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="uppercase tracking-widest text-sm">
                                                {isRTL ? 'إنشاء الحساب' : 'CREATE ACCOUNT'}
                                            </span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>

                                {/* رابط تسجيل الدخول */}
                                <div className="text-center pt-2">
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">
                                        {isRTL ? 'لديك حساب بالفعل؟ ' : 'ALREADY HAVE AN ACCOUNT? '}
                                        <Link
                                            href="/login"
                                            className="text-[#c9a96e] hover:text-[#d4b57d] hover:underline transition-all font-bold"
                                        >
                                            {isRTL ? 'سجل الدخول' : 'LOGIN NOW'}
                                        </Link>
                                    </span>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* HM CAR Branding */}
                <div className="text-center mt-6 opacity-20">
                    <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                        HM CAR // PREMIER EXPERIENCE
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
