'use client';

import { motion } from 'framer-motion';
import { Truck, ShieldCheck, MapPin, Compass } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ShippingPage() {
  const policies = [
    {
      title: 'شحن السيارات الفارهة (VIP Recovery)',
      icon: Truck,
      desc: 'نوفر خدمة نقل مميزة وخاصة لسيارات النخبة عبر سطحات مغلقة بالكامل ومحمية ضد الصدمات والغبار والظروف الجوية المختلفة. تصل السيارة لباب منزلك بحالتها المصنعية التامة وكأنها لم تغادر المعرض.'
    },
    {
      title: 'تأمين كامل وموثق',
      icon: ShieldCheck,
      desc: 'جميع شحنات السيارات وقطع الغيار الثمينة مؤمن عليها بالكامل ضد كافة مخاطر الطريق والحوادث والخدوش أثناء النقل. نحن نضمن حماية استثمارك منذ لحظة مغادرته مستودعاتنا حتى استلامك له.'
    },
    {
      title: 'التغطية الجغرافية',
      icon: MapPin,
      desc: 'تغطي شبكة شحن CAR X جميع مدن ومحافظات المملكة العربية السعودية الكبرى والصغرى، بالإضافة إلى خدمات الشحن الإقليمي لجميع دول مجلس التعاون الخليجي (الإمارات، قطر، الكويت، البحرين، وعمان).'
    },
    {
      title: 'تتبع الشحنات الفوري',
      icon: Compass,
      desc: 'فور تأكيد الشحنة، نوفر لك رابط تتبع حي ومباشر عبر نظام تحديد المواقع (GPS) لسيارة النقل لتبقى على اطلاع تام بموقع شحنتك والزمن المتبقي لوصولها لباب منزلك بالتنسيق مع مستشارك الشخصي.'
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative pt-40 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/30 to-transparent blur-2xl" />
        </div>
        
        <div className="container mx-auto px-6 text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">خدمات التوصيل والنقل</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">الشحن والتوصيل</h1>
          </motion.div>
          <p className="text-white/40 max-w-xl mx-auto text-base">
            تعرف على معايير النقل الفاخر والتأمين الشامل على السيارات الفارهة وتوصيل قطع الغيار بنظام CAR X.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {policies.map((p, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-luxury-gold/50 transition-all duration-300 space-y-4 group"
                >
                  <div className="w-14 h-14 bg-luxury-gold text-black rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <p.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed text-justify">{p.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-6 text-center">
              <h3 className="text-2xl font-black text-luxury-gold">مدة التوصيل والشحن المتوقعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-2">
                  <div className="text-white/30 text-xs font-bold">السيارات داخل المملكة</div>
                  <div className="text-2xl font-black text-white">24 - 48 ساعة</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-2">
                  <div className="text-white/30 text-xs font-bold">قطع الغيار (محلياً)</div>
                  <div className="text-2xl font-black text-white">1 - 3 أيام عمل</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl space-y-2">
                  <div className="text-white/30 text-xs font-bold">الشحن الخليجي (GCC)</div>
                  <div className="text-2xl font-black text-white">3 - 7 أيام عمل</div>
                </div>
              </div>
              <p className="text-white/30 text-xs pt-4">
                * قد تختلف المدد نسبياً طبقاً لإجراءات الجمارك والمعابر الحدودية أو طلبات التصنيع الخاصة.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
