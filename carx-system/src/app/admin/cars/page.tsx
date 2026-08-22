'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, Filter, 
  CheckCircle2, XCircle, ArrowRight, Globe, Car 
} from 'lucide-react';
import { api } from '../../../lib/api';

const KOREAN_MAP: Record<string, string> = {
  '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس', '쌍용': 'سانغ يونغ',
  'KG모빌리티': 'كي جي موبيليتي', '르노코리아': 'رينو الكورية', '르노삼성': 'سامسونج رينو',
  '쉐보레': 'شيفروليه', '벤츠': 'مرسيدس بنز', 'BMW': 'بي إم دبليو', '아우디': 'أودي',
  '포르쉐': 'بورشه', '폭스바겐': 'فولكس فاجن', '재규어': 'جاغوار', '시리즈': 'فئة',
  '팰리세이드': 'باليساد', '그랜저': 'جرانديور', '아반떼': 'إلانترا', '쏘나타': 'سوناتا',
  '투싼': 'توسان', '싼타페': 'سانتافي', '코나': 'كونا', '카니발': 'كارنيفال',
  '쏘렌토': 'سورينتو', '스포티지': 'سبورتاج', '셀토스': 'سيلتوس', '모닝': 'مورنينج',
  '랭글러': 'رانجلر', '루비콘': 'روبيكون', '4도어': '4 أبواب', '스포츠': 'رياضية',
  '휘발유': 'بنزين', '가솔린': 'بنزين', '경유': 'ديزل', '디젤': 'ديزل',
  '하이브리드': 'هايبرد', '전기': 'كهرباء', 'LPG': 'غاز (LPG)', '오토': 'أوتوماتيك'
};

function cleanKoreanText(text: string, isRTL = true): string {
  if (!text || typeof text !== 'string') return text || '';
  let res = text.trim();
  Object.keys(KOREAN_MAP).forEach(k => {
    res = res.replace(new RegExp(k, 'gi'), KOREAN_MAP[k]);
  });
  res = res.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
  return res.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim() || text;
}

function formatCarTitle(title: string, make: string, isRTL = true): string {
  if (!title) return '';
  return cleanKoreanText(title, isRTL);
}

// مكون صورة آمن مع proxy للصور الخارجية وfallback
function SafeCarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [imgSrc, setImgSrc] = React.useState(src || '');
  const [errored, setErrored] = React.useState(false);

  const PLACEHOLDER = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=200&auto=format&fit=crop';

  React.useEffect(() => {
    setImgSrc(src || '');
    setErrored(false);
  }, [src]);

  const resolved = !imgSrc || errored
    ? PLACEHOLDER
    : imgSrc.startsWith('http') && !imgSrc.includes('cloudinary') && !imgSrc.includes('unsplash')
      ? `/api/v2/image-proxy?url=${encodeURIComponent(imgSrc)}`
      : imgSrc;

  return (
    <img
      src={resolved}
      alt={alt || ''}
      className={className}
      onError={() => {
        if (resolved !== PLACEHOLDER && resolved !== imgSrc) {
          // جرب الرابط الأصلي أولاً
          setImgSrc(imgSrc);
        } else {
          setErrored(true);
        }
      }}
    />
  );
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'korean_import' | 'hm_local' | null>(null);

  const fetchCars = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.cars.getAll({ status: 'all', limit: '300' }) as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const fetchedCars = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result?.data?.cars || result?.cars || []);
        setCars(fetchedCars);
      }
    } catch (err) {
      setError('فشل جلب السيارات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
      try {
        const res = await api.cars.delete(id);
        if (!res.error) {
          fetchCars();
        } else {
          alert(res.error || 'فشل حذف السيارة');
        }
      } catch (err) {
        alert('فشل الاتصال بالخادم لحذف السيارة');
      }
    }
  };

  useEffect(() => { 
    fetchCars(); 
  }, []);

  const koreanCarsCount = cars.filter(car => car.source === 'korean_import').length;
  const localCarsCount = cars.filter(car => car.source !== 'korean_import').length;

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.brand || car.make || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.model || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeSection === 'korean_import') {
      return car.source === 'korean_import';
    } else if (activeSection === 'hm_local') {
      return car.source !== 'korean_import';
    }
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <AnimatePresence mode="wait">
        {activeSection === null ? (
          // --- Section Selection View ---
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-black">إدارة السيارات</h1>
              <p className="text-white/40 text-sm mt-2">اختر المعرض المراد إدارته والتحكم في مخزونه</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-6">
              {/* Korean Showroom Card */}
              <div 
                onClick={() => setActiveSection('korean_import')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Globe className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">المعرض الكوري</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    إدارة واستعراض السيارات المستوردة من كوريا الجنوبية والمدخلة تلقائياً عبر نظام السحب.
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                  {loading ? '...' : `${koreanCarsCount} سيارة مستوردة`}
                </div>
              </div>

              {/* Local CAR X Card */}
              <div 
                onClick={() => setActiveSection('hm_local')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Car className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">معرض CAR X</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    إدارة واستعراض السيارات الفاخرة والمحلية المضافة يدوياً من قبل إدارة المعرض.
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                  {loading ? '...' : `${localCarsCount} سيارة محلية`}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // --- Cars Table List View ---
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Back to selection */}
            <button 
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-4"
            >
              <ArrowRight className="w-4 h-4" />
              الرجوع لاختيار المعرض
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black">
                  إدارة السيارات - {activeSection === 'korean_import' ? 'المعرض الكوري' : 'معرض CAR X'}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {activeSection === 'korean_import' 
                    ? 'إدارة مخزون السيارات المستوردة من كوريا الجنوبية' 
                    : 'تحكم في مخزون السيارات المحلية والفاخرة المضافة يدوياً'}
                </p>
              </div>
              <Link 
                href={activeSection === 'korean_import' ? '/admin/import' : '/admin/cars/new'} 
                className="flex items-center gap-2 px-5 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                {activeSection === 'korean_import' ? 'استيراد سيارة كورية' : 'إضافة سيارة جديدة'}
              </Link>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="ابحث عن سيارة بالاسم أو الماركة أو الموديل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all text-right"
                  dir="rtl"
                />
              </div>
              <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2 hover:bg-white/10">
                <Filter className="w-4 h-4" />
                تصفية
              </button>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right" dir="rtl">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السيارة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الماركة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السعر</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الحالة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">تاريخ الإضافة</th>
                      <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-6 py-8 h-20 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : filteredCars.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center text-white/20 font-bold">
                          {error || 'لا توجد سيارات مطابقة للبحث في هذا القسم'}
                        </td>
                      </tr>
                    ) : (
                      filteredCars.map((car) => (
                        <tr key={car._id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <SafeCarImage
                                src={car.mainImage || car.imageUrl || car.images?.[0]}
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                                alt={car.title || ''}
                              />
                              <div>
                                <div className="font-bold text-sm">{formatCarTitle(car.title, car.make || car.brand || '', true)}</div>
                                <div className="text-[10px] text-white/30 uppercase">{car.year}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-white/60">
                            {cleanKoreanText(car.brand || car.make || 'غير محدد', true)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-sm">
                            {car.price?.toLocaleString()} <span className="text-[10px] text-white/20">ريال</span>
                          </td>
                          <td className="px-6 py-4">
                            {car.isActive ? (
                              <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> نشط
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-white/20 text-xs font-bold">
                                <XCircle className="w-3.5 h-3.5" /> مخفي
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-white/40">
                            {car.createdAt ? new Date(car.createdAt).toLocaleDateString('ar-SA') : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link 
                                href={`/admin/cars/${car._id}/edit`} 
                                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-luxury-gold transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(car._id)}
                                className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
