'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

interface AuthModalsProps {
    showLoginModal: boolean;
    showRegisterModal: boolean;
    onCloseLogin: () => void;
    onCloseRegister: () => void;
    onSwitchToRegister: () => void;
    onSwitchToLogin: () => void;
}

export default function AuthModals({
    showLoginModal,
    showRegisterModal,
    onCloseLogin,
    onCloseRegister,
    onSwitchToRegister,
    onSwitchToLogin
}: AuthModalsProps) {
    const { isRTL } = useLanguage();
    const { login, register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const [loginData, setLoginData] = useState({ 
        email: '', 
        password: '' 
    });
    
    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        city: ''
    });

    // ميزة إكمال الإيميل التلقائي
    const handleEmailChange = (value: string, isRegister = false) => {
        if (isRegister) {
            setRegisterData(prev => ({ ...prev, email: value }));
        } else {
            setLoginData(prev => ({ ...prev, email: value }));
        }
    };

    const addGmailDomain = (isRegister = false) => {
        const currentEmail = isRegister ? registerData.email : loginData.email;
        if (currentEmail && !currentEmail.includes('@')) {
            const newEmail = currentEmail + '@gmail.com';
            handleEmailChange(newEmail, isRegister);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const success = await login(loginData.email, loginData.password);

            if (success) {
                setMessage({ type: 'success', text: isRTL ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!' });
                
                setTimeout(() => {
                    onCloseLogin();
                    setLoginData({ email: '', password: '' });
                }, 1500);
            } else {
                setMessage({ type: 'error', text: isRTL ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || (isRTL ? 'خطأ في الاتصال' : 'Connection error') });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        // التحقق من تطابق كلمات المرور
        if (registerData.password !== registerData.confirmPassword) {
            setMessage({ type: 'error', text: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
            setIsLoading(false);
            return;
        }

        try {
            const success = await register(
                registerData.name,
                registerData.email,
                registerData.password,
                registerData.phone
            );

            if (success) {
                setMessage({ type: 'success', text: isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!' });
                
                setTimeout(() => {
                    onCloseRegister();
                    onSwitchToLogin();
                    setRegisterData({
                        name: '',
                        email: '',
                        phone: '',
                        password: '',
                        confirmPassword: '',
                        city: ''
                    });
                }, 1500);
            } else {
                setMessage({ type: 'error', text: isRTL ? 'فشل في إنشاء الحساب' : 'Registration failed' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || (isRTL ? 'خطأ في الاتصال' : 'Connection error') });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Login Modal */}
            <AnimatePresence>
                {showLoginModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onCloseLogin}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-red-600/30 p-8 shadow-2xl backdrop-blur-xl"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* Animated Background */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 animate-pulse" />
                            
                            {/* Close Button */}
                            <motion.button
                                onClick={onCloseLogin}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-4 end-4 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-10"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </motion.button>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">
                                    {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                                </h2>
                                <p className="text-white/60 text-sm">
                                    {isRTL ? 'مرحباً بعودتك إلى CAR X' : 'Welcome back to CAR X'}
                                </p>
                            </div>

                            {/* رسائل الحالة */}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                                        message.type === 'success' 
                                            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                                            : 'bg-red-500/20 border border-red-500/30 text-red-400'
                                    }`}
                                >
                                    {message.type === 'success' ? 
                                        <CheckCircle className="w-5 h-5" /> : 
                                        <AlertCircle className="w-5 h-5" />
                                    }
                                    <span className="text-sm font-medium">{message.text}</span>
                                </motion.div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Email */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="email"
                                        value={loginData.email}
                                        onChange={(e) => handleEmailChange(e.target.value, false)}
                                        placeholder={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                                        className="w-full ps-12 pe-20 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                    {/* زر إكمال Gmail */}
                                    {loginData.email && !loginData.email.includes('@') && (
                                        <button
                                            type="button"
                                            onClick={() => addGmailDomain(false)}
                                            className="absolute inset-y-0 end-0 pe-4 flex items-center text-xs text-red-400 hover:text-red-300 font-medium"
                                        >
                                            @gmail.com
                                        </button>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                        placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                                        className="w-full ps-12 pe-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 end-0 pe-4 flex items-center"
                                    >
                                        {showPassword ? 
                                            <EyeOff className="w-5 h-5 text-white/40 hover:text-white/60" /> : 
                                            <Eye className="w-5 h-5 text-white/40 hover:text-white/60" />
                                        }
                                    </button>
                                </div>

                                {/* Forgot Password */}
                                <div className="text-end">
                                    <button type="button" className="text-red-400 hover:text-red-300 text-sm font-medium">
                                        {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{isRTL ? 'جاري الدخول...' : 'Signing In...'}</span>
                                        </>
                                    ) : (
                                        <span>{isRTL ? 'دخول' : 'Sign In'}</span>
                                    )}
                                </button>

                                {/* Switch to Register */}
                                <div className="text-center pt-4 border-t border-white/10">
                                    <p className="text-white/60 text-sm">
                                        {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseLogin();
                                                onSwitchToRegister();
                                            }}
                                            className="text-red-400 hover:text-red-300 font-medium"
                                        >
                                            {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Register Modal */}
            <AnimatePresence>
                {showRegisterModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onCloseRegister}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-red-600/30 p-8 shadow-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* Animated Background */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/5 via-transparent to-red-500/5 animate-pulse" />
                            
                            {/* Close Button */}
                            <motion.button
                                onClick={onCloseRegister}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-4 end-4 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all z-10"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </motion.button>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">
                                    {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
                                </h2>
                                <p className="text-white/60 text-sm">
                                    {isRTL ? 'انضم إلى عائلة CAR X اليوم' : 'Join the CAR X family today'}
                                </p>
                            </div>

                            {/* رسائل الحالة */}
                            {message && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                                        message.type === 'success' 
                                            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                                            : 'bg-red-500/20 border border-red-500/30 text-red-400'
                                    }`}
                                >
                                    {message.type === 'success' ? 
                                        <CheckCircle className="w-5 h-5" /> : 
                                        <AlertCircle className="w-5 h-5" />
                                    }
                                    <span className="text-sm font-medium">{message.text}</span>
                                </motion.div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleRegister} className="space-y-6">
                                {/* Name */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <User className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="text"
                                        value={registerData.name}
                                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                                        placeholder={isRTL ? 'الاسم الكامل' : 'Full Name'}
                                        className="w-full ps-12 pe-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="email"
                                        value={registerData.email}
                                        onChange={(e) => handleEmailChange(e.target.value, true)}
                                        placeholder={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                                        className="w-full ps-12 pe-20 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                    {/* زر إكمال Gmail */}
                                    {registerData.email && !registerData.email.includes('@') && (
                                        <button
                                            type="button"
                                            onClick={() => addGmailDomain(true)}
                                            className="absolute inset-y-0 end-0 pe-4 flex items-center text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                                        >
                                            @gmail.com
                                        </button>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Phone className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={registerData.phone}
                                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                                        placeholder={isRTL ? 'رقم الهاتف' : 'Phone Number'}
                                        className="w-full ps-12 pe-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                </div>

                                {/* City */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <MapPin className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="text"
                                        value={registerData.city}
                                        onChange={(e) => setRegisterData({...registerData, city: e.target.value})}
                                        placeholder={isRTL ? 'المدينة' : 'City'}
                                        className="w-full ps-12 pe-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                                        placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                                        className="w-full ps-12 pe-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 end-0 pe-4 flex items-center"
                                    >
                                        {showPassword ? 
                                            <EyeOff className="w-5 h-5 text-white/40 hover:text-white/60" /> : 
                                            <Eye className="w-5 h-5 text-white/40 hover:text-white/60" />
                                        }
                                    </button>
                                </div>

                                {/* Confirm Password */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-white/40" />
                                    </div>
                                    <input
                                        type="password"
                                        value={registerData.confirmPassword}
                                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                                        placeholder={isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                        className="w-full ps-12 pe-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:border-red-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>{isRTL ? 'جاري إنشاء الحساب...' : 'Creating Account...'}</span>
                                        </>
                                    ) : (
                                        <span>{isRTL ? 'إنشاء الحساب' : 'Create Account'}</span>
                                    )}
                                </button>

                                {/* Switch to Login */}
                                <div className="text-center pt-4 border-t border-white/10">
                                    <p className="text-white/60 text-sm">
                                        {isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onCloseRegister();
                                                onSwitchToLogin();
                                            }}
                                            className="text-red-400 hover:text-red-300 font-medium"
                                        >
                                            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}