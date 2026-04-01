'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Database, Server, Clock, GitCommit, HardDrive, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAPI } from '@/lib/api-original';
import AdminPageShell from '@/components/AdminPageShell';

export default function SystemAuditPage() {
    const isRTL = true;
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [healthRes] = await Promise.all([
                fetchAPI('/api/v2/system/health')
            ]);
            
            if (healthRes.success) setHealth(healthRes.data);
        } catch (error) {
            console.error('Failed to fetch system audit data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // تحديث كل نصف دقيقة
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        if (!bytes) return '0 MB';
        return `${bytes} MB`;
    };

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        if (d > 0) return `${d} يوم ${h} ساعة`;
        if (h > 0) return `${h} ساعة ${m} دقيقة`;
        return `${m} دقيقة`;
    };

    return (
        <div className="relative min-h-screen text-white overflow-x-hidden" dir="rtl">
            <AdminPageShell
                title="فحص النظام الشامل"
                titleEn="SYSTEM AUDIT & HEALTH"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={fetchData} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        تحديث البيانات
                    </button>
                }
            >
                {loading && !health ? (
                    <div className="flex bg-white/5 border border-white/10 rounded-2xl p-8 items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* ── Status Grid ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Database */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">قاعدة البيانات</p>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {health?.database?.state === 'Connected' ? 'متصل' : 'مفصول'}
                                            <span className={cn('w-2 h-2 rounded-full', health?.database?.state === 'Connected' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500')} />
                                        </h3>
                                        <p className="text-xs text-blue-400 mt-2 font-mono">الاستجابة: {health?.database?.latencyMs}ms</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Database className="w-5 h-5 text-blue-400" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Server Memory */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">استهلاك الذاكرة RAM</p>
                                        <h3 className="text-lg font-bold text-white">{health?.server?.memory?.usagePercent}%</h3>
                                        <p className="text-[10px] text-purple-400 mt-2 font-mono">
                                            مستخدم: {formatBytes(health?.server?.memory?.usedMB)} / كلي: {formatBytes(health?.server?.memory?.totalMB)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <HardDrive className="w-5 h-5 text-purple-400" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Uptime */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">وقت تشغيل الخادم</p>
                                        <h3 className="text-lg font-bold text-white max-w-[120px] truncate">{formatUptime(health?.server?.uptimeSeconds || 0)}</h3>
                                        <p className="text-[10px] text-green-400 mt-2">Node.js {health?.server?.nodeVersion}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                        <Clock className="w-5 h-5 text-green-400" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Socket */}
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                                <div className="flex items-start justify-between relative z-10">
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">الاتصال المباشر Socket.io</p>
                                        <h3 className="text-lg font-bold text-white">{health?.services?.socketIo === 'Active' ? 'يعمل بكفاءة' : 'متوقف'}</h3>
                                        <p className="text-xs text-amber-400 mt-2 uppercase tracking-widest">{health?.services?.socketIo}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* API Routes Table Removed */}
                    </div>
                )}
            </AdminPageShell>
        </div>
    );
}
