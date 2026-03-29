'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'ar' | 'en';
  isRTL: boolean;
  setLanguage: (lang: 'ar' | 'en') => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    showroom: 'المعرض',
    parts: 'قطع الغيار',
    brands: 'الوكالات',
    about: 'من نحن',
    contact: 'تواصل معنا',
    
    // Common
    search: 'بحث',
    filter: 'فلتر',
    sort: 'ترتيب',
    price: 'السعر',
    brand: 'الماركة',
    model: 'الموديل',
    year: 'السنة',
    mileage: 'المسافة',
    fuel: 'الوقود',
    transmission: 'ناقل الحركة',
    condition: 'الحالة',
    
    // Actions
    buy: 'شراء',
    contactAction: 'تواصل',
    details: 'التفاصيل',
    addToCart: 'أضف للسلة',
    addToFavorites: 'أضف للمفضلة',
    share: 'مشاركة',
    
    // Status
    available: 'متوفر',
    sold: 'مباع',
    reserved: 'محجوز',
    new: 'جديد',
    used: 'مستعمل',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    phone: 'رقم الهاتف',
  },
  en: {
    // Navigation
    home: 'Home',
    showroom: 'Showroom',
    parts: 'Parts',
    brands: 'Brands',
    about: 'About',
    contact: 'Contact',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    price: 'Price',
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    mileage: 'Mileage',
    fuel: 'Fuel',
    transmission: 'Transmission',
    condition: 'Condition',
    
    // Actions
    buy: 'Buy',
    contactAction: 'Contact',
    details: 'Details',
    addToCart: 'Add to Cart',
    addToFavorites: 'Add to Favorites',
    share: 'Share',
    
    // Status
    available: 'Available',
    sold: 'Sold',
    reserved: 'Reserved',
    new: 'New',
    used: 'Used',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    phone: 'Phone',
  },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const isRTL = language === 'ar';

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('carx-language') as 'ar' | 'en';
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: 'ar' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('carx-language', lang);
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    handleSetLanguage(newLang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        setLanguage: handleSetLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}