'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function PullToRefresh({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const controls = useAnimation();
  const { isRTL } = useLanguage();

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 5) return; // Only allow pull when at the very top
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 5 || refreshing) return;
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;
    if (diff > 0) {
      // Pulling down
      const newPullY = Math.min(diff * 0.4, 100); // Friction
      setPullY(newPullY);
      controls.set({ y: newPullY });
      if (e.cancelable) e.preventDefault(); // Prevent native browser reload if possible
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    if (pullY > 60) {
      // Trigger refresh
      setRefreshing(true);
      controls.start({ y: 50, transition: { type: 'spring', damping: 20 } });
      await onRefresh();
      
      setRefreshing(false);
      setPullY(0);
      controls.start({ y: 0, transition: { type: 'spring', damping: 20 } });
    } else {
      // Snap back
      setPullY(0);
      controls.start({ y: 0, transition: { type: 'spring', damping: 20 } });
    }
  };

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      <motion.div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center -z-10"
        animate={controls}
      >
        <div className="flex items-center gap-2 mt-[-40px] px-4 py-2 bg-[#111] rounded-full border border-white/10 shadow-lg">
          <RefreshCw className={`w-4 h-4 text-accent-gold ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 3}deg)` }} />
          <span className="text-[10px] font-bold text-white/70 tracking-widest uppercase">
            {refreshing ? (isRTL ? 'جاري التحديث...' : 'REFRESHING...') : (isRTL ? 'اسحب للتحديث' : 'PULL TO REFRESH')}
          </span>
        </div>
      </motion.div>
      <motion.div animate={controls} className="bg-transparent w-full">
        {children}
      </motion.div>
    </div>
  );
}
