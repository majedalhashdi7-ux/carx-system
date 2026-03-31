'use client';

/**
 * CartContext - نظام السلة المتقدم
 * إدارة السلة مع localStorage والمزامنة
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  type: 'car' | 'part';
  name: string;
  price: number;
  image: string;
  quantity: number;
  // معلومات إضافية للسيارات
  make?: string;
  model?: string;
  year?: number;
  // معلومات إضافية لقطع الغيار
  partNumber?: string;
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0.15; // 15% ضريبة
const SHIPPING_COST = 50; // تكلفة الشحن الثابتة
const FREE_SHIPPING_THRESHOLD = 1000; // شحن مجاني فوق 1000 ر.س

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // تحميل السلة من localStorage عند البداية
  useEffect(() => {
    const savedCart = localStorage.getItem('carx-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('فشل تحميل السلة:', error);
      }
    }
  }, []);

  // حفظ السلة في localStorage عند التغيير
  useEffect(() => {
    localStorage.setItem('carx-cart', JSON.stringify(items));
    
    // إرسال حدث للمزامنة بين التبويبات
    window.dispatchEvent(new Event('cart-updated'));
  }, [items]);

  // الاستماع للتغييرات من تبويبات أخرى
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem('carx-cart');
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('فشل المزامنة:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleStorageChange);
    };
  }, []);

  // الحسابات
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping - discount;

  // إضافة عنصر
  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === newItem.id);
      
      if (existingItem) {
        // زيادة الكمية إذا كان موجوداً
        return prevItems.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // إضافة عنصر جديد
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
  };

  // حذف عنصر
  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // تحديث الكمية
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // مسح السلة
  const clearCart = () => {
    setItems([]);
    setDiscount(0);
  };

  // تطبيق كوبون
  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      // في الواقع، يجب التحقق من الكوبون عبر API
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });

      const data = await response.json();

      if (data.success) {
        setDiscount(data.discount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('فشل التحقق من الكوبون:', error);
      return false;
    }
  };

  // التحقق من وجود عنصر في السلة
  const isInCart = (id: string): boolean => {
    return items.some((item) => item.id === id);
  };

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    tax,
    shipping,
    discount,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
