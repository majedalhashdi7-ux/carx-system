'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Star, 
  Globe, 
  ChevronRight,
  Play
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard3D from '../components/CarCard3D';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Home() {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      const res = await api.cars.getFeatured() as any;
      if (res.data) {
        const result = res.data;
        setFeaturedCars(result.data?.cars || result.cars || []);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
          <img 
            src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Car Hero" 
            className="w-full h-full object-cover scale-110 animate-slow-zoom opacity-60"
          />
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-12 bg-luxury-gold" />
                <span className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">أناقة بلا حدود</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase">
                قيادة <span className="text-luxury-gold">المستقبل</span> <br />
                بلمسة الرفاهية
              </h1>
              
              <p className="text-xl text-white/60 max-w-2xl leading-relaxed font-medium">
                اكتشف مجموعتنا الحصرية من السيارات الفاخرة التي تجمع بين الأداء الأسطوري والتصميم المذهل. رحلتك نحو التميز تبدأ من هنا.
              </p>

              <div className="flex flex-wrap gap-6 pt-8">
                <Link href="/cars" className="bg-luxury-gold text-black px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-white transition-all duration-500 transform hover:scale-105 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                  استكشف المعرض
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="glass-panel px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-white/10 transition-all duration-500">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-luxury-gold fill-luxury-gold" />
                  </div>
                  مشاهدة الفيديو
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-20">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 rotate-90 mb-8">مرر لأسفل</span>
          <div className="w-[1px] h-24 bg-gradient-to-b from-luxury-gold to-transparent" />
        </div>
      </section>

      {/* Featured Brands / Logos */}
      <section className="py-20 border-y border-white/5 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             {['ROLEX', 'FERRARI', 'BUGATTI', 'PORSCHE', 'LAMBORGHINI'].map(brand => (
               <span key={brand} className="text-2xl font-black tracking-widest">{brand}</span>
             ))}
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-luxury-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="space-y-4">
              <h2 className="text-luxury-gold font-black uppercase tracking-[0.3em] text-sm">المجموعة المميزة</h2>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter">أحدث السيارات <span className="text-white/20">في المعرض</span></h3>
            </div>
            <Link href="/cars" className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white/40 hover:text-luxury-gold transition-colors">
              شاهد الكل
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.length > 0 ? (
              featuredCars.map((car, idx) => (
                <CarCard3D key={car._id || idx} car={car} index={idx} />
              ))
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="h-[480px] rounded-[2.5rem] bg-white/5 border border-white/10 animate-pulse" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Luxury Experience */}
      <section className="py-32 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-luxury-gold/20 blur-3xl rounded-full opacity-30" />
              <img 
                src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=1000" 
                alt="Interior Luxury" 
                className="relative rounded-[3rem] border border-white/10 shadow-2xl"
              />
              <div className="absolute -bottom-10 -right-10 glass-panel p-8 rounded-[2rem] hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-luxury-gold flex items-center justify-center">
                    <Star className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <p className="text-2xl font-black">4.9/5</p>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">تقييم العملاء</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-luxury-gold font-black uppercase tracking-[0.3em] text-sm">لماذا نحن؟</h2>
                <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">تجربة شراء <br /> <span className="text-white/20">لا تُضاهى</span></h3>
              </div>

              <div className="space-y-8">
                {[
                  { icon: ShieldCheck, title: 'ضمان كامل', desc: 'نوفر ضماناً شاملاً لجميع سياراتنا لراحة بالك التامة.' },
                  { icon: Zap, title: 'أداء فائق', desc: 'كل سيارة في معرضنا يتم اختيارها بعناية لضمان أقصى درجات الأداء.' },
                  { icon: Globe, title: 'توصيل عالمي', desc: 'نشحن سياراتك الفاخرة إلى أي مكان في العالم بعناية فائقة.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:border-luxury-gold transition-all duration-500">
                      <item.icon className="w-6 h-6 text-luxury-gold group-hover:text-black transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="glass-panel p-16 md:p-24 rounded-[3.5rem] relative overflow-hidden text-center space-y-8">
            <div className="absolute inset-0 bg-gradient-to-r from-luxury-gold/10 via-transparent to-luxury-gold/10 opacity-30" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10 space-y-6"
            >
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">هل أنت مستعد <br /> <span className="text-luxury-gold">للانطلاق؟</span></h2>
              <p className="text-white/60 max-w-xl mx-auto text-lg">تواصل معنا اليوم لحجز تجربة قيادة أو للحصول على استشارة خاصة من خبرائنا.</p>
              <div className="flex justify-center gap-6 pt-4">
                <Link href="/contact" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-lg hover:bg-luxury-gold transition-all duration-500 shadow-2xl">
                  تواصل معنا
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
