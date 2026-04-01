'use client';

/**
 * سياق الهوية والتوثيق (AuthContext)
 * المسؤول عن إدارة بيانات المستخدم المسجل، الصلاحيات، وعمليات تسجيل الخروج.
 */

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api-original';

/**
 * واجهة بيانات المستخدم
 */
interface User {
    _id: string; // معرف المستخدم الفريد
    name: string; // اسم المستخدم
    username?: string; // اسم الدخول (اختياري)
    email?: string; // البريد الإلكتروني (اختياري)
    role: string; // دور المستخدم (مدير، عميل، إلخ)
    phone?: string; // رقم الهاتف (اختياري)
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * خطاف مخصص لاستخدام سياق التوثيق في أي مكون
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null); // حاله المستخدم الحالي
    const [isLoading, setIsLoading] = useState(true); // حالة التحميل أثناء التحقق من الجلسة

    const isLoggedIn = !!user; // تحويل حالة المستخدم إلى قيمة منطقية (هل هو مسجل دخول؟)
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager'; // هل المستخدم لديه صلاحيات إدارية؟

    /**
     * مسح ملفات تعريف الارتباط (Cookies) الخاصة بالتوثيق
     */
    const clearCookies = useCallback(() => {
        if (typeof document !== 'undefined') {
            document.cookie = 'hm_token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'hm_user_role=; path=/; max-age=0; SameSite=Lax';
        }
    }, []);

    /**
     * مسح جميع بيانات التوثيق من التخزين المحلي والمتصفح
     */
    const clearAuth = useCallback(() => {
        localStorage.removeItem('hm_token');
        localStorage.removeItem('hm_user');
        localStorage.removeItem('hm_user_role');
        clearCookies();
        setUser(null);
    }, [clearCookies]);

    /**
     * التحقق من وجود جلسة دخول سابقة عند تحميل الموقع
     */
    const checkExistingLogin = useCallback(() => {
        setIsLoading(true);
        try {
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            const token = localStorage.getItem('hm_token');
            const userStr = localStorage.getItem('hm_user');

            if (token && userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    // التحقق من أن البيانات سليمة
                    if (userData && userData.role) {
                        setUser(userData);
                    } else {
                        // بيانات ناقصة - امسح كل شيء
                        clearAuth();
                    }
                } catch {
                    clearAuth();
                }
            } else {
                // لا يوجد token أو user - تأكد من مسح الـ cookies
                clearCookies();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearAuth();
        } finally {
            setIsLoading(false);
        }
    }, [clearAuth, clearCookies]);

    // [[ARABIC_COMMENT]] 1. التحقق من الجلسة مرة واحدة عند التحميل
    useEffect(() => {
        checkExistingLogin();
    }, [checkExistingLogin]);

    // [[ARABIC_COMMENT]] 2. إرسال إشارة نبض كل 5 دقائق لإبلاغ السيرفر أن المستخدم متصل
    useEffect(() => {
        let heartbeatInterval: NodeJS.Timeout;
        let initialTimeout: NodeJS.Timeout;

        if (user) {
            const sendHeartbeat = () => {
                api.users.heartbeat().catch(() => {}); // صامت - لا يعرض أخطاء
            };
            // تأخير 3 ثوانٍ قبل الإرسال الأول لإعطاء الصفحة وقت للتحميل
            initialTimeout = setTimeout(sendHeartbeat, 3000);
            heartbeatInterval = setInterval(sendHeartbeat, 5 * 60 * 1000); // 5 دقائق
        }

        return () => {
            if (initialTimeout) clearTimeout(initialTimeout);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [user]);

    function refreshUser() {
        checkExistingLogin();
    }

    /**
     * تسجيل الخروج
     */
    function logout() {
        clearAuth();
        // إعادة توجيه للصفحة الرئيسية بعد الخروج
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            isLoading,
            isAdmin,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}
