'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Users, MapPin, Calendar, Sparkles, Target, Rocket, Heart } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

const stats = [
  { label: 'عام من الخبرة', value: '١٥+', icon: Calendar },
  { label: 'سيارة تم بيعها', value: '٢,٥٠٠+', icon: Award },
  { label: 'عميل سعيد', value: '٤,٠٠٠+', icon: Users },
  { label: 'فرع حول المملكة', value: '٨', icon: MapPin },
];

const values = [
  {
    icon: Shield,
    title: 'الشفافية المطلقة',
    desc: 'نقدم تقارير كاملة ودقيقة عن كل سيارة في معرضنا، لا مفاجآت ولا تفاصيل مخفية.',
  },
  {
    icon: Heart,
    title: 'الخدمة الشخصية',
    desc: 'فريقنا المتخصص يتفهم احتياجاتك ويرافقك في كل خطوة من رحلة الشراء.',
  },
  {
    icon: Rocket,
    title: 'الابتكار المستمر',
    desc: 'نستخدم أحدث التقنيات لتبسيط تجربة البحث والشراء وجعلها متعة حقيقية.',
  },
  {
    icon: Target,
    title: 'التميز في الجودة',
    desc: 'كل سيارة في معرضنا تمر بفحص دقيق من ٢٥٠ نقطة لضمان أعلى معايير الجودة.',
  },
];

const team = [
  {
    name: 'أحمد الراشد',
    role: 'المدير التنفيذي',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'سارة الخالد',
    role: 'مديرة المبيعات',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  },
  {
    name: 'محمد العلي',
    role: 'رئيس الفنيين',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ===== Hero Section ===== */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-1/4 w-[600px] h-[600px] bg-luxury-gold/5 rounded-full blur-[150px]" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

        <div className="container mx-auto px-6 text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-luxury-gold" />
              <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">قصتنا</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              نحن <span className="text-luxury-gold">CAR X</span>
              <br />
              <span className="text-white/20">تعريف جديد للفخامة</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            بدأت رحلتنا بشغف واحد: تغيير مفهوم اقتناء السيارات الفاخرة. نحن لا نبيع مجرد سيارات،
            بل نقدم تجربة استثنائية تليق بنخبة المجتمع.
          </motion.p>
        </div>
      </section>

      {/* ===== Stats Grid ===== */}
      <section className="py-20 border-y border-white/[0.04] bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="stat-card group text-center space-y-3 p-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center mx-auto group-hover:bg-luxury-gold group-hover:border-luxury-gold transition-all duration-500">
                  <stat.icon className="w-6 h-6 text-luxury-gold group-hover:text-black transition-colors" />
                </div>
                <div className="text-4xl font-black text-luxury-gold">{stat.value}</div>
                <div className="text-white/30 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Story Section ===== */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group order-last lg:order-first"
            >
              <div className="absolute -inset-6 bg-luxury-gold/10 blur-[60px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
              <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=900"
                  alt="CAR X Showroom"
                  className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                {/* Overlay info card */}
                <div className="absolute bottom-6 right-6 glass-panel p-6 rounded-2xl space-y-1">
                  <p className="text-luxury-gold font-black text-2xl">٢٠١٠</p>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider">تأسست CAR X</p>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="space-y-4">
                <p className="text-luxury-gold font-black uppercase tracking-[0.3em] text-xs">رؤيتنا وقيمنا</p>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight">
                  لماذا يختارنا
                  <br />
                  <span className="text-white/20">آلاف العملاء؟</span>
                </h2>
                <p className="text-white/50 leading-relaxed text-base">
                  في CAR X، نؤمن أن كل عميل يستحق الأفضل. لذلك نضع معايير صارمة للجودة والشفافية
                  في كل معاملة. نحن نسعى لنكون الشريك الموثوق الأول لكل من يبحث عن التميز.
                </p>
              </div>

              <div className="space-y-5">
                {values.slice(0, 3).map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-5 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:border-luxury-gold transition-all duration-500 shrink-0">
                      <item.icon className="w-5 h-5 text-luxury-gold group-hover:text-black transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-base font-black mb-1">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Values Grid ===== */}
      <section className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-luxury-gold font-black uppercase tracking-[0.3em] text-xs">ما يميزنا</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              قيمنا <span className="text-white/20">الراسخة</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel glass-panel-hover p-8 space-y-5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center group-hover:bg-luxury-gold group-hover:border-luxury-gold transition-all duration-500">
                  <v.icon className="w-6 h-6 text-luxury-gold group-hover:text-black transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg font-black mb-2">{v.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Team Section ===== */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <p className="text-luxury-gold font-black uppercase tracking-[0.3em] text-xs">خلف النجاح</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              الفريق <span className="text-white/20">المتميز</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="group text-center space-y-4"
              >
                <div className="relative mx-auto w-40 h-40 rounded-3xl overflow-hidden border border-white/10 group-hover:border-luxury-gold/40 transition-colors duration-500">
                  <img
                    src={member.img}
                    alt={member.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div>
                  <h3 className="text-lg font-black">{member.name}</h3>
                  <p className="text-luxury-gold text-sm font-bold">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section className="py-24 bg-[#050505]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel-gold rounded-[3rem] p-16 md:p-24 text-center space-y-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 via-transparent to-luxury-gold/5" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                ابدأ رحلتك <span className="text-luxury-gold">معنا</span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto text-lg">
                تصفح مجموعتنا الحصرية أو تواصل مع فريقنا المتخصص لمساعدتك في إيجاد سيارة أحلامك.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/showroom"
                  className="bg-luxury-gold text-black px-12 py-5 rounded-2xl font-black text-base hover:bg-white transition-all duration-500 shadow-gold"
                >
                  تصفح المعرض
                </Link>
                <Link
                  href="/contact"
                  className="glass-panel px-12 py-5 rounded-2xl font-black text-base hover:bg-white/10 transition-all duration-500"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
