'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Globe, RefreshCw, Car, Gavel, Package,
    CheckCircle2, History, ShieldCheck, Zap, ExternalLink,
    AlertCircle, Link2, Trash2, Bookmark, Copy, Plus, Minus,
    Sparkles, Image as ImageIcon, X
} from "lucide-react";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";
import NextLink from "next/link";

type ActiveTab = "cars" | "parts" | "auctions";

interface SavedLink {
    id: string;
    url: string;
    title?: string;
    lastImportedAt?: string;
    lastCount?: number;
}

export default function AdminImportHub() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>("cars");

    // ── حالات مستقلة لكل بوابة استيراد ────────────────────────────
    const [carsLoading, setCarsLoading] = useState(false);
    const [partsLoading, setPartsLoading] = useState(false);
    const [auctionsLoading, setAuctionsLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);

    const [carsResult, setCarsResult] = useState<any>(null);
    const [partsResult, setPartsResult] = useState<any>(null);
    const [auctionsResult, setAuctionsResult] = useState<any>(null);

    const ENCAR_DIAGNOSIS_URL = "https://car.encar.com/list/car?page=1&search=%7B%22type%22%3A%22car%22%2C%22action%22%3A%22(And.Hidden.N._.CarType.A._.(Or.ServiceMark.EncarDiagnosisP0._.ServiceMark.EncarDiagnosisP1._.ServiceMark.EncarDiagnosisP2.))%22%2C%22title%22%3A%22%22%2C%22toggle%22%3A%7B%7D%2C%22layer%22%3A%22%22%2C%22sort%22%3A%22MobileModifiedDate%22%7D";

    const [carsUrl, setCarsUrl] = useState(ENCAR_DIAGNOSIS_URL);
    const [carsLimit, setCarsLimit] = useState(10);

    const [partsUrl, setPartsUrl] = useState("");

    const [auctionsUrl, setAuctionsUrl] = useState("");
    const [auctionsLimit, setAuctionsLimit] = useState(10);

    const [importLogs, setImportLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    // ── الروابط المحفوظة منفصلة لكل قسم ─────────────────────────────
    const [savedCarsLinks, setSavedCarsLinks] = useState<SavedLink[]>([]);
    const [savedPartsLinks, setSavedPartsLinks] = useState<SavedLink[]>([]);
    const [savedAuctionsLinks, setSavedAuctionsLinks] = useState<SavedLink[]>([]);

    // استعادة الروابط المحفوظة من localStorage لكل قسم
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const cars = localStorage.getItem('hm_saved_cars_links');
                if (cars) setSavedCarsLinks(JSON.parse(cars));
                const savedCarsUrl = localStorage.getItem('hm_cars_import_url');
                if (savedCarsUrl) setCarsUrl(savedCarsUrl);
                else setCarsUrl(ENCAR_DIAGNOSIS_URL);

                const parts = localStorage.getItem('hm_saved_parts_links');
                if (parts) setSavedPartsLinks(JSON.parse(parts));
                const savedPartsUrl = localStorage.getItem('hm_parts_import_url');
                if (savedPartsUrl) setPartsUrl(savedPartsUrl);

                const auctions = localStorage.getItem('hm_saved_auctions_links');
                if (auctions) setSavedAuctionsLinks(JSON.parse(auctions));
                const savedAuctionsUrl = localStorage.getItem('hm_auctions_import_url');
                if (savedAuctionsUrl) setAuctionsUrl(savedAuctionsUrl);
            } catch { }
        }
    }, []);

    // حفظ رابط في قسم محدد
    const saveLinkForSection = (section: ActiveTab, url: string, count?: number) => {
        if (!url || typeof window === 'undefined') return;
        const newEntry: SavedLink = {
            id: Date.now().toString(),
            url,
            title: url.length > 50 ? url.substring(0, 47) + '...' : url,
            lastImportedAt: new Date().toISOString(),
            lastCount: count || 0,
        };

        if (section === 'cars') {
            localStorage.setItem('hm_cars_import_url', url);
            setSavedCarsLinks(prev => {
                const filtered = prev.filter(l => l.url !== url);
                const updated = [newEntry, ...filtered];
                localStorage.setItem('hm_saved_cars_links', JSON.stringify(updated));
                return updated;
            });
        } else if (section === 'parts') {
            localStorage.setItem('hm_parts_import_url', url);
            setSavedPartsLinks(prev => {
                const filtered = prev.filter(l => l.url !== url);
                const updated = [newEntry, ...filtered];
                localStorage.setItem('hm_saved_parts_links', JSON.stringify(updated));
                return updated;
            });
        } else if (section === 'auctions') {
            localStorage.setItem('hm_auctions_import_url', url);
            setSavedAuctionsLinks(prev => {
                const filtered = prev.filter(l => l.url !== url);
                const updated = [newEntry, ...filtered];
                localStorage.setItem('hm_saved_auctions_links', JSON.stringify(updated));
                return updated;
            });
        }
    };

    const deleteSavedLink = (section: ActiveTab, id: string) => {
        if (typeof window === 'undefined') return;
        if (section === 'cars') {
            setSavedCarsLinks(prev => {
                const updated = prev.filter(l => l.id !== id);
                localStorage.setItem('hm_saved_cars_links', JSON.stringify(updated));
                return updated;
            });
        } else if (section === 'parts') {
            setSavedPartsLinks(prev => {
                const updated = prev.filter(l => l.id !== id);
                localStorage.setItem('hm_saved_parts_links', JSON.stringify(updated));
                return updated;
            });
        } else if (section === 'auctions') {
            setSavedAuctionsLinks(prev => {
                const updated = prev.filter(l => l.id !== id);
                localStorage.setItem('hm_saved_auctions_links', JSON.stringify(updated));
                return updated;
            });
        }
    };

    const loadImportLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await api.import.getLogs();
            if (res?.success) setImportLogs(res.logs || []);
        } catch { } finally { setLogsLoading(false); }
    }, []);

    useEffect(() => { loadImportLogs(); }, [loadImportLogs]);

    // ── استيراد سيارات المعرض (مستقل) ─────────────────────────────
    const handleImportCars = async (targetUrl?: string) => {
        const urlToUse = targetUrl || carsUrl;
        if (urlToUse) saveLinkForSection('cars', urlToUse, carsLimit);
        setCarsLoading(true); setCarsResult(null);
        try {
            const res = await api.import.showroom(carsLimit, urlToUse);
            if (res?.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد السيارات بنجاح" : "✅ Cars imported successfully"), "success");
                setCarsResult({ type: "cars", ...res });
                loadImportLogs();
            } else showToast(res?.error || (isRTL ? "❌ فشل الاستيراد" : "❌ Import failed"), "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setCarsLoading(false); }
    };

    // ── استيراد قطع الغيار (مستقل) ─────────────────────────────────
    const handleImportParts = async (targetUrl?: string) => {
        const urlToUse = targetUrl || partsUrl;
        if (urlToUse) saveLinkForSection('parts', urlToUse);
        setPartsLoading(true); setPartsResult(null);
        try {
            const res = await api.import.parts(urlToUse);
            if (res?.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد قطع الغيار" : "✅ Parts imported"), "success");
                setPartsResult({ type: "parts", ...res });
                loadImportLogs();
            } else showToast(res?.error || (isRTL ? "❌ فشل الاستيراد" : "❌ Import failed"), "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setPartsLoading(false); }
    };

    // ── استيراد تلقائي لوكالات وقطع AutoSpare (بدون سعر ← واتساب) ───
    const [autospareLoading, setAutospareLoading] = useState(false);
    const [autospareResult, setAutospareResult] = useState<any>(null);

    const handleImportAutoSpare = useCallback(async () => {
        setAutospareLoading(true); setAutospareResult(null);
        try {
            const res = await (api.import as any).autospare();
            if (res?.success) {
                const brands = res.brandsImported ?? res.data?.brandsImported ?? 0;
                const parts  = res.partsImported  ?? res.data?.partsImported  ?? 0;
                showToast(`✅ تم استيراد ${brands} وكالة و ${parts} قطعة من AutoSpare`, "success");
                setAutospareResult(res);
                loadImportLogs();
            } else showToast(res?.error || "❌ فشل استيراد AutoSpare", "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setAutospareLoading(false); }
    }, [showToast, loadImportLogs]);

    // ── استيراد المزادات المباشرة (مستقل) ──────────────────────────
    const handleImportAuctions = async (targetUrl?: string) => {
        const urlToUse = targetUrl || auctionsUrl;
        if (urlToUse) saveLinkForSection('auctions', urlToUse, auctionsLimit);
        setAuctionsLoading(true); setAuctionsResult(null);
        try {
            const res = await api.import.liveAuctions(auctionsLimit, urlToUse);
            if (res?.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد سيارات جديدة للمزاد بنجاح" : "✅ New auction cars imported"), "success");
                setAuctionsResult({ type: "auctions", ...res });
                loadImportLogs();
            } else showToast(res?.error || (isRTL ? "❌ فشل الاستيراد" : "❌ Import failed"), "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setAuctionsLoading(false); }
    };

    // ── مزامنة جذرية لكل البيانات ─────────────────────────────────
    const handleRetroSync = async () => {
        if (!confirm(isRTL
            ? '⚠️ سيتم معالجة جميع السيارات: إزالة روابط Encar، ترجمة الكوري، علامة مائية. هل تريد المتابعة؟'
            : 'All cars will be processed: remove Encar links, translate Korean, add watermark. Continue?'
        )) return;
        setSyncLoading(true); setSyncResult(null);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch('/api/v2/import/retro-sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await res.json();
            if (data?.success) {
                showToast(data.message || '✅ تمت المزامنة الجذرية بنجاح', 'success');
                setSyncResult(data);
            } else {
                showToast(data?.error || '❌ فشلت المزامنة', 'error');
            }
        } catch (e: any) { showToast(e.message || '❌ خطأ', 'error'); }
        finally { setSyncLoading(false); }
    };


    const handleFixImages = async () => {
        setSyncLoading(true);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch('/api/v2/import/fix-images', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            showToast(data?.message || '✅ تم إصلاح الصور', data?.success ? 'success' : 'error');
            if (data?.success) setSyncResult(data);
        } catch (e: any) { showToast(e.message || '❌ خطأ', 'error'); }
        finally { setSyncLoading(false); }
    };

    const handleClearExternalUrls = async () => {
        if (!confirm(isRTL
            ? 'سيتم مسح جميع روابط Encar من قاعدة البيانات. هل تريد المتابعة؟'
            : 'All Encar external URLs will be cleared from database. Continue?'
        )) return;
        setSyncLoading(true);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch('/api/v2/import/clear-external-urls', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            showToast(data?.message || '✅ تم مسح الروابط الخارجية', data?.success ? 'success' : 'error');
        } catch (e: any) { showToast(e.message || '❌ خطأ', 'error'); }
        finally { setSyncLoading(false); }
    };

    // ── Shared sub-components ──────────────────────────────────
    const BigUrlInput = ({ value, onChange, placeholder, label, hint }: any) => (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30">
                    <Link2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-slate-400">{hint}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-950 border-2 border-slate-700 focus-within:border-amber-500 rounded-2xl px-4 py-3 transition-colors">
                <Globe className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                    dir="ltr"
                />
                {value && (
                    <button onClick={() => onChange("")} className="text-slate-500 hover:text-red-400 text-xs transition-colors">✕</button>
                )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{isRTL ? "اختياري — اتركه فارغاً للاستيراد المباشر من الكتالوج الكوري" : "Optional — leave empty to import directly from Korean catalog"}</span>
            </p>
        </div>
    );

    // حقل تحديد العدد المخصص الذكي بدلاً من الأزرار المطلوبة إلغاؤها
    const CustomQuantityInput = ({ value, onChange, label, hint }: any) => (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>{isRTL ? "يستورد سيارات جديدة غير مكررة فقط" : "Only new unimported cars"}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2 w-fit">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(1, value - 1))}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>

                <input
                    type="number"
                    min={1}
                    max={50}
                    value={value}
                    onChange={e => onChange(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center font-mono font-bold text-amber-400 bg-transparent text-lg focus:outline-none"
                />

                <button
                    type="button"
                    onClick={() => onChange(Math.min(50, value + 1))}
                    className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-500 px-2 font-bold">{isRTL ? "سيارة" : "cars"}</span>
            </div>
        </div>
    );

    const InfoChip = ({ icon: Icon, color, label, value }: any) => (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
            <div><p className="text-xs text-slate-500">{label}</p><p className="text-sm font-bold text-white">{value}</p></div>
        </div>
    );

    const RunButton = ({ onClick, isLoading, label, color }: any) => (
        <button onClick={() => onClick()} disabled={isLoading}
            className={cn(
                "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.99]",
                isLoading ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : color === "red"
                        ? "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white shadow-red-500/25 hover:shadow-red-500/40 hover:brightness-110"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110"
            )}>
            {isLoading
                ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>{isRTL ? "جاري الاستيراد والتأكد من الجدة..." : "Importing new cars..."}</span></>
                : <><Download className="w-5 h-5" /><span>{label}</span></>}
        </button>
    );

    // ── مكوّن نتيجة الاستيراد ─────────────────────────────────────────
    const ImportResult = ({ result }: { result: any }) => {
        if (!result) return null;
        return (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold">{isRTL ? "تم الاستيراد بنجاح" : "Import Successful"}</span>
                </div>
                <p className="text-sm text-emerald-200">{result.message}</p>
                {result.stats && (
                    <div className="flex gap-3 text-sm">
                        <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-slate-400">{isRTL ? "مستورد جديد: " : "New Imported: "}</span>
                            <span className="font-bold text-emerald-400">+{result.stats.totalImported ?? 0}</span>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
                            <span className="text-slate-400">{isRTL ? "موجود مسبقاً (مُتجاوز): " : "Skipped (Existing): "}</span>
                            <span className="font-bold text-amber-400">{result.stats.totalSkipped ?? 0}</span>
                        </div>
                    </div>
                )}
                <NextLink
                    href={result.type === "cars" ? "/admin/cars" : result.type === "parts" ? "/admin/parts" : "/admin/auctions"}
                    className="flex items-center gap-2 text-sm text-amber-400 hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    <span>{isRTL ? "عرض السيارات المستوردة ←" : "View Imported Cars →"}</span>
                </NextLink>
            </motion.div>
        );
    };

    // ── مكوّن بطاقات الروابط والجلسات المحفوظة لكل قسم ─────────────────
    const SavedSectionLinksList = ({
        section,
        links,
        onReimport,
        onSelectUrl,
        isLoading
    }: {
        section: ActiveTab;
        links: SavedLink[];
        onReimport: (url: string) => void;
        onSelectUrl: (url: string) => void;
        isLoading: boolean;
    }) => {
        if (!links || links.length === 0) return null;

        const sectionBadgeColor =
            section === 'cars' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                section === 'parts' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30';

        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${sectionBadgeColor}`}>
                            <Bookmark className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">
                                {isRTL
                                    ? `سجلات وروابط الاستيراد المحفوظة (${section === 'cars' ? 'سيارات المعرض' : section === 'parts' ? 'قطع الغيار' : 'المزادات المباشرة'})`
                                    : `Saved Import Links & History (${section})`}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {isRTL ? "يمكنك استخدام أي رابط محفوط للاستيراد منه مجدداً بنقرة واحدة" : "Click any saved link to re-import"}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{links.length} {isRTL ? 'رابط' : 'links'}</span>
                </div>

                <div className="space-y-3">
                    {links.map((item) => (
                        <div key={item.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                                    <Globe className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-mono text-slate-300 truncate" dir="ltr">{item.url}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                                        {item.lastImportedAt && (
                                            <span>{isRTL ? "آخر استيراد: " : "Last: "}{new Date(item.lastImportedAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>
                                        )}
                                        {item.lastCount ? <span>• {item.lastCount} {isRTL ? 'عنصر' : 'items'}</span> : null}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => onSelectUrl(item.url)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-700 transition-colors flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{isRTL ? "اختيار الرابط" : "Use URL"}</span>
                                </button>

                                <button
                                    onClick={() => onReimport(item.url)}
                                    disabled={isLoading}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                                    <span>{isRTL ? "إعادة الاستيراد" : "Re-Import"}</span>
                                </button>

                                <button
                                    onClick={() => deleteSavedLink(section, item.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                    title={isRTL ? "حذف الرابط" : "Delete link"}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AdminPageShell
            title={isRTL ? "بوابة الاستيراد الذكية" : "Smart Import Gateway"}
            subtitle={isRTL ? "استيراد السيارات الجديدة والمزادات وقطع الغيار مع كشف التكرار التلقائي" : "Import new cars, live auctions & spare parts with smart deduplication"}
            badge={isRTL ? "جلب الجُدد فقط" : "New Cars Only"}
        >
            <div className="space-y-6">

                {/* ── TABS ── */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-800">
                    {[
                        { key: "cars", icon: Car, ar: "🚗 السيارات", en: "🚗 Cars" },
                        { key: "parts", icon: Package, ar: "🔧 قطع الغيار", en: "🔧 Parts" },
                        { key: "auctions", icon: Gavel, ar: "🔴 المزادات المباشرة", en: "🔴 Live Auctions" },
                    ].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key as ActiveTab)}
                            className={cn(
                                "flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                                activeTab === t.key
                                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}>
                            <t.icon className="w-4 h-4" />
                            <span>{isRTL ? t.ar : t.en}</span>
                        </button>
                    ))}
                </div>

                {/* ── TAB CONTENT ── */}
                <AnimatePresence mode="wait">

                    {/* ─────── CARS TAB ─────── */}
                    {activeTab === "cars" && (
                        <motion.div key="cars"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-5"
                        >
                            {/* Destination badge */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                <Car className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-300">{isRTL ? "استيراد سيارات المعرض" : "Showroom Cars Import"}</p>
                                    <p className="text-xs text-slate-400">{isRTL ? "السيارات ستظهر في صفحة إدارة السيارات وفي المعرض للعملاء مع العلامة المائية HMCar" : "Cars will appear in admin cars page and client showroom with HMCar watermark"}</p>
                                </div>
                                <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-1 rounded-lg font-mono border border-amber-500/20">/admin/cars</span>
                            </div>

                            {/* ★ URL INPUT ★ */}
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                                <BigUrlInput
                                    value={carsUrl}
                                    onChange={setCarsUrl}
                                    placeholder="https://www.encar.com/dc/dc/dcCarDetlView.do?carid=..."
                                    label={isRTL ? "رابط الموقع الخارجي للاستيراد (Encar أو غيره)" : "External Site URL"}
                                    hint={isRTL ? "ضع رابط الموقع أو ابحث بالكلمات الكورية — سيتم حفظ الرابط تلقائياً في السجلات" : "Paste source URL to import cars"}
                                />
                            </div>

                            {/* Custom quantity input (replaces fixed 10/20/50/100 buttons) */}
                            <CustomQuantityInput
                                value={carsLimit}
                                onChange={setCarsLimit}
                                label={isRTL ? "عدد السيارات المطلوب استيرادها في هذه الدفعة:" : "Cars to import in this batch:"}
                                hint={isRTL ? "حدد العدد المطلوب (يستورد السيارات الجديدة فقط ويستبعد الموجودة سابقاً)" : "Set count — imports only unimported cars"}
                            />

                            {/* Info chips */}
                            <div className="grid grid-cols-3 gap-3">
                                <InfoChip icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" label={isRTL ? "مانع التكرار" : "Dedup"} value="تلقائي 🛡️" />
                                <InfoChip icon={Zap} color="bg-blue-500/10 text-blue-400" label={isRTL ? "العلامة المائية" : "Watermark"} value="HMCar 🏆" />
                                <InfoChip icon={Car} color="bg-emerald-500/10 text-emerald-400" label={isRTL ? "الوجهة" : "Dest."} value={isRTL ? "إدارة السيارات" : "Cars Mgmt"} />
                            </div>

                            <RunButton onClick={() => handleImportCars()} isLoading={carsLoading}
                                label={isRTL ? `استيراد ${carsLimit} سيارة جديدة للمعرض الآن →` : `Import ${carsLimit} New Cars Now →`} />

                            {/* نتيجة استيراد السيارات المستقلة */}
                            <ImportResult result={carsResult} />

                            {/* ── السجلات والروابط المحفوظة لقسم السيارات ── */}
                            <SavedSectionLinksList
                                section="cars"
                                links={savedCarsLinks}
                                onReimport={(url) => { setCarsUrl(url); handleImportCars(url); }}
                                onSelectUrl={(url) => setCarsUrl(url)}
                                isLoading={carsLoading}
                            />

                            <NextLink href="/admin/cars" className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                                <ExternalLink className="w-4 h-4" /><span>{isRTL ? "عرض صفحة إدارة السيارات" : "Open Cars Management"}</span>
                            </NextLink>
                        </motion.div>
                    )}

                    {/* ─────── PARTS TAB ─────── */}
                    {activeTab === "parts" && (
                        <motion.div key="parts"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-5"
                        >
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                                <Package className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-blue-300">{isRTL ? "استيراد قطع الغيار" : "Spare Parts Import"}</p>
                                    <p className="text-xs text-slate-400">{isRTL ? "القطع ستظهر في إدارة قطع الغيار مصنفةً داخل كل وكالة" : "Parts appear in Parts Management organized by dealer"}</p>
                                </div>
                                <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-lg font-mono border border-blue-500/20">/admin/parts</span>
                            </div>

                            {/* ★ URL INPUT ★ */}
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                                <BigUrlInput
                                    value={partsUrl}
                                    onChange={setPartsUrl}
                                    placeholder="https://www.autospare.com/parts/..."
                                    label={isRTL ? "رابط الموقع الخارجي للاستيراد" : "External Site URL"}
                                    hint={isRTL ? "ضع رابط الموقع المراد الاستيراد منه" : "Paste the URL of the source website"}
                                />
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-700 text-sm text-slate-300">
                                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p>{isRTL ? "سيستورد النظام كافة الأصناف المتاحة تلقائياً بدون تحديد عدد، ويصنفها حسب الوكالة والفئة." : "The system will import all available parts automatically and organize them by dealer and category."}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <InfoChip icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" label={isRTL ? "مانع التكرار" : "Dedup"} value="OEM #" />
                                <InfoChip icon={Package} color="bg-blue-500/10 text-blue-400" label={isRTL ? "الاستيراد" : "Mode"} value={isRTL ? "شامل" : "Full"} />
                                <InfoChip icon={Zap} color="bg-emerald-500/10 text-emerald-400" label={isRTL ? "الوجهة" : "Dest."} value={isRTL ? "قطع الغيار" : "Parts Mgmt"} />
                            </div>

                            {/* ★ AutoSpare Auto Import Banner ★ */}
                            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                            <Globe className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-emerald-300">
                                                {isRTL ? "🔄 استيراد تلقائي من AutoSpare — بدون سعر" : "🔄 Auto Import from AutoSpare — No Price"}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {isRTL
                                                    ? "يجلب جميع الوكالات وقطعهم تلقائياً — السعر عند الطلب عبر WhatsApp — علامة مائية HMCAR تلقائية"
                                                    : "Fetches all brands & parts automatically — price on WhatsApp request — HMCAR watermark applied"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleImportAutoSpare}
                                        disabled={autospareLoading}
                                        className={cn(
                                            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                                            autospareLoading
                                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 cursor-pointer"
                                        )}
                                    >
                                        {autospareLoading ? (
                                            <><RefreshCw className="w-4 h-4 animate-spin" />{isRTL ? "جاري الاستيراد..." : "Importing..."}</>
                                        ) : (
                                            <><Download className="w-4 h-4" />{isRTL ? "استيراد AutoSpare الآن" : "Import AutoSpare Now"}</>
                                        )}
                                    </button>
                                </div>
                                {autospareResult && (
                                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 font-bold">
                                        ✅ {isRTL
                                            ? `تم استيراد ${autospareResult.brandsImported ?? 0} وكالة و ${autospareResult.partsImported ?? autospareResult.totalImported ?? 0} قطعة`
                                            : `Imported ${autospareResult.brandsImported ?? 0} brands and ${autospareResult.partsImported ?? autospareResult.totalImported ?? 0} parts`}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3 pt-1 border-t border-white/5 text-[11px] text-slate-500 font-medium">
                                    <span>✅ {isRTL ? "شعارات الوكالات" : "Brand logos"}</span>
                                    <span>🖼️ {isRTL ? "صور القطع + علامة مائية" : "Part images + watermark"}</span>
                                    <span>💬 {isRTL ? "السعر عبر WhatsApp" : "Price via WhatsApp"}</span>
                                </div>
                            </div>

                            <RunButton onClick={() => handleImportParts()} isLoading={partsLoading}
                                label={isRTL ? "استيراد قطع الغيار من رابط مخصص →" : "Import Parts from Custom URL →"} />


                            {/* نتيجة استيراد قطع الغيار المستقلة */}
                            <ImportResult result={partsResult} />

                            {/* ── السجلات والروابط المحفوظة لقسم قطع الغيار ── */}
                            <SavedSectionLinksList
                                section="parts"
                                links={savedPartsLinks}
                                onReimport={(url) => { setPartsUrl(url); handleImportParts(url); }}
                                onSelectUrl={(url) => setPartsUrl(url)}
                                isLoading={partsLoading}
                            />

                            <NextLink href="/admin/parts" className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                                <ExternalLink className="w-4 h-4" /><span>{isRTL ? "عرض صفحة إدارة قطع الغيار" : "Open Parts Management"}</span>
                            </NextLink>
                        </motion.div>
                    )}

                    {/* ─────── AUCTIONS TAB ─────── */}
                    {activeTab === "auctions" && (
                        <motion.div key="auctions"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="space-y-5"
                        >
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/20">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-300">{isRTL ? "استيراد المزادات المباشرة — Encar الكوري 🇰🇷" : "Live Auctions Import — Encar Korea 🇰🇷"}</p>
                                    <p className="text-xs text-slate-400">{isRTL ? "في كل استيراد، يستورد النظام سيارات جديدة بالكامل لم تسبق إضافتها من قبل مع صور كاملة وفحوصات" : "Imports brand new unimported cars each run with full images, inspection report & specs"}</p>
                                </div>
                                <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-lg font-mono border border-red-500/20">/admin/auctions</span>
                            </div>

                            {/* Encar Source Banner */}
                            <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                                    <Globe className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-blue-300">{isRTL ? "🇰🇷 مصدر الاستيراد: Encar (إنكار)" : "🇰🇷 Import Source: Encar Korea"}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {isRTL
                                            ? "أكبر منصة سيارات مستعملة في كوريا الجنوبية — يستورد السيارات الجديدة غير المكررة تلقائياً"
                                            : "Korea's largest used car marketplace — imports new unimported cars automatically"}
                                    </p>
                                </div>
                                <a href="https://www.encar.com" target="_blank" rel="noopener noreferrer"
                                    className="shrink-0 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>encar.com</span>
                                </a>
                            </div>

                            {/* ★ URL / Car ID INPUT ★ */}
                            <div className="bg-slate-900 border-2 border-red-500/30 rounded-2xl p-5 shadow-lg shadow-red-500/5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30">
                                            <Link2 className="w-5 h-5 text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{isRTL ? "رابط Encar أو رقم السيارة" : "Encar URL or Car ID"}</p>
                                            <p className="text-xs text-slate-400">
                                                {isRTL
                                                    ? "اترك فارغاً لاستيراد السيارات الجديدة من الكتالوج العام — أو ضع رابطاً مباشراً لسيارة كورية"
                                                    : "Leave empty to fetch new cars from catalog — or paste direct link"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-950 border-2 border-slate-700 focus-within:border-red-500 rounded-2xl px-4 py-3 transition-colors">
                                        <Globe className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={auctionsUrl}
                                            onChange={e => setAuctionsUrl(e.target.value)}
                                            placeholder="https://www.encar.com/dc/dc/dcCarDetlView.do?carid=42157084"
                                            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                                            dir="ltr"
                                        />
                                        {auctionsUrl && (
                                            <button onClick={() => setAuctionsUrl("")} className="text-slate-500 hover:text-red-400 text-xs transition-colors">✕</button>
                                        )}
                                    </div>

                                    {/* أمثلة على الروابط */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-slate-500">{isRTL ? "أمثلة سريعة:" : "Quick examples:"}</span>
                                        {[
                                            { label: isRTL ? "📋 قائمة عامة جديدة" : "📋 General List", val: "" },
                                            { label: "Hyundai Tucson", val: "https://www.encar.com/dc/dc/dcCarDetlView.do?carid=42337181" },
                                            { label: "Genesis GV70", val: "https://www.encar.com/dc/dc/dcCarDetlView.do?carid=42194278" },
                                        ].map(ex => (
                                            <button key={ex.label} onClick={() => setAuctionsUrl(ex.val)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 border border-slate-700 transition-all">
                                                {ex.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Custom quantity input (replaces fixed 10/20/50/100 buttons) */}
                            <CustomQuantityInput
                                value={auctionsLimit}
                                onChange={setAuctionsLimit}
                                label={isRTL ? "عدد السيارات المستوردة المجهزة للمزاد المباشر:" : "Cars to import for live auction:"}
                                hint={isRTL ? "في كل مرة، يجلب النظام السيارات الكورية الجديدة فقط التي لم يتم استيرادها سابقاً" : "System fetches only new unimported cars every time"}
                            />

                            <div className="grid grid-cols-3 gap-3">
                                <InfoChip icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" label={isRTL ? "تجاوز المكرر" : "Skip Duplicate"} value="تلقائي 🛡️" />
                                <InfoChip icon={Zap} color="bg-red-500/10 text-red-400" label={isRTL ? "العلامة المائية" : "Watermark"} value="HMCar 🏆" />
                                <InfoChip icon={Gavel} color="bg-emerald-500/10 text-emerald-400" label={isRTL ? "الوجهة" : "Dest."} value={isRTL ? "إدارة المزادات" : "Auctions"} />
                            </div>

                            <RunButton onClick={() => handleImportAuctions()} isLoading={auctionsLoading} color="red"
                                label={isRTL ? `🇰🇷 استيراد ${auctionsLimit} سيارة جديدة للمزاد المباشر الآن →` : `🇰🇷 Import ${auctionsLimit} New Auction Cars →`} />

                            {/* نتيجة استيراد المزادات المستقلة */}
                            <ImportResult result={auctionsResult} />

                            {/* ── السجلات والروابط المحفوظة لقسم المزادات ── */}
                            <SavedSectionLinksList
                                section="auctions"
                                links={savedAuctionsLinks}
                                onReimport={(url) => { setAuctionsUrl(url); handleImportAuctions(url); }}
                                onSelectUrl={(url) => setAuctionsUrl(url)}
                                isLoading={auctionsLoading}
                            />

                            <NextLink href="/admin/auctions" className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                                <ExternalLink className="w-4 h-4" /><span>{isRTL ? "عرض صفحة إدارة المزادات والشراء" : "Open Auctions Management"}</span>
                            </NextLink>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* ── Logs toggle ── */}
                <div>
                    <button onClick={() => setShowLogs(v => !v)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                        <History className="w-4 h-4" />
                        <span>{isRTL ? (showLogs ? "إخفاء السجل العام" : "عرض سجّلات النظام العامة") : (showLogs ? "Hide Logs" : "Show System Import Logs")}</span>
                    </button>
                </div>

                {/* ── Import Logs ── */}
                {showLogs && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <History className="w-4 h-4 text-amber-400" />
                                <span>{isRTL ? "سجل عمليات الاستيراد" : "Import History"}</span>
                            </h3>
                            <button onClick={loadImportLogs} disabled={logsLoading}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
                                <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} />
                            </button>
                        </div>
                        {logsLoading ? (
                            <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" /></div>
                        ) : importLogs.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{isRTL ? "لا توجد سجلات بعد" : "No logs yet"}</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-800">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-950 text-slate-400 text-xs">
                                        <tr>
                                            <th className="p-3 text-right">{isRTL ? "التاريخ" : "Date"}</th>
                                            <th className="p-3 text-right">{isRTL ? "النوع" : "Type"}</th>
                                            <th className="p-3 text-right">{isRTL ? "مستورد" : "Imported"}</th>
                                            <th className="p-3 text-right">{isRTL ? "متجاوز" : "Skipped"}</th>
                                            <th className="p-3 text-right">{isRTL ? "الحالة" : "Status"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                        {importLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="p-3 text-xs text-slate-400 font-mono" dir="ltr">{new Date(log.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</td>
                                                <td className="p-3 font-bold">
                                                    {log.importType === 'showroom_cars' && <span className="text-amber-400">🚗 سيارات</span>}
                                                    {log.importType === 'parts' && <span className="text-blue-400">🔧 قطع غيار</span>}
                                                    {log.importType === 'live_auctions' && <span className="text-red-400">🔴 مزادات</span>}
                                                </td>
                                                <td className="p-3 font-bold text-emerald-400">+{log.totalImported || 0}</td>
                                                <td className="p-3 text-slate-400">{log.totalSkipped || 0}</td>
                                                <td className="p-3">
                                                    <span className={cn("px-2 py-1 rounded-full text-xs font-bold border",
                                                        log.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30")}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
            {/* ── قسم المزامنة الجذرية ─────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-red-950/60 to-slate-900 border border-red-500/30 rounded-3xl p-6 space-y-4"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30">
                        <RefreshCw className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            {isRTL ? '🔄 مزامنة جذرية وإصلاح البيانات' : '🔄 Retroactive Sync & Data Fix'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isRTL
                                ? 'تصلح البيانات القديمة والحالية — تزيل روابط Encar، تترجم النصوص الكورية، تضيف علامة HM CAR على الصور'
                                : 'Fixes existing & old data — removes Encar links, translates Korean text, adds HM CAR watermark to images'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* مزامنة شاملة */}
                    <button
                        onClick={handleRetroSync}
                        disabled={syncLoading}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <RefreshCw className={`w-6 h-6 text-red-400 group-hover:text-red-300 ${syncLoading ? 'animate-spin' : ''}`} />
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">{isRTL ? 'مزامنة جذرية شاملة' : 'Full Retroactive Sync'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isRTL ? 'كل السيارات: ترجمة + علامة + إزالة روابط' : 'All cars: translate + watermark + clear links'}</p>
                        </div>
                    </button>

                    {/* إصلاح الصور فقط */}
                    <button
                        onClick={handleFixImages}
                        disabled={syncLoading}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <ImageIcon className="w-6 h-6 text-amber-400 group-hover:text-amber-300" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">{isRTL ? 'إصلاح الصور فقط' : 'Fix Images Only'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isRTL ? 'تحميل صور Encar + علامة HM CAR' : 'Download Encar images + HM CAR watermark'}</p>
                        </div>
                    </button>

                    {/* مسح روابط Encar */}
                    <button
                        onClick={handleClearExternalUrls}
                        disabled={syncLoading}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-700/30 border border-slate-600/30 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-white">{isRTL ? 'مسح روابط Encar' : 'Clear Encar Links'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isRTL ? 'يمنع فتح مواقع خارجية' : 'Prevents opening external sites'}</p>
                        </div>
                    </button>
                </div>

                {syncResult && (
                    <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-300">
                        <p className="font-bold">{syncResult.message}</p>
                        {syncResult.stats && (
                            <div className="flex gap-4 mt-2 text-xs text-emerald-400/70">
                                <span>✅ {isRTL ? 'عولجت:' : 'Processed:'} {syncResult.stats.totalProcessed}</span>
                                <span>🔄 {isRTL ? 'حُدِّثت:' : 'Updated:'} {syncResult.stats.totalUpdated}</span>
                                {syncResult.stats.totalErrors > 0 && (
                                    <span>⚠️ {isRTL ? 'أخطاء:' : 'Errors:'} {syncResult.stats.totalErrors}</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

        </AdminPageShell>
    );
}

