'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">تواصل معنا</h2>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">نحن هنا <br /> <span className="text-white/20">لخدمتكم دائماً</span></h1>
          </motion.div>
          <p className="text-white/40 max-w-2xl mx-auto text-lg">
            هل لديك استفسار عن سيارة معينة؟ أو ترغب في زيارة معرضنا؟ فريقنا جاهز للرد على جميع تساؤلاتكم.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {[
                { icon: Phone, title: 'اتصل بنا', info: '+966 50 000 0000', sub: 'متاح من 9 صباحاً - 9 مساءً' },
                { icon: Mail, title: 'البريد الإلكتروني', info: 'vip@carx.com', sub: 'نرد خلال 24 ساعة' },
                { icon: MapPin, title: 'الموقع', info: 'طريق الملك فهد، الرياض', sub: 'المملكة العربية السعودية' },
              ].map((item, idx) => (
                <div key={idx} className="glass-panel p-8 rounded-[2rem] border border-white/5 hover:border-luxury-gold/30 transition-all duration-500 group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-luxury-gold transition-colors duration-500">
                      <item.icon className="w-6 h-6 text-luxury-gold group-hover:text-black transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{item.title}</h3>
                      <p className="text-xl font-bold">{item.info}</p>
                      <p className="text-white/20 text-xs mt-1">{item.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="premium-card p-12 rounded-[3rem] relative overflow-hidden">
                <div className="glow-overlay" />
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-luxury-gold/10 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-luxury-gold" />
                    </div>
                    <h2 className="text-3xl font-black">أرسل لنا <span className="text-luxury-gold">رسالة</span></h2>
                  </div>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/30 px-2">الاسم بالكامل</label>
                      <input 
                        type="text" 
                        placeholder="أدخل اسمك هنا"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-luxury-gold outline-none transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/30 px-2">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        placeholder="email@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-luxury-gold outline-none transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/30 px-2">الموضوع</label>
                      <input 
                        type="text" 
                        placeholder="كيف يمكننا مساعدتك؟"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-luxury-gold outline-none transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/30 px-2">الرسالة</label>
                      <textarea 
                        rows={5}
                        placeholder="اكتب رسالتك هنا..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-6 focus:border-luxury-gold outline-none transition-all text-white placeholder:text-white/10 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2 pt-4">
                      <button className="w-full bg-luxury-gold text-black py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-white transition-all duration-500 shadow-2xl">
                        إرسال الرسالة
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
