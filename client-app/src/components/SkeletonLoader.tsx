'use client';
/**
 * SkeletonLoader — مكوّن تحميل متحرك بديل عن الـ spinner
 * يُحسّن الإحساس بالسرعة (perceived performance) بعرض هيكل الصفحة فوراً
 */

interface SkeletonProps { className?: string; }

function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
    );
}

/** بطاقة سيارة skeleton */
export function CarCardSkeleton() {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
            <Skeleton className="w-full h-52 rounded-none rounded-t-3xl" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10 w-full mt-2" />
            </div>
        </div>
    );
}

/** شبكة بطاقات سيارات skeleton */
export function CarGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <CarCardSkeleton key={i} />
            ))}
        </div>
    );
}

/** صف بيانات جدول skeleton */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

/** قسم صفحة skeleton */
export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-[#050505] p-6 space-y-6 animate-pulse">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            {/* Content */}
            <CarGridSkeleton count={6} />
        </div>
    );
}

/** Spinner خفيف للعمليات الصغيرة */
export function MiniSpinner({ className = '' }: { className?: string }) {
    return (
        <div className={`w-5 h-5 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin ${className}`} />
    );
}

export default Skeleton;
