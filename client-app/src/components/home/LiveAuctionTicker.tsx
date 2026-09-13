'use client';
import Link from 'next/link';
import { ArrowRight, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarItem { _id?: string; id?: string; title?: string; make?: any; model?: string; year?: string | number; price?: number; priceEstimate?: string; images?: string[]; image?: string; imageUrl?: string; transmission?: string; type?: string; sessionId?: string; }

interface Props {
  isRTL: boolean;
  cars: CarItem[];
  formatCarImage: (url: string | undefined) => string;
  formatCarTitle: (title: string, make: string, isRTL: boolean) => string;
  formatPrice: (price: number) => string;
}

export function LiveAuctionTicker({ isRTL, cars, formatCarImage, formatCarTitle, formatPrice }: Props) {
  return (
    <section className="py-12 border-y border-white/5 bg-[#0a0a12] relative z-10 select-none">
      <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-red-400 uppercase tracking-widest">
            {isRTL ? '🔴 الشريط المباشر: سيارات المزاد الحي' : '🔴 LIVE AUCTION TICKER'}
          </span>
        </div>
        <Link href="/auctions" className="text-[11px] font-black text-[#C9A96E] hover:underline flex items-center gap-1">
          {isRTL ? 'كل المزادات الحية' : 'All Live Auctions'}
          <ArrowRight className={cn('w-3 h-3', isRTL && 'rotate-180')} />
        </Link>
      </div>

      {cars.length === 0 ? (
        <div className="py-8 text-center px-4">
          <p className="text-xs text-white/40">
            {isRTL ? 'لا توجد سيارات في المزاد المباشر حالياً — تابعنا لمعرفة مواعيد الجلسات القادمة' : 'No cars in live auction currently — stay tuned for upcoming sessions'}
          </p>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden py-2">
          <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#0a0a12] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#0a0a12] to-transparent z-10 pointer-events-none" />
          <div className="animate-marquee-infinite flex gap-4 sm:gap-6">
            {[...cars, ...cars, ...cars].map((car, idx) => {
              const rawMake = typeof car.make === 'object' ? car.make?.name : car.make;
              const title = formatCarTitle(car.title || `${rawMake || ''} ${car.model || ''} ${car.year || ''}`, rawMake || '', isRTL);
              const image = formatCarImage(Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : (car.imageUrl || car.image));
              const rawPrice = typeof car.price === 'number' ? car.price : 0;
              const priceStr = car.priceEstimate || (rawPrice > 0 ? formatPrice(rawPrice) : (isRTL ? 'مزاد مباشر' : 'Live Auction'));

              return (
                <div key={`ticker-${idx}`} className="relative aspect-square w-[220px] sm:w-[260px] rounded-3xl overflow-hidden border border-red-500/20 bg-[#120d18] group flex-shrink-0 cursor-pointer shadow-xl hover:border-red-500 transition-all duration-300">
                  {image ? (
                    <img src={image} alt={title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Gavel className="w-12 h-12 text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-4 text-start">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 rounded border text-[8.5px] font-black uppercase bg-red-500/30 border-red-500/40 text-red-300">
                        🔴 {isRTL ? 'مزاد حي' : 'LIVE'}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#C9A96E]">{priceStr}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-white line-clamp-1 mb-1">{title}</h4>
                    <div className="flex justify-between items-center text-[8.5px] text-white/40 mt-1">
                      <span>{car.year || '2024'} • {car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto')}</span>
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <Gavel className="w-3 h-3" />
                        {isRTL ? 'زايد الآن' : 'Bid Now'}
                      </span>
                    </div>
                  </div>
                  <Link href={car.type === 'live-auction' ? '/auctions' : `/auctions/${car._id}`} className="absolute inset-0 z-10" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
