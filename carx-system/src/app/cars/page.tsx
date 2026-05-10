'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, AlertCircle, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { api } from '../../lib/api';
import CarCard3D from '../../components/CarCard3D';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function CarsGallery() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      const res = await api.cars.getAll() as any;
      if (res.error) {
        setError(res.error);
      } else if (res.data) {
        const result = res.data;
        setCars(result.data?.cars || result.cars || []);
      }
      setLoading(false);
    };

    fetchCars();
  }, []);

  const filteredCars = cars.filter(car => 
    car.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      {/* Header Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none" />

      <div className="pt-40 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto relative z-10">
        
        {/* Gallery Header */}
        <div className="space-y-12 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-xs">مجموعتنا</h2>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter">معرض <span className="text-white/20">النخبة</span></h1>
              <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                اكتشف الأناقة والقوة في مكان واحد. مجموعتنا المختارة بعناية من أفخم العلامات التجارية العالمية.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 bg-white/5 p-2 rounded-3xl border border-white/5"
            >
              <button className="p-4 rounded-2xl bg-luxury-gold text-black shadow-lg">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button className="p-4 rounded-2xl hover:bg-white/5 transition-colors">
                <List className="w-5 h-5 text-white/40" />
              </button>
            </motion.div>
          </div>

          {/* Search & Filter Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-4 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-4"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-luxury-gold" />
              <input 
                type="text" 
                placeholder="ما الذي تبحث عنه اليوم؟ (مثال: مرسيدس G-Class)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pr-14 pl-6 text-lg text-white focus:outline-none focus:border-luxury-gold/30 focus:bg-white/10 transition-all placeholder:text-white/10"
                dir="rtl"
              />
            </div>
            <div className="flex gap-4 w-full lg:w-auto">
              <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white/5 border border-white/5 hover:border-luxury-gold/30 hover:bg-white/10 transition-all font-bold group">
                <SlidersHorizontal className="w-5 h-5 text-luxury-gold group-hover:rotate-180 transition-transform duration-500" />
                تصفية النتائج
              </button>
              <div className="h-14 w-[1px] bg-white/5 hidden lg:block" />
              <div className="flex items-center gap-3 px-6 text-white/30 text-sm font-bold">
                <span className="text-luxury-gold">{filteredCars.length}</span> سيارة متاحة
              </div>
            </div>
          </motion.div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[500px] rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-red-500/5 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">عذراً، حدث خطأ ما</h3>
              <p className="text-white/40 max-w-sm mx-auto">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-luxury-gold transition-colors"
            >
              إعادة التحميل
            </button>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-16 h-16 text-white/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black">لا توجد نتائج</h3>
              <p className="text-white/40 max-w-sm mx-auto text-lg font-medium">لم نتمكن من العثور على سيارات تطابق بحثك. جرب كلمات بحث أخرى.</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {filteredCars.map((car, idx) => (
              <CarCard3D key={car._id || idx} car={car} index={idx} />
            ))}
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
