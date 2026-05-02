'use client';

/**
 * LuxuryCarCard - بطاقة سيارة فاخرة غير عادية
 * تصميم مذهل يهتم بأدق التفاصيل
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Share2, Eye, Calendar, Gauge, Fuel, Settings,
  MapPin, Shield, Award, Zap, Star, Crown, Sparkles,
  TrendingUp, CheckCircle, ArrowRight, Camera, Info
} from 'lucide-react';

interface Car {
  _id: string;
  id?: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceSar?: number;
  priceUsd?: number;
  images: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  views?: number;
  source?: string;
  featured?: boolean;
  isNew?: boolean;
}

interface LuxuryCarCardProps {
  car: Car;
  index?: number;
  onFavorite?: (id: string) => void;
  onShare?: (car: Car) => void;
  isFavorited?: boolean;
}

export default function LuxuryCarCard({ 
  car, 
  index = 0, 
  onFavorite, 
  onShare,
  isFavorited = false 
}: LuxuryCarCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const carId = car._id || car.id || '';
  const images = car.images?.length ? car.images : ['/placeholder-car.jpg'];
  const displayPrice = car.priceSar || car.price || 0;

  // شارات الحالة
  const badges = [];
  if (car.featured) badges.push({ text: 'مميزة', icon: Crown, color: 'from-yellow-500 to-yellow-600' });
  if (car.isNew) badges.push({ text: 'جديدة', icon: Sparkles, color: 'from-green-500 to-green-600' });
  if (car.source === 'korean_import') badges.push({ text: 'مستوردة', icon: Shield, color: 'from-blue-500 to-blue-600' });

  // معلومات المواصفات
  const specs = [
    { icon: Calendar, label: 'السنة', value: car.year?.toString() || '—', color: 'text-blue-400' },
    { icon: Gauge, label: 'الكيلومترات', value: car.mileage ? `${(car.mileage / 1000).toFixed(0)}K` : '—', color: 'text-purple-400' },
    { icon: Fuel, label: 'الوقود', value: car.fuelType || '—', color: 'text-green-400' },
    { icon: Settings, label: 'ناقل الحركة', value: car.transmission || '—', color: 'text-orange-400' },
  ];

  const handleImageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      {/* البطاقة الرئيسية */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-black rounded-3xl overflow-hidden border border-white/5 hover:border-red-500/30 transition-all duration-500 shadow-2xl hover:shadow-red-500/20">
        
        {/* تأثير التوهج الخلفي */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={isHovered ? {
            background: [
              'radial-gradient(circle at 0% 0%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 100% 100%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 0% 0%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)',
            ]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* قسم الصورة */}
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
          {/* الصورة الرئيسية */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full"
            >
              <Image
                src={images[currentImageIndex]}
                alt={car.title}
                fill
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
                unoptimized
              />
              
              {/* تدرج علوي */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              {/* تدرج سفلي */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            </motion.div>
          </AnimatePresence>

          {/* أزرار تغيير الصورة */}
          {images.length > 1 && isHovered && (
            <>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleImageChange('prev');
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-all z-10"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleImageChange('next');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-all z-10"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </>
          )}

          {/* مؤشر الصور */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <motion.button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex 
                      ? 'w-8 bg-red-500' 
                      : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          )}

          {/* الشارات العلوية */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {badges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${badge.color} backdrop-blur-md shadow-lg`}
                >
                  <Icon className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white">{badge.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* أزرار الإجراءات العلوية */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onFavorite?.(carId);
              }}
              className={`w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${
                isFavorited
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-black/40 border-white/20 text-white hover:bg-red-500/20 hover:border-red-400/50'
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${isFavorited ? 'fill-white' : ''}`} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onShare?.(car);
              }}
              className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <Share2 className="w-4.5 h-4.5" />
            </motion.button>
          </div>

          {/* عدد المشاهدات */}
          {car.views && car.views > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10"
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-gray-300">{car.views}</span>
            </motion.div>
          )}
        </div>

        {/* قسم المحتوى */}
        <div className="p-5">
          {/* العنوان والماركة */}
          <div className="mb-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-xl font-black text-white leading-tight group-hover:text-red-100 transition-colors line-clamp-1">
                {car.title}
              </h3>
              
              {car.condition && (
                <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                  {car.condition === 'excellent' ? 'ممتازة' : car.condition}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-semibold">{car.make}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{car.model}</span>
            </div>
          </div>

          {/* المواصفات */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {specs.map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/spec"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center ${spec.color} group-hover/spec:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{spec.label}</p>
                    <p className="text-xs font-bold text-white truncate">{spec.value}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* السعر والإجراء */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs text-gray-500 mb-1">السعر</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gradient-red">
                  {displayPrice.toLocaleString('ar-SA')}
                </span>
                <span className="text-sm text-gray-400 font-bold">ر.س</span>
              </div>
              {car.priceUsd && (
                <p className="text-xs text-gray-500 mt-0.5">
                  ≈ ${car.priceUsd.toLocaleString()}
                </p>
              )}
            </div>

            <Link href={`/showroom/${carId}`}>
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg hover:shadow-red-500/50 transition-all"
              >
                <span>التفاصيل</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>

        {/* خط متوهج سفلي */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* تأثير الظل المتحرك */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-red-500/20 to-red-600/20 rounded-3xl blur-xl -z-10"
        animate={isHovered ? {
          opacity: [0, 0.5, 0],
          scale: [0.95, 1.05, 0.95],
        } : { opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
