'use client';

/**
 * صفحة إعادة التوجيه من /compare إلى /comparisons
 * لحل مشكلة 404 عند الوصول إلى /compare
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CompareRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = searchParams.toString();
        const target = params ? `/comparisons?${params}` : '/comparisons';
        router.replace(target);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        }>
            <CompareRedirect />
        </Suspense>
    );
}
