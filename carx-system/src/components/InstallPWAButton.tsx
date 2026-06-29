'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed before
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowBanner(false);
      }
    } catch {
      // ignored
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
        dir="rtl"
      >
        <div className="bg-black/90 backdrop-blur-2xl border border-luxury-gold/30 rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(212,175,55,0.1)]">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 left-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/60" />
          </button>

          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/icons/icon-192.png" alt="CAR X" className="w-10 h-10 object-cover rounded-xl" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-luxury-gold text-xl font-black">CX</span>';
              }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm">ثبّت تطبيق CAR X</p>
              <p className="text-white/40 text-xs mt-0.5 leading-relaxed">
                أضف التطبيق لشاشتك الرئيسية للوصول السريع
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            disabled={installing}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-luxury-gold text-black font-black py-3 rounded-2xl hover:bg-white transition-all duration-300 disabled:opacity-60 text-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]"
          >
            {installing ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                جاري التثبيت...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                تثبيت التطبيق مجاناً
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
