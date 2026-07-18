'use client';

/**
 * غلاف التطبيق (AppShell)
 * يتحكم في مظهر التطبيق بناءً على ما إذا كان يعمل كموقع ويب عادي أو كتطبيق مثبت (PWA).
 */

import { useEffect, useState } from 'react';
import { useStandalone } from '@/lib/useStandalone';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useSocket } from '@/lib/SocketContext';
import BottomTabBar from './BottomTabBar';
import GlobalDrawers from './GlobalDrawers';
import SmartIslandNotification from './SmartIslandNotification';
import AppBackground from './AppBackground';
import PageTransition from './PageTransition';

/**
 * AppShell - غلاف التطبيق
 * يكشف إذا كان التطبيق يعمل كـ PWA مثبت
 * ويظهر Bottom Tab Bar بدلاً من الـ Navbar العادية
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
    const isStandalone = useStandalone(); // التحقق من وضع التشغيل (مستقل PWA أو متصفح)
    const pathname = usePathname(); // المسار الحالي
    const [mounted, setMounted] = useState(false); // حالة التحميل الأولية (لحل مشاكل Hydration)
    const { user } = useAuth(); // المستخدم الحالي للتوثيق
    const { socket } = useSocket(); // الاتصال المباشر لإرسال النبضات

    // ── نظام تتبع التواجد المباشر (Online Status) ──
    useEffect(() => {
        if (!user || !socket) return;
        const uid = (user as any).id || user._id;
        
        // إرسال نبضة بمجرد التحميل
        socket.emit('user_active', uid);
        
        // إرسال نبضة كل دقيقة للحفاظ على حالة المتصل
        const interval = setInterval(() => {
            socket.emit('user_active', uid);
        }, 60000);
        
        return () => clearInterval(interval);
    }, [user, socket]);

    useEffect(() => {
        setMounted(true);

        // تنظيف حالة التثبيت المخزنة إذا لم يكن التطبيق مثبتاً فعلياً
        // هذا يحل مشكلة "التطبيق مثبت بالفعل" عند حذف التطبيق وإعادة الزيارة
        if (mounted) {
            const INSTALLED_KEY = 'pwa_installed';
            const actuallyInstalled =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

            if (!actuallyInstalled) {
                // ليس في وضع standalone = التطبيق محذوف أو غير مثبت
                // نحذف الـ flag القديم حتى يظهر زر التثبيت مرة أخرى
                const wasMarkedInstalled = localStorage.getItem(INSTALLED_KEY);
                if (wasMarkedInstalled) {
                    localStorage.removeItem(INSTALLED_KEY);
                    localStorage.removeItem('pwa_dismissed_until');
                }
            }
        }
    }, []);

    if (!mounted) {
        return <>{children}</>;
    }

    if (pathname?.startsWith('/admin')) {
        return <>{children}</>;
    }

    if (isStandalone && !pathname?.startsWith('/admin')) {
        return (
            <div
                className="relative min-h-screen"
                data-app-mode="standalone"
                style={{ paddingBottom: '80px' }}
            >
                <AppBackground />
                <main className="relative z-10">
                    <PageTransition>{children}</PageTransition>
                </main>
                <BottomTabBar />
                <GlobalDrawers />
                <SmartIslandNotification />
            </div>
        );
    }

    // ── وضع الموقع العادي (Browser Mode) ──
    return (
        <div className="relative min-h-screen pb-[80px] lg:pb-0">
            <PageTransition>{children}</PageTransition>
            {!pathname?.startsWith('/admin') && <BottomTabBar />}
            <GlobalDrawers />
            <SmartIslandNotification />
        </div>
    );
}
