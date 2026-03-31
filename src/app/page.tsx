'use client';

/**
 * CAR X - الصفحة الرئيسية
 * نظام مستقل ومبسط بدون multi-tenant
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ModernCarXHome from '@/components/ModernCarXHome';
import CinematicSplash from '@/components/CinematicSplash';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // تحقق من localStorage إذا تم عرض الشاشة من قبل
    const hasSeenSplash = localStorage.getItem('carx-splash-seen');
    
    if (!hasSeenSplash) {
      setShowSplash(true);
    } else {
      setSplashComplete(true);
    }
  }, []);

  const handleSplashComplete = () => {
    localStorage.setItem('carx-splash-seen', 'true');
    setShowSplash(false);
    setSplashComplete(true);
  };

  if (showSplash) {
    return <CinematicSplash onComplete={handleSplashComplete} />;
  }

  if (!splashComplete) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black text-white"
    >
      <Navbar />
      <ModernCarXHome />
    </motion.div>
  );
}