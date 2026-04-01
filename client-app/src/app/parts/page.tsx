'use client';

/**
 * صفحة قطع الغيار (Spare Parts Page)
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, AlertCircle, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import UltraModernPartCard from "@/components/UltraModernPartCard";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useSettings } from "@/lib/SettingsContext";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import ProductModal, { type ProductModalData } from "@/components/ProductModal";

// --- Types ---
interface Part {
    id?: string;
    _id: string;
    name: string;
    nameEn?: string;  // الاسم بالإنجليزية
    nameAr?: string;
    brand: string;
    model: string;
    price: number;
    images?: string[];
    img?: string;
    image?: string;
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    category: string;
    categoryAr?: string;
    stockQty: number;
    compatibility: string[];
    carMakeEn?: string;  // الماركة بالإنجليزية
    carModelEn?: string; // الموديل بالإنجليزية
}

function resolvePartImage(part: Part): string {
    const candidate = part.img || part.image || part.images?.[0] || '';
    const normalized = typeof candidate === 'string' ? candidate.trim() : '';
    return normalized || '/images/placeholder.jpg';
}

interface Agency {
    id: string;
    brandId?: string;
    name: string;    // الاسم العربي
    nameEn?: string; // الاسم الإنجليزي
    logo: string;
    models: string[];
    modelsEn?: string[]; // الموديلات بالإنجليزية (مستقبلاً)
}

export default function PartsPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice: formatGlobalPrice, socialLinks } = useSettings();
    const formatPrice = (price: number) => formatGlobalPrice(Number(price || 0), undefined, 'part');
    const { isLoggedIn } = useAuth();
    // رقم الواتساب - يستخدم رقم الأدمن من الإعدادات أو الرقم الافتراضي
    const WHATSAPP_NUMBER = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');
    // حالة المودال (المنبثق) - null تعني مغلق، وبيانات الكائن تعني مفتوح
    const [modalProduct, setModalProduct] = useState<ProductModalData | null>(null);

    const [viewMode, setViewMode] = useState<'AGENCIES' | 'PARTS'>('AGENCIES');
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('ALL'); // 'ALL' = show all models

    const [agencySearchQuery, setAgencySearchQuery] = useState(''); // [[ARABIC_COMMENT]] بحث الوكالات منفصل
    const [partSearchQuery, setPartSearchQuery] = useState('');    // [[ARABIC_COMMENT]] بحث القطع منفصل
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Agencies from API (Parts brands) ---
    const [agencies, setAgencies] = useState<Agency[]>([]);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                // 1. جلب الوكالات المخصصة لقطع الغيار - نعرضها فوراً
                const res = await api.brands.list('parts');
                const hasBrands = res?.success && Array.isArray(res.brands) && res.brands.length > 0;

                if (hasBrands) {
                    // عرض الوكالات فوراً بدون فلتر
                    setAgencies(res.brands.map((b: any) => ({
                        id: b._id,
                        brandId: b._id,
                        name: b.name,
                        nameEn: b.nameEn || b.name, // الاسم الإنجليزي
                        logo: b.logoUrl || '/images/placeholder.jpg',
                        models: []
                    })));
                }

                // 2. جلب القطع لبناء قائمة الموديلات الحقيقية
                const partsRes = await api.parts.list({ limit: 2000 });
                const allParts: any[] = partsRes?.parts || [];

                if (hasBrands && allParts.length > 0) {
                    // بناء خريطة: brand._id => Set of carModels
                    const brandModelsMap: Record<string, Set<string>> = {};
                    allParts.forEach((p: any) => {
                        const rawBrand = p.brand;
                        // نحاول استخراج brandId بأكثر من طريقة
                        const brandId = rawBrand?._id
                            ? String(rawBrand._id)
                            : (typeof rawBrand === 'string' && rawBrand.length === 24 ? rawBrand : null);
                        if (!brandId) return;
                        if (!brandModelsMap[brandId]) brandModelsMap[brandId] = new Set();
                        if (p.carModel) brandModelsMap[brandId].add(p.carModel);
                    });

                    // تحديث الوكالات بالموديلات الحقيقية (نُظهر الجميع بغض النظر عن عدد القطع)
                    setAgencies(res.brands.map((b: any) => ({
                        id: b._id,
                        brandId: b._id,
                        name: b.name,
                        nameEn: b.nameEn || b.name,
                        logo: b.logoUrl || '/images/placeholder.jpg',
                        models: Array.from(brandModelsMap[String(b._id)] || new Set())
                    })));
                } else if (!hasBrands && allParts.length > 0) {
                    // Fallback: group by carMake إذا لا توجد وكالات مسجلة
                    const makeMap: Record<string, { logo: string; brandId?: string; models: Set<string> }> = {};
                    allParts.forEach((p: any) => {
                        const rawBrand = p.brand;
                        const brandId = rawBrand?._id ? String(rawBrand._id) : undefined;
                        const brandName = (rawBrand && typeof rawBrand === 'object' && rawBrand.name)
                            ? rawBrand.name
                            : (typeof rawBrand === 'string' && rawBrand.length < 30 ? rawBrand : null);
                        const make = brandName || p.carMake || '';
                        if (!make || make === 'غير محدد') return;
                        if (!makeMap[make]) makeMap[make] = { logo: rawBrand?.logoUrl || '/images/placeholder.jpg', brandId, models: new Set() };
                        if (p.carModel) makeMap[make].models.add(p.carModel);
                    });
                    setAgencies(Object.entries(makeMap).map(([name, val]) => ({
                        id: val.brandId || name,
                        brandId: val.brandId,
                        name,
                        logo: val.logo,
                        models: Array.from(val.models)
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch agencies", err);
            }
        };
        fetchAgencies();
    }, [isRTL]);

    // عند اختيار وكالة: نذهب مباشرة لعرض القطع (بدون شاشة الموديلات)
    const handleAgencySelect = (agency: Agency) => {
        setSelectedAgency(agency);
        setSelectedModel('ALL');
        setViewMode('PARTS');
        loadParts(agency);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // عند اختيار موديل (من الفلاتر العلوية): نُفلتر القطع المحملة مسبقاً
    const handleModelFilter = (model: string) => {
        setSelectedModel(model);
        // القطع محملة مسبقاً — لا نحتاج API call جديد، نُفلتر فقط
    };

    const loadParts = async (agency: Agency) => {
        setLoading(true);
        setPartSearchQuery('');
        try {
            const params: Record<string, string | number> = { limit: 500 };
            if (agency.brandId) {
                params.brandId = agency.brandId;
            } else {
                params.brand = agency.name;
            }
            // نجلب كل القطع دفعةً واحدة - الفلتر يتم في الـ Frontend
            const res = await api.parts.list(params);
            const allParts = res?.parts || res?.data?.parts || [];
            setParts(allParts);
        } catch (error) {
            console.error("Failed to load parts", error);
            setParts([]);
        } finally {
            setLoading(false);
        }
    };

    const resetToAgencies = () => {
        setViewMode('AGENCIES');
        setSelectedAgency(null);
        setSelectedModel('ALL');
        setAgencySearchQuery('');
        setPartSearchQuery('');
        setParts([]);
    };

    // الموديلات المتاحة من القطع المحملة
    const availableModels: string[] = Array.from(
        new Set(parts.map((p: any) => p.carModel).filter(Boolean))
    ).sort();

    // [[ARABIC_COMMENT]] فلتر الوكالات بالاسمين العربي والإنجليزي
    const filteredAgencies = agencies.filter(a => {
        const q = agencySearchQuery.toLowerCase();
        if (!q) return true;
        return a.name.toLowerCase().includes(q) || (a.nameEn || '').toLowerCase().includes(q);
    });
    const filteredParts = parts.filter((part: any) => {
        if (selectedModel !== 'ALL' && part.carModel !== selectedModel) return false;
        const q = partSearchQuery.trim().toLowerCase();
        if (!q) return true;
        return [part.nameAr, part.nameEn, part.name, part.brand, part.carModel, part.category, part.categoryAr]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));
    });

    // اسم الوكالة حسب اللغة
    const getAgencyDisplayName = (agency: Agency) =>
        (!isRTL && agency.nameEn) ? agency.nameEn : agency.name;

    // اسم القطعة حسب اللغة
    const getPartDisplayName = (part: any) => {
        if (!isRTL) {
            return part.nameEn || part.name;
        }
        return part.nameAr || part.name;
    };

    // [[ARABIC_COMMENT]] فتح مودال القطعة مع تحويل بياناتها لصيغة ProductModalData
    const openPartModal = (part: Part) => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }
        setModalProduct({
            id: part._id,
            type: 'part',
            title: part.nameAr || part.name,
            images: (part.images || [part.img]).filter((img): img is string => !!img),
            price: part.price,
            brand: part.brand,
            condition: part.condition,
            compatibility: part.compatibility,
            stock: part.stockQty,
            description: undefined,
        });
    };

    return (
        <>
            {/* [[ARABIC_COMMENT]] مودال القطعة - Shein-style */}
            <ProductModal
                product={modalProduct}
                onClose={() => setModalProduct(null)}
                whatsappNumber={WHATSAPP_NUMBER}
            />
            <div className={`relative min-h-screen bg-[#050505] text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />

                {/* ── ADVANCED TECH BACKGROUND ── */}
                <div className="fixed inset-0 -z-20">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30 brightness-[0.4] contrast-125"
                        style={{ backgroundImage: "url('/images/gata.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,240,255,0.05)_0%,_transparent_50%)]" />
                </div>

                {/* ── FLOATING PARTICLES ── */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 0.4, 0],
                                scale: [0, 1, 0],
                                x: [(i % 5) * 200 - 400, (i % 3) * 300 - 450, (i % 5) * 200 - 400],
                                y: [(i % 4) * 200 - 400, (i % 2) * 400 - 400, (i % 4) * 200 - 400]
                            }}
                            transition={{
                                duration: 15 + (i % 10),
                                repeat: Infinity,
                                delay: i * 0.5
                            }}
                            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-cinematic-neon-blue rounded-full blur-[3px]"
                        />
                    ))}
                </div>

                {/* ── BACK BUTTON ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className={cn("fixed top-20 sm:top-24 z-[60]", isRTL ? "right-4 sm:right-12" : "left-4 sm:left-12")}
                >
                    <button
                        onClick={viewMode === 'AGENCIES' ? () => window.location.href = '/client/dashboard' : resetToAgencies}
                        className="group w-12 h-12 border border-white/10 rounded-2xl flex items-center justify-center bg-black/60 backdrop-blur-xl hover:border-accent-gold/50 hover:bg-accent-gold/10 transition-all duration-500 shadow-2xl"
                        title={isRTL ? "عودة" : "Back"}
                    >
                        {isRTL ? <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-accent-gold transition-colors" /> : <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-accent-gold transition-colors" />}
                    </button>
                </motion.div>

                <main className="relative z-10 pt-28 sm:pt-32 px-4 sm:px-6 pb-24 max-w-[1400px] mx-auto min-h-screen flex flex-col">

                    {/* ── HEADER ── */}
                    <header className="text-center mb-8 space-y-4">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-[10px] font-black tracking-[0.3em] uppercase text-accent-gold"
                        >
                            {isRTL ? "مستودع المكونات الرقمي" : "DIGITAL COMPONENTS REGISTRY"}
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-4xl md:text-6xl font-black uppercase tracking-tighter"
                        >
                            {viewMode === 'AGENCIES' && (isRTL ? "اختر الوكالة" : "SELECT AGENCY")}
                            {viewMode === 'PARTS' && (isRTL
                                ? `قطع غيار ${getAgencyDisplayName(selectedAgency!)}`
                                : `${getAgencyDisplayName(selectedAgency!)} SPARE PARTS`)}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]"
                        >
                            {viewMode === 'AGENCIES' && (isRTL ? "ابحث عن طريق شعار الشركة المصنعة" : "BROWSE BY MANUFACTURER LOGO")}
                            {viewMode === 'PARTS' && (isRTL ? `كل المكونات المتاحة — فلتر بالموديل أدناه` : 'ALL COMPONENTS — FILTER BY MODEL BELOW')}
                        </motion.p>
                    </header>

                    {/* ── SEARCH + MODEL FILTER CHIPS ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative max-w-3xl mx-auto w-full mb-10"
                    >
                        {/* شريط البحث */}
                        <div className="relative flex items-center bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-1 sm:p-2 shadow-2xl overflow-hidden group mb-4">
                            <div className="flex-1 flex items-center px-2 sm:px-4 gap-2 sm:gap-4">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                                {viewMode === 'AGENCIES' ? (
                                    <input
                                        type="text"
                                        placeholder={isRTL ? "ابحث عن وكالة (تويوتا، كيا...)" : "Search Agency (Toyota, Kia...)"}
                                        className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold placeholder:text-white/20"
                                        value={agencySearchQuery}
                                        onChange={(e) => setAgencySearchQuery(e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={isRTL ? "ابحث عن قطعة..." : "Search Part..."}
                                        className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold placeholder:text-white/20"
                                        value={partSearchQuery}
                                        onChange={(e) => setPartSearchQuery(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* فلاتر الموديلات Pill Chips - تظهر فقط في عرض القطع */}
                        {viewMode === 'PARTS' && availableModels.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 justify-center"
                            >
                                <button
                                    onClick={() => handleModelFilter('ALL')}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                        selectedModel === 'ALL'
                                            ? 'bg-accent-gold text-black border-accent-gold shadow-lg shadow-accent-gold/30'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:border-accent-gold/40 hover:text-white'
                                    }`}
                                >
                                    {isRTL ? 'الكل' : 'ALL'}
                                    <span className="mx-1 opacity-60">({parts.length})</span>
                                </button>
                                {availableModels.map(model => {
                                    const count = parts.filter((p: any) => p.carModel === model).length;
                                    return (
                                        <button
                                            key={model}
                                            onClick={() => handleModelFilter(model)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                                                selectedModel === model
                                                    ? 'bg-cinematic-neon-blue/20 text-cinematic-neon-blue border-cinematic-neon-blue/50 shadow-lg shadow-cinematic-neon-blue/10'
                                                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                                            }`}
                                        >
                                            {model}
                                            <span className="mx-1 opacity-50">({count})</span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* ── CONTENT VIEWS ── */}
                    <AnimatePresence mode="wait">

                        {viewMode === 'AGENCIES' && (
                            <motion.div
                                key="agencies-tech"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                                className="max-w-6xl mx-auto py-16"
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 sm:gap-y-10">
                                    {filteredAgencies.map((agency, idx) => (
                                        <motion.div
                                            key={agency.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleAgencySelect(agency)}
                                            className="group flex flex-col items-center gap-5 cursor-pointer"
                                        >
                                            {/* Brand Circle */}
                                            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center p-6 group-hover:border-cinematic-neon-blue/50 group-hover:bg-cinematic-neon-blue/5 transition-all duration-700 shadow-2xl overflow-hidden">
                                                {/* Animated Glow on Hover */}
                                                <div className="absolute -inset-10 bg-cinematic-neon-blue/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                
                                                <div className="relative w-full h-full p-4 bg-white rounded-full shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
                                                    <Image
                                                        src={agency.logo}
                                                        alt={getAgencyDisplayName(agency)}
                                                        fill
                                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                                                        unoptimized
                                                        referrerPolicy="no-referrer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <h3 className="text-xl font-black uppercase tracking-widest group-hover:text-cinematic-neon-blue transition-colors">
                                                    {agency.name}
                                                </h3>
                                                <div className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/20 mt-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    {isRTL ? 'اختر الماركة' : 'Select Brand'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 3. PARTS LIST */}
                        {viewMode === 'PARTS' && (
                            <motion.div
                                key="parts"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-10"
                            >
                                {loading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="aspect-[4/5] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredParts.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-16 text-center space-y-8"
                                    >
                                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-10 h-10 text-accent-gold/40" />
                                        </div>
                                        <h2 className="text-3xl font-black uppercase tracking-tight">{isRTL ? "القطعة المطلوبة غير متوفرة حالياً" : "REQUESTED COMPONENT NOT IN STOCK"}</h2>
                                        <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
                                            {isRTL
                                                ? "لا توجد قطع غيار مدرجة لهذا الموديل في مستودعاتنا العامة. يمكنك تقديم طلب بحث مخصص عبر شبكة خبرائنا وكلاء كيا/تويوتا."
                                                : "No spare parts are currently listed for this model in our general inventory. You can submit a custom sourcing request via our expert network."
                                            }
                                        </p>
                                        <Link href="/concierge">
                                            <button className="btn-gold px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-accent-gold/20 flex items-center gap-3 mx-auto">
                                                {isRTL ? "تقديم طلب بحث خاص" : "SUBMIT SOURCE REQUEST"}
                                                <Zap className="w-4 h-4" />
                                            </button>
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                                        {filteredParts.map((part, idx) => (
                                            <UltraModernPartCard
                                                key={part.id}
                                                part={part}
                                                index={idx}
                                                onClick={() => openPartModal(part)}
                                                onLoginRequired={() => router.push('/login')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* STYLES */}
                <style jsx global>{`
                .glass-card {
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                }
                .font-display { font-family: 'Outfit', sans-serif; }
            `}</style>
            </div>
        </>
    );
}
