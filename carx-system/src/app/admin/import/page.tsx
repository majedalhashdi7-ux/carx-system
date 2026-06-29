'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImportSystem from '../../../components/admin/ImportSystem';
import { Car, Wrench } from 'lucide-react';

export default function AdminImportPage() {
  const [importType, setImportType] = useState<'car' | 'part'>('car');

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          نظام الاستيراد <span className="text-luxury-gold">الذكي والآلي</span>
        </h1>
        <p className="text-white/40 mt-2 font-medium">
          استيراد وتغذية المعرض بالسيارات وقطع الغيار عبر كشط محتوى الروابط الخارجية مباشرة.
        </p>
      </div>

      {/* Type Selector */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        <button
          onClick={() => setImportType('car')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
            importType === 'car'
              ? 'bg-luxury-gold text-black shadow-lg'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          استيراد سيارات
        </button>
        <button
          onClick={() => setImportType('part')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
            importType === 'part'
              ? 'bg-luxury-gold text-black shadow-lg'
              : 'text-white/40 hover:text-white'
          }`}
        >
          <Wrench className="w-4 h-4" />
          استيراد قطع غيار
        </button>
      </div>

      {/* Import System Component */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={importType}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ImportSystem type={importType} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
