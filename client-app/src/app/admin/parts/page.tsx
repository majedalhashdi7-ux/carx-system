'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    Package,
    Edit,
    Trash2,
    Search,
    X,
    Upload,
    Save,
    CheckCircle2,
    RefreshCcw,
    RefreshCw,
    Eye,
    EyeOff,
    Settings,
    TrendingUp,
    DollarSign,
    ChevronDown,
    ChevronRight,
    Building2,
    Layers,
    ArrowLeft,
    ArrowRight,
    Globe
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InlineImportModal from "@/components/admin/InlineImportModal";
import QuickImportBar from "@/components/admin/QuickImportBar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useToast } from "@/lib/ToastContext";

// Removed CATEGORIES and CAT_LABELS_AR as per user request to simplify the UI

interface Part {
    _id: string;
    id?: string;
    name: string;
    nameEn?: string;
    brand: string | { _id: string; name: string; logoUrl?: string };
    carModel?: string;
    model?: string;
    year?: number;
    price: number;
    category?: string;
    partType?: string;
    condition?: string;
    inStock: boolean;
    isSold?: boolean;
    soldCount?: number;
    images?: string[];
    img?: string;
    count?: number;
}

export default function AdminPartsPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped'); // [[ARABIC_COMMENT]] وضع العرض: مجموع بالوكالات أو عرض مسطح
    const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [totalPartsCount, setTotalPartsCount] = useState(0); // [[ARABIC_COMMENT]] عداد إجمالي القطع المستوردة
    const [formData, setFormData] = useState({
        name: '',
        brand: 'TOYOTA',
        model: '',
        year: new Date().getFullYear(),
        price: 0,
        category: 'Engine',
        images: [''],
        description: '',
        condition: 'New',
        stockQty: 1
    });
    const [showImportModal, setShowImportModal] = useState(false);

    const [showSettings, setShowSettings] = useState(false);
    const [currencySettings, setCurrencySettings] = useState({ usdToSar: 3.75, usdToKrw: 1350, partsMultiplier: 1.15 });
    const [savingCurrency, setSavingCurrency] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsRes = await api.settings.getPublic();
                if (settingsRes.success && settingsRes.data?.currencySettings) {
                    setCurrencySettings(prev => ({ ...prev, ...settingsRes.data.currencySettings }));
                }
            } catch {}
        };
        loadSettings();
    }, []);

    const handleSaveCurrency = async () => {
        setSavingCurrency(true);
        try {
            await api.settings.updateCurrencySettings({ currencySettings: currencySettings as any });
            showToast(isRTL ? '✅ تم حفظ إعدادات التسعير' : '✅ Pricing settings saved', 'success');
        } catch {
            showToast(isRTL ? '❌ فشل حفظ الإعدادات' : '❌ Save failed', 'error');
        } finally {
            setSavingCurrency(false);
        }
    };

    const loadParts = useCallback(async () => {
        try {
            setLoading(true);
            // [[ARABIC_COMMENT]] نجلب دائماً الكل بدون فلتر category لنتحكم بالفلتر في الـ frontend
            // لأن البيانات المستوردة قد تكون partType='General' وليس Engine/Brakes
            const params: any = { limit: 1000, adminView: 'true' };
            if (searchTerm) params.q = searchTerm;

            const response = await api.parts.list(params);
            if (response.success) {
                const allParts = response.parts || [];
                setTotalPartsCount(allParts.length);

                setParts(allParts);
            }
        } catch (err) {
            console.error('Failed to load parts', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        loadParts();
    }, [loadParts]);

    // [[ARABIC_COMMENT]] تجميع القطع حسب الوكالة
    const partsByBrand = parts.reduce((acc: Record<string, any[]>, part) => {
        const brandKey = String(part.brand || 'غير محدد').trim();
        if (!acc[brandKey]) acc[brandKey] = [];
        acc[brandKey].push(part);
        return acc;
    }, {});

    const toggleBrand = (brand: string) => {
        setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            // [[FIX]] تنقية الصور: حذف الروابط الفارغة قبل الحفظ لمنع محو الصور الأصلية
            const cleanImages = (formData.images || []).filter((img: string) => img.trim() !== '');
            const submitData = { ...formData, images: cleanImages.length > 0 ? cleanImages : formData.images };

            if (editingPart) {
                await api.parts.update(editingPart._id, submitData);
            } else {
                await api.parts.create(submitData);
            }
            setShowModal(false);
            resetForm();
            await loadParts();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved successfully!', 'success');
        } catch (err) {
            console.error('Failed to save part', err);
            showToast(isRTL ? '❌ فشل في حفظ البيانات' : '❌ Failed to save data', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه القطعة نهائياً؟' : 'Delete this part permanently?')) return;
        
        // [[FIX]] تحديث فوري للواجهة قبل انتظار السيرفر (Optimistic Update)
        setParts(prev => prev.filter(p => p._id !== id && p.id !== id));
        setTotalPartsCount(prev => Math.max(0, prev - 1));

        try {
            await api.parts.delete(id);
            showToast(isRTL ? '🗑️ تم حذف القطعة بنجاح' : '🗑️ Part deleted successfully', 'success');
        } catch (err) {
            console.error('Failed to delete part', err);
            showToast(isRTL ? '❌ فشل في الحذف، جاري استعادة البيانات' : '❌ Delete failed, reloading...', 'error');
            // استعادة البيانات إذا فشل الحذف
            await loadParts();
        }
    };

    const handleMarkSold = async (id: string, name: string, currentTotalSold: number) => {
        const confirmed = confirm(isRTL
            ? `تأكيد تسجيل بيع لـ: ${name}؟\nإجمالي المبيعات الحالي: ${currentTotalSold}`
            : `Confirm sale for: ${name}?\nCurrent total sold: ${currentTotalSold}`
        );
        if (!confirmed) return;

        const soldQtyStr = prompt(isRTL ? `كم قطعة تم بيعها؟` : `How many units sold?`, '1');
        const soldQty = soldQtyStr ? parseInt(soldQtyStr) : 1;

        try {
            const res = await fetch(`/api/v2/parts/${id}/sold`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hm_token')}` },
                body: JSON.stringify({ soldQty }),
            });
            await res.json();
            loadParts();
            showToast(isRTL ? '✅ تم تسجيل البيع بنجاح!' : '✅ Sale recorded successfully!', 'success');
        } catch (err) {
            console.error('Failed to mark part as sold', err);
            showToast(isRTL ? '❌ فشل في تسجيل البيع' : '❌ Failed to record sale', 'error');
        }
    };

    const handleToggleVisibility = async (id: string) => {
        // [[FIX]] تحديث فوري للواجهة بالـ _id أو id لمطابقة MongoDB
        setParts(prev => prev.map(p => {
            if (p._id === id || p.id === id) {
                return { ...p, inStock: !p.inStock };
            }
            return p;
        }));

        try {
            const res = await api.parts.toggleStock(id);
            if (res.success) {
                showToast(res.message || (isRTL ? '✅ تم تغيير حالة الظهور' : '✅ Visibility updated'), 'success');
                // تأكيد بالقيمة الفعلية من السيرفر
                setParts(prev => prev.map(p => {
                    if (p._id === id || p.id === id) {
                        return { ...p, inStock: res.data?.inStock ?? p.inStock };
                    }
                    return p;
                }));
            } else {
                // إذا فشل، نعيد الحالة الأصلية
                setParts(prev => prev.map(p => {
                    if (p._id === id || p.id === id) {
                        return { ...p, inStock: !p.inStock };
                    }
                    return p;
                }));
            }
        } catch (err) {
            console.error('Failed to toggle visibility', err);
            showToast(isRTL ? '❌ فشل تغيير حالة الظهور' : '❌ Failed to toggle visibility', 'error');
            // إعادة الحالة إذا فشل الطلب
            setParts(prev => prev.map(p => {
                if (p._id === id || p.id === id) {
                    return { ...p, inStock: !p.inStock };
                }
                return p;
            }));
        }
    };

    const handleEdit = (part: any) => {
        setEditingPart(part);
        setFormData({
            name: part.name,
            brand: part.brand,
            model: part.model || '',
            year: part.year || new Date().getFullYear(),
            price: part.price,
            category: part.category || 'Engine',
            images: part.images || (part.img ? [part.img] : ['']),
            description: part.description || '',
            condition: part.condition || 'New',
            stockQty: part.stockQty || 1
        });
        setShowModal(true);
    };

    // استيراد تلقائي من AutoSpare بدون سعر + Cooldown دقيقتان
    const AS_COOLDOWN_MS = 120_000;
    const AS_LS_KEY = 'hm_autospare_last_import';
    const [asCooldown, setAsCooldown] = useState(0);
    const asCooldownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const last = parseInt(localStorage.getItem(AS_LS_KEY) || '0', 10);
        const elapsed = Date.now() - last;
        if (elapsed < AS_COOLDOWN_MS) {
            const remaining = Math.ceil((AS_COOLDOWN_MS - elapsed) / 1000);
            setAsCooldown(remaining);
            asCooldownRef.current = setInterval(() => {
                setAsCooldown(prev => {
                    if (prev <= 1) { clearInterval(asCooldownRef.current!); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (asCooldownRef.current) clearInterval(asCooldownRef.current); };
    }, []);

    const handleScrape = useCallback(async () => {
        if (scraping || asCooldown > 0) return;
        setScraping(true);
        try {
            showToast(isRTL ? '⏳ جاري استيراد الوكالات والقطع من AutoSpare...' : '⏳ Importing brands & parts from AutoSpare...', 'info');
            const res = await (api.import as any).autospare();
            if (res?.success) {
                const brands = res.brandsImported ?? res.data?.brandsImported ?? 0;
                const partsCount = res.partsImported ?? res.totalImported ?? res.data?.partsImported ?? 0;
                showToast(
                    isRTL
                        ? `✅ تم استيراد ${brands} وكالة و ${partsCount} قطعة`
                        : `✅ Imported ${brands} brands and ${partsCount} parts`,
                    'success'
                );
                localStorage.setItem(AS_LS_KEY, String(Date.now()));
                setAsCooldown(Math.ceil(AS_COOLDOWN_MS / 1000));
                asCooldownRef.current = setInterval(() => {
                    setAsCooldown(prev => {
                        if (prev <= 1) { clearInterval(asCooldownRef.current!); return 0; }
                        return prev - 1;
                    });
                }, 1000);
                loadParts();
            } else {
                showToast(res?.error || (isRTL ? '❌ فشل الاستيراد' : '❌ Import failed'), 'error');
            }
        } catch (err: any) {
            showToast(err.message || '❌ خطأ', 'error');
        } finally {
            setScraping(false);
        }
    }, [scraping, asCooldown, isRTL, showToast, loadParts]);

    const resetForm = () => {
        setFormData({
            name: '',
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            price: 0,
            category: 'Engine',
            images: [''],
            description: '',
            condition: 'New',
            stockQty: 1
        });
        setEditingPart(null);
    };

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

            <main className="relative z-10 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* HUD Header */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb flex items-center gap-2">
                        <button 
                            onClick={() => router.back()} 
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/20 hover:text-orange-400 transition-all text-white/50"
                            title={isRTL ? 'رجوع' : 'Back'}
                        >
                            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </button>
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'قطع الغيار' : 'SPARE PARTS'}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">PARTS INVENTORY CONTROL</p>
                            <h1 className="ck-page-title">{isRTL ? 'قطع الغيار' : 'PARTS CTRL'}</h1>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={() => setShowSettings(!showSettings)}
                                className={cn(
                                    "ck-btn-ghost flex items-center gap-2 transition-all",
                                    showSettings ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "text-white/50 border-white/10"
                                )}>
                                <Settings className="w-4 h-4" />
                                {isRTL ? 'إعدادات التسعير' : 'PRICING SETTINGS'}
                            </motion.button>
                        <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                onClick={handleScrape}
                                disabled={scraping || asCooldown > 0}
                                className="ck-btn-primary bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 border-none disabled:opacity-40 disabled:cursor-not-allowed">
                                {scraping
                                    ? <><RefreshCw className="w-4 h-4 animate-spin" />{isRTL ? 'جاري الاستيراد...' : 'IMPORTING...'}</>
                                    : asCooldown > 0
                                    ? <><Globe className="w-4 h-4" />{isRTL ? `انتظر ${asCooldown}ث` : `Wait ${asCooldown}s`}</>
                                    : <><Globe className="w-4 h-4" />{isRTL ? '🔄 استيراد AutoSpare تلقائياً' : '🔄 AUTO IMPORT PARTS'}</>
                                }
                            </motion.button>
                        </div>
                    </div>

                    {/* [[ARABIC_COMMENT]] عداد إجمالي القطع المستوردة */}
                    <div className="flex items-center gap-6 mt-4 flex-wrap">
                        <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-3">
                            <Package className="w-5 h-5 text-orange-400" />
                            <div>
                                <p className="cockpit-mono text-[9px] text-orange-500/60 uppercase tracking-widest">{isRTL ? 'إجمالي القطع المستوردة' : 'TOTAL IMPORTED PARTS'}</p>
                                <p className="cockpit-num text-2xl font-black text-orange-400">{loading ? '...' : totalPartsCount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-5 py-3">
                            <Building2 className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="cockpit-mono text-[9px] text-blue-500/60 uppercase tracking-widest">{isRTL ? 'عدد الوكالات' : 'AGENCIES'}</p>
                                <p className="cockpit-num text-2xl font-black text-blue-400">{loading ? '...' : Object.keys(partsByBrand).length}</p>
                            </div>
                        </div>
                    </div>

                    {/* إعدادات التسعير */}
                    <AnimatePresence>
                        {showSettings && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-6"
                            >
                                <div className="ck-card p-8 border-orange-500/20 bg-orange-500/5">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest">{isRTL ? 'معاملات تسعير قطع الغيار' : 'PARTS PRICING MATRIX'}</h3>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">FINANCIAL SETTINGS</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'الدولار إلى الريال' : 'USD TO SAR'}</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input type="number" step="0.01" aria-label="USD to SAR" value={currencySettings.usdToSar} onChange={(e) => setCurrencySettings({ ...currencySettings, usdToSar: parseFloat(e.target.value) })} className="ck-input pl-10" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'الدولار إلى الون' : 'USD TO KRW'}</label>
                                            <div className="relative">
                                                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                                <input type="number" step="1" aria-label="USD to KRW" value={currencySettings.usdToKrw} onChange={(e) => setCurrencySettings({ ...currencySettings, usdToKrw: parseInt(e.target.value) })} className="ck-input pl-10" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'مُعامل ربح القطع (x)' : 'PARTS MULTIPLIER (x)'}</label>
                                            <div className="relative">
                                                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
                                                <input type="number" step="0.01" aria-label="Parts multiplier" value={currencySettings.partsMultiplier} onChange={(e) => setCurrencySettings({ ...currencySettings, partsMultiplier: parseFloat(e.target.value) })} className="ck-input pl-10 border-orange-500/30 focus:border-orange-400 bg-orange-500/10" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleSaveCurrency} disabled={savingCurrency} className="ck-btn-primary min-w-[200px]">
                                            {savingCurrency ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ إعدادات التسعير' : 'SAVE PRICING SETTINGS')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <QuickImportBar
                    type="part"
                    onSuccess={loadParts}
                    className="mb-6"
                />

                {/* Filters + Search + View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/30', isRTL ? 'right-4' : 'left-4')} />
                        <input type="text" placeholder={isRTL ? 'بحث في المخزون...' : 'SEARCH PARTS...'}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={cn('ck-input', isRTL ? 'pr-11' : 'pl-11')} />
                    </div>
                    {/* Category filters removed based on user request */}
                    {/* [[ARABIC_COMMENT]] زر تبديل وضع العرض: مجموع بالوكالات أو قائمة مسطحة */}
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('grouped')}
                            className={cn('ck-tab flex items-center gap-1.5', viewMode === 'grouped' && 'ck-tab-active')}>
                            <Building2 className="w-3.5 h-3.5" />
                            {isRTL ? 'الوكالات' : 'BY AGENCY'}
                        </button>
                        <button onClick={() => setViewMode('flat')}
                            className={cn('ck-tab flex items-center gap-1.5', viewMode === 'flat' && 'ck-tab-active')}>
                            <Layers className="w-3.5 h-3.5" />
                            {isRTL ? 'الكل' : 'ALL PARTS'}
                        </button>
                    </div>
                </div>

                {/* Parts Display */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-64 rounded-3xl bg-white/[0.02] animate-pulse border border-orange-500/10" />)}
                    </div>
                ) : parts.length === 0 ? (
                    <div className="ck-empty">
                        <div className="ck-empty-icon"><Package className="w-8 h-8" /></div>
                        <p className="cockpit-mono">{isRTL ? 'لا توجد قطع في المخزون' : 'PARTS INVENTORY EMPTY'}</p>
                        <button onClick={() => setSearchTerm('')} className="ck-btn-ghost mt-4 text-orange-400">
                            {isRTL ? 'إعادة ضبط البحث' : 'RESET SEARCH'}
                        </button>
                    </div>
                ) : viewMode === 'grouped' ? (
                    // [[ARABIC_COMMENT]] وضع العرض المجموع بالوكالات
                    <div className="space-y-6">
                        {Object.entries(partsByBrand).sort(([a], [b]) => a.localeCompare(b)).map(([brand, brandParts]) => (
                            <motion.div
                                key={brand}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="ck-card overflow-hidden"
                            >
                                {/* Agency Header */}
                                <button
                                    onClick={() => toggleBrand(brand)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-orange-500/5 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center overflow-hidden">
                                            {brandParts[0]?.brandLogo || getBrandLogo(brand) ? (
                                                <Image 
                                                    src={brandParts[0]?.brandLogo || getBrandLogo(brand)!} 
                                                    alt={brand} 
                                                    fill 
                                                    className="object-contain p-1" 
                                                />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-orange-400" />
                                            )}
                                        </div>
                                        <div className="text-start">
                                            <h3 className="font-black uppercase tracking-widest text-white">{brand}</h3>
                                            <p className="cockpit-mono text-[9px] text-orange-500/60 uppercase">
                                                {brandParts.length} {isRTL ? 'قطعة' : 'PARTS'}
                                            </p>
                                        </div>
                                    </div>
                                    {expandedBrands[brand]
                                        ? <ChevronDown className="w-5 h-5 text-orange-400" />
                                        : <ChevronRight className="w-5 h-5 text-white/30" />
                                    }
                                </button>

                                {/* Parts Grid for this agency */}
                                <AnimatePresence>
                                    {expandedBrands[brand] && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 pt-0 border-t border-white/5">
                                                {brandParts.map((part, i) => (
                                                    <PartCard
                                                        key={part.id}
                                                        part={part}
                                                        i={i}
                                                        isRTL={isRTL}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        onToggle={handleToggleVisibility}
                                                        onMarkSold={handleMarkSold}
                                                    />
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    // [[ARABIC_COMMENT]] وضع العرض المسطح - كل القطع دفعة واحدة
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {parts.map((part, i) => (
                            <PartCard
                                key={part.id}
                                part={part}
                                i={i}
                                isRTL={isRTL}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggle={handleToggleVisibility}
                                onMarkSold={handleMarkSold}
                            />
                        ))}
                    </div>
                )}

            </main>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="ck-modal-backdrop" onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            className="ck-modal ck-scroll p-7 max-w-2xl w-full"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-500/10">
                                <div>
                                    <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em] mb-1">PARTS CONTROL</p>
                                    <h2 className="ck-page-title text-2xl">
                                        {editingPart ? (isRTL ? '✏️ تعديل قطعة' : 'EDIT PART') : (isRTL ? '+ إضافة قطعة' : 'NEW PART')}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} aria-label="Close" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/40 transition-all flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'صور القطعة' : 'PART IMAGES'}</label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square ck-card overflow-hidden group">
                                                    {img ? (
                                                        <>
                                                            <Image src={img} alt="Part" fill sizes="100px" quality={50} className="object-cover" />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = [...formData.images];
                                                                    newImages.splice(idx, 1);
                                                                    if (newImages.length === 0) newImages.push('');
                                                                    setFormData({ ...formData, images: newImages });
                                                                }}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3 text-white" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-orange-500/20">
                                                            <Upload className="w-5 h-5 mb-1" />
                                                            <span className="text-[8px] font-bold">UPLOAD</span>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    const data = new FormData();
                                                                    data.append('image', file);
                                                                    try {
                                                                        const res = await (api as any).upload.image(data);
                                                                        if (res.success) {
                                                                            const newImages = [...formData.images];
                                                                            newImages[idx] = res.url;
                                                                            if (newImages.length < 8) newImages.push('');
                                                                            setFormData({ ...formData, images: newImages });
                                                                        }
                                                                    } catch (err) {
                                                                        showToast(isRTL ? '❌ فشل الرفع' : '❌ Upload failed', 'error');
                                                                    }
                                                                }} 
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="cockpit-mono text-[8px] text-white/20 mt-2 uppercase tracking-widest">{isRTL ? 'يمكنك إضافة حتى 8 صور' : 'UP TO 8 IMAGES ALLOWED'}</p>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'اسم القطعة' : 'PART NAME'}</label>
                                        <input type="text" required aria-label="Part name" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="ck-input" />
                                    </div>

                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الوكالة' : 'BRAND'}</label>
                                        <select aria-label="Brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="ck-select">
                                            <option value="">{isRTL ? 'اختر الوكالة' : 'Select Brand'}</option>
                                            {['TOYOTA', 'KIA', 'HYUNDAI', 'FORD', 'NISSAN', 'MERCEDES', 'BMW', 'LEXUS', 'AUDI', 'HONDA', 'CHEVROLET', 'VOLKSWAGEN', 'ISUZU', 'PROTON'].map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'موديل السيارة' : 'CAR MODEL'}</label>
                                        <input type="text" required aria-label="Car model" placeholder={isRTL ? 'كامري' : 'Camry'} value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value.toUpperCase() })} className="ck-input" />
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'السعر (ر.س)' : 'PRICE (SAR)'}</label>
                                        <input type="number" required aria-label="Price (SAR)" value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="ck-input" />
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الفئة' : 'CATEGORY'}</label>
                                        <select aria-label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="ck-select">
                                            {['Engine', 'Brakes', 'Suspension', 'Filters', 'Electrical', 'Body', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الحالة' : 'CONDITION'}</label>
                                        <select aria-label="Condition" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="ck-select">
                                            <option value="New">{isRTL ? 'جديد' : 'New'}</option>
                                            <option value="Used">{isRTL ? 'مستعمل' : 'Used'}</option>
                                            <option value="Refurbished">{isRTL ? 'مجدد' : 'Refurbished'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الكمية' : 'QTY IN STOCK'}</label>
                                        <input type="number" required min="1" aria-label="Quantity in stock" value={formData.stockQty}
                                            onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) })} className="ck-input" />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="ck-btn-ghost flex-1">{isRTL ? 'إلغاء' : 'CANCEL'}</button>
                                    <button type="submit" disabled={submitting}
                                        className={cn('ck-btn-primary flex-1 flex items-center justify-center gap-2', submitting && 'opacity-50 cursor-not-allowed')}>
                                        {submitting ? <div className="ck-radar w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {submitting ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ القطعة' : 'SAVE PART')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <InlineImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                type="part"
                onSuccess={loadParts}
            />
        </div>
    );
}

// [[ARABIC_COMMENT]] خريطة شعارات الوكالات
const getBrandLogo = (brand: string) => {
    const domainMap: Record<string, string> = {
        'TOYOTA': 'toyota.com', 'KIA': 'kia.com', 'HYUNDAI': 'hyundai.com', 'FORD': 'ford.com',
        'NISSAN': 'nissanusa.com', 'MERCEDES': 'mercedes-benz.com', 'BMW': 'bmw.com',
        'LEXUS': 'lexus.com', 'AUDI': 'audi.com', 'HONDA': 'honda.com', 'CHEVROLET': 'chevrolet.com',
        'VOLKSWAGEN': 'vw.com', 'ISUZU': 'isuzu.com', 'PROTON': 'proton.com'
    };
    const b = String(brand).toUpperCase().trim();
    // Some external parts APIs provide the correct brand name. Use Clearbit if we know the domain.
    return domainMap[b] ? `https://logo.clearbit.com/${domainMap[b]}` : null;
};

// [[ARABIC_COMMENT]] دالة مساعدة: إرجاع رابط الصورة عبر proxy إذا كانت خارجية
function resolvePartImage(url?: string): string {
    const defaultImage = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop';
    if (!url || typeof url !== 'string' || !url.trim()) return defaultImage;
    const trimmed = url.trim();
    // مسارات محلية — أعدها مباشرة
    if (trimmed.startsWith('/uploads') || trimmed.startsWith('/images')) return trimmed;
    // إذا كانت الصورة بالفعل عبر proxy — أعدها مباشرة
    if (trimmed.includes('image-proxy')) return trimmed;
    // صور Unsplash / Cloudinary تعمل بشكل مباشر
    if (trimmed.includes('unsplash.com') || trimmed.includes('cloudinary.com')) return trimmed;
    // أي صورة خارجية أخرى — مررها عبر image-proxy لضمان الظهور الصحيح
    if (trimmed.startsWith('http')) {
        return `/api/v2/image-proxy?url=${encodeURIComponent(trimmed)}`;
    }
    return defaultImage;
}

// [[ARABIC_COMMENT]] مكون بطاقة القطعة المنفصل لإعادة الاستخدام
function PartCard({ part, i, isRTL, onEdit, onDelete, onToggle, onMarkSold }: {
    part: Part;
    i: number;
    isRTL: boolean;
    onEdit: (p: Part) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string) => void;
    onMarkSold: (id: string, name: string, count: number) => void;
}) {
    const defaultImage = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop';
    // [[FIX]] استخدم resolvePartImage لتوجيه الصور الخارجية عبر proxy
    const rawImg = part.img || part.images?.[0];
    const initialImg = resolvePartImage(rawImg);
    const [imgSrc, setImgSrc] = useState(initialImg);

    return (
        <motion.div key={part.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="ck-card overflow-hidden group ck-hover-lift">

            <div className="relative h-44 overflow-hidden bg-black/40">
                <Image
                    src={imgSrc}
                    alt={part.name} fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    quality={70} priority={i < 4}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    unoptimized
                    referrerPolicy="no-referrer"
                    onError={() => { if (imgSrc !== defaultImage) setImgSrc(defaultImage); }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-transparent to-transparent" />
                <div className="absolute top-2 end-2">
                    <span className={cn('ck-badge', part.condition === 'New' || part.condition === 'NEW' ? 'ck-badge-active' : part.condition === 'Used' || part.condition === 'USED' ? 'ck-badge-pending' : 'ck-badge-info')}>
                        {isRTL ? { New: 'جديد', NEW: 'جديد', Used: 'مستعمل', USED: 'مستعمل', Refurbished: 'مجدد', REFURBISHED: 'مجدد' }[part.condition as string] || part.condition : part.condition}
                    </span>
                </div>
                <div className="absolute bottom-2 start-2">
                    <span className="cockpit-mono text-[9px] bg-black/60 px-2 py-0.5 rounded-full text-green-400/80">
                        {isRTL ? `المباع: ${part.soldCount || 0}` : `SOLD: ${part.soldCount || 0}`}
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div>
                    <p className="cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.2em] mb-0.5">{typeof part.brand === 'object' ? part.brand.name : part.brand} · {part.model}</p>
                    <h3 className="text-sm font-bold text-white truncate">{part.name}</h3>
                    <p className="cockpit-mono text-[9px] text-white/30 uppercase mt-0.5">{part.category || part.partType || '—'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                        <p className="cockpit-mono text-[8px] text-white/25 uppercase">SAR</p>
                        <p className="cockpit-num text-lg font-black text-orange-400">{Number(part.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => onEdit(part)} title={isRTL ? 'تعديل' : 'Edit'}
                            className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onToggle(part.id || '')} title={part.inStock ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                            className={cn("w-8 h-8 rounded-xl border flex items-center justify-center transition-all",
                                part.inStock
                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white"
                                    : "bg-white/5 border-white/10 text-white/30 hover:bg-white/20 hover:text-white"
                            )}>
                            {part.inStock ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => onMarkSold(part.id || '', part.name || '', part.soldCount || 0)} title={isRTL ? 'تسجيل بيع' : 'Mark Sold'}
                            className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(part.id || '')} title={isRTL ? 'حذف' : 'Delete'}
                            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
