'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Calendar, Fuel, Gauge, ShieldCheck, 
  Share2, Heart, MessageSquare, AlertCircle, ArrowLeft, X, Check
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal States
  const [showModal, setShowModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    const fetchCar = async () => {
      setLoading(true);
      const res = await api.cars.getById(id) as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        setCar(result?.data || result);
      }
      setLoading(false);
    };
    fetchCar();
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    
    try {
      const res = await api.orders.create({
        car: car._id,
        totalAmount: car.price,
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerEmail: bookingForm.email,
        notes: bookingForm.notes
      });

      if (res.error) {
        throw new Error(res.error);
      }
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || 'حدث خطأ أثناء إرسال طلب الحجز');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
    </div>
  );

  if (error || !car) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500/50 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">تعذر العثور على السيارة</h1>
      <p className="text-gray-400 mb-8">{error || 'ربما تم حذف هذه السيارة أو أنها غير متوفرة حالياً'}</p>
      <Link href="/showroom" className="px-8 py-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
        العودة للمعرض
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      
      <div className="pt-24 pb-20">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest" dir="rtl">
            <Link href="/" className="hover:text-luxury-gold">الرئيسية</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/showroom" className="hover:text-luxury-gold">المعرض</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{car.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Media & Details */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Gallery */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 group"
            >
              <img 
                src={car.mainImage || car.images?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80'} 
                alt={car.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6 flex gap-3">
                <button className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-luxury-gold hover:text-black transition-all">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'الموديل', value: car.year || '2024', icon: Calendar },
                { label: 'الممشى', value: car.mileage ? `${car.mileage} كم` : '0 كم', icon: Gauge },
                { label: 'الوقود', value: car.fuelType || 'بنزين', icon: Fuel },
                { label: 'الحالة', value: car.condition === 'new' ? 'جديدة' : 'مستعملة', icon: ShieldCheck },
              ].map((spec, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center space-y-2">
                  <spec.icon className="w-6 h-6 text-luxury-gold/70" />
                  <div className="text-[10px] uppercase font-bold text-white/20 tracking-widest">{spec.label}</div>
                  <div className="text-sm font-bold">{spec.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                تفاصيل السيارة
              </h2>
              <div className="text-white/60 leading-relaxed text-lg" dir="rtl">
                {car.description || 'لا يوجد وصف متاح لهذه السيارة حالياً.'}
              </div>
            </div>

          </div>

          {/* Right: Sidebar Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-8"
              >
                <div>
                  <div className="text-luxury-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">السعر المعروض</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{car.price?.toLocaleString()}</span>
                    <span className="text-xl text-white/40">ريال</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-luxury-gold transition-all shadow-2xl shadow-white/5 active:scale-95"
                  >
                    احجز الآن
                  </button>
                  <button className="w-full py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                    <MessageSquare className="w-5 h-5" />
                    تواصل معنا واتساب
                  </button>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/30">الماركة</span>
                    <span className="font-bold uppercase tracking-wider">{car.brand || car.make}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/30">رقم الإعلان</span>
                    <span className="font-mono text-white/60">#{car._id?.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
              </motion.div>

              {/* Trust badges */}
              <div className="p-6 rounded-2xl border border-white/5 flex items-center gap-4 text-white/40">
                <ShieldCheck className="w-8 h-8 text-luxury-gold/40" />
                <p className="text-xs leading-relaxed">
                  هذه السيارة مفحوصة ومضمونة من قبل فريق CAR X المتخصص. نحن نضمن لك جودة محركات السيارة وهيكلها.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowModal(false);
                setBookingSuccess(false);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-8 overflow-hidden shadow-2xl"
              dir="rtl"
            >
              <button 
                onClick={() => {
                  setShowModal(false);
                  setBookingSuccess(false);
                }}
                className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="absolute top-0 right-0 w-48 h-48 bg-luxury-gold/5 blur-[80px] pointer-events-none" />

              {!bookingSuccess ? (
                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black">حجز السيارة</h3>
                    <p className="text-white/40 text-xs mt-1">قم بتعبئة بياناتك وسيقوم مستشار المبيعات بالتواصل معك فوراً.</p>
                  </div>

                  {bookingError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p>{bookingError}</p>
                    </div>
                  )}

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">الاسم بالكامل</label>
                      <input 
                        type="text"
                        name="name"
                        required
                        value={bookingForm.name}
                        onChange={handleInputChange}
                        placeholder="مثال: أحمد محمد"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">رقم الجوال</label>
                      <input 
                        type="tel"
                        name="phone"
                        required
                        value={bookingForm.phone}
                        onChange={handleInputChange}
                        placeholder="مثال: 050XXXXXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">البريد الإلكتروني</label>
                      <input 
                        type="email"
                        name="email"
                        required
                        value={bookingForm.email}
                        onChange={handleInputChange}
                        placeholder="example@mail.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">ملاحظات خاصة (اختياري)</label>
                      <textarea 
                        name="notes"
                        rows={3}
                        value={bookingForm.notes}
                        onChange={handleInputChange}
                        placeholder="مثال: أفضل وقت للتواصل معي هو في المساء..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-luxury-gold/50 resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full py-4 bg-luxury-gold text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50 mt-6"
                    >
                      {bookingLoading ? 'جاري إرسال الطلب...' : 'تأكيد طلب الحجز'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 space-y-6 relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                    <Check className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">تم الحجز بنجاح!</h3>
                    <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">
                      شكراً لاهتمامك بـ CAR X. لقد تم تسجيل طلب حجزك للسيارة **{car.title}** بنجاح. سيتصل بك مستشارنا الفني بأقرب وقت ممكن.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowModal(false);
                      setBookingSuccess(false);
                    }}
                    className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-bold transition-all"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
