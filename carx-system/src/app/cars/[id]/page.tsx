'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Calendar, Fuel, Gauge, Settings2, ShieldCheck, 
  Share2, Heart, MessageSquare, AlertCircle, X, Check,
  MapPin, Info, Star, Sparkles, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon,
  Eye, Zap, Clock, Car
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ReviewSystem from '../../../components/ReviewSystem';
import TheatricalCarDisplay from '../../../components/TheatricalCarDisplay';

// ─── مكوّن بطاقة مواصفة ────────────────────────────────
function SpecCard({ icon: Icon, label, value, accent = false }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className={`p-5 rounded-2xl border flex flex-col items-center text-center space-y-2 transition-all ${
        accent
          ? 'bg-luxury-gold/5 border-luxury-gold/20'
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
      }`}
    >
      <Icon className={`w-5 h-5 ${accent ? 'text-luxury-gold' : 'text-white/40'}`} />
      <div className="text-[9px] uppercase font-black text-white/30 tracking-[0.2em]">{label}</div>
      <div className={`text-sm font-black ${accent ? 'text-luxury-gold' : 'text-white'}`}>{value}</div>
    </motion.div>
  );
}

// ─── مكوّن بطاقة سيارة مشابهة ──────────────────────────
function RelatedCarCard({ car }: { car: any }) {
  const img = car.mainImage || car.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80';
  return (
    <Link href={`/cars/${car._id || car.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        className="group rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] hover:border-luxury-gold/20 transition-all"
      >
        <div className="relative aspect-video overflow-hidden">
          <img src={img} alt={car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/70 backdrop-blur-sm text-luxury-gold text-xs font-black px-2.5 py-1 rounded-lg border border-luxury-gold/20">
              {(car.price || car.priceSar || 0).toLocaleString()} ر.س
            </span>
          </div>
        </div>
        <div className="p-4">
          <h4 className="font-bold text-sm text-white line-clamp-1">{car.title}</h4>
          <p className="text-xs text-white/40 mt-1">{car.year} • {car.mileage ? `${car.mileage.toLocaleString()} كم` : 'جديدة'}</p>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedCars, setRelatedCars] = useState<any[]>([]);

  // Gallery states
  const [activeImage, setActiveImage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('+966500000000');

  // Currency
  const [activeCurrency, setActiveCurrency] = useState<'SAR' | 'USD'>('SAR');

  // Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [showTheatrical, setShowTheatrical] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', email: '', notes: '' });

  // Prefill booking form
  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      const res = await api.cars.getById(id) as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const fetchedCar = result?.data || result;
        setCar(fetchedCar);

        if (fetchedCar) {
          const mainImg = fetchedCar.mainImage || fetchedCar.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80';
          setActiveImage(mainImg);
          setActiveImageIndex(0);

          const favs = JSON.parse(localStorage.getItem('carx_favorites') || '[]');
          setIsFavorite(favs.includes(fetchedCar._id || fetchedCar.id));

          // جلب سيارات مشابهة
          fetchRelatedCars(fetchedCar.make || fetchedCar.brand, fetchedCar._id || fetchedCar.id);
        }
      }
      setLoading(false);
    };

    fetchCar();

    api.settings.getPublic().then((res: any) => {
      if (res.data?.homeContent?.carxSettings?.salesWhatsapp) {
        setWhatsappNumber(res.data.homeContent.carxSettings.salesWhatsapp);
      } else if (res.data?.contactInfo?.phone) {
        setWhatsappNumber(res.data.contactInfo.phone);
      }
    }).catch(() => {});
  }, [id]);

  const fetchRelatedCars = async (make: string, currentId: string) => {
    try {
      const res = await api.cars.getAll({ limit: '6', make: make || '' }) as any;
      if (res.data) {
        const result = res.data;
        const list = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : (result.data?.cars || result.cars || []);
        setRelatedCars(list.filter((c: any) => (c._id || c.id) !== currentId).slice(0, 4));
      }
    } catch {}
  };

  const toggleFavorite = () => {
    if (!car) return;
    const carId = car._id || car.id;
    const favs = JSON.parse(localStorage.getItem('carx_favorites') || '[]');
    const updatedFavs = isFavorite ? favs.filter((fid: string) => fid !== carId) : [...favs, carId];
    localStorage.setItem('carx_favorites', JSON.stringify(updatedFavs));
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!car) return;
    if (navigator.share) {
      try { await navigator.share({ title: car.title, text: `شاهد هذه السيارة في CAR X: ${car.title}`, url: window.location.href }); }
      catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('تم نسخ رابط السيارة!');
      } catch {}
    }
  };

  const handleWhatsAppClick = () => {
    if (!car) return;
    const carId = car._id || car.id;
    const message = encodeURIComponent(
      `مرحباً CAR X، أنا مهتم بالسيارة:\n\n*السيارة:* ${car.title}\n*السعر:* ${car.price?.toLocaleString()} ريال\n*رقم الإعلان:* #${carId?.slice(-6).toUpperCase()}\n\nرابط السيارة: ${window.location.href}`
    );
    const cleanNum = whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    try {
      const res = await api.orders.create({
        car: car._id || car.id,
        totalAmount: car.price || car.priceSar,
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerEmail: bookingForm.email,
        notes: bookingForm.notes
      });
      if (res.error) throw new Error(res.error);
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || 'حدث خطأ أثناء الإرسال. يرجى المحاولة لاحقاً.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Gallery navigation
  const imagesList = car?.images?.length > 0 ? car.images : [car?.mainImage || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80'];
  
  const goNextImage = () => {
    const next = (activeImageIndex + 1) % imagesList.length;
    setActiveImageIndex(next);
    setActiveImage(imagesList[next]);
  };
  const goPrevImage = () => {
    const prev = (activeImageIndex - 1 + imagesList.length) % imagesList.length;
    setActiveImageIndex(prev);
    setActiveImage(imagesList[prev]);
  };

  const displayPrice = (car: any) => {
    if (activeCurrency === 'USD') return `$${(car.priceUsd || (car.price / 3.75)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD`;
    return `${(car.price || car.priceSar || 0).toLocaleString()} ر.س`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
    </div>
  );

  if (error || !car) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500/50 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">تعذر العثور على السيارة</h1>
      <p className="text-gray-400 mb-8">{error || 'ربما تم حذف هذه السيارة أو أنها غير متوفرة حالياً'}</p>
      <Link href="/showroom" className="px-8 py-3 bg-luxury-gold text-black font-black rounded-2xl hover:bg-white transition-all">
        العودة للمعرض
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white" dir="rtl">
      <Navbar />

      {/* الخلفية الزخرفية */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-luxury-gold/3 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pt-24 pb-24">

        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest">
            <Link href="/" className="hover:text-luxury-gold transition-colors">الرئيسية</Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <Link href="/showroom" className="hover:text-luxury-gold transition-colors">المعرض</Link>
            <ChevronLeft className="w-3 h-3 rotate-180" />
            <span className="text-white/60 truncate max-w-[200px]">{car.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* ── العنوان الرئيسي ── */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {car.source === 'korean_import' || car.source === 'encar_korea' ? (
                <span className="flex items-center gap-1.5 text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> مستوردة كوريا
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-black bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 px-3 py-1 rounded-full uppercase tracking-wider">
                  <Star className="w-3 h-3" /> معرض CAR X
                </span>
              )}
              {car.condition === 'new' && (
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">جديدة</span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{car.title}</h1>
            <p className="text-white/40 mt-2 text-sm">رقم الإعلان: <span className="font-mono text-white/60">#{(car._id || car.id)?.slice(-8).toUpperCase()}</span></p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ── يسار: الوسائط والتفاصيل ── */}
            <div className="lg:col-span-8 space-y-10">

              {/* معرض الصور */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {/* الصورة الرئيسية */}
                <div
                  className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
                  onClick={() => setShowTheatrical(true)}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={activeImage}
                      alt={car.title}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                  {/* أزرار التنقل */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); goPrevImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-luxury-gold hover:text-black transition-all"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); goNextImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-luxury-gold hover:text-black transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* أزرار المفضلة والمشاركة */}
                  <div className="absolute top-5 left-5 flex gap-2 z-10">
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(); }}
                      className={`w-11 h-11 rounded-xl bg-black/60 backdrop-blur-md border flex items-center justify-center transition-all ${
                        isFavorite ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'border-white/10 hover:bg-luxury-gold hover:text-black hover:border-transparent'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleShare(); }}
                      className="w-11 h-11 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* عداد الصور */}
                  {imagesList.length > 1 && (
                    <div className="absolute bottom-5 right-5 bg-black/70 backdrop-blur-sm text-white/70 text-xs font-bold px-3 py-1 rounded-lg border border-white/10">
                      {activeImageIndex + 1} / {imagesList.length}
                    </div>
                  )}

                  {/* أيقونة التكبير */}
                  <div className="absolute bottom-5 left-5 bg-black/70 backdrop-blur-sm text-white/50 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" /> عرض ملء الشاشة
                  </div>
                </div>

                {/* الصور المصغرة */}
                {imagesList.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin">
                    {imagesList.map((img: string, idx: number) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setActiveImage(img); setActiveImageIndex(idx); }}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activeImage === img ? 'border-luxury-gold shadow-[0_0_12px_rgba(212,175,55,0.3)]' : 'border-white/10 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* المواصفات السريعة */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-luxury-gold rounded-full" />
                  المواصفات الأساسية
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SpecCard icon={Calendar} label="سنة الصنع" value={String(car.year || '—')} accent />
                  <SpecCard icon={Gauge} label="الممشى" value={car.mileage ? `${car.mileage.toLocaleString()} كم` : '0 كم'} />
                  <SpecCard icon={Fuel} label="نوع الوقود" value={car.fuelType || 'بنزين'} />
                  <SpecCard icon={Settings2} label="ناقل الحركة" value={car.transmission || 'أوتوماتيك'} />
                </div>

                {/* مواصفات إضافية */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <SpecCard icon={Car} label="الفئة" value={car.make || car.brand || '—'} />
                  <SpecCard icon={Info} label="الموديل" value={car.model || '—'} />
                  <SpecCard icon={MapPin} label="اللون" value={car.color || '—'} />
                  <SpecCard icon={ShieldCheck} label="الحالة" value={car.condition === 'new' ? 'جديدة' : 'مستعملة'} />
                </div>
              </motion.div>

              {/* الوصف */}
              {car.description && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-luxury-gold rounded-full" />
                    تفاصيل السيارة
                  </h2>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    <p className="text-white/60 leading-relaxed text-base">{car.description}</p>
                  </div>
                </motion.div>
              )}

              {/* المميزات */}
              {car.featuresAr && car.featuresAr.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-luxury-gold rounded-full" />
                    المميزات والتجهيزات
                  </h2>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {car.featuresAr.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-white/70">
                          <Check className="w-4 h-4 text-luxury-gold shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* نظام التقييمات */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-luxury-gold rounded-full" />
                  التقييمات والمراجعات
                </h2>
                <ReviewSystem
                  itemId={car._id || car.id}
                  itemType="car"
                  reviews={[]}
                  averageRating={car.rating || 0}
                  totalReviews={car.reviewsCount || 0}
                  onSubmitReview={(review) => console.log('Review submitted:', review)}
                />
              </motion.div>

              {/* سيارات مشابهة */}
              {relatedCars.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <div className="w-1 h-5 bg-luxury-gold rounded-full" />
                    سيارات مشابهة قد تعجبك
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {relatedCars.map((rc: any) => (
                      <RelatedCarCard key={rc._id || rc.id} car={rc} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── يمين: الشريط الجانبي ── */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-5">

                {/* بطاقة السعر والحجز */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-7 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl space-y-6 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                >
                  {/* السعر */}
                  <div>
                    <div className="text-luxury-gold font-black text-[10px] uppercase tracking-[0.3em] mb-2">السعر المعروض</div>
                    
                    {/* تبديل العملة */}
                    <div className="flex gap-2 mb-3">
                      {(['SAR', 'USD'] as const).map(cur => (
                        <button
                          key={cur}
                          onClick={() => setActiveCurrency(cur)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                            activeCurrency === cur
                              ? 'bg-luxury-gold text-black'
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black text-white">
                        {activeCurrency === 'SAR'
                          ? (car.price || car.priceSar || 0).toLocaleString()
                          : (car.priceUsd || Math.round((car.price || 0) / 3.75)).toLocaleString()
                        }
                      </span>
                      <span className="text-xl text-white/40">{activeCurrency === 'SAR' ? 'ر.س' : '$'}</span>
                    </div>

                    {car.priceKrw && (
                      <div className="text-xs text-white/30 mt-1 font-mono">
                        ₩{car.priceKrw.toLocaleString()} وون كوري
                      </div>
                    )}
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowModal(true)}
                      className="w-full py-4 bg-luxury-gold text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)] text-sm"
                    >
                      احجز هذه السيارة الآن
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWhatsAppClick}
                      className="w-full py-4 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] font-bold rounded-2xl flex items-center justify-center gap-2.5 hover:bg-[#25D366]/20 transition-all text-sm"
                    >
                      <MessageSquare className="w-5 h-5" />
                      تواصل عبر واتساب
                    </motion.button>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="border-t border-white/5 pt-5 space-y-3.5">
                    {[
                      { label: 'الماركة', value: car.make || car.brand || '—' },
                      { label: 'الموديل', value: car.model || '—' },
                      { label: 'سنة الصنع', value: car.year ? String(car.year) : '—' },
                      { label: 'رقم الإعلان', value: `#${(car._id || car.id)?.slice(-6).toUpperCase()}`, mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-white/30">{label}</span>
                        <span className={`font-bold ${mono ? 'font-mono text-white/60' : 'text-white'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ضمان الجودة */}
                <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] flex items-start gap-4">
                  <ShieldCheck className="w-7 h-7 text-luxury-gold/60 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-white/60 mb-1">ضمان جودة CAR X</p>
                    <p className="text-xs text-white/30 leading-relaxed">
                      هذه السيارة مفحوصة ومضمونة من قبل فريقنا المتخصص. نضمن لك جودة الهيكل والمحرك والمواصفات المُعلنة.
                    </p>
                  </div>
                </div>

                {/* روابط سريعة */}
                <div className="flex gap-3">
                  <Link
                    href="/showroom"
                    className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    العودة للمعرض
                  </Link>
                  <Link
                    href="/my-orders"
                    className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-center text-white/50 hover:text-luxury-gold hover:border-luxury-gold/20 transition-all"
                  >
                    طلباتي
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── نافذة الحجز ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowModal(false); setBookingSuccess(false); setBookingError(''); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden"
              dir="rtl"
            >
              <button
                onClick={() => { setShowModal(false); setBookingSuccess(false); setBookingError(''); }}
                className="absolute top-5 left-5 p-2 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all text-white/40"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute -top-10 right-0 w-48 h-48 bg-luxury-gold/5 blur-[80px] pointer-events-none" />

              {!bookingSuccess ? (
                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black">حجز السيارة</h3>
                    <p className="text-white/40 text-xs mt-1">أدخل بياناتك وسيتواصل معك مستشار المبيعات فوراً.</p>
                  </div>

                  {/* ملخص السيارة */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                    <img
                      src={activeImage}
                      alt={car.title}
                      className="w-16 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{car.title}</p>
                      <p className="text-luxury-gold font-black text-sm mt-0.5">
                        {(car.price || car.priceSar || 0).toLocaleString()} ر.س
                      </p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{bookingError}</p>
                    </div>
                  )}

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {[
                      { name: 'name', label: 'الاسم الكامل *', type: 'text', placeholder: 'مثال: أحمد محمد' },
                      { name: 'phone', label: 'رقم الجوال *', type: 'tel', placeholder: '05XXXXXXXX' },
                      { name: 'email', label: 'البريد الإلكتروني *', type: 'email', placeholder: 'example@mail.com' },
                    ].map(field => (
                      <div key={field.name}>
                        <label className="block text-xs font-bold text-white/50 mb-1.5">{field.label}</label>
                        <input
                          type={field.type}
                          name={field.name}
                          required
                          value={(bookingForm as any)[field.name]}
                          onChange={e => setBookingForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          dir={field.type === 'email' ? 'ltr' : 'rtl'}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50 transition-colors"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-white/50 mb-1.5">ملاحظات (اختياري)</label>
                      <textarea
                        name="notes"
                        rows={2}
                        value={bookingForm.notes}
                        onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="أي ملاحظات أو أوقات تفضلها للتواصل..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50 resize-none transition-colors"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full py-4 bg-luxury-gold text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50 text-sm shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                      {bookingLoading ? 'جاري الإرسال...' : 'تأكيد طلب الحجز'}
                    </motion.button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-10 space-y-6 relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-black text-white">تم الحجز بنجاح! 🎉</h3>
                    <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                      شكراً لاهتمامك. تم تسجيل طلب حجزك لـ <strong className="text-white">{car.title}</strong> بنجاح. سيتصل بك مستشارنا قريباً.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <Link
                      href="/my-orders"
                      className="flex-1 py-3 bg-luxury-gold text-black font-black text-xs rounded-xl text-center hover:bg-white transition-all"
                    >
                      متابعة الطلب
                    </Link>
                    <button
                      onClick={() => { setShowModal(false); setBookingSuccess(false); }}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* عرض الصور ملء الشاشة */}
      <AnimatePresence>
        {showTheatrical && (
          <TheatricalCarDisplay
            images={imagesList}
            title={car.title}
            onClose={() => setShowTheatrical(false)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
