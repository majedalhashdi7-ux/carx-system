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
      <div className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(30,60,180,0.15) 0%, transparent 70%), #000' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              {pagination.total > 0 ? `${pagination.total} قطعة متاحة` : 'قطع غيار أصلية'}
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none">
              <span className="text-white">قطع </span>
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>الغيار</span>
            </h1>
            <p className="text-white/40 text-lg">قطع أصلية مضمونة لجميع الموديلات</p>
          </motion.div>

          {/* Search */}
          <div className="flex gap-3 max-w-2xl mx-auto mb-5">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="ابحث عن قطعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchParts()}
                className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pr-10 pl-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.08] transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={fetchParts}
              className="text-white px-6 py-3 rounded-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 4px 20px rgba(59,130,246,0.35)' }}
            >
              بحث
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 justify-center flex-wrap">
            {[{
              value: carMake, onChange: (v: string) => { setCarMake(v); setPage(1); },
              options: [{ value: '', label: 'كل الماركات' }, ...carMakes.map(m => ({ value: m, label: m }))]
            }, {
              value: partType, onChange: (v: string) => { setPartType(v); setPage(1); },
              options: [{ value: '', label: 'كل الفئات' }, ...categories.map(c => ({ value: c, label: c }))]
            }, {
              value: sortBy, onChange: (v: string) => setSortBy(v),
              options: [{ value: 'createdAt', label: 'الأحدث' }, { value: 'price', label: 'السعر: الأقل' }]
            }].map((sel, i) => (
              <select key={i} value={sel.value} onChange={(e) => sel.onChange(e.target.value)}
                className="bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
              >
                {sel.options.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
              </select>
            ))}
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
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
              <div className="flex justify-center gap-3 mt-12 items-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all text-sm font-medium">السابق</motion.button>
                <span className="px-4 py-2 text-white/40 text-sm">{page} / {pagination.pages}</span>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all text-sm font-medium">التالي</motion.button>
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