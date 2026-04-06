'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Car, Wrench, Gavel, ArrowRight, Star, Shield, Zap, Award,
  Phone, MessageCircle, MapPin, ChevronDown, Users, TrendingUp, Globe,
  CheckCircle, Flame, Sparkles, ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

/* ─── Magnetic 3D Card ─── */
function Card3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [12, -12]);
  const rotateY = useTransform(x, [-100, 100], [-12, 12]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.ceil(to / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= to) { setCount(to); clearInterval(timer); }
          else setCount(start);
        }, 20);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Floating Particle ─── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#ffffff' : '#ffd700',
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.1, 0.6, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Marquee ─── */
function Marquee({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden whitespace-nowrap py-4">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="inline-flex gap-12 items-center"
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-white/20 font-black text-lg tracking-widest uppercase flex items-center gap-4">
            {item}
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full inline-block" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function CarXHome() {
  const { isRTL } = useLanguage();

  const brands = ['Hyundai', 'Kia', 'Genesis', 'Ssangyong', 'Samsung', 'Chevrolet', 'Toyota', 'Honda'];

  const stats = [
    { value: 1200, suffix: '+', label: isRTL ? 'سيارة متوفرة' : 'Cars Available', icon: Car, color: 'from-red-600/20 to-red-900/10', border: 'border-red-600/20' },
    { value: 500, suffix: '+', label: isRTL ? 'عميل راضٍ' : 'Happy Clients', icon: Users, color: 'from-blue-600/20 to-blue-900/10', border: 'border-blue-600/20' },
    { value: 15, suffix: '', label: isRTL ? 'سنة خبرة' : 'Years Experience', icon: Award, color: 'from-amber-600/20 to-amber-900/10', border: 'border-amber-600/20' },
    { value: 30, suffix: '+', label: isRTL ? 'دولة نصدر إليها' : 'Export Countries', icon: Globe, color: 'from-emerald-600/20 to-emerald-900/10', border: 'border-emerald-600/20' },
  ];

  const services = [
    {
      href: '/showroom',
      icon: Car,
      title: isRTL ? 'معرض السيارات' : 'Car Showroom',
      desc: isRTL ? 'أفضل السيارات الكورية بأسعار منافسة ومواصفات موثقة' : 'Premium Korean cars at competitive prices',
      accent: '#dc2626',
      glow: 'rgba(220,38,38,0.25)',
      tag: isRTL ? 'سيارات للبيع' : 'For Sale',
      items: isRTL ? ['هيونداي', 'كيا', 'جينيسيس'] : ['Hyundai', 'Kia', 'Genesis'],
    },
    {
      href: '/parts',
      icon: Wrench,
      title: isRTL ? 'قطع الغيار' : 'Spare Parts',
      desc: isRTL ? 'قطع أصلية مضمونة لجميع الموديلات الكورية' : 'Genuine parts for all Korean models',
      accent: '#3b82f6',
      glow: 'rgba(59,130,246,0.25)',
      tag: isRTL ? 'أصلية 100%' : '100% Original',
      items: isRTL ? ['فلاتر', 'مكابح', 'إطارات'] : ['Filters', 'Brakes', 'Tires'],
    },
    {
      href: '/brands',
      icon: Award,
      title: isRTL ? 'الوكالات المعتمدة' : 'Certified Brands',
      desc: isRTL ? 'وكالات موثوقة لأشهر ماركات السيارات الكورية' : 'Trusted dealers for top Korean brands',
      accent: '#f59e0b',
      glow: 'rgba(245,158,11,0.25)',
      tag: isRTL ? 'موثوق' : 'Trusted',
      items: isRTL ? ['معتمدة', 'مرخصة', 'موثقة'] : ['Certified', 'Licensed', 'Verified'],
    },
  ];

  const features = [
    { icon: Shield, title: isRTL ? 'ضمان الجودة' : 'Quality Guarantee', desc: isRTL ? 'فحص شامل لكل سيارة قبل الشحن' : 'Full inspection before shipping', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { icon: Zap, title: isRTL ? 'شحن سريع' : 'Fast Shipping', desc: isRTL ? 'تسليم لجميع دول العالم' : 'Delivery worldwide', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: TrendingUp, title: isRTL ? 'أفضل الأسعار' : 'Best Prices', desc: isRTL ? 'أسعار تنافسية مضمونة' : 'Guaranteed competitive prices', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { icon: Star, title: isRTL ? 'دعم 24/7' : 'Support 24/7', desc: isRTL ? 'دعم فني على مدار الساعة' : 'Round-the-clock support', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ];

  const testimonials = [
    { name: 'أحمد محمد', role: isRTL ? 'مستورد سيارات - السعودية' : 'Car Importer - KSA', stars: 5, text: isRTL ? 'تجربة رائعة، السيارة وصلت بحالة ممتازة وبسعر لا يصدق! أنصح الجميع بالتعامل مع CAR X' : 'Amazing experience, car arrived in perfect condition at an incredible price!' },
    { name: 'سارة علي', role: isRTL ? 'تاجر سيارات - الإمارات' : 'Car Dealer - UAE', stars: 5, text: isRTL ? 'أفضل معرض للسيارات الكورية، خدمة ممتازة وأسعار منافسة جداً. تعاملت معهم أكثر من مرة' : 'Best Korean car dealer, excellent service and very competitive prices.' },
    { name: 'خالد عبدالله', role: isRTL ? 'مشترٍ فردي - الكويت' : 'Private Buyer - Kuwait', stars: 5, text: isRTL ? 'شحن سريع وسيارة مطابقة للوصف تماماً. فريق محترف وخدمة عملاء ممتازة' : 'Fast shipping, car exactly as described. Professional team.' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ════ HERO ════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Glowing orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #7f1d1d 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #1e3a5f 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Vertical lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[1/5, 2/5, 3/5, 4/5].map((pos, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px"
              style={{ left: `${pos * 100}%`, background: `linear-gradient(180deg, transparent 0%, rgba(220,38,38,${0.1 + i * 0.03}) 50%, transparent 100%)` }} />
          ))}
        </div>

        <Particles />

        {/* Hero Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">

          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-3 mb-10 px-5 py-2.5 rounded-full border border-red-500/30 bg-red-500/[0.08] backdrop-blur-sm"
          >
            <Flame className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-semibold tracking-wide">
              {isRTL ? '🇰🇷 تصدير سيارات كورية عالمياً' : '🇰🇷 Global Korean Car Exports'}
            </span>
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-black leading-none tracking-tighter mb-4">
              <span className="block text-white" style={{ textShadow: '0 0 80px rgba(255,255,255,0.05)' }}>CAR</span>
              <span className="block relative" style={{
                background: 'linear-gradient(135deg, #ff2020 0%, #ff5f5f 40%, #ff8c00 80%, #ffd700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(220,38,38,0.6))',
              }}>
                XPERT
              </span>
            </h1>
          </motion.div>

          {/* Divider line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-32 h-px mx-auto mb-8 bg-gradient-to-r from-transparent via-red-500 to-transparent"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-lg md:text-xl text-white/40 mb-12 max-w-xl mx-auto leading-relaxed font-light"
          >
            {isRTL
              ? 'نظام متكامل لاستيراد وتصدير السيارات الكورية وقطع الغيار إلى جميع دول العالم'
              : 'Complete platform for Korean car & parts imports/exports worldwide'}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/showroom">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: '0 8px 40px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Car className="w-5 h-5 relative" />
                <span className="relative">{isRTL ? 'تصفح المعرض' : 'Browse Showroom'}</span>
                <ChevronRight className={`w-4 h-4 relative group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </motion.button>
            </Link>
            <Link href="/parts">
              <motion.button
                whileHover={{ scale: 1.04, y: -2, borderColor: 'rgba(255,255,255,0.4)' }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white/80 text-base border border-white/15 backdrop-blur-sm hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <Wrench className="w-5 h-5" />
                <span>{isRTL ? 'قطع الغيار' : 'Spare Parts'}</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-white/30"
          >
            {[
              { icon: CheckCircle, text: isRTL ? 'شحن مضمون' : 'Guaranteed Shipping' },
              { icon: Shield, text: isRTL ? 'سيارات معاينة' : 'Inspected Cars' },
              { icon: Sparkles, text: isRTL ? 'أسعار شفافة' : 'Transparent Prices' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-red-500/60" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-1.5 text-white/20 cursor-default">
            <span className="text-[10px] uppercase tracking-[0.3em]">{isRTL ? 'اكتشف' : 'Scroll'}</span>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════ MARQUEE ════ */}
      <div className="border-y border-white/[0.06] bg-white/[0.015]">
        <Marquee items={brands} />
      </div>

      {/* ════ STATS ════ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/[0.07] to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative p-6 rounded-2xl border bg-gradient-to-br ${stat.color} ${stat.border} backdrop-blur-sm overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
                <stat.icon className="w-7 h-7 text-white/30 mb-4" />
                <div className="text-4xl font-black text-white mb-1 tabular-nums">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/40 text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SERVICES ════ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              {isRTL ? '— خدماتنا' : '— Our Services'}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              {isRTL ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <Card3D>
                  <Link href={s.href} className="block group">
                    <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] overflow-hidden p-7 h-full transition-all duration-500 group-hover:border-white/[0.15]"
                      style={{ boxShadow: `0 0 0 0 ${s.glow}`, transition: 'box-shadow 0.4s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 20px 60px ${s.glow}`)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 transparent')}
                    >
                      {/* Top glow line */}
                      <div className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(90deg, transparent, ${s.accent}, transparent)` }} />

                      {/* Icon + badge */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10"
                          style={{ background: `${s.accent}15` }}>
                          <s.icon className="w-7 h-7" style={{ color: s.accent }} />
                        </div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/50">
                          {s.tag}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-white mb-2">{s.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-6">{s.desc}</p>

                      {/* Mini tags */}
                      <div className="flex gap-2 flex-wrap mb-6">
                        {s.items.map((item, j) => (
                          <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">{item}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 font-bold text-sm transition-all duration-300 group-hover:gap-3"
                        style={{ color: s.accent }}>
                        <span>{isRTL ? 'استكشف' : 'Explore'}</span>
                        <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </Link>
                </Card3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(15,0,0,0.9) 0%, transparent 100%)' }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                {isRTL ? '— لماذا نحن' : '— Why Choose Us'}
              </p>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {isRTL ? 'ميزات تجعلنا\nالخيار الأفضل' : 'Features That Make\nUs #1'}
              </h2>
              <p className="text-white/40 leading-relaxed mb-8">
                {isRTL
                  ? 'نقدم تجربة استيراد متكاملة مع ضمان الجودة وأفضل الأسعار وخدمة عملاء احترافية'
                  : 'We offer a complete import experience with quality guarantee, best prices, and professional customer service.'}
              </p>
              <Link href="/showroom">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-xl"
                >
                  {isRTL ? 'شاهد السيارات' : 'View Cars'}
                  <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </motion.button>
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`p-5 rounded-2xl border ${f.bg} group`}
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-red-500 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              {isRTL ? '— آراء العملاء' : '— Testimonials'}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              {isRTL ? 'ماذا يقول عملاؤنا' : 'What Clients Say'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="relative p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden group"
              >
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-5 transition-opacity duration-700"
                  style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }} />

                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < t.stars ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CTA BANNER ════ */}
      <section className="py-6 mx-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a0000 0%, #2d0505 40%, #0a0a0a 100%)' }}
        >
          {/* inner grid */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,80,80,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,80,80,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 opacity-30"
            style={{ background: 'radial-gradient(ellipse, #dc2626 0%, transparent 70%)', filter: 'blur(40px)' }} />

          <div className="relative px-10 py-14 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-red-400/60 text-xs font-bold uppercase tracking-[0.25em] mb-4">
                {isRTL ? 'تواصل معنا' : 'Get In Touch'}
              </p>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                {isRTL ? 'جاهزون لمساعدتك' : 'Ready To Help You'}
              </h2>
              <p className="text-white/35 text-lg mb-10 max-w-lg mx-auto">
                {isRTL ? 'تواصل مع فريقنا للحصول على أفضل عروض السيارات الكورية' : "Contact our team for the best Korean car deals"}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+967781007805">
                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 8px 30px rgba(220,38,38,0.4)' }}>
                    <Phone className="w-5 h-5" />
                    <span>+967 781 007 805</span>
                  </motion.button>
                </a>
                <a href="https://wa.me/967781007805" target="_blank" rel="noopener noreferrer">
                  <motion.button whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white border border-white/15 hover:border-green-500/40 hover:bg-green-500/8 transition-all">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span>WhatsApp</span>
                  </motion.button>
                </a>
              </div>
              <p className="flex items-center justify-center gap-2 mt-8 text-white/20 text-sm">
                <MapPin className="w-4 h-4" />
                {isRTL ? "صنعاء، اليمن" : "Sana'a, Yemen"}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="border-t border-white/[0.06] py-12 mt-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
                  <Zap className="w-4 h-4 text-white" fill="white" />
                </div>
                <span className="text-2xl font-black"><span className="text-white">CAR</span><span className="text-red-500"> X</span></span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed">
                {isRTL ? 'منصتك الأولى لاستيراد السيارات الكورية وقطع الغيار' : 'Your #1 platform for Korean car imports & parts'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              {[
                { heading: isRTL ? 'الصفحات' : 'Pages', links: [{ href: '/showroom', label: isRTL ? 'المعرض' : 'Showroom' }, { href: '/parts', label: isRTL ? 'قطع الغيار' : 'Parts' }, { href: '/brands', label: isRTL ? 'الماركات' : 'Brands' }] },
                { heading: isRTL ? 'الحساب' : 'Account', links: [{ href: '/login', label: isRTL ? 'تسجيل الدخول' : 'Login' }, { href: '/login', label: isRTL ? 'إنشاء حساب' : 'Register' }] },
                { heading: isRTL ? 'تواصل' : 'Contact', links: [{ href: 'tel:+967781007805', label: '+967 781 007 805' }, { href: 'https://wa.me/967781007805', label: 'WhatsApp' }] },
              ].map((col, i) => (
                <div key={i}>
                  <p className="text-white/50 font-bold mb-3 text-xs uppercase tracking-wider">{col.heading}</p>
                  <ul className="space-y-2">
                    {col.links.map((l, j) => (
                      <li key={j}>
                        <Link href={l.href} className="text-white/25 hover:text-white/70 transition-colors">{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} CAR X. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
            <div className="flex items-center gap-1 text-white/15 text-xs">
              <span>{isRTL ? 'صنع بـ' : 'Built with'}</span>
              <span className="text-red-600">♥</span>
              <span>{isRTL ? 'لخدمتك' : 'for you'}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
