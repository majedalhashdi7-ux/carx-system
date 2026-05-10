'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Calendar, Fuel, Gauge, ShieldCheck, 
  Share2, Heart, MessageSquare, AlertCircle, ArrowLeft
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
      <Link href="/cars" className="px-8 py-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
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
            <Link href="/cars" className="hover:text-luxury-gold">المعرض</Link>
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
                  <button className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-luxury-gold transition-all shadow-2xl shadow-white/5 active:scale-95">
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
                    <span className="font-bold uppercase tracking-wider">{car.brand}</span>
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

      <Footer />
    </main>
  );
}
