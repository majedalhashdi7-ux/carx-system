'use client';

/**
 * LoadingSkeleton - عناصر تحميل محسنة لـ CAR X
 * تحسين تجربة المستخدم أثناء التحميل
 */

import React from 'react';
import { motion } from 'framer-motion';

// بطاقة تحميل للسيارات
export function CarSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-3xl overflow-hidden border border-white/10"
        >
            <div className="h-64 bg-gray-800 animate-pulse" />
            <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-800 rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-gray-800 rounded-lg animate-pulse w-1/2" />
                <div className="flex gap-4 mt-4">
                    <div className="h-12 bg-gray-800 rounded-xl animate-pulse w-1/3" />
                    <div className="h-12 bg-gray-800 rounded-xl animate-pulse w-2/3" />
                </div>
            </div>
        </motion.div>
    );
}

// بطاقة تحميل للقطع
export function PartSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 p-4"
        >
            <div className="h-40 bg-gray-800 rounded-xl animate-pulse mb-4" />
            <div className="h-5 bg-gray-800 rounded-lg animate-pulse w-3/4 mb-2" />
            <div className="h-4 bg-gray-800 rounded-lg animate-pulse w-1/2 mb-4" />
            <div className="h-8 bg-gray-800 rounded-lg animate-pulse w-1/3" />
        </motion.div>
    );
}

// بطاقة تحميل للعلامات
export function BrandSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 animate-pulse" />
            <div className="h-6 bg-gray-800 rounded-lg animate-pulse w-3/4 mx-auto mb-2" />
            <div className="h-4 bg-gray-800 rounded-lg animate-pulse w-1/2 mx-auto" />
        </motion.div>
    );
}

// شريط تحميل
export function ProgressBar() {
    return (
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="h-1 bg-red-500 rounded-full"
        />
    );
}

// دالة لعرض عناصر التحميل
export function LoadingSpinner({ text = 'جاري التحميل...' }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">{text}</p>
        </div>
    );
}
