'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ArrowLeft, Instagram, Twitter, Youtube } from 'lucide-react';
import { api } from '../lib/api';

const footerLinks = {
  main: [
    { label: 'الرئيسية', href: '/' },
    { label: 'المعرض', href: '/showroom' },
    { label: 'قطع الغيار', href: '/parts' },
    { label: 'الماركات', href: '/brands' },
    { label: 'من نحن', href: '/about' },
  ],
  support: [
    { label: 'الأسئلة الشائعة', href: '/faq' },
    { label: 'الشروط والأحكام', href: '/terms' },
    { label: 'سياسة الخصوصية', href: '/privacy' },
    { label: 'سياسة الشحن', href: '/shipping' },
    { label: 'اتصل بنا', href: '/contact' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.contact.send({
        name: 'مشترك النشرة البريدية',
        email,
        subject: 'اشتراك في النشرة البريدية',
        message: 'أريد الاشتراك في النشرة البريدية لتلقي آخر العروض والسيارات الحصرية.',
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSubscribed(true);
        setEmail('');
        if (typeof window !== 'undefined') {
          const subscribers = JSON.parse(localStorage.getItem('carx_subscribers') || '[]');
          if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('carx_subscribers', JSON.stringify(subscribers));
          }
        }
      }
    } catch {
      setError('حدث خطأ، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative bg-[#050505] border-t border-white/[0.05] overflow-hidden">
      {/* Top gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-luxury-gold/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[80px] bg-luxury-gold/5 blur-[40px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Newsletter Banner */}
        <div className="py-16 border-b border-white/[0.05]">
          <div className="glass-panel-gold rounded-[2rem] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-right">
              <p className="text-luxury-gold font-black uppercase tracking-[0.3em] text-xs">لا تفوّت الفرص</p>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                اشترك في النشرة <span className="text-luxury-gold">الحصرية</span>
              </h3>
              <p className="text-white/40 text-sm max-w-md">
                احصل على أحدث العروض والإطلاقات والسيارات الجديدة مباشرةً إلى بريدك.
              </p>
            </div>

            <div className="w-full md:w-auto md:min-w-[380px]">
              {subscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400 text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-emerald-400 font-black text-sm">تم الاشتراك بنجاح!</p>
                    <p className="text-white/40 text-xs mt-0.5">سنرسل لك أحدث العروض قريباً.</p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden focus-within:border-luxury-gold/40 transition-colors">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="أدخل بريدك الإلكتروني"
                      className="bg-transparent text-white px-5 py-4 w-full outline-none text-sm placeholder:text-white/20"
                      dir="rtl"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="shrink-0 bg-luxury-gold text-black px-6 font-black text-sm hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>اشترك <ArrowLeft className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-red-400 text-xs pr-2 font-medium">{error}</p>}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="inline-block group">
              <span className="text-4xl font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold group-hover:text-white transition-colors duration-300">X</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed">
              وجهتك الأولى لأفخم السيارات في المملكة. نجمع بين الأداء المذهل والرفاهية المطلقة.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="tel:+966500000000" className="flex items-center gap-3 text-white/40 hover:text-luxury-gold transition-colors text-sm group">
                <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-luxury-gold/10 border border-white/5 group-hover:border-luxury-gold/20 flex items-center justify-center transition-all">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                +966 50 000 0000
              </a>
              <a href="mailto:info@carx.sa" className="flex items-center gap-3 text-white/40 hover:text-luxury-gold transition-colors text-sm group">
                <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-luxury-gold/10 border border-white/5 group-hover:border-luxury-gold/20 flex items-center justify-center transition-all">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                info@carx.sa
              </a>
              <div className="flex items-center gap-3 text-white/40 text-sm">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                الرياض، المملكة العربية السعودية
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Twitter, label: 'Twitter/X' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-luxury-gold/10 hover:border-luxury-gold/20 hover:text-luxury-gold text-white/40 flex items-center justify-center transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">روابط سريعة</h4>
            <ul className="space-y-3">
              {footerLinks.main.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-luxury-gold transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-4 h-[1px] bg-luxury-gold transition-all duration-300 overflow-hidden" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">الدعم والمساعدة</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-luxury-gold transition-colors text-sm font-medium flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-4 h-[1px] bg-luxury-gold transition-all duration-300 overflow-hidden" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Working Hours */}
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">ساعات العمل</h4>
            <div className="space-y-3">
              {[
                { day: 'السبت – الأربعاء', time: '٩ص – ١٠م' },
                { day: 'الخميس', time: '٩ص – ٨م' },
                { day: 'الجمعة', time: '٢م – ١٠م' },
              ].map((item) => (
                <div key={item.day} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-white/40 text-xs font-medium">{item.day}</span>
                  <span className="text-luxury-gold text-xs font-black">{item.time}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-bold">مفتوح الآن</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.05] py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs font-medium">
            © {new Date().getFullYear()} CAR X. جميع الحقوق محفوظة. تصميم وتطوير بمستوى عالمي.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-xs text-white/20">
              <span className="hover:text-luxury-gold cursor-pointer transition-colors font-bold">العربية</span>
              <span>|</span>
              <span className="hover:text-luxury-gold cursor-pointer transition-colors font-bold">English</span>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">SSL Secured</span>
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-[8px]">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
