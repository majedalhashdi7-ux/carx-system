'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldAlert, ShieldCheck, ShieldOff, Lock, Unlock,
    Smartphone, Search, RefreshCw, History, Activity,
    AlertTriangle, Server, X, Laptop, Monitor, Eye,
    TrendingUp, TrendingDown, RotateCcw, MessageSquare,
    Trash2, ChevronDown, Users, Wifi, Clock, Zap,
    BarChart3, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import AdminPageShell from '@/components/AdminPageShell';

// ── أنواع البيانات ──
interface TrustFactors {
    successfulLogins: number;
    daysActive: number;
    consistentUsage: boolean;
    adminApproved: boolean;
    failedAttempts: number;
    accountSwitchAttempts: number;
    suspiciousActions: number;
    ipChanges: number;
}

interface SecurityEvent {
    type: string;
    detail: string;
    ip: string;
    username: string;
    timestamp: string;
}

interface SecurityDevice {
    _id: string;
    ip: string;
    deviceId?: string;
    fingerprintHash?: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    platform?: string;
    screenResolution?: string;
    timezone?: string;
    linkedUsername?: string;
    linkedUserId?: string;
    attemptedUsernames?: { username: string; attempts: number; lastAttempt: string }[];
    trustScore: number;
    trustLevel: string;
    trustFactors: TrustFactors;
    banned: boolean;
    banCode?: string;
    banReason?: string;
    bannedAt?: string;
    banExpiresAt?: string;
    exemptFromSecurity: boolean;
    exemptReason?: string;
    failedAttempts: number;
    securityEvents?: SecurityEvent[];
    ipHistory?: { ip: string; firstSeen: string; lastSeen: string; hitCount: number }[];
    adminNotes?: string;
    userAgent?: string;
    updatedAt?: string;
    createdAt?: string;
}

interface DashboardData {
    overview: {
        totalDevices: number;
        bannedDevices: number;
        trustedDevices: number;
        suspiciousDevices: number;
        exemptDevices: number;
        totalUsers: number;
        activeUsers: number;
        activeSessions: number;
        threatLevel: string;
    };
    recentEvents: any[];
    topThreats: any[];
}

// ── دوال مساعدة ──
function getTrustColor(level: string) {
    switch (level) {
        case 'trusted': return 'text-emerald-400';
        case 'high': return 'text-green-400';
        case 'medium': return 'text-yellow-400';
        case 'low': return 'text-orange-400';
        case 'unknown': return 'text-red-400';
        case 'blocked': return 'text-red-500';
        default: return 'text-white/40';
    }
}

function getTrustBg(level: string) {
    switch (level) {
        case 'trusted': return 'bg-emerald-500/10 border-emerald-500/20';
        case 'high': return 'bg-green-500/10 border-green-500/20';
        case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
        case 'low': return 'bg-orange-500/10 border-orange-500/20';
        case 'unknown': return 'bg-red-500/10 border-red-500/20';
        case 'blocked': return 'bg-red-600/10 border-red-600/30';
        default: return 'bg-white/5 border-white/10';
    }
}

function getTrustLabel(level: string, isRTL: boolean) {
    const labels: Record<string, [string, string]> = {
        trusted: ['موثوق', 'TRUSTED'],
        high: ['عالي', 'HIGH'],
        medium: ['متوسط', 'MEDIUM'],
        low: ['منخفض', 'LOW'],
        unknown: ['غير معروف', 'UNKNOWN'],
        blocked: ['محظور', 'BLOCKED'],
    };
    return labels[level]?.[isRTL ? 0 : 1] || level.toUpperCase();
}

function getEventIcon(type: string) {
    switch (type) {
        case 'login_success': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
        case 'login_failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
        case 'account_switch': return <Users className="w-3.5 h-3.5 text-orange-400" />;
        case 'banned_manually': case 'auto_banned': return <ShieldOff className="w-3.5 h-3.5 text-red-500" />;
        case 'unbanned_manually': return <ShieldCheck className="w-3.5 h-3.5 text-green-500" />;
        case 'trusted': return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
        case 'suspicious_activity': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
        default: return <Activity className="w-3.5 h-3.5 text-white/40" />;
    }
}

function getDeviceIcon(platform?: string) {
    switch (platform) {
        case 'mobile': return <Smartphone className="w-5 h-5" />;
        case 'tablet': return <Monitor className="w-5 h-5" />;
        default: return <Laptop className="w-5 h-5" />;
    }
}

function getDeviceType(ua?: string) {
    if (!ua) return 'desktop';
    const l = ua.toLowerCase();
    if (l.includes('mobile') || l.includes('android') || l.includes('iphone')) return 'mobile';
    if (l.includes('tablet') || l.includes('ipad')) return 'tablet';
    return 'desktop';
}

// ── Trust Score Bar ──
function TrustScoreBar({ score, level }: { score: number; level: string }) {
    const color = level === 'blocked' ? 'bg-red-500' : score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : score >= 20 ? 'bg-orange-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }} className={cn('h-full rounded-full', color)} />
            </div>
            <span className={cn('text-[10px] font-black w-8 text-right', getTrustColor(level))}>{score}</span>
        </div>
    );
}

// ══════════════════════════════════════════════════
// المكوّن الرئيسي
// ══════════════════════════════════════════════════
export default function AdminSecurity() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    // ── الحالة ──
    const [activeTab, setActiveTab] = useState<'dashboard' | 'devices' | 'sessions'>('dashboard');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [devices, setDevices] = useState<SecurityDevice[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'banned' | 'suspicious' | 'trusted' | 'exempt'>('all');
    const [selectedDevice, setSelectedDevice] = useState<SecurityDevice | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [banReason, setBanReason] = useState('');
    const [banDuration, setBanDuration] = useState('permanent');
    const [showBanDialog, setShowBanDialog] = useState<SecurityDevice | null>(null);
    const [deviceNote, setDeviceNote] = useState('');

    // ── تحميل البيانات ──
    const loadDashboard = useCallback(async () => {
        try {
            const res = await api.security.getDashboard();
            if (res.success) setDashboard(res.data);
        } catch (e) { console.warn('Dashboard load failed:', e); }
    }, []);

    const loadDevices = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.security.getDevices({ filter: filterTab, search: searchTerm, limit: 50 });
            const list = res.data || res.devices || [];
            setDevices(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error('Devices load failed:', e);
            showToast(isRTL ? 'فشل تحميل الأجهزة' : 'Failed to load devices', 'error');
        } finally { setLoading(false); }
    }, [filterTab, searchTerm, isRTL, showToast]);

    const loadSessions = useCallback(async () => {
        try {
            const res = await api.security.getSessions();
            setSessions(res.data || []);
        } catch (e) { console.warn('Sessions load failed:', e); }
    }, []);

    useEffect(() => {
        loadDashboard();
        loadDevices();
    }, [loadDashboard, loadDevices]);

    useEffect(() => {
        if (activeTab === 'sessions') loadSessions();
    }, [activeTab, loadSessions]);

    // ── الإجراءات ──
    const handleToggleBan = async (device: SecurityDevice, reason?: string, duration?: string) => {
        try {
            const res = await api.security.toggleBan(device._id, { reason, duration });
            if (res.success) {
                showToast(res.message || (device.banned ? '✅ تم فك الحظر' : '🚫 تم الحظر'), 'success');
                loadDevices();
                loadDashboard();
                if (selectedDevice?._id === device._id) {
                    const detail = await api.security.getDeviceDetails(device._id);
                    if (detail.success) setSelectedDevice(detail.data.device);
                }
            }
        } catch (e: any) { showToast(e.message || 'فشل', 'error'); }
    };

    const handleToggleExempt = async (device: SecurityDevice) => {
        try {
            const res = await api.security.toggleExempt(device._id);
            if (res.success) {
                showToast(res.message || '✅ تم التحديث', 'success');
                loadDevices();
                loadDashboard();
            }
        } catch (e: any) { showToast(e.message || 'فشل', 'error'); }
    };

    const handleTrustAction = async (device: SecurityDevice, action: 'boost' | 'reduce' | 'reset') => {
        try {
            const res = await api.security.updateTrust(device._id, action);
            if (res.success) {
                showToast(res.message || '✅ تم التحديث', 'success');
                loadDevices();
                if (selectedDevice?._id === device._id) {
                    const detail = await api.security.getDeviceDetails(device._id);
                    if (detail.success) setSelectedDevice(detail.data.device);
                }
            }
        } catch (e: any) { showToast(e.message || 'فشل', 'error'); }
    };

    const handleSaveNote = async (device: SecurityDevice) => {
        try {
            await api.security.addNote(device._id, deviceNote);
            showToast('✅ تم حفظ الملاحظة', 'success');
        } catch { showToast('فشل حفظ الملاحظة', 'error'); }
    };

    const handleBulkAction = async (action: 'ban' | 'unban' | 'delete') => {
        if (selectedIds.length === 0) return;
        try {
            const res = await api.security.bulkAction(selectedIds, action);
            if (res.success) {
                showToast(res.message || '✅ تم', 'success');
                setSelectedIds([]);
                loadDevices();
                loadDashboard();
            }
        } catch (e: any) { showToast(e.message || 'فشل', 'error'); }
    };

    const handleTerminateSession = async (sessionId: string) => {
        try {
            const res = await api.security.terminateSession(sessionId);
            if (res.success) { showToast('✅ تم إنهاء الجلسة', 'success'); loadSessions(); }
        } catch { showToast('فشل إنهاء الجلسة', 'error'); }
    };

    // ── Stats Cards ──
    const ov = dashboard?.overview;

    return (
        <div className="min-h-screen text-white bg-black overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            <AdminPageShell
                title={isRTL ? 'مركز الأمان' : 'SECURITY CENTER'}
                titleEn="ADVANCED THREAT PROTECTION"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={() => { loadDashboard(); loadDevices(); }} title="Refresh"
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-violet-400">
                        <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >
                {/* ── التبويبات الرئيسية ── */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { id: 'dashboard', label: isRTL ? '📊 لوحة الأمان' : '📊 Dashboard', icon: BarChart3 },
                        { id: 'devices', label: isRTL ? '📱 الأجهزة' : '📱 Devices', icon: Smartphone },
                        { id: 'sessions', label: isRTL ? '🔗 الجلسات' : '🔗 Sessions', icon: Wifi },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                            className={cn('px-5 py-3 rounded-2xl text-xs font-black tracking-wider transition-all whitespace-nowrap flex items-center gap-2',
                                activeTab === t.id ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                            )}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════ لوحة الأمان ══════════════════════════════ */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* بطاقات الإحصائيات */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: isRTL ? 'إجمالي الأجهزة' : 'Total Devices', value: ov?.totalDevices || 0, icon: Smartphone, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                                { label: isRTL ? 'المحظورة' : 'Banned', value: ov?.bannedDevices || 0, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                                { label: isRTL ? 'الموثوقة' : 'Trusted', value: ov?.trustedDevices || 0, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                                { label: isRTL ? 'المشبوهة' : 'Suspicious', value: ov?.suspiciousDevices || 0, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                            ].map((s, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                    className={cn('p-5 rounded-2xl border', s.bg)}>
                                    <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
                                    <div className="text-2xl font-black mb-1">{s.value}</div>
                                    <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{s.label}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* مستوى التهديد + جلسات */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className={cn('p-5 rounded-2xl border', ov?.threatLevel === 'high' ? 'bg-red-500/10 border-red-500/30' : ov?.threatLevel === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-emerald-500/10 border-emerald-500/30')}>
                                <Shield className={cn('w-5 h-5 mb-2', ov?.threatLevel === 'high' ? 'text-red-400' : ov?.threatLevel === 'medium' ? 'text-yellow-400' : 'text-emerald-400')} />
                                <div className="text-lg font-black uppercase">{ov?.threatLevel === 'high' ? (isRTL ? 'تهديد عالي' : 'HIGH THREAT') : ov?.threatLevel === 'medium' ? (isRTL ? 'تهديد متوسط' : 'MEDIUM') : (isRTL ? 'آمن' : 'SECURE')}</div>
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'مستوى التهديد' : 'THREAT LEVEL'}</div>
                            </div>
                            <div className="p-5 rounded-2xl border bg-blue-500/10 border-blue-500/20">
                                <Users className="w-5 h-5 mb-2 text-blue-400" />
                                <div className="text-2xl font-black">{ov?.activeUsers || 0}</div>
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'المستخدمون النشطون' : 'ACTIVE USERS'}</div>
                            </div>
                            <div className="p-5 rounded-2xl border bg-cyan-500/10 border-cyan-500/20">
                                <Wifi className="w-5 h-5 mb-2 text-cyan-400" />
                                <div className="text-2xl font-black">{ov?.activeSessions || 0}</div>
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'الجلسات النشطة' : 'ACTIVE SESSIONS'}</div>
                            </div>
                        </div>

                        {/* أحدث التهديدات */}
                        {dashboard?.topThreats && dashboard.topThreats.length > 0 && (
                            <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/[0.03]">
                                <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> {isRTL ? 'أعلى التهديدات' : 'TOP THREATS'}
                                </h3>
                                <div className="space-y-3">
                                    {dashboard.topThreats.map((t: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold">{t.linkedUsername || t.ip}</span>
                                                <span className="text-[9px] text-white/30 mx-2">•</span>
                                                <span className="text-[9px] text-white/30">IP: {t.ip}</span>
                                            </div>
                                            <TrustScoreBar score={t.trustScore} level={t.trustLevel} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════ الأجهزة ══════════════════════════════ */}
                {activeTab === 'devices' && (
                    <div className="space-y-4">
                        {/* شريط البحث والفلترة */}
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-4' : 'left-4')} />
                                <input type="text" placeholder={isRTL ? 'بحث بـ IP، اسم المستخدم، رمز الحظر...' : 'Search by IP, username, ban code...'}
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className={cn('w-full h-12 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-violet-500/40 focus:outline-none transition-all', isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4')} />
                            </div>
                            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
                                {[
                                    { id: 'all', label: isRTL ? 'الكل' : 'ALL' },
                                    { id: 'banned', label: isRTL ? 'محظور' : 'BANNED' },
                                    { id: 'suspicious', label: isRTL ? 'مشبوه' : 'SUSPECT' },
                                    { id: 'trusted', label: isRTL ? 'موثوق' : 'TRUSTED' },
                                    { id: 'exempt', label: isRTL ? 'مستثنى' : 'EXEMPT' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => setFilterTab(t.id as any)}
                                        className={cn('px-4 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all whitespace-nowrap',
                                            filterTab === t.id ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]' : 'text-white/40 hover:text-white/70'
                                        )}>{t.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* إجراءات جماعية */}
                        {selectedIds.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                                <span className="text-xs font-bold">{selectedIds.length} {isRTL ? 'محدد' : 'selected'}</span>
                                <div className="flex-1" />
                                <button onClick={() => handleBulkAction('ban')} className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">{isRTL ? 'حظر الكل' : 'BAN ALL'}</button>
                                <button onClick={() => handleBulkAction('unban')} className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black transition-all">{isRTL ? 'فك حظر الكل' : 'UNBAN ALL'}</button>
                                <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-white/10 text-white/40 hover:bg-white/20 transition-all"><X className="w-3 h-3" /></button>
                            </motion.div>
                        )}

                        {/* قائمة الأجهزة */}
                        <div className="space-y-2">
                            {loading ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                            )) : devices.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Shield className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-sm text-white/30">{isRTL ? 'لا توجد أجهزة' : 'No devices found'}</p>
                                </div>
                            ) : devices.map((device, i) => (
                                <motion.div key={device._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className={cn('group p-4 rounded-2xl border transition-all hover:bg-white/[0.02] cursor-pointer',
                                        device.banned ? 'border-red-500/20 bg-red-500/[0.02]' : getTrustBg(device.trustLevel)
                                    )}
                                    onClick={() => setSelectedDevice(device)}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <input type="checkbox" checked={selectedIds.includes(device._id)}
                                            onChange={e => { e.stopPropagation(); setSelectedIds(p => p.includes(device._id) ? p.filter(x => x !== device._id) : [...p, device._id]); }}
                                            onClick={e => e.stopPropagation()}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-500 shrink-0" />

                                        {/* أيقونة الجهاز */}
                                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
                                            device.banned ? 'bg-red-500/10 border-red-500/20 text-red-400' : getTrustBg(device.trustLevel) + ' ' + getTrustColor(device.trustLevel)
                                        )}>
                                            {device.banned ? <ShieldAlert className="w-5 h-5" /> : getDeviceIcon(device.platform || getDeviceType(device.userAgent))}
                                        </div>

                                        {/* المعلومات */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="text-sm font-bold truncate">{device.linkedUsername || device.ip || 'Unknown'}</span>
                                                {device.linkedUsername && <span className="text-[9px] text-white/30 font-mono">{device.ip}</span>}
                                                <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-black uppercase border', getTrustBg(device.trustLevel), getTrustColor(device.trustLevel))}>
                                                    {getTrustLabel(device.trustLevel, isRTL)}
                                                </span>
                                                {device.exemptFromSecurity && <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{isRTL ? 'مستثنى' : 'EXEMPT'}</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-white/30">
                                                <span>{device.browser || device.os || getDeviceType(device.userAgent)}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{device.updatedAt ? new Date(device.updatedAt).toLocaleDateString() : '---'}</span>
                                            </div>
                                        </div>

                                        {/* Trust Score */}
                                        <div className="w-24 hidden md:block">
                                            <TrustScoreBar score={device.trustScore || 50} level={device.trustLevel} />
                                        </div>

                                        {/* أزرار سريعة */}
                                        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => device.banned ? handleToggleBan(device) : setShowBanDialog(device)} title={device.banned ? 'Unban' : 'Ban'}
                                                className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all',
                                                    device.banned ? 'bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'
                                                )}>
                                                {device.banned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                            </button>
                                            <button onClick={() => handleToggleExempt(device)} title="Exempt"
                                                className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                                    device.exemptFromSecurity ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'
                                                )}>
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════ الجلسات ══════════════════════════════ */}
                {activeTab === 'sessions' && (
                    <div className="space-y-3">
                        {sessions.length === 0 ? (
                            <div className="py-20 text-center">
                                <Wifi className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                <p className="text-sm text-white/30">{isRTL ? 'لا توجد جلسات نشطة' : 'No active sessions'}</p>
                            </div>
                        ) : sessions.map((s: any) => (
                            <div key={s._id} className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                                    <Wifi className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold">{s.userId?.name || s.ip || 'Unknown'}</div>
                                    <div className="text-[10px] text-white/30">{s.ip} • {s.userId?.role || ''}</div>
                                </div>
                                <div className="text-[10px] text-white/30">{s.lastActivity ? new Date(s.lastActivity).toLocaleString() : ''}</div>
                                <button onClick={() => handleTerminateSession(s._id)}
                                    className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                    {isRTL ? 'إنهاء' : 'END'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminPageShell>

            {/* ══════════════════════════════ نافذة تفاصيل الجهاز ══════════════════════════════ */}
            <AnimatePresence>
                {selectedDevice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
                        onClick={() => setSelectedDevice(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0a0a1a] border border-white/10 rounded-[2rem] p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_0_80px_rgba(139,92,246,0.1)]"
                            dir={isRTL ? 'rtl' : 'ltr'}>

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border', getTrustBg(selectedDevice.trustLevel), getTrustColor(selectedDevice.trustLevel))}>
                                        {getDeviceIcon(selectedDevice.platform || getDeviceType(selectedDevice.userAgent))}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black">{selectedDevice.linkedUsername || selectedDevice.ip}</h2>
                                        <div className="flex items-center gap-2">
                                            <span className={cn('text-[10px] font-black uppercase', getTrustColor(selectedDevice.trustLevel))}>
                                                {getTrustLabel(selectedDevice.trustLevel, isRTL)}
                                            </span>
                                            <span className="text-[10px] text-white/30">• Score: {selectedDevice.trustScore}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDevice(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Trust Score Bar */}
                            <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="text-[9px] font-bold text-white/30 uppercase mb-2">{isRTL ? 'مستوى الثقة' : 'TRUST SCORE'}</div>
                                <TrustScoreBar score={selectedDevice.trustScore || 50} level={selectedDevice.trustLevel} />
                                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                                    <div><div className="text-lg font-black text-green-400">{selectedDevice.trustFactors?.successfulLogins || 0}</div><div className="text-[8px] text-white/20">{isRTL ? 'دخول ناجح' : 'Logins'}</div></div>
                                    <div><div className="text-lg font-black text-red-400">{selectedDevice.trustFactors?.failedAttempts || 0}</div><div className="text-[8px] text-white/20">{isRTL ? 'فاشلة' : 'Failed'}</div></div>
                                    <div><div className="text-lg font-black text-orange-400">{selectedDevice.trustFactors?.accountSwitchAttempts || 0}</div><div className="text-[8px] text-white/20">{isRTL ? 'تغيير حساب' : 'Switches'}</div></div>
                                    <div><div className="text-lg font-black text-blue-400">{selectedDevice.trustFactors?.ipChanges || 0}</div><div className="text-[8px] text-white/20">{isRTL ? 'تغيير IP' : 'IP Changes'}</div></div>
                                </div>
                            </div>

                            {/* معلومات الجهاز */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[8px] text-white/20 uppercase mb-1">IP</div>
                                    <div className="text-xs font-mono text-blue-400">{selectedDevice.ip}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[8px] text-white/20 uppercase mb-1">{isRTL ? 'المتصفح' : 'Browser'}</div>
                                    <div className="text-xs font-bold">{selectedDevice.browser || 'Unknown'} {selectedDevice.browserVersion || ''}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[8px] text-white/20 uppercase mb-1">{isRTL ? 'النظام' : 'OS'}</div>
                                    <div className="text-xs font-bold">{selectedDevice.os || 'Unknown'}</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <div className="text-[8px] text-white/20 uppercase mb-1">{isRTL ? 'الشاشة' : 'Screen'}</div>
                                    <div className="text-xs font-bold">{selectedDevice.screenResolution || '---'}</div>
                                </div>
                            </div>

                            {/* سجل الأحداث */}
                            {selectedDevice.securityEvents && selectedDevice.securityEvents.length > 0 && (
                                <div className="mb-6">
                                    <div className="text-[9px] font-black text-white/30 uppercase mb-3 flex items-center gap-2"><History className="w-3.5 h-3.5" /> {isRTL ? 'سجل الأحداث' : 'EVENT LOG'}</div>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {selectedDevice.securityEvents.slice(-10).reverse().map((ev, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
                                                {getEventIcon(ev.type)}
                                                <span className="text-[10px] flex-1 truncate">{ev.detail}</span>
                                                <span className="text-[8px] text-white/20 shrink-0">{new Date(ev.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ملاحظات الأدمن */}
                            <div className="mb-6">
                                <div className="text-[9px] font-black text-white/30 uppercase mb-2">{isRTL ? 'ملاحظات' : 'ADMIN NOTE'}</div>
                                <div className="flex gap-2">
                                    <input type="text" value={deviceNote} onChange={e => setDeviceNote(e.target.value)} placeholder={isRTL ? 'أضف ملاحظة...' : 'Add note...'}
                                        className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs focus:border-violet-500/40 focus:outline-none" />
                                    <button onClick={() => handleSaveNote(selectedDevice)} className="px-4 h-10 rounded-xl bg-violet-500/20 text-violet-300 text-[10px] font-bold hover:bg-violet-500/30 transition-all">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* أزرار الإجراءات */}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleTrustAction(selectedDevice, 'boost')} className="flex-1 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" /> {isRTL ? 'رفع الثقة' : 'BOOST'}
                                </button>
                                <button onClick={() => handleTrustAction(selectedDevice, 'reduce')} className="flex-1 h-10 rounded-xl bg-orange-500/10 text-orange-400 text-[10px] font-black hover:bg-orange-500 hover:text-black transition-all flex items-center justify-center gap-1.5">
                                    <TrendingDown className="w-3.5 h-3.5" /> {isRTL ? 'خفض' : 'REDUCE'}
                                </button>
                                <button onClick={() => handleTrustAction(selectedDevice, 'reset')} className="flex-1 h-10 rounded-xl bg-white/5 text-white/40 text-[10px] font-black hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" /> {isRTL ? 'إعادة تعيين' : 'RESET'}
                                </button>
                                <button onClick={() => { handleToggleBan(selectedDevice); setSelectedDevice(null); }}
                                    className={cn('w-full h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all mt-2',
                                        selectedDevice.banned ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                                    )}>
                                    {selectedDevice.banned ? (isRTL ? 'إلغاء الحظر' : 'UNBAN DEVICE') : (isRTL ? 'حظر الجهاز' : 'BAN DEVICE')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════ نافذة الحظر مع سبب ══════════════════════════════ */}
            <AnimatePresence>
                {showBanDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowBanDialog(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0a0a1a] border border-red-500/20 rounded-2xl p-6 max-w-md w-full"
                            dir={isRTL ? 'rtl' : 'ltr'}>
                            <h3 className="text-lg font-black text-red-400 mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5" /> {isRTL ? 'حظر الجهاز' : 'Ban Device'}
                            </h3>
                            <div className="space-y-3 mb-4">
                                <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)}
                                    placeholder={isRTL ? 'سبب الحظر (اختياري)...' : 'Ban reason (optional)...'}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm focus:border-red-500/40 focus:outline-none" />
                                <select value={banDuration} onChange={e => setBanDuration(e.target.value)}
                                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm appearance-none focus:border-red-500/40 focus:outline-none">
                                    <option value="permanent">{isRTL ? 'حظر دائم' : 'Permanent'}</option>
                                    <option value="1">{isRTL ? 'ساعة واحدة' : '1 Hour'}</option>
                                    <option value="24">{isRTL ? '24 ساعة' : '24 Hours'}</option>
                                    <option value="168">{isRTL ? 'أسبوع' : '1 Week'}</option>
                                    <option value="720">{isRTL ? 'شهر' : '1 Month'}</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { handleToggleBan(showBanDialog, banReason, banDuration); setShowBanDialog(null); setBanReason(''); }}
                                    className="flex-1 h-10 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-500 transition-all">
                                    {isRTL ? 'تأكيد الحظر' : 'CONFIRM BAN'}
                                </button>
                                <button onClick={() => setShowBanDialog(null)} className="px-4 h-10 rounded-xl bg-white/5 text-white/40 text-xs font-black hover:bg-white/10 transition-all">
                                    {isRTL ? 'إلغاء' : 'CANCEL'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}