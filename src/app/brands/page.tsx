'use client';

/**
 * CAR X - صفحة الوكالات
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import CircularBrandCard from '@/components/CircularBrandCard';
import { useLanguage } from '@/lib/LanguageContext';

// Mock data for development
const mockBrands = [
  {
    id: '1',
    key: 'hyundai',
    name: 'هيونداي',
    nameAr: 'هيونداي',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=200',
    description: 'وكالة هيونداي الرسمية',
    carCount: 45
  },
  {
    id: '2',
    key: 'kia',
    name: 'كيا',
    nameAr: 'كيا',
    logo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=200',
    description: 'وكالة كيا المعتمدة',
    carCount: 38
  }
];

export default function BrandsPage() {
  const { isRTL, t } = useLanguage();
  const [brands] = useState(mockBrands);

  return (
    <div className={`min-h-screen bg-black text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            {t('brands')}
          </h1>
          <p className="text-xl text-gray-400">
            الوكالات المعتمدة والموثوقة
          </p>
        </motion.div>

        {/* Brands Grid - 2 per row */}
        <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
          {brands.map((brand, index) => (
            <CircularBrandCard
              key={brand.id}
              brand={brand}
              index={index}
              onClick={() => {
                console.log('Brand clicked:', brand);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}