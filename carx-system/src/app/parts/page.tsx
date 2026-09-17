'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Wrench, X, Sparkles, Info } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LuxuryPartCard from '../../components/LuxuryPartCard';
import { api } from '../../lib/api';

// ─── قطع غيار تجريبية ───────────────────────────────────────────────────────
const DEMO_PARTS = [
  { _id: 'dp-1', name: 'فلتر زيت مرسيدس AMG', partNumber: 'MB-OIL-001', category: 'فلاتر', brand: 'Mercedes-Benz', price: 285, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true, isFeatured: true },
  { _id: 'dp-2', name: 'طقم فرامل BMW M Series', partNumber: 'BW-BRK-550', category: 'فرامل', brand: 'BMW', price: 1850, images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
  { _id: 'dp-3', name: 'بطارية بورش هجين', partNumber: 'PC-BAT-911', category: 'كهرباء', brand: 'Porsche', price: 4500, images: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
  { _id: 'dp-4', name: 'مجموعة تعليق لكزس LX', partNumber: 'LX-SUS-600', category: 'تعليق', brand: 'Lexus', price: 3200, images: ['https://images.unsplash.com/photo-1591293835940-934a7c4f2d9b?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
  { _id: 'dp-5', name: 'فلتر هواء رولز رويس', partNumber: 'RR-AIR-002', category: 'فلاتر', brand: 'Rolls-Royce', price: 620, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
  { _id: 'dp-6', name: 'مضخة زيت لامبورجيني', partNumber: 'LB-OMP-V10', category: 'محرك', brand: 'Lamborghini', price: 7800, images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true, isFeatured: true },
  { _id: 'dp-7', name: 'طقم إضاءة LED بنتلي', partNumber: 'BN-LED-GT3', category: 'إضاءة', brand: 'Bentley', price: 2400, images: ['https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
  { _id: 'dp-8', name: 'ناقل حركة فيراري', partNumber: 'FR-TRN-458', category: 'ناقل حركة', brand: 'Ferrari', price: 18500, images: ['https://images.unsplash.com/photo-1591293835940-934a7c4f2d9b?auto=format&fit=crop&q=80&w=800'], condition: 'new', isOriginal: true },
];

const CATEGORIES = ['فلاتر', 'فرامل', 'محرك', 'تعليق', 'كهرباء', 'إضاءة', 'ناقل حركة'];

export default function PartsPage() {
  const [parts, setParts]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isDemo, setIsDemo]       = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [showFilters, setShowFilters]         = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand]     = useState('');
  const [onlyOriginal, setOnlyOriginal]       = useState(false);

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const res = await api.parts.getAll();
        if (res.data) {
          const d = res.data as any;
          const list = Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d)
              ? d
              : (d?.data?.parts || d?.parts || []);
          if (list.length > 0) {
            setParts(list);
            setIsDemo(false);
          } else {
            setParts(DEMO_PARTS);
            setIsDemo(true);
          }
        } else {
          setParts(DEMO_PARTS);
          setIsDemo(true);
        }
      } catch {
        setParts(DEMO_PARTS);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    fetchParts();
  }, []);

  const brands = useMemo(() => {
    const set = new Set(parts.map(p => p.brand).filter(Boolean));
    return Array.from(set) as string[];
  }, [parts]);

  const filteredParts = useMemo(() => {
    let result = [...parts];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.partNumber?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (selectedBrand)    result = result.filter(p => p.brand === selectedBrand);
    if (onlyOriginal)     result = result.filter(p => p.isOriginal || p.condition === 'new');
    return result;
  }, [parts, searchTerm, selectedCategory, selectedBrand, onlyOriginal]);

  const activeFilterCount = [selectedCategory, selectedBrand, onlyOriginal ? '1' : ''].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setOnlyOriginal(false);
    setSearchTerm('');
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      {/* Ambient glow */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-luxury-gold/4 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 pt-32 pb-24 px-4 md:px-8 max-w-[1700px] mx-auto">

        {/* ── Demo Banner ───────────────────────────────────────── */}
        <AnimatePresence>
          {isDemo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 flex items-center gap-3 bg-luxury-gold/5 border border-luxury-gold/20 rounded-2xl px-6 py-4"
            >
              <Info className="w-5 h-5 text-luxury-gold shrink-0" />
              <p className="text-sm text-white/60">
                <span className="text-luxury-gold font-bold">عرض تجريبي</span>
                {' '}— قطع غيار افتراضية، سيتم عرض قطعك الفعلية بمجرد الاتصال بقاعدة البيانات.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Page Header ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
            <Sparkles className="w-4 h-4 text-luxury-gold" />
            <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">قطع غيار أصلية</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            الأداء <span className="text-luxury-gold">المثالي</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed">
            اكتشف مجموعتنا من قطع الغيار الأصلية المعتمدة لضمان أداء سيارتك بأعلى كفاءة ممكنة.
          </p>
        </motion.div>

        {/* ── Search & Controls ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 rounded-[2.5rem] mb-4"
        >
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-gold" />
              <input
                type="text"
                placeholder="ابحث برقم القطعة أو اسمها أو الماركة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 md:py-5 pr-14 pl-6 text-base md:text-lg text-white focus:outline-none focus:border-luxury-gold/30 focus:bg-white/10 transition-all placeholder:text-white/15"
                dir="rtl"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border font-bold transition-all text-sm ${
                  showFilters
                    ? 'bg-luxury-gold text-black border-luxury-gold'
                    : 'bg-white/5 border-white/5 hover:border-luxury-gold/30'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                فلترة
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-black text-luxury-gold text-xs font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden lg:flex items-center gap-2 px-6 text-white/30 text-sm font-bold whitespace-nowrap">
                <span className="text-luxury-gold text-lg">{filteredParts.length}</span> قطعة
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Filters Panel ─────────────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="glass-panel p-8 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Category */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">الفئة</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedCategory === cat
                            ? 'bg-luxury-gold text-black border-luxury-gold'
                            : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">الماركة</label>
                  <select
                    value={selectedBrand}
                    onChange={e => setSelectedBrand(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-luxury-gold/40 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-black">الكل</option>
                    {brands.map(b => <option key={b} value={b} className="bg-black">{b}</option>)}
                  </select>
                </div>

                {/* Original only */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-white/40 uppercase tracking-widest">نوع القطعة</label>
                  <button
                    onClick={() => setOnlyOriginal(!onlyOriginal)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      onlyOriginal
                        ? 'bg-luxury-gold text-black border-luxury-gold'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-luxury-gold/30'
                    }`}
                  >
                    قطع أصلية فقط
                  </button>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Parts Grid ────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-80 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredParts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40 space-y-6"
          >
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mx-auto">
              <Wrench className="w-16 h-16 text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black">لا توجد قطع مطابقة</h3>
              <p className="text-white/40 max-w-sm mx-auto text-lg">
                حاول البحث بكلمات مختلفة أو عدّل الفلاتر.
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="bg-luxury-gold text-black px-10 py-4 rounded-2xl font-black hover:bg-white transition-colors"
            >
              إعادة ضبط الفلاتر
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredParts.map((part, idx) => (
              <LuxuryPartCard
                key={part._id || idx}
                part={{
                  _id: part._id,
                  name: part.name,
                  partNumber: part.partNumber,
                  category: part.category,
                  brand: part.brand,
                  price: part.price,
                  priceSar: part.priceSar,
                  priceOnRequest: part.priceOnRequest || part.whatsappRequest || !part.price,
                  whatsappRequest: part.whatsappRequest,
                  images: part.images?.length ? part.images : [part.img].filter(Boolean),
                  stock: part.stock || part.stockQty,
                  condition: part.condition,
                  warranty: part.warranty,
                  compatibility: part.compatibility,
                  isOriginal: part.isOriginal || part.condition === 'new',
                  isFeatured: part.isFeatured,
                  rating: part.rating,
                  reviews: part.reviewsCount,
                }}
                index={idx}
              />
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
