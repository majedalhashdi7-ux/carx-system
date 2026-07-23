'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Globe, RefreshCw, Car, Gavel, Package,
    CheckCircle2, History, ShieldCheck, Zap, ExternalLink,
    AlertCircle, Link2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";
import NextLink from "next/link";

type ActiveTab = "cars" | "parts" | "auctions";

export default function AdminImportHub() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>("cars");
    const [loading, setLoading] = useState(false);

    const [carsUrl, setCarsUrl] = useState("");
    const [carsLimit, setCarsLimit] = useState(20);

    const [partsUrl, setPartsUrl] = useState("");

    const [auctionsUrl, setAuctionsUrl] = useState("");
    const [auctionsLimit, setAuctionsLimit] = useState(10);

    const [lastResult, setLastResult] = useState<any>(null);
    const [importLogs, setImportLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const loadImportLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await api.import.getLogs();
            if (res?.success) setImportLogs(res.logs || []);
        } catch { } finally { setLogsLoading(false); }
    }, []);

    useEffect(() => { loadImportLogs(); }, [loadImportLogs]);

    const handleImportCars = async () => {
        setLoading(true); setLastResult(null);
        try {
            const res = await api.import.showroom(carsLimit, carsUrl);
            if (res?.success) { showToast(res.message || "✅ تم استيراد السيارات بنجاح", "success"); setLastResult({ type: "cars", ...res }); loadImportLogs(); }
            else showToast(res?.error || "❌ فشل الاستيراد", "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setLoading(false); }
    };

    const handleImportParts = async () => {
        setLoading(true); setLastResult(null);
        try {
            const res = await api.import.parts(partsUrl);
            if (res?.success) { showToast(res.message || "✅ تم استيراد قطع الغيار", "success"); setLastResult({ type: "parts", ...res }); loadImportLogs(); }
            else showToast(res?.error || "❌ فشل الاستيراد", "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setLoading(false); }
    };

    const handleImportAuctions = async () => {
        setLoading(true); setLastResult(null);
        try {
            const res = await api.import.liveAuctions(auctionsLimit, auctionsUrl);
            if (res?.success) { showToast(res.message || "✅ تم استيراد المزادات", "success"); setLastResult({ type: "auctions", ...res }); loadImportLogs(); }
            else showToast(res?.error || "❌ فشل الاستيراد", "error");
        } catch (e: any) { showToast(e.message || "❌ خطأ", "error"); }
        finally { setLoading(false); }
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
                    type="url"
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
                <span>{isRTL ? "اختياري — اتركه فارغاً للاستيراد من قاعدة البيانات الافتراضية" : "Optional — leave empty to use default database"}</span>
            </p>
        </div>
    );

    const QuantitySelector = ({ value, onChange, options, label }: any) => (
        <div className="space-y-3">
            <p className="text-sm font-bold text-white">{label}</p>
            <div className="flex flex-wrap gap-3">
                {options.map((q: number) => (
                    <button key={q} onClick={() => onChange(q)}
                        className={cn(
                            "w-16 h-12 rounded-xl text-sm font-bold transition-all border-2",
                            value === q
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 scale-105"
                                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white"
                        )}>
                        {q}
                    </button>
                ))}
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
        <button onClick={onClick} disabled={isLoading}
            className={cn(
                "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.99]",
                isLoading ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                    : color === "red"
                        ? "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white shadow-red-500/25 hover:shadow-red-500/40 hover:brightness-110"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-110"
            )}>
            {isLoading
                ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>{isRTL ? "جاري الاستيراد..." : "Importing..."}</span></>
                : <><Download className="w-5 h-5" /><span>{label}</span></>}
        </button>
    );

    return (
        <AdminPageShell
            title={isRTL ? "بوابة الاستيراد" : "Import Gateway"}
            subtitle={isRTL ? "3 بوابات استيراد مستقلة — سيارات المعرض | قطع الغيار | المزادات المباشرة" : "3 independent import pipelines — Showroom | Parts | Live Auctions"}
            badge={isRTL ? "مانع التكرار مفعّل" : "Deduplication On"}
        >
            <div className="space-y-6">

                {/* ── TABS ── */}
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/80 backdrop-blur rounded-2xl border border-slate-800">
                    {[
                        { key: "cars", icon: Car, ar: "🚗 السيارات", en: "🚗 Cars" },
                        { key: "parts", icon: Package, ar: "🔧 قطع الغيار", en: "🔧 Parts" },
                        { key: "auctions", icon: Gavel, ar: "🔴 المزادات", en: "🔴 Auctions" },
                    ].map(t => (
                        <button key={t.key} onClick={() => { setActiveTab(t.key as ActiveTab); setLastResult(null); }}
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
                                    <p className="text-xs text-slate-400">{isRTL ? "السيارات ستظهر في صفحة إدارة السيارات وفي المعرض للعملاء" : "Cars will appear in admin cars page and client showroom"}</p>
                                </div>
                                <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-1 rounded-lg font-mono border border-amber-500/20">/admin/cars</span>
                            </div>

                            {/* ★ URL INPUT ★ */}
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                                <BigUrlInput
                                    value={carsUrl}
                                    onChange={setCarsUrl}
                                    placeholder="https://car.encar.com/cat/car/search?..."
                                    label={isRTL ? "رابط الموقع الخارجي للاستيراد" : "External Site URL"}
                                    hint={isRTL ? "ضع رابط الموقع المراد الاستيراد منه" : "Paste the URL of the source website"}
                                />
                            </div>

                            {/* Quantity */}
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                                <QuantitySelector
                                    value={carsLimit}
                                    onChange={setCarsLimit}
                                    options={[10, 20, 50, 100]}
                                    label={isRTL ? "عدد السيارات المطلوب استيرادها:" : "Cars to import:"}
                                />
                            </div>

                            {/* Info chips */}
                            <div className="grid grid-cols-3 gap-3">
                                <InfoChip icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" label={isRTL ? "مانع التكرار" : "Dedup"} value="VIN / ID" />
                                <InfoChip icon={Zap} color="bg-blue-500/10 text-blue-400" label={isRTL ? "الصور" : "Images"} value="WebP" />
                                <InfoChip icon={Car} color="bg-emerald-500/10 text-emerald-400" label={isRTL ? "الوجهة" : "Dest."} value={isRTL ? "إدارة السيارات" : "Cars Mgmt"} />
                            </div>

                            <RunButton onClick={handleImportCars} isLoading={loading}
                                label={isRTL ? `استيراد ${carsLimit} سيارة الآن →` : `Import ${carsLimit} Cars Now →`} />

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

                            <RunButton onClick={handleImportParts} isLoading={loading}
                                label={isRTL ? "استيراد قطع الغيار الكاملة الآن →" : "Import Full Parts Catalog →"} />

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
                                    <p className="text-sm font-bold text-red-300">{isRTL ? "استيراد المزادات المباشرة" : "Live Auctions Import"}</p>
                                    <p className="text-xs text-slate-400">{isRTL ? "المزادات ستظهر في صفحة إدارة المزادات جاهزةً للتفعيل" : "Auctions appear in Auctions Management ready to activate"}</p>
                                </div>
                                <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-lg font-mono border border-red-500/20">/admin/auctions</span>
                            </div>

                            {/* ★ URL INPUT — MAIN FOCUS ★ */}
                            <div className="bg-slate-900 border-2 border-red-500/30 rounded-2xl p-5 shadow-lg shadow-red-500/5">
                                <BigUrlInput
                                    value={auctionsUrl}
                                    onChange={setAuctionsUrl}
                                    placeholder="https://lotte-auction.com/auction/cars/..."
                                    label={isRTL ? "رابط موقع المزاد الخارجي" : "Auction Source URL"}
                                    hint={isRTL ? "ضع رابط موقع المزاد المراد الاستيراد منه" : "Paste the auction website URL to import from"}
                                />
                            </div>

                            {/* Quantity */}
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
                                <QuantitySelector
                                    value={auctionsLimit}
                                    onChange={setAuctionsLimit}
                                    options={[5, 10, 20, 50]}
                                    label={isRTL ? "عدد المزادات المطلوب استيرادها:" : "Auctions to import:"}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <InfoChip icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" label={isRTL ? "مانع التكرار" : "Dedup"} value="Auto" />
                                <InfoChip icon={Zap} color="bg-red-500/10 text-red-400" label={isRTL ? "البيانات" : "Data"} value={isRTL ? "صور + توقيت" : "Images + Timer"} />
                                <InfoChip icon={Gavel} color="bg-emerald-500/10 text-emerald-400" label={isRTL ? "الوجهة" : "Dest."} value={isRTL ? "المزادات" : "Auctions"} />
                            </div>

                            <RunButton onClick={handleImportAuctions} isLoading={loading} color="red"
                                label={isRTL ? `استيراد ${auctionsLimit} مزاد حي الآن →` : `Import ${auctionsLimit} Live Auctions →`} />

                            <NextLink href="/admin/auctions" className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                                <ExternalLink className="w-4 h-4" /><span>{isRTL ? "عرض صفحة إدارة المزادات" : "Open Auctions Management"}</span>
                            </NextLink>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Result ── */}
                {lastResult && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-bold">{isRTL ? "تم الاستيراد بنجاح" : "Import Successful"}</span>
                        </div>
                        <p className="text-sm text-emerald-200">{lastResult.message}</p>
                        {lastResult.stats && (
                            <div className="flex gap-3 text-sm">
                                <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-slate-400">{isRTL ? "مستورد: " : "Imported: "}</span>
                                    <span className="font-bold text-emerald-400">+{lastResult.stats.totalImported ?? 0}</span>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <span className="text-slate-400">{isRTL ? "مكرر: " : "Skipped: "}</span>
                                    <span className="font-bold text-amber-400">{lastResult.stats.totalSkipped ?? 0}</span>
                                </div>
                            </div>
                        )}
                        <NextLink
                            href={lastResult.type === "cars" ? "/admin/cars" : lastResult.type === "parts" ? "/admin/parts" : "/admin/auctions"}
                            className="flex items-center gap-2 text-sm text-amber-400 hover:underline">
                            <ExternalLink className="w-4 h-4" />
                            <span>{isRTL ? "عرض البيانات المستوردة ←" : "View Imported Data →"}</span>
                        </NextLink>
                    </motion.div>
                )}

                {/* ── Logs toggle ── */}
                <div>
                    <button onClick={() => setShowLogs(v => !v)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                        <History className="w-4 h-4" />
                        <span>{isRTL ? (showLogs ? "إخفاء السجل" : "عرض سجل الاستيراد") : (showLogs ? "Hide Logs" : "Show Import Logs")}</span>
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
        </AdminPageShell>
    );
}
