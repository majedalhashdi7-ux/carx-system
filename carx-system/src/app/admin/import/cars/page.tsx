'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Car, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ImportSystem from '../../../../components/admin/ImportSystem';

export default function ImportCarsPage() {
  const router = useRouter();

  const handleImportComplete = (data: any) => {
    // بعد الحفظ الناجح، التوجيه لصفحة التعديل
    const id = data?.data?._id || data?._id || data?.id;
    if (id) {
      setTimeout(() => {
        router.push(`/admin/cars/${id}/edit`);
      }, 1500);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40">
        <Link href="/admin/import" className="hover:text-white transition-colors">
          نظام الاستيراد
        </Link>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-white/70 font-bold">استيراد السيارات</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-luxury-gold flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)] shrink-0">
          <Car className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            استيراد <span className="text-luxury-gold">السيارات</span>
          </h1>
          <p className="text-white/40 mt-2 font-medium text-sm">
            أدخل رابط السيارة من Encar أو Copart أو IAAI وسيقوم النظام باستخراج كافة البيانات والصور تلقائياً.
          </p>
        </div>
      </motion.div>

      {/* Flow hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/15"
      >
        <Sparkles className="w-4 h-4 text-luxury-gold shrink-0" />
        <p className="text-xs text-luxury-gold/80 font-medium">
          بعد النشر الناجح، ستنتقل تلقائياً لصفحة تعديل السيارة حيث يمكنك مراجعة وتعديل جميع التفاصيل قبل إطلاقها للعملاء.
        </p>
      </motion.div>

      {/* Import System Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl"
      >
        <ImportSystem type="car" onImportComplete={handleImportComplete} />
      </motion.div>
    </div>
  );
}
