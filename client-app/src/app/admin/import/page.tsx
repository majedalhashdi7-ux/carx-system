'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Globe, Database, RefreshCw, Layers, Plus, 
    CheckCircle2, AlertOctagon, Info, Save, Activity, Car,
    Gavel, ExternalLink, ArrowRight, DollarSign, Sparkles,
    Package, History, ShieldCheck, Image as ImageIcon, Zap
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";
import ImportSystem from "@/components/admin/ImportSystem";

type ActiveTab = "showroom" | "parts" | "live_auctions" | "logs";

export default function AdminImportHub() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>("showroom");
    const [loading, setLoading] = useState(false);
    
    // --- Limits and States ---
    const [showroomLimit, setShowroomLimit] = useState<number>(20);
    const [auctionLimit, setAuctionLimit] = useState<number>(10);
    
    // --- Stats & Log Results ---
    const [lastImportResult, setLastImportResult] = useState<any>(null);
    const [importLogs, setImportLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Fetch Import Logs
    const loadImportLogs = useCallback(async () => {
        try {
            setLogsLoading(true);
            const res = await api.import.getLogs();
            if (res.success) {
                setImportLogs(res.logs || []);
            }
        } catch (err) {
            console.error("Failed to fetch import logs:", err);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImportLogs();
    }, [loadImportLogs]);

    // 🚗 Handle Showroom Cars Import
    const handleImportShowroom = async () => {
        setLoading(true);
        setLastImportResult(null);
        try {
            const res = await api.import.showroom(showroomLimit);
            if (res.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد سيارات المعرض بنجاح" : "✅ Showroom cars imported successfully"), "success");
                setLastImportResult(res);
                loadImportLogs();
            } else {
                showToast(res.error || (isRTL ? "❌ فشل استيراد سيارات المعرض" : "❌ Showroom import failed"), "error");
            }
        } catch (err: any) {
            showToast(err.message || (isRTL ? "❌ حدث خطأ غير متوقع" : "❌ Unexpected error occurred"), "error");
        } finally {
            setLoading(false);
        }
    };

    // 🔧 Handle Spare Parts Import
    const handleImportParts = async () => {
        setLoading(true);
        setLastImportResult(null);
        try {
            const res = await api.import.parts();
            if (res.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد قطع الغيار بنجاح" : "✅ Spare parts imported successfully"), "success");
                setLastImportResult(res);
                loadImportLogs();
            } else {
                showToast(res.error || (isRTL ? "❌ فشل استيراد قطع الغيار" : "❌ Parts import failed"), "error");
            }
        } catch (err: any) {
            showToast(err.message || (isRTL ? "❌ حدث خطأ غير متوقع" : "❌ Unexpected error occurred"), "error");
        } finally {
            setLoading(false);
        }
    };

    // 🔨 Handle Live Auctions Import
    const handleImportLiveAuctions = async () => {
        setLoading(true);
        setLastImportResult(null);
        try {
            const res = await api.import.liveAuctions(auctionLimit);
            if (res.success) {
                showToast(res.message || (isRTL ? "✅ تم استيراد سيارات المزادات المباشرة بنجاح" : "✅ Live auction cars imported successfully"), "success");
                setLastImportResult(res);
                loadImportLogs();
            } else {
                showToast(res.error || (isRTL ? "❌ فشل استيراد سيارات المزادات" : "❌ Auction import failed"), "error");
            }
        } catch (err: any) {
            showToast(err.message || (isRTL ? "❌ حدث خطأ غير متوقع" : "❌ Unexpected error occurred"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminPageShell
            title={isRTL ? "مركز الاستيراد المنفصل والمحسّن" : "Separated Import Hub"}
            subtitle={isRTL ? "إدارة مسارات استيراد سيارات المعرض، قطع الغيار، والمزادات المباشرة مع ضغط الصور ومنع التكرار" : "Manage separated import pipelines with image compression & duplicate prevention"}
            badge={isRTL ? "نظام V2 الذكي" : "Smart System V2"}
        >
            <div className="space-y-6 dir-rtl text-right">
                
                {/* ── Navbar / Tabs Navigation ── */}
                <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab("showroom")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                            activeTab === "showroom"
                                ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-[1.02]"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                    >
                        <Car className="w-5 h-5" />
                        <span>{isRTL ? "🚗 استيراد سيارات المعرض" : "Showroom Cars Import"}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("parts")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                            activeTab === "parts"
                                ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-[1.02]"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                    >
                        <Package className="w-5 h-5" />
                        <span>{isRTL ? "🔧 استيراد قطع الغيار الشامل" : "Comprehensive Parts Import"}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("live_auctions")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300",
                            activeTab === "live_auctions"
                                ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 scale-[1.02]"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                    >
                        <Gavel className="w-5 h-5" />
                        <span>{isRTL ? "🔴 استيراد المزادات المباشرة" : "Live Auctions Import"}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("logs")}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-300 ms-auto",
                            activeTab === "logs"
                                ? "bg-slate-800 text-amber-400 border border-amber-500/30 font-bold"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        )}
                    >
                        <History className="w-5 h-5" />
                        <span>{isRTL ? "📋 سجل وسجلات الاستيراد" : "Import Logs History"}</span>
                    </button>
                </div>

                {/* ── Active Tab Content Area ── */}
                <AnimatePresence mode="wait">
                    
                    {/* TAB 1: SHOWROOM CARS IMPORT */}
                    {activeTab === "showroom" && (
                        <motion.div
                            key="showroom-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {isRTL ? "مسار استيراد سيارات المعرض المتاحة" : "Showroom Cars Import Pipeline"}
                                        </h3>
                                        <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 font-mono">
                                            Encar Showroom
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {isRTL 
                                            ? "استيراد السيارات المتاحة في المعرض الكوري مع منع التكرار وتحديث الأسعار والافتراضات." 
                                            : "Import available cars from Encar showroom with duplicate filtering and price conversion."}
                                    </p>
                                </div>
                            </div>

                            {/* Features Banner */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">{isRTL ? "الحماية من التكرار" : "Duplicate Check"}</p>
                                        <p className="text-sm font-bold text-white">{isRTL ? "مفعل تلقائياً (VIN / ExternalId)" : "Auto Filter Enabled"}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">{isRTL ? "معالجة الصور" : "Image Processing"}</p>
                                        <p className="text-sm font-bold text-white">{isRTL ? "ضغط وتقليل سعة الصور WebP" : "WebP Compression"}</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">{isRTL ? "الحفظ والعرض" : "Retention & Sync"}</p>
                                        <p className="text-sm font-bold text-white">{isRTL ? "حفظ MongoDB دائم للعملاء" : "Instant DB Save"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Selection */}
                            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                                <label className="block text-sm font-semibold text-slate-300">
                                    {isRTL ? "تحديد عدد السيارات المطلوب استيرادها في هذه الدفعة:" : "Select number of cars to import in this batch:"}
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[10, 20, 50, 100].map(qty => (
                                        <button
                                            key={qty}
                                            type="button"
                                            onClick={() => setShowroomLimit(qty)}
                                            className={cn(
                                                "px-6 py-3 rounded-xl text-sm font-bold transition-all border",
                                                showroomLimit === qty
                                                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                                                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                                            )}
                                        >
                                            {qty} {isRTL ? "سيارة" : "Cars"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleImportShowroom}
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl",
                                    loading
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:scale-[0.99]"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>{isRTL ? "جاري استيراد وضغط صور سيارات المعرض..." : "Importing and compressing showroom cars..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span>{isRTL ? `بدء استيراد ${showroomLimit} سيارة معرض الآن` : `Start Importing ${showroomLimit} Showroom Cars Now`}</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* TAB 2: SPARE PARTS IMPORT */}
                    {activeTab === "parts" && (
                        <motion.div
                            key="parts-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {isRTL ? "مسار استيراد قطع الغيار الشامل" : "Comprehensive Parts Import Pipeline"}
                                        </h3>
                                        <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full border border-amber-500/30 font-mono">
                                            MOBIS Parts Catalog
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {isRTL 
                                            ? "استيراد شامل لجميع الفئات والأصناف مع المطابقة برقم القطعة OEM وحفظ الصور المضغوطة." 
                                            : "Comprehensive import of all OEM spare parts with image compression and part number matching."}
                                    </p>
                                </div>
                            </div>

                            {/* Info Callout */}
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3">
                                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">{isRTL ? "استيراد شامل ومكتمل" : "Full Catalog Import"}</p>
                                    <p className="text-xs text-amber-200/80 mt-1">
                                        {isRTL 
                                            ? "يقوم هذا المسار بجلب كافة قطع الغيار الكورية الأصلية (فلاتر، مساعدات، قماشات، إضاءة، رديترات) وتصنيفها فوراً لعرضها للعميل في المتجر." 
                                            : "Imports all original Korean spare parts (filters, shocks, brake pads, lighting, cooling) categorized for instant client store display."}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleImportParts}
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl",
                                    loading
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:scale-[0.99]"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>{isRTL ? "جاري استيراد كفافة قطع الغيار والأصناف..." : "Importing all spare parts catalog..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Package className="w-5 h-5" />
                                        <span>{isRTL ? "بدء الاستيراد الشامل لقطع الغيار الآن" : "Start Comprehensive Parts Import Now"}</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* TAB 3: LIVE AUCTIONS IMPORT */}
                    {activeTab === "live_auctions" && (
                        <motion.div
                            key="auctions-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {isRTL ? "مسار استيراد سيارات المزادات المباشرة" : "Live Auction Cars Import Pipeline"}
                                        </h3>
                                        <span className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30 font-mono flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                            Live Auction
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {isRTL 
                                            ? "استيراد المزادات الحية الجارية وتوقيتاتها وأعلى سعر للمزايدة وتوليد شارة المزاد الحي." 
                                            : "Import live ongoing auctions with bidding timers, starting bids, and live badges."}
                                    </p>
                                </div>
                            </div>

                            {/* Quantity Selection */}
                            <div className="bg-slate-950/60 p-6 rounded-2xl border border-slate-800 space-y-4">
                                <label className="block text-sm font-semibold text-slate-300">
                                    {isRTL ? "تحديد عدد سيارات المزادات المباشرة المطلوب استيرادها:" : "Select number of live auction cars to import:"}
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[5, 10, 20, 50].map(qty => (
                                        <button
                                            key={qty}
                                            type="button"
                                            onClick={() => setAuctionLimit(qty)}
                                            className={cn(
                                                "px-6 py-3 rounded-xl text-sm font-bold transition-all border",
                                                auctionLimit === qty
                                                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                                                    : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                                            )}
                                        >
                                            {qty} {isRTL ? "مزاد حي" : "Live Auctions"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleImportLiveAuctions}
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl",
                                    loading
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-red-500/25 active:scale-[0.99]"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        <span>{isRTL ? "جاري استيراد مزادات السيارات المباشرة..." : "Importing live auction cars..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Gavel className="w-5 h-5" />
                                        <span>{isRTL ? `بدء استيراد ${auctionLimit} سيارات مزاد مباشر الآن` : `Start Importing ${auctionLimit} Live Auctions Now`}</span>
                                    </>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {/* TAB 4: IMPORT LOGS HISTORY */}
                    {activeTab === "logs" && (
                        <motion.div
                            key="logs-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <History className="w-6 h-6 text-amber-400" />
                                    <span>{isRTL ? "سجل ودفعات الاستيراد المنفذة" : "Executed Import Logs & Batches"}</span>
                                </h3>
                                <button
                                    onClick={loadImportLogs}
                                    disabled={logsLoading}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                    <RefreshCw className={cn("w-4 h-4", logsLoading && "animate-spin")} />
                                </button>
                            </div>

                            {logsLoading ? (
                                <div className="py-12 text-center text-slate-400">
                                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                                    <p>{isRTL ? "جاري تحميل سجلات الاستيراد..." : "Loading import history logs..."}</p>
                                </div>
                            ) : importLogs.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>{isRTL ? "لا توجد سجلات استيراد سابقة" : "No prior import logs found"}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-950 text-slate-400 text-xs font-semibold">
                                            <tr>
                                                <th className="p-4">{isRTL ? "تاريخ الاستيراد" : "Date"}</th>
                                                <th className="p-4">{isRTL ? "نوع المسار" : "Pipeline Type"}</th>
                                                <th className="p-4">{isRTL ? "العدد المستورد" : "Imported"}</th>
                                                <th className="p-4">{isRTL ? "المتجاوز (مكرر)" : "Skipped"}</th>
                                                <th className="p-4">{isRTL ? "الحالة" : "Status"}</th>
                                                <th className="p-4">{isRTL ? "التفاصيل" : "Details"}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                            {importLogs.map((log) => (
                                                <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                                                    <td className="p-4 font-mono text-xs text-slate-400 dir-ltr text-right">
                                                        {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                                                    </td>
                                                    <td className="p-4 font-bold">
                                                        {log.importType === 'showroom_cars' && <span className="text-amber-400">🚗 سيارات معرض</span>}
                                                        {log.importType === 'parts' && <span className="text-blue-400">🔧 قطع غيار</span>}
                                                        {log.importType === 'live_auctions' && <span className="text-red-400">🔴 مزاد حي</span>}
                                                    </td>
                                                    <td className="p-4 font-bold text-emerald-400">+{log.totalImported || 0}</td>
                                                    <td className="p-4 text-slate-400">{log.totalSkipped || 0}</td>
                                                    <td className="p-4">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-slate-400 max-w-xs truncate">
                                                        {log.details}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Summary Result Card (If Any Batch Ran) ── */}
                {lastImportResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-950/40 border border-emerald-500/30 p-6 rounded-3xl space-y-4"
                    >
                        <div className="flex items-center gap-3 text-emerald-400">
                            <CheckCircle2 className="w-6 h-6" />
                            <h4 className="font-bold text-lg">{isRTL ? "ملخص نتيجة الدفعة الحالية:" : "Current Batch Import Summary:"}</h4>
                        </div>
                        <p className="text-sm text-emerald-200">{lastImportResult.message}</p>
                        {lastImportResult.stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 block">{isRTL ? "العدد المستورد:" : "Imported:"}</span>
                                    <span className="text-base font-bold text-emerald-400">+{lastImportResult.stats.totalImported}</span>
                                </div>
                                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 block">{isRTL ? "المتجاوز للمنع من التكرار:" : "Skipped Duplicates:"}</span>
                                    <span className="text-base font-bold text-amber-400">{lastImportResult.stats.totalSkipped}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Legacy Import System Component for Scrape URL compatibility */}
                <div className="pt-8 border-t border-slate-800">
                    <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-amber-400" />
                        <span>{isRTL ? "أداة المعاينة المباشرة من الروابط الخارجية" : "Direct External URL Preview Tool"}</span>
                    </h3>
                    <ImportSystem />
                </div>
            </div>
        </AdminPageShell>
    );
}
