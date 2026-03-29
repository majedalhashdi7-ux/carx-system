'use client';

/**
 * CAR X - صفحة قطع الغيار
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import UltraModernPartCard from '@/components/UltraModernPartCard';
import { useLanguage } from '@/lib/LanguageContext';

// Mock data for development
const mockParts = [
  {
    _id: '1',
    name: 'فلتر هواء هيونداي',
    nameAr: 'فلتر هواء هيونداي',
    brand: 'هيونداي',
    price: 150,
    img: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000',
    condition: 'NEW' as const,
    category: 'فلاتر',
    stockQty: 25,
    compatibility: ['سوناتا', 'النترا', 'أكسنت']
  },
  {
    _id: '2',
    name: 'بطارية كيا سيراتو',
    nameAr: 'بطارية كيا سيراتو',
    brand: 'كيا',
    price: 450,
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1000',
    condition: 'NEW' as const,
    category: 'بطاريات',
    stockQty: 12,
    compatibility: ['سيراتو', 'ريو', 'بيكانتو']
  }
];

export default function PartsPage() {
  const { isRTL, t } = useLanguage();
  const [parts] = useState(mockParts);

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
            {t('parts')}
          </h1>
          <p className="text-xl text-gray-400">
            قطع غيار أصلية ومضمونة
          </p>
        </motion.div>

        {/* Parts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {parts.map((part, index) => (
            <UltraModernPartCard
              key={part._id}
              part={part}
              index={index}
              onClick={() => {
                console.log('Part clicked:', part);
              }}
              onLoginRequired={() => {
                console.log('Login required');
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}