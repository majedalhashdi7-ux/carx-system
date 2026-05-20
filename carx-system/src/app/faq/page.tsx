'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, ChevronUp, Shield, Car, Wrench, CreditCard } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'عام',
      icon: Car,
      questions: [
        {
          q: 'ما هو نظام CAR X؟',
          a: 'CAR X هو منصة فارهة رائدة في المملكة العربية السعودية لشراء واستيراد السيارات الفاخرة وقطع الغيار الأصلية. نحن نربط صفوة العملاء بأفضل السيارات والوكالات العالمية تحت سقف واحد وبضمانات حقيقية.'
        },
        {
          q: 'كيف يمكنني حجز سيارة أو طلب معاينة؟',
          a: 'يمكنك تصفح معرضنا الفاخر، واختيار السيارة المناسبة ثم الضغط على زر "تواصل عبر واتساب" للتحدث مباشرة مع مستشارك الشخصي لتنسيق موعد المعاينة أو إتمام الحجز، أو تعبئة نموذج الاتصال وسنتواصل معك خلال ساعة واحدة.'
        }
      ]
    },
    {
      category: 'الضمان والجودة',
      icon: Shield,
      questions: [
        {
          q: 'هل السيارات المعروضة مفحوصة ومضمونة؟',
          a: 'بكل تأكيد. جميع السيارات المعروضة في CAR X تخضع لفحص دقيق وشامل يتكون من أكثر من 150 نقطة فحص بواسطة خبراء معتمدين. كما نوفر تقرير فحص تفصيلي كامل وضماناً يمتد حتى 5 سنوات على السيارات الفارهة.'
        },
        {
          q: 'هل قطع الغيار المتوفرة أصلية؟',
          a: 'نعم، نوفر فقط قطع الغيار الأصلية بنسبة 100٪ (OEM) مباشرة من المصنع أو الوكالات المعتمدة. كل قطعة غيار تأتي مع ضمان الوكيل المعتمد ورقم تسلسلي للتحقق من أصالتها.'
        }
      ]
    },
    {
      category: 'الدفع والتمويل',
      icon: CreditCard,
      questions: [
        {
          q: 'ما هي خيارات الدفع المتاحة؟',
          a: 'نقوم بتسهيل عمليات الدفع عبر التحويل البنكي المباشر للحسابات الرسمية للشركة، أو الدفع ببطاقات الائتمان ومدى، كما نتعاون مع كبرى البنوك وشركات التمويل بالمملكة لتقديم حلول تمويلية استثنائية متوافقة مع الشريعة الإسلامية.'
        },
        {
          q: 'هل يمكنني تمويل شراء سيارة فارهة؟',
          a: 'نعم، لدينا شراكات حصرية تقدم نسب تمويل منخفضة لعملاء CAR X وفترات سداد مرنة تصل لـ 5 سنوات مع دفعة أولى ميسرة أو بدون دفعة أولى لبعض الفئات.'
        }
      ]
    },
    {
      category: 'الشحن والتوصيل',
      icon: Wrench,
      questions: [
        {
          q: 'كيف يتم تسليم قطع الغيار والسيارات؟',
          a: 'نحن نشحن قطع الغيار إلى كافة مناطق المملكة ودول الخليج عبر شركاء شحن موثوقين بأسعار تنافسية وتوصيل سريع. أما السيارات فيتم نقلها بمركبات شحن مغلقة خاصة (VIP Recovery) لضمان حمايتها التامة ووصولها لباب منزلك بحالتها المصنعية.'
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Glowing Background Art */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/35 to-transparent blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 text-center space-y-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">الدعم والمساعدة</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">الأسئلة الشائعة</h1>
          </motion.div>
          <p className="text-white/40 max-w-xl mx-auto text-base">
            كل ما تود معرفته عن خدمات CAR X الفاخرة، نظام حجز السيارات، ضمان قطع الغيار، وخدمات النقل الفارهة.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="space-y-12">
            {faqs.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <cat.icon className="w-6 h-6 text-luxury-gold" />
                  <h2 className="text-2xl font-black tracking-tight">{cat.category}</h2>
                </div>

                <div className="space-y-4">
                  {cat.questions.map((faq, faqIdx) => {
                    const globalIdx = catIdx * 100 + faqIdx;
                    const isOpen = openIndex === globalIdx;

                    return (
                      <motion.div 
                        key={faqIdx}
                        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-luxury-gold/50 transition-colors duration-300"
                        layout
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                          className="w-full px-6 py-5 text-right flex items-center justify-between gap-4 font-bold text-lg hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <HelpCircle className="w-5 h-5 text-luxury-gold/60 shrink-0" />
                            {faq.q}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-luxury-gold" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-white/40" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-white/5 bg-black/40 text-white/60 text-sm leading-relaxed px-6 py-5 pr-14"
                            >
                              {faq.a}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
