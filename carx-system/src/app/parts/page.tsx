'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Settings, Wrench } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LuxuryPartCard from '../../components/LuxuryPartCard';
import { api } from '../../lib/api';

export default function PartsPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const res = await api.parts.getAll();
        if (res.data) {
          const d = res.data as any;
          const partsList = Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d)
              ? d
              : (d?.data?.parts || d?.parts || []);
          setParts(partsList);
        }
      } catch (error) {
        console.error('Failed to fetch parts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchParts();
  }, []);

  const filteredParts = parts.filter(part => 
    part.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      <section className="relative pt-28 md:pt-40 pb-10 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">قطع الغيار الأصلية</h2>
                <h1 className="text-3xl md:text-6xl font-black tracking-tighter mt-2">الأداء <span className="text-white/20">المثالي</span></h1>
              </div>
              <p className="text-white/40 max-w-md text-sm md:text-lg">
                اكتشف مجموعتنا من قطع الغيار الأصلية المعتمدة لضمان أداء سيارتك بأعلى كفاءة ممكنة.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text"
                placeholder="ابحث برقم القطعة أو اسمها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl py-3 md:py-4 pr-14 pl-6 text-sm md:text-lg focus:outline-none focus:border-luxury-gold/50 transition-all text-white placeholder:text-white/20"
                dir="rtl"
              />
            </div>
            <button className="px-4 md:px-8 py-3 md:py-4 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-sm font-bold">
              <Filter className="w-5 h-5" />
              الفلاتر
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10">
              <Wrench className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">لا توجد قطع مطابقة</h3>
              <p className="text-white/40">حاول البحث بكلمات مختلفة أو تصفح الأقسام الأخرى.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part, idx) => (
                <LuxuryPartCard
                  key={part._id}
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
                    images: part.images || [part.img],
                    stock: part.stock || part.stockQty,
                    condition: part.condition,
                    warranty: part.warranty,
                    compatibility: part.compatibility,
                    isOriginal: part.condition === 'new',
                    isFeatured: part.isFeatured,
                    rating: part.rating,
                    reviews: part.reviewsCount,
                  }}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
