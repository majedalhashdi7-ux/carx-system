'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

export default function PWAAutoUpdateBanner() {
    const { isRTL } = useLanguage();
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        let registration: ServiceWorkerRegistration | null | undefined = null;

        const checkSWUpdate = async () => {
            try {
                registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    // فحص التحديث من السيرفر
                    await registration.update();
                    if (registration.waiting) {
                        setUpdateAvailable(true);
                    }
                }
            } catch (err) {
                console.warn('[PWA] Update check error:', err);
            }
        };

        const handleUpdateFound = () => {
            if (!registration) return;
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        setUpdateAvailable(true);
                    }
                });
            }
        };

        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg) {
                registration = reg;
                if (reg.waiting) {
                    setUpdateAvailable(true);
                }
                reg.addEventListener('updatefound', handleUpdateFound);
            }
        });

        const handleControllerChange = () => {
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        // فحص مبدئي وبعد ذلك كل 3 دقائق
        const timeout = setTimeout(checkSWUpdate, 3000);
        const interval = setInterval(checkSWUpdate, 3 * 60 * 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

    const handleApplyUpdate = async () => {
        setUpdating(true);
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg && reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((key) => caches.delete(key)));
            }
        } catch (err) {
            console.error('Update apply error:', err);
        } finally {
            window.location.reload();
        }
    };

    if (!updateAvailable || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className="fixed top-20 inset-x-4 sm:left-auto sm:right-6 sm:w-96 z-[9999] pointer-events-auto"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="bg-[#0f0f1d]/95 backdrop-blur-2xl border border-[#D4AF37]/50 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8)] shadow-[#D4AF37]/10 flex items-center justify-between gap-3 text-white">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8c701e] flex items-center justify-center shrink-0 shadow-md">
                            <Sparkles className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                                {isRTL ? 'يتوفر تحديث جديد للنظام! ✨' : 'New System Update Available! ✨'}
                            </h4>
                            <p className="text-[10px] font-bold text-white/50 mt-0.5">
                                {isRTL ? 'انقر لتطبيق التعديلات والتحسينات فوراً' : 'Click to apply instant system improvements'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleApplyUpdate}
                            disabled={updating}
                            className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#b8932b] text-black text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                            <span>{isRTL ? 'تحديث الآن' : 'Update'}</span>
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1.5 text-white/40 hover:text-white transition-colors rounded-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
