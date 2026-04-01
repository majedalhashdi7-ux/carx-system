'use client';

/**
 * نظام الصلاحيات لـ CAR X
 * - الآدمن يختار المستخدم ويرفعه لـ آدمن
 * - يحدد الصلاحيات ورقم التواصل الخاص به
 * - يفك قفل الجهاز عن مستخدم
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield,
    Check, Loader2, Search,
    Smartphone, SmartphoneNfc
} from 'lucide-react';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';

// الصلاحيات المتاحة لكل آدمن
const ALL_PERMISSIONS = [
    { key: 'cars',    labelAr: 'إدارة السيارات',       labelEn: 'Manage Cars' },
    { key: 'auctions', labelAr: 'إدارة المزادات',      labelEn: 'Manage Auctions' },
    { key: 'parts',   labelAr: 'إدارة قطع الغيار',     labelEn: 'Manage Parts' },
    { key: 'users',   labelAr: 'إدارة المستخدمين',     labelEn: 'Manage Users' },
    { key: 'orders',  labelAr: 'إدارة الطلبات',        labelEn: 'Manage Orders' },
    { key: 'settings',labelAr: 'الإعدادات',            labelEn: 'Settings' },
    { key: 'analytics',labelAr: 'التقارير والإحصائيات',labelEn: 'Analytics' },
];

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    deviceLocked?: boolean;
    contactNumber?: string;
}

export default function CarXPermissionsPage() {
    const { isRTL } = useLanguage();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedId, setSavedId] = useState('');
    const [editPerms, setEditPerms] = useState<string[]>([]);
    const [editRole, setEditRole] = useState('buyer');
    const [editContact, setEditContact] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const res = await api.users.list({ limit: 100 });
            if (res?.success) setUsers(res.data || res.users || []);
        } catch { }
        finally { setLoading(false); }
    }

    function selectUser(u: User) {
        setSelected(u);
        setEditRole(u.role || 'buyer');
        setEditPerms(u.permissions || []);
        setEditContact(u.contactNumber || '');
    }

    function togglePerm(key: string) {
        setEditPerms(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
    }

    async function handleSave() {
        if (!selected) return;
        setSaving(true);
        try {
            await api.users.update(selected._id, {
                role: editRole,
                permissions: editRole === 'admin' ? editPerms : [],
                contactNumber: editContact,
            });
            setSavedId(selected._id);
            setTimeout(() => setSavedId(''), 2500);
            await loadUsers();
        } catch { }
        finally { setSaving(false); }
    }

    async function handleUnlockDevice(userId: string) {
        try {
            await api.users.update(userId, { deviceLocked: false });
            await loadUsers();
        } catch { }
    }

    async function handleLockDevice(userId: string) {
        try {
            await api.users.update(userId, { deviceLocked: true });
            await loadUsers();
        } catch { }
    }

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-6xl mx-auto">

                {/* الهيدر */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest">
                                {isRTL ? 'الصلاحيات وأمان الأجهزة' : 'Permissions & Device Security'}
                            </h1>
                            <p className="text-white/30 text-xs font-bold">CAR X — Admin Control</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* قائمة المستخدمين */}
                    <div className="bg-zinc-900 border border-white/8 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 ${isRTL ? 'right-3' : 'left-3'}`} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={isRTL ? 'بحث عن مستخدم...' : 'Search user...'}
                                    className={`w-full bg-black/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/40 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                />
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto divide-y divide-white/[0.04]">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-6 h-6 text-red-400 animate-spin" />
                                </div>
                            ) : filtered.map(u => (
                                <motion.button
                                    key={u._id}
                                    onClick={() => selectUser(u)}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                    className={`w-full px-4 py-3 flex items-center gap-3 transition-all text-start ${selected?._id === u._id ? 'bg-red-600/10 border-s-2 border-red-500' : ''}`}
                                >
                                    {/* أيقونة الدور */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        u.role === 'admin' || u.role === 'super_admin'
                                            ? 'bg-red-600/20 border border-red-500/30'
                                            : 'bg-white/5 border border-white/10'
                                    }`}>
                                        <Users className={`w-4 h-4 ${u.role === 'admin' ? 'text-red-400' : 'text-white/30'}`} />
                                    </div>

                                    {/* البيانات */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-white truncate">{u.name}</p>
                                        <p className="text-xs text-white/30 truncate">{u.email}</p>
                                    </div>

                                    {/* الحالة */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                                            u.role === 'admin' || u.role === 'super_admin'
                                                ? 'bg-red-600/20 text-red-400'
                                                : 'bg-white/5 text-white/30'
                                        }`}>
                                            {u.role}
                                        </span>
                                        {/* أيقونة قفل الجهاز */}
                                        {u.deviceLocked ? (
                                            <span title="Device locked"><Smartphone className="w-3.5 h-3.5 text-red-400" /></span>
                                        ) : (
                                            <span title="Device unlocked"><SmartphoneNfc className="w-3.5 h-3.5 text-green-400" /></span>
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* لوحة التعديل */}
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-zinc-900 border border-white/8 rounded-2xl p-6 space-y-6"
                            >
                                {/* معلومات المستخدم */}
                                <div>
                                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-1">
                                        {isRTL ? 'المستخدم المحدد' : 'Selected User'}
                                    </p>
                                    <h2 className="text-xl font-black text-white">{selected.name}</h2>
                                    <p className="text-white/40 text-sm">{selected.email}</p>
                                </div>

                                {/* تغيير الدور */}
                                <div>
                                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                        {isRTL ? 'الدور' : 'Role'}
                                    </label>
                                    <div className="flex gap-2">
                                        {['buyer', 'admin'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setEditRole(r)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                                                    editRole === r
                                                        ? r === 'admin' ? 'bg-red-600 text-white' : 'bg-white/10 text-white'
                                                        : 'bg-white/5 text-white/30 hover:text-white/60'
                                                }`}
                                            >
                                                {r === 'buyer' ? (isRTL ? 'عميل' : 'Client') : (isRTL ? 'آدمن' : 'Admin')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* الصلاحيات (تظهر فقط عند الآدمن) */}
                                <AnimatePresence>
                                    {editRole === 'admin' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                                                {isRTL ? 'الصلاحيات المخصصة' : 'Custom Permissions'}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {ALL_PERMISSIONS.map(perm => (
                                                    <button
                                                        key={perm.key}
                                                        type="button"
                                                        onClick={() => togglePerm(perm.key)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            editPerms.includes(perm.key)
                                                                ? 'bg-red-600/20 border border-red-500/50 text-red-300'
                                                                : 'bg-white/5 border border-white/10 text-white/30 hover:text-white/60'
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                                            editPerms.includes(perm.key) ? 'bg-red-600 border-red-500' : 'border-white/20'
                                                        }`}>
                                                            {editPerms.includes(perm.key) && <Check className="w-2.5 h-2.5" />}
                                                        </div>
                                                        {isRTL ? perm.labelAr : perm.labelEn}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* رقم التواصل الخاص بهذا الآدمن */}
                                            <div className="mt-4">
                                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                                    {isRTL ? 'رقم واتساب هذا الموظف' : 'Employee WhatsApp Number'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editContact}
                                                    onChange={e => setEditContact(e.target.value)}
                                                    placeholder="+967..."
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-red-500/60 transition-all"
                                                />
                                                <p className="text-white/20 text-[10px] mt-1 font-bold">
                                                    {isRTL
                                                        ? 'هذا الرقم سيستخدمه العملاء للتواصل المباشر مع هذا الموظف'
                                                        : 'Clients will contact this employee directly via this number'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* إدارة قفل الجهاز */}
                                <div className="p-4 bg-black/30 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {selected.deviceLocked
                                                ? <Smartphone className="w-4 h-4 text-red-400" />
                                                : <SmartphoneNfc className="w-4 h-4 text-green-400" />
                                            }
                                            <div>
                                                <p className="text-sm font-black text-white">
                                                    {selected.deviceLocked
                                                        ? (isRTL ? 'الجهاز مقفل' : 'Device Locked')
                                                        : (isRTL ? 'الجهاز مفتوح' : 'Device Unlocked')}
                                                </p>
                                                <p className="text-white/30 text-[10px] font-bold">
                                                    {isRTL ? 'حالة الجهاز الحالية' : 'Current device status'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => selected.deviceLocked
                                                ? handleUnlockDevice(selected._id)
                                                : handleLockDevice(selected._id)
                                            }
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                                selected.deviceLocked
                                                    ? 'bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30'
                                                    : 'bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30'
                                            }`}
                                        >
                                            {selected.deviceLocked
                                                ? (isRTL ? 'فك القفل' : 'Unlock')
                                                : (isRTL ? 'قفل الجهاز' : 'Lock')
                                            }
                                        </button>
                                    </div>
                                </div>

                                {/* زر الحفظ */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : savedId === selected._id ? (
                                        <><Check className="w-4 h-4 text-green-300" />{isRTL ? 'تم الحفظ ✓' : 'Saved ✓'}</>
                                    ) : (
                                        isRTL ? 'حفظ التغييرات' : 'Save Changes'
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-zinc-900/50 border border-white/5 rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center"
                            >
                                <Users className="w-12 h-12 text-white/10 mb-4" />
                                <p className="text-white/20 font-bold text-sm">
                                    {isRTL ? 'اختر مستخدماً من القائمة لتعديل صلاحياته' : 'Select a user to edit their permissions'}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
