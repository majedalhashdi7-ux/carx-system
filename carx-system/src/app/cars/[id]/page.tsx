'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Settings, Calendar, Disc, Fuel, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';

export default function CarDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await api.cars.getById(id as string);
        if (res.data?.data) {
          setCar(res.data.data);
        } else if (res.data?.car) {
          setCar(res.data.car);
        }
      } catch (err) {
        console.error('Error fetching car:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCar();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-luxury-gold"></div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-4xl font-bold mb-4">السيارة غير موجودة</h1>
        <button onClick={() => router.back()} className="text-luxury-gold hover:underline">
          العودة للمعرض
        </button>
      </div>
    );
  }

  const images = car.images?.length > 0 ? car.images.map((img:any) => img.url) : ['https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80&w=1200'];

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="container mx-auto px-6">
        
        {/* Gallery */}
        <div className="w-full h-[50vh] md:h-[70vh] rounded-3xl overflow-hidden relative mb-12 border border-white/10 shadow-2xl shadow-luxury-gold/5">
          <img src={images[0]} alt={car.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-10 px-10">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2">{car.title}</h1>
            <p className="text-luxury-gold text-2xl font-bold">{car.priceSar || car.price} ريال سعودي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Details */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-6">المواصفات الأساسية</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <Calendar className="text-luxury-gold w-6 h-6" />
                  <span className="text-gray-400 text-sm">السنة</span>
                  <span className="text-white font-bold text-lg">{car.year}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Disc className="text-luxury-gold w-6 h-6" />
                  <span className="text-gray-400 text-sm">الممشى</span>
                  <span className="text-white font-bold text-lg">{car.mileage || 0} كم</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Settings className="text-luxury-gold w-6 h-6" />
                  <span className="text-gray-400 text-sm">ناقل الحركة</span>
                  <span className="text-white font-bold text-lg">{car.transmission === 'automatic' ? 'أوتوماتيك' : 'عادي'}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Fuel className="text-luxury-gold w-6 h-6" />
                  <span className="text-gray-400 text-sm">الوقود</span>
                  <span className="text-white font-bold text-lg">{car.fuelType === 'petrol' ? 'بنزين' : 'كهرباء'}</span>
                </div>
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-white mb-6">وصف السيارة</h2>
              <p className="text-gray-300 leading-relaxed">
                {car.description || 'لا يوجد وصف متاح لهذه السيارة حالياً.'}
              </p>
            </section>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">إتمام الشراء</h3>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <span>فحص شامل 150 نقطة</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <span>ضمان استرداد لمدة 7 أيام</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="w-6 h-6 rounded-full bg-luxury-gold/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-luxury-gold" />
                  </div>
                  <span>تسليم فوري لباب المنزل</span>
                </li>
              </ul>

              <button className="w-full bg-luxury-gold text-black font-black text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-xl shadow-luxury-gold/20 mb-4">
                <CreditCard className="w-5 h-5" />
                حجز ودفع العربون
              </button>
              <p className="text-center text-xs text-gray-500">
                سيطلب منك تسجيل الدخول لإتمام العملية
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
