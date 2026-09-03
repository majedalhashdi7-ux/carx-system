'use client';

/**
 * صفحة الوكالات - Brands Page
 * عرض جميع الوكالات بتصميم دائري واضح ومنظم
 * كل وكالتين جنب بعض على الشاشات الكبيرة
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, ArrowLeft, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import CircularBrandCard from '@/components/CircularBrandCard';
import SearchAutocomplete, { type SearchSuggestion } from '@/components/SearchAutocomplete';
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
        // [[FIX]] API يُرجع { brands: [], data: [] } — نستخدم أيهما متاح
        const raw: any[] = res?.brands || res?.data || [];

        // تنظيف وتصفية البيانات: نحذف الماركات ذات الأسماء الكورية فقط بدون ترجمة
        const cleanBrands = raw
          .filter((b: any) => {
            const nameEn = (b.nameEn || b.name || '').toString().trim();
            // إذا الاسم يحتوي على أحرف كورية فقط بدون ترجمة → نحذفه
            const hasKorean = /[\u3130-\u318F\uAC00-\uD7AF]/.test(nameEn);
            const hasLatin = /[a-zA-Z]/.test(nameEn);
            return !hasKorean || hasLatin;
          })
          .map((b: any) => ({
            id: b._id || b.id,
            key: b.key || (b.nameEn || b.name || '').toLowerCase().replace(/\s+/g, '-'),
            name: b.nameEn || b.name || '',
            nameAr: b.name !== b.nameEn ? b.name : undefined,
            // [[FIX]] API يُرجع logoUrl لكن البطاقة تتوقع logo
            logo: (!b.logoUrl || b.logoUrl.startsWith('/uploads/')) ? undefined : b.logoUrl,
            description: b.description,
            descriptionAr: b.description_ar || b.descriptionAr,
            carCount: b.carCount || 0,
            isActive: b.isActive !== false,
          }));

        setBrands(cleanBrands);
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

  // اقتراحات البحث الذكي
  const searchSuggestions: SearchSuggestion[] = brands.map(b => ({
    id: b.id,
    label: isRTL ? (b.nameAr || b.name) : b.name,
    sublabel: isRTL ? b.name : b.nameAr,
    icon: b.logo,
    value: b.key,
  }));

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
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight">
              {isRTL ? 'الوكالات' : 'BRANDS'}
            </h1>
            <p className="text-white/40 text-lg max-w-2xl">
              {isRTL 
                ? 'اكتشف جميع الوكالات المتوفرة واختر السيارة المثالية لك' 
                : 'Discover all available brands and choose your perfect vehicle'}
            </p>
          </motion.div>

          {/* شريط البحث الذكي */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-xl"
          >
            <SearchAutocomplete
              placeholder={isRTL ? 'ابحث عن وكالة (تويوتا، كيا...)' : 'Search brands (Toyota, Kia...)'}
              suggestions={searchSuggestions}
              value={search}
              onChange={setSearch}
              onSelect={item => setSearch(item.label)}
              isRTL={isRTL}
              maxSuggestions={8}
            />
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
