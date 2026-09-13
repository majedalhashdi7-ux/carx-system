'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Props {
  isRTL: boolean;
}

export function HeroSection({ isRTL }: Props) {
  return (
    <header className="relative pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#C9A96E] mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          {isRTL ? 'بوابتك المباشرة لسوق السيارات المستوردة' : 'YOUR DIRECT ACCESS TO IMPORTED CARS MARKET'}
        </div>

        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic">
          {isRTL ? (
            <>استورد سيارتك <span className="text-[#C9A96E] drop-shadow-[0_0_20px_rgba(201,169,110,0.3)]">المستوردة الفاخرة</span> مباشرة بنقرة واحدة</>
          ) : (
            <>IMPORT YOUR <span className="text-[#C9A96E] drop-shadow-[0_0_20px_rgba(201,169,110,0.3)]">PREMIUM IMPORTED</span> CAR DIRECTLY</>
          )}
        </h1>

        <p className="text-xs sm:text-base text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
          {isRTL
            ? 'ادخل مباشرة لمزادات السيارات الكورية الحية، واطلب قطع الغيار الأصلية، وتتبع شحنتك حتى باب منزلك مع ضمان الجودة والفحص قبل الشحن.'
            : 'Access live Korean car auctions directly, request original spare parts, and track your shipment home with guaranteed inspection and quality.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/cars" className="px-7 py-3.5 rounded-2xl bg-[#C9A96E] border border-[#b8955b] text-black font-black uppercase tracking-widest text-xs hover:bg-[#b8955b] transition-all hover:scale-105 shadow-xl shadow-[#C9A96E]/20">
            {isRTL ? 'تصفح المعرض' : 'BROWSE SHOWROOM'}
          </Link>
          <Link href="/auctions" className="px-7 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/20 transition-all">
            {isRTL ? 'المزادات الحية' : 'LIVE AUCTIONS'}
          </Link>
        </div>
      </motion.div>
    </header>
  );
}
