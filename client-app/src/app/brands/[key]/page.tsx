'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api-original';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Car, Package } from 'lucide-react';
import { getBrandDisplayName, getClearbitLogoUrl, isLocalPath } from '@/lib/brandTranslations';

export default function BrandDetail() {
  const params = useParams();
  const rawKey = typeof params?.key === 'string' ? params.key : (Array.isArray(params?.key) ? params.key[0] : '');
  const { isRTL } = useLanguage();
  const { formatPrice } = useSettings();
  const [brand, setBrand] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [logoSrc, setLogoSrc] = useState<string>('');

  const displayName = brand ? getBrandDisplayName(brand.nameAr || brand.name, isRTL) : rawKey;

  useEffect(() => {
    if (brand) {
      const l = brand.logoUrl || brand.logo;
      if (!l || isLocalPath(l)) {
        setLogoSrc(getClearbitLogoUrl(brand.name || brand.key) || '');
      } else {
        setLogoSrc(l);
      }
    }
  }, [brand]);

  const resolveCarImage = (car: Record<string, unknown>) => {
    const src = (car?.images as string[] | undefined)?.[0] || car?.imageUrl || car?.image || '';
    return typeof src === 'string' && src.trim() ? src.trim() : '';
  };

  const resolvePartImage = (part: Record<string, unknown>) => {
    const src = part?.img || part?.image || (part?.images as string[] | undefined)?.[0] || '';
    return typeof src === 'string' && src.trim() ? src.trim() : '';
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // [[FIX]] جلب متوازي + تمرير make للـ API بدل فلترة محلية
        const [brandsRes, carsRes, partsRes] = await Promise.all([
          api.brands.list('cars', {}),
          api.cars.list({ make: rawKey, limit: 60, status: 'all' }),
          api.parts.list({ brand: rawKey, limit: 30 })
        ]);
        const all = brandsRes?.brands || brandsRes?.data || [];
        const b = all.find((x: Record<string, unknown>) =>
          String(x.key || '').toLowerCase() === rawKey.toLowerCase()
        ) || all.find((x: Record<string, unknown>) =>
          String(x.name || '').toLowerCase() === rawKey.toLowerCase()
        );
        setBrand(b || null);
        // [[FIX]] استخراج صحيح من API response
        const rawCars = Array.isArray(carsRes?.data)
          ? carsRes.data
          : (carsRes?.data?.cars || carsRes?.cars || []);
        const rawParts = Array.isArray(partsRes?.data)
          ? partsRes.data
          : (partsRes?.data?.parts || partsRes?.parts || []);
        // فلترة محلية احتياطية إذا لم يدعم API المعامل
        const brandName = b?.name || rawKey;
        const filteredCars = rawCars.length > 0 ? rawCars :
          rawCars.filter((c: Record<string, unknown>) =>
            String(c.make || c.title || '').toLowerCase().includes(brandName.toLowerCase())
          );
        setCars(filteredCars);
        setParts(rawParts);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    })();
  }, [rawKey]);


  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <Navbar />
      <main className="relative z-10 pt-24 pb-24 px-6 max-w-[1600px] mx-auto">
        <header className="mb-12 flex items-center gap-4">
          {logoSrc && (
            <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-white flex items-center justify-center p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt={displayName} className="w-full h-full object-contain" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            {displayName}
          </h1>
        </header>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center text-white/40">
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : (
          <>
            <section className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black uppercase">{isRTL ? 'السيارات' : 'Cars'}</h2>
                <Link href="/showroom" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white flex items-center gap-1">
                  {isRTL ? 'المعرض' : 'Showroom'} <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              {cars.length === 0 ? (
                <div className="text-white/30">{isRTL ? 'لا توجد سيارات لهذه الماركة' : 'No cars for this brand'}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {cars.map((car, i) => (
                      <motion.div key={car.id || car._id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="group obsidian-card obsidian-card-hover h-full overflow-hidden">
                          <div className="relative h-56">
                            {(() => {
                              const imageKey = `car-${car.id || car._id || i}`;
                              const imageSrc = resolveCarImage(car);
                              const showFallback = !imageSrc || imageErrors[imageKey];
                              return showFallback ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                  <Car className="w-10 h-10 text-white/20" />
                                </div>
                              ) : (
                                <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageSrc}
                                  alt={car.title}
                                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                                  onError={() => setImageErrors(prev => ({ ...prev, [imageKey]: true }))}
                                />
                                </>
                              );
                            })()}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                          </div>
                          <div className="p-6">
                            <div className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">{car.make}</div>
                            <h3 className="text-lg font-black line-clamp-1">{car.title}</h3>
                            <div className="text-xl font-black text-[#c9a96e] italic mt-3">
                              {formatPrice(Number(car.price || car.priceSar || 0))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify_between mb-4">
                <h2 className="text-2xl font-black uppercase">{isRTL ? 'قطع الغيار' : 'Spare Parts'}</h2>
                <Link href="/parts" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white flex items-center gap-1">
                  {isRTL ? 'قطع الغيار' : 'Parts'} <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              {parts.length === 0 ? (
                <div className="text-white/30">{isRTL ? 'لا توجد قطع لهذه الماركة' : 'No parts for this brand'}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {parts.map((part, i) => (
                      <motion.div key={part.id || part._id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="group obsidian-card obsidian-card-hover p-6 h-full">
                          <div className="aspect-square bg-black/40 rounded-xl overflow-hidden mb-6 border border-white/5 relative group-hover:border-accent-gold/20 transition-colors">
                            {(() => {
                              const imageKey = `part-${part.id || part._id || i}`;
                              const imageSrc = resolvePartImage(part);
                              const showFallback = !imageSrc || imageErrors[imageKey];
                              return showFallback ? (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                  <Package className="w-10 h-10 text-white/20" />
                                </div>
                              ) : (
                                <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageSrc}
                                  alt={part.name}
                                  className="w-full h-full object-contain p-6 grayscale-[40%] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                  onError={() => setImageErrors(prev => ({ ...prev, [imageKey]: true }))}
                                />
                                </>
                              );
                            })()}
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{part.brand}</div>
                            <h3 className="text-base font-black line-clamp-2">{part.name}</h3>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
