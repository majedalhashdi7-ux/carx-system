'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Gauge, Settings, Fuel, ArrowLeft, Zap } from 'lucide-react';
import React, { useRef, useState } from 'react';
import Link from 'next/link';

interface Car {
  _id?: string;
  id?: string;
  title: string;
  price?: number;
  images?: string[];
  mainImage?: string;
  brand?: string;
  make?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  fuelType?: string;
  condition?: string;
  isFeatured?: boolean;
}

export default function CarCard3D({ car, index = 0 }: { car: Car; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const carId = car._id || car.id;
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const displayImage = car.mainImage || (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80';

  const isElectric = car.fuelType?.toLowerCase().includes('electric') || car.fuelType === 'كهرباء';
  const isManual = car.transmission?.toLowerCase() === 'manual' || car.transmission === 'مانيوال';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className="relative h-[500px] w-full cursor-pointer group"
    >
      <Link href={`/cars/${carId}`} className="absolute inset-0">
        {/* Card Shell */}
        <div
          style={{ transformStyle: 'preserve-3d' }}
          className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/10 group-hover:border-luxury-gold/40 transition-all duration-700 overflow-hidden"
        >
          {/* Animated Gold Glow on Hover */}
          <motion.div
            className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Featured Badge */}
          {car.isFeatured && (
            <div
              style={{ transform: 'translateZ(80px)' }}
              className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-luxury-gold text-black text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-luxury-gold/20"
            >
              <Zap className="w-3 h-3" />
              مميز
            </div>
          )}

          {/* Condition Badge */}
          <div
            style={{ transform: 'translateZ(80px)' }}
            className={`absolute top-5 left-5 z-20 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${
              car.condition === 'new'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
          >
            {car.condition === 'new' ? 'جديد' : 'مستعمل'}
          </div>

          {/* Inner Panel */}
          <div
            style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}
            className="absolute inset-[3px] rounded-[2.2rem] bg-[#0A0A0A] flex flex-col overflow-hidden"
          >
            {/* Shine sweep effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              animate={{ x: isHovered ? ['−100%', '200%'] : '-100%' }}
              transition={{ duration: 0.8, ease: 'linear' }}
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
                skewX: '-15deg',
              }}
            />

            {/* Car Image Section */}
            <div
              className="relative flex-1 overflow-hidden"
              style={{ transform: 'translateZ(60px)' }}
            >
              <motion.img
                src={displayImage}
                alt={car.title}
                className="w-full h-full object-cover"
                animate={{ scale: isHovered ? 1.08 : 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
            </div>

            {/* Card Content */}
            <div
              style={{ transform: 'translateZ(70px)' }}
              className="relative z-10 p-6 space-y-4 -mt-8"
            >
              {/* Brand & Title */}
              <div>
                <p className="text-luxury-gold text-[10px] font-black uppercase tracking-[0.3em] mb-0.5">
                  {car.brand || car.make || 'CAR X'}
                </p>
                <h3 className="text-white text-lg font-black leading-tight line-clamp-1">
                  {car.title}
                </h3>
              </div>

              {/* Specs Row */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Gauge, val: car.mileage ? `${car.mileage.toLocaleString()}كم` : '0كم' },
                  { icon: Settings, val: isManual ? 'مانيوال' : 'أوتو' },
                  { icon: isElectric ? Zap : Fuel, val: isElectric ? 'كهرباء' : 'بنزين' },
                  { icon: null, val: car.year?.toString() || '2024' },
                ].map((spec, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-[10px] font-bold text-white/35 shrink-0"
                  >
                    {spec.icon && <spec.icon className="w-3 h-3 text-luxury-gold/50" />}
                    {!spec.icon && <span className="w-1 h-1 rounded-full bg-luxury-gold/30" />}
                    <span>{spec.val}</span>
                  </div>
                ))}
              </div>

              {/* Price Row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">السعر</p>
                  <p className="text-white text-2xl font-black tracking-tight">
                    {car.price?.toLocaleString() || '—'}
                    <span className="text-xs text-white/40 font-bold mr-1">ريال</span>
                  </p>
                </div>

                <motion.div
                  className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg"
                  animate={{
                    backgroundColor: isHovered ? '#D4AF37' : '#FFFFFF',
                    rotate: isHovered ? -5 : 0,
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
