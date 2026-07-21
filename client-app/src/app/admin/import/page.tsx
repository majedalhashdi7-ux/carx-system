'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Download, Globe, Database, RefreshCw, Layers, Plus, 
    CheckCircle2, AlertOctagon, Info, Save, Activity, Car,
    Gavel, ExternalLink, ArrowRight, DollarSign, Sparkles
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";
import ImportSystem from "@/components/admin/ImportSystem";
import NextLink from "next/link";

type ActiveTab = "cars" | "live_auctions" | "parts";

export default function AdminImportHub() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>("cars");
    const [loading, setLoading] = useState(false);

    // --- Cars (Encar Scraper) State ---
    const [encarUrl, setEncarUrl] = useState("");
    const [showroomSettingsLoading, setShowroomSettingsLoading] = useState(false);
    const [forceScrapingCars, setForceScrapingCars] = useState(false);
    const [carsScrapeResult, setCarsScrapeResult] = useState<{ success: boolean; msg: string; importedCars?: any[] } | null>(null);
    const [carsImportMode, setCarsImportMode] = useState<"auto" | "manual">("auto");

    // --- Live Auctions State ---
    const [auctionSessions, setAuctionSessions] = useState<any[]>([]);
    const [syncingSessionId, setSyncingSessionId] = useState<string | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [sessionUrls, setSessionUrls] = useState<Record<string, string>>({});
    const [auctionLoading, setAuctionLoading] = useState(false);
    const [syncedSessionCars, setSyncedSessionCars] = useState<Record<string, any[]>>({}); // session._id -> imported cars

    // --- Parts (Autospare Scraper) State ---
    const [partsImportMode, setPartsImportMode] = useState<"auto" | "manual">("auto");
    const [forceScrapingParts, setForceScrapingParts] = useState(false);
    const [fixingPartsLinks, setFixingPartsLinks] = useState(false);
    const [partsScrapeResult, setPartsScrapeResult] = useState<{ success: boolean; msg: string; brandsCreated?: number; partsCreated?: number } | null>(null);

    // --- Load Encar & Live Auction data ---
    const loadEncarSettings = useCallback(async () => {
        try {
            setShowroomSettingsLoading(true);
            const res = await api.showroom.getSettings();
            if (res.success) {
                setEncarUrl(res.data?.encarUrl || "");
            }
        } catch (err) {
            console.error("Failed to load Encar settings:", err);
        } finally {
            setShowroomSettingsLoading(false);
        }
    }, []);

    const loadAuctionSessions = useCallback(async () => {
        try {
            setAuctionLoading(true);
            const res = await api.liveAuctions.list();
            if (res.success) {
                setAuctionSessions(res.data || []);
                const urls: Record<string, string> = {};
                res.data?.forEach((s: any) => {
                    if (s && s._id) {
                        urls[s._id] = s.externalUrl || "";
                    }
                });
                setSessionUrls(urls);
            }
        } catch (err) {
            console.error("Failed to load auction sessions:", err);
        } finally {
            setAuctionLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEncarSettings();
        loadAuctionSessions();
    }, [loadEncarSettings, loadAuctionSessions]);

    // --- Encar Scrape Handlers ---
    const handleSaveEncarUrl = async () => {
        if (!encarUrl.includes("encar.com")) {
            showToast(isRTL ? "❌ يجب أن يكون الرابط من موقع car.encar.com" : "❌ URL must be from car.encar.com", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await api.showroom.updateSettings({ encarUrl });
            if (res.success) {
                showToast(isRTL ? "✅ تم حفظ رابط المعرض بنجاح" : "✅ Showroom URL saved successfully", "success");
            } else {
                showToast(res.message || "Failed", "error");
            }
        } catch (err: any) {
            showToast(err.message || "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleForceScrapeCars = async () => {
        setForceScrapingCars(true);
        setCarsScrapeResult(null);
        showToast(isRTL ? "⏳ جاري بدء استيراد السيارات..." : "⏳ Starting cars import scraper...", "info");
        try {
            const res = await api.showroom.scrape();
            if (res.success) {
                // Fetch the recently-imported cars to show in results
                let importedCars: any[] = [];
                try {
                    const recentRes = await api.cars.list({ page: 1, limit: 12 });
                    if (recentRes.success) importedCars = recentRes.data?.cars || [];
                } catch {}
                setCarsScrapeResult({ success: true, msg: res.message, importedCars });
                showToast(res.message || "Done", "success");
            } else {
                setCarsScrapeResult({ success: false, msg: res.message || "Error" });
                showToast(res.message || "Failed", "error");
            }
        } catch (err: any) {
            setCarsScrapeResult({ success: false, msg: err.message || "Scraping failed" });
            showToast(err.message || "Error", "error");
        } finally {
            setForceScrapingCars(false);
        }
    };

    // --- Live Auction Sync Handlers ---
    const handleUpdateAuctionUrl = async (id: string) => {
        const url = sessionUrls[id];
        if (!url || !url.startsWith("http")) {
            showToast(isRTL ? "❌ يرجى إدخال رابط صحيح للمزاد" : "❌ Please enter a valid auction URL", "error");
            return;
        }

        setEditingSessionId(id);
        try {
            // Fetch session info, update its externalUrl, and update back
            const sessionRes = await api.liveAuctions.getById(id);
            if (sessionRes.success) {
                const currentData = sessionRes.data;
                const updatedData = {
                    ...currentData,
                    externalUrl: url.trim()
                };
                const updateRes = await api.liveAuctions.update(id, updatedData);
                if (updateRes.success) {
                    showToast(isRTL ? "✅ تم تحديث وحفظ رابط المزاد بنجاح" : "✅ Auction URL updated successfully", "success");
                    loadAuctionSessions();
                } else {
                    showToast(updateRes.error || "Update failed", "error");
                }
            }
        } catch (err: any) {
            showToast(err.message || "Connection error", "error");
        } finally {
            setEditingSessionId(null);
        }
    };

    const handleSyncAuction = async (id: string) => {
        const url = sessionUrls[id];
        if (!url) {
            showToast(isRTL ? "❌ لا يوجد رابط مزاد خارجي مسجل" : "❌ No external URL registered for this session", "error");
            return;
        }

        setSyncingSessionId(id);
        showToast(isRTL ? "⏳ جاري استيراد وتزامن سيارات المزاد المباشر..." : "⏳ Scraping & syncing live auction cars...", "info");
        try {
            const sessionRes = await api.liveAuctions.getById(id);
            if (sessionRes.success) {
                const currentData = sessionRes.data;
                const updatedData = { ...currentData, externalUrl: url.trim() };
                await api.liveAuctions.update(id, updatedData);
            }

            const res = await (api.liveAuctions as any).importExternal(id);
            if (res.success) {
                showToast(isRTL ? `✅ ${res.message}` : `✅ ${res.message}`, "success");
                // Store the cars imported for display
                const freshSession = await api.liveAuctions.getById(id);
                if (freshSession.success) {
                    const carsArr = freshSession.data?.cars || [];
                    setSyncedSessionCars(prev => ({ ...prev, [id]: carsArr }));
                }
                loadAuctionSessions();
            } else {
                showToast(res.error || "Import failed", "error");
            }
        } catch (err: any) {
            showToast(err.message || "Error during import", "error");
        } finally {
            setSyncingSessionId(null);
        }
    };

    // --- Spare Parts Sync Handlers ---
    const handleForceScrapeParts = async () => {
        const targetUrl = partsCatalogUrl || "https://autospare.com.eg/brands";
        if (!confirm(isRTL ? `هل تريد بدء استيراد الوكالات وقطع الغيار والصور من: ${targetUrl}؟ قد تستغرق العملية دقيقة.` : `Do you want to scrape brands & parts from: ${targetUrl}? This might take a minute.`)) return;
        setForceScrapingParts(true);
        setPartsScrapeResult(null);
        showToast(isRTL ? "⏳ جاري استيراد الوكالات وقطع الغيار والصور..." : "⏳ Scraping brands & parts catalog...", "info");
        try {
            const res = await api.parts.scrape({ targetUrl });
            if (res.success) {
                const brandsCreated = res.stats?.brandsCreated || 0;
                const partsCreated = res.stats?.partsCreated || 0;
                const msg = res.message || (isRTL 
                    ? `✅ اكتمل جلب قطع الغيار! وكالات جديدة: ${brandsCreated} | قطع جديدة: ${partsCreated}`
                    : `✅ Scrape complete! Brands: ${brandsCreated} new | Parts: ${partsCreated} new`);
                setPartsScrapeResult({ 
                    success: true, 
                    msg, 
                    brandsCreated, 
                    partsCreated,
                    brands: res.brands || [],
                    parts: res.parts || []
                });
                showToast(isRTL ? "✅ اكتمل الاستيراد بنجاح!" : "✅ Import complete!", "success");
            } else {
                setPartsScrapeResult({ success: false, msg: res.error || "Scraping failed" });
                showToast(res.error || "Failed", "error");
            }
        } catch (err: any) {
            setPartsScrapeResult({ success: false, msg: err.message || "Connection failed" });
            showToast(err.message || "Error", "error");
        } finally {
            setForceScrapingParts(false);
        }
    };

    const handleFixPartsLinks = async () => {
        setFixingPartsLinks(true);
        try {
            const token = localStorage.getItem("hm_token");
            const res = await fetch("/api/v2/parts/fix-brand-links", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.success) {
                showToast(data.message || "Done", "success");
            } else {
                showToast(data.error || "Failed", "error");
            }
        } catch {
            showToast("Error", "error");
        } finally {
            setFixingPartsLinks(false);
        }
    };

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden bg-[#070711]" dir={isRTL ? "rtl" : "ltr"}>
            <AdminPageShell
                icon={Download}
                accentColor="blue"
                title={isRTL ? "بوابة الاستيراد الذكي" : "SMART IMPORT HUB"}
                titleEn="DATA SCRAPER HUB"
                subtitle={isRTL ? "استورد السيارات وقطع الغيار والمزادات المباشرة من المواقع العالمية بنقرة واحدة" : "Consolidated scraping portal for vehicles, live auctions, and spare parts"}
                backHref="/admin/dashboard"
                isRTL={isRTL}
                stats={[
                    { label: isRTL ? "جلسات المزاد المباشر" : "LIVE SESSIONS", value: auctionSessions.length, color: "text-blue-400" }
                ]}
            >
                {/* --- NAVIGATION SEGMENTS --- */}
                <div className="flex border-b border-white/5 mb-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("cars")}
                        className={cn(
                            "py-4 px-6 text-xs font-black tracking-widest uppercase border-b-2 transition-all flex items-center gap-2",
                            activeTab === "cars"
                                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                                : "border-transparent text-white/40 hover:text-white/80"
                        )}
                    >
                        <Car className="w-4 h-4" />
                        {isRTL ? "استيراد السيارات الكورية" : "KOREAN CARS (ENCAR)"}
                    </button>
                    <button
                        onClick={() => setActiveTab("live_auctions")}
                        className={cn(
                            "py-4 px-6 text-xs font-black tracking-widest uppercase border-b-2 transition-all flex items-center gap-2",
                            activeTab === "live_auctions"
                                ? "border-red-500 text-red-400 bg-red-500/5"
                                : "border-transparent text-white/40 hover:text-white/80"
                        )}
                    >
                        <Gavel className="w-4 h-4" />
                        {isRTL ? "استيراد المزاد المباشر" : "LIVE AUCTION SESSIONS"}
                    </button>
                    <button
                        onClick={() => setActiveTab("parts")}
                        className={cn(
                            "py-4 px-6 text-xs font-black tracking-widest uppercase border-b-2 transition-all flex items-center gap-2",
                            activeTab === "parts"
                                ? "border-orange-500 text-orange-400 bg-orange-500/5"
                                : "border-transparent text-white/40 hover:text-white/80"
                        )}
                    >
                        <Layers className="w-4 h-4" />
                        {isRTL ? "استيراد قطع الغيار" : "SPARE PARTS"}
                    </button>
                </div>

                {/* --- TAB CONTENT AREA --- */}
                <AnimatePresence mode="wait">
                    {/* 🚗 ENCAR CARS TAB */}
                    {activeTab === "cars" && (
                        <motion.div
                            key="cars-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-lg font-black tracking-wide">{isRTL ? "استيراد سيارات Encar الكورية" : "Korean Cars Import Scraper"}</h2>
                                    <p className="text-white/40 text-[11px] mt-1">{isRTL ? "يدعم الاستيراد التلقائي للمجموعات أو إدخال روابط لسيارات منفصلة وتعديل بياناتها" : "Scrape large lists of cars or manually import single Encar links with detail pre-editing"}</p>
                                </div>
                                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setCarsImportMode("auto")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", carsImportMode === "auto" ? "bg-blue-500 text-black shadow-lg" : "text-white/55 hover:text-white")}
                                    >
                                        {isRTL ? "تزامن تلقائي (مجموعات)" : "AUTO BULK SYNC"}
                                    </button>
                                    <button
                                        onClick={() => setCarsImportMode("manual")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", carsImportMode === "manual" ? "bg-blue-500 text-black shadow-lg" : "text-white/55 hover:text-white")}
                                    >
                                        {isRTL ? "رابط يدوي (سيارة واحدة)" : "MANUAL LINK"}
                                    </button>
                                </div>
                            </div>

                            {carsImportMode === "auto" ? (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    <div className="xl:col-span-2 ck-card p-6 border-blue-500/10 bg-blue-500/2">
                                        <h3 className="text-xs font-black tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            {isRTL ? "تحديث رابط قائمة البحث الكورية" : "TARGET ENCAR SEARCH LINK"}
                                        </h3>
                                        <p className="text-[10px] text-white/50 mb-4 leading-relaxed">
                                            {isRTL ? "الصق رابط نتائج البحث من موقع Encar.com. سيقوم السكرابر بقراءة نتائج البحث هذه واستيراد السيارات المضافة مؤخراً إلى المعرض الكوري." : "Paste a search result listing page URL from car.encar.com. The automated scraper uses this URL query parameters to pull real-time assets."}
                                        </p>
                                        <textarea
                                            value={encarUrl}
                                            onChange={(e) => setEncarUrl(e.target.value)}
                                            placeholder="https://car.encar.com/list/car?page=1&search=..."
                                            title={isRTL ? "رابط البحث" : "Search URL"}
                                            className="ck-input w-full h-28 resize-none font-mono text-[11px] bg-black/40 border-white/5 p-4 focus:border-blue-500/40 rounded-xl"
                                            dir="ltr"
                                        />
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={handleSaveEncarUrl}
                                                disabled={loading || showroomSettingsLoading}
                                                className="ck-btn-primary bg-blue-500 text-black hover:bg-blue-400 h-11 text-xs font-black uppercase tracking-wider flex-1"
                                            >
                                                {loading ? (isRTL ? "جاري الحفظ..." : "SAVING...") : (isRTL ? "حفظ رابط البحث" : "SAVE LINK")}
                                            </button>
                                            <button
                                                onClick={handleForceScrapeCars}
                                                disabled={forceScrapingCars || !encarUrl}
                                                className="ck-btn-primary bg-white/5 border border-white/10 hover:border-blue-500/30 text-white h-11 text-xs font-black uppercase tracking-wider flex-1"
                                            >
                                                {forceScrapingCars ? (isRTL ? "جاري الجلب والاستيراد..." : "SCRAPING & SYNCING...") : (isRTL ? "تشغيل السكرابر وجلب السيارات" : "FORCE SYNC CARS")}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="ck-card p-6 border-white/5 bg-white/2">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest mb-3 text-white/50">{isRTL ? "حالة السكرابر الكوري" : "SCRAPER STATUS"}</h4>
                                            <div className="flex items-center gap-3 py-1">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                                </span>
                                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">{isRTL ? "متاح للتشغيل" : "READY"}</span>
                                            </div>
                                            <div className="text-[10px] text-white/40 leading-relaxed mt-3">
                                                {isRTL ? "تزامن تلقائي دوري كل ساعة أو يدوي فوري لتحديث آخر الموديلات." : "Auto syncs every hour to ensure data fresh, or force run immediately above."}
                                            </div>
                                        </div>

                                        {carsScrapeResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-xs font-black tracking-wide leading-relaxed shadow-lg",
                                                    carsScrapeResult.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}
                                            >
                                                <h5 className="uppercase text-[9px] tracking-widest opacity-60 mb-2">{isRTL ? "تقرير الجلب الأخير:" : "LATEST SCRAPE REPORT:"}</h5>
                                                {carsScrapeResult.msg}
                                                {carsScrapeResult.importedCars && carsScrapeResult.importedCars.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="text-[9px] text-white/40 uppercase tracking-widest mb-3">{isRTL ? `السيارات المستوردة الأخيرة (${carsScrapeResult.importedCars.length}):` : `RECENTLY IMPORTED CARS (${carsScrapeResult.importedCars.length}):`}</div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {carsScrapeResult.importedCars.slice(0, 8).map((car: any, i: number) => (
                                                                <div key={i} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
                                                                    {car.images?.[0] && <img src={car.images[0]} alt={car.title || ''} className="w-10 h-8 object-cover rounded" />}
                                                                    <div className="truncate">
                                                                        <div className="text-[9px] font-bold truncate text-white/80">{car.title || `${car.make} ${car.model}`}</div>
                                                                        <div className="text-[8px] text-white/40">{car.year} • {car.price?.toLocaleString()} SAR</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                    <ImportSystem type="car" />
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ⚡ LIVE AUCTIONS TAB */}
                    {activeTab === "live_auctions" && (
                        <motion.div
                            key="live-auctions-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-lg font-black tracking-wide">{isRTL ? "استيراد وتزامن المزاد المباشر" : "Live Auction Sessions Synchronization"}</h2>
                                <p className="text-white/40 text-[11px] mt-1">{isRTL ? "حدث روابط المزادات الخارجية واستورد سياراتها لعمل مبيعات بث مباشر فوري" : "Update external live auction links and scrape/sync catalog directly for real-time live events"}</p>
                            </div>

                            {auctionLoading ? (
                                <div className="py-16 text-center text-white/30 text-xs font-black uppercase tracking-widest animate-pulse">
                                    {isRTL ? "جاري تحميل جلسات المزاد المباشر..." : "LOADING AUCTION SESSIONS..."}
                                </div>
                            ) : auctionSessions.length === 0 ? (
                                <div className="p-16 text-center bg-black/40 rounded-3xl border border-white/5">
                                    <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-6">{isRTL ? "لا توجد جلسات مزاد مباشر نشطة حالياً" : "NO ACTIVE LIVE AUCTION SESSIONS FOUND"}</p>
                                    <NextLink href="/admin/live-auctions" className="ck-btn-primary bg-red-500 text-black font-black text-[10px] tracking-widest uppercase hover:bg-red-400 px-6 py-3 inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        {isRTL ? "إنشاء جلسة مزاد جديدة" : "CREATE NEW SESSION"}
                                    </NextLink>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {auctionSessions.map((session) => {
                                        if (!session) return null;
                                        const carsArray = Array.isArray(session.cars) ? session.cars.filter(Boolean) : [];
                                        const totalCars = carsArray.length;
                                        const visibleCars = carsArray.filter((c: any) => c && !c.isHidden).length;
                                        const isSyncing = syncingSessionId === session._id;
                                        const isSaving = editingSessionId === session._id;
                                        const importedSessionCars = syncedSessionCars[session._id] || [];

                                        return (
                                            <div key={session._id} className="ck-card p-6 border-red-500/10 bg-red-500/2 hover:border-red-500/20 transition-all">
                                                <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                                                    <div>
                                                        <h3 className="text-sm font-black tracking-wide">{session.title}</h3>
                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                                                                session.status === "live" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                                session.status === "upcoming" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                                "bg-white/5 border-white/10 text-white/30"
                                                            )}>
                                                                {session.status === "live" ? (isRTL ? "مباشر الآن" : "LIVE NOW") :
                                                                 session.status === "upcoming" ? (isRTL ? "قادم" : "UPCOMING") : (isRTL ? "منتهي" : "ENDED")}
                                                            </span>
                                                            <span className="text-[10px] text-white/40">
                                                                {isRTL ? "إجمالي السيارات المستوردة:" : "Synced cars:"} <span className="font-bold text-white/80">{totalCars} ({visibleCars} {isRTL ? "نشطة" : "visible"})</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateAuctionUrl(session._id)}
                                                            disabled={isSaving || isSyncing}
                                                            className="px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                            {isSaving ? (isRTL ? "جاري الحفظ..." : "SAVING...") : (isRTL ? "حفظ الرابط" : "SAVE URL")}
                                                        </button>
                                                        <button
                                                            onClick={() => handleSyncAuction(session._id)}
                                                            disabled={isSyncing || isSaving}
                                                            className="px-4 h-10 rounded-xl bg-red-500 text-black hover:bg-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                                        >
                                                            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                                                            {isSyncing ? (isRTL ? "جاري الاستيراد..." : "SCRAPING...") : (isRTL ? "استيراد وتزامن السيارات" : "IMPORT & SYNC")}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block">{isRTL ? "رابط المزاد الخارجي المستهدف لسيارات الجلسة" : "TARGET EXTERNAL AUCTION SESSION LINK"}</label>
                                                    <input
                                                        type="url"
                                                        value={sessionUrls[session._id] || ""}
                                                        onChange={(e) => setSessionUrls({ ...sessionUrls, [session._id]: e.target.value })}
                                                        placeholder="https://copart.com/lot/... or any auction provider link"
                                                        title={isRTL ? "رابط المزاد الخارجي" : "External Auction URL"}
                                                        className="ck-input w-full h-11 bg-black/40 pl-4 font-mono text-[11px] focus:border-red-500/40 rounded-xl"
                                                        dir="ltr"
                                                    />
                                                </div>

                                                {/* Synced cars preview */}
                                                {importedSessionCars.length > 0 && (
                                                    <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/5">
                                                        <div className="text-[9px] text-white/40 uppercase tracking-widest mb-3">{isRTL ? `السيارات المستوردة لهذه الجلسة (${importedSessionCars.length}):` : `SYNCED CARS IN THIS SESSION (${importedSessionCars.length}):`}</div>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {importedSessionCars.slice(0, 6).map((car: any, i: number) => (
                                                                <div key={i} className="p-2 bg-black/40 rounded-lg border border-white/5">
                                                                    <div className="text-[9px] font-bold text-white/70 truncate">{car.title || `${car.make} ${car.model}`}</div>
                                                                    <div className="text-[8px] text-white/40 mt-1">{car.year} • {(car.price || 0).toLocaleString()} SAR</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* 🔧 SPARE PARTS TAB */}
                    {activeTab === "parts" && (
                        <motion.div
                            key="parts-tab"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h2 className="text-lg font-black tracking-wide">{isRTL ? "استيراد وتزامن قطع الغيار" : "Spare Parts Import Hub"}</h2>
                                    <p className="text-white/40 text-[11px] mt-1">{isRTL ? "استورد قطع الغيار بالكامل من autospare مع ضغط الصور ووضع العلامة المائية تلقائياً" : "Scrape spare parts collections from autospare with automated logo watermarking & compression"}</p>
                                </div>
                                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <button
                                        onClick={() => setPartsImportMode("auto")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", partsImportMode === "auto" ? "bg-orange-500 text-black shadow-lg" : "text-white/55 hover:text-white")}
                                    >
                                        {isRTL ? "تزامن تلقائي (كامل)" : "AUTO SYNC ALL"}
                                    </button>
                                    <button
                                        onClick={() => setPartsImportMode("manual")}
                                        className={cn("px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all", partsImportMode === "manual" ? "bg-orange-500 text-black shadow-lg" : "text-white/55 hover:text-white")}
                                    >
                                        {isRTL ? "رابط يدوي (قطعة واحدة)" : "MANUAL LINK"}
                                    </button>
                                </div>
                            </div>

                            {partsImportMode === "auto" ? (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    <div className="xl:col-span-2 ck-card p-8 border-orange-500/10 bg-orange-500/2 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black tracking-widest text-orange-400 flex items-center gap-2">
                                                <Globe className="w-4 h-4" />
                                                {isRTL ? "رابط موقع قطع الغيار والوكالات المستهدف" : "TARGET SPARE PARTS & BRANDS CATALOG URL"}
                                            </h3>
                                        </div>

                                        <p className="text-[11px] text-white/50 leading-relaxed">
                                            {isRTL ? "أدخل رابط موقع قطع الغيار الذي تريد الاستيراد منه (مثال: https://autospare.com.eg/brands). سيتم استخراج الوكالات مع شعاراتها وقطع الغيار مع الصور كاملة وتخزينها تلقائياً." : "Enter any spare parts catalog URL (e.g. https://autospare.com.eg/brands). All agencies with logos & spare parts with full images will be extracted & saved automatically."}
                                        </p>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">
                                                {isRTL ? "رابط دليل قطع الغيار والمكتشف" : "PARTS CATALOG URL"}
                                            </label>
                                            <input
                                                type="url"
                                                value={partsCatalogUrl}
                                                onChange={(e) => setPartsCatalogUrl(e.target.value)}
                                                placeholder="https://autospare.com.eg/brands"
                                                title={isRTL ? "رابط موقع قطع الغيار" : "Spare Parts Catalog URL"}
                                                className="ck-input w-full h-12 bg-black/40 px-4 font-mono text-[11px] focus:border-orange-500/40 rounded-xl"
                                                dir="ltr"
                                            />
                                        </div>

                                        <div className="flex gap-3 flex-wrap pt-2">
                                            <button
                                                onClick={handleForceScrapeParts}
                                                disabled={forceScrapingParts}
                                                className="ck-btn-primary bg-orange-500 text-black hover:bg-orange-400 h-12 text-xs font-black uppercase tracking-wider flex-1 whitespace-nowrap min-w-[200px]"
                                            >
                                                {forceScrapingParts ? (isRTL ? "جاري استيراد الوكالات والقطع..." : "SCRAPING BRANDS & PARTS...") : (isRTL ? "بدء استيراد الوكالات وقطع الغيار والصور" : "START BRANDS & PARTS IMPORT")}
                                            </button>
                                            <button
                                                onClick={handleFixPartsLinks}
                                                disabled={fixingPartsLinks}
                                                className="ck-btn-primary bg-white/5 border border-white/10 hover:border-orange-500/30 text-white h-12 text-xs font-black uppercase tracking-wider flex-1 whitespace-nowrap min-w-[200px]"
                                            >
                                                {fixingPartsLinks ? (isRTL ? "جاري ربط الوكالات..." : "FIXING BRAND LINKS...") : (isRTL ? "ربط قطع الغيار بالوكالات تلقائياً" : "FIX BRAND LINKS")}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="ck-card p-6 border-white/5 bg-white/2">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest mb-3 text-white/50">{isRTL ? "ميزات الاستيراد الذكي" : "SMART IMPORT FEATURES"}</h4>
                                            <ul className="text-[10px] text-white/40 leading-relaxed list-disc list-inside space-y-2">
                                                <li>{isRTL ? "استيراد شعارات الوكالات بجودة HD وصور القطع كاملة" : "Import HD agency logos & full spare part product images"}</li>
                                                <li>{isRTL ? "ترجمة تلقائية للأسماء والتصنيفات إلى العربية" : "Automatic Arabic translation for names & categories"}</li>
                                                <li>{isRTL ? "ربط قطع الغيار تلقائياً بالوكالة الخاصة بها" : "Automatically link spare parts to their respective Brand ID"}</li>
                                                <li>{isRTL ? "تأطير وحفظ الصور محلياً مع تحسين الأداء" : "Local image optimization & watermarking"}</li>
                                            </ul>
                                        </div>

                                        {partsScrapeResult && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className={cn(
                                                    "p-5 rounded-2xl border text-xs font-black tracking-wide leading-relaxed shadow-lg space-y-4",
                                                    partsScrapeResult.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}
                                            >
                                                <div>
                                                    <h5 className="uppercase text-[9px] tracking-widest opacity-60 mb-1">{isRTL ? "تقرير استيراد قطع الغيار:" : "PARTS IMPORT REPORT:"}</h5>
                                                    <p>{partsScrapeResult.msg}</p>
                                                </div>

                                                {/* Visual preview of imported brands */}
                                                {partsScrapeResult.brands && partsScrapeResult.brands.length > 0 && (
                                                    <div className="pt-2 border-t border-white/10">
                                                        <div className="text-[9px] text-white/50 uppercase tracking-widest mb-2">{isRTL ? `الوكالات المستوردة (${partsScrapeResult.brands.length}):` : `IMPORTED BRANDS (${partsScrapeResult.brands.length}):`}</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {partsScrapeResult.brands.slice(0, 10).map((b: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 rounded-lg border border-white/10 text-white text-[9px] font-bold">
                                                                    {b.logoUrl && <img src={b.logoUrl} alt={b.name} className="w-4 h-4 object-contain rounded" />}
                                                                    <span>{b.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Visual preview of imported parts */}
                                                {partsScrapeResult.parts && partsScrapeResult.parts.length > 0 && (
                                                    <div className="pt-2 border-t border-white/10">
                                                        <div className="text-[9px] text-white/50 uppercase tracking-widest mb-2">{isRTL ? `معاينة القطع المستوردة بالصور (${partsScrapeResult.parts.length}):` : `IMPORTED PARTS PREVIEW (${partsScrapeResult.parts.length}):`}</div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {partsScrapeResult.parts.slice(0, 6).map((part: any, idx: number) => (
                                                                <div key={idx} className="p-2 bg-black/40 rounded-lg border border-white/10 flex items-center gap-2">
                                                                    {(part.images?.[0] || part.img || part.image) && (
                                                                        <img src={part.images?.[0] || part.img || part.image} alt={part.name} className="w-10 h-10 object-cover rounded-md shrink-0 bg-white/5" />
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <div className="text-[9px] font-bold text-white truncate">{part.nameAr || part.name}</div>
                                                                        <div className="text-[8px] text-orange-400 font-bold">{part.carMake} • {part.price} SAR</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                    <ImportSystem type="part" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </AdminPageShell>
        </div>
    );
}
