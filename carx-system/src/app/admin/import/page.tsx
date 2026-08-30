'use client';

/**
 * صفحة نظام الاستيراد الرئيسية - HMCAR
 * تُعرض بطاقات للتنقل لكل نوع استيراد بشكل مستقل
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Car, Wrench, Radio, RefreshCw, ArrowLeft, ChevronLeft, Shield, Zap, Edit2 } from 'lucide-react';
import { SyncToolsPanel } from '../../../components/admin/ImportSystem';

export default function AdminImportPage() {
  const [showSync, setShowSync] = useState(false);

  const importCards = [
    {
      href: '/admin/import/cars',
      icon: Car,
      iconBg: 'bg-luxury-gold',
      iconColor: 'text-black',
      borderColor: 'border-luxury-gold/20',
      hoverBorder: 'hover:border-luxury-gold/50',
      glowColor: 'shadow-luxury-gold/10',
      title: 'استيراد السيارات',
      subtitle: 'سيارة واحدة من رابط مزاد أو معرض',
      badge: 'Copart · IAAI · Encar',
      badgeColor: 'bg-luxury-gold/10 text-luxury-gold',
      features: [
        { icon: Zap, text: 'استخراج فوري للبيانات والصور' },
        { icon: Edit2, text: 'تعديل كامل بعد الحفظ مباشرة' },
        { icon: Shield, text: 'كشف تلقائي للسيارات المكررة' },
      ],
    },
    {
      href: '/admin/import/parts',
      icon: Wrench,
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      borderColor: 'border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50',
      glowColor: 'shadow-blue-500/10',
      title: 'استيراد قطع الغيار',
      subtitle: 'قطعة غيار من موقع متخصص أو مورد',
      badge: 'PartsGeek · RockAuto · AutoZone',
      badgeColor: 'bg-blue-500/10 text-blue-400',
      features: [
        { icon: Zap, text: 'استخراج رقم القطعة والفئة' },
        { icon: Edit2, text: 'تعديل السعر والكمية قبل الحفظ' },
        { icon: Shield, text: 'توجيه مباشر لصفحة التعديل' },
      ],
    },
    {
      href: '/admin/live-auctions',
      icon: Radio,
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      borderColor: 'border-red-500/20',
      hoverBorder: 'hover:border-red-500/50',
      glowColor: 'shadow-red-500/10',
      title: 'استيراد المزاد المباشر',
      subtitle: 'استيراد سيارات من جلسات المزاد المباشر',
      badge: 'Live Auction · Auto-Sync',
      badgeColor: 'bg-red-500/10 text-red-400',
      features: [
        { icon: Radio, text: 'إنشاء جلسة مزاد وربطها برابط' },
        { icon: RefreshCw, text: 'تحديث تلقائي كل 24 ساعة' },
        { icon: Zap, text: 'استيراد فوري عبر الضغط على الزر' },
      ],
    },
  ];

  return (
    <div className="space-y-8" dir="rtl">

      {/* رأس الصفحة */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-5"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
          لوحة القيادة
        </Link>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          نظام الاستيراد <span className="text-luxury-gold">الذكي</span>
        </h1>
        <p className="text-white/40 mt-2 text-sm font-medium">
          اختر نوع الاستيراد — كل قسم صفحة مستقلة مع إمكانية التعديل الكامل بعد الحفظ
        </p>
      </div>

      {/* بطاقات الاستيراد */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {importCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={card.href}
                className={`group block p-6 bg-white/[0.02] border ${card.borderColor} ${card.hoverBorder} rounded-3xl transition-all duration-300 hover:bg-white/[0.04] hover:shadow-xl ${card.glowColor} space-y-5`}
              >
                {/* أيقونة + عنوان */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-white group-hover:text-white transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-white/40 text-xs mt-1 font-medium leading-relaxed">
                      {card.subtitle}
                    </p>
                    <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                </div>

                {/* الميزات */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  {card.features.map((feat, fi) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div key={fi} className="flex items-center gap-2.5">
                        <FeatIcon className="w-3.5 h-3.5 text-white/20 shrink-0" />
                        <span className="text-xs text-white/40 font-medium">{feat.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* سهم الانتقال */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-black text-white/20 uppercase tracking-widest group-hover:text-white/60 transition-colors">
                    فتح الصفحة
                  </span>
                  <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:-translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* فاصل + أدوات المزامنة */}
      <div className="pt-2">
        <button
          onClick={() => setShowSync(!showSync)}
          className="flex items-center gap-3 w-full p-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-white/10 hover:bg-white/[0.04] transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm font-black text-white">أدوات المزامنة والصيانة</p>
            <p className="text-xs text-white/30 mt-0.5">تزامن البيانات القديمة، إصلاح الصور، فحص الصحة</p>
          </div>
          <RefreshCw className={`w-4 h-4 text-white/30 transition-transform duration-300 ${showSync ? 'rotate-180' : ''}`} />
        </button>

        {showSync && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-3xl"
          >
            <SyncToolsPanel />
          </motion.div>
        )}
      </div>
    </div>
  );
}
