'use client';

/**
 * CAR X - الصفحة الرئيسية
 * نظام مستقل ومبسط بدون multi-tenant
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import ModernCarXHome from '@/components/ModernCarXHome';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <ModernCarXHome />
    </div>
  );
}