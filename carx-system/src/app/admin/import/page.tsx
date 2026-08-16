'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImportSystem, { SyncToolsPanel } from '../../../components/admin/ImportSystem';
import { Car, Wrench, RefreshCw } from 'lucide-react';

type TabType = 'car' | 'part' | 'sync';

export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('car');

  const tabs: { key: TabType; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'car', label: 'استيراد سيارات', icon: <Car className="w-4 h-4" />, description: 'استيراد من Encar وغيرها' },
    { key: 'part', label: 'استيراد قطع غيار', icon: <Wrench className="w-4 h-4" />, description: 'استيراد قطع من مواقع متخصصة' },
    { key: 'sync', label: 'أدوات المزامنة', icon: <RefreshCw className="w-4 h-4" />, description: 'تحديث البيانات القديمة' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          نظام الاستيراد <span className="text-luxury-gold">الذكي والآلي</span>
        </h1>
        <p className="text-white/40 mt-2 font-medium">
          استيراد وتغذية المعرض بالسيارات وقطع الغيار عبر كشط محتوى الروابط الخارجية مباشرة، مع المزامنة الكاملة مع البيانات المحفوظة.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.key
                ? tab.key === 'sync'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-luxury-gold text-black shadow-lg'
                : 'text-white/40 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={activeTab + '-desc'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs text-white/30 -mt-4 font-medium"
        >
          {tabs.find(t => t.key === activeTab)?.description}
        </motion.p>
      </AnimatePresence>

      {/* Content */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'car' && <ImportSystem type="car" />}
            {activeTab === 'part' && <ImportSystem type="part" />}
            {activeTab === 'sync' && <SyncToolsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
