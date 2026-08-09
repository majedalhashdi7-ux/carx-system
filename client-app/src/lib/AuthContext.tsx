'use client';

/**
 * سياق الهوية والتوثيق (AuthContext)
 * المسؤول عن إدارة بيانات المستخدم المسجل، الصلاحيات، وعمليات تسجيل الخروج.
 * يحفظ الجلسة بشكل دائم ويتحقق من صلاحية التوكن عند كل تحميل للصفحة.
 */

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api-original';

/**
 * واجهة بيانات المستخدم
 */
interface User {
    _id: string;
    name: string;
    username?: string;
    email?: string;
    role: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (token: string, userData: User) => void;
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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isLoggedIn = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager';

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
        if (typeof window !== 'undefined') {
            localStorage.removeItem('hm_token');
            localStorage.removeItem('hm_user');
            localStorage.removeItem('hm_user_role');
        }
        clearCookies();
        setUser(null);
    }, [clearCookies]);

    /**
     * تسجيل دخول جديد - يحفظ البيانات في localStorage والكوكيز
     */
    const login = useCallback((token: string, userData: User) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('hm_token', token);
            localStorage.setItem('hm_user', JSON.stringify(userData));
            const role = userData.role || 'buyer';
            localStorage.setItem('hm_user_role', role);

            // حفظ في Cookie للـ middleware - سنة كاملة للاستمرارية
            const maxAge = 60 * 60 * 24 * 365;
            document.cookie = `hm_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
            document.cookie = `hm_user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
        setUser(userData);
    }, []);

    /**
     * التحقق من صلاحية التوكن مع الخادم وتحديث بيانات المستخدم
     * يُستخدم عند تحميل الصفحة للتأكد من أن الجلسة لا تزال صالحة
     */
    const verifyTokenWithServer = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('hm_token') : null;
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            // استخدام fetch مباشرة للتحكم الكامل في الاستجابة
            const apiBase = (typeof window !== 'undefined' && (window as any).__NEXT_PUBLIC_API_URL__) ||
                process.env.NEXT_PUBLIC_API_URL || '';
            const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar';

            const response = await fetch(`${apiBase}/v2/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId,
                },
                signal: AbortSignal.timeout(8000), // 8 ثواني timeout
            });

            // ⚠️ فقط عند 401 صريح نطرد المستخدم - أي شيء آخر نحافظ على الجلسة
            if (response.status === 401) {
                console.warn('[Auth] Token expired (401) - clearing session');
                clearAuth();
                setIsLoading(false);
                return;
            }

            if (!response.ok) {
                // 500, 503, network error → احتفظ بالجلسة المحلية
                console.warn(`[Auth] Server returned ${response.status} - keeping local session`);
                setIsLoading(false);
                return;
            }

            const data = await response.json().catch(() => null);

            if (data?.success && data?.user) {
                const freshUser = data.user;
                setUser(freshUser);
                localStorage.setItem('hm_user', JSON.stringify(freshUser));
                localStorage.setItem('hm_user_role', freshUser.role || 'buyer');
                // تحديث الكوكيز للـ middleware
                const maxAge = 60 * 60 * 24 * 365;
                document.cookie = `hm_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                document.cookie = `hm_user_role=${freshUser.role || 'buyer'}; path=/; max-age=${maxAge}; SameSite=Lax`;
            } else if (data?._id) {
                setUser(data);
                localStorage.setItem('hm_user', JSON.stringify(data));
                localStorage.setItem('hm_user_role', data.role || 'buyer');
            }
            // أي استجابة أخرى → لا نمسح الجلسة، نحافظ عليها
        } catch (err: any) {
            // خطأ في الشبكة أو timeout → نحافظ على الجلسة المحلية تماماً
            console.warn('[Auth] Network error during verify - keeping local session:', err?.message || err);
        } finally {
            setIsLoading(false);
        }
    }, [clearAuth]);

    /**
     * التحقق من وجود جلسة دخول سابقة عند تحميل الموقع
     * يقرأ من localStorage فوراً للسرعة، ثم يتحقق من الخادم في الخلفية
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

            if (!token) {
                // لا توكن = لم يسجل دخول مطلقاً
                clearCookies();
                setIsLoading(false);
                return;
            }

            // التوكن موجود - نستعيد بيانات المستخدم من localStorage فوراً
            if (userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    if (userData && (userData.role || userData._id || userData.id)) {
                        // بيانات صالحة → نعيّنها فوراً ثم نتحقق في الخلفية
                        setUser(userData);
                        // تحديث الكوكيز للـ middleware
                        const maxAge = 60 * 60 * 24 * 365;
                        const role = userData.role || 'buyer';
                        document.cookie = `hm_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                        document.cookie = `hm_user_role=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
                        localStorage.setItem('hm_user_role', role);
                        // تحقق في الخلفية (لا يطرد المستخدم عند فشله)
                        verifyTokenWithServer();
                        return;
                    }
                } catch {
                    // JSON تالف - نتجاهله ونتحقق من السيرفر
                }
            }

            // التوكن موجود لكن بيانات المستخدم غير متوفرة → نتحقق من السيرفر
            verifyTokenWithServer();

        } catch (error) {
            console.error('Auth check failed:', error);
            setIsLoading(false);
        }
    }, [clearAuth, clearCookies, verifyTokenWithServer]);

    // التحقق من الجلسة مرة واحدة عند التحميل
    useEffect(() => {
        checkExistingLogin();
    }, [checkExistingLogin]);

    // إرسال إشارة نبض كل 5 دقائق لإبلاغ السيرفر أن المستخدم متصل
    useEffect(() => {
        let heartbeatInterval: NodeJS.Timeout;
        let initialTimeout: NodeJS.Timeout;

        if (user) {
            const sendHeartbeat = () => {
                api.users.heartbeat().catch(() => {});
            };
            initialTimeout = setTimeout(sendHeartbeat, 3000);
            heartbeatInterval = setInterval(sendHeartbeat, 5 * 60 * 1000);
        }

        return () => {
            if (initialTimeout) clearTimeout(initialTimeout);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
    }, [user]);

    // الاستماع لتغييرات localStorage من تابات أخرى
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'hm_token') {
                if (!e.newValue) {
                    setUser(null);
                } else if (e.newValue !== e.oldValue) {
                    checkExistingLogin();
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [checkExistingLogin]);

    function refreshUser() {
        checkExistingLogin();
    }

    /**
     * تسجيل الخروج - ذكي حسب نوع الحساب
     */
    function logout() {
        // نحفظ نوع الحساب قبل المسح لنوجّه بشكل صحيح
        const role = user?.role || (typeof window !== 'undefined' ? localStorage.getItem('hm_user_role') : null);
        const isAdminRole = role === 'admin' || role === 'super_admin' || role === 'manager';
        clearAuth();
        if (typeof window !== 'undefined') {
            window.location.href = isAdminRole ? '/login?role=admin' : '/login';
        }
    }


    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            isLoading,
            isAdmin,
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}
