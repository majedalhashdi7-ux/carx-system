'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Car, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarItem { _id?: string; id?: string; title?: string; make?: any; model?: string; year?: string | number; price?: number; priceSar?: number; priceEstimate?: string; images?: string[]; image?: string; imageUrl?: string; transmission?: string; fuel?: string; fuelType?: string; listingType?: string; isLiveAuction?: boolean; type?: string; }

interface Props {
  isRTL: boolean;
  cars: CarItem[];
  loading: boolean;
  formatCarImage: (url: string | undefined) => string;
  formatCarTitle: (title: string, make: string, isRTL: boolean) => string;
  formatPrice: (price: number) => string;
}

export function ShowroomGrid({ isRTL, cars, loading, formatCarImage, formatCarTitle, formatPrice }: Props) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[10px] font-black uppercase tracking-widest text-[#C9A96E] mb-2">
            <Car className="w-3.5 h-3.5" />
            {isRTL ? 'معرض السيارات المتاحة' : 'SHOWROOM CARS'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white italic uppercase">
            {isRTL ? 'سيارات المعرض المتاحة' : 'Available Showroom Cars'}
          </h2>
        </div>
        <Link href="/cars" className="text-xs font-black text-[#C9A96E] hover:underline flex items-center gap-1.5">
          <span>{isRTL ? 'عرض كل المعرض' : 'View All Showroom'}</span>
          <ArrowRight className={cn('w-3.5 h-3.5', isRTL && 'rotate-180')} />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-4 justify-center items-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[#C9A96E] animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#C9A96E] font-black italic">
            {isRTL ? 'جاري تحميل سيارات المعرض...' : 'Loading showroom cars...'}
          </span>
        </div>
      ) : cars.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl p-8 max-w-lg mx-auto">
          <Car className="w-12 h-12 text-[#C9A96E]/30 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            {isRTL ? 'جاري تجهيز وتحديث المعرض' : 'Updating Showroom Catalog'}
          </h3>
          <p className="text-xs text-white/40 mb-4">
            {isRTL ? 'يتم إضافة وتحديث أحدث سيارات المعرض المستوردة بانتظام.' : 'Latest imported cars are being updated regularly.'}
          </p>
          <Link href="/cars" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-black font-black text-xs hover:bg-white transition-all">
            {isRTL ? 'تصفح كل السيارات' : 'Browse All Cars'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {cars.slice(0, 8).map((car, idx) => {
            const rawMake = typeof car.make === 'object' ? car.make?.name : car.make;
            const title = formatCarTitle(car.title || `${rawMake || ''} ${car.model || ''} ${car.year || ''}`, rawMake || '', isRTL);
            const image = formatCarImage(Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : (car.imageUrl || car.image));
            const priceStr = formatPrice(car.price || 0);
            return (
              <motion.div
                key={`showroom-${car._id || idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#101018] border border-white/10 hover:border-[#C9A96E]/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                    <img src={image} alt={title} loading="lazy" decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101018] via-transparent to-transparent" />
                    <div className="absolute top-2.5 start-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] backdrop-blur-md">
                        {isRTL ? 'معرض' : 'SHOWROOM'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-[#C9A96E] transition-colors">{title}</h3>
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/40 mb-3">
                      <span>{car.year || '2024'}</span><span>•</span>
                      <span>{car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto')}</span><span>•</span>
                      <span>{car.fuel || (isRTL ? 'ديزل' : 'Diesel')}</span>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                      <div>
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block">{isRTL ? 'السعر' : 'PRICE'}</span>
                        <span className="text-xs sm:text-base font-black text-[#C9A96E]">{priceStr}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 pt-0">
                  <Link href={`/cars/${car._id}`}
                    className="w-full h-9 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] sm:text-xs hover:bg-[#C9A96E] hover:text-black hover:border-[#C9A96E] transition-all flex items-center justify-center gap-1.5">
                    <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                    <ArrowRight className={cn('w-3 h-3', isRTL && 'rotate-180')} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
