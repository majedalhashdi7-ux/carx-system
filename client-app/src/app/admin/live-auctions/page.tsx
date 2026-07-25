'use client';

// [[ARABIC_HEADER]] صفحة الأدمن لإدارة المزادات المباشرة - منفصلة تماماً عن صفحة العميل
// الـ AdminLayout يحمي هذه الصفحة ولا يمكن الوصول إليها إلا بصلاحيات admin/super_admin/manager

import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Edit2, X, Link as LinkIcon,
    Play, Square, ExternalLink, Image as ImageIcon, RefreshCw,
    CheckCircle, AlertCircle, Zap, ToggleLeft, ToggleRight,
    Save, Download, Eye, Radio, Info, ChevronDown, ChevronUp,
    Car, DollarSign, Clock, Tag
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { api } from "@/lib/api-original";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";

// Toast types kept for backward compat with addToast wrapper
type ToastType = 'success' | 'error' | 'info' | 'loading';

// =============================================
// Status Badge Component
// =============================================
function StatusBadge({ status, isRTL }: { status: string; isRTL: boolean }) {
    const map: Record<string, { label: string; labelAr: string; color: string; dot: string }> = {
        live: { label: 'LIVE', labelAr: 'مباشر الآن', color: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-400 animate-pulse' },
        upcoming: { label: 'UPCOMING', labelAr: 'قادم', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
        ended: { label: 'ENDED', labelAr: 'منتهي', color: 'bg-white/5 text-white/30 border-white/10', dot: 'bg-white/20' },
    };
    const s = map[status] || map['upcoming'];
    return (
        <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", s.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {isRTL ? s.labelAr : s.label}
        </span>
    );
}

// =============================================
// Main Admin Component
// =============================================
export default function AdminLiveAuctions() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState<string | null>(null);
    // تتبع أي جلسات تعرض سياراتها
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    // السيارات المستوردة من بوابة الاستيراد (desert_korea_auto)
    const [importedAuctions, setImportedAuctions] = useState<any[]>([]);
    const [importedLoading, setImportedLoading] = useState(false);
    const [activatingId, setActivatingId] = useState<string | null>(null);

    // Wrapper to keep the same API surface as the old addToast
    const addToast = useCallback((type: 'success' | 'error' | 'info' | 'loading', message: string, _duration = 4000) => {
        showToast(message, type === 'loading' ? 'info' : type);
        return 0;
    }, [showToast]);
    const dismissToast = useCallback((_id: number) => {}, []);

    // ── Form State ──
    const [formData, setFormData] = useState({
        title: '',
        externalUrl: '',
        whatsappNumber: '',
        auctionUsername: '',
        auctionPassword: '',
        autoSync: false,
        cars: [] as any[]
    });

    useEffect(() => { loadSessions(); loadImportedAuctions(); }, []);

    const loadImportedAuctions = async () => {
        setImportedLoading(true);
        try {
            const res = await api.auctions.list({ limit: 100, status: 'all' });
            const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.auctions) ? res.auctions : []);
            const imported = rawList.filter((a: any) =>
                a && typeof a === 'object' && (a.status === 'pending' || a.status === 'scheduled' || a.status === 'running' || a.status === 'ended')
            );
            setImportedAuctions(imported);
        } catch { setImportedAuctions([]); }
        finally { setImportedLoading(false); }
    };

    const handleActivate = async (auctionId: string) => {
        if (!auctionId) return;
        setActivatingId(auctionId);
        try {
            const res = await api.auctions.update(auctionId, { status: 'running' });
            if (res?.success) {
                showToast(isRTL ? '✅ تم تفعيل المزاد بنجاح' : '✅ Auction activated!', 'success');
                loadImportedAuctions();
            } else {
                showToast(res?.error || (isRTL ? '❌ فشل التفعيل' : '❌ Activation failed'), 'error');
            }
        } catch { showToast(isRTL ? '❌ خطأ في الاتصال' : '❌ Connection error', 'error'); }
        finally { setActivatingId(null); }
    };

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const res = await api.liveAuctions.list();
            const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.sessions) ? res.sessions : []);
            setSessions(rawList.filter((s: any) => s && typeof s === 'object'));
        } catch (e) {
            setSessions([]);
            addToast('error', isRTL ? 'فشل تحميل الجلسات' : 'Failed to load sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            addToast('error', isRTL ? 'يرجى إدخال عنوان الجلسة' : 'Session title is required');
            return;
        }
        const loadId = addToast('loading', isRTL ? 'جاري الحفظ...' : 'Saving...', 0);
        setIsLoading(true);
        try {
            if (editingId) {
                await api.liveAuctions.update(editingId, formData);
            } else {
                await api.liveAuctions.create(formData);
            }
            dismissToast(loadId);
            addToast('success', isRTL ? 'تم الحفظ بنجاح ✓' : 'Saved successfully ✓');
            setIsModalOpen(false);
            resetForm();
            loadSessions();
        } catch (e: any) {
            dismissToast(loadId);
            addToast('error', e.message || (isRTL ? 'فشل الحفظ' : 'Save failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(isRTL ? `هل أنت متأكد من حذف جلسة "${title}"؟` : `Delete session "${title}"?`)) return;
        const loadId = addToast('loading', isRTL ? 'جاري الحذف...' : 'Deleting...', 0);
        try {
            const res = await api.liveAuctions.delete(id);
            dismissToast(loadId);
            if (res.success) {
                setSessions(prev => prev.filter(s => s._id !== id));
                addToast('success', isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
            } else {
                addToast('error', res.error || (isRTL ? 'فشل الحذف' : 'Delete failed'));
            }
        } catch (e: any) {
            dismissToast(loadId);
            addToast('error', e.message || (isRTL ? 'فشل الحذف' : 'Delete failed'));
        }
    };

    const handleStatus = async (id: string, action: 'start' | 'end') => {
        setIsStarting(id);
        const loadId = addToast('loading', isRTL
            ? (action === 'start' ? 'جاري بدء المزاد...' : 'جاري إيقاف المزاد...')
            : (action === 'start' ? 'Starting auction...' : 'Stopping auction...'), 0);
        try {
            if (action === 'start') await api.liveAuctions.start(id);
            else await api.liveAuctions.end(id);
            dismissToast(loadId);
            addToast('success', isRTL
                ? (action === 'start' ? '🔴 تم بدء البث المباشر وإخطار العملاء' : '⏹ تم إيقاف المزاد')
                : (action === 'start' ? '🔴 Auction started & clients notified' : '⏹ Auction stopped'));
            loadSessions();
        } catch (e: any) {
            dismissToast(loadId);
            addToast('error', e.message || 'Error');
        } finally {
            setIsStarting(null);
        }
    };

    const handleImport = async (id: string) => {
        const session = sessions.find(s => s._id === id);
        if (!session?.externalUrl) {
            addToast('error', isRTL ? 'لا يوجد رابط خارجي. أضف الرابط أولاً ثم احفظ.' : 'No external URL. Add URL first and save.');
            return;
        }
        if (!confirm(isRTL
            ? `سيتم استيراد السيارات من الرابط الخارجي. قد يستغرق هذا دقيقة. هل تريد المتابعة؟`
            : `Import cars from external URL? This may take a minute. Continue?`)) return;

        setIsImporting(id);
        const loadId = addToast('loading', isRTL ? 'جاري استيراد السيارات من الرابط...' : 'Importing cars from URL...', 0);
        try {
            const res = await (api.liveAuctions as any).importExternal(id);
            dismissToast(loadId);
            if (res.success) {
                addToast('success', isRTL ? `✅ ${res.message}` : `✅ Cars imported successfully!`);
                loadSessions();
            } else {
                addToast('error', res.error || (isRTL ? 'فشل الاستيراد. تأكد من صحة الرابط.' : 'Import failed. Check the URL.'));
            }
        } catch (e: any) {
            dismissToast(loadId);
            addToast('error', isRTL ? 'خطأ في الاتصال بالخادم أثناء الاستيراد.' : 'Server connection error during import.');
        } finally {
            setIsImporting(null);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', autoSync: false, cars: [] });
        setEditingId(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedSessions(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openEdit = (session: any) => {
        setFormData({
            title: session.title || '',
            externalUrl: session.externalUrl || '',
            whatsappNumber: session.whatsappNumber || '',
            auctionUsername: session.auctionUsername || '',
            auctionPassword: session.auctionPassword || '',
            autoSync: session.autoSync || false,
            cars: session.cars || []
        });
        setEditingId(session._id);
        setIsModalOpen(true);
    };

    const addCar = () => {
        setFormData({ ...formData, cars: [...formData.cars, { title: '', images: [], condition: '', description: '', priceEstimate: '' }] });
    };

    const removeCar = (index: number) => {
        const newCars = [...formData.cars];
        newCars.splice(index, 1);
        setFormData({ ...formData, cars: newCars });
    };

    const updateCar = (index: number, field: string, value: any) => {
        const newCars = [...formData.cars];
        newCars[index] = { ...newCars[index], [field]: value };
        setFormData({ ...formData, cars: newCars });
    };

    const handleImageUpload = async (index: number, files: FileList | null) => {
        if (!files) return;
        const loadId = addToast('loading', isRTL ? 'جاري رفع الصور...' : 'Uploading images...', 0);
        try {
            const results = await Promise.all(Array.from(files).map(file => {
                const fd = new FormData();
                fd.append('image', file);
                return api.upload.image(fd);
            }));
            const urls = results.map((r: any) => r.url);
            updateCar(index, 'images', [...formData.cars[index].images, ...urls]);
            dismissToast(loadId);
            addToast('success', isRTL ? `تم رفع ${urls.length} صورة` : `${urls.length} image(s) uploaded`);
        } catch (e) {
            dismissToast(loadId);
            addToast('error', isRTL ? 'فشل رفع الصور' : 'Image upload failed');
        }
    };

    // Safe session calculations
    const safeSessions = Array.isArray(sessions) ? sessions.filter((s: any) => s && typeof s === 'object') : [];
    const liveSessions = safeSessions.filter(s => s.status === 'live').length;
    const upcomingSessions = safeSessions.filter(s => s.status === 'upcoming').length;
    const endedSessions = safeSessions.filter(s => s.status === 'ended').length;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'}>

            <AdminPageShell
                icon={Radio}
                accentColor="red"
                title={isRTL ? 'المزادات المباشرة' : 'LIVE AUCTIONS'}
                titleEn="LIVE AUCTION CONTROL"
                subtitle={isRTL ? 'إدارة جلسات البث المباشر واستيراد السيارات من المواقع الخارجية' : 'Manage live sessions and import cars from external sources'}
                isRTL={isRTL}
                badge={liveSessions > 0 ? (isRTL ? `${liveSessions} مباشر` : `${liveSessions} LIVE`) : undefined}
                stats={[
                    { label: isRTL ? 'مباشر الآن' : 'LIVE NOW', value: liveSessions, color: liveSessions > 0 ? 'text-red-400' : 'text-white/30' },
                    { label: isRTL ? 'قادم' : 'UPCOMING', value: upcomingSessions, color: 'text-blue-400' },
                    { label: isRTL ? 'منتهي' : 'ENDED', value: endedSessions, color: 'text-white/30' },
                    { label: isRTL ? 'الكل' : 'TOTAL', value: sessions.length, color: 'text-white/50' },
                ]}
                actions={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white font-black uppercase text-[11px] tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    >
                        <Plus className="w-4 h-4" />
                        {isRTL ? 'جلسة جديدة' : 'NEW SESSION'}
                    </motion.button>
                }
            >

                {/* ── How It Works Wizard ── */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mb-6">
                    <p className="text-[9px] text-white/25 uppercase tracking-widest font-black mb-4">{isRTL ? 'كيف يعمل؟' : 'HOW IT WORKS'}</p>
                    <div className="flex flex-wrap items-center gap-4">
                        {[
                            { n: 1, ar: 'أنشئ جلسة جديدة', en: 'Create Session' },
                            { n: 2, ar: 'أدخل رابط المزاد الخارجي واحفظ', en: 'Add External URL & Save' },
                            { n: 3, ar: 'اضغط "استيراد" لجلب السيارات', en: 'Click Import to fetch cars' },
                            { n: 4, ar: 'ابدأ البث المباشر', en: 'Go Live!' },
                        ].map((step, i, arr) => (
                            <>
                                <div key={step.n} className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-[10px] font-black text-red-400">{step.n}</div>
                                    <span className="text-[11px] text-white/50 font-medium">{isRTL ? step.ar : step.en}</span>
                                </div>
                                {i < arr.length - 1 && <div className="w-6 h-px bg-white/10 hidden sm:block" />}
                            </>
                        ))}
                    </div>
                </div>

                {/* ── Sessions List ── */}
                <div className="space-y-4">


                    {isLoading && safeSessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <RefreshCw className="w-8 h-8 text-white/20 animate-spin" />
                            <p className="text-white/30 text-xs uppercase tracking-widest">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
                        </div>
                    )}

                    {!isLoading && safeSessions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/10 rounded-3xl">
                            <Radio className="w-16 h-16 text-white/5" />
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-black uppercase italic text-white/20 tracking-tighter">
                                    {isRTL ? 'لا توجد جلسات بعد' : 'No Sessions Yet'}
                                </h3>
                                <p className="text-white/20 text-xs uppercase tracking-widest">
                                    {isRTL ? 'أنشئ أول جلسة مزاد مباشر' : 'Create your first live auction session'}
                                </p>
                            </div>
                            <button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-xl"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'إنشاء جلسة جديدة' : 'CREATE SESSION'}
                            </button>
                        </div>
                    )}

                    <AnimatePresence>
                        {safeSessions.map((session, i) => (
                            <motion.div
                                key={session._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: i * 0.04 }}
                                className={cn(
                                    "bg-white/[0.02] border rounded-2xl p-6 transition-all",
                                    session.status === 'live'
                                        ? "border-red-500/30 bg-red-500/[0.03]"
                                        : "border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex flex-col lg:flex-row gap-6">

                                    {/* ── Session Info ── */}
                                    <div className="flex-1 space-y-3 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <StatusBadge status={session.status} isRTL={isRTL} />
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter truncate">
                                                {session.title}
                                            </h3>
                                        </div>

                                        {/* External URL */}
                                        {session.externalUrl ? (
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="w-3 h-3 text-orange-400 shrink-0" />
                                                <a
                                                    href={session.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-orange-400/70 hover:text-orange-400 text-[11px] font-mono truncate transition-colors"
                                                >
                                                    {session.externalUrl}
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3 text-yellow-500/60 shrink-0" />
                                                <span className="text-yellow-500/60 text-[11px]">
                                                    {isRTL ? 'لا يوجد رابط خارجي — أضفه عبر تعديل الجلسة' : 'No external URL — edit session to add one'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Stats Row */}
                                        <div className="flex flex-wrap gap-3 pt-1">
                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
                                                <ImageIcon className="w-3 h-3 text-white/30" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                                                    {session.cars?.length || 0} {isRTL ? 'سيارة' : 'CARS'}
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest",
                                                session.autoSync
                                                    ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                                    : "bg-white/5 border-white/5 text-white/30"
                                            )}>
                                                {session.autoSync
                                                    ? <><ToggleRight className="w-3.5 h-3.5" />{isRTL ? 'تلقائي كل 24 ساعة' : 'AUTO SYNC 24H'}</>
                                                    : <><ToggleLeft className="w-3.5 h-3.5" />{isRTL ? 'تحديث يدوي' : 'MANUAL SYNC'}</>
                                                }
                                            </div>
                                            {session.whatsappNumber && (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-400">
                                                    📱 {session.whatsappNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Action Buttons ── */}
                                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">

                                        {/* Start / Stop */}
                                        {session.status !== 'live' ? (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleStatus(session._id, 'start')}
                                                disabled={isStarting === session._id}
                                                className="flex flex-col items-center gap-1 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                                            >
                                                {isStarting === session._id
                                                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                    : <Play className="w-5 h-5" />
                                                }
                                                <span className="text-[7px] font-black uppercase">{isRTL ? 'بث' : 'GO LIVE'}</span>
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleStatus(session._id, 'end')}
                                                disabled={isStarting === session._id}
                                                className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-red-400 hover:border-red-500/20 transition-all"
                                            >
                                                <Square className="w-5 h-5" />
                                                <span className="text-[7px] font-black uppercase">{isRTL ? 'إيقاف' : 'STOP'}</span>
                                            </motion.button>
                                        )}

                                        {/* Import from URL */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleImport(session._id)}
                                            disabled={isImporting === session._id || !session.externalUrl}
                                            title={!session.externalUrl ? (isRTL ? 'أضف رابطاً خارجياً أولاً' : 'Add external URL first') : ''}
                                            className={cn(
                                                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all",
                                                session.externalUrl
                                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                                                    : "bg-white/5 border-white/5 text-white/20 cursor-not-allowed",
                                                isImporting === session._id && "animate-pulse"
                                            )}
                                        >
                                            <Download className={cn("w-5 h-5", isImporting === session._id && "animate-spin")} />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'استيراد' : 'IMPORT'}</span>
                                        </motion.button>

                                        {/* Edit */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => openEdit(session)}
                                            className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'تعديل' : 'EDIT'}</span>
                                        </motion.button>

                                        {/* View (client page) */}
                                        <Link
                                            href={`/auctions/live/${session._id}`}
                                            target="_blank"
                                            className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-cyan-400 hover:border-cyan-500/20 hover:bg-cyan-500/5 transition-all"
                                        >
                                            <Eye className="w-5 h-5" />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'معاينة' : 'VIEW'}</span>
                                        </Link>

                                        {/* Delete */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDelete(session._id, session.title)}
                                            className="flex flex-col items-center gap-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white/20 hover:text-red-400 hover:border-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'حذف' : 'DEL'}</span>
                                        </motion.button>
                                    </div>
                                </div>

                                    {/* ── قسم السيارات المستوردة ── */}
                                    {Array.isArray(session.cars) && session.cars.filter(Boolean).length > 0 && (
                                        <div className="mt-4 border-t border-white/[0.05] pt-4">
                                            <button
                                                onClick={() => toggleExpand(session._id)}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors w-full"
                                            >
                                                <Car className="w-3.5 h-3.5 text-amber-400" />
                                                <span className="text-amber-400/80">
                                                    {isRTL ? `${session.cars.length} سيارة مستوردة` : `${session.cars.length} Imported Cars`}
                                                </span>
                                                <span className="flex-1" />
                                                {expandedSessions.has(session._id)
                                                    ? <ChevronUp className="w-4 h-4" />
                                                    : <ChevronDown className="w-4 h-4" />}
                                            </button>

                                            {expandedSessions.has(session._id) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                                                >
                                                    {session.cars.filter(Boolean).map((car: any, ci: number) => {
                                                        const carImg = (Array.isArray(car.images) && car.images[0]) || car.image || car.img || '';
                                                        const carTitle = car.title || `${isRTL ? 'سيارة' : 'Car'} ${ci + 1}`;
                                                        const rawEst = car.priceEstimate || car.price || '';
                                                        const displayEst = typeof rawEst === 'number'
                                                            ? `${rawEst.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}`
                                                            : String(rawEst);

                                                        return (
                                                            <div key={ci}
                                                                className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden hover:border-amber-500/30 transition-all group"
                                                            >
                                                                {/* صورة السيارة */}
                                                                <div className="relative h-36 bg-black/40">
                                                                    {carImg ? (
                                                                        <img
                                                                            src={carImg}
                                                                            alt={carTitle}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                            onError={(e: any) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <Car className="w-10 h-10 text-white/10" />
                                                                        </div>
                                                                    )}
                                                                    {/* شارة الحالة */}
                                                                    <div className="absolute top-2 right-2">
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase",
                                                                            car.condition === 'new' || car.condition === 'جديد'
                                                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                                        )}>
                                                                            {car.condition || (isRTL ? 'مستعملة' : 'Used')}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* بيانات السيارة */}
                                                                <div className="p-3 space-y-2">
                                                                    <p className="text-xs font-bold text-white truncate">{carTitle}</p>

                                                                    {displayEst && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <DollarSign className="w-3 h-3 text-amber-400" />
                                                                            <span className="text-amber-400 font-bold text-xs">
                                                                                {displayEst}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {car.description && (
                                                                        <p className="text-[10px] text-white/40 line-clamp-2">{car.description}</p>
                                                                    )}

                                                                    {car.externalUrl && (
                                                                        <a
                                                                            href={car.externalUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-[9px] text-orange-400/70 hover:text-orange-400 transition-colors"
                                                                        >
                                                                            <ExternalLink className="w-2.5 h-2.5" />
                                                                            <span>{isRTL ? 'عرض المصدر' : 'View Source'}</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* رسالة: لا توجد سيارات بعد */}
                                    {(!session.cars || session.cars.length === 0) && (
                                        <div className="mt-4 border-t border-white/[0.05] pt-4 flex items-center gap-2 text-[10px] text-white/25">
                                            <Car className="w-3.5 h-3.5" />
                                            <span>{isRTL ? 'لا توجد سيارات — اضغط "استيراد" لجلبها من الرابط الخارجي' : 'No cars yet — click Import to fetch from external URL'}</span>
                                        </div>
                                    )}

                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* ════════════════════════════════════════════
                    قسم: السيارات المستوردة من بوابة الاستيراد
                ════════════════════════════════════════════ */}
                <div className="mt-8 pt-8 border-t border-white/[0.05] space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-white/25 uppercase tracking-widest font-black">
                                {isRTL ? 'سيارات المزادات المستوردة' : 'IMPORTED AUCTION CARS'}
                            </p>
                            <h3 className="text-lg font-black uppercase italic tracking-tighter mt-1">
                                {isRTL ? 'من بوابة الاستيراد' : 'From Import Gateway'}
                            </h3>
                            <p className="text-[10px] text-white/30 mt-0.5">
                                {isRTL
                                    ? 'السيارات المستوردة عبر /admin/import — فعّل أي مزاد لإتاحته للعملاء'
                                    : 'Cars imported via /admin/import — activate any auction to make it live'}
                            </p>
                        </div>
                        <button onClick={loadImportedAuctions} disabled={importedLoading}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <RefreshCw className={cn('w-4 h-4', importedLoading && 'animate-spin')} />
                        </button>
                    </div>

                    {/* قائمة السيارات المستوردة من بوابة الاستيراد */}
                    {(() => {
                        const safeImportedAuctions = Array.isArray(importedAuctions) ? importedAuctions.filter((a: any) => a && typeof a === 'object') : [];

                        if (importedLoading) {
                            return (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
                                </div>
                            );
                        }

                        if (safeImportedAuctions.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-12 gap-4 border border-dashed border-white/10 rounded-2xl">
                                    <Car className="w-12 h-12 text-white/5" />
                                    <p className="text-white/25 text-xs uppercase tracking-widest text-center">
                                        {isRTL
                                            ? 'لا توجد سيارات مستوردة بعد — اذهب لبوابة الاستيراد لإضافتها'
                                            : 'No imported cars yet — go to Import Gateway to add cars'}
                                    </p>
                                    <Link href="/admin/import"
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-all">
                                        <Download className="w-3.5 h-3.5" />
                                        {isRTL ? 'بوابة الاستيراد ←' : 'Import Gateway →'}
                                    </Link>
                                </div>
                            );
                        }

                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {safeImportedAuctions.map((auction: any) => {
                                    if (!auction || !auction._id) return null;
                                    const car = (typeof auction.car === 'object' && auction.car !== null) ? auction.car : {};
                                    const img = (Array.isArray(auction.images) && auction.images[0]) ||
                                                (Array.isArray(car.images) && car.images[0]) ||
                                                car.image || car.img || '';
                                    const title = auction.title || car.title || `${car.make || ''} ${car.model || ''} ${car.year || ''}`.trim() || (isRTL ? 'سيارة مزاد' : 'Auction Car');
                                    const rawPrice = auction.currentPrice || auction.startingPrice || car.price || 0;
                                    const priceNum = typeof rawPrice === 'number' ? rawPrice : (Number(rawPrice) || 0);
                                    const isActive = auction.status === 'running';
                                    const isPending = auction.status === 'pending' || auction.status === 'scheduled';

                                    return (
                                        <motion.div key={auction._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                'rounded-2xl border overflow-hidden group transition-all',
                                                isActive
                                                    ? 'border-red-500/40 bg-red-500/[0.03] shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                                                    : 'border-white/[0.07] bg-white/[0.02] hover:border-amber-500/30'
                                            )}
                                        >
                                            {/* صورة */}
                                            <div className="relative h-40 bg-black/50">
                                                {img ? (
                                                    <img src={img} alt={title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e: any) => { e.target.style.display = 'none'; }} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Car className="w-12 h-12 text-white/10" />
                                                    </div>
                                                )}
                                                {/* شارة الحالة */}
                                                <div className="absolute top-2 right-2">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-[8px] font-black uppercase border',
                                                        isActive
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                                                            : isPending
                                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                            : 'bg-white/5 text-white/30 border-white/10'
                                                    )}>
                                                        {isActive ? (isRTL ? '🔴 مباشر' : '🔴 LIVE')
                                                            : isPending ? (isRTL ? '⏳ معلّق' : '⏳ PENDING')
                                                            : (isRTL ? '✅ منتهي' : '✅ ENDED')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* البيانات */}
                                            <div className="p-4 space-y-3">
                                                <p className="text-sm font-bold text-white leading-tight line-clamp-2">{title}</p>

                                                <div className="flex items-center gap-4 text-[10px] text-white/40">
                                                    {car.year && <span>📅 {car.year}</span>}
                                                    {car.mileage > 0 && <span>🚗 {Number(car.mileage).toLocaleString()} km</span>}
                                                    {car.fuelType && <span>{car.fuelType}</span>}
                                                </div>

                                                {priceNum > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="w-3 h-3 text-amber-400" />
                                                        <span className="text-amber-400 font-bold text-sm">
                                                            {priceNum.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-2 pt-1">
                                                    {/* زر تفعيل */}
                                                    {!isActive && (
                                                        <button
                                                            onClick={() => handleActivate(auction._id)}
                                                            disabled={activatingId === auction._id}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-all disabled:opacity-40"
                                                        >
                                                            {activatingId === auction._id
                                                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                                                : <Play className="w-3 h-3" />}
                                                            {isRTL ? 'تفعيل' : 'ACTIVATE'}
                                                        </button>
                                                    )}
                                                    {isActive && (
                                                        <button
                                                            disabled
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500/5 border border-red-500/20 text-red-400/50 rounded-xl text-[10px] font-black uppercase cursor-default"
                                                        >
                                                            <Zap className="w-3 h-3" />
                                                            {isRTL ? 'مفعّل' : 'ACTIVE'}
                                                        </button>
                                                    )}
                                                    {/* معاينة */}
                                                    {auction._id && (
                                                        <Link href={`/auctions/${auction._id}`} target="_blank"
                                                            className="flex items-center justify-center px-3 py-2 bg-white/5 border border-white/10 text-white/30 rounded-xl hover:text-cyan-400 hover:border-cyan-500/20 transition-all">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

            </AdminPageShell>

            {/* ══════════════════════════════════════════
                SESSION MODAL (Create / Edit)
            ══════════════════════════════════════════ */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 20 }}
                            className="bg-[#0c0c14] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col relative shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                        {editingId
                                            ? (isRTL ? '✏️ تعديل الجلسة' : '✏️ Edit Session')
                                            : (isRTL ? '➕ جلسة جديدة' : '➕ New Session')}
                                    </h2>
                                    <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">
                                        {isRTL ? 'أدخل البيانات ثم احفظ' : 'Fill in details then save'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8">

                                {/* ── Section 1: Basic Info ── */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black flex items-center justify-center">1</span>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                                            {isRTL ? 'معلومات الجلسة' : 'Session Info'}
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                                {isRTL ? 'عنوان الجلسة *' : 'Session Title *'}
                                            </label>
                                            <input
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all text-sm"
                                                placeholder={isRTL ? 'مثال: مزاد IAAI — الاثنين ١٥ يوليو' : 'e.g. IAAI Live — Monday July 15'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                                {isRTL ? 'واتساب هذا المزاد' : 'WhatsApp (this auction)'}
                                            </label>
                                            <input
                                                value={formData.whatsappNumber}
                                                onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                                                placeholder="9665xxxxxxxx"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 2: External URL (IMPORTANT) ── */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black flex items-center justify-center">2</span>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                                            {isRTL ? 'رابط المزاد الخارجي' : 'External Auction URL'}
                                        </h4>
                                    </div>

                                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
                                        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-orange-300/70 leading-relaxed">
                                            {isRTL
                                                ? 'أدخل رابط صفحة المزاد الخارجي (مثل Copart أو IAAI أو Encar). بعد الحفظ، اضغط زر "استيراد" لجلب السيارات تلقائياً من الرابط.'
                                                : 'Enter the external auction URL (e.g. Copart, IAAI, or Encar). After saving, click "Import" to automatically fetch cars from this URL.'
                                            }
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                            {isRTL ? 'رابط المزاد الخارجي' : 'Auction URL'}
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                                <input
                                                    value={formData.externalUrl}
                                                    onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 p-3.5 pr-10 rounded-xl focus:outline-none focus:border-orange-500/50 transition-all text-sm font-mono"
                                                    placeholder="https://www.copart.com/lot/..."
                                                    dir="ltr"
                                                />
                                            </div>
                                            {formData.externalUrl && (
                                                <a
                                                    href={formData.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                                    title={isRTL ? 'فتح الرابط' : 'Open URL'}
                                                >
                                                    <ExternalLink className="w-4 h-4 text-white/40" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Login credentials for external site */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                                {isRTL ? 'اسم المستخدم (الموقع الخارجي)' : 'Username (External Site)'}
                                            </label>
                                            <input
                                                value={formData.auctionUsername}
                                                onChange={e => setFormData({ ...formData, auctionUsername: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/5 p-3.5 rounded-xl focus:outline-none focus:border-white/20 transition-all text-sm"
                                                placeholder={isRTL ? 'اختياري' : 'Optional'}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                                {isRTL ? 'كلمة المرور (الموقع الخارجي)' : 'Password (External Site)'}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.auctionPassword}
                                                onChange={e => setFormData({ ...formData, auctionPassword: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/5 p-3.5 rounded-xl focus:outline-none focus:border-white/20 transition-all text-sm"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Section 3: Sync Mode ── */}
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black flex items-center justify-center">3</span>
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
                                            {isRTL ? 'وضع التحديث' : 'Update Mode'}
                                        </h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {/* Auto Sync */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, autoSync: true })}
                                            className={cn(
                                                "flex items-start gap-4 p-5 rounded-2xl border text-start transition-all",
                                                formData.autoSync
                                                    ? "bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(0,200,255,0.08)]"
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                formData.autoSync ? "bg-cyan-500/20" : "bg-white/5"
                                            )}>
                                                <Zap className={cn("w-5 h-5", formData.autoSync ? "text-cyan-400" : "text-white/20")} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={cn("text-sm font-black uppercase tracking-wider", formData.autoSync ? "text-cyan-300" : "text-white/40")}>
                                                    {isRTL ? 'تحديث تلقائي' : 'Auto Sync'}
                                                </p>
                                                <p className="text-[11px] text-white/30 leading-relaxed">
                                                    {isRTL
                                                        ? 'يتم تحديث السيارات تلقائياً كل 24 ساعة من الرابط الخارجي دون تدخل يدوي.'
                                                        : 'Cars are automatically updated every 24 hours from the external URL without manual intervention.'
                                                    }
                                                </p>
                                            </div>
                                            {formData.autoSync && (
                                                <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 ms-auto mt-0.5" />
                                            )}
                                        </button>

                                        {/* Manual Sync */}
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, autoSync: false })}
                                            className={cn(
                                                "flex items-start gap-4 p-5 rounded-2xl border text-start transition-all",
                                                !formData.autoSync
                                                    ? "bg-white/5 border-white/20"
                                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                !formData.autoSync ? "bg-white/10" : "bg-white/5"
                                            )}>
                                                <RefreshCw className={cn("w-5 h-5", !formData.autoSync ? "text-white/60" : "text-white/20")} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={cn("text-sm font-black uppercase tracking-wider", !formData.autoSync ? "text-white/70" : "text-white/30")}>
                                                    {isRTL ? 'تحديث يدوي فقط' : 'Manual Sync Only'}
                                                </p>
                                                <p className="text-[11px] text-white/30 leading-relaxed">
                                                    {isRTL
                                                        ? 'التحديث يدوي فقط عند الضغط على زر "استيراد" في لوحة التحكم.'
                                                        : 'Update only when you manually press the "Import" button in the dashboard.'
                                                    }
                                                </p>
                                            </div>
                                            {!formData.autoSync && (
                                                <CheckCircle className="w-5 h-5 text-white/40 shrink-0 ms-auto mt-0.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* ── Section 4: Manual Cars (optional) ── */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-white/5 text-white/30 text-xs font-black flex items-center justify-center">4</span>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                                                {isRTL ? 'إضافة سيارات يدوياً (اختياري)' : 'Add Cars Manually (Optional)'}
                                            </h4>
                                        </div>
                                        <button
                                            onClick={addCar}
                                            className="flex items-center gap-1.5 text-orange-400 text-[10px] font-black uppercase tracking-widest bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            {isRTL ? 'إضافة سيارة' : 'ADD CAR'}
                                        </button>
                                    </div>

                                    {formData.cars.length === 0 && (
                                        <p className="text-center text-white/20 text-xs py-6">
                                            {isRTL ? 'لم تضف سيارات يدوياً بعد. يمكنك الاكتفاء بالاستيراد التلقائي من الرابط.' : 'No manual cars added. You can rely on auto-import from URL.'}
                                        </p>
                                    )}

                                    <div className="space-y-4">
                                        {formData.cars.map((car, idx) => (
                                            <div key={idx} className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 relative space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                        {isRTL ? `سيارة #${idx + 1}` : `Car #${idx + 1}`}
                                                    </span>
                                                    <button
                                                        onClick={() => removeCar(idx)}
                                                        className="text-white/20 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        value={car.title}
                                                        onChange={e => updateCar(idx, 'title', e.target.value)}
                                                        className="bg-black/30 border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-white/20"
                                                        placeholder={isRTL ? 'اسم السيارة (مثال: فورد موستانج 2021)' : 'Car name (e.g. Ford Mustang 2021)'}
                                                    />
                                                    <input
                                                        value={car.condition}
                                                        onChange={e => updateCar(idx, 'condition', e.target.value)}
                                                        className="bg-black/30 border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-white/20"
                                                        placeholder={isRTL ? 'الحالة (مثال: تلف أمامي)' : 'Condition (e.g. Front damage)'}
                                                    />
                                                    <input
                                                        value={car.priceEstimate}
                                                        onChange={e => updateCar(idx, 'priceEstimate', e.target.value)}
                                                        className="bg-black/30 border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-white/20"
                                                        placeholder={isRTL ? 'السعر التقديري' : 'Price estimate'}
                                                    />
                                                    <label className="cursor-pointer bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                                        <ImageIcon className="w-4 h-4 text-white/30" />
                                                        <span>{isRTL ? 'رفع صور' : 'Upload Images'}</span>
                                                        <input type="file" multiple className="hidden" onChange={e => handleImageUpload(idx, e.target.files)} />
                                                        {car.images?.length > 0 && (
                                                            <span className="ms-auto text-orange-400">{car.images.length}</span>
                                                        )}
                                                    </label>
                                                </div>
                                                <textarea
                                                    value={car.description}
                                                    onChange={e => updateCar(idx, 'description', e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 p-3 rounded-lg text-sm h-16 resize-none focus:outline-none focus:border-white/20"
                                                    placeholder={isRTL ? 'تفاصيل إضافية...' : 'Additional details...'}
                                                />
                                                {car.images?.length > 0 && (
                                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                                        {car.images.map((img: string, i: number) => (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img key={i} src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-white/10 shrink-0" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/5 bg-black/40 flex gap-3 shrink-0">
                                <button
                                    onClick={() => { setIsModalOpen(false); resetForm(); }}
                                    className="px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-[0.3em] text-xs rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                >
                                    {isLoading
                                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                                        : <Save className="w-4 h-4" />
                                    }
                                    {isRTL ? (editingId ? 'حفظ التعديلات' : 'حفظ وإنشاء الجلسة') : (editingId ? 'SAVE CHANGES' : 'SAVE & CREATE')}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
