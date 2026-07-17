'use client';

/**
 * صفحة تسجيل الدخول (Login Page)
 * تتيح للمستخدمين (سواء عملاء أو مدراء) الدخول إلى النظام.
 * تدعم تسجيل الدخول بالاسم أو برقم الهاتف مع التحقق عبر رمز OTP.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User, ShieldCheck, Lock, ArrowRight, ChevronLeft, ChevronRight, Key, UserCheck, Sparkles, Power, Eye, EyeOff, Phone, AlertOctagon, Copy, MessageCircle, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { countryDialCodes } from "@/lib/countries";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { useTenant } from "@/lib/TenantContext";
import dynamic from "next/dynamic";
const CarXLogin = dynamic(() => import("@/components/CarXLogin"), { ssr: false });

export default function Login() {
    const { tenant } = useTenant();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-black" />;

    if (tenant?.id === 'carx') return <CarXLogin />;
    return <HMCarLogin />;
}

function HMCarLogin() {
    const { isRTL } = useLanguage();
    
    // --- حالات الواجهة (States) ---
    const [role, setRole] = useState<'buyer' | 'admin'>('buyer'); // دور المستخدم الحالي
    const [formData, setFormData] = useState({ email: '', password: '', name: '' }); // بيانات النموذج الأساسية
    const [loading, setLoading] = useState(false); // حالة التحميل أثناء الإرسال
    const [error, setError] = useState(''); // رسائل الخطأ
    const [rememberMe, setRememberMe] = useState(false); // خيار "تذكرني"
    const [successMessage, setSuccessMessage] = useState(''); // رسائل النجاح
    const [showPassword, setShowPassword] = useState(false); // إظهار أو إخفاء كلمة المرور
    const [banInfo, setBanInfo] = useState<{ banned: boolean, banCode: string, message: string } | null>(null); // معلومات الحظر في حال تم حظر الجهاز
    const [isRegister, setIsRegister] = useState(false); // هل نحن في وضع إنشاء حساب؟
    const [confirmPassword, setConfirmPassword] = useState(''); // تأكيد كلمة المرور لإنشاء الحساب
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false); // إظهار محول الأدوار (عميل/مدير)

    const { socket, isConnected } = useSocket();
    const { user, login: authLogin } = useAuth();
    const _DEV_FAKE = process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN === '1';

    // عند تحميل الصفحة للمرة الأولى
    useEffect(() => {
        try {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            
            // التمييز بين الويب والتطبيق
            if (!isStandalone) {
                // على الموقع، نظهر محول الأدوار دائماً
                setShowRoleSwitcher(true);
                if (path.includes('/admin/login') || sp?.get('role') === 'admin') {
                    setRole('admin');
                }
            } else {
                // على التطبيق، نبدأ كعميل فوراً ونخفي المحول
                setRole('buyer');
                setShowRoleSwitcher(false);
            }
        } catch { }
    }, []);

    // تتبع دخول العميل لصفحة تسجيل الدخول وإبلاغ الأدمن
    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('user_navigation', {
                userName: user?.name || (isRTL ? 'زائر' : 'Guest'),
                page: isRTL ? 'صفحة تسجيل الدخول' : 'Login Page',
                timestamp: new Date()
            });
        }
    }, [socket, isConnected, isRTL, user]);

    /**
     * معالجة عملية تسجيل الدخول عند الضغط على الزر
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let response;
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('hm_device_id') || '' : '';

            const identifier = formData.email.trim();
            
            // --- أولاً: معالجة دخول المدير ---
            if (role === 'admin') {
                response = await api.auth.login({
                    identifier: identifier,
                    password: formData.password,
                    role,
                    rememberMe,
                    deviceId
                });
            } else {
                // --- ثانياً: معالجة دخول أو تسجيل العميل بالإيميل ---
                if (!identifier) {
                    throw new Error(isRTL ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');
                }
                
                if (formData.password.length < 6) {
                    throw new Error(isRTL ? 'كلمة المرور يجب أن تكون 6 خانات على الأقل' : 'Password must be at least 6 characters');
                }

                if (isRegister) {
                    if (!formData.name.trim()) {
                        throw new Error(isRTL ? 'الرجاء إدخال الاسم الكامل' : 'Please enter your full name');
                    }
                    if (formData.password !== confirmPassword) {
                        throw new Error(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
                    }
                    response = await api.auth.clientRegister({
                        email: identifier,
                        password: formData.password,
                        confirmPassword,
                        name: formData.name.trim()
                    });
                } else {
                    response = await api.auth.clientLogin({
                        email: identifier,
                        password: formData.password,
                        rememberMe
                    });
                }
            }

            if (response.success) {
                // استخدام AuthContext.login لتحديث الحالة فوراً عبر التطبيق + حفظ في localStorage
                authLogin(response.token, response.user);

                // حفظ أو مسح بيانات "تذكرني"
                if (rememberMe) {
                    try {
                        localStorage.setItem('hm_remember', JSON.stringify({
                            identifier: identifier,
                            password: formData.password,
                            role: role
                        }));
                    } catch (e) { }
                } else {
                    try {
                        localStorage.removeItem('hm_remember');
                    } catch (e) { }
                }

                // تمديد الكوكيز إذا اختار "تذكرني"
                if (rememberMe) {
                    const maxAge = 604800; // أسبوع
                    document.cookie = `hm_token=${response.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                    document.cookie = `hm_user_role=${response.user?.role || 'buyer'}; path=/; max-age=${maxAge}; SameSite=Lax`;
                }
                
                if (isRegister && role === 'buyer') {
                    setSuccessMessage(isRTL ? 'تم إنشاء حسابك بنجاح! جاري الدخول...' : 'Account created! Logging in...');
                } else {
                    setSuccessMessage(isRTL ? 'تم تسجيل الدخول بنجاح ✓' : 'Login successful ✓');
                }

                // التوجيه التلقائي بناءً على دور المستخدم أو المعلمة 'redirect'
                setTimeout(() => {
                    const userRole = response.user.role || 'buyer';
                    const params = new URLSearchParams(window.location.search);
                    const redirectTo = params.get('redirect');
                    if (redirectTo && redirectTo.startsWith('/')) {
                        window.location.href = redirectTo;
                    } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
                        window.location.href = "/admin/dashboard";
                    } else {
                        const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
                        window.location.href = isApp ? "/" : "/client/dashboard";
                    }
                }, 400);

            } else {
                setError(response.error || response.message || (isRTL ? 'فشل العملية' : 'Operation failed'));
                setLoading(false);
            }
        } catch (err: unknown) {
            const e = err as Error & { banned?: boolean; banCode?: string };
            if (e.banned) {
                setBanInfo({ banned: true, banCode: e.banCode || '', message: e.message || (isRTL ? 'تم حظر جهازك' : 'Your device is banned') });
                setLoading(false);
                return;
            }

            setError(e.message || (isRTL ? 'فشل العملية. تحقق من البيانات أو تواصل مع الدعم.' : 'Failed. Check your credentials or contact support.'));
            setLoading(false);
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hm_remember');
            if (saved) {
                const data = JSON.parse(saved);
                if (data && typeof data.identifier === 'string' && typeof data.password === 'string') {
                    // لأسباب أمنية: لا نقوم بتعبئة معرف الأدمن تلقائياً حتى لا يراه أي شخص يقف بجانب الشاشة
                    const isSystemAccount = data.role === 'admin' || data.identifier.toLowerCase().includes('admin');
                    setFormData({
                        email: isSystemAccount ? '' : data.identifier,
                        password: data.password,
                        name: ''
                    });
                    setRememberMe(true);
                    if (data.role) setRole(data.role);
                }
            }
        } catch { }
    }, []);

    // عند تغيير وضع التسجيل/الدخول، امسح الحقول
    useEffect(() => {
        setError('');
        setSuccessMessage('');
        setConfirmPassword('');
        setFormData(prev => ({ ...prev, name: '' }));
    }, [isRegister]);

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* الخلفية السينمائية - Cinematic Background */}
            <CinematicVideoBackground
                videoSrc="/videos/video.mp4"
                fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                mobileImage="/images/hmcar.jpg"
                overlayOpacity={0.55}
            />

            {/* الكرات الضوئية الخلفية - AMBIENT ORBS */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="orb orb-gold w-[600px] h-[600px] top-[-200px] right-[-200px] animate-breathe blur-[100px] opacity-30" />
                <div className="orb orb-blue w-[400px] h-[400px] bottom-[-100px] left-[-100px] animate-breathe delay-1000 blur-[100px] opacity-20" />
            </div>



            {/* بطاقة تسجيل الدخول أو بطاقة الحظر - LOGIN CARD OR BAN CARD */}
            <motion.div
                initial={{ opacity: 0.5, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md px-2"
            >
                {banInfo ? (
                    <div className="relative glass-card p-6 sm:p-10 md:p-12 rounded-3xl border border-red-500/20 bg-red-950/20 backdrop-blur-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
                        <div className="text-center space-y-6">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"
                            >
                                <AlertOctagon className="w-10 h-10 text-red-500" />
                            </motion.div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{isRTL ? "تم حظر الجهاز" : "DEVICE BANNED"}</h2>
                                <p className="text-white/60 mt-2 text-sm max-w-xs mx-auto text-balance font-medium leading-relaxed">{banInfo.message}</p>
                            </div>

                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{isRTL ? "رمز الحظر" : "BAN CODE"}</span>
                                <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10 group hover:border-red-500/30 transition-all">
                                    <span className="font-mono text-xl tracking-[0.2em] font-bold text-red-400">{banInfo.banCode}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(banInfo.banCode);
                                            setSuccessMessage(isRTL ? 'تم النسخ!' : 'Copied!');
                                            setTimeout(() => setSuccessMessage(''), 2000);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                        title={isRTL ? "نسخ الرمز" : "Copy Code"}
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                                {successMessage && <div className="text-green-400 text-xs text-center font-bold mt-2">{successMessage}</div>}
                            </div>

                            <a
                                href={`https://wa.me/967781007805?text=${encodeURIComponent(isRTL ? `مرحباً، تم حظر جهازي وهذا هو رمز الحظر:\n*${banInfo.banCode}*` : `Hello, my device is banned. Ban code:\n*${banInfo.banCode}*`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 rounded-xl font-bold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-black transition-all duration-300"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? "التواصل لفك الحظر" : "CONTACT SUPPORT"}
                            </a>

                            <button
                                onClick={() => { setBanInfo(null); setFormData({ email: '', password: '', name: '' }); setError(''); }}
                                className="w-full py-3 text-xs font-bold text-white/30 hover:text-white/70 tracking-wider uppercase transition-colors"
                            >
                                {isRTL ? "العودة لتسجيل الدخول" : "BACK TO LOGIN"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative glass-card p-6 sm:p-10 md:p-12 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-20`}
                        >
                            <Link href="/">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={isRTL ? 'الرئيسية' : 'Home'}
                                    className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-accent-gold hover:border-accent-gold/40 hover:bg-accent-gold/10 transition-all duration-300 shadow-lg"
                                >
                                    {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                </motion.div>
                            </Link>
                        </motion.div>

                        {/* الهيدر والعنوان - Header */}
                        <div className="text-center space-y-6 mb-10">
                            {/* Animated badge */}
                            <motion.div
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                            >
                                <Key className={cn("w-3 h-3", role === 'admin' ? "text-accent-red" : "text-accent-gold")} />
                                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/50">
                                    {role === 'admin'
                                        ? (isRTL ? "دخول النظام" : "SYSTEM ACCESS")
                                        : (isRTL ? "من دخول العميل" : "CLIENT ACCESS")
                                    }
                                </span>
                            </motion.div>

                            {/* Title */}
                            <div>
                                <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] uppercase leading-[0.9] text-white">
                                    {isRTL ? "تسجيل" : "SIGN"}
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">{isRTL ? "الدخول" : "IN"}</span>
                                </h1>
                            </div>
                        </div>

                        {/* محول الأدوار - Role Switcher */}
                        {showRoleSwitcher && (
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-6 backdrop-blur-md">
                                <button
                                    onClick={() => setRole('buyer')}
                                    className={cn(
                                        "relative overflow-hidden flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]",
                                        role === 'buyer'
                                            ? "bg-white text-black shadow-lg shadow-white/10"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <UserCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    {isRTL ? "عميل" : "CLIENT"}
                                </button>
                                <button
                                    onClick={() => {
                                        setRole('admin');
                                        if (formData.email.toLowerCase().includes('admin')) {
                                            setFormData(prev => ({ ...prev, email: '' }));
                                        }
                                    }}
                                    className={cn(
                                        "relative overflow-hidden flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]",
                                        role === 'admin'
                                            ? "bg-accent-red text-white shadow-lg shadow-red-500/20"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    {isRTL ? "مدير" : "ADMIN"}
                                </button>
                            </div>
                        )}

                        {/* تبويب تسجيل الدخول / إنشاء حساب للعميل */}
                        {role === 'buyer' && (
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-8 backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={() => setIsRegister(false)}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider",
                                        !isRegister
                                            ? "bg-[#c9a96e] text-black shadow-lg"
                                            : "text-white/40 hover:text-white/60"
                                    )}
                                >
                                    {isRTL ? "تسجيل الدخول" : "SIGN IN"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRegister(true)}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider",
                                        isRegister
                                            ? "bg-[#c9a96e] text-black shadow-lg"
                                            : "text-white/40 hover:text-white/60"
                                    )}
                                >
                                    {isRTL ? "حساب جديد" : "REGISTER"}
                                </button>
                            </div>
                        )}

                        {/* نموذج البيانات - Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Alert Messages */}
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-center backdrop-blur-md"
                                    >
                                        <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest">{error}</span>
                                    </motion.div>
                                )}
                                {successMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center backdrop-blur-md"
                                    >
                                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">{successMessage}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Identifier */}
                            <div className="space-y-2">
                                {role === 'buyer' ? (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                            {isRTL ? "البريد الإلكتروني" : "EMAIL ADDRESS"}
                                        </label>
                                        <div className="relative group">
                                            <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-blue-500/25" />
                                            <Mail className={cn(
                                                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                                isRTL ? "right-4" : "left-4"
                                            )} />
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                name="client_email_field"
                                                autoComplete="email"
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={cn(
                                                    "w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-blue-500/30 ring-1 ring-blue-500/20",
                                                    isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                                )}
                                                placeholder={isRTL ? "اكتب البريد الإلكتروني" : "Enter email address"}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                            {isRTL ? "اسم المستخدم / المعرّف" : "USERNAME / ACCESS ID"}
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-red-500/25" />
                                            <User className={cn(
                                                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 transition-colors",
                                                isRTL ? "right-4" : "left-4"
                                            )} />
                                            <input
                                                type="text"
                                                required
                                                value={formData.email}
                                                name="admin_name_field"
                                                autoComplete="off"
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                spellCheck="false"
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={cn("w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-red-500/30 ring-1 ring-red-500/20", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                placeholder={isRTL ? "ايميل المدير" : "Admin Email"}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                    {isRTL ? "كلمة المرور" : "PASSWORD"}
                                </label>
                                <div className="relative group">
                                    <span className={cn("pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10", role === 'buyer' ? "bg-blue-500/25" : "bg-red-500/25")} />
                                    <Lock className={cn(
                                        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                        isRTL ? "right-4" : "left-4"
                                    )} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={6}
                                        autoCapitalize="none"
                                        autoComplete="new-password"
                                        name="user_password_field"
                                        autoCorrect="off"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={cn(
                                            "w-full glass-input bg-white/5 focus:bg-white/10 outline-none",
                                            isRTL ? "pr-12 pl-4" : "pl-12 pr-4",
                                            role === 'buyer'
                                                ? "border border-blue-500/30 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                                                : "border border-red-500/30 ring-1 ring-red-500/20 shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                                        )}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className={cn("absolute top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors", isRTL ? "left-4" : "right-4")}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Name field - only for registration */}
                            {role === 'buyer' && isRegister && (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? "الاسم الكامل" : "FULL NAME"}
                                    </label>
                                    <div className="relative group">
                                        <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-blue-500/25" />
                                        <User className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                            isRTL ? "right-4" : "left-4"
                                        )} />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            name="client_name_field"
                                            autoComplete="name"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={cn(
                                                "w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-blue-500/30 ring-1 ring-blue-500/20",
                                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                            )}
                                            placeholder={isRTL ? "اكتب اسمك الكامل" : "Enter your full name"}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Confirm Password Field (Only for client registration) */}
                            {role === 'buyer' && isRegister && (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                        {isRTL ? "تأكيد كلمة المرور" : "CONFIRM PASSWORD"}
                                    </label>
                                    <div className="relative group">
                                        <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-blue-500/25" />
                                        <Lock className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                            isRTL ? "right-4" : "left-4"
                                        )} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            autoCapitalize="none"
                                            autoComplete="new-password"
                                            name="user_confirm_password_field"
                                            autoCorrect="off"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={cn(
                                                "w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-blue-500/30 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]",
                                                isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                            )}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Options Row */}
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                                    <div className={cn(
                                        "w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all",
                                        rememberMe
                                            ? (role === 'admin' ? "bg-accent-red border-accent-red" : "bg-[#c9a96e] border-[#c9a96e]")
                                            : "border-white/10 bg-white/5"
                                    )}>
                                        {rememberMe && <Sparkles className={cn("w-2.5 h-2.5 text-black")} />}
                                    </div>
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] hover:text-white/50 transition-colors">
                                        {isRTL ? 'تذكرني' : 'REMEMBER ME'}
                                    </span>
                                </div>
                                {role === 'buyer' && !isRegister ? (
                                    <Link
                                        href="/forgot-password"
                                        className="text-[9px] font-bold text-[#c9a96e]/60 uppercase tracking-[0.15em] hover:text-[#c9a96e] transition-colors hover:underline underline-offset-4 decoration-[#c9a96e]/30"
                                    >
                                        {isRTL ? 'نسيت كلمة المرور؟' : 'FORGOT PASSWORD?'}
                                    </Link>
                                ) : role === 'buyer' ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsRegister(!isRegister)}
                                        className="text-[9px] font-bold text-[#c9a96e]/70 uppercase tracking-[0.15em] hover:text-[#c9a96e] transition-colors hover:underline underline-offset-4 decoration-[#c9a96e]/30"
                                    >
                                        {isRegister 
                                            ? (isRTL ? "لديك حساب؟ دخول" : "HAVE ACCOUNT? LOGIN") 
                                            : (isRTL ? "حساب جديد" : "NEW ACCOUNT")
                                        }
                                    </button>
                                ) : (
                                    <Link
                                        href="/register"
                                        className="text-[9px] font-bold text-[#c9a96e]/70 uppercase tracking-[0.15em] hover:text-[#c9a96e] transition-colors hover:underline underline-offset-4 decoration-[#c9a96e]/30"
                                    >
                                        {isRTL ? "حساب جديد" : "NEW ACCOUNT"}
                                    </Link>
                                )}
                            </div>

                            {/* زر الإرسال */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-xl font-black text-sm tracking-widest mt-4 flex items-center justify-center gap-3 transition-all duration-300",
                                    role === 'admin'
                                        ? "bg-accent-red hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                                        : "bg-[#D4AF37] hover:bg-[#c9a030] text-black shadow-lg shadow-[#D4AF37]/20",
                                    loading && "opacity-50 pointer-events-none"
                                )}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-sm font-black tracking-wider">
                                        {role === 'buyer' && isRegister
                                            ? (isRTL ? 'إنشاء الحساب' : 'Create Account')
                                            : role === 'admin'
                                            ? (isRTL ? 'دخول النظام' : 'System Access')
                                            : (isRTL ? 'تسجيل الدخول' : 'Sign In')
                                        }
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </motion.div>

            {/* ── Bottom Branding ── */}
            <div className="fixed bottom-8 text-center opacity-20 hover:opacity-40 transition-opacity duration-500">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                    HM CAR // PREMIER EXPERIENCE
                </span>
            </div>
        </div >
    );
}
