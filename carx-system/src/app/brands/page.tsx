'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const res = await api.brands.getAll();
        if (res.data) {
          setBrands((res.data as any).data?.brands || (res.data as any).brands || []);
        }
      } catch (error) {
        console.error('Failed to fetch brands', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-luxury-gold font-black uppercase tracking-[0.4em] text-sm">شركاء النجاح</h2>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mt-2">وكالات <span className="text-white/20">عالمية</span></h1>
            <p className="text-white/40 max-w-2xl mx-auto text-lg pt-6">
              نفخر بشراكتنا مع أرقى وأفخم العلامات التجارية في عالم السيارات لنقدم لعملائنا الأفضل دائماً.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : brands.length === 0 ? (
             <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10">
              <h3 className="text-2xl font-bold mb-2">قريباً</h3>
              <p className="text-white/40">نعمل على تحديث قائمة الوكالات حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {brands.map((brand, idx) => (
                <Link 
                  href={`/showroom?make=${encodeURIComponent(brand.name)}`}
                  key={brand._id}
                  className="block"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="premium-card aspect-square rounded-[2rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="glow-overlay" />
                    <div className="relative z-10 space-y-6 w-full flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center p-4 group-hover:scale-110 transition-transform duration-500">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-3xl font-black">{brand.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{brand.name}</h3>
                        <p className="text-white/40 text-sm uppercase tracking-widest">{brand.country || 'International'}</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
