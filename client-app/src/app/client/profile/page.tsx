'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    User,
    Mail,
    Phone,
    Lock,
    Save,
    Edit3,
    Shield,
    LogOut,
    ShieldCheck,
    ShieldOff,
    Key,
    Copy,
    CheckCircle2
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api-original";
import ClientPageHeader from "@/components/ClientPageHeader";

const rawText = (value: string) => value;

export default function ClientProfilePage() {
    const { isRTL } = useLanguage();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'buyer'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    // ─── 2FA State ───
    const [twoFaEnabled, setTwoFaEnabled] = useState(false);
    const [twoFaStep, setTwoFaStep] = useState<'idle' | 'setup' | 'verify' | 'done'>('idle');
    const [twoFaQR, setTwoFaQR] = useState('');
    const [twoFaSecret, setTwoFaSecret] = useState('');
    const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);
    const [twoFaCode, setTwoFaCode] = useState('');
    const [twoFaLoading, setTwoFaLoading] = useState(false);
    const [twoFaMsg, setTwoFaMsg] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('hm_user');
            if (user) {
                try {
                    const data = JSON.parse(user);
                    setUserData({
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        role: data.role || 'buyer'
                    });
                    setTwoFaEnabled(!!data.twoFactorEnabled);
                } catch (e) {
                    console.error('Error parsing user data', e);
                }
            }
        }
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await api.users.updateProfile(userData);
            const currentUser = JSON.parse(localStorage.getItem('hm_user') || '{}');
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('hm_user', JSON.stringify(updatedUser));
            setMessage(isRTL ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully');
        } catch (err: any) {
            setMessage(err.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await api.auth.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (res.success && res.token) {
                localStorage.setItem('hm_token', res.token);
                // Also set cookie for middleware
                document.cookie = `hm_token=${res.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                
                setMessage(isRTL ? '✅ تم تغيير كلمة المرور بنجاح' : '✅ Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage(res.message || (isRTL ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
            }
        } catch (err: any) {
            console.error('Password change error:', err);
            setMessage(err.message || (isRTL ? 'حدث خطأ في النظام' : 'Protocol error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); };

    // ─── 2FA Handlers ───
    const handleSetup2FA = async () => {
        setTwoFaLoading(true);
        setTwoFaMsg('');
        try {
            const res = await (api as any).auth.setup2FA?.() ??
                await fetch('/api/v2/auth/2fa/setup', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('hm_token')}`, 'Content-Type': 'application/json' }
                }).then(r => r.json());
            if (res.success) {
                setTwoFaQR(res.qrCode || res.qrDataURL || '');
                setTwoFaSecret(res.secret || '');
                setTwoFaStep('setup');
            } else {
                setTwoFaMsg(res.message || (isRTL ? 'فشل إعداد 2FA' : '2FA setup failed'));
            }
        } catch { setTwoFaMsg(isRTL ? 'خطأ في الاتصال' : 'Connection error'); }
        finally { setTwoFaLoading(false); }
    };

    const handleConfirm2FA = async () => {
        if (twoFaCode.length < 6) return;
        setTwoFaLoading(true);
        try {
            const res = await fetch('/api/v2/auth/2fa/enable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hm_token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: twoFaCode, secret: twoFaSecret })
            }).then(r => r.json());
            if (res.success) {
                setTwoFaEnabled(true);
                setTwoFaBackupCodes(res.backupCodes || []);
                setTwoFaStep('done');
                const u = JSON.parse(localStorage.getItem('hm_user') || '{}');
                localStorage.setItem('hm_user', JSON.stringify({ ...u, twoFactorEnabled: true }));
                setTwoFaMsg(isRTL ? '✅ تم تفعيل التحقق بخطوتين' : '✅ 2FA enabled successfully');
            } else {
                setTwoFaMsg(res.message || (isRTL ? 'رمز خاطئ' : 'Invalid code'));
            }
        } catch { setTwoFaMsg(isRTL ? 'خطأ' : 'Error'); }
        finally { setTwoFaLoading(false); }
    };

    const handleDisable2FA = async () => {
        setTwoFaLoading(true);
        try {
            const res = await fetch('/api/v2/auth/2fa/disable', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('hm_token')}`, 'Content-Type': 'application/json' }
            }).then(r => r.json());
            if (res.success) {
                setTwoFaEnabled(false);
                setTwoFaStep('idle');
                const u = JSON.parse(localStorage.getItem('hm_user') || '{}');
                localStorage.setItem('hm_user', JSON.stringify({ ...u, twoFactorEnabled: false }));
                setTwoFaMsg(isRTL ? '✅ تم إلغاء التحقق بخطوتين' : '✅ 2FA disabled');
            } else { setTwoFaMsg(res.message || (isRTL ? 'فشل' : 'Failed')); }
        } catch { setTwoFaMsg(isRTL ? 'خطأ' : 'Error'); }
        finally { setTwoFaLoading(false); }
    };

    return (
        <div className="flex flex-col h-full bg-[#080809]">
            <ClientPageHeader
                title={isRTL ? 'الملف الشخصي' : 'Profile Settings'}
                subtitle={isRTL ? 'إدارة معلوماتك الشخصية وإعدادات الحساب' : 'MANAGE ACCOUNT DETAILS'}
                icon={User}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8 pb-32 lg:pb-12">
                {/* Message Banner */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 rounded-2xl text-center"
                    >
                        <p className="text-xs font-bold text-cinematic-neon-gold">{message}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* User Card */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-cinematic-neon-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl" />
                           <div className="relative">
                               <div className="w-24 h-24 mx-auto rounded-full bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 flex items-center justify-center mb-6 shadow-2xl">
                                   <User className="w-10 h-10 text-cinematic-neon-gold" />
                               </div>
                               <h3 className="text-xl font-black text-white italic tracking-tight mb-2 uppercase">{userData.name || rawText('GUEST')}</h3>
                               <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-8">{userData.role}</div>
                               
                               <button 
                                onClick={handleLogout}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                               >
                                   <LogOut className="w-4 h-4" />
                                   {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
                               </button>
                           </div>
                        </div>

                        {/* Security Info */}
                        <div className="bg-cinematic-neon-gold/[0.02] border border-cinematic-neon-gold/10 rounded-[2rem] p-6 flex flex-col items-center text-center gap-3">
                            <Shield className="w-6 h-6 text-cinematic-neon-gold/40" />
                            <div className="text-[11px] font-black text-cinematic-neon-gold/60 uppercase tracking-widest">{isRTL ? 'اتصال مؤمن' : 'SECURE ENCRYPTION'}</div>
                            <p className="text-[10px] text-white/20 leading-relaxed">
                                {isRTL ? 'نظام التشفير لدينا يضمن حماية بياناتك الشخصية بالكامل' : 'END-TO-END AES-256 PROTECTION FOR ALL USER DATA'}
                            </p>
                        </div>
                    </div>

                    {/* Forms */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Personal Info */}
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Edit3 className="w-5 h-5 text-cinematic-neon-gold" />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-1">{isRTL ? 'المعلومات الشخصية' : 'PERSONAL DETAILS'}</h2>
                                    <div className="h-0.5 w-12 bg-cinematic-neon-gold/30 rounded-full" />
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'اسم المستخدم' : 'NAME'}</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                            <input 
                                                type="text"
                                                value={userData.name}
                                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                                placeholder={isRTL ? 'الاسم' : 'Name'}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 flex pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'البريد الإلكتروني' : 'EMAIL'}</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                            <input 
                                                type="email"
                                                value={userData.email}
                                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white/60 focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'رقم الهاتف' : 'PHONE'}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                        <input 
                                            type="tel"
                                            value={userData.phone}
                                            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                            placeholder={isRTL ? 'رقم الهاتف' : 'Phone'}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-10 py-4 bg-cinematic-neon-gold text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cinematic-neon-gold/10 flex items-center justify-center gap-3"
                                >
                                    <Save className="w-4.5 h-4.5" />
                                    {isRTL ? 'حفظ البيانات' : 'UPDATE PROFILE'}
                                </button>
                            </form>
                        </section>

                        {/* Password */}
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-red-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-1">{isRTL ? 'تعديل كلمة المرور' : 'SECURITY & PASS'}</h2>
                                    <div className="h-0.5 w-12 bg-red-500/30 rounded-full" />
                                </div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'كلمة المرور الحالية' : 'CURRENT PASSWORD'}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                        <input 
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'جديد' : 'NEW'}</label>
                                        <input 
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'تأكيد' : 'CONFIRM'}</label>
                                        <input 
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
                                >
                                    <Shield className="w-4.5 h-4.5" />
                                    {isRTL ? 'تغيير كلمة المرور' : 'CHANGE PASSWORD'}
                                </button>
                            </form>
                        </section>

                        {/* ─── 2FA Section ─── */}
                        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10 space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${twoFaEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/30'}`}>
                                        {twoFaEnabled ? <ShieldCheck className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">
                                            {isRTL ? 'التحقق بخطوتين (2FA)' : 'TWO-FACTOR AUTH'}
                                        </h2>
                                        <p className="text-[10px] text-white/30 mt-0.5">
                                            {twoFaEnabled
                                                ? (isRTL ? '✅ مُفعَّل — حسابك محمي' : '✅ Enabled — Account Protected')
                                                : (isRTL ? 'غير مُفعَّل — انقر لتفعيله' : 'Disabled — Click to enable')}
                                        </p>
                                    </div>
                                </div>
                                {twoFaEnabled ? (
                                    <button onClick={handleDisable2FA} disabled={twoFaLoading}
                                        className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50">
                                        {twoFaLoading ? '...' : (isRTL ? 'إلغاء' : 'DISABLE')}
                                    </button>
                                ) : (
                                    twoFaStep === 'idle' && (
                                        <button onClick={handleSetup2FA} disabled={twoFaLoading}
                                            className="px-4 py-2 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] text-[10px] font-black uppercase tracking-widest hover:bg-[#C9A96E]/20 transition-all disabled:opacity-50">
                                            {twoFaLoading ? '...' : (isRTL ? 'تفعيل' : 'ENABLE')}
                                        </button>
                                    )
                                )}
                            </div>

                            {twoFaMsg && (
                                <div className={`p-3 rounded-xl text-xs text-center ${twoFaMsg.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {twoFaMsg}
                                </div>
                            )}

                            {/* QR Code Setup Step */}
                            {twoFaStep === 'setup' && (
                                <div className="space-y-4 border-t border-white/5 pt-6">
                                    <p className="text-xs text-white/50 text-center">
                                        {isRTL ? 'امسح هذا الرمز بتطبيق Google Authenticator أو Authy' : 'Scan with Google Authenticator or Authy'}
                                    </p>
                                    {twoFaQR && (
                                        <div className="flex justify-center">
                                            <img src={twoFaQR} alt="2FA QR" className="w-40 h-40 rounded-2xl border border-white/10 p-2 bg-white" />
                                        </div>
                                    )}
                                    {twoFaSecret && (
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                                            <Key className="w-3.5 h-3.5 text-white/30 shrink-0" />
                                            <code className="text-[10px] text-white/50 font-mono flex-1 break-all">{twoFaSecret}</code>
                                            <button onClick={() => navigator.clipboard.writeText(twoFaSecret)}
                                                className="p-1 hover:text-[#C9A96E] text-white/30 transition-colors">
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text" inputMode="numeric" maxLength={6}
                                            value={twoFaCode}
                                            onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="flex-1 text-center text-xl font-black tracking-[0.4em] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/40 transition-all"
                                        />
                                        <button onClick={handleConfirm2FA} disabled={twoFaLoading || twoFaCode.length < 6}
                                            className="px-6 py-3 rounded-xl bg-[#C9A96E] text-black font-black text-sm disabled:opacity-40 hover:bg-[#b8955b] transition-all">
                                            {twoFaLoading ? '...' : (isRTL ? 'تحقق' : 'VERIFY')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Backup Codes after enabling */}
                            {twoFaStep === 'done' && twoFaBackupCodes.length > 0 && (
                                <div className="space-y-3 border-t border-white/5 pt-6">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                        {isRTL ? '⚠️ احفظ رموز الاحتياط هذه في مكان آمن' : '⚠️ Save these backup codes safely'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {twoFaBackupCodes.map((code, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                                <code className="text-[10px] font-mono text-white/60">{code}</code>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
