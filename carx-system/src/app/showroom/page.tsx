'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, LayoutGrid, List, X,
  ChevronDown, Sparkles, ArrowUpDown, Car, GitCompare
} from 'lucide-react';
import { api } from '../../lib/api';
import CarCard3D from '../../components/CarCard3D';
import LuxuryCarCard from '../../components/LuxuryCarCard';
import CarCardSkeleton from '../../components/CarCardSkeleton';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonSystem from '../../components/ComparisonSystem';

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'year-desc', label: 'الموديل: الأحدث' },
];

const FUEL_TYPES = ['بنزين', 'ديزل', 'كهرباء', 'هايبرد'];
const TRANSMISSIONS = ['أوتوماتيك', 'مانيوال'];

export default function ShowroomPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([2015, 2026]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      // [[FIX]] تصفية السيارات بـ listingType=showroom لعرض المعرض الكوري فقط
      const res = await api.cars.getAll({ listingType: 'showroom', limit: '200' }) as any;
      if (res.data) {
        const result = res.data;
        const fetchedCars = result.data?.cars || result.cars || [];
        // احتياطي: إذا لم تكن هناك سيارات showroom، جلب كل السيارات
        if (fetchedCars.length === 0) {
          const fallback = await api.cars.getAll({ limit: '200' }) as any;
          if (fallback.data) {
            setCars(fallback.data?.data?.cars || fallback.data?.cars || []);
          }
        } else {
          setCars(fetchedCars);
        }
      }
      setLoading(false);
    };
    fetchCars();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const brandParam = params.get('make') || params.get('brand');
      const searchParam = params.get('search');
      if (brandParam) {
        setSelectedBrand(brandParam);
        setShowFilters(true);
      }
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Extract unique brands from data
  const brands = useMemo(() => {
    const brandSet = new Set(cars.map(c => c.brand || c.make).filter(Boolean));
    return Array.from(brandSet);
  }, [cars]);

  // Filter & Sort
  const filteredCars = useMemo(() => {
    let result = [...cars];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title?.toLowerCase().includes(q) || 
        (c.brand || c.make || '').toLowerCase().includes(q)
      );
    }
    if (selectedBrand) result = result.filter(c => (c.brand || c.make) === selectedBrand);
    if (selectedFuel) {
      result = result.filter(c => {
        const fuel = c.fuelType?.toLowerCase();
        if (selectedFuel === 'بنزين') return fuel === 'petrol' || fuel === 'gasoline' || fuel === 'بنزين';
        if (selectedFuel === 'ديزل') return fuel === 'diesel' || fuel === 'ديزل';
        if (selectedFuel === 'كهرباء') return fuel === 'electric' || fuel === 'كهرباء';
        if (selectedFuel === 'هايبرد') return fuel === 'hybrid' || fuel === 'هايبرد';
        return true;
      });
    }
    if (selectedTransmission) {
      result = result.filter(c => {
        const trans = c.transmission?.toLowerCase();
        if (selectedTransmission === 'أوتوماتيك') return trans === 'automatic' || trans === 'أوتوماتيك';
        if (selectedTransmission === 'مانيوال') return trans === 'manual' || trans === 'مانيوال';
        return true;
      });
    }
    result = result.filter(c => {
      const price = c.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    result = result.filter(c => {
      const year = c.year || 2024;
      return year >= yearRange[0] && year <= yearRange[1];
    });

    // Sort
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'year-desc': result.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      default: result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return result;
  }, [cars, searchQuery, selectedBrand, selectedFuel, selectedTransmission, priceRange, yearRange, sortBy]);

  const activeFilterCount = [selectedBrand, selectedFuel, selectedTransmission].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedBrand('');
    setSelectedFuel('');
    setSelectedTransmission('');
    setPriceRange([0, 5000000]);
    setYearRange([2015, 2026]);
    setSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-28 md:pt-36 pb-10 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-luxury-gold/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 md:space-y-6 mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-luxury-gold" />
              <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">معرض حصري</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter">
              صالة العرض <span className="text-luxury-gold">الفاخرة</span>
            </h1>
            <p className="text-white/40 text-sm md:text-lg max-w-2xl mx-auto">
              تصفح مجموعتنا الحصرية مع إمكانيات بحث متقدمة وفلاتر ذكية للوصول لسيارة أحلامك.
            </p>
          </motion.div>

          {/* Search & Controls Bar */}
          <div className="glass-panel p-4 rounded-3xl md:rounded-[2.5rem]">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-gold" />
                <input 
                  type="text" 
                  placeholder="ابحث عن سيارة أحلامك... (مثال: مرسيدس G-Class 2024)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl md:rounded-2xl py-3.5 md:py-5 pr-14 pl-6 text-sm md:text-lg text-white focus:outline-none focus:border-luxury-gold/30 focus:bg-white/10 transition-all placeholder:text-white/15"
                  dir="rtl"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-4 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-2xl border font-bold transition-all text-xs md:text-sm ${
                    showFilters ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/5 hover:border-luxury-gold/30'
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  فلترة
                  {activeFilterCount > 0 && (
                    <span className="w-6 h-6 rounded-full bg-black text-luxury-gold text-xs font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort */}
                <div className="relative group flex-1 lg:flex-none">
                  <button className="w-full flex items-center justify-center gap-2 px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all font-bold text-xs md:text-sm">
                    <ArrowUpDown className="w-4 h-4 text-luxury-gold" />
                    ترتيب
                    <ChevronDown className="w-4 h-4 text-white/30" />
                  </button>
                  <div className="absolute top-full mt-2 left-0 right-0 min-w-[200px] glass-panel rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {SORT_OPTIONS.map(opt => (
                      <button 
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`w-full text-right px-4 py-3 rounded-xl text-sm transition-colors ${
                          sortBy === opt.value ? 'bg-luxury-gold text-black font-bold' : 'text-white/60 hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Toggle */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-luxury-gold text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-luxury-gold text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Results Count */}
                <div className="hidden lg:flex items-center gap-2 px-6 text-white/30 text-sm font-bold whitespace-nowrap">
                  <span className="text-luxury-gold text-lg">{filteredCars.length}</span> سيارة
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="container mx-auto px-6 pb-8">
              <div className="glass-panel p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Brand Filter */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">العلامة التجارية</label>
                  <select 
                    value={selectedBrand} 
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-luxury-gold/40 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-black">الكل</option>
                    {brands.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                  </select>
                </div>

                {/* Fuel Type */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">نوع الوقود</label>
                  <div className="flex flex-wrap gap-2">
                    {FUEL_TYPES.map(fuel => (
                      <button 
                        key={fuel} 
                        onClick={() => setSelectedFuel(selectedFuel === fuel ? '' : fuel)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedFuel === fuel 
                            ? 'bg-luxury-gold text-black border-luxury-gold' 
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transmission */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">ناقل الحركة</label>
                  <div className="flex gap-2">
                    {TRANSMISSIONS.map(t => (
                      <button 
                        key={t}
                        onClick={() => setSelectedTransmission(selectedTransmission === t ? '' : t)}
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedTransmission === t 
                            ? 'bg-luxury-gold text-black border-luxury-gold' 
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear */}
                <div className="flex items-end">
                  <button 
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                    مسح الفلاتر
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Cars Grid */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <CarCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-28 h-28 rounded-full bg-white/5 flex items-center justify-center">
                <Car className="w-14 h-14 text-white/10" />
              </div>
              <h3 className="text-3xl font-black">لا توجد نتائج</h3>
              <p className="text-white/40 max-w-sm">لم نجد سيارات تطابق معايير البحث. جرب تعديل الفلاتر.</p>
              <button onClick={clearFilters} className="bg-luxury-gold text-black px-8 py-4 rounded-2xl font-black hover:bg-white transition-colors">
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10' 
                : 'flex flex-col gap-6'
              }
            >
              {filteredCars.map((car, idx) =>
                viewMode === 'list' ? (
                  <LuxuryCarCard key={car._id || idx} car={{
                    _id: car._id || car.id || '',
                    title: car.title || '',
                    make: car.brand || car.make || '',
                    model: car.model || '',
                    year: car.year || 2024,
                    price: car.price || 0,
                    priceSar: car.priceSar,
                    images: car.images?.length ? car.images : [car.mainImage || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80'],
                    mileage: car.mileage,
                    fuelType: car.fuelType,
                    transmission: car.transmission,
                    color: car.color,
                    condition: car.condition,
                    featured: car.isFeatured,
                  }} index={idx} />
                ) : (
                  <CarCard3D key={car._id || idx} car={car} index={idx} />
                )
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Comparison Panel */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-bold transition-all ${
                showComparison
                  ? 'bg-luxury-gold text-black border-luxury-gold'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-luxury-gold/30'
              }`}
            >
              <GitCompare className="w-5 h-5" />
              مقارنة السيارات
            </button>
          </div>

          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ComparisonSystem
                  cars={filteredCars.map(c => ({
                    _id: c._id || c.id || '',
                    title: c.title || '',
                    make: c.brand || c.make || '',
                    model: c.model || '',
                    year: c.year || 2024,
                    price: c.price || 0,
                    priceSar: c.priceSar,
                    images: c.images?.length ? c.images : [c.mainImage || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80'],
                    mileage: c.mileage,
                    fuelType: c.fuelType,
                    transmission: c.transmission,
                    color: c.color,
                    condition: c.condition,
                  }))}
                  maxCompare={3}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </main>
  );
}
