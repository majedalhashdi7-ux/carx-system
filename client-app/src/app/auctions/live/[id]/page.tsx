'use client';

// [[ARABIC_HEADER]] هذه الصفحة (auctions/live/[id]/page.tsx) تعرض تفاصيل المزاد المباشر للعميل.
// تتيح للعميل مشاهدة البث الحي وتقديم طلبات شراء مسبقة (Proxy Bidding) للسيارات المعروضة.

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, X, ExternalLink, ChevronLeft, ShieldCheck, Tag, AlertTriangle, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import WatermarkImage from "@/components/WatermarkImage";
import { api } from "@/lib/api-original";

export default function LiveAuctionDetails() {
    const { isRTL } = useLanguage();
    const { id } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
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

    useEffect(() => {
        // [[ARABIC_COMMENT]] الدالة مسؤولة عن جلب بيانات المزاد من السيرفر وعرضها
        const loadSession = async () => {
            try {
                const res = await api.liveAuctions.getById(id as string);
                if (res.success) setSession(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        
        loadSession();
        
        // [[ARABIC_COMMENT]] تحديث تلقائي كل 10 ثوانٍ لمتابعة تغييرات الأسعار
        const interval = setInterval(loadSession, 10000);
        return () => clearInterval(interval);
    }, [id]);

    // ==========================================
    // [[ARABIC_COMMENT]] دالة تقديم طلب شراء/مزايدة مباشـر
    // تعمل على قراءة بيانات العميل (مسجل أو ضيف)
    // ثم تسجيل الطلب في قاعدة البيانات للحفاظ عليه، وتحويل العميل للواتساب.
    // ==========================================
    const handleBuyRequest = async (car: any) => {
        // [[ARABIC_COMMENT]] استخلاص بيانات العميل من التخزين المحلي (LocalStorage)
        let buyerName = 'زائر';
        let buyerPhone = 'غير محدد';
        let buyerId = null;

        if (typeof window !== 'undefined') {
            const userJson = localStorage.getItem('hm_user');
            if (userJson) {
                try {
                    const u = JSON.parse(userJson);
                    if (u.name) buyerName = u.name;
                    if (u.phone) buyerPhone = u.phone;
                    buyerId = u._id || u.id;
                } catch { }
            }
        }

        try {
            // [[ARABIC_COMMENT]] إرسال الطلب للسيرفر وإنشاء إشعار للمشرف
            await api.liveAuctionRequests.create({
                userId: buyerId,
                guestName: buyerName,
                guestPhone: buyerPhone,
                session: session._id,
                sessionTitle: session.title,
                car: {
                    title: car.title,
                    lotNumber: car.lotNumber,
                    priceEstimate: car.priceEstimate,
                    image: car.images?.[0] || ''
                }
            });
            // Show brief alert to user
            alert(isRTL ? "تم تسجيل طلبك بنجاح، جاري تحويلك للواتساب..." : "Request registered, redirecting to WhatsApp...");
        } catch (err) {
            console.error('Failed to log auction request:', err);
        }

        // [[ARABIC_COMMENT]] تجهيز رسالة الواتساب وفتح التطبيق للتواصل المباشر مع الدعم
        const phone = session.whatsappNumber || globalWhatsapp; // استخدم رقم المزاد أو الرقم العام الافتراضي
        const text = encodeURIComponent(
            isRTL
                ? `السلام عليكم، أريد تقديم طلب مزايدة على سيارة من المزاد المباشر:\nالسيارة: ${car.title}\nالمزاد: ${session.title}\nرقم اللوت: ${car.lotNumber || 'N/A'}`
                : `Hello, I'm interested in bidding on this car from the Live Auction:\nCar: ${car.title}\nAuction: ${session.title}\nLot #: ${car.lotNumber || 'N/A'}`
        );
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank');
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/40 uppercase tracking-[0.3em] gap-4">
            <div className="w-8 h-8 border-2 border-cinematic-neon-blue/40 border-t-cinematic-neon-blue rounded-full animate-spin" />
            <span className="text-[11px] font-bold">{isRTL ? 'جاري التحميل...' : 'LOADING...'}</span>
        </div>
    );
    if (!session) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-center px-6">
            <div>
                <p className="text-white/20 uppercase tracking-widest text-sm">{isRTL ? 'لم يتم العثور على الجلسة' : 'Session not found'}</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen bg-[#050505] text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Top HUD Bar */}
            <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-black/80 backdrop-blur-3xl border-b border-white/5 px-4 md:px-6 py-3 md:py-4">
                <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <button onClick={() => router.back()} className="p-2 md:p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all shrink-0">
                            <ChevronLeft className={cn("w-4 h-4 md:w-5 md:h-5", isRTL && "rotate-180")} />
                        </button>
                        <div className="min-w-0">
                            <span className="text-[9px] md:text-[10px] font-black text-cinematic-neon-red uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-cinematic-neon-red animate-pulse shrink-0" />
                                {session.status === 'live' ? (isRTL ? 'بث مباشر الآن' : 'LIVE NOW') : (isRTL ? 'جلسة منتهية' : 'ENDED')}
                            </span>
                            <h1 className="text-base md:text-2xl font-black italic uppercase tracking-tighter truncate">{session.title}</h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        <a
                            href={`https://wa.me/${(session.whatsappNumber || globalWhatsapp).replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all text-green-400 text-[10px] font-black uppercase tracking-widest"
                        >
                            <MessageCircle className="w-4 h-4" />
                            {isRTL ? 'تحدث معنا' : 'TALK TO US'}
                        </a>
                    </div>
                </div>
            </div>

            <main className="pt-44 md:pt-52 pb-16 md:pb-20 px-4 md:px-6 max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">

                {/* Left Side: Local Car Grid (no iframe) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Session Banner */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 flex items-center gap-5">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-cinematic-neon-blue" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-cinematic-neon-blue uppercase tracking-widest mb-1">
                                {isRTL ? 'معرض السيارات المستوردة' : 'IMPORTED AUCTION INVENTORY'}
                            </p>
                            <p className="text-white/50 text-xs md:text-sm leading-relaxed">
                                {isRTL
                                    ? 'السيارات المعروضة أدناه جاهزة للمزايدة. اضغط على أي سيارة لعرض تفاصيلها الكاملة وتقديم طلب مزايدة.'
                                    : 'Cars listed below are ready for bidding. Tap any car to view full details and submit a bid request.'}
                            </p>
                        </div>
                    </div>

                    {/* Car Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-[2px] w-12 bg-cinematic-neon-blue" />
                            <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter">
                                {isRTL ? 'السيارات المتوفرة للمزايدة' : 'AVAILABLE FOR BIDDING'}
                            </h2>
                            <span className="ml-auto text-[10px] font-black text-white/30 uppercase tracking-widest">
                                {session.cars?.length || 0} {isRTL ? 'سيارة' : 'CARS'}
                            </span>
                        </div>

                        {(!session.cars || session.cars.length === 0) ? (
                            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center space-y-4">
                                <AlertTriangle className="w-16 h-16 text-white/5 mx-auto" />
                                <h3 className="text-xl font-black uppercase italic text-white/20 tracking-tighter">
                                    {isRTL ? 'لا توجد سيارات بعد' : 'No Cars Added Yet'}
                                </h3>
                                <p className="text-white/30 text-xs uppercase tracking-widest">
                                    {isRTL ? 'سيتم إضافة السيارات قريباً' : 'Cars will be added soon'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                                {session.cars?.map((car: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -6 }}
                                        className="glass-card bg-white/[0.01] border-white/5 p-5 space-y-4 cursor-pointer group rounded-2xl md:rounded-3xl"
                                        onClick={() => setSelectedCar(car)}
                                    >
                                        <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-white/5">
                                            <WatermarkImage
                                                src={car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000'}
                                                fill
                                                className="object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                                                alt={car.title}
                                                unoptimized
                                                watermarkPosition="br"
                                            />
                                            <div className="absolute top-3 right-3 flex gap-2">
                                                {car.lotNumber && (
                                                    <div className="px-2.5 py-1 bg-cinematic-neon-blue/20 backdrop-blur-md rounded-lg border border-cinematic-neon-blue/30 text-[8px] font-black uppercase tracking-widest text-cinematic-neon-blue">
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
                                            <h3 className="text-base md:text-lg font-black uppercase italic truncate">{car.title}</h3>
                                            <div className="flex justify-between items-end border-t border-white/5 pt-3 gap-3">
                                                <div className="min-w-0">
                                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest block">{isRTL ? 'تقدير السعر' : 'ESTIMATE'}</span>
                                                    <div className="text-sm md:text-base font-black text-cinematic-neon-blue tracking-tighter truncate">{car.priceEstimate || (isRTL ? 'تواصل معنا' : 'Contact Us')}</div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleBuyRequest(car); }}
                                                    className="shrink-0 px-4 md:px-5 py-2.5 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 rounded-xl hover:bg-cinematic-neon-blue/20 hover:text-cinematic-neon-blue transition-all text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-cinematic-neon-blue"
                                                >
                                                    {isRTL ? 'مزايدة' : 'BID'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Info & HUD */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 bg-white/[0.02] border-white/5 space-y-8">
                        <div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 block">Process Info</span>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-cinematic-neon-blue" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{isRTL ? 'وساطة آمنة' : 'SECURE BROKERAGE'}</h4>
                                        <p className="text-[10px] text-white/40 leading-relaxed">{isRTL ? 'نحن نقوم بالمزايدة نيابة عنك في المزاد الخارجي لضمان أفضل سعر.' : 'We bid on your behalf at the external auction to ensure the best price.'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-cinematic-neon-red" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{isRTL ? 'اتفاق الواتساب' : 'WHATSAPP AGREEMENT'}</h4>
                                        <p className="text-[10px] text-white/40 leading-relaxed">{isRTL ? 'بعد الضغط على شراء، سنتفق على الحد الأقصى للمزايدة والشروط.' : 'After clicking buy, we will agree on the maximum bid limit and terms.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        <div className="pt-8 border-t border-white/5">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 block">Support</span>
                            <a href={`https://wa.me/${(session.whatsappNumber || globalWhatsapp).replace(/[^0-9]/g, '')}`} className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3 text-green-500 hover:bg-green-500/20 transition-all">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'تحدث مع المستشار' : 'TALK TO EXPERT'}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Car Details Modal */}
            <AnimatePresence>
                {selectedCar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden relative"
                        >
                            <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 text-white/40 hover:text-white z-20 transition-all hover:rotate-90"><X className="w-8 h-8" /></button>

                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                    <div className="p-8 space-y-6">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
                                        <WatermarkImage src={selectedCar.images?.[0]} fill className="object-cover" alt="" unoptimized watermarkPosition="br" />
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {selectedCar.images?.slice(1, 5).map((img: string, i: number) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                                                <WatermarkImage src={img} fill className="object-cover" alt="" unoptimized watermarkPosition="br" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-12 space-y-10 flex flex-col justify-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Tag className="w-4 h-4 text-cinematic-neon-blue" />
                                            <span className="text-[11px] font-black text-cinematic-neon-blue uppercase tracking-widest">{selectedCar.condition}</span>
                                        </div>
                                        <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">{selectedCar.title}</h2>
                                        <p className="text-white/40 text-[13px] leading-relaxed max-w-md">{selectedCar.description || (isRTL ? 'لا توجد تفاصيل إضافية متوفرة حالياً لهذه السيارة.' : 'No additional details currently available for this vehicle.')}</p>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">MSRP Estimate</span>
                                            <div className="text-3xl font-black text-white">{selectedCar.priceEstimate || 'TBD'}</div>
                                        </div>
                                        {selectedCar.lotNumber && (
                                            <div>
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Lot Number</span>
                                                <div className="text-3xl font-black text-white/40">{selectedCar.lotNumber}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-10">
                                        <button
                                            onClick={() => handleBuyRequest(selectedCar)}
                                            className="flex-1 py-5 bg-cinematic-neon-blue text-black font-black uppercase text-xs tracking-[0.4em] rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-105 transition-all"
                                        >
                                            {isRTL ? 'طلب مزايدة مسبق' : 'REQUEST PRE-BID'}
                                        </button>
                                        <button onClick={() => setSelectedCar(null)} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            {isRTL ? 'العودة' : 'CANCEL'}
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
