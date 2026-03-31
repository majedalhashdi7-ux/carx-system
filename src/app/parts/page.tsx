'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UltraModernPartCard from '@/components/UltraModernPartCard';
import BackButton from '@/components/BackButton';
import Breadcrumb from '@/components/Breadcrumb';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

interface Part {
  _id: string;
  name: string;
  nameAr?: string;
  brand?: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  price: number;
  priceSar?: number;
  images?: string[];
  img?: string;
  condition?: 'NEW' | 'USED' | 'REFURBISHED';
  partType?: string;
  stockQty?: number;
  compatibility?: string[];
  inStock?: boolean;
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '+967781007805';

export default function PartsPage() {
  const { isRTL } = useLanguage();
  const { isLoggedIn } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [carMake, setCarMake] = useState('');
  const [partType, setPartType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [categories, setCategories] = useState<string[]>([]);
  const [carMakes, setCarMakes] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchParts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (carMake) params.set('carMake', carMake);
      if (partType) params.set('partType', partType);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/parts?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setParts(data.data);
        setPagination(data.pagination);
        if (data.filters?.categories?.length) setCategories(data.filters.categories);
        if (data.filters?.carMakes?.length) setCarMakes(data.filters.carMakes);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [page, carMake, partType, sortBy]);

  const handlePartClick = (part: Part) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    const msg = `مرحباً، أريد الاستفسار عن قطعة:\n*${part.nameAr || part.name}*\nالسعر: ${(part.priceSar || part.price || 0).toLocaleString()} ر.س`;
    window.open(`https://wa.me/${WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`min-h-screen bg-black text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Header */}
      <div className="pt-20 pb-8 bg-gradient-to-b from-zinc-950 to-black border-b border-white/5">
        <div className="container mx-auto px-4">
          {/* أزرار الرجوع */}
          <div className="mb-6">
            <BackButton showHome={true} />
          </div>

          <div className="mb-6">
            <Breadcrumb items={[{ label: 'قطع الغيار' }]} />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-4xl md:text-6xl font-black mb-3">
              <span className="text-white">قطع </span>
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">الغيار</span>
            </h1>
            <p className="text-gray-400">
              {pagination.total > 0 ? `${pagination.total} قطعة متاحة` : 'قطع غيار أصلية ومضمونة'}
            </p>
          </motion.div>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن قطعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchParts()}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <button onClick={fetchParts} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              بحث
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <select
              value={carMake}
              onChange={(e) => { setCarMake(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">كل الماركات</option>
              {carMakes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={partType}
              onChange={(e) => { setPartType(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="">كل الفئات</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            >
              <option value="createdAt">الأحدث</option>
              <option value="price">السعر: الأقل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchParts} className="bg-red-600 text-white px-6 py-2 rounded-lg">إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && parts.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">لا توجد قطع</h3>
            <p className="text-gray-600">حاول تغيير معايير البحث</p>
          </div>
        )}

        {!loading && !error && parts.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {parts.map((part, index) => (
                <Link key={part._id} href={`/parts/${part._id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <UltraModernPartCard
                      part={{
                        _id: part._id,
                        name: part.nameAr || part.name,
                        nameAr: part.nameAr,
                        brand: part.carMake || '',
                        price: part.price,
                        img: part.images?.[0] || part.img || '',
                        condition: (part.condition as 'NEW' | 'USED' | 'REFURBISHED') || 'NEW',
                        category: part.partType || '',
                        stockQty: part.stockQty || 0,
                      }}
                      index={index}
                      onClick={() => handlePartClick(part)}
                      onLoginRequired={() => setShowLoginModal(true)}
                    />
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30">السابق</button>
                <span className="px-4 py-2 text-gray-400">{page} / {pagination.pages}</span>
                <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30">التالي</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center"
          >
            <h3 className="text-xl font-bold mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-gray-400 mb-6">يجب تسجيل الدخول للاستفسار عن قطع الغيار</p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-center">
                تسجيل الدخول
              </Link>
              <button onClick={() => setShowLoginModal(false)}
                className="flex-1 border border-white/20 text-white py-3 rounded-xl hover:bg-white/5 transition-colors">
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}