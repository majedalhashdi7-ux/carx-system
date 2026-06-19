'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';

// Luxury brand fallbacks with known colors
const LUXURY_BRANDS = [
  { name: 'مرسيدس بنز', en: 'Mercedes-Benz', color: '#C0C0C0' },
  { name: 'بي ام دبليو', en: 'BMW', color: '#1C69D4' },
  { name: 'رولز رويس', en: 'Rolls-Royce', color: '#9B8B5C' },
  { name: 'بنتلي', en: 'Bentley', color: '#3D5A3E' },
  { name: 'لامبورجيني', en: 'Lamborghini', color: '#C9A84C' },
  { name: 'فيراري', en: 'Ferrari', color: '#CC0000' },
  { name: 'بوغاتي', en: 'Bugatti', color: '#1A2B6D' },
  { name: 'بورش', en: 'Porsche', color: '#B5A642' },
];

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const res = await api.brands.getAll();
        if (res.data) {
          const fetched = (res.data as any).data?.brands || (res.data as any).brands || [];
          setBrands(fetched);
        }
      } catch {
        console.error('Failed to fetch brands');
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  const displayBrands = brands.length > 0 ? brands : LUXURY_BRANDS;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      {/* ===== Hero ===== */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-1/3 w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[150px]" />

        <div className="container mx-auto px-6 text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 bg-luxury-gold/10 border border-luxury-gold/20 px-5 py-2 rounded-full">
              <Sparkles className="w-4 h-4 text-luxury-gold" />
              <span className="text-luxury-gold text-xs font-black uppercase tracking-widest">شركاء النجاح</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              وكالات <span className="text-luxury-gold">عالمية</span>
              <br />
              <span className="text-white/20">بمعايير استثنائية</span>
            </h1>

            <p className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed">
              نفخر بشراكتنا مع أرقى وأفخم العلامات التجارية في عالم السيارات
              لنقدم لعملائنا الأفضل دائماً وأبداً.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== Brands Grid ===== */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div
                  key={i}
                  className="aspect-square bg-white/[0.03] border border-white/[0.06] rounded-[2rem] skeleton"
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {displayBrands.map((brand, idx) => {
                const brandName = brand.name || brand.en || '';
                const brandLogo = brand.logo;
                const carCount = brand.carCount || brand.carsCount || null;
                const href = brand._id
                  ? `/brands/${brand._id}`
                  : `/showroom?make=${encodeURIComponent(brandName)}`;

                return (
                  <Link href={href} key={brand._id || idx} className="block group">
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/[0.08] group-hover:border-luxury-gold/40 transition-all duration-700 cursor-pointer"
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />

                      {/* Gold hover glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)',
                        }}
                      />

                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-5">
                        {/* Logo or Initial */}
                        <motion.div
                          className="w-24 h-24 rounded-full bg-white/[0.04] border border-white/[0.08] group-hover:border-luxury-gold/30 flex items-center justify-center p-4 transition-all duration-500"
                          animate={{ scale: 1 }}
                          whileHover={{ scale: 1.12 }}
                        >
                          {brandLogo ? (
                            <img
                              src={brandLogo}
                              alt={brandName}
                              className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                          ) : (
                            <span className="text-3xl font-black text-white/40 group-hover:text-luxury-gold transition-colors duration-500">
                              {brandName.charAt(0)}
                            </span>
                          )}
                        </motion.div>

                        {/* Name */}
                        <div className="space-y-1">
                          <h3 className="text-base font-black group-hover:text-luxury-gold transition-colors duration-300">
                            {brandName}
                          </h3>
                          {brand.en && brand.en !== brandName && (
                            <p className="text-white/30 text-xs font-bold uppercase tracking-wider">
                              {brand.en}
                            </p>
                          )}
                          {brand.country && (
                            <p className="text-white/20 text-[10px] uppercase tracking-widest">
                              {brand.country}
                            </p>
                          )}
                        </div>

                        {/* Car count badge */}
                        {carCount !== null && (
                          <div className="flex items-center gap-1.5 bg-luxury-gold/10 border border-luxury-gold/20 px-3 py-1 rounded-full">
                            <span className="text-luxury-gold text-xs font-black">{carCount}</span>
                            <span className="text-white/40 text-[10px] font-bold">سيارة</span>
                          </div>
                        )}
                      </div>

                      {/* Arrow indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                        <div className="flex items-center gap-1 text-luxury-gold text-[10px] font-black uppercase tracking-widest">
                          <span>استعرض السيارات</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
