'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageCircle, X, ChevronLeft, ShieldCheck, 
  Tag, AlertTriangle, Info, Calendar, Radio, Sparkles,
  Loader2
} from "lucide-react";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";
import { api } from "../../../../lib/api";

export default function LiveAuctionDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [globalWhatsapp, setGlobalWhatsapp] = useState('+966500000000');

  useEffect(() => {
    api.settings.getPublic().then((res: any) => {
      if (res?.data?.homeContent?.carxSettings?.salesWhatsapp) {
        setGlobalWhatsapp(res.data.homeContent.carxSettings.salesWhatsapp);
      } else if (res?.data?.contactInfo?.whatsapp) {
        setGlobalWhatsapp(res.data.contactInfo.whatsapp);
      }
    }).catch(() => {});
  }, []);

  const loadSession = async () => {
    try {
      const res = await api.liveAuctions.getById(id);
      if (res.data?.success) {
        setSession(res.data.data);
      } else if (res.data) {
        setSession(res.data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    // Auto refresh every 15 seconds to sync status/cars
    const interval = setInterval(loadSession, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleBuyRequest = async (car: any) => {
    let buyerName = 'زائر';
    let buyerPhone = 'غير محدد';
    let buyerId = null;

    if (typeof window !== 'undefined') {
      const userJson = localStorage.getItem('carx_user');
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          buyerName = u.name || buyerName;
          buyerPhone = u.phone || buyerPhone;
          buyerId = u._id || u.id || buyerId;
        } catch {}
      }
    }

    try {
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
    } catch (err) {
      console.error('Failed to log auction request:', err);
    }

    const phone = session.whatsappNumber || globalWhatsapp;
    const text = encodeURIComponent(
      `السلام عليكم، أريد تقديم طلب مزايدة على سيارة من المزاد المباشر:\n\n` +
      `🚗 *السيارة:* ${car.title}\n` +
      `📅 *المزاد:* ${session.title}\n` +
      `🔢 *رقم اللوت:* ${car.lotNumber || 'N/A'}\n` +
      `💰 *التقدير:* ${car.priceEstimate || 'N/A'}\n\n` +
      `يرجى التواصل معي لإكمال تفاصيل المزايدة والاتفاق.`
    );
    const cleanPhone = phone.replace(/\+/g, '').replace(/\s/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white/40 uppercase tracking-[0.3em] gap-4">
        <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
        <span className="text-sm font-bold">جاري تحميل البث المباشر للمزاد...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">جلسة المزاد غير متوفرة</h1>
        <p className="text-white/40 text-sm mb-6">ربما تم حذف المزاد أو أن الرابط غير صحيح.</p>
        <button onClick={() => router.back()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-xs font-bold">
          العودة للخلف
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between selection:bg-luxury-gold selection:text-black" dir="rtl">
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* HUD Info Header */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 blur-[80px] pointer-events-none" />
          
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {session.status === 'live' ? 'بث مباشر الآن' : 'جلسة المزاد منتهية'}
              </span>
              {session.startTime && (
                <span className="text-xs text-white/40 font-mono font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-luxury-gold/60" />
                  {new Date(session.startTime).toLocaleDateString('ar-SA')}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">{session.title}</h1>
          </div>

          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-xs font-bold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            الرجوع للخلف
          </button>
        </div>

        {/* Cars Grid */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-12 bg-luxury-gold" />
            <h2 className="text-2xl font-black tracking-tight">السيارات المعروضة في المزاد المباشر</h2>
          </div>

          {!session.cars || session.cars.length === 0 ? (
            <div className="glass-panel p-12 text-center border border-white/5 rounded-3xl space-y-4">
              <AlertTriangle className="w-12 h-12 text-white/10 mx-auto" />
              <h3 className="text-lg font-bold text-white/40">لا توجد سيارات معروضة حالياً</h3>
              <p className="text-xs text-white/30 max-w-md mx-auto">
                جاري تحديث كروت السيارات واستيرادها من قبل المشرفين. يرجى إعادة تحميل الصفحة لاحقاً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {session.cars.map((car: any, idx: number) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel p-5 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-luxury-gold/30 hover:shadow-[0_10px_30px_rgba(212,175,55,0.05)] flex flex-col justify-between gap-5 cursor-pointer group"
                  onClick={() => {
                    setSelectedCar(car);
                    setActiveImageIndex(0);
                  }}
                >
                  <div className="space-y-4">
                    {/* Car Image container */}
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black border border-white/5">
                      <img 
                        src={car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'} 
                        alt={car.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {car.condition && (
                          <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-black text-luxury-gold tracking-wide">
                            {car.condition}
                          </div>
                        )}
                        {car.lotNumber && (
                          <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/5 text-[9px] font-bold text-white/50 tracking-mono">
                            لوت: {car.lotNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-right">
                      <h3 className="text-lg font-black text-white group-hover:text-luxury-gold transition-colors truncate">
                        {car.title}
                      </h3>
                      {car.description && (
                        <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">
                          {car.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex items-center justify-between gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">تقدير السعر</span>
                      <span className="text-base font-black text-luxury-gold tracking-tight">{car.priceEstimate || 'اتصل بنا'}</span>
                    </div>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleBuyRequest(car); 
                      }}
                      className="px-4 py-2.5 bg-luxury-gold text-black hover:bg-white rounded-xl transition-all text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.1)] cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      تقديم طلب
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Process Info panel */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-luxury-gold" />
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm font-black text-white">وساطة شراء آمنة</h4>
              <p className="text-xs text-white/40 leading-relaxed">نحن نوفر خدمة وساطة احترافية، نزايد بدلاً منك لتوفير أفضل سعر وأقصى أمان.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
              <Tag className="w-6 h-6 text-luxury-gold" />
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm font-black text-white">أفضل الرسوم والعمولات</h4>
              <p className="text-xs text-white/40 leading-relaxed">رسوم تخليص واستيراد واضحة ومنخفضة تناسب جميع عملائنا دون مفاجآت أو تكاليف خفية.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-luxury-gold" />
            </div>
            <div className="space-y-1 text-right">
              <h4 className="text-sm font-black text-white">استشارة مباشرة فورية</h4>
              <p className="text-xs text-white/40 leading-relaxed">تواصل مباشرة مع مندوب المبيعات على الواتساب لمناقشة التفاصيل والاتفاق على المزايدة.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Car Details Dialog Modal */}
      <AnimatePresence>
        {selectedCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-white text-right relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-luxury-gold" />
                  <h3 className="text-xl font-black truncate">{selectedCar.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCar(null)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Gallery details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="relative aspect-[16/10] bg-black border border-white/10 rounded-2xl overflow-hidden">
                    <img 
                      src={selectedCar.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'} 
                      alt={selectedCar.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>

                  {selectedCar.images && selectedCar.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedCar.images.map((img: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`relative aspect-[16/10] rounded-lg overflow-hidden border transition-all ${
                            activeImageIndex === i ? 'border-luxury-gold' : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={img} alt={`صورة ${i+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-sm font-black text-luxury-gold uppercase tracking-widest">المواصفات المستوردة</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <span className="text-white/40 block mb-0.5">الحالة</span>
                        <span className="text-white font-bold">{selectedCar.condition || '—'}</span>
                      </div>
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <span className="text-white/40 block mb-0.5">رقم اللوت</span>
                        <span className="text-white font-mono font-bold">{selectedCar.lotNumber || '—'}</span>
                      </div>
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl col-span-2">
                        <span className="text-white/40 block mb-0.5">السعر التقديري</span>
                        <span className="text-luxury-gold font-black text-base tracking-tight">{selectedCar.priceEstimate || 'اتصل بنا'}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCar.description && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">الوصف والتفاصيل</h4>
                      <p className="text-xs text-white/70 leading-relaxed font-medium bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                        {selectedCar.description}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBuyRequest(selectedCar)}
                      className="flex-1 py-3.5 bg-luxury-gold hover:bg-white text-black font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      تقديم طلب شراء ومزايدة عبر واتساب
                    </button>
                    <button
                      onClick={() => setSelectedCar(null)}
                      className="px-6 py-3.5 bg-white/5 text-white/60 hover:text-white border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
