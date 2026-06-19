'use client';

/**
 * ComparisonSystem - نظام مقارنة السيارات المتقدم
 * تصميم فاخر مع رسوم بيانية تفاعلية
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X, Plus, Check, TrendingUp, Award, Zap, Shield,
  Calendar, Gauge, Fuel, Settings, DollarSign, Star,
  ArrowRight, Info, ChevronDown, ChevronUp
} from 'lucide-react';

interface Car {
  _id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceSar?: number;
  images: string[];
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  condition?: string;
  engine?: string;
  horsepower?: number;
  torque?: number;
  acceleration?: number;
  topSpeed?: number;
  fuelConsumption?: number;
  seatingCapacity?: number;
  warranty?: string;
  features?: string[];
}

interface ComparisonSystemProps {
  cars: Car[];
  maxCompare?: number;
  onAddCar?: () => void;
}

export default function ComparisonSystem({
  cars: availableCars,
  maxCompare = 3,
  onAddCar
}: ComparisonSystemProps) {
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['specs', 'performance', 'price']);

  const addCar = (car: Car) => {
    if (selectedCars.length < maxCompare && !selectedCars.find(c => c._id === car._id)) {
      setSelectedCars([...selectedCars, car]);
      setShowAddModal(false);
    }
  };

  const removeCar = (carId: string) => {
    setSelectedCars(selectedCars.filter(c => c._id !== carId));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // مقارنة المواصفات
  const specs = [
    { key: 'year', label: 'السنة', icon: Calendar, getValue: (car: Car) => car.year },
    { key: 'mileage', label: 'الكيلومترات', icon: Gauge, getValue: (car: Car) => car.mileage ? `${car.mileage.toLocaleString()} كم` : '—' },
    { key: 'fuelType', label: 'نوع الوقود', icon: Fuel, getValue: (car: Car) => car.fuelType || '—' },
    { key: 'transmission', label: 'ناقل الحركة', icon: Settings, getValue: (car: Car) => car.transmission || '—' },
    { key: 'engine', label: 'المحرك', icon: Zap, getValue: (car: Car) => car.engine || '—' },
    { key: 'color', label: 'اللون', icon: null, getValue: (car: Car) => car.color || '—' },
  ];

  const performance = [
    { key: 'horsepower', label: 'القوة الحصانية', unit: 'حصان', getValue: (car: Car) => car.horsepower },
    { key: 'torque', label: 'عزم الدوران', unit: 'نيوتن.متر', getValue: (car: Car) => car.torque },
    { key: 'acceleration', label: 'التسارع 0-100', unit: 'ثانية', getValue: (car: Car) => car.acceleration },
    { key: 'topSpeed', label: 'السرعة القصوى', unit: 'كم/س', getValue: (car: Car) => car.topSpeed },
    { key: 'fuelConsumption', label: 'استهلاك الوقود', unit: 'لتر/100كم', getValue: (car: Car) => car.fuelConsumption },
  ];

  return (
    <div className="space-y-6">
      {/* رأس المقارنة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">مقارنة السيارات</h2>
          <p className="text-gray-400">قارن حتى {maxCompare} سيارات جنباً إلى جنب</p>
        </div>
        
        {selectedCars.length < maxCompare && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg hover:shadow-red-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>أضف سيارة</span>
          </motion.button>
        )}
      </div>

      {selectedCars.length === 0 ? (
        /* حالة فارغة */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-white/10"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">ابدأ المقارنة</h3>
          <p className="text-gray-400 mb-6">اختر سيارتين أو أكثر للمقارنة بينهما</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>اختر السيارات</span>
          </button>
        </motion.div>
      ) : (
        /* جدول المقارنة */
        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl border border-white/10 overflow-hidden">
          {/* بطاقات السيارات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-white/10">
            {selectedCars.map((car, idx) => (
              <motion.div
                key={car._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
              >
                {/* زر الحذف */}
                <button
                  onClick={() => removeCar(car._id)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* الصورة */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-zinc-950">
                  <Image
                    src={car.images[0] || '/placeholder-car.jpg'}
                    alt={car.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* المعلومات */}
                <h3 className="text-lg font-black text-white mb-1 line-clamp-1">{car.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{car.make} {car.model}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gradient-red">
                    {(car.priceSar || car.price).toLocaleString('ar-SA')}
                  </span>
                  <span className="text-sm text-gray-400">ر.س</span>
                </div>
              </motion.div>
            ))}

            {/* مساحات فارغة */}
            {Array.from({ length: maxCompare - selectedCars.length }).map((_, idx) => (
              <motion.button
                key={`empty-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowAddModal(true)}
                className="aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-red-500/50 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-red-500/20 border border-white/10 group-hover:border-red-500/50 flex items-center justify-center transition-all">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold">أضف سيارة</span>
              </motion.button>
            ))}
          </div>

          {/* المواصفات الأساسية */}
          <ComparisonSection
            title="المواصفات الأساسية"
            icon={Settings}
            expanded={expandedSections.includes('specs')}
            onToggle={() => toggleSection('specs')}
          >
            {specs.map((spec) => (
              <ComparisonRow
                key={spec.key}
                label={spec.label}
                icon={spec.icon}
                values={selectedCars.map(car => spec.getValue(car))}
              />
            ))}
          </ComparisonSection>

          {/* الأداء */}
          <ComparisonSection
            title="الأداء"
            icon={Zap}
            expanded={expandedSections.includes('performance')}
            onToggle={() => toggleSection('performance')}
          >
            {performance.map((perf) => (
              <ComparisonRow
                key={perf.key}
                label={perf.label}
                values={selectedCars.map(car => {
                  const value = perf.getValue(car);
                  return value ? `${value} ${perf.unit}` : '—';
                })}
                showBars
                maxValue={Math.max(...selectedCars.map(car => perf.getValue(car) || 0))}
              />
            ))}
          </ComparisonSection>

          {/* السعر */}
          <ComparisonSection
            title="السعر"
            icon={DollarSign}
            expanded={expandedSections.includes('price')}
            onToggle={() => toggleSection('price')}
          >
            <ComparisonRow
              label="السعر"
              values={selectedCars.map(car => `${(car.priceSar || car.price).toLocaleString('ar-SA')} ر.س`)}
              showBars
              maxValue={Math.max(...selectedCars.map(car => car.priceSar || car.price))}
              highlight="price"
            />
          </ComparisonSection>
        </div>
      )}

      {/* نافذة إضافة سيارة */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">اختر سيارة للمقارنة</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCars
                  .filter(car => !selectedCars.find(c => c._id === car._id))
                  .map((car) => (
                    <button
                      key={car._id}
                      onClick={() => addCar(car)}
                      className="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all group"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-zinc-950">
                        <Image
                          src={car.images[0] || '/placeholder-car.jpg'}
                          alt={car.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      </div>
                      <h4 className="font-bold text-white mb-1 line-clamp-1">{car.title}</h4>
                      <p className="text-sm text-gray-400">{car.make} {car.model}</p>
                    </button>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// قسم المقارنة
function ComparisonSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  children
}: {
  title: string;
  icon: any;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// صف المقارنة
function ComparisonRow({
  label,
  icon: Icon,
  values,
  showBars = false,
  maxValue = 0,
  highlight
}: {
  label: string;
  icon?: any;
  values: any[];
  showBars?: boolean;
  maxValue?: number;
  highlight?: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 items-center p-3 rounded-xl bg-white/5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm font-bold text-gray-300">{label}</span>
      </div>

      {values.map((value, idx) => (
        <div key={idx} className="text-center">
          <div className="text-sm font-bold text-white mb-1">{value}</div>
          {showBars && maxValue > 0 && typeof value === 'string' && (
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(parseFloat(value.replace(/[^0-9.]/g, '')) / maxValue) * 100}%`
                }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={`h-full ${
                  highlight === 'price'
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
