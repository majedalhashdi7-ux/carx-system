'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Wrench, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ImportSystem from '../../../../components/admin/ImportSystem';

export default function ImportPartsPage() {
  const router = useRouter();

  const handleImportComplete = (data: any) => {
    // بعد الحفظ الناجح، التوجيه لصفحة تعديل القطعة
    const id = data?.data?._id || data?._id || data?.id;
    if (id) {
      setTimeout(() => {
        router.push(`/admin/parts/${id}`);
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
        <span className="text-white/70 font-bold">استيراد قطع الغيار</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)] shrink-0">
          <Wrench className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            استيراد <span className="text-blue-400">قطع الغيار</span>
          </h1>
          <p className="text-white/40 mt-2 font-medium text-sm">
            أدخل رابط قطعة الغيار من أي موقع متخصص وسيقوم النظام باستخراج التفاصيل والصور تلقائياً.
          </p>
        </div>
      </motion.div>

      {/* Flow hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/15"
      >
        <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
        <p className="text-xs text-blue-400/80 font-medium">
          بعد النشر الناجح، ستنتقل تلقائياً لصفحة تعديل القطعة حيث يمكنك تعديل السعر والكمية والفئة وجميع التفاصيل.
        </p>
      </motion.div>

      {/* Import System Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl"
      >
        <ImportSystem type="part" onImportComplete={handleImportComplete} />
      </motion.div>
    </div>
  );
}
