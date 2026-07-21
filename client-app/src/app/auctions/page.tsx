'use client';

// [[ARABIC_HEADER]] هذه الصفحة (auctions/page.tsx) تعرض سيارات المزاد المباشر للعميل مباشرة بدون خيارات التبويبات والمقاييس.
// تتيح للعميل مشاهدة السيارات وتقديم طلبات شراء مسبقة عبر الواتساب.

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Gavel, Car, ShieldCheck, X, MessageCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";
import { useSettings } from "@/lib/SettingsContext";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WatermarkImage from "@/components/WatermarkImage";
import { formatCarTitle } from "@/lib/brandTranslations";

function resolveAuctionCarImg(car: any): string {
    if (!car) return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';
    const raw = car.img || car.image || car.imageUrl || (Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : '') || '';
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
        return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';
    }
    let url = raw.trim();
    if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
        url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
    }
    if (url.endsWith('_')) {
        url = url.startsWith('http') ? `${url}001.jpg` : `https://ci.encar.com${url}001.jpg`;
    } else if (url.startsWith('/carpicture')) {
        url = `https://ci.encar.com${url}`;
    } else if (url.startsWith('/') && !url.startsWith('http')) {
        url = `https://ci.encar.com/carpicture${url}`;
    } else if (!url.startsWith('http')) {
        url = `https://ci.encar.com/carpicture/${url}`;
    }

    if (url.includes('encar.com') || url.includes('encar.co.kr')) {
        return `/api/v2/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
}

/* ── Skeleton Card ── */
function AuctionSkeleton() {
    return (
        <div className="bg-[#111118] border border-white/6 rounded-2xl overflow-hidden flex flex-col animate-pulse">
            <div className="aspect-video bg-white/5 w-full" />
            <div className="p-5 space-y-4">
                <div className="h-6 bg-white/8 rounded-lg w-3/4" />
                <div className="h-4 bg-white/5 rounded-lg w-1/2" />
                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div className="h-8 bg-white/5 rounded-lg w-20" />
                    <div className="h-10 bg-white/8 rounded-xl w-24" />
                </div>
            </div>
        </div>
    );
}

export default function AuctionsPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { socialLinks } = useSettings();
    const { isLoggedIn } = useAuth();
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<any>(null);
    const [globalWhatsapp, setGlobalWhatsapp] = useState('+967781007805');

    useEffect(() => {
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res.data.socialLinks?.whatsapp) {
                setGlobalWhatsapp(res.data.socialLinks.whatsapp);
            }
        }).catch(() => { });
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load live showroom sessions and scheduled auctions
            const [showroomRes, liveRes, upcomingRes] = await Promise.all([
                api.liveAuctions.list().catch(() => ({ success: false, data: [] })),
                api.auctions.list({ status: 'live' }).catch(() => ({ success: false, data: [] })),
                api.auctions.list({ status: 'upcoming' }).catch(() => ({ success: false, data: [] }))
            ]);

            const mergedCars: any[] = [];

            if (showroomRes.success) {
                const activeShowrooms = (showroomRes.data || []).filter((s: any) => s.status !== 'ended');
                activeShowrooms.forEach((session: any) => {
                    (session.cars || []).forEach((car: any) => {
                        if (!car.isHidden) {
                            mergedCars.push({
                                ...car,
                                type: 'showroom',
                                sessionTitle: session.title,
                                sessionId: session._id || session.id,
                                whatsappNumber: session.whatsappNumber || globalWhatsapp,
                            });
                        }
                    });
                });
            }

            if (liveRes.success) {
                (liveRes.data || []).forEach((item: any) => {
                    if (item.car) {
                        mergedCars.push({
                            id: item.car._id || item.car.id,
                            title: item.car.title,
                            images: item.car.images || [],
                            condition: item.car.condition || 'New',
                            priceEstimate: item.currentBid ? `${item.currentBid} SAR` : (item.startingPrice ? `${item.startingPrice} SAR` : ''),
                            lotNumber: item.lotNumber || 'N/A',
                            type: 'scheduled_live',
                            sessionTitle: isRTL ? 'مزادات مباشرة' : 'Live Auctions',
                            sessionId: item._id || item.id,
                            whatsappNumber: globalWhatsapp,
                            description: item.car.description || '',
                        });
                    }
                });
            }

            if (upcomingRes.success) {
                (upcomingRes.data || []).forEach((item: any) => {
                    if (item.car) {
                        mergedCars.push({
                            id: item.car._id || item.car.id,
                            title: item.car.title,
                            images: item.car.images || [],
                            condition: item.car.condition || 'New',
                            priceEstimate: item.startingPrice ? `${item.startingPrice} SAR` : '',
                            lotNumber: item.lotNumber || 'N/A',
                            type: 'scheduled_upcoming',
                            sessionTitle: isRTL ? 'مزادات قادمة' : 'Upcoming Auctions',
                            sessionId: item._id || item.id,
                            whatsappNumber: globalWhatsapp,
                            description: item.car.description || '',
                        });
                    }
                });
            }

            setCars(mergedCars);
        } catch (err) {
            console.error("Failed to load auctions cars", err);
        } finally {
            setLoading(false);
        }
    }, [isRTL, globalWhatsapp]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleBuyRequest = async (car: any) => {
        let buyerName = 'زائر';
        let buyerPhone = 'غير محدد';
        let buyerId = null;

        if (typeof window !== 'undefined') {
            const userJson = localStorage.getItem('hm_user');
            if (userJson) {
                try {
                    const u = JSON.parse(userJson);
                    buyerName = u.name || buyerName;
                    buyerPhone = u.phone || buyerPhone;
                    buyerId = u._id || u.id;
                } catch { }
            }
        }

        try {
            await api.liveAuctionRequests.create({
                userId: buyerId,
                guestName: buyerName,
                guestPhone: buyerPhone,
                session: car.sessionId,
                sessionTitle: car.sessionTitle,
                car: {
                    title: car.title,
                    lotNumber: car.lotNumber,
                    priceEstimate: car.priceEstimate,
                    image: car.images?.[0] || ''
                }
            });
            alert(isRTL ? "تم تسجيل طلبك بنجاح، جاري تحويلك للواتساب..." : "Request registered, redirecting to WhatsApp...");
        } catch (err) {
            console.error('Failed to log auction request:', err);
        }

        const phone = car.whatsappNumber || globalWhatsapp;
        const text = encodeURIComponent(
            isRTL
                ? `السلام عليكم، أريد تقديم طلب مزايدة على سيارة من المزاد المباشر:\nالسيارة: ${car.title}\nالمزاد: ${car.sessionTitle}\nرقم اللوت: ${car.lotNumber || 'N/A'}`
                : `Hello, I'm interested in bidding on this car from the Live Auction:\nCar: ${car.title}\nAuction: ${car.sessionTitle}\nLot #: ${car.lotNumber || 'N/A'}`
        );
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    return (
        <div className={cn("min-h-screen bg-[#08080f] text-white", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── Hero Banner ── */}
            <div className="pt-20 md:pt-28 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a14] via-[#0f0f1e] to-[#08080f]" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#C9A96E]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/60 to-transparent" />

                <div className="relative max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">
                                        {isRTL ? 'المزاد المباشر للسيارات' : 'LIVE VEHICLES AUCTION'}
                                    </span>
                                </div>
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase text-white">
                                {isRTL ? 'المزاد المباشر' : 'LIVE AUCTION'}
                                <span className="block text-xs not-italic font-light tracking-[0.4em] text-white/25 mt-2">
                                    {isRTL ? 'مزايدة مباشرة · استفسار سريع · تواصل مباشر' : 'DIRECT BIDDING · QUICK ENQUIRY · DIRECT CONTACT'}
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-28 pt-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(n => <AuctionSkeleton key={n} />)}
                    </div>
                ) : cars.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-32 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto mb-6">
                            <Gavel className="w-10 h-10 text-white/15" />
                        </div>
                        <h2 className="text-xl font-black text-white/25 uppercase tracking-widest mb-2">
                            {isRTL ? "لا توجد سيارات معروضة حالياً" : "NO VEHICLES DISPLAYED CURRENTLY"}
                        </h2>
                        <p className="text-sm text-white/20">
                            {isRTL ? 'سيتم إضافة السيارات المستوردة من المزاد قريباً.' : 'Vehicles imported from the auction will be added shortly.'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map((car, idx) => {
                            const carImg = resolveAuctionCarImg(car);
                            const carTitle = formatCarTitle(car.title || `${car.make || ''} ${car.model || ''}`, car.make || '', isRTL);
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -6 }}
                                    className="glass-card bg-white/[0.01] border-white/5 p-5 space-y-4 cursor-pointer group rounded-2xl md:rounded-3xl"
                                    onClick={() => setSelectedCar(car)}
                                >
                                    <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-white/5 bg-zinc-900">
                                        <WatermarkImage
                                            src={carImg}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-all duration-700"
                                            alt={carTitle}
                                            unoptimized
                                            watermarkPosition="br"
                                        />
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {car.lotNumber && (
                                                <div className="px-2.5 py-1 bg-[#C9A96E]/20 backdrop-blur-md rounded-lg border border-[#C9A96E]/30 text-[8px] font-black uppercase tracking-widest text-[#C9A96E]">
                                                    LOT #{car.lotNumber}
                                                </div>
                                            )}
                                            {car.condition && (
                                                <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest">
                                                    {car.condition}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-base md:text-lg font-black uppercase italic truncate" title={carTitle}>{carTitle}</h3>
                                        <div className="flex justify-between items-end border-t border-white/5 pt-3 gap-3">
                                            <div className="min-w-0">
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block">{isRTL ? 'تقدير السعر' : 'ESTIMATE'}</span>
                                                <div className="text-sm md:text-base font-black text-[#C9A96E] tracking-tighter truncate">{car.priceEstimate || (isRTL ? 'تواصل معنا' : 'Contact Us')}</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBuyRequest(car); }}
                                                className="shrink-0 px-4 md:px-5 py-2.5 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-xl hover:bg-[#C9A96E]/20 hover:text-[#C9A96E] transition-all text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-[#C9A96E]"
                                            >
                                                {isRTL ? 'مزايدة' : 'BID'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Car Details Modal */}
            <AnimatePresence>
                {selectedCar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto" onClick={() => setSelectedCar(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedCar(null)} className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/50 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12">
                                {/* Left Side: Images */}
                                <div className="lg:col-span-7 bg-black relative aspect-video lg:aspect-auto lg:h-[600px] flex items-center justify-center border-r border-white/5">
                                    <WatermarkImage
                                        src={resolveAuctionCarImg(selectedCar)}
                                        fill
                                        className="object-contain"
                                        alt={selectedCar.title}
                                        unoptimized
                                        watermarkPosition="br"
                                    />
                                    {selectedCar.images?.length > 1 && (
                                        <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto py-2 px-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5">
                                            {selectedCar.images.map((img: string, idx: number) => (
                                                <div key={idx} className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Details & Bidding */}
                                <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between h-[600px] bg-zinc-950">
                                    <div className="space-y-6">
                                        <div>
                                            <span className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest block mb-2">{selectedCar.sessionTitle}</span>
                                            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">{selectedCar.title}</h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                                            <div>
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-0.5">{isRTL ? 'رقم اللوت' : 'LOT NUMBER'}</span>
                                                <div className="text-sm font-black text-white">{selectedCar.lotNumber || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-0.5">{isRTL ? 'الحالة' : 'CONDITION'}</span>
                                                <div className="text-sm font-black text-white">{selectedCar.condition || 'N/A'}</div>
                                            </div>
                                            <div className="col-span-2 pt-2">
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-0.5">{isRTL ? 'تقدير السعر' : 'PRICE ESTIMATE'}</span>
                                                <div className="text-lg font-black text-[#C9A96E]">{selectedCar.priceEstimate || (isRTL ? 'تواصل معنا' : 'Contact Us')}</div>
                                            </div>
                                        </div>

                                        {selectedCar.description && (
                                            <div>
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1.5">{isRTL ? 'التفاصيل والوصف' : 'DESCRIPTION & DETAILS'}</span>
                                                <p className="text-xs text-white/40 leading-relaxed max-h-32 overflow-y-auto">{selectedCar.description}</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center shrink-0">
                                                    <ShieldCheck className="w-4 h-4 text-[#C9A96E]" />
                                                </div>
                                                <p className="text-[10px] text-white/40 leading-relaxed">
                                                    {isRTL ? 'مزايدة آمنة ووساطة مباشرة لضمان أقل سعر شراء للسيارة.' : 'Secure bidding and direct mediation to ensure the lowest purchase price.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-3">
                                        <button
                                            onClick={() => handleBuyRequest(selectedCar)}
                                            className="w-full py-4 bg-[#C9A96E] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#C9A96E]/90 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(201,169,110,0.25)]"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            {isRTL ? 'مزايدة وطلب شراء عبر واتساب' : 'BID & SUBMIT VIA WHATSAPP'}
                                        </button>
                                        <button
                                            onClick={() => setSelectedCar(null)}
                                            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold text-white/60"
                                        >
                                            {isRTL ? 'رجوع للمزاد' : 'BACK TO AUCTION'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
