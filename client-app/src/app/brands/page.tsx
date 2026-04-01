'use client';

/**
 * صفحة الوكالات - Brands Page
 * عرض جميع الوكالات بتصميم دائري واضح ومنظم
 * كل وكالتين جنب بعض على الشاشات الكبيرة
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Search, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import CircularBrandCard from '@/components/CircularBrandCard';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Brand {
  id: string;
  key: string;
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  descriptionAr?: string;
  carCount?: number;
}

export default function BrandsPage() {
  const { isRTL } = useLanguage();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await api.brands.list();
        if (res?.brands) {
          setBrands(res.brands);
        }
      } catch (err) {
        console.error('Failed to load brands:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBrands();
  }, []);

  const filteredBrands = brands.filter(brand => {
    const q = search.toLowerCase();
    return !q || 
      brand.name.toLowerCase().includes(q) || 
      brand.nameAr?.includes(q) ||
      brand.key.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-black text-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* خلفية زخرفية */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        
        {/* زر العودة */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
          </button>
        </motion.div>

        {/* العنوان والبحث */}
        <div className="mb-16 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="h-1 w-16 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight">
              {isRTL ? 'الوكالات' : 'BRANDS'}
            </h1>
            <p className="text-white/40 text-lg max-w-2xl">
              {isRTL 
                ? 'اكتشف جميع الوكالات المتوفرة واختر السيارة المثالية لك' 
                : 'Discover all available brands and choose your perfect vehicle'}
            </p>
          </motion.div>

          {/* شريط البحث */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-xl"
          >
            <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-amber-500/50 transition-all">
              <div className="w-12 h-12 flex items-center justify-center text-white/30">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isRTL ? "ابحث عن وكالة..." : "Search for a brand..."}
                className="flex-1 bg-transparent border-none outline-none text-base font-medium text-white placeholder:text-white/30 px-2"
              />
            </div>
          </motion.div>
        </div>

        {/* شبكة الوكالات */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center"
          >
            <Building2 className="w-20 h-20 text-white/10 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white/30 uppercase tracking-wider mb-2">
              {isRTL ? 'لا توجد نتائج' : 'NO RESULTS'}
            </h2>
            <p className="text-white/20">
              {isRTL ? 'جرب البحث بكلمة أخرى' : 'Try searching with different keywords'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredBrands.map((brand, index) => (
              <CircularBrandCard
                key={brand.id}
                brand={brand}
                index={index}
              />
            ))}
          </div>
        )}

        {/* إحصائيات */}
        {!loading && filteredBrands.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16 flex items-center justify-center gap-8 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-white/40">
                {filteredBrands.length} {isRTL ? 'وكالة' : 'brands'}
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-white/30" />
              <span className="text-white/40">
                {filteredBrands.reduce((sum, b) => sum + (b.carCount || 0), 0)} {isRTL ? 'سيارة' : 'vehicles'}
              </span>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
