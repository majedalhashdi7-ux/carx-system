'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Wrench } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
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
          // Adjust based on your API response structure
          setParts((res.data as any).data?.parts || (res.data as any).parts || []);
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

      <section className="relative pt-40 pb-20 overflow-hidden">
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
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mt-2">الأداء <span className="text-white/20">المثالي</span></h1>
              </div>
              <p className="text-white/40 max-w-md text-lg">
                اكتشف مجموعتنا من قطع الغيار الأصلية المعتمدة لضمان أداء سيارتك بأعلى كفاءة ممكنة.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="relative flex-1">
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text"
                placeholder="ابحث برقم القطعة أو اسمها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-6 text-lg focus:outline-none focus:border-luxury-gold/50 transition-all text-white placeholder:text-white/20"
                dir="rtl"
              />
            </div>
            <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold">
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
              {filteredParts.map(part => (
                <div key={part._id} className="premium-card p-6 rounded-[2rem] group">
                  <div className="glow-overlay" />
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 mb-6 relative">
                      <img 
                        src={part.images?.[0] || 'https://via.placeholder.com/400?text=Part'} 
                        alt={part.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-luxury-gold">
                        {part.condition === 'new' ? 'جديد' : 'مستعمل'}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2">{part.brand || 'عام'}</div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{part.name}</h3>
                      <p className="text-white/40 text-sm mb-4 font-mono">PN: {part.partNumber || 'N/A'}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="font-mono text-xl font-black">{part.price?.toLocaleString() || 0} <span className="text-sm text-luxury-gold">ر.س</span></div>
                        <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-luxury-gold hover:text-black transition-colors">
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
