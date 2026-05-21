'use client';

import { motion } from 'framer-motion';
import { FileText, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function TermsPage() {
  const sections = [
    {
      title: '1. شروط الاستخدام العامة',
      content: 'باستخدامك لموقع CAR X، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام الموقع أو الاستفادة من الخدمات المقدمة من خلاله.'
    },
    {
      title: '2. حسابات المستخدمين وأمنها',
      content: 'عند إنشاء حساب في CAR X، فإنك تلتزم بتقديم معلومات دقيقة ومكتملة ومحدثة. تقع على عاتقك المسؤولية الكاملة عن حماية سرية بيانات حسابك وكلمة المرور وتتحمل المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابك الشخصي.'
    },
    {
      title: '3. حجز وشراء السيارات الفارهة',
      content: 'يعتبر حجز أي سيارة عبر الموقع الإلكتروني أو التنسيق المباشر بمثابة "مبادرة اهتمام" وليس عقداً نهائياً للبيع. لا يتم إتمام الصفقة ونقل ملكية السيارة إلا بعد توقيع العقود الرسمية المعتمدة، وسداد كامل المستحقات المتفق عليها، واجتياز الفحص والتوثيق القانوني طبقاً لأنظمة المرور السعودية.'
    },
    {
      title: '4. قطع الغيار والطلبات الخاصة',
      content: 'نحن نلتزم بتقديم قطع غيار أصلية 100٪. في حال طلبات قطع الغيار الخاصة التي يتم استيرادها خصيصاً بناءً على طلب العميل برقم الهيكل (VIN)، فإن هذه الطلبات تعتبر نهائية وغير قابلة للإلغاء أو الاسترجاع بعد تأكيد عملية الشراء والبدء في الشحن من المصنع، إلا في حال وجود عيب مصنعي مثبت بتقرير رسمي.'
    },
    {
      title: '5. المسؤولية والضمان المحدود',
      content: 'تبذل CAR X قصارى جهدها لضمان دقة مواصفات السيارات وأسعار قطع الغيار المذكورة على الموقع. ومع ذلك، قد تحدث أخطاء غير مقصودة في الإدخال، وستقوم الشركة بتصحيحها فوراً وإبلاغ العميل. نحتفظ بالحق في تعديل الأسعار والمواصفات في أي وقت دون إشعار مسبق بما يتوافق مع سياسات السوق والشركات الصانعة.'
    },
    {
      title: '6. التعديلات على الاتفاقية',
      content: 'نحتفظ بالحق الكامل في تحديث أو تعديل أو تغيير أي جزء من شروط الاستخدام هذه في أي وقت. ننصح بزيارة هذه الصفحة بشكل دوري للوقوف على آخر التحديثات. استمرار استخدامك للموقع بعد نشر أي تغييرات يعد قبولاً صريحاً بها.'
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
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">الاتفاقيات القانونية</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">الشروط والأحكام</h1>
          </motion.div>
          <p className="text-white/40 max-w-xl mx-auto text-base">
            يُرجى قراءة شروط استخدام منصة CAR X بعناية لفهم التزاماتك وحقوقك القانونية قبل إتمام المعاملات.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative">
            <div className="absolute top-0 right-12 -translate-y-1/2 bg-luxury-gold text-black px-6 py-2 rounded-full font-black text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              آخر تحديث: مايو 2026
            </div>

            <div className="space-y-8">
              {sections.map((sec, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="space-y-3 group"
                >
                  <h3 className="text-xl font-bold text-luxury-gold group-hover:text-white transition-colors duration-300">
                    {sec.title}
                  </h3>
                  <p className="text-white/50 text-base leading-relaxed text-justify pr-4 border-r border-luxury-gold/20 group-hover:border-luxury-gold transition-colors duration-500">
                    {sec.content}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-white/30 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-luxury-gold" />
                تخضع هذه الشروط لأنظمة وقوانين المملكة العربية السعودية
              </span>
              <span>CAR X Legal Department © 2026</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
