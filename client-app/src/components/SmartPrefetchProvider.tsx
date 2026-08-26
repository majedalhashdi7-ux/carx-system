'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api-original';

/**
 * SmartPrefetchProvider - مزود نظام التحميل المسبق الذكي فائق السرعة
 * يقوم بتسخين الكاش (Cache Warming) مسبقاً وتوقع النقرات لجعل عرض الصفحات لحظياً (0ms).
 */
export default function SmartPrefetchProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const conn = (navigator as any).connection;
        if (conn && (conn.saveData || conn.effectiveType?.includes('2g'))) return;

        const prefetchedPaths = new Set<string>();

        // 1. تسخين الكاش الاستباقي في وقت فراغ المتصفح (Idle Preload)
        const idlePreload = () => {
            const criticalRoutes = [
                { path: '/cars', api: '/api/v2/cars?limit=300&isActive=true' },
                { path: '/parts', api: '/api/v2/parts?limit=100&inStock=true' },
                { path: '/auctions', api: '/api/v2/auctions?limit=50' },
                { path: '/brands', api: '/api/v2/brands' },
                { path: '/showroom', api: '/api/v2/showroom/cars?page=1' }
            ];

            criticalRoutes.forEach((route, i) => {
                setTimeout(() => {
                    try {
                        router.prefetch(route.path);
                        fetchAPI(route.api, { useCache: true }).catch(() => {});
                        prefetchedPaths.add(route.path);
                    } catch {}
                }, 400 + i * 200);
            });
        };

        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(idlePreload, { timeout: 2000 });
        } else {
            setTimeout(idlePreload, 800);
        }

        // 2. الجلب الفوري عند اقتراب المؤشر أو اللمس (Ultra-fast Hover & Touch Prefetch)
        let debounceTimer: NodeJS.Timeout;

        const prefetchTarget = (targetEl: HTMLElement | null) => {
            const anchor = targetEl?.closest('a');
            if (!anchor || !anchor.href) return;

            try {
                const url = new URL(anchor.href, window.location.origin);
                if (url.origin !== window.location.origin) return;

                const path = url.pathname;
                if (prefetchedPaths.has(path)) return;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    prefetchedPaths.add(path);
                    router.prefetch(path);

                    if (path.startsWith('/cars/')) {
                        const id = path.split('/')[2];
                        if (id) fetchAPI(`/api/v2/cars/${id}`, { useCache: true }).catch(() => {});
                    } else if (path.startsWith('/parts/')) {
                        const id = path.split('/')[2];
                        if (id) fetchAPI(`/api/v2/parts/${id}`, { useCache: true }).catch(() => {});
                    } else if (path.startsWith('/auctions/')) {
                        const id = path.split('/')[2];
                        if (id) fetchAPI(`/api/v2/auctions/${id}`, { useCache: true }).catch(() => {});
                    }
                }, 30); // استجابة فورية 30ms فقط
            } catch {}
        };

        const handlePointerOver = (e: MouseEvent | TouchEvent) => {
            prefetchTarget(e.target as HTMLElement);
        };

        document.addEventListener('mouseover', handlePointerOver, { passive: true });
        document.addEventListener('touchstart', handlePointerOver, { passive: true });

        return () => {
            document.removeEventListener('mouseover', handlePointerOver);
            document.removeEventListener('touchstart', handlePointerOver);
            clearTimeout(debounceTimer);
        };
    }, [router]);

    return <>{children}</>;
}
