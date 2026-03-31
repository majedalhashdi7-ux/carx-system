'use client';

/**
 * AdvancedCart - سلة تسوق متقدمة وفاخرة
 * تصميم مذهل مع جميع الميزات
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, X, Plus, Minus, Trash2, Tag, Gift,
  Truck, Shield, CreditCard, ArrowRight, AlertCircle,
  CheckCircle, Percent, Package
} from 'lucide-react';
import { useCart } from '@/lib/CartContext';

interface AdvancedCartProps {
  show: boolean;
  onClose: () => void;
}

export default function AdvancedCart({ show, onClose }: AdvancedCartProps) {
  const {
    items,
    itemCount,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMessage(null);

    const success = await applyCoupon(couponCode);

    if (success) {
      setCouponMessage({ type: 'success', text: 'تم تطبيق الكوبون بنجاح!' });
      setCouponCode('');
    } else {
      setCouponMessage({ type: 'error', text: 'كوبون غير صحيح' });
    }

    setCouponLoading(false);
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-gradient-to-br from-zinc-900 to-black border-l border-white/10 flex flex-col"
      >
        {/* رأس السلة */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">سلة التسوق</h2>
              <p className="text-sm text-gray-400">{itemCount} منتج</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* سلة فارغة */
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <ShoppingCart className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">السلة فارغة</h3>
            <p className="text-gray-400 text-center mb-6">
              لم تقم بإضافة أي منتجات بعد
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all"
            >
              تصفح المنتجات
            </button>
          </div>
        ) : (
          <>
            {/* قائمة المنتجات */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                  >
                    <div className="flex gap-4">
                      {/* الصورة */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-950 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      {/* المعلومات */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">
                          {item.name}
                        </h4>
                        {item.type === 'car' && (
                          <p className="text-xs text-gray-400 mb-2">
                            {item.make} {item.model} {item.year}
                          </p>
                        )}
                        {item.type === 'part' && item.partNumber && (
                          <p className="text-xs text-gray-400 mb-2 font-mono">
                            #{item.partNumber}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {/* السعر */}
                          <span className="text-lg font-black text-gradient-red">
                            {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س
                          </span>

                          {/* التحكم بالكمية */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.stock !== undefined && item.quantity >= item.stock}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* كوبون الخصم */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold text-white">كوبون الخصم</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="أدخل الكوبون"
                    disabled={couponLoading}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-red-500/50 text-white text-sm placeholder-gray-500 outline-none transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
                  >
                    {couponLoading ? 'جاري...' : 'تطبيق'}
                  </button>
                </div>
                {couponMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 mt-2 text-xs ${
                      couponMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {couponMessage.type === 'success' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{couponMessage.text}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* الملخص والدفع */}
            <div className="border-t border-white/10 p-6 space-y-4">
              {/* الحسابات */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">المجموع الفرعي</span>
                  <span className="font-bold text-white">{subtotal.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">الضريبة (15%)</span>
                  <span className="font-bold text-white">{tax.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">الشحن</span>
                  <span className="font-bold text-white">
                    {shipping === 0 ? (
                      <span className="text-green-400">مجاني</span>
                    ) : (
                      `${shipping.toLocaleString('ar-SA')} ر.س`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الخصم</span>
                    <span className="font-bold text-green-400">-{discount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-white/10">
                  <span className="font-black text-white">الإجمالي</span>
                  <span className="font-black text-gradient-red text-2xl">
                    {total.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {/* الميزات */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">شحن سريع</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">دفع آمن</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">ضمان الجودة</span>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="space-y-2">
                <Link href="/checkout">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold transition-all shadow-lg hover:shadow-red-500/50"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>إتمام الطلب</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>

                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all"
                >
                  متابعة التسوق
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
