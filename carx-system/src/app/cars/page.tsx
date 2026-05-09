'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import CarCard3D from '@/components/CarCard3D';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
    <main className="min-h-screen bg-[#050505] text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2"
          >
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
              المعرض
            </h1>
            <p className="text-white/40 text-sm md:text-base max-w-md">
              استكشف مجموعتنا الحصرية من السيارات الفاخرة والمميزة.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 w-full md:w-auto"
          >
            <div className="relative flex-1 md:w-80">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="ابحث عن سيارة، ماركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-11 pl-4 text-sm text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                dir="rtl"
              />
            </div>
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-luxury-gold/30 transition-all shrink-0">
              <Filter className="w-4 h-4 text-white/70" />
            </button>
          </motion.div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500/70" />
            </div>
            <div className="text-white/60">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
            <Search className="w-12 h-12 text-white/20" />
            <h3 className="text-xl font-bold text-white/70">لم يتم العثور على سيارات</h3>
            <p className="text-white/40 text-sm">جرب تغيير كلمات البحث أو إزالة الفلاتر</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
