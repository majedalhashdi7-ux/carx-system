'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';

interface Brand {
  _id: string;
  name: string;
  nameEn?: string;
  key: string;
  logoUrl?: string;
  description?: string;
  description_ar?: string;
  carCount?: number;
  location?: string;
  phone?: string;
  whatsapp?: string;
}

export default function BrandsPage() {
  const { isRTL } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success) {
        setBrands(data.data);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const filtered = brands.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.nameEn || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-black text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* Header */}
      <div className="relative pt-24 pb-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(120,40,0,0.2) 0%, transparent 70%), #000' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium mb-5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              {filtered.length} وكالة معتمدة
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none">
              <span className="text-white">الوكالات </span>
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>المعتمدة</span>
            </h1>
            <p className="text-white/40 text-lg">وكالات موثوقة لأفضل ماركات السيارات</p>
          </motion.div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="ابحث عن وكالة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pr-10 pl-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={fetchBrands} className="bg-red-600 text-white px-6 py-2 rounded-lg">إعادة المحاولة</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">لا توجد وكالات</h3>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((brand, index) => (
              <motion.div
                key={brand._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  href={`/showroom?make=${encodeURIComponent(brand.name)}`}
                  className="group block bg-white/[0.03] border border-white/10 hover:border-amber-500/40 rounded-2xl p-6 text-center transition-all hover:bg-white/[0.06] hover:shadow-xl hover:shadow-amber-900/20"
                >
                  {/* Logo */}
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                    {brand.logoUrl ? (
                      <Image
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={80}
                        height={80}
                        className="object-contain w-full h-full p-2"
                        unoptimized
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-red-400" />
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-black text-lg mb-1 group-hover:text-red-400 transition-colors">
                    {isRTL ? brand.name : (brand.nameEn || brand.name)}
                  </h3>

                  {/* Description */}
                  {(brand.description_ar || brand.description) && (
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                      {isRTL ? brand.description_ar : brand.description}
                    </p>
                  )}

                  {/* Car count */}
                  <div className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full">
                    <span>{brand.carCount || 0}</span>
                    <span>سيارة</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}