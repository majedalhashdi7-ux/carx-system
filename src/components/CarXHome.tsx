'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Car, Wrench, Gavel, ArrowRight, Star, Shield, Zap, Award,
  Phone, MessageCircle, MapPin, ChevronDown, Play, Users, TrendingUp, Globe
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

/* ─── Main Component ─── */
export default function CarXHome() {
  const { isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      href: '/showroom',
      icon: Car,
      title: isRTL ? 'معرض السيارات' : 'Showroom',
      desc: isRTL ? 'أفضل السيارات الكورية بأسعار منافسة' : 'Premium Korean cars at competitive prices',
      gradient: 'from-red-900/80 via-red-800/60 to-black',
      glow: 'rgba(220,38,38,0.4)',
      tag: isRTL ? 'سيارات للبيع' : 'Cars for Sale',
    },
    {
      href: '/parts',
      icon: Wrench,
      title: isRTL ? 'قطع الغيار' : 'Spare Parts',
      desc: isRTL ? 'قطع أصلية مضمونة لجميع الموديلات' : 'Genuine parts for all models',
      gradient: 'from-blue-900/80 via-blue-800/60 to-black',
      glow: 'rgba(59,130,246,0.4)',
      tag: isRTL ? 'أصلية 100%' : '100% Genuine',
    },
    {
      href: '#auctions',
      icon: Gavel,
      title: isRTL ? 'المزادات' : 'Auctions',
      desc: isRTL ? 'مزادات حصرية على سيارات نادرة' : 'Exclusive auctions on rare vehicles',
      gradient: 'from-amber-900/80 via-amber-800/60 to-black',
      glow: 'rgba(245,158,11,0.4)',
      tag: isRTL ? 'مزادات حية' : 'Live Auctions',
    },
  ];

  const stats = [
    { value: 1200, suffix: '+', label: isRTL ? 'سيارة متوفرة' : 'Cars Available', icon: Car },
    { value: 500, suffix: '+', label: isRTL ? 'عميل راضٍ' : 'Happy Clients', icon: Users },
    { value: 15, suffix: '', label: isRTL ? 'سنة خبرة' : 'Years Experience', icon: Award },
    { value: 30, suffix: '+', label: isRTL ? 'دولة نصدر إليها' : 'Export Countries', icon: Globe },
  ];

  const features = [
    { icon: Shield, title: isRTL ? 'ضمان الجودة' : 'Quality Guarantee', desc: isRTL ? 'فحص شامل لكل سيارة' : 'Full inspection on every car' },
    { icon: Zap, title: isRTL ? 'شحن سريع' : 'Fast Shipping', desc: isRTL ? 'تسليم لجميع دول العالم' : 'Delivery to all countries' },
    { icon: TrendingUp, title: isRTL ? 'أفضل الأسعار' : 'Best Prices', desc: isRTL ? 'أسعار تنافسية مضمونة' : 'Guaranteed competitive prices' },
    { icon: Star, title: isRTL ? 'خدمة 24/7' : 'Support 24/7', desc: isRTL ? 'دعم فني على مدار الساعة' : 'Round-the-clock technical support' },
  ];

  const testimonials = [
    { name: 'أحمد محمد', stars: 5, text: isRTL ? 'تجربة رائعة، السيارة وصلت بحالة ممتازة وبسعر لا يصدق!' : 'Amazing experience, car arrived in perfect condition!' },
    { name: 'سارة علي', stars: 5, text: isRTL ? 'أفضل معرض للسيارات الكورية، خدمة ممتازة وأسعار منافسة' : 'Best Korean car dealer, excellent service!' },
    { name: 'خالد عبدالله', stars: 4, text: isRTL ? 'شحن سريع وسيارة مطابقة للوصف تماماً' : 'Fast shipping and car exactly as described' },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ════ HERO ════ */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180,0,0,0.25) 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, rgba(80,0,0,0.2) 0%, transparent 50%), #000',
        }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {/* Diagonal red line decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-600/30 to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-600/20 to-transparent" />
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />
        </div>

        <Particles />

        {/* 3D floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotateX: [0, 360], rotateY: [0, 180] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 right-20 w-32 h-32 opacity-10"
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
          >
            <div className="w-full h-full border-2 border-red-500 rounded-2xl" />
          </motion.div>
          <motion.div
            animate={{ rotateZ: [0, 360], scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-32 left-16 w-20 h-20 opacity-10 border-2 border-red-400 rounded-full"
          />
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-8 w-12 h-12 opacity-10 border border-white rotate-45"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-red-500/40 bg-red-500/10 backdrop-blur-sm"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium tracking-wider uppercase">
              {isRTL ? 'تصدير سيارات كورية عالمياً' : 'Global Korean Car Exports'}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-none tracking-tighter"
          >
            <span className="block text-white">CAR</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ff4444 40%, #ff6600 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(220,38,38,0.5))',
              }}
            >
              XPERT
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {isRTL
              ? 'نظام متكامل لتصدير السيارات الكورية وقطع الغيار إلى جميع دول العالم'
              : 'Complete system for Korean car & parts exports worldwide'}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/showroom">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 8px 30px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                <Car className="w-5 h-5" />
                <span>{isRTL ? 'تصفح المعرض' : 'Browse Showroom'}</span>
                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </motion.div>
            </Link>
            <Link href="/parts">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg border border-white/20 backdrop-blur-sm cursor-pointer hover:border-white/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <Wrench className="w-5 h-5" />
                <span>{isRTL ? 'قطع الغيار' : 'Spare Parts'}</span>
              </motion.div>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-white/30"
            >
              <span className="text-xs uppercase tracking-widest">{isRTL ? 'اكتشف' : 'Explore'}</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════ STATS ════ */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 via-black to-red-950/20" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 mb-4 group-hover:bg-red-600/20 transition-all">
                  <stat.icon className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ SECTIONS (3D Cards) ════ */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3 block">
              {isRTL ? 'خدماتنا' : 'Our Services'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              {isRTL ? 'اختر ما تحتاجه' : 'Choose What You Need'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Card3D className="h-full">
                  <Link href={section.href}>
                    <div
                      className={`relative h-72 rounded-3xl overflow-hidden bg-gradient-to-br ${section.gradient} border border-white/10 cursor-pointer group`}
                      style={{ boxShadow: `0 20px 60px ${section.glow}` }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Top badge */}
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 backdrop-blur-sm text-white">
                          {section.tag}
                        </span>
                      </div>

                      {/* Icon */}
                      <div
                        className="absolute top-4 left-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `${section.glow.replace('0.4', '0.3')}`, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        <section.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* 3D depth layer */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500" style={{ transform: 'translateZ(20px)', boxShadow: `inset 0 0 60px ${section.glow}` }} />

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-2xl font-black text-white mb-2">{section.title}</h3>
                        <p className="text-white/60 text-sm mb-4">{section.desc}</p>
                        <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                          <span className="text-sm font-bold">{isRTL ? 'استكشف الآن' : 'Explore Now'}</span>
                          <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Bottom glow line */}
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
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
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(30,0,0,0.8) 0%, #000 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3 block">
              {isRTL ? 'لماذا نحن' : 'Why Us'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              {isRTL ? 'ميزاتنا التنافسية' : 'Our Competitive Edge'}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm group cursor-default"
                style={{ boxShadow: '0 0 0 0 rgba(220,38,38,0)' }}
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: '0 0 30px rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }} />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-600/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TESTIMONIALS ════ */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-red-500 text-sm font-bold uppercase tracking-widest mb-3 block">
              {isRTL ? 'آراء العملاء' : 'Testimonials'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              {isRTL ? 'ماذا يقول عملاؤنا' : 'What Our Clients Say'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < t.stars ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white text-xs font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <span className="text-white font-medium text-sm">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ CONTACT CTA ════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(120,0,0,0.3) 0%, rgba(0,0,0,0.8) 50%, rgba(80,0,0,0.2) 100%)',
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              {isRTL ? 'تواصل معنا اليوم' : 'Contact Us Today'}
            </h2>
            <p className="text-white/50 text-xl mb-10">
              {isRTL ? 'نحن هنا لمساعدتك في الحصول على أفضل صفقة' : "We're here to help you get the best deal"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a href="tel:+967781007805">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', boxShadow: '0 8px 30px rgba(220,38,38,0.4)' }}
                >
                  <Phone className="w-5 h-5" />
                  <span>+967 781 007 805</span>
                </motion.div>
              </a>
              <a href="https://wa.me/967781007805" target="_blank" rel="noopener noreferrer">
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white border border-white/20 cursor-pointer hover:border-green-500/50 hover:bg-green-500/10 transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span>WhatsApp</span>
                </motion.div>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/40">
              <MapPin className="w-4 h-4" />
              <span>{isRTL ? 'صنعاء، اليمن' : "Sana'a, Yemen"}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════ FOOTER ════ */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-800 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="text-xl font-black"><span className="text-white">CAR</span><span className="text-red-500"> X</span></span>
            </div>

            <div className="flex gap-6 text-sm text-white/40">
              {[
                { href: '/showroom', label: isRTL ? 'المعرض' : 'Showroom' },
                { href: '/parts', label: isRTL ? 'قطع الغيار' : 'Parts' },
                { href: '/brands', label: isRTL ? 'الماركات' : 'Brands' },
                { href: '/login', label: isRTL ? 'تسجيل الدخول' : 'Login' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="text-white/30 text-sm">
              © {new Date().getFullYear()} CAR X. {isRTL ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
