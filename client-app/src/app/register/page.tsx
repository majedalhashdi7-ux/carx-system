'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User, Mail, Lock, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Phone } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";

export default function Register() {
    const { isRTL } = useLanguage();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('user_navigation', {
                userName: user?.name || (isRTL ? 'زائر جديد' : 'New Guest'),
                page: isRTL ? 'صفحة إنشاء حساب' : 'Register Page',
                timestamp: new Date()
            });
        }
    }, [socket, isConnected, isRTL, user]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const firstName = formData.firstName.trim();
        const lastName = formData.lastName.trim();

        if (!firstName || !lastName) {
            setError(isRTL ? 'الاسم الأول واسم العائلة مطلوبان' : 'First name and last name are required');
            setLoading(false);
            return;
        }

        const fullName = `${firstName} ${lastName}`;

        try {
            const response = await api.auth.register({
                name: fullName,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                const msg = response.message || response.error || '';
                if (msg.includes('already exists') || msg.includes('Conflict')) {
                    setError(isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use');
                } else if (msg.includes('two names') || msg.includes('Full name')) {
                    setError(isRTL ? 'يجب إدخال الاسم الأول واسم العائلة' : 'Please enter first and last name');
                } else {
                    setError(isRTL ? 'فشل إنشاء الحساب، حاول مرة أخرى' : 'Registration failed, please try again');
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '';
            if (message.includes('already exists')) {
                setError(isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use');
            } else {
                setError(isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

            <CinematicVideoBackground
                videoSrc="/videos/hero.mp4"
                fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                mobileImage="/images/hmcar.jpg"
                overlayOpacity={0.6}
            />

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="fixed top-8 left-8 z-50"
            >
                <Link href="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-[#c9a96e] transition-all">
                    <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#c9a96e]/50 backdrop-blur-md">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                </Link>
            </motion.div>

            {/* Register Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md px-2"
            >
                <div className="glass-card p-10 md:p-12 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                            {isRTL ? "إنشاء" : "CREATE"} <span className="text-[#c9a96e]">{isRTL ? "حساب" : "ACCOUNT"}</span>
                        </h1>
                        <p className="text-white/40 text-xs uppercase tracking-widest">{isRTL ? "انضم لنخبة مقتني السيارات" : "JOIN THE ELITE COLLECTORS"}</p>
                    </div>

                    {success ? (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold">{isRTL ? "تم بنجاح!" : "Success!"}</h2>
                            <p className="text-white/60">{isRTL ? "جاري تحويلك لصفحة الدخول..." : "Redirecting to login..."}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                    <span className="text-[11px] font-bold text-red-400">{error}</span>
                                </div>
                            )}

                            {/* الاسم الأول واسم العائلة */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <User className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        id="firstName"
                                        type="text"
                                        required
                                        autoComplete="given-name"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all text-sm"
                                        placeholder={isRTL ? "الاسم الأول" : "First Name"}
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        id="lastName"
                                        type="text"
                                        required
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all text-sm"
                                        placeholder={isRTL ? "اسم العائلة" : "Last Name"}
                                    />
                                </div>
                            </div>
                            <p className="text-[9px] text-white/25 text-center tracking-wider -mt-1">
                                {isRTL ? "مثال: محمد الشمري  •  John Smith" : "e.g.  John Smith  •  محمد الشمري"}
                            </p>

                            {/* البريد الإلكتروني */}
                            <div className="relative">
                                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                    placeholder={isRTL ? "البريد الإلكتروني" : "Email Address"}
                                />
                            </div>

                            {/* رقم الهاتف (اختياري) */}
                            <div className="relative">
                                <Phone className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    id="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                    placeholder={isRTL ? "رقم الهاتف — اختياري" : "Phone Number — optional"}
                                />
                            </div>

                            {/* كلمة المرور */}
                            <div className="relative">
                                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                    placeholder={isRTL ? "كلمة المرور (٦ أحرف على الأقل)" : "Password (min. 6 characters)"}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#c9a96e] hover:bg-[#d4b57d] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest">{isRTL ? "إنشاء الحساب" : "CREATE ACCOUNT"}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                    {isRTL ? "لديك حساب بالفعل؟ " : "ALREADY HAVE AN ACCOUNT? "}
                                    <Link href="/login" className="text-[#c9a96e] hover:underline transition-all">
                                        {isRTL ? "سجل الدخول" : "LOGIN NOW"}
                                    </Link>
                                </span>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
