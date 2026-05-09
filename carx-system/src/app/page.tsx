'use client';

import { motion } from 'framer-motion';
import { Search, Car, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Video (Mock placeholder for now, you can replace with a real video URL) */}
      <div className="absolute inset-0 z-0 bg-black">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-car-driving-through-a-city-at-night-10332-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-32 h-screen flex flex-col justify-center items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight">
            مستقبل <span className="text-luxury-gold">السيارات</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto font-light">
            اكتشف مجموعة من أندر وأفخم السيارات في العالم. صُممت المنصة لتجربة مستخدم لا مثيل لها.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-full max-w-4xl glass-panel p-4 rounded-full flex items-center shadow-2xl"
        >
          <div className="flex-1 px-6">
            <input 
              type="text" 
              placeholder="ابحث عن ماركة، موديل، أو سنة الصنع..." 
              className="w-full bg-transparent border-none text-lg text-white placeholder-gray-400 focus:outline-none"
            />
          </div>
          <button className="bg-luxury-gold text-black px-12 py-4 rounded-full font-bold text-lg hover:bg-white transition-colors duration-300 flex items-center gap-2">
            <Search className="w-5 h-5" />
            ابحث الآن
          </button>
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="relative z-10 bg-black py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
              <Car className="w-16 h-16 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">أسطول فاخر</h3>
              <p className="text-gray-400">نخبة من السيارات التي تم فحصها بعناية فائقة لتلبي أعلى المعايير.</p>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
              <Shield className="w-16 h-16 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">حماية وأمان</h3>
              <p className="text-gray-400">عمليات دفع آمنة 100% مع ضمان استرداد الأموال وفحص المركبات المعتمد.</p>
            </div>
            <div className="p-8 border border-white/5 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
              <Zap className="w-16 h-16 text-luxury-gold mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">سرعة الإنجاز</h3>
              <p className="text-gray-400">إجراءات نقل الملكية والتوصيل في أسرع وقت ممكن وبضغطة زر واحدة.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
