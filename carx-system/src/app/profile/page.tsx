'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle, ArrowRight, Shield, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-white/60 text-lg">يجب تسجيل الدخول أولاً</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-luxury-gold text-black font-black rounded-xl hover:bg-white transition-colors">
            <ArrowRight className="w-4 h-4" />
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const res = await api.auth.updateProfile({ name, email, phone });
    if (res.error) {
      setProfileMsg({ type: 'error', text: res.error });
    } else {
      const data = res.data as any;
      // تحديث التوكن والمستخدم في السياق
      if (data?.token && data?.user) {
        login(data.token, data.user);
      }
      setProfileMsg({ type: 'success', text: 'تم تحديث البيانات بنجاح ✓' });
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'كلمات المرور الجديدة غير متطابقة' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      return;
    }

    setPasswordLoading(true);
    const res = await api.auth.changePassword(currentPassword, newPassword);
    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      const data = res.data as any;
      if (data?.token) {
        login(data.token, user);
      }
      setPasswordMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح ✓' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordLoading(false);
  };

  const isAdmin = user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager';

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/" className="text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold flex items-center gap-1">
              <ArrowRight className="w-4 h-4" />
              الرئيسية
            </Link>
            <span className="text-white/20">/</span>
            <Link href="/my-orders" className="text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold">
              طلباتي
            </Link>
            {isAdmin && (
              <>
                <span className="text-white/20">/</span>
                <Link href="/admin" className="text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold">
                  لوحة التحكم
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
              {isAdmin ? (
                <Shield className="w-8 h-8 text-luxury-gold" />
              ) : (
                <User className="w-8 h-8 text-luxury-gold" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">الملف الشخصي</h1>
              <p className="text-white/40 text-sm mt-1">
                {isAdmin ? '👑 مدير النظام' : '👤 عميل'} · {user.email}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-8 p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
          {([
            { id: 'profile', label: 'البيانات الشخصية', icon: User },
            { id: 'password', label: 'كلمة المرور', icon: Lock },
          ] as { id: Tab; label: string; icon: any }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <Link
            href="/my-orders"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-black text-white/40 hover:text-white hover:bg-white/[0.04] transition-all duration-300"
          >
            <ShoppingBag className="w-4 h-4" />
            طلباتي
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ===== Profile Tab ===== */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/50 uppercase tracking-widest">الاسم الكامل</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-white/30" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 placeholder:text-white/20"
                      placeholder="الاسم الكامل"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/50 uppercase tracking-widest">البريد الإلكتروني</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-white/30" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 placeholder:text-white/20"
                      placeholder="example@carx.sa"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-white/50 uppercase tracking-widest">رقم الهاتف</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-white/30" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-4 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 placeholder:text-white/20"
                      placeholder="+966 5x xxx xxxx"
                    />
                  </div>
                </div>

                {/* Message */}
                <AnimatePresence>
                  {profileMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold ${
                        profileMsg.type === 'success'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {profileMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      {profileMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={profileLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-luxury-gold hover:bg-white text-black font-black text-sm rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] disabled:opacity-50"
                >
                  {profileLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التغييرات
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* ===== Password Tab ===== */}
          {activeTab === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                {[
                  { label: 'كلمة المرور الحالية', value: currentPassword, onChange: setCurrentPassword, show: showCurrent, toggleShow: () => setShowCurrent(v => !v) },
                  { label: 'كلمة المرور الجديدة', value: newPassword, onChange: setNewPassword, show: showNew, toggleShow: () => setShowNew(v => !v) },
                  { label: 'تأكيد كلمة المرور الجديدة', value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, toggleShow: () => setShowConfirm(v => !v) },
                ].map((field, i) => (
                  <div key={i} className="space-y-2">
                    <label className="block text-xs font-black text-white/50 uppercase tracking-widest">{field.label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-white/30" />
                      </div>
                      <input
                        type={field.show ? 'text' : 'password'}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-4 pr-12 pl-12 text-white text-sm focus:outline-none focus:border-luxury-gold/60 focus:ring-2 focus:ring-luxury-gold/20 transition-all duration-300 placeholder:text-white/20"
                        placeholder="••••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={field.toggleShow}
                        className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 hover:text-luxury-gold transition-colors"
                      >
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Strength indicator */}
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = [newPassword.length >= 6, /[A-Z]/.test(newPassword), /[0-9]/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)].filter(Boolean).length;
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              level <= strength
                                ? strength <= 1 ? 'bg-red-500' : strength <= 2 ? 'bg-yellow-500' : strength <= 3 ? 'bg-blue-500' : 'bg-green-500'
                                : 'bg-white/10'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-white/30">قوة كلمة المرور: استخدم أحرفاً كبيرة، أرقاماً، ورموزاً</p>
                  </div>
                )}

                {/* Message */}
                <AnimatePresence>
                  {passwordMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-bold ${
                        passwordMsg.type === 'success'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {passwordMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      {passwordMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-luxury-gold hover:bg-white text-black font-black text-sm rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      تغيير كلمة المرور
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
