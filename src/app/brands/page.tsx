'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import Breadcrumb from '@/components/Breadcrumb';
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
      <div className="pt-20 pb-8 bg-gradient-to-b from-zinc-950 to-black border-b border-white/5">
        <div className="container mx-auto px-4">
          {/* أزرار الرجوع */}
          <div className="mb-6">
            <BackButton showHome={true} />
          </div>

          <div className="mb-6">
            <Breadcrumb items={[{ label: 'الوكالات المعتمدة' }]} />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-black mb-3">
              <span className="text-white">الوكالات </span>
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">المعتمدة</span>
            </h1>
            <p className="text-gray-400">{filtered.length} وكالة معتمدة وموثوقة</p>
          </motion.div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن وكالة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="container mx-auto px-4 py-8">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((brand, index) => (
              <motion.div
                key={brand._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/showroom?make=${encodeURIComponent(brand.name)}`}
                  className="group block bg-white/5 border border-white/10 hover:border-red-500/50 rounded-2xl p-6 text-center transition-all hover:bg-white/8 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20"
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