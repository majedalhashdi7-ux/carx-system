'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api-original';

/**
 * SmartPrefetchProvider - مزود نظام التحميل المسبق الذكي
 * يقوم بتوقع الصفحات التي سيفتحها العميل ويحمل بياناتها في الخلفية.
 */
export default function SmartPrefetchProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const conn = (navigator as any).connection;
        if (conn && (conn.saveData || conn.effectiveType?.includes('2g'))) return;

        // [[ARABIC_COMMENT]] متغير لمنع التكرار (Debounce)
        let prefetchTimer: NodeJS.Timeout;
        const prefetchedUrls = new Set<string>();

        const handleMouseOver = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target || !target.href) return;

            const urlStr = target.href;
            const url = new URL(urlStr, window.location.origin);
            if (url.origin !== window.location.origin) return;

            const path = url.pathname;
            if (prefetchedUrls.has(path)) return; // تم الجلب مسبقاً

            clearTimeout(prefetchTimer);
            prefetchTimer = setTimeout(() => {
                prefetchedUrls.add(path);
                // 1. [[ARABIC_COMMENT]] إخبار Next.js بتحميل الكود
                router.prefetch(path);

                // 2. [[ARABIC_COMMENT]] جلب الـ API لصفحات محددة
                if (path.startsWith('/cars/') || path.startsWith('/parts/')) {
                    const id = path.split('/')[2];
                    if (id) {
                        fetchAPI(`/api/v2${path.startsWith('/cars/') ? '/cars' : '/parts'}/${id}`, { useCache: true }).catch(() => {});
                    }
                }
            }, 150); // تأخير 150 ملي ثانية لعدم استنزاف المتصفح عند المرور العابر
        };

        // [[ARABIC_COMMENT]] استخدام mouseover العادي بدلاً من mouseenter بوضع capture الخانق
        document.addEventListener('mouseover', handleMouseOver);
        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            clearTimeout(prefetchTimer);
        };
    }, [router]);

    return <>{children}</>;
}
