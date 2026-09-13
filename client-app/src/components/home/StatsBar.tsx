'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem { value: string; labelAr: string; labelEn: string; color: string; href: string; }
interface Props {
  isRTL: boolean;
  showroomCount: number;
  auctionCount: number;
  brandCount: number;
}

export function StatsBar({ isRTL, showroomCount, auctionCount, brandCount }: Props) {
  const stats: StatItem[] = [
    { value: showroomCount > 0 ? `+${showroomCount}` : '100+', labelAr: 'سيارة في المعرض', labelEn: 'Cars in Showroom', color: '#C9A96E', href: '/cars' },
    { value: auctionCount > 0 ? `${auctionCount}` : '🔴 Live', labelAr: 'مزاد مباشر حالياً', labelEn: 'Live Auctions Now', color: '#ef4444', href: '/auctions' },
    { value: brandCount > 0 ? `${brandCount}` : '10+', labelAr: 'ماركة عالمية', labelEn: 'Global Brands', color: '#a78bfa', href: '/brands' },
    { value: '24/7', labelAr: 'دعم ومتابعة', labelEn: 'Support & Follow-up', color: '#34d399', href: '/support' },
  ];

  return (
    <section className="py-8 bg-[#0a0a12] border-b border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#C9A96E]/20 hover:bg-white/[0.04] transition-all group">
              <span className="text-2xl sm:text-3xl font-black mb-1 group-hover:scale-110 transition-transform" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[10px] font-bold text-white/40 leading-tight">
                {isRTL ? stat.labelAr : stat.labelEn}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
