'use client';

/**
 * صفحة تسجيل الدخول الموحدة لـ CAR X
 * - الآدمن والعميل يدخلان من نفس الصفحة
 * - أزرار إكمال الإيميل الذكي (@gmail.com / @icloud.com...)
 * - ربط الحساب بالجهاز (Device Fingerprint)
 * - التوجيه التلقائي: آدمن → لوحة التحكم | عميل → الصفحاته
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-original";
import { useRouter } from "next/navigation";

// اقتراحات الإيميل السريع
const EMAIL_DOMAINS = [
    "@gmail.com",
    "@icloud.com",
    "@hotmail.com",
    "@outlook.com",
    "@yahoo.com",
    "@live.com",
];

function getDeviceId(): string {
    if (typeof window === "undefined") return "server";
    let id = localStorage.getItem("carx_device_id");
    if (!id) {
        id = `${navigator.userAgent.slice(0, 20)}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("carx_device_id", id);
    }
    return id;
}

export default function CarXLogin() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");

    // حقول النموذج
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // الاقتراحات
    const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
    const [emailLocalPart, setEmailLocalPart] = useState("");

    // حالة الطلب
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // عند تغيير الإيميل → أظهر اقتراحات إذا لم يكتب @ بعد
    useEffect(() => {
        const atIndex = email.indexOf("@");
        if (atIndex === -1 && email.trim().length > 0) {
            setEmailLocalPart(email.trim());
            setEmailSuggestions(EMAIL_DOMAINS);
        } else {
            setEmailSuggestions([]);
            if (atIndex !== -1) setEmailLocalPart(email.slice(0, atIndex));
        }
    }, [email]);

    function applyEmailDomain(domain: string) {
        setEmail(emailLocalPart + domain);
        setEmailSuggestions([]);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email || !password) {
            setError(isRTL ? "يرجى تعبئة جميع الحقول" : "Please fill all fields");
            return;
        }

        if (mode === "register") {
            if (password !== confirmPassword) {
                setError(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
                return;
            }
            if (password.length < 6) {
                setError(isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
                return;
            }
        }

        setLoading(true);
        try {
            const deviceId = getDeviceId();
            const deviceInfo = typeof navigator !== "undefined" ? {
                userAgent: navigator.userAgent,
                platform: navigator.platform || "unknown",
                language: navigator.language,
            } : {};

            if (mode === "login") {
                console.log("[Login] Attempting login for:", email);
                const res = await api.auth.login({
                    identifier: email,
                    password,
                    deviceId,
                    deviceInfo,
                });
                
                console.log("[Login] Response received:", res.success ? "Success" : "Failed");

                if (res.success) {
                    // [[ARABIC_COMMENT]] تخزين التوكن وبيانات المستخدم
                    if (res.token) {
                        localStorage.setItem('hm_token', res.token);
                        document.cookie = `hm_token=${res.token}; path=/; max-age=2592000; SameSite=Lax`;
                    }
                    if (res.user) {
                        localStorage.setItem('hm_user', JSON.stringify(res.user));
                        localStorage.setItem('hm_user_role', res.user.role || 'buyer');
                        document.cookie = `hm_user_role=${res.user.role || 'buyer'}; path=/; max-age=2592000; SameSite=Lax`;
                    }

                    const role = res.user?.role;
                    console.log("[Login] User role:", role);

                    if (role === "admin" || role === "super_admin" || role === "manager") {
                        router.replace("/admin/dashboard");
                    } else {
                        router.replace("/client/dashboard");
                    }
                } else {
                    console.warn("[Login] Login failed message:", res.message);
                    // تحقق إذا كان الخطأ بسبب جهاز محظور
                    if (res.message?.includes("device") || res.message?.includes("جهاز")) {
                        setError(
                            isRTL
                                ? "لا يمكن الدخول من هذا الجهاز. تواصل مع خدمة العملاء."
                                : "Access denied from this device. Contact support."
                        );
                    } else {
                        setError(res.message || (isRTL ? "بيانات الدخول غير صحيحة" : "Invalid credentials"));
                    }
                }
            } else {
                const res = await api.auth.register({ email, password, deviceId, deviceInfo });
                if (res.success) {
                    setSuccess(isRTL ? "تم إنشاء الحساب بنجاح! جاري الدخول..." : "Account created! Signing in...");
                    setTimeout(async () => {
                        const loginRes = await api.auth.login({ identifier: email, password, deviceId, deviceInfo });
                        if (loginRes.success) router.replace("/client/dashboard");
                    }, 1200);
                } else {
                    setError(res.message || (isRTL ? "حدث خطأ أثناء إنشاء الحساب" : "Registration failed"));
                }
            }
        } catch (err: any) {
            console.error("[Login] Error during submission:", err);
            setError(err.message || (isRTL ? "خطأ في الاتصال. حاول مجدداً." : "Connection error. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden"
            dir={isRTL ? "rtl" : "ltr"}
        >
            {/* خلفية بصرية سينمائية متطورة */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
            </div>

            {/* شعار CAR X بتصميم متوهج */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-12 text-center z-10"
            >
                <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-white italic">
                    CAR<span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">X</span>
                </h1>
                <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/20" />
                    <p className="text-white/40 text-[10px] font-black tracking-[0.5em] uppercase">
                        {isRTL ? 'الفخامة المطلقة' : 'ULTIMATE LUXURY'}
                    </p>
                    <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/20" />
                </div>
            </motion.div>

            {/* بطاقة النموذج */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-md bg-zinc-950 border border-white/8 rounded-[2rem] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
            >
                <div className="flex rounded-2xl bg-white/5 border border-white/10 p-1.5 mb-10">
                    {(['login', 'register'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(""); }}
                            className={`flex-1 py-3 rounded-xl text-xs font-black tracking-[0.2em] transition-all duration-500 ${
                                mode === m
                                    ? "bg-white text-black shadow-2xl scale-[1.02]"
                                    : "text-white/40 hover:text-white/70"
                            }`}
                        >
                            {m === "login"
                                ? (isRTL ? "دخول" : "SIGN IN")
                                : (isRTL ? "عضوية جديدة" : "JOIN CLUB")}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* حقل الإيميل */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                            {isRTL ? "البريد الإلكتروني" : "Email Address"}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={isRTL ? "اكتب إيميلك..." : "Enter your email..."}
                            autoComplete="email"
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm font-medium focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
                        />

                        {/* اقتراحات الإيميل السريع */}
                        <AnimatePresence>
                            {emailSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="absolute top-full mt-2 left-0 right-0 z-30 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl"
                                >
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest px-4 pt-3 pb-1">
                                        {isRTL ? "اختر مزود الإيميل" : "Choose email provider"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 p-3">
                                        {emailSuggestions.map((domain) => (
                                            <button
                                                key={domain}
                                                type="button"
                                                onClick={() => applyEmailDomain(domain)}
                                                className="px-3 py-1.5 text-xs font-bold bg-white/5 hover:bg-red-600/20 hover:text-red-400 border border-white/10 hover:border-red-500/40 rounded-lg text-white/60 transition-all"
                                            >
                                                {emailLocalPart}<span className="text-red-400">{domain}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* حقل كلمة المرور */}
                    <div>
                        <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                            {isRTL ? "كلمة المرور" : "Password"}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isRTL ? "كلمة المرور..." : "Password..."}
                                autoComplete={mode === "register" ? "new-password" : "current-password"}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm font-medium focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all pe-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 -translate-y-1/2 end-3 text-white/30 hover:text-white/60 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* حقل تأكيد كلمة المرور (عند التسجيل فقط) */}
                    <AnimatePresence>
                        {mode === "register" && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={isRTL ? "أعد كتابة كلمة المرور..." : "Re-enter password..."}
                                        autoComplete="new-password"
                                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 text-sm font-medium focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all pe-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute top-1/2 -translate-y-1/2 end-3 text-white/30 hover:text-white/60 transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* رسالة الخطأ */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-start gap-3 bg-red-950/60 border border-red-800/50 rounded-xl p-3"
                            >
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <p className="text-red-300 text-xs font-semibold flex-1">{error}</p>
                                {/* زر تواصل مع خدمة العملاء إذا كان الجهاز محظوراً */}
                                {(error.includes("device") || error.includes("جهاز")) && (
                                    <a
                                        href="https://wa.me/967781007805"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 px-3 py-1 text-[10px] font-black bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        {isRTL ? "تواصل معنا" : "Contact Us"}
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* رسالة النجاح */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-green-950/60 border border-green-800/50 rounded-xl p-3 text-green-300 text-xs font-semibold"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* زر الإرسال */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.7)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : mode === "login" ? (
                            isRTL ? "دخول" : "SIGN IN"
                        ) : (
                            isRTL ? "إنشاء الحساب" : "CREATE ACCOUNT"
                        )}
                    </button>
                </form>
            </motion.div>

            {/* نص أسفل البطاقة */}
            <p className="mt-8 text-white/20 text-xs font-bold tracking-widest uppercase">
                © 2026 CAR X
            </p>
        </div>
    );
}
