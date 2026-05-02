'use client';

/**
 * LuxuryPartCard - بطاقة قطعة غيار فاخرة
 * تصميم مذهل يعطي الثقة والفخامة
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, Share2, ShoppingCart, Package, Shield, Award,
  CheckCircle, Star, Zap, TrendingUp, Box, Wrench,
  BadgeCheck, Clock, Truck, ArrowRight, Info, Tag
} from 'lucide-react';

interface Part {
  _id: string;
  id?: string;
  name: string;
  partNumber?: string;
  category?: string;
  brand?: string;
  price: number;
  priceSar?: number;
  priceUsd?: number;
  images: string[];
  stock?: number;
  condition?: string;
  warranty?: string;
  compatibility?: string[];
  isOriginal?: boolean;
  isFeatured?: boolean;
  rating?: number;
  reviews?: number;
}

interface LuxuryPartCardProps {
  part: Part;
  index?: number;
  onAddToCart?: (id: string) => void;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
  inCart?: boolean;
}

export default function LuxuryPartCard({
  part,
  index = 0,
  onAddToCart,
  onFavorite,
  isFavorited = false,
  inCart = false
}: LuxuryPartCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const partId = part._id || part.id || '';
  const images = part.images?.length ? part.images : ['/placeholder-part.jpg'];
  const displayPrice = part.priceSar || part.price || 0;

  // حالة التوفر
  const stockStatus = part.stock && part.stock > 0
    ? part.stock > 10
      ? { text: 'متوفر', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' }
      : { text: `${part.stock} متبقي`, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' }
    : { text: 'غير متوفر', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };

  // الشارات
  const badges = [];
  if (part.isOriginal) badges.push({ text: 'أصلي', icon: BadgeCheck, color: 'from-blue-500 to-blue-600' });
  if (part.isFeatured) badges.push({ text: 'مميز', icon: Star, color: 'from-yellow-500 to-yellow-600' });
  if (part.warranty) badges.push({ text: 'ضمان', icon: Shield, color: 'from-green-500 to-green-600' });

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
        
        {/* تأثير التوهج */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.1) 0%, transparent 70%)'
          }}
        />

        {/* قسم الصورة */}
        <div className="relative aspect-square overflow-hidden bg-zinc-950">
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full"
          >
            <Image
              src={images[0]}
              alt={part.name}
              fill
              className="object-contain p-6"
              onLoad={() => setImageLoaded(true)}
              unoptimized
            />
            
            {/* تدرج */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </motion.div>

          {/* الشارات */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {badges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${badge.color} backdrop-blur-md shadow-lg`}
                >
                  <Icon className="w-3 h-3 text-white" />
                  <span className="text-xs font-bold text-white">{badge.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* أزرار الإجراءات */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                onFavorite?.(partId);
              }}
              className={`w-9 h-9 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ${
                isFavorited
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-black/40 border-white/20 text-white hover:bg-red-500/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* حالة التوفر */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${stockStatus.bg} backdrop-blur-md border ${stockStatus.border}`}
          >
            <Package className={`w-3.5 h-3.5 ${stockStatus.color}`} />
            <span className={`text-xs font-bold ${stockStatus.color}`}>{stockStatus.text}</span>
          </motion.div>

          {/* التقييم */}
          {part.rating && part.rating > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10"
            >
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-white">{part.rating.toFixed(1)}</span>
              {part.reviews && (
                <span className="text-xs text-gray-400">({part.reviews})</span>
              )}
            </motion.div>
          )}
        </div>

        {/* قسم المحتوى */}
        <div className="p-4">
          {/* الفئة والعلامة */}
          <div className="flex items-center gap-2 mb-2">
            {part.category && (
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400">
                {part.category}
              </span>
            )}
            {part.brand && (
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold">
                {part.brand}
              </span>
            )}
          </div>

          {/* الاسم */}
          <h3 className="text-base font-black text-white leading-tight mb-1 line-clamp-2 group-hover:text-red-100 transition-colors">
            {part.name}
          </h3>

          {/* رقم القطعة */}
          {part.partNumber && (
            <p className="text-xs text-gray-500 mb-3 font-mono">
              #{part.partNumber}
            </p>
          )}

          {/* المميزات السريعة */}
          <div className="flex flex-wrap gap-2 mb-4">
            {part.warranty && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Shield className="w-3 h-3" />
                <span>{part.warranty}</span>
              </div>
            )}
            {part.isOriginal && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <BadgeCheck className="w-3 h-3" />
                <span>أصلي</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <Truck className="w-3 h-3" />
              <span>توصيل سريع</span>
            </div>
          </div>

          {/* السعر والإجراء */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">السعر</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-gradient-red">
                  {displayPrice.toLocaleString('ar-SA')}
                </span>
                <span className="text-xs text-gray-400 font-bold">ر.س</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(partId);
              }}
              disabled={!part.stock || part.stock === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                inCart
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : part.stock && part.stock > 0
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white hover:shadow-red-500/50'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {inCart ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>في السلة</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف</span>
                </>
              )}
            </motion.button>
          </div>

          {/* التوافق */}
          {part.compatibility && part.compatibility.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: isHovered ? 1 : 0, height: isHovered ? 'auto' : 0 }}
              className="mt-3 pt-3 border-t border-white/5 overflow-hidden"
            >
              <p className="text-xs text-gray-500 mb-1.5">متوافق مع:</p>
              <div className="flex flex-wrap gap-1">
                {part.compatibility.slice(0, 3).map((car, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400"
                  >
                    {car}
                  </span>
                ))}
                {part.compatibility.length > 3 && (
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400">
                    +{part.compatibility.length - 3}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* خط متوهج */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* تأثير الظل */}
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-red-500/20 to-red-600/20 rounded-3xl blur-xl -z-10"
        animate={isHovered ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
