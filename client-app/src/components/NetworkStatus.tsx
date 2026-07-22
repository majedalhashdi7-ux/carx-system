'use client';

/**
 * Network Status & Real-time Swipeable Toast Notifications Component
 * يراقب حالة الاتصال بالإنترنت ويعرض إشعارات عائمة حديثة قابلة للسحب للإلغاء (Swipe to Dismiss)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, Bell, Sparkles, ShoppingCart, Gavel, X, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';

export interface ToastNotification {
    id: string;
    title: string;
    message: string;
    type?: 'GENERAL' | 'OFFER' | 'AUCTION' | 'SYSTEM' | 'ORDER';
    url?: string;
    timestamp?: string;
}

export default function NetworkStatus() {
  const { isRTL } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // فحص حالة الاتصال
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // الاستماع للإشعارات المباشرة من النظام (Event or Local)
    const handleNewNotification = (e: any) => {
      if (e.detail) {
        const newToast: ToastNotification = e.detail;
        setToasts(prev => [newToast, ...prev.filter(t => t.id !== newToast.id).slice(0, 4)]);
        
        // إخفاء تلقائي بعد 7 ثوانٍ
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, 7000);
      }
    };

    window.addEventListener('hm_push_notification' as any, handleNewNotification);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hm_push_notification' as any, handleNewNotification);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* ─── تنبيه الشبكة ─── */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none"
          >
            <div
              className={`px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 ${
                isOnline
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="font-bold">تم استعادة الاتصال</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span className="font-bold">لا يوجد اتصال بالإنترنت</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── مكدّس الإشعارات العائمة التفاعلي بالسحب (Swipeable Toast Stack) ─── */}
      {toasts.length > 0 && (
        <div 
          className="fixed top-20 start-4 end-4 sm:start-auto sm:end-6 sm:w-96 z-[9999] pointer-events-none space-y-3"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: isRTL ? -200 : 200, scale: 0.8 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 70) {
                    dismissToast(toast.id);
                  }
                }}
                className="pointer-events-auto relative rounded-2xl bg-zinc-950/90 border border-[#C9A96E]/40 p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl group cursor-grab active:cursor-grabbing overflow-hidden"
              >
                {/* Glowing Accent */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#C9A96E]/15 via-transparent to-transparent pointer-events-none" />

                <div className="flex items-start gap-3.5 relative z-10">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(201,169,110,0.25)]">
                    {toast.type === 'AUCTION' ? <Gavel className="w-5 h-5" /> :
                     toast.type === 'ORDER' ? <ShoppingCart className="w-5 h-5" /> :
                     toast.type === 'OFFER' ? <Sparkles className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-black text-white truncate leading-tight">
                        {toast.title}
                      </h4>
                      <span className="text-[9px] font-mono text-[#C9A96E]/80 shrink-0 bg-[#C9A96E]/10 px-1.5 py-0.5 rounded">
                        {isRTL ? 'اسحب للإلغاء ↔️' : 'Swipe ↔️'}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed line-clamp-2 font-medium">
                      {toast.message}
                    </p>

                    {toast.url && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                        <Link 
                          href={toast.url}
                          onClick={() => dismissToast(toast.id)}
                          className="text-[10px] font-black text-[#C9A96E] hover:underline flex items-center gap-1"
                        >
                          <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="text-white/40 hover:text-white p-1 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}
