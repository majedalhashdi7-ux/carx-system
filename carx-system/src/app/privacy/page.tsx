'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Lock, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  const points = [
    {
      title: '1. البيانات التي نجمعها',
      desc: 'نقوم بجمع البيانات الشخصية التي تقدمها لنا طواعية، مثل الاسم الكامل، البريد الإلكتروني، رقم الهاتف، رقم الهيكل عند طلب قطع غيار، وتفاصيل الاهتمام بنوع محدد من السيارات الفاخرة أثناء تصفحك للمعرض أو حجز المركبات.'
    },
    {
      title: '2. كيف نستخدم معلوماتك؟',
      desc: 'نستخدم معلوماتك الشخصية لتسهيل عمليات حجز ومعاينة السيارات، وتوفير قطع الغيار الصحيحة المطابقة لهيكل سيارتك، وإرسال تحديثات الطلبات، وتحسين جودة منصة CAR X بشكل مستمر وتقديم عروض حصرية تلائم رغباتك الفاخرة.'
    },
    {
      title: '3. حماية بياناتك وأمنها',
      desc: 'تعتبر حماية بياناتك أولوية قصوى بالنسبة لنا. نحن نطبق أحدث بروتوكولات الأمان العالمية وتقنيات التشفير المتقدمة (SSL) لحماية بياناتك الشخصية وبيانات السداد من الوصول غير المصرح به أو التعديل أو الإفشاء أو الإتلاف.'
    },
    {
      title: '4. مشاركة البيانات مع أطراف ثالثة',
      desc: 'لا نقوم ببيع أو تأجير أو مشاركة بياناتك الشخصية مع أي أطراف ثالثة لأغراض تسويقية. يتم مشاركة البيانات فقط مع شركاء معتمدين لإتمام خدماتك مثل شركات الشحن الفارهة المعتمدة لتوصيل السيارات أو قطع الغيار لعنوانك، أو الجهات الحكومية عند المطالبة القانونية الصريحة.'
    },
    {
      title: '5. ملفات تعريف الارتباط (Cookies)',
      desc: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة تصفحك وتخصيص المحتوى، وحفظ تفضيلاتك وسياراتك المفضلة محلياً ليسهل عليك الوصول إليها لاحقاً. يمكنك التحكم في إعدادات ملفات تعريف الارتباط عبر متصفحك الخاص.'
    },
    {
      title: '6. حقوقك القانونية كعميل',
      desc: 'بموجب نظام حماية البيانات الشخصية بالمملكة، يحق لك الوصول إلى معلوماتك الشخصية المخزنة لدينا، أو طلب تعديلها أو تصحيحها، أو سحب موافقتك وحذفها نهائياً من سجلاتنا في أي وقت بالتواصل مع فريق الدعم الفني.'
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
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">أمان وحماية</h2>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">سياسة الخصوصية</h1>
          </motion.div>
          <p className="text-white/40 max-w-xl mx-auto text-base">
            تلتزم منصة CAR X بحماية خصوصية بياناتك الشخصية وتوفير بيئة تصفح ومعاملات آمنة وموثوقة بنسبة 100٪.
          </p>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-12 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-luxury-gold/5 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-luxury-gold" />
                <div>
                  <h2 className="text-xl font-bold">ميثاق الخصوصية الفاخرة</h2>
                  <p className="text-white/30 text-xs mt-1">تحديث مستمر لحفظ خصوصيتك</p>
                </div>
              </div>
              <div className="text-white/30 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-luxury-gold/50" />
                متوافق مع الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {points.map((p, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className="space-y-3 p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-luxury-gold/30 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-luxury-gold">{p.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed text-justify">{p.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-8 text-center text-white/30 text-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-luxury-gold" />
                جميع بيانات المعاملات مشفرة بالكامل بنظام AES-256
              </span>
              <span>CAR X Security Team © 2026</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
