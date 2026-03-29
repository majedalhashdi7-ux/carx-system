'use client';

/**
 * CAR X - صفحة المعرض
 * عرض السيارات الكورية مع البطاقات الإبداعية الجديدة
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UltraModernCarCard from '@/components/UltraModernCarCard';
import { useLanguage } from '@/lib/LanguageContext';

// Mock data for development
const mockCars = [
  {
    id: '1',
    title: 'هيونداي سوناتا 2023',
    make: 'هيونداي',
    model: 'سوناتا',
    year: 2023,
    price: 85000,
    images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000'],
    mileage: 15000,
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    source: 'korean_import',
    isInspected: true,
    condition: 'used'
  },
  {
    id: '2',
    title: 'كيا سيراتو 2022',
    make: 'كيا',
    model: 'سيراتو',
    year: 2022,
    price: 65000,
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000'],
    mileage: 25000,
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    source: 'korean_import',
    isInspected: true,
    condition: 'used'
  }
];

export default function ShowroomPage() {
  const { isRTL, t } = useLanguage();
  const [cars, setCars] = useState(mockCars);
  const [loading, setLoading] = useState(false);

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
            {t('showroom')}
          </h1>
          <p className="text-xl text-gray-400">
            السيارات الكورية المميزة
          </p>
        </motion.div>

        {/* Cars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car, index) => (
            <UltraModernCarCard
              key={car.id}
              car={car}
              index={index}
              formatPrice={(price) => `${price.toLocaleString()} ر.س`}
              onContact={(car) => {
                const message = `مرحباً، أريد الاستفسار عن ${car.title}`;
                const whatsappUrl = `https://wa.me/967781007805?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              onViewDetails={(car) => {
                console.log('View details:', car);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}