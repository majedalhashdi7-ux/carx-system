'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown, Car as CarIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import UltraModernCarCard from '@/components/UltraModernCarCard';
import BackButton from '@/components/BackButton';
import Breadcrumb from '@/components/Breadcrumb';
import { useLanguage } from '@/lib/LanguageContext';

interface Car {
  _id: string;
  title: string;
  make: string;
  makeLogoUrl?: string;
  model: string;
  year: number;
  price: number;
  priceSar?: number;
  priceUsd?: number;
  priceKrw?: number;
  images: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  source?: string;
  isInspected?: boolean;
}

interface Filters {
  search: string;
  make: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  fuelType: string;
  transmission: string;
  condition: string;
  sortBy: string;
  sortOrder: string;
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '+967781007805';

const initialFilters: Filters = {
  search: '',
  make: '',
  minPrice: '',
  maxPrice: '',
  minYear: '',
  maxYear: '',
  fuelType: '',
  transmission: '',
  condition: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function ShowroomPage() {
  const { isRTL } = useLanguage();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [page, setPage] = useState(1);

  const fetchCars = useCallback(async (currentFilters: Filters, currentPage: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');
      if (currentFilters.search) params.set('search', currentFilters.search);
      if (currentFilters.make) params.set('make', currentFilters.make);
      if (currentFilters.minPrice) params.set('minPrice', currentFilters.minPrice);
      if (currentFilters.maxPrice) params.set('maxPrice', currentFilters.maxPrice);
      if (currentFilters.minYear) params.set('minYear', currentFilters.minYear);
      if (currentFilters.maxYear) params.set('maxYear', currentFilters.maxYear);
      if (currentFilters.fuelType) params.set('fuelType', currentFilters.fuelType);
      if (currentFilters.transmission) params.set('transmission', currentFilters.transmission);
      if (currentFilters.condition) params.set('condition', currentFilters.condition);
      params.set('sortBy', currentFilters.sortBy);
      params.set('sortOrder', currentFilters.sortOrder);

      const res = await fetch(`/api/cars?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCars(data.data);
        setPagination(data.pagination);
        if (data.filters?.makes?.length) setMakes(data.filters.makes);
      } else {
        setError(data.error || 'حدث خطأ في جلب البيانات');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars(filters, page);
  }, [page, fetchCars]);

  const handleSearch = () => {
    setPage(1);
    fetchCars(filters, 1);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setPage(1);
    fetchCars(initialFilters, 1);
  };

  const handleContact = (car: Car) => {
    const msg = `مرحباً، أريد الاستفسار عن:\n*${car.title}*\nالسنة: ${car.year} | السعر: ${(car.priceSar || car.price || 0).toLocaleString()} ر.س`;
    window.open(`https://wa.me/${WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, val]) => !['sortBy', 'sortOrder'].includes(key) && val !== ''
  ).length;

  return (
    <div className={`min-h-screen bg-black text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Hero Header */}
      <div className="pt-20 pb-8 bg-gradient-to-b from-zinc-950 to-black border-b border-white/5">
        <div className="container mx-auto px-4">
          {/* أزرار الرجوع والتنقل */}
          <div className="mb-6">
            <BackButton showHome={true} />
          </div>

          <div className="mb-6">
            <Breadcrumb items={[{ label: 'معرض السيارات' }]} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-3">
              <span className="text-white">معرض </span>
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">السيارات</span>
            </h1>
            <p className="text-gray-400 text-lg">
              {pagination.total > 0 ? `${pagination.total} سيارة متاحة` : 'اكتشف أفضل السيارات'}
            </p>
          </motion.div>

          {/* Search + Filter Bar */}
          <div className="flex gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن ماركة، موديل..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              بحث
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-white/10 text-gray-400 bg-white/5 hover:border-white/20'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">فلترة</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-w-3xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Make filter */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">الماركة</label>
                      <select
                        value={filters.make}
                        onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="">الكل</option>
                        {makes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    {/* Year range */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">السنة من</label>
                      <input
                        type="number"
                        placeholder="2018"
                        value={filters.minYear}
                        onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">السنة إلى</label>
                      <input
                        type="number"
                        placeholder="2024"
                        value={filters.maxYear}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Price range */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">السعر من (ر.س)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">السعر إلى (ر.س)</label>
                      <input
                        type="number"
                        placeholder="500000"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Fuel type */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">نوع الوقود</label>
                      <select
                        value={filters.fuelType}
                        onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="">الكل</option>
                        <option value="Petrol">بنزين</option>
                        <option value="Diesel">ديزل</option>
                        <option value="Electric">كهرباء</option>
                        <option value="Hybrid">هجين</option>
                      </select>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ناقل الحركة</label>
                      <select
                        value={filters.transmission}
                        onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="">الكل</option>
                        <option value="Automatic">أوتوماتيك</option>
                        <option value="Manual">يدوي</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">ترتيب حسب</label>
                      <select
                        value={`${filters.sortBy}-${filters.sortOrder}`}
                        onChange={(e) => {
                          const [sortBy, sortOrder] = e.target.value.split('-');
                          setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                        }}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="createdAt-desc">الأحدث أولاً</option>
                        <option value="price-asc">السعر: الأقل</option>
                        <option value="price-desc">السعر: الأعلى</option>
                        <option value="year-desc">الأحدث سنةً</option>
                        <option value="mileage-asc">أقل كيلومترات</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter actions */}
                  <div className="flex gap-3 mt-4 justify-end">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      إعادة ضبط
                    </button>
                    <button
                      onClick={() => { handleSearch(); setShowFilters(false); }}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      تطبيق الفلاتر
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cars Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">جاري التحميل...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchCars(filters, page)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cars.length === 0 && (
          <div className="text-center py-20">
            <CarIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">لا توجد سيارات</h3>
            <p className="text-gray-600 mb-6">حاول تغيير معايير البحث</p>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
              إعادة ضبط الفلاتر
            </button>
          </div>
        )}

        {/* Cars Grid */}
        {!loading && !error && cars.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car, index) => (
                <motion.div
                  key={car._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/showroom/${car._id}`}>
                    <UltraModernCarCard
                      car={{ ...car, id: car._id }}
                      index={index}
                      formatPrice={(price) => `${price.toLocaleString('ar-SA')} ر.س`}
                      onContact={(c) => handleContact(c as unknown as Car)}
                      onViewDetails={() => {}}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  السابق
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page + i - 2;
                  if (p < 1 || p > pagination.pages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                        p === page
                          ? 'bg-red-600 text-white'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}