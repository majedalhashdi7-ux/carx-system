'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Package, MessageCircle, Heart, Share2,
  CheckCircle, Shield, Tag, Wrench
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UltraModernPartCard from '@/components/UltraModernPartCard';

interface Part {
  _id: string;
  name: string;
  nameAr?: string;
  partType?: string;
  carMake?: string;
  carModel?: string;
  price: number;
  priceSar?: number;
  priceUsd?: number;
  condition?: string;
  description?: string;
  images?: string[];
  img?: string;
  stockQty?: number;
  inStock?: boolean;
}

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '+967781007805';

const conditionLabels: Record<string, string> = {
  NEW: '✨ جديد',
  USED: '🔵 مستعمل',
  REFURBISHED: '🔧 مجدد',
};

export default function PartDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [related, setRelated] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPart(id);
    const wishlist = JSON.parse(localStorage.getItem('carx-parts-wishlist') || '[]');
    setIsWishlisted(wishlist.includes(id));
  }, [id]);

  const fetchPart = async (partId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/parts/${partId}`);
      const data = await res.json();
      if (data.success) {
        setPart(data.data);
        setRelated(data.related || []);
      } else {
        setError(data.error || 'لم يتم العثور على القطعة');
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!part) return;
    const msg = `مرحباً، أريد الاستفسار عن:\n*${part.nameAr || part.name}*\nالسعر: ${(part.priceSar || part.price || 0).toLocaleString()} ر.س`;
    window.open(`https://wa.me/${WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('carx-parts-wishlist') || '[]');
    if (isWishlisted) {
      localStorage.setItem('carx-parts-wishlist', JSON.stringify(wishlist.filter((wid: string) => wid !== id)));
    } else {
      wishlist.push(id);
      localStorage.setItem('carx-parts-wishlist', JSON.stringify(wishlist));
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: part?.nameAr || part?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <Package className="w-16 h-16 text-gray-600" />
          <p className="text-red-400 text-xl">{error || 'القطعة غير موجودة'}</p>
          <Link href="/parts" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors">
            العودة لقطع الغيار
          </Link>
        </div>
      </div>
    );
  }

  const images = part.images?.length ? part.images : part.img ? [part.img] : [];
  const displayPrice = part.priceSar || part.price || 0;

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/parts"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm group">
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>قطع الغيار</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/70 text-sm truncate max-w-xs">{part.nameAr || part.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2">
            {images.length > 0 ? (
              <>
                <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden mb-3">
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
                        alt={part.nameAr || part.name}
                        fill
                        className="object-contain p-4"
                        unoptimized
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-sm text-white">
                    {currentImage + 1} / {images.length}
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === currentImage ? 'border-blue-500' : 'border-transparent'}`}>
                        <Image src={img} alt={`صورة ${i + 1}`} fill className="object-contain p-1" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center mb-3">
                <Package className="w-24 h-24 text-gray-600" />
              </div>
            )}

            {/* Details */}
            {part.description && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-400" />
                  وصف القطعة
                </h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">{part.description}</p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-zinc-950 border border-white/10 rounded-2xl p-6">
              {/* Title */}
              <h1 className="text-2xl font-black mb-2">{part.nameAr || part.name}</h1>
              {part.nameAr && part.name !== part.nameAr && (
                <p className="text-gray-500 text-sm mb-3">{part.name}</p>
              )}

              {/* Condition */}
              {part.condition && (
                <span className="inline-block text-sm bg-white/10 px-3 py-1 rounded-full mb-4">
                  {conditionLabels[part.condition] || part.condition}
                </span>
              )}

              {/* Price */}
              <div className="mb-6">
                <p className="text-4xl font-black text-blue-400">
                  {displayPrice.toLocaleString('ar-SA')}
                  <span className="text-lg text-gray-400 mr-2">ر.س</span>
                </p>
                {part.priceUsd && (
                  <p className="text-sm text-gray-500 mt-1">≈ ${part.priceUsd.toLocaleString()} USD</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6 border-t border-white/10 pt-4">
                {part.partType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1"><Tag className="w-3 h-3" />الفئة</span>
                    <span className="font-bold">{part.partType}</span>
                  </div>
                )}
                {part.carMake && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الماركة</span>
                    <span className="font-bold">{part.carMake}</span>
                  </div>
                )}
                {part.carModel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الموديل</span>
                    <span className="font-bold">{part.carModel}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">التوفر</span>
                  <span className={`font-bold ${(part.stockQty ?? 0) > 0 || part.inStock ? 'text-green-400' : 'text-red-400'}`}>
                    {(part.stockQty ?? 0) > 0 || part.inStock ? 'متوفر' : 'غير متوفر'}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex gap-2 mb-5">
                <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 rounded-full px-3 py-1">
                  <CheckCircle className="w-3 h-3" />
                  أصلي
                </div>
                <div className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3" />
                  مضمون
                </div>
              </div>

              {/* CTA */}
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
                    isWishlisted ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                  {isWishlisted ? 'محفوظة' : 'حفظ'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-gray-400 hover:border-white/30 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  مشاركة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Parts */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-black mb-6">قطع مشابهة</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((relPart, index) => (
                <Link key={relPart._id} href={`/parts/${relPart._id}`}>
                  <UltraModernPartCard
                    part={{
                      _id: relPart._id,
                      name: relPart.nameAr || relPart.name,
                      nameAr: relPart.nameAr,
                      brand: relPart.carMake || '',
                      price: relPart.price,
                      img: relPart.images?.[0] || relPart.img || '',
                      condition: (relPart.condition as 'NEW' | 'USED' | 'REFURBISHED') || 'NEW',
                      category: relPart.partType || '',
                      stockQty: relPart.stockQty || 0,
                    }}
                    index={index}
                    onClick={() => {}}
                    onLoginRequired={() => {}}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
