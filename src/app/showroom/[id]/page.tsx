'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Calendar, Gauge, Fuel, Settings, MapPin,
  Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight,
  CheckCircle, Shield, Eye, Maximize2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UltraModernCarCard from '@/components/UltraModernCarCard';
import TheatricalCarDisplay from '@/components/TheatricalCarDisplay';
import BackButton from '@/components/BackButton';
import Breadcrumb from '@/components/Breadcrumb';

interface Car {
  _id: string;
  title: string;
  make: string;
  makeLogoUrl?: string;
  model: string;
  year: number;
  price: number;
  priceSar?: number;
  priceUsd?: number;
  priceKrw?: number;
  images: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  description?: string;
  source?: string;
  views?: number;
  createdAt?: string;
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '+967781007805';

const conditionMap: Record<string, string> = {
  excellent: '⭐ ممتازة',
  good: '✅ جيدة',
  fair: '🔵 مقبولة',
  'needs work': '🔧 تحتاج عمل',
};

export default function CarDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [car, setCar] = useState<Car | null>(null);
  const [related, setRelated] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showTheatrical, setShowTheatrical] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCar(id);
    // Check wishlist
    const wishlist = JSON.parse(localStorage.getItem('carx-wishlist') || '[]');
    setIsWishlisted(wishlist.includes(id));
  }, [id]);

  const fetchCar = async (carId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cars/${carId}`);
      const data = await res.json();
      if (data.success) {
        setCar(data.data);
        setRelated(data.related || []);
      } else {
        setError(data.error || 'لم يتم العثور على السيارة');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!car) return;
    const msg = `مرحباً، أريد الاستفسار عن:\n*${car.title}*\nالسنة: ${car.year}\nالسعر: ${(car.priceSar || car.price || 0).toLocaleString()} ر.س`;
    window.open(`https://wa.me/${WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('carx-wishlist') || '[]');
    if (isWishlisted) {
      const updated = wishlist.filter((wid: string) => wid !== id);
      localStorage.setItem('carx-wishlist', JSON.stringify(updated));
    } else {
      wishlist.push(id);
      localStorage.setItem('carx-wishlist', JSON.stringify(wishlist));
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: car?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-red-400 text-xl">{error || 'السيارة غير موجودة'}</p>
          <Link href="/showroom" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors">
            العودة للمعرض
          </Link>
        </div>
      </div>
    );
  }

  const images = car.images?.length ? car.images : ['/placeholder-car.jpg'];
  const displayPrice = car.priceSar || car.price || 0;

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Navbar />

      <div className="container mx-auto px-4 pt-20 pb-12">
        {/* أزرار الرجوع */}
        <div className="mb-6">
          <BackButton href="/showroom" label="رجوع للمعرض" showHome={true} />
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: 'المعرض', href: '/showroom' },
              { label: car.title }
            ]} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden mb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[currentImage]}
                    alt={car.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage(i => (i + 1) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-sm text-white">
                {currentImage + 1} / {images.length}
              </div>

              {/* زر العرض المسرحي */}
              <motion.button
                onClick={() => setShowTheatrical(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-3 right-3 flex items-center gap-2 bg-red-600/90 hover:bg-red-700 backdrop-blur-md px-4 py-2 rounded-xl text-white font-bold transition-all shadow-lg"
              >
                <Maximize2 className="w-4 h-4" />
                <span>عرض مسرحي</span>
              </motion.button>

              {/* views */}
              {car.views && car.views > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 px-3 py-1 rounded-full text-xs text-gray-300">
                  <Eye className="w-3 h-3" />
                  {car.views} مشاهدة
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === currentImage ? 'border-red-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={img} alt={`صورة ${i + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}

            {/* Specs Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: 'السنة', value: car.year?.toString() || '—' },
                { icon: Gauge, label: 'الكيلومترات', value: car.mileage ? `${car.mileage.toLocaleString()} كم` : '—' },
                { icon: Fuel, label: 'الوقود', value: car.fuelType || '—' },
                { icon: Settings, label: 'ناقل الحركة', value: car.transmission || '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <Icon className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-bold text-white text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {car.description && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-3">وصف السيارة</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{car.description}</p>
              </div>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
                {/* Title */}
                <h1 className="text-2xl font-black mb-2">{car.title}</h1>

                {/* Condition badge */}
                {car.condition && (
                  <span className="inline-block text-sm bg-white/10 px-3 py-1 rounded-full mb-4">
                    {conditionMap[car.condition] || car.condition}
                  </span>
                )}

                {/* Price */}
                <div className="mb-6">
                  <p className="text-4xl font-black text-red-500">
                    {displayPrice.toLocaleString('ar-SA')}
                    <span className="text-lg text-gray-400 mr-2">ر.س</span>
                  </p>
                  {car.priceUsd && (
                    <p className="text-sm text-gray-500 mt-1">
                      ≈ ${car.priceUsd.toLocaleString()} USD
                    </p>
                  )}
                  {car.priceKrw && (
                    <p className="text-sm text-gray-500">
                      ≈ ₩{car.priceKrw.toLocaleString()} KRW
                    </p>
                  )}
                </div>

                {/* Quick details */}
                <div className="space-y-3 mb-6 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الماركة</span>
                    <span className="font-bold">{car.make}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الموديل</span>
                    <span className="font-bold">{car.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">اللون</span>
                    <span className="font-bold">{car.color || '—'}</span>
                  </div>
                  {car.source === 'korean_import' && (
                    <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-400/10 rounded-lg px-3 py-2">
                      <Shield className="w-4 h-4" />
                      مستورد من كوريا
                    </div>
                  )}
                </div>

                {/* Trust badges */}
                <div className="flex gap-2 mb-5">
                  <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 rounded-full px-3 py-1">
                    <CheckCircle className="w-3 h-3" />
                    معتمد
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 rounded-full px-3 py-1">
                    <Shield className="w-3 h-3" />
                    ضمان الجودة
                  </div>
                </div>

                {/* CTA Buttons */}
                <button
                  onClick={handleContact}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 mb-3"
                >
                  <MessageCircle className="w-5 h-5" />
                  تواصل عبر واتساب
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleWishlist}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                      isWishlisted
                        ? 'border-red-500 text-red-500 bg-red-500/10'
                        : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                    {isWishlisted ? 'محفوظة' : 'حفظ'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    مشاركة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Cars */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-black mb-6">سيارات مشابهة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((relCar, index) => (
                <Link key={relCar._id} href={`/showroom/${relCar._id}`}>
                  <UltraModernCarCard
                    car={{ ...relCar, id: relCar._id }}
                    index={index}
                    formatPrice={(price) => `${price.toLocaleString('ar-SA')} ر.س`}
                    onContact={() => {}}
                    onViewDetails={() => {}}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theatrical Display */}
      <AnimatePresence>
        {showTheatrical && (
          <TheatricalCarDisplay
            images={images}
            title={car.title}
            onClose={() => setShowTheatrical(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
