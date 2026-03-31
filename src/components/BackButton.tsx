'use client';

/**
 * BackButton - زر رجوع أنيق ومتجاوب
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  label?: string;
  showHome?: boolean;
}

export default function BackButton({ href, label, showHome = false }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <motion.button
        whileHover={{ scale: 1.05, x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleBack}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 text-white transition-all"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-sm font-bold">{label || 'رجوع'}</span>
      </motion.button>

      {showHome && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 text-white transition-all"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-bold">الرئيسية</span>
        </motion.button>
      )}
    </div>
  );
}
