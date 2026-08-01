'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';

const ADMIN_ROLES = ['admin', 'super_admin', 'manager'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('hm_token');

        // لا توكن = توجيه فوري لصفحة الدخول
        if (!token) {
            router.replace('/login?role=admin');
            setChecking(false);
            return;
        }

        // [[FIX]] التحقق من الـ role المحلي أولاً - السرعة + منع تسجيل الخروج العشوائي
        const getUserRole = (): string | null => {
            try {
                const userObj = JSON.parse(localStorage.getItem('hm_user') || '{}');
                return userObj.role || localStorage.getItem('hm_user_role') || null;
            } catch {
                return localStorage.getItem('hm_user_role') || null;
            }
        };

        const cachedRole = getUserRole();

        if (cachedRole && ADMIN_ROLES.includes(cachedRole)) {
            // الدور موجود في الكاش ومصرّح — نفعّل مباشرة
            setAuthorized(true);
            setChecking(false);

            // تحقق صامت في الخلفية
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            fetch(`${apiBase}/api/v2/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar',
                },
                signal: AbortSignal.timeout(8000),
            })
                .then(r => {
                    // ⚠️ فقط 401 صريح يطرد الأدمن - أي خطأ آخر يُبقيه
                    if (r.status === 401) {
                        localStorage.removeItem('hm_token');
                        localStorage.removeItem('hm_user');
                        localStorage.removeItem('hm_user_role');
                        router.replace('/login?role=admin&reason=expired');
                        return null;
                    }
                    return r.ok ? r.json() : null;
                })
                .then(data => {
                    if (data?.user?.role && ADMIN_ROLES.includes(data.user.role)) {
                        localStorage.setItem('hm_user', JSON.stringify(data.user));
                        localStorage.setItem('hm_user_role', data.user.role);
                        // تحديث الكوكيز
                        const maxAge = 60 * 60 * 24 * 365;
                        document.cookie = `hm_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                        document.cookie = `hm_user_role=${data.user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;
                    }
                })
                .catch(() => { /* صامت — نحافظ على جلسة الأدمن */ });

        } else if (token) {
            // توكن موجود لكن بدون role محلي → نتحقق من السيرفر
            const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
            fetch(`${apiBase}/api/v2/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar',
                },
                signal: AbortSignal.timeout(10000),
            })
                .then(r => {
                    if (r.status === 401) return null;
                    return r.ok ? r.json() : null;
                })
                .then(data => {
                    const userRole = data?.user?.role || data?.data?.user?.role;
                    if (userRole && ADMIN_ROLES.includes(userRole)) {
                        const userData = data.user || data.data?.user;
                        localStorage.setItem('hm_user', JSON.stringify(userData));
                        localStorage.setItem('hm_user_role', userRole);
                        setAuthorized(true);
                    } else if (token) {
                        // التوكن موجود لكن لم نتحقق من السيرفر - نسمح بالدخول مؤقتاً
                        setAuthorized(true);
                    } else {
                        router.replace('/login?role=admin');
                    }
                })
                .catch(() => {
                    // خطأ في الشبكة - التوكن موجود ونسمح بالدخول
                    if (token) setAuthorized(true);
                    else router.replace('/login?role=admin');
                })
                .finally(() => setChecking(false));
        } else {
            router.replace('/login?role=admin');
            setChecking(false);
        }
    }, [router]);

    // شاشة التحميل أثناء التحقق من الصلاحيات
    if (checking) {
        return (
            <div className="min-h-screen bg-[#070711] flex items-center justify-center">
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-orange-500/60 text-xs font-bold uppercase tracking-widest">
                        {isRTL ? 'جاري التحقق من الصلاحيات...' : 'Verifying access...'}
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="relative min-h-screen text-white bg-[#070711]" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* شبكة الخلفية */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] bg-[linear-gradient(rgba(249,115,22,1)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,1)_1px,transparent_1px)] bg-[size:60px_60px]" />

            {/* تأثير التعتيم */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,7,17,0.85)_100%)]" />

            {/* شريط التنقل الجانبي */}
            <Suspense fallback={null}>
                <AdminNavbar />
            </Suspense>

            {/* محتوى الصفحة */}
            <div className="relative z-10 pt-[64px] lg:pt-0 lg:ps-[260px] transition-all duration-300 overflow-hidden">
                <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-orange-500/40 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                }>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
