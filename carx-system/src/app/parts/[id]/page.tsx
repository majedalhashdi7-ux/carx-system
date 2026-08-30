'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ShieldCheck, Package, Wrench, Tag,
  AlertCircle, ShoppingCart, Check, Star, Truck, Award
} from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useCart } from '../../../lib/CartContext';
import { useCurrency } from '../../../lib/CurrencyContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ReviewSystem from '../../../components/ReviewSystem';

export default function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [part, setPart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCart();
  const { format } = useCurrency();

  useEffect(() => {
    const fetchPart = async () => {
      setLoading(true);
      const res = await api.parts.getById(id) as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const fetchedPart = result?.data || result;
        setPart(fetchedPart);
        if (fetchedPart) {
          const mainImg = fetchedPart.images?.[0] || fetchedPart.img || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80';
          setActiveImage(mainImg);
        }
      }
      setLoading(false);
    };
    fetchPart();
  }, [id]);

  const handleAddToCart = () => {
    if (!part) return;
    addItem({
      id: part._id || part.id,
      type: 'part',
      name: part.name,
      price: part.price || part.priceSar || 0,
      image: part.images?.[0] || part.img || '',
      partNumber: part.partNumber,
      stock: part.stock || part.stockQty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
    </div>
  );

  if (error || !part) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500/50 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">تعذر العثور على القطعة</h1>
      <p className="text-gray-400 mb-8">{error || 'ربما تم حذف هذه القطعة أو أنها غير متوفرة حالياً'}</p>
      <Link href="/parts" className="px-8 py-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
        العودة لقطع الغيار
      </Link>
    </div>
  );

  const imagesList = part.images?.length ? part.images : [part.img || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80'];
  const price = part.price || part.priceSar || 0;

  // Sample reviews (will be replaced with real data from API when available)
  const sampleReviews: any[] = [];
  const avgRating = part.rating || 0;
  const totalReviews = part.reviewsCount || 0;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-24 pb-20">
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-white/30 uppercase tracking-widest" dir="rtl">
            <Link href="/" className="hover:text-luxury-gold">الرئيسية</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/parts" className="hover:text-luxury-gold">قطع الغيار</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">{part.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left: Media & Details */}
          <div className="lg:col-span-8 space-y-12">

            {/* Gallery */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10 group"
              >
                <img
                  src={activeImage}
                  alt={part.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute top-6 left-6 flex gap-3 z-10">
                  {part.condition === 'new' && (
                    <span className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-black uppercase tracking-wider">
                      قطعة أصلية
                    </span>
                  )}
                  {part.isFeatured && (
                    <span className="px-4 py-2 rounded-xl bg-luxury-gold/20 border border-luxury-gold/30 text-luxury-gold text-xs font-black uppercase tracking-wider">
                      مميزة
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Thumbnails */}
              {imagesList.length > 1 && (
                <div className="flex gap-4 overflow-x-auto py-2 pr-1" dir="rtl">
                  {imagesList.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === img ? 'border-luxury-gold scale-95 shadow-lg' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt={`${part.name} thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'رقم القطعة', value: part.partNumber || '—', icon: Tag },
                { label: 'الفئة', value: part.category || '—', icon: Package },
                { label: 'الماركة', value: part.brand || '—', icon: Award },
                { label: 'الحالة', value: part.condition === 'new' ? 'جديدة' : 'مستعملة', icon: ShieldCheck },
              ].map((spec, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center space-y-2">
                  <spec.icon className="w-6 h-6 text-luxury-gold/70" />
                  <div className="text-[10px] uppercase font-bold text-white/20 tracking-widest">{spec.label}</div>
                  <div className="text-sm font-bold">{spec.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3" dir="rtl">
                <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                تفاصيل القطعة
              </h2>
              <div className="text-white/60 leading-relaxed text-lg" dir="rtl">
                {part.description || 'لا يوجد وصف متاح لهذه القطعة حالياً.'}
              </div>
            </div>

            {/* Compatibility */}
            {part.compatibility && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-3" dir="rtl">
                  <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                  التوافق
                </h2>
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                  <p className="text-white/60 leading-relaxed" dir="rtl">{part.compatibility}</p>
                </div>
              </div>
            )}

            {/* Warranty */}
            {part.warranty && (
              <div className="p-6 rounded-2xl border border-white/5 flex items-center gap-4 text-white/40" dir="rtl">
                <ShieldCheck className="w-8 h-8 text-luxury-gold/40 shrink-0" />
                <p className="text-sm leading-relaxed">
                  <span className="text-white font-bold">ضمان: </span>
                  {part.warranty}
                </p>
              </div>
            )}

            {/* Reviews Section */}
            <div className="space-y-6 pt-8">
              <h2 className="text-2xl font-bold flex items-center gap-3" dir="rtl">
                <div className="w-1.5 h-6 bg-luxury-gold rounded-full" />
                التقييمات والمراجعات
              </h2>
              <ReviewSystem
                itemId={part._id || part.id}
                itemType="part"
                reviews={sampleReviews}
                averageRating={avgRating}
                totalReviews={totalReviews}
                onSubmitReview={(review) => {
                  console.log('Review submitted:', review);
                }}
              />
            </div>
          </div>

          {/* Right: Sidebar Actions */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-8 animate-glow"
              >
                <div dir="rtl">
                  <div className="text-luxury-gold font-bold text-xs uppercase tracking-[0.3em] mb-3">السعر</div>
                  <div className="flex items-baseline gap-2">
                    {price > 0 && !part.priceOnRequest ? (
                      <span className="text-5xl font-black">{format(price)}</span>
                    ) : (
                      <span className="text-3xl font-black text-green-400">اطلب عبر واتساب</span>
                    )}
                  </div>
                  {part.stock > 0 ? (
                    <div className="flex items-center gap-2 mt-3 text-green-400 text-sm font-bold">
                      <Check className="w-4 h-4" />
                      متوفر ({part.stock} قطعة)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-3 text-red-400 text-sm font-bold">
                      <AlertCircle className="w-4 h-4" />
                      غير متوفر حالياً
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {price > 0 && !part.priceOnRequest ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={part.stock <= 0}
                      className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-luxury-gold transition-all shadow-2xl shadow-white/5 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {addedToCart ? (
                        <>
                          <Check className="w-5 h-5" />
                          تمت الإضافة!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          أضف للسلة
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/966500000000?text=${encodeURIComponent(`السلام عليكم، أود الاستفسار وطلب قطعة الغيار: ${part.name} ${part.partNumber ? `(رقم: ${part.partNumber})` : ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-emerald-900/30 flex items-center justify-center gap-3"
                    >
                      طلب عبر واتساب
                    </a>
                  )}
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4" dir="rtl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/30">رقم القطعة</span>
                    <span className="font-mono text-white/60">{part.partNumber || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/30">الماركة</span>
                    <span className="font-bold uppercase tracking-wider">{part.brand || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/30">الفئة</span>
                    <span className="font-bold">{part.category || '—'}</span>
                  </div>
                </div>
              </motion.div>

              {/* Shipping info */}
              <div className="p-6 rounded-2xl border border-white/5 flex items-center gap-4 text-white/40" dir="rtl">
                <Truck className="w-8 h-8 text-luxury-gold/40 shrink-0" />
                <p className="text-xs leading-relaxed">
                  شحن مجاني للطلبات فوق 1,000 ر.س. التوصيل خلال 2-5 أيام عمل.
                </p>
              </div>

              {/* Trust badge */}
              <div className="p-6 rounded-2xl border border-white/5 flex items-center gap-4 text-white/40" dir="rtl">
                <ShieldCheck className="w-8 h-8 text-luxury-gold/40 shrink-0" />
                <p className="text-xs leading-relaxed">
                  جميع قطع الغيار أصلية ومفحوصة من قبل فريق CAR X المتخصص.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
