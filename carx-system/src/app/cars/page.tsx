'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, LayoutGrid, List, X,
  ChevronDown, ArrowUpDown, Car, Sparkles
} from 'lucide-react';
import { api } from '../../lib/api';
import CarCard3D from '../../components/CarCard3D';
import LuxuryCarCard from '../../components/LuxuryCarCard';
import CarCardSkeleton from '../../components/CarCardSkeleton';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ComparisonSystem from '../../components/ComparisonSystem';
import Link from 'next/link';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'الأحدث أولاً' },
  { value: 'price-asc',  label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'year-desc',  label: 'الموديل: الأحدث' },
  { value: 'mileage',    label: 'الأقل ممشى' },
];

const FUEL_TYPES    = ['بنزين', 'ديزل', 'كهرباء', 'هايبرد'];
const TRANSMISSIONS = ['أوتوماتيك', 'مانيوال'];

export default function CarsGallery() {
  const [cars, setCars]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy]       = useState('newest');
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [selectedBrand, setSelectedBrand]               = useState('');
  const [selectedFuel, setSelectedFuel]                 = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [priceRange, setPriceRange]                     = useState<[number, number]>([0, 5000000]);
  const [yearRange, setYearRange]                       = useState<[number, number]>([2015, 2026]);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        const res = await api.cars.getAll({ limit: '200' }) as any;
        if (res.data) {
          const result = res.data;
          const fetched = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : (result.data?.cars || result.cars || []);
          setCars(fetched);
        }
      } catch {
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const brand  = params.get('make') || params.get('brand');
      const search = params.get('search');
      if (brand)  { setSelectedBrand(brand); setShowFilters(true); }
      if (search) setSearchQuery(search);
    }
  }, []);

  const brands = useMemo(() => {
    const set = new Set(cars.map(c => c.brand || c.make).filter(Boolean));
    return Array.from(set) as string[];
  }, [cars]);

  const filteredCars = useMemo(() => {
    let result = [...cars];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        (c.brand || c.make || '').toLowerCase().includes(q) ||
        c.model?.toLowerCase().includes(q)
      );
    }
    if (selectedBrand) result = result.filter(c => (c.brand || c.make) === selectedBrand);
    if (selectedFuel) {
      result = result.filter(c => {
        const f = c.fuelType?.toLowerCase();
        if (selectedFuel === 'بنزين') return f === 'petrol' || f === 'gasoline' || f === 'بنزين';
        if (selectedFuel === 'ديزل')  return f === 'diesel'  || f === 'ديزل';
        if (selectedFuel === 'كهرباء') return f === 'electric' || f === 'كهرباء';
        if (selectedFuel === 'هايبرد') return f === 'hybrid'  || f === 'هايبرد';
        return true;
      });
    }
    if (selectedTransmission) {
      result = result.filter(c => {
        const t = c.transmission?.toLowerCase();
        if (selectedTransmission === 'أوتوماتيك') return t === 'automatic' || t === 'أوتوماتيك';
        if (selectedTransmission === 'مانيوال')   return t === 'manual'    || t === 'مانيوال';
        return true;
      });
    }
    result = result.filter(c => {
      const p = c.priceSar || c.price || 0;
      return p >= priceRange[0] && p <= priceRange[1];
    });
    result = result.filter(c => {
      const y = c.year || 2024;
      return y >= yearRange[0] && y <= yearRange[1];
    });
    switch (sortBy) {
      case 'price-asc':  result.sort((a, b) => (a.priceSar || a.price || 0) - (b.priceSar || b.price || 0)); break;
      case 'price-desc': result.sort((a, b) => (b.priceSar || b.price || 0) - (a.priceSar || a.price || 0)); break;
      case 'year-desc':  result.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case 'mileage':    result.sort((a, b) => (a.mileage || 0) - (b.mileage || 0)); break;
      default:           result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return result;
  }, [cars, searchQuery, selectedBrand, selectedFuel, selectedTransmission, priceRange, yearRange, sortBy]);

  const activeFilterCount = [selectedBrand, selectedFuel, selectedTransmission].filter(Boolean).length;
  const clearFilters = () => {
    setSelectedBrand(''); setSelectedFuel(''); setSelectedTransmission('');
    setPriceRange([0, 5000000]); setYearRange([2015, 2026]); setSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-luxury-gold/4 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 pt-32 pb-24 px-4 md:px-8 max-w-[1700px] mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-luxury-gold" />
            <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">معرض السيارات</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            مجموعة <span className="text-luxury-gold">النخبة</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed">
            اكتشف الأناقة والقوة في مكان واحد. مجموعتنا المختارة بعناية من أفخم العلامات التجارية العالمية.
          </p>
        </motion.div>

        {/* Search & Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-4 rounded-[2.5rem] mb-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-gold" />
              <input type="text" placeholder="ابحث عن سيارة أحلامك..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 md:py-5 pr-14 pl-6 text-base md:text-lg text-white focus:outline-none focus:border-luxury-gold/30 focus:bg-white/10 transition-all placeholder:text-white/15"
                dir="rtl" />
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border font-bold transition-all text-sm ${showFilters ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/5 hover:border-luxury-gold/30'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                فلترة
                {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-black text-luxury-gold text-xs font-black flex items-center justify-center">{activeFilterCount}</span>}
              </button>

              <div className="relative flex-1 lg:flex-none">
                <button onClick={() => setShowSortMenu(!showSortMenu)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all font-bold text-sm">
                  <ArrowUpDown className="w-4 h-4 text-luxury-gold" />
                  ترتيب
                  <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full mt-2 left-0 right-0 min-w-[200px] glass-panel rounded-2xl p-2 z-50">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                          className={`w-full text-right px-4 py-3 rounded-xl text-sm transition-colors ${sortBy === opt.value ? 'bg-luxury-gold text-black font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-luxury-gold text-black' : 'text-white/40 hover:text-white'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-luxury-gold text-black' : 'text-white/40 hover:text-white'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2 px-6 text-white/30 text-sm font-bold whitespace-nowrap">
                <span className="text-luxury-gold text-lg">{filteredCars.length}</span> سيارة
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6">
              <div className="glass-panel p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">العلامة التجارية</label>
                  <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-luxury-gold/40 appearance-none cursor-pointer">
                    <option value="" className="bg-black">الكل</option>
                    {brands.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">نوع الوقود</label>
                  <div className="flex flex-wrap gap-2">
                    {FUEL_TYPES.map(fuel => (
                      <button key={fuel} onClick={() => setSelectedFuel(selectedFuel === fuel ? '' : fuel)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedFuel === fuel ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'}`}>
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">ناقل الحركة</label>
                  <div className="flex gap-2">
                    {TRANSMISSIONS.map(t => (
                      <button key={t} onClick={() => setSelectedTransmission(selectedTransmission === t ? '' : t)}
                        className={`flex-1 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedTransmission === t ? 'bg-luxury-gold text-black border-luxury-gold' : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <button onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all">
                    <X className="w-4 h-4" /> مسح الفلاتر
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1,2,3,4,5,6].map(i => <CarCardSkeleton key={i} />)}
          </div>
        ) : cars.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-40 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-40 h-40 rounded-full bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center">
              <Car className="w-20 h-20 text-luxury-gold/20" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black">لا توجد سيارات بعد</h3>
              <p className="text-white/40 max-w-md mx-auto text-lg leading-relaxed">
                لم يتم إضافة أي سيارات حتى الآن. يمكن للأدمن استيراد السيارات من لوحة التحكم.
              </p>
            </div>
            <Link href="/admin/import/cars"
              className="inline-flex items-center gap-3 bg-luxury-gold text-black px-10 py-4 rounded-2xl font-black text-sm hover:bg-white transition-colors">
              <Sparkles className="w-5 h-5" />
              استيراد سيارات الآن
            </Link>
          </motion.div>
        ) : filteredCars.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-40 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center">
              <Car className="w-16 h-16 text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black">لا توجد نتائج</h3>
              <p className="text-white/40 max-w-sm mx-auto text-lg">لم نجد سيارات تطابق معايير البحث. جرب تعديل الفلاتر.</p>
            </div>
            <button onClick={clearFilters} className="bg-luxury-gold text-black px-10 py-4 rounded-2xl font-black hover:bg-white transition-colors">
              إعادة ضبط الفلاتر
            </button>
          </motion.div>
        ) : (
          <motion.div layout className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10' : 'flex flex-col gap-6'}>
            {filteredCars.map((car, idx) =>
              viewMode === 'list' ? (
                <LuxuryCarCard key={car._id || idx} car={{
                  _id: car._id || car.id || '', title: car.title || '',
                  make: car.brand || car.make || '', model: car.model || '',
                  year: car.year || 2024, price: car.price || 0, priceSar: car.priceSar,
                  images: car.images?.length ? car.images : [car.mainImage].filter(Boolean),
                  mileage: car.mileage, fuelType: car.fuelType,
                  transmission: car.transmission, color: car.color,
                  condition: car.condition, featured: car.isFeatured,
                }} index={idx} />
              ) : (
                <CarCard3D key={car._id || idx} car={car} index={idx} />
              )
            )}
          </motion.div>
        )}

        {filteredCars.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-20">
            <ComparisonSystem
              cars={filteredCars.map(c => ({
                _id: c._id || c.id || '', title: c.title || '',
                make: c.brand || c.make || '', model: c.model || '',
                year: c.year || 2024, price: c.price || 0, priceSar: c.priceSar,
                images: c.images?.length ? c.images : [c.mainImage].filter(Boolean),
                mileage: c.mileage, fuelType: c.fuelType,
                transmission: c.transmission, color: c.color, condition: c.condition,
              }))}
              maxCompare={3}
            />
          </motion.div>
        )}
      </div>
      <Footer />
    </main>
  );
}
