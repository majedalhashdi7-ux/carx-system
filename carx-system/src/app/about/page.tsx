'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Users, MapPin, Calendar, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function AboutPage() {
  const stats = [
    { label: 'عام من الخبرة', value: '15+', icon: Calendar },
    { label: 'سيارة تم بيعها', value: '2.5k+', icon: Award },
    { label: 'عميل سعيد', value: '4k+', icon: Users },
    { label: 'فرع حول المملكة', value: '8', icon: MapPin },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/20 to-transparent" />
        </div>
        
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">قصتنا</h2>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">نحن CAR X <br /> <span className="text-white/20">تعريف جديد للفخامة</span></h1>
          </motion.div>
          <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed">
            بدأت رحلتنا بشغف واحد: تغيير مفهوم اقتناء السيارات الفاخرة. نحن لا نبيع مجرد سيارات، بل نقدم تجربة استثنائية تليق بنخبة المجتمع.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-20 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-2 group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:border-luxury-gold transition-colors duration-500">
                  <stat.icon className="w-8 h-8 text-luxury-gold" />
                </div>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-white/30 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-4xl font-black tracking-tight">رؤيتنا <span className="text-luxury-gold">وقيمنا</span></h3>
                <p className="text-white/50 leading-relaxed text-lg">
                  في CAR X، نؤمن أن كل عميل يستحق الأفضل. لذلك، نضع معايير صارمة للجودة والشفافية في كل معاملة نقوم بها. نحن نسعى لنكون الشريك الموثوق الأول لكل من يبحث عن التميز في عالم المحركات.
                </p>
              </div>

              <div className="space-y-8">
                {[
                  { title: 'الشفافية المطلقة', desc: 'نقدم تقارير كاملة ودقيقة عن كل سيارة في معرضنا.' },
                  { title: 'الخدمة الشخصية', desc: 'فريقنا مخصص لتلبية احتياجاتك الخاصة بدقة متناهية.' },
                  { title: 'الابتكار المستمر', desc: 'نستخدم أحدث التقنيات لتسهيل عملية البحث والشراء.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="w-2 h-2 rounded-full bg-luxury-gold mt-3 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold">{item.title}</h4>
                      <p className="text-white/40 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-luxury-gold/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
              <img 
                src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1000" 
                alt="Our Showroom" 
                className="relative rounded-[3rem] border border-white/10 shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
