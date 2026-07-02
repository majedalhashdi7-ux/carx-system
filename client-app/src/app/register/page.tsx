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
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
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

        if (formData.password !== formData.confirmPassword) {
            setError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
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

            if (response.success) {
                // حفظ التوكن والدخول التلقائي
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));
                const savedRole = response.user?.role || 'buyer';
                localStorage.setItem('hm_user_role', savedRole);

                document.cookie = `hm_token=${response.token}; path=/; max-age=86400; SameSite=Lax`;
                document.cookie = `hm_user_role=${savedRole}; path=/; max-age=86400; SameSite=Lax`;

                setSuccess(true);
                setTimeout(() => {
                    const isApp = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
                    window.location.href = isApp ? "/" : "/client/dashboard";
                }, 1000);
            } else {
                const msg = response.message || response.error || '';
                if (msg.includes('already exists') || msg.includes('Conflict')) {
                    setError(isRTL ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already in use');
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

                            {/* الاسم بالكامل - اختياري */}
                            <div className="relative">
                                <User className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                    placeholder={isRTL ? "الاسم بالكامل (اختياري)" : "Full Name (Optional)"}
                                />
                            </div>

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

                            {/* تأكيد كلمة المرور */}
                            <div className="relative">
                                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 ps-12 pe-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                    placeholder={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
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
                                        <span className="uppercase tracking-widest">{isRTL ? "إنشاء الحساب ودخول" : "CREATE ACCOUNT & LOGIN"}</span>
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
