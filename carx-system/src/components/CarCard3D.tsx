'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Gauge, Settings, Fuel, ChevronRight } from 'lucide-react';
import React, { useRef } from 'react';
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
}

export default function CarCard3D({ car, index = 0 }: { car: Car; index?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const carId = car._id || car.id;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const displayImage = car.mainImage || (car.images && car.images[0]) || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80';

  return (
    <Link href={`/cars/${carId}`}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        style={{
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        className="relative h-[480px] w-full rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 p-2 transition-all duration-300 hover:border-luxury-gold/40 cursor-pointer group"
      >
        <div
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
          className="absolute inset-2 rounded-[2.2rem] bg-[#0A0A0A] p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Header */}
          <div className="flex justify-between items-start relative z-10" style={{ transform: "translateZ(70px)" }}>
            <div>
              <p className="text-luxury-gold text-[10px] font-black uppercase tracking-[0.3em] mb-1">{car.brand || car.make}</p>
              <h3 className="text-white text-lg font-bold leading-tight line-clamp-1">{car.title}</h3>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/60">
              {car.year || 2024}
            </div>
          </div>

          {/* Image */}
          <div className="relative h-44 w-full my-6 flex items-center justify-center" style={{ transform: "translateZ(100px)" }}>
            <img
              src={displayImage}
              alt={car.title}
              className="w-full h-full object-cover rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-2 mb-6 relative z-10" style={{ transform: "translateZ(60px)" }}>
            {[
              { icon: Gauge, value: car.mileage ? `${car.mileage}k` : '0k' },
              { icon: Settings, value: car.transmission === 'Manual' ? 'مانيوال' : 'أوتوماتيك' },
              { icon: Fuel, value: car.fuelType === 'Electric' ? 'كهرباء' : 'بنزين' }
            ].map((spec, i) => (
              <div key={i} className="flex flex-col items-center bg-white/[0.03] border border-white/[0.05] p-2.5 rounded-2xl">
                <spec.icon className="w-3.5 h-3.5 text-luxury-gold/50 mb-1.5" />
                <span className="text-[10px] font-bold text-white/40">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center relative z-10" style={{ transform: "translateZ(80px)" }}>
            <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-0.5">السعر</p>
              <p className="text-white text-xl font-black">
                {car.price?.toLocaleString()}
                <span className="text-[10px] text-white/40 mr-1">ريال</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center group-hover:bg-luxury-gold transition-colors duration-300">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
