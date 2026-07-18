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
            const res = await api.auth.verify() as any;
            if (res && res.success && res.user) {
                // تحديث بيانات المستخدم بأحدث نسخة من الخادم
                const freshUser = res.user;
                setUser(freshUser);
                localStorage.setItem('hm_user', JSON.stringify(freshUser));
                localStorage.setItem('hm_user_role', freshUser.role || 'buyer');
            } else if (res && res._id) {
                // بعض الـ APIs ترجع المستخدم مباشرة
                setUser(res);
                localStorage.setItem('hm_user', JSON.stringify(res));
                localStorage.setItem('hm_user_role', res.role || 'buyer');
            } else {
                // التوكن غير صالح - امسح كل شيء
                clearAuth();
            }
        } catch {
            // في حال فشل الاتصال بالخادم، احتفظ بالبيانات المحلية
            // ولا تقم بتسجيل الخروج التلقائي (قد يكون الخادم معطلاً مؤقتاً)
            console.warn('[Auth] Server verification failed - keeping local session');
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

            if (token && userStr) {
                try {
                    const userData = JSON.parse(userStr);
                    if (userData && userData.role) {
                        // تعيين البيانات المحلية فوراً للسرعة
                        setUser(userData);
                        // ثم التحقق من الخادم في الخلفية
                        verifyTokenWithServer();
                    } else {
                        clearAuth();
                        setIsLoading(false);
                    }
                } catch {
                    clearAuth();
                    setIsLoading(false);
                }
            } else {
                clearCookies();
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearAuth();
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
     * تسجيل الخروج
     */
    function logout() {
        clearAuth();
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
            login,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}
