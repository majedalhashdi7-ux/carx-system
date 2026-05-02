'use client';

/**
 * CurrencySelector - مكون تبديل العملة الفاخر
 * تصميم مذهل مع معلومات مفصلة
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ChevronDown, Check, RefreshCw, TrendingUp } from 'lucide-react';
import { useCurrency, CURRENCIES, Currency } from '@/lib/CurrencyContext';

export default function CurrencySelector() {
  const { currency, currencyInfo, setCurrency, updateRates, lastUpdated } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdateRates = async () => {
    setUpdating(true);
    await updateRates();
    setUpdating(false);
  };

  const handleSelectCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* الزر الرئيسي */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
      >
        <span className="text-xl">{currencyInfo.flag}</span>
        <span className="font-bold text-white">{currencyInfo.symbol}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* القائمة المنسدلة */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* الخلفية */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* القائمة */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute top-full left-0 mt-2 w-80 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
            >
              {/* رأس القائمة */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-white">اختر العملة</h3>
                  </div>
                  
                  <motion.button
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleUpdateRates}
                    disabled={updating}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>

                {lastUpdated && (
                  <p className="text-xs text-gray-500">
                    آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
                  </p>
                )}
              </div>

              {/* قائمة العملات */}
              <div className="p-2 max-h-96 overflow-y-auto">
                {Object.values(CURRENCIES).map((curr, idx) => {
                  const isSelected = curr.code === currency;
                  
                  return (
                    <motion.button
                      key={curr.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 5 }}
                      onClick={() => handleSelectCurrency(curr.code)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-red-500/20 border border-red-500/50'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* العلم */}
                      <span className="text-2xl">{curr.flag}</span>

                      {/* المعلومات */}
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{curr.nameAr}</span>
                          <span className="text-xs text-gray-500">({curr.code})</span>
                        </div>
                        <span className="text-sm text-gray-400">{curr.name}</span>
                      </div>

                      {/* الرمز */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{curr.symbol}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* تذييل القائمة */}
              <div className="p-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>الأسعار تحدث تلقائياً كل ساعة</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
