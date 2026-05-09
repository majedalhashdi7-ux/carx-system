'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Shield, Settings, Fuel } from 'lucide-react';
import React, { useRef } from 'react';

interface Car {
  id: string;
  title: string;
  price: string;
  image: string;
  brand: string;
  year: number;
  specs: {
    mileage: string;
    transmission: string;
    fuel: string;
  };
}

export default function CarCard3D({ car }: { car: Car }) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className="relative h-[450px] w-full rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-4 transition-all duration-300 hover:border-luxury-gold/50 cursor-pointer group"
    >
      <div
        style={{
          transform: "translateZ(50px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-4 rounded-xl bg-black/80 p-4 flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex justify-between items-start" style={{ transform: "translateZ(70px)" }}>
          <div>
            <p className="text-luxury-gold text-sm font-bold uppercase tracking-wider">{car.brand}</p>
            <h3 className="text-white text-xl font-bold">{car.title}</h3>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-sm text-white">
            {car.year}
          </div>
        </div>

        {/* Image */}
        <div className="relative h-40 w-full my-4" style={{ transform: "translateZ(100px)" }}>
          <img
            src={car.image}
            alt={car.title}
            className="w-full h-full object-cover rounded-lg shadow-2xl group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 mb-4" style={{ transform: "translateZ(60px)" }}>
          <div className="flex flex-col items-center bg-white/5 p-2 rounded-lg">
            <Shield className="w-4 h-4 text-luxury-gold mb-1" />
            <span className="text-xs text-gray-400">{car.specs.mileage}</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-2 rounded-lg">
            <Settings className="w-4 h-4 text-luxury-gold mb-1" />
            <span className="text-xs text-gray-400">{car.specs.transmission}</span>
          </div>
          <div className="flex flex-col items-center bg-white/5 p-2 rounded-lg">
            <Fuel className="w-4 h-4 text-luxury-gold mb-1" />
            <span className="text-xs text-gray-400">{car.specs.fuel}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center" style={{ transform: "translateZ(80px)" }}>
          <div>
            <p className="text-xs text-gray-400">السعر</p>
            <p className="text-luxury-gold text-lg font-bold">{car.price}</p>
          </div>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-luxury-gold transition-colors">
            التفاصيل
          </button>
        </div>
      </div>
    </motion.div>
  );
}
