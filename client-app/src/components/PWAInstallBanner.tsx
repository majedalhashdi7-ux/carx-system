'use client';

/**
 * PWAInstallBanner - بانر تثبيت التطبيق على الهاتف
 * يظهر تلقائياً بعد 5 ثوانٍ للمستخدمين الجدد فقط
 * يدعم Android (beforeinstallprompt) و iOS (Safari)
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share2, Plus } from 'lucide-react';

type Platform = 'android' | 'ios' | null;

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // تجاهل إذا كان يعمل كـ PWA مثبّت بالفعل
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // تجاهل إذا رفض المستخدم من قبل (آخر 7 أيام)
    const dismissedAt = localStorage.getItem('pwa_dismissed_at');
    if (dismissedAt) {
      const diff = Date.now() - Number(dismissedAt);
      if (diff < 7 * 24 * 60 * 60 * 1000) return; // 7 أيام
    }

    // كشف المنصة
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (!isIOS && !isAndroid) return; // لا تظهر على Desktop

    // Android: استمع لحدث التثبيت
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      // أظهر البانر بعد 5 ثوانٍ
      setTimeout(() => setShow(true), 5000);
    };

    if (isAndroid) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    } else if (isIOS) {
      // iOS: أظهر التعليمات اليدوية بعد 5 ثوانٍ
      setPlatform('ios');
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (platform === 'android' && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setIsInstalled(true);
      }
    } else if (platform === 'ios') {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_dismissed_at', String(Date.now()));
  };

  if (isInstalled || !show) return null;

  return (
    <>
      <AnimatePresence>
        {show && !showIOSGuide && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-4 left-3 right-3 z-[999] lg:hidden"
          >
            <div className="relative bg-gradient-to-br from-[#0e0e1a] to-[#1a1a2e] border border-[#C9A96E]/30 rounded-2xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* خلفية زجاجية */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/5 to-transparent rounded-2xl" />

              {/* زر الإغلاق */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative flex items-center gap-3">
                {/* أيقونة التطبيق */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A96E] to-[#a07840] flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-2xl font-black text-black">H</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#C9A96E] uppercase tracking-widest mb-0.5">HM CAR</p>
                  <h3 className="text-sm font-black text-white leading-tight">ثبّت التطبيق على هاتفك</h3>
                  <p className="text-[10px] text-white/40 mt-0.5">تجربة أسرع وإشعارات فورية للمزادات</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 bg-[#C9A96E] text-black font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#C9A96E]/30 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  تثبيت
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* دليل iOS */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[1000] flex items-end lg:hidden"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 250 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#0e0e1a] border-t border-white/10 rounded-t-3xl p-5 pb-8"
              dir="rtl"
            >
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-5" />

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9A96E] to-[#a07840] flex items-center justify-center">
                  <span className="text-xl font-black text-black">H</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تثبيت HM CAR</h3>
                  <p className="text-xs text-white/40">اتبع الخطوات أدناه</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Share2, step: '1', text: 'اضغط على زر المشاركة', sub: 'الزر الموجود في شريط أدوات Safari أسفل الشاشة' },
                  { icon: Plus, step: '2', text: 'اختر "إضافة إلى الشاشة الرئيسية"', sub: 'مرر قائمة الخيارات للأسفل' },
                  { icon: Smartphone, step: '3', text: 'اضغط "إضافة"', sub: 'سيظهر تطبيق HM CAR على شاشتك مباشرة' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/4">
                    <div className="w-7 h-7 rounded-full bg-[#C9A96E] flex items-center justify-center text-black font-black text-xs shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <item.icon className="w-4 h-4 text-[#C9A96E] mb-1" />
                      <p className="text-sm font-bold text-white">{item.text}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setShowIOSGuide(false); handleDismiss(); }}
                className="mt-4 w-full py-3 rounded-xl bg-white/5 text-white/50 text-sm font-bold border border-white/8"
              >
                لاحقاً
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
