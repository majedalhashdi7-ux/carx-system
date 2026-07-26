'use client';

/**
 * [[ARABIC_HEADER]] مركز إدارة المزادات الموحد - HM CAR Master Auction Hub
 * يدمج جميع أنواع المزادات (المباشرة، الكورية، الفورية، الطلبات) في صفحة قيادية واحدة متكاملة
 * مجهز بنظام أمان فائق ضد أخطاء البيانات (Null-Safe & Bulletproof)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, X,
    Play, Square, ExternalLink, RefreshCw,
    Radio, Car, Gavel, Search,
    CheckCircle2, ArrowUpRight
} from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";

function MasterAuctionsContent() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialTab = searchParams?.get('tab') || 'live';
    const [activeTab, setActiveTab] = useState<'live' | 'classic' | 'requests'>(
        initialTab === 'classic' ? 'classic' : initialTab === 'requests' ? 'requests' : 'live'
    );

    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // ── 1. Live Auctions & Import Sessions State ──
    const [sessions, setSessions] = useState<any[]>([]);
    const [importedAuctions, setImportedAuctions] = useState<any[]>([]);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Live Session Form Modal
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [sessionForm, setSessionForm] = useState({
        title: '',
        externalUrl: '',
        whatsappNumber: '',
        auctionUsername: '',
        auctionPassword: '',
        cars: [] as any[]
    });

    // ── 2. Classic Auctions State ──
    const [classicAuctions, setClassicAuctions] = useState<any[]>([]);
    const [availableCars, setAvailableCars] = useState<any[]>([]);
    const [auctionStatusFilter, setAuctionStatusFilter] = useState('running');

    // Classic Auction Form Modal
    const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
    const [auctionForm, setAuctionForm] = useState({
        carId: '',
        startingPrice: '',
        startsAt: '',
        endsAt: ''
    });

    // ── Safe Data Loaders ──
    const loadLiveSessions = useCallback(async () => {
        setLoading(true);
        try {
            const [sessRes, impRes] = await Promise.all([
                api.liveAuctions.list().catch(() => ({ success: false, data: [] })),
                // جلب جميع المزادات المستوردة من Encar (بغض النظر عن الحالة)
                api.auctions.list({ limit: 200, source: 'encar' })
                    .catch(() => api.auctions.list({ limit: 200 }).catch(() => ({ success: false, data: [] })))
            ]);

            let rawSessions = Array.isArray(sessRes?.data) 
                ? sessRes.data 
                : (Array.isArray(sessRes?.sessions) ? sessRes.sessions : (Array.isArray(sessRes) ? sessRes : []));

            // دمج رابط الاستيراد المحفوظ من بوابة الاستيراد إن وجد
            if (typeof window !== 'undefined') {
                const savedUrl = localStorage.getItem('hm_auctions_import_url');
                if (savedUrl && savedUrl.startsWith('http')) {
                    const hasSavedUrlSession = rawSessions.some((s: any) => s && s.externalUrl === savedUrl);
                    if (!hasSavedUrlSession) {
                        rawSessions = [
                            {
                                _id: 'saved-import-session',
                                title: isRTL ? 'مزاد كوري مباشر مستورد (من بوابة الاستيراد)' : 'Imported Korean Live Auction',
                                externalUrl: savedUrl,
                                status: 'live',
                                carsCount: 20
                            },
                            ...rawSessions
                        ];
                    }
                }
            }

            setSessions(rawSessions.filter((s: any) => s && typeof s === 'object'));

            // المزادات المستوردة: تشمل جميع السيارات المستوردة من Encar
            const allAuctions = Array.isArray(impRes?.data) 
                ? impRes.data 
                : (Array.isArray(impRes?.auctions) ? impRes.auctions : (Array.isArray(impRes) ? impRes : []));

            // فلترة سيارات Encar + السيارات ذات externalId المبدوءة بـ encar-
            const encarAuctions = allAuctions.filter((a: any) => 
                a && typeof a === 'object' && (
                    a.source === 'encar' || 
                    a.source === 'desert_korea_auto' ||
                    (a.externalId && String(a.externalId).startsWith('encar-'))
                )
            );

            // إذا لم نجد Encar محدداً، نعرض الكل (للسماح بعرض أي مزاد تم استيراده)
            const finalAuctions = encarAuctions.length > 0 ? encarAuctions : allAuctions;
            setImportedAuctions(finalAuctions.filter((a: any) => a && typeof a === 'object'));
        } catch {
            setSessions([]);
            setImportedAuctions([]);
        } finally {
            setLoading(false);
        }
    }, [isRTL]);

    const loadClassicAuctions = useCallback(async () => {

        setLoading(true);
        try {
            const [aucRes, carRes] = await Promise.all([
                api.auctions.list({ status: auctionStatusFilter, limit: 100 }).catch(() => ({ success: false, data: [] })),
                api.cars.list({ status: 'active', limit: 100 }).catch(() => ({ success: false, data: { cars: [] } }))
            ]);

            const list = Array.isArray(aucRes?.data) 
                ? aucRes.data 
                : (Array.isArray(aucRes?.auctions) ? aucRes.auctions : []);
            setClassicAuctions(list.filter((a: any) => a && typeof a === 'object'));

            const carList = Array.isArray(carRes?.data?.cars) 
                ? carRes.data.cars 
                : (Array.isArray(carRes?.data) ? carRes.data : []);
            setAvailableCars(carList.filter((c: any) => c && typeof c === 'object'));
        } catch {
            setClassicAuctions([]);
            setAvailableCars([]);
        } finally {
            setLoading(false);
        }
    }, [auctionStatusFilter]);

    useEffect(() => {
        if (activeTab === 'live' || activeTab === 'requests') {
            loadLiveSessions();
        } else {
            loadClassicAuctions();
        }
    }, [activeTab, auctionStatusFilter, loadLiveSessions, loadClassicAuctions]);

    // ── Tab Handler ──
    const handleTabChange = (tab: 'live' | 'classic' | 'requests') => {
        setActiveTab(tab);
        router.replace(`/admin/auctions?tab=${tab}`);
    };

    // ── Live Session Actions ──
    const handleSaveSession = async () => {
        if (!sessionForm.title) {
            showToast(isRTL ? 'يرجى إدخال عنوان الجلسة' : 'Session title is required', 'error');
            return;
        }
        setLoading(true);
        try {
            if (editingSessionId) {
                await api.liveAuctions.update(editingSessionId, sessionForm);
                showToast(isRTL ? '✅ تم تحديث الجلسة المباشرة' : '✅ Live session updated', 'success');
            } else {
                await api.liveAuctions.create(sessionForm);
                showToast(isRTL ? '✅ تم إنشاء الجلسة المباشرة' : '✅ Live session created', 'success');
            }
            setIsSessionModalOpen(false);
            setSessionForm({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', cars: [] });
            setEditingSessionId(null);
            loadLiveSessions();
        } catch (err: any) {
            showToast(err.message || (isRTL ? 'فشل حفظ الجلسة' : 'Failed to save session'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncSession = async (id: string, externalUrl?: string) => {
        setSyncingId(id);
        showToast(isRTL ? '⏳ جاري جلب واستيراد سيارات المزاد...' : '⏳ Scraping live auction cars...', 'info');
        try {
            const res = await (api.liveAuctions as any).importExternal(id, externalUrl ? { externalUrl } : undefined);
            if (res?.success) {
                showToast(isRTL ? `✅ ${res.message || 'تم استيراد المزادات بنجاح'}` : `✅ ${res.message || 'Auctions imported successfully'}`, 'success');
                loadLiveSessions();
            } else {
                showToast(res?.error || 'Sync failed', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Sync failed', 'error');
        } finally {
            setSyncingId(null);
        }
    };

    const handleToggleSessionState = async (id: string, currentStatus: string) => {
        try {
            if (currentStatus === 'live') {
                await api.liveAuctions.end(id);
                showToast(isRTL ? '⏹️ تم إنهاء البث المباشر' : '⏹️ Stream ended', 'info');
            } else {
                await api.liveAuctions.start(id);
                showToast(isRTL ? '▶️ تم تفعيل البث المباشر' : '▶️ Stream started', 'success');
            }
            loadLiveSessions();
        } catch (err: any) {
            showToast(err.message || 'Failed', 'error');
        }
    };

    const handleActivateImportedAuction = async (auctionId: string) => {
        if (!auctionId) return;
        setActivatingId(auctionId);
        try {
            const res = await api.auctions.update(auctionId, { status: 'running' });
            if (res?.success) {
                showToast(isRTL ? '✅ تم تفعيل المزاد بنجاح' : '✅ Auction activated!', 'success');
                loadLiveSessions();
            } else {
                showToast(res?.error || 'Activation failed', 'error');
            }
        } catch {
            showToast(isRTL ? '❌ خطأ في الاتصال' : '❌ Connection error', 'error');
        } finally {
            setActivatingId(null);
        }
    };

    const handleDeleteAuction = async (id: string, title: string) => {
        if (!confirm(isRTL ? `هل أنت تأكد من حذف المزاد "${title || ''}"؟` : `Delete auction "${title || ''}"?`)) return;
        try {
            await api.auctions.delete(id);
            showToast(isRTL ? '✅ تم حذف المزاد' : '✅ Auction deleted', 'success');
            loadLiveSessions();
            loadClassicAuctions();
        } catch (err: any) {
            showToast(err.message || 'Delete failed', 'error');
        }
    };

    // ── Classic Auction Actions ──
    const handleCreateClassicAuction = async () => {
        if (!auctionForm.carId || !auctionForm.startingPrice) {
            showToast(isRTL ? 'يرجى اختيار السيارة والسعر الابتدائي' : 'Select car and enter start price', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await api.auctions.create({
                carId: auctionForm.carId,
                startingPrice: Number(auctionForm.startingPrice),
                startsAt: auctionForm.startsAt || new Date().toISOString(),
                endsAt: auctionForm.endsAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'running'
            });
            if (res?.success) {
                showToast(isRTL ? '✅ تم إطلاق المزاد الفوري بنجاح!' : '✅ Classic auction created!', 'success');
                setIsAuctionModalOpen(false);
                setAuctionForm({ carId: '', startingPrice: '', startsAt: '', endsAt: '' });
                loadClassicAuctions();
            } else {
                showToast(res?.error || 'Create failed', 'error');
            }
        } catch (err: any) {
            showToast(err.message || 'Create failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Safe Stats Calculations
    const safeImported = Array.isArray(importedAuctions) ? importedAuctions : [];
    const safeClassic = Array.isArray(classicAuctions) ? classicAuctions : [];
    const safeSessions = Array.isArray(sessions) ? sessions : [];

    const activeCount = safeImported.filter(a => a && a.status === 'running').length + safeClassic.filter(a => a && a.status === 'running').length;
    const pendingCount = safeImported.filter(a => a && (a.status === 'pending' || a.status === 'scheduled')).length;
    const liveSessionsCount = safeSessions.length;

    return (
        <AdminPageShell
            title={isRTL ? "إدارة المزادات والمبيعات المباشرة" : "Master Auction Hub"}
            subtitle={isRTL ? "مركز قيادة المزادات المباشرة، الكورية، والمزادات الفورية" : "Control live streams, imported Korean cars, and instant auctions"}
            icon={Gavel}
            accentColor="orange"
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => activeTab === 'live' ? setIsSessionModalOpen(true) : setIsAuctionModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 transition-transform"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>{activeTab === 'live' ? (isRTL ? 'إنشاء جلسة بث/مزاد' : 'New Live Session') : (isRTL ? 'إضافة مزاد جديد' : 'New Auction')}</span>
                    </button>
                    <button
                        onClick={() => { loadLiveSessions(); loadClassicAuctions(); }}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        title={isRTL ? "تحديث البيانات" : "Refresh Data"}
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-orange-400")} />
                    </button>
                </div>
            }
            stats={[
                { label: isRTL ? 'مزادات نشطة الآن' : 'Live Active Auctions', value: activeCount, color: 'text-emerald-400' },
                { label: isRTL ? 'مزادات ينتظر التفعيل' : 'Pending Approval', value: pendingCount, color: 'text-amber-400' },
                { label: isRTL ? 'جلسات البث المباشر' : 'Live Streams', value: liveSessionsCount, color: 'text-orange-400' },
            ]}
        >
            {/* ── Tabs Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#0b0c16]/80 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => handleTabChange('live')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                            activeTab === 'live'
                                ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Radio className={cn("w-4 h-4", activeTab === 'live' && "animate-pulse")} />
                        <span>{isRTL ? 'المزادات المباشرة والاستيراد' : 'Live & Import Auctions'}</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] font-mono">{safeSessions.length + safeImported.length}</span>
                    </button>

                    <button
                        onClick={() => handleTabChange('classic')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                            activeTab === 'classic'
                                ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Gavel className="w-4 h-4" />
                        <span>{isRTL ? 'المزادات الفورية والمحلية' : 'Instant Auctions'}</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] font-mono">{safeClassic.length}</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={isRTL ? "بحث في المزادات..." : "Search auctions..."}
                        className="w-full pl-4 pr-10 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50"
                    />
                </div>
            </div>

            {/* ── TAB 1: Live & Import Auctions ── */}
            {activeTab === 'live' && (
                <div className="space-y-10">
                    {/* Sección 1: المزادات الكورية المستوردة المعلقة */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                                <h2 className="text-lg font-bold text-white">
                                    {isRTL ? 'المزادات المستوردة تلقائياً (بانتظار التفعيل)' : 'Imported Auctions Catalog'}
                                </h2>
                            </div>
                            <Link href="/admin/import" className="text-xs text-orange-400 hover:underline flex items-center gap-1">
                                <span>{isRTL ? 'بوابة الاستيراد' : 'Import Hub'}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {safeImported.length === 0 ? (
                            <div className="p-10 text-center rounded-2xl bg-white/[0.02] border border-white/10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <Car className="w-8 h-8 text-orange-400/40" />
                                </div>
                                <p className="text-white/40 text-sm font-bold mb-1">
                                    {isRTL ? 'لا توجد سيارات مستوردة من Encar بعد' : 'No imported cars yet'}
                                </p>
                                <p className="text-white/20 text-xs mb-4">
                                    {isRTL ? 'اذهب إلى بوابة الاستيراد ← تبويب المزادات ← استورد من Encar' : 'Go to Import Hub → Auctions tab → Import from Encar'}
                                </p>
                                <Link href="/admin/import?tab=auctions"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition-colors">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    {isRTL ? 'فتح بوابة الاستيراد' : 'Open Import Hub'}
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {safeImported
                                    .filter(a => a && (!search || (a.title || '').toLowerCase().includes(search.toLowerCase())))
                                    .map((auction) => {
                                        const isRunning = auction?.status === 'running';
                                        const isActivating = activatingId === auction?._id;
                                        const imgs = auction?.images || auction?.carId?.images || [];
                                        const mainImg = imgs[0] || '';
                                        const specs = auction?.specs || auction?.carId?.specs || {};
                                        const priceSar = auction?.startingPrice || auction?.priceSar || auction?.currentBid || 0;
                                        const priceKrw = auction?.priceKrw || 0;
                                        const mileage = auction?.mileage || specs?.mileage || '';
                                        const year = specs?.year || auction?.year || '';
                                        const fuel = auction?.fuelType || specs?.fuelType || '';

                                        return (
                                            <motion.div
                                                key={auction._id || Math.random()}
                                                whileHover={{ y: -3 }}
                                                className="relative group rounded-2xl bg-[#0e0f1d] border border-white/10 overflow-hidden hover:border-orange-500/40 transition-all flex flex-col"
                                            >
                                                {/* Image */}
                                                <div className="relative h-44 bg-black/50">
                                                    {mainImg ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={mainImg} alt={auction.title || 'Car'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-white/10">
                                                            <Car className="w-14 h-14" />
                                                        </div>
                                                    )}

                                                    {/* Status badge */}
                                                    <div className="absolute top-2 right-2">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border backdrop-blur-md",
                                                            isRunning ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                                        )}>
                                                            {isRunning ? (isRTL ? '✅ نشط' : '✅ Active') : (isRTL ? '⏳ انتظار' : '⏳ Pending')}
                                                        </span>
                                                    </div>

                                                    {/* Image count */}
                                                    {imgs.length > 1 && (
                                                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">
                                                            <span className="text-[9px] font-bold text-white/60">📷 {imgs.length}</span>
                                                        </div>
                                                    )}

                                                    {/* Korea source tag */}
                                                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-lg">
                                                        <span className="text-[9px] font-black text-white/50">🇰🇷 Encar</span>
                                                    </div>

                                                    {/* Gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f1d] via-transparent to-transparent opacity-60" />
                                                </div>

                                                <div className="p-4 flex flex-col flex-1 gap-3">
                                                    {/* Title */}
                                                    <h3 className="font-bold text-sm text-white line-clamp-1">
                                                        {isRTL ? (auction.titleAr || auction.title) : (auction.titleEn || auction.title) || 'سيارة كورية'}
                                                    </h3>

                                                    {/* Specs chips */}
                                                    {(year || mileage || fuel) && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {year && <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-white/50">{year}</span>}
                                                            {mileage && <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-white/50">{Number(mileage).toLocaleString()} كم</span>}
                                                            {fuel && <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-white/50">{fuel}</span>}
                                                        </div>
                                                    )}

                                                    {/* Prices */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 rounded-xl bg-orange-500/5 border border-orange-500/15">
                                                            <p className="text-[8px] text-orange-400/60 uppercase">SAR 🇸🇦</p>
                                                            <p className="text-xs font-black text-orange-400">{priceSar > 0 ? `${priceSar.toLocaleString()} ر.س` : '—'}</p>
                                                        </div>
                                                        <div className="p-2 rounded-xl bg-white/3 border border-white/8">
                                                            <p className="text-[8px] text-white/30 uppercase">KRW 🇰🇷</p>
                                                            <p className="text-xs font-bold text-white/50">{priceKrw > 0 ? `₩${priceKrw.toLocaleString()}` : '—'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pt-1 mt-auto border-t border-white/5">
                                                        {!isRunning ? (
                                                            <button
                                                                onClick={() => handleActivateImportedAuction(auction._id)}
                                                                disabled={isActivating}
                                                                className="flex-1 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                                                            >
                                                                {isActivating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                <span>{isRTL ? 'تفعيل وعرض للعملاء' : 'Activate Now'}</span>
                                                            </button>
                                                        ) : (
                                                            <span className="flex-1 text-center py-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                                                {isRTL ? '✓ مفعل ومتاح للعملاء' : '✓ Live for Buyers'}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteAuction(auction._id, auction.title)}
                                                            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                                                            title={isRTL ? 'حذف' : 'Delete'}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>

                    {/* Sección 2: جلسات البث المباشر */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Radio className="w-5 h-5 text-orange-500" />
                                <span>{isRTL ? 'جلسات البث المباشر والبوابات الكورية' : 'Live Stream Sessions'}</span>
                            </h2>
                        </div>

                        {safeSessions.length === 0 ? (
                            <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
                                {isRTL ? 'لا توجد جلسات بث مباشر مضافة. اضغط "إنشاء جلسة بث/مزاد" لإضافة بث جديد.' : 'No live streams found.'}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {safeSessions.map((session) => {
                                    const isLive = session?.status === 'live';
                                    const isSyncing = syncingId === session?._id;

                                    return (
                                        <div
                                            key={session._id || Math.random()}
                                            className="p-4 rounded-2xl bg-[#0e0f1d] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
                                                    isLive ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-white/40"
                                                )}>
                                                    <Radio className={cn("w-6 h-6", isLive && "animate-pulse")} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-sm text-white">{session.title || 'بث مباشر'}</h3>
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                            isLive ? "bg-red-500/20 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/40"
                                                        )}>
                                                            {isLive ? (isRTL ? 'مباشر الآن' : 'LIVE') : (isRTL ? 'متوقف' : 'PAUSED')}
                                                        </span>
                                                    </div>
                                                    {session.externalUrl && (
                                                        <a
                                                            href={session.externalUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-orange-400/80 hover:underline flex items-center gap-1 mt-1"
                                                        >
                                                            <span>{session.externalUrl}</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-center">
                                                <button
                                                    onClick={() => handleSyncSession(session._id, session.externalUrl)}
                                                    disabled={isSyncing}
                                                    className="px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-colors flex items-center gap-1.5"
                                                >
                                                    <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                                                    <span>{isRTL ? 'استيراد سيارات البث' : 'Scrape Cars'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleToggleSessionState(session._id, session.status)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5",
                                                        isLive
                                                            ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                                                            : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                                                    )}
                                                >
                                                    {isLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                    <span>{isLive ? (isRTL ? 'إيقاف البث' : 'End Stream') : (isRTL ? 'بدء البث الآن' : 'Start Stream')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 2: Instant Classic Auctions ── */}
            {activeTab === 'classic' && (
                <div className="space-y-6">
                    {/* Sub Filter */}
                    <div className="flex items-center gap-2">
                        {['running', 'scheduled', 'ended'].map((statusKey) => (
                            <button
                                key={statusKey}
                                onClick={() => setAuctionStatusFilter(statusKey)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                                    auctionStatusFilter === statusKey
                                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                                        : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                                )}
                            >
                                {statusKey === 'running' ? (isRTL ? 'نشطة الآن' : 'Running') : statusKey === 'scheduled' ? (isRTL ? 'جدولة مستقبلاً' : 'Scheduled') : (isRTL ? 'منتهية' : 'Ended')}
                            </button>
                        ))}
                    </div>

                    {safeClassic.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/10 text-white/40 text-xs">
                            {isRTL ? 'لا توجد مزادات في هذه الفئة حالياً. اضغط "إضافة مزاد جديد" للبدء.' : 'No auctions found.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {safeClassic.map((auc) => {
                                const mainImg = auc?.images?.[0] || auc?.carId?.images?.[0] || '';
                                return (
                                    <div key={auc._id || Math.random()} className="rounded-2xl bg-[#0e0f1d] border border-white/10 p-4 space-y-3">
                                        <div className="relative h-40 rounded-xl overflow-hidden bg-black/40">
                                            {mainImg ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={mainImg} alt={auc.title || 'Car'} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <Car className="w-10 h-10" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-sm text-white line-clamp-1">{auc.title || 'مزاد سيارة'}</h3>
                                        <div className="flex justify-between text-xs text-white/60 font-mono">
                                            <span>{isRTL ? 'أعلى مزايدة:' : 'Current Bid:'}</span>
                                            <span className="text-orange-400 font-bold">{(auc.currentBid || auc.startingPrice || 0).toLocaleString()} ر.س</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                            <span className="text-[10px] text-white/40 font-mono">{auc.bidsCount || 0} مزايدة</span>
                                            <button
                                                onClick={() => handleDeleteAuction(auc._id, auc.title)}
                                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal: Session Creation ── */}
            <AnimatePresence>
                {isSessionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg rounded-2xl bg-[#0e0f1d] border border-orange-500/30 p-6 space-y-4 shadow-[0_0_50px_rgba(249,115,22,0.2)]"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="font-bold text-white text-base">
                                    {isRTL ? 'إضافة/تعديل جلسة بث ومزاد' : 'Add/Edit Live Session'}
                                </h3>
                                <button onClick={() => setIsSessionModalOpen(false)} className="text-white/40 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 mb-1">{isRTL ? 'عنوان الجلسة' : 'Title'}</label>
                                    <input
                                        type="text"
                                        value={sessionForm.title}
                                        onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                                        placeholder={isRTL ? 'مثال: مزاد كوريا المباشر - السيارات الفاخرة' : 'e.g. Korea Auction Live'}
                                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-orange-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 mb-1">{isRTL ? 'رابط الموقع الخارجي للبث/المزاد' : 'External Stream URL'}</label>
                                    <input
                                        type="text"
                                        value={sessionForm.externalUrl}
                                        onChange={(e) => setSessionForm({ ...sessionForm, externalUrl: e.target.value })}
                                        placeholder="https://desert-korea-auto.com/cars/?car_type=auction"
                                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-orange-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    onClick={() => setIsSessionModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSaveSession}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400"
                                >
                                    {isRTL ? 'حفظ الجلسة' : 'Save Session'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Modal: Classic Auction Creation ── */}
            <AnimatePresence>
                {isAuctionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg rounded-2xl bg-[#0e0f1d] border border-orange-500/30 p-6 space-y-4 shadow-[0_0_50px_rgba(249,115,22,0.2)]"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="font-bold text-white text-base">
                                    {isRTL ? 'إطلاق مزاد جديد على سيارة' : 'Create New Car Auction'}
                                </h3>
                                <button onClick={() => setIsAuctionModalOpen(false)} className="text-white/40 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 mb-1">{isRTL ? 'اختر السيارة' : 'Select Car'}</label>
                                    <select
                                        value={auctionForm.carId}
                                        onChange={(e) => setAuctionForm({ ...auctionForm, carId: e.target.value })}
                                        className="w-full p-2.5 rounded-xl bg-[#141527] border border-white/10 text-xs text-white focus:border-orange-500 outline-none"
                                    >
                                        <option value="">{isRTL ? '-- حدد سيارة من المخزون --' : '-- Select Car --'}</option>
                                        {availableCars.map(car => (
                                            <option key={car._id} value={car._id}>{car.title} ({car.year})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 mb-1">{isRTL ? 'السعر الابتدائي (ر.س)' : 'Starting Price (SAR)'}</label>
                                    <input
                                        type="number"
                                        value={auctionForm.startingPrice}
                                        onChange={(e) => setAuctionForm({ ...auctionForm, startingPrice: e.target.value })}
                                        placeholder="50000"
                                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-orange-500 outline-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                <button
                                    onClick={() => setIsAuctionModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleCreateClassicAuction}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400"
                                >
                                    {isRTL ? 'إطلاق المزاد' : 'Start Auction'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminPageShell>
    );
}

export default function MasterAuctionsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-orange-500/40 border-t-orange-500 rounded-full animate-spin" />
            </div>
        }>
            <MasterAuctionsContent />
        </Suspense>
    );
}
