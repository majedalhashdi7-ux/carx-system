'use client';

/**
 * TheatricalCarDisplay - عرض مسرحي مذهل للسيارة
 * تجربة عرض استثنائية مع تأثيرات بصرية متقدمة
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  ChevronLeft, ChevronRight, Maximize2, X, Play, Pause,
  ZoomIn, ZoomOut, RotateCw, Sparkles, Star
} from 'lucide-react';

interface TheatricalCarDisplayProps {
  images: string[];
  title: string;
  onClose?: () => void;
}

export default function TheatricalCarDisplay({ images, title, onClose }: TheatricalCarDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showSparkles, setShowSparkles] = useState(true);

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl"
    >
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-purple-900/20 animate-pulse" />
        
        {/* جسيمات متلألئة */}
        {showSparkles && [...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-2xl md:text-3xl font-black text-white flex items-center gap-3"
          >
            <Sparkles className="w-6 h-6 text-red-400" />
            {title}
          </motion.h2>
          
          {onClose && (
            <motion.button
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all"
            >
              <X className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Image Display */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ 
              opacity: 1, 
              scale: zoom, 
              rotateY: 0,
              rotate: rotation
            }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ 
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
            className="relative w-full h-full max-w-6xl max-h-[80vh]"
          >
            {/* إطار مضيء */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/20 via-transparent to-purple-500/20 blur-2xl" />
            
            {/* الصورة */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
              <Image
                src={images[currentIndex]}
                alt={`${title} - صورة ${currentIndex + 1}`}
                fill
                className="object-contain"
                priority
                unoptimized
              />
              
              {/* تأثير الإضاءة */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* شعاع ضوئي */}
            <motion.div
              className="absolute -inset-4 rounded-3xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255,0,0,0.3)',
                  '0 0 60px rgba(255,0,0,0.6)',
                  '0 0 20px rgba(255,0,0,0.3)',
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevImage}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>

          <motion.button
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextImage}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
        </>
      )}

      {/* Controls Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-3">
          {/* Play/Pause */}
          {images.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 px-3 border-x border-white/20">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <ZoomOut className="w-4 h-4" />
            </motion.button>
            
            <span className="text-white text-sm font-bold min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <ZoomIn className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Rotate */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRotate}
            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
          >
            <RotateCw className="w-5 h-5" />
          </motion.button>

          {/* Sparkles Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSparkles(!showSparkles)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              showSparkles 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Star className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex gap-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-2 max-w-[90vw] overflow-x-auto">
            {images.map((img, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === currentIndex 
                    ? 'border-red-500 shadow-lg shadow-red-500/50' 
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <Image
                  src={img}
                  alt={`صورة ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {idx === currentIndex && (
                  <div className="absolute inset-0 bg-red-500/20" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Image Counter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-24 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-full px-6 py-2">
          <span className="text-white font-bold">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
