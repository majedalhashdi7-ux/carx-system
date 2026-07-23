'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Globe, RefreshCw, Car, Gavel, Package,
    CheckCircle2, History, ShieldCheck, Zap, ExternalLink,
    AlertTriangle
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

    // --- State per pipeline ---
    const [carsUrl, setCarsUrl] = useState("");
    const [carsLimit, setCarsLimit] = useState(20);

    const [partsUrl, setPartsUrl] = useState("");

    const [auctionsUrl, setAuctionsUrl] = useState("");
    const [auctionsLimit, setAuctionsLimit] = useState(10);

    // --- Import result & logs ---
    const [lastResult, setLastResult] = useState<any>(null);
    const [importLogs, setImportLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    const loadImportLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await api.import.getLogs();
            if (res?.success) setImportLogs(res.logs || []);
        } catch { /* silent */ } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => { loadImportLogs(); }, [loadImportLogs]);

    // ─── Handlers ────────────────────────────────────────────
    const handleImportCars = async () => {
        setLoading(true);
        setLastResult(null);
        try {
            const res = await api.import.showroom(carsLimit, carsUrl);
            if (res?.success) {
                showToast(res.message || "✅ تم استيراد السيارات بنجاح", "success");
                setLastResult({ type: "cars", ...res });
                loadImportLogs();
            } else {
                showToast(res?.error || "❌ فشل استيراد السيارات", "error");
            }
        } catch (e: any) {
            showToast(e.message || "❌ خطأ غير متوقع", "error");
        } finally { setLoading(false); }
    };

    const handleImportParts = async () => {
        setLoading(true);
        setLastResult(null);
        try {
            const res = await api.import.parts(partsUrl);
            if (res?.success) {
                showToast(res.message || "✅ تم استيراد قطع الغيار بنجاح", "success");
                setLastResult({ type: "parts", ...res });
                loadImportLogs();
            } else {
                showToast(res?.error || "❌ فشل استيراد قطع الغيار", "error");
            }
        } catch (e: any) {
            showToast(e.message || "❌ خطأ غير متوقع", "error");
        } finally { setLoading(false); }
    };

    const handleImportAuctions = async () => {
        setLoading(true);
        setLastResult(null);
        try {
            const res = await api.import.liveAuctions(auctionsLimit, auctionsUrl);
            if (res?.success) {
                showToast(res.message || "✅ تم استيراد المزادات بنجاح", "success");
                setLastResult({ type: "auctions", ...res });
                loadImportLogs();
            } else {
                showToast(res?.error || "❌ فشل استيراد المزادات", "error");
            }
        } catch (e: any) {
            showToast(e.message || "❌ خطأ غير متوقع", "error");
        } finally { setLoading(false); }
    };

    // ─── UI Helpers ───────────────────────────────────────────
    const UrlInput = ({
        value, onChange, placeholder
    }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{isRTL ? "رابط موقع الاستيراد (اختياري)" : "Import Source URL (optional)"}</span>
            </label>
            <input
                type="url"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                dir="ltr"
            />
            <p className="text-xs text-slate-500">
                {isRTL
                    ? "أدخل رابط الموقع الخارجي لجلب البيانات منه، أو اتركه فارغاً للاستيراد من قاعدة البيانات الكورية الافتراضية."
                    : "Enter the external site URL to scrape from, or leave empty to use the default Korean database."}
            </p>
        </div>
    );

    const FeatureCard = ({ icon: Icon, color, title, desc }: any) => (
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
            <div className={`p-3 ${color} rounded-xl`}><Icon className="w-5 h-5" /></div>
            <div>
                <p className="text-xs text-slate-400">{title}</p>
                <p className="text-sm font-bold text-white">{desc}</p>
            </div>
        </div>
    );

    const LimitSelector = ({
        value, onChange, options, label
    }: { value: number; onChange: (v: number) => void; options: number[]; label: string }) => (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">{label}</label>
            <div className="flex flex-wrap gap-3">
                {options.map(qty => (
                    <button
                        key={qty}
                        type="button"
                        onClick={() => onChange(qty)}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
                            value === qty
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md"
                                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                        )}
                    >
                        {qty}
                    </button>
                ))}
            </div>
        </div>
    );

    const ImportButton = ({
        onClick, loading: isLoading, label, loadingLabel, color = "amber"
    }: any) => (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={cn(
                "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl",
                isLoading
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : color === "red"
                        ? "bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-red-500/25 active:scale-[0.99]"
                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:scale-[0.99]"
            )}
        >
            {isLoading
                ? <><RefreshCw className="w-5 h-5 animate-spin" /><span>{loadingLabel}</span></>
                : <><Download className="w-5 h-5" /><span>{label}</span></>
            }
        </button>
    );

    return (
        <AdminPageShell
            title={isRTL ? "بوابة الاستيراد" : "Import Gateway"}
            subtitle={isRTL
                ? "استيراد السيارات وقطع الغيار والمزادات من روابط خارجية مع منع التكرار وضغط الصور"
                : "Import cars, spare parts and auctions from external links with deduplication & image compression"}
            badge={isRTL ? "مزود بمانع التكرار" : "Deduplication Enabled"}
        >
            <div className="space-y-6">

                {/* ── Tab Navigation ── */}
                <div className="flex flex-wrap gap-2 p-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
                    {[
                        { key: "cars", icon: Car, label: isRTL ? "🚗 استيراد السيارات" : "🚗 Import Cars" },
                        { key: "parts", icon: Package, label: isRTL ? "🔧 استيراد قطع الغيار" : "🔧 Import Parts" },
                        { key: "auctions", icon: Gavel, label: isRTL ? "🔴 استيراد المزادات" : "🔴 Import Auctions" },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key as ActiveTab); setLastResult(null); }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                                activeTab === tab.key
                                    ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-[1.02]"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}

                    {/* Logs toggle */}
                    <button
                        onClick={() => setShowLogs(v => !v)}
                        className="ms-auto flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 text-sm transition-all"
                    >
                        <History className="w-4 h-4" />
                        <span>{isRTL ? "سجل الاستيراد" : "Import Logs"}</span>
                    </button>
                </div>

                {/* ── Tab Content ── */}
                <AnimatePresence mode="wait">

                    {/* ─── TAB: CARS ─── */}
                    {activeTab === "cars" && (
                        <motion.div key="cars"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="pb-5 border-b border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">
                                        {isRTL ? "استيراد السيارات إلى المعرض" : "Import Cars to Showroom"}
                                    </h3>
                                    <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 font-mono">
                                        → /admin/cars
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isRTL
                                        ? "السيارات المستوردة ستظهر فوراً في صفحة إدارة السيارات وفي معرض العملاء."
                                        : "Imported cars will appear immediately in Cars Management and the client showroom."}
                                </p>
                            </div>

                            {/* Feature badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FeatureCard icon={ShieldCheck} color="bg-amber-500/10 text-amber-400"
                                    title={isRTL ? "مانع التكرار" : "Deduplication"}
                                    desc={isRTL ? "مفعّل تلقائياً (VIN / ID)" : "Auto (VIN / ExternalId)"} />
                                <FeatureCard icon={Zap} color="bg-blue-500/10 text-blue-400"
                                    title={isRTL ? "ضغط الصور" : "Image Compression"}
                                    desc="WebP" />
                                <FeatureCard icon={Car} color="bg-emerald-500/10 text-emerald-400"
                                    title={isRTL ? "الوجهة" : "Destination"}
                                    desc={isRTL ? "إدارة السيارات" : "Cars Management"} />
                            </div>

                            {/* URL input */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <UrlInput
                                    value={carsUrl}
                                    onChange={setCarsUrl}
                                    placeholder="https://car.encar.com/cat/car/search?..."
                                />
                            </div>

                            {/* Limit */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <LimitSelector
                                    value={carsLimit}
                                    onChange={setCarsLimit}
                                    options={[10, 20, 50, 100]}
                                    label={isRTL ? "عدد السيارات المطلوب استيرادها:" : "Number of cars to import:"}
                                />
                            </div>

                            {/* Action */}
                            <ImportButton
                                onClick={handleImportCars}
                                loading={loading}
                                label={isRTL ? `استيراد ${carsLimit} سيارة الآن` : `Import ${carsLimit} Cars Now`}
                                loadingLabel={isRTL ? "جاري الاستيراد..." : "Importing..."}
                            />

                            {/* Quick link */}
                            <NextLink href="/admin/cars"
                                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>{isRTL ? "انتقل إلى صفحة إدارة السيارات ←" : "Go to Cars Management →"}</span>
                            </NextLink>
                        </motion.div>
                    )}

                    {/* ─── TAB: PARTS ─── */}
                    {activeTab === "parts" && (
                        <motion.div key="parts"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="pb-5 border-b border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">
                                        {isRTL ? "استيراد قطع الغيار" : "Import Spare Parts"}
                                    </h3>
                                    <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30 font-mono">
                                        → /admin/parts
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isRTL
                                        ? "القطع المستوردة ستظهر في صفحة إدارة قطع الغيار مصنفةً حسب الوكالة (Mobis, OEM)."
                                        : "Imported parts will appear in Parts Management, organized by brand (Mobis, OEM, etc.)."}
                                </p>
                            </div>

                            {/* Feature badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FeatureCard icon={ShieldCheck} color="bg-amber-500/10 text-amber-400"
                                    title={isRTL ? "مانع التكرار" : "Deduplication"}
                                    desc={isRTL ? "برقم القطعة OEM" : "By OEM Part Number"} />
                                <FeatureCard icon={Package} color="bg-blue-500/10 text-blue-400"
                                    title={isRTL ? "الاستيراد" : "Import Mode"}
                                    desc={isRTL ? "شامل لجميع الأصناف" : "Full Catalog"} />
                                <FeatureCard icon={Zap} color="bg-emerald-500/10 text-emerald-400"
                                    title={isRTL ? "الوجهة" : "Destination"}
                                    desc={isRTL ? "إدارة قطع الغيار" : "Parts Management"} />
                            </div>

                            {/* URL input */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <UrlInput
                                    value={partsUrl}
                                    onChange={setPartsUrl}
                                    placeholder="https://www.autospare.com/parts/..."
                                />
                            </div>

                            {/* Info note */}
                            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-400" />
                                <p>
                                    {isRTL
                                        ? "سيقوم النظام باستيراد جميع الأصناف المتاحة تلقائياً وتصنيفها حسب الماركة والفئة. ستظهر داخل كل وكالة قطع الغيار المخصصة لها."
                                        : "The system will import all available parts automatically and organize them by brand and category under each dealer."}
                                </p>
                            </div>

                            {/* Action */}
                            <ImportButton
                                onClick={handleImportParts}
                                loading={loading}
                                label={isRTL ? "استيراد قطع الغيار الكاملة الآن" : "Import Full Parts Catalog Now"}
                                loadingLabel={isRTL ? "جاري استيراد القطع..." : "Importing parts..."}
                            />

                            {/* Quick link */}
                            <NextLink href="/admin/parts"
                                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>{isRTL ? "انتقل إلى صفحة إدارة قطع الغيار ←" : "Go to Parts Management →"}</span>
                            </NextLink>
                        </motion.div>
                    )}

                    {/* ─── TAB: AUCTIONS ─── */}
                    {activeTab === "auctions" && (
                        <motion.div key="auctions"
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="pb-5 border-b border-slate-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold text-white">
                                        {isRTL ? "استيراد المزادات المباشرة" : "Import Live Auctions"}
                                    </h3>
                                    <span className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30 font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                                        → /admin/auctions
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isRTL
                                        ? "المزادات المستوردة ستظهر مباشرةً في صفحة إدارة المزادات جاهزةً للتفعيل والمزايدة."
                                        : "Imported auctions will appear directly in Auctions Management, ready to activate and receive bids."}
                                </p>
                            </div>

                            {/* Feature badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FeatureCard icon={ShieldCheck} color="bg-amber-500/10 text-amber-400"
                                    title={isRTL ? "مانع التكرار" : "Deduplication"}
                                    desc={isRTL ? "مفعّل تلقائياً" : "Auto Enabled"} />
                                <FeatureCard icon={Zap} color="bg-red-500/10 text-red-400"
                                    title={isRTL ? "البيانات" : "Data"} 
                                    desc={isRTL ? "توقيت + سعر البداية + صور" : "Timer + Start Price + Images"} />
                                <FeatureCard icon={Gavel} color="bg-emerald-500/10 text-emerald-400"
                                    title={isRTL ? "الوجهة" : "Destination"}
                                    desc={isRTL ? "إدارة المزادات" : "Auctions Management"} />
                            </div>

                            {/* URL input */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <UrlInput
                                    value={auctionsUrl}
                                    onChange={setAuctionsUrl}
                                    placeholder="https://lotte-auction.com/auction/cars/..."
                                />
                            </div>

                            {/* Limit */}
                            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                                <LimitSelector
                                    value={auctionsLimit}
                                    onChange={setAuctionsLimit}
                                    options={[5, 10, 20, 50]}
                                    label={isRTL ? "عدد المزادات المطلوب استيرادها:" : "Number of auctions to import:"}
                                />
                            </div>

                            {/* Action */}
                            <ImportButton
                                onClick={handleImportAuctions}
                                loading={loading}
                                label={isRTL ? `استيراد ${auctionsLimit} مزاد حي الآن` : `Import ${auctionsLimit} Live Auctions Now`}
                                loadingLabel={isRTL ? "جاري استيراد المزادات..." : "Importing auctions..."}
                                color="red"
                            />

                            {/* Quick link */}
                            <NextLink href="/admin/auctions"
                                className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>{isRTL ? "انتقل إلى صفحة إدارة المزادات ←" : "Go to Auctions Management →"}</span>
                            </NextLink>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Import Result Card ── */}
                {lastResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-3xl space-y-3"
                    >
                        <div className="flex items-center gap-3 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <h4 className="font-bold">{isRTL ? "نتيجة الاستيراد:" : "Import Result:"}</h4>
                        </div>
                        <p className="text-sm text-emerald-200">{lastResult.message}</p>
                        {lastResult.stats && (
                            <div className="flex gap-4 text-sm pt-1">
                                <div className="bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
                                    <span className="text-slate-400">{isRTL ? "مستورد: " : "Imported: "}</span>
                                    <span className="font-bold text-emerald-400">+{lastResult.stats.totalImported ?? 0}</span>
                                </div>
                                <div className="bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800">
                                    <span className="text-slate-400">{isRTL ? "متجاوز (مكرر): " : "Skipped: "}</span>
                                    <span className="font-bold text-amber-400">{lastResult.stats.totalSkipped ?? 0}</span>
                                </div>
                            </div>
                        )}
                        {/* Destination link */}
                        <NextLink
                            href={lastResult.type === "cars" ? "/admin/cars" : lastResult.type === "parts" ? "/admin/parts" : "/admin/auctions"}
                            className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 pt-1"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span>{isRTL ? "عرض البيانات المستوردة ←" : "View Imported Data →"}</span>
                        </NextLink>
                    </motion.div>
                )}

                {/* ── Import Logs ── */}
                {showLogs && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-amber-400" />
                                <span>{isRTL ? "سجل عمليات الاستيراد" : "Import History Logs"}</span>
                            </h3>
                            <button onClick={loadImportLogs} disabled={logsLoading}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} />
                            </button>
                        </div>

                        {logsLoading ? (
                            <p className="text-center text-slate-400 py-8">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                            </p>
                        ) : importLogs.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{isRTL ? "لا توجد سجلات بعد" : "No logs yet"}</p>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-800">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-slate-950 text-slate-400 text-xs">
                                        <tr>
                                            <th className="p-3">{isRTL ? "التاريخ" : "Date"}</th>
                                            <th className="p-3">{isRTL ? "النوع" : "Type"}</th>
                                            <th className="p-3">{isRTL ? "مستورد" : "Imported"}</th>
                                            <th className="p-3">{isRTL ? "متجاوز" : "Skipped"}</th>
                                            <th className="p-3">{isRTL ? "الحالة" : "Status"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                        {importLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="p-3 text-xs text-slate-400 font-mono" dir="ltr">
                                                    {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                                                </td>
                                                <td className="p-3 font-bold">
                                                    {log.importType === 'showroom_cars' && <span className="text-amber-400">🚗 سيارات</span>}
                                                    {log.importType === 'parts' && <span className="text-blue-400">🔧 قطع غيار</span>}
                                                    {log.importType === 'live_auctions' && <span className="text-red-400">🔴 مزادات</span>}
                                                </td>
                                                <td className="p-3 font-bold text-emerald-400">+{log.totalImported || 0}</td>
                                                <td className="p-3 text-slate-400">{log.totalSkipped || 0}</td>
                                                <td className="p-3">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-xs font-bold border",
                                                        log.status === 'completed'
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                            : "bg-red-500/10 text-red-400 border-red-500/30"
                                                    )}>
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
