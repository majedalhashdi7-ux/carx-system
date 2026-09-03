// [[ARABIC_HEADER]] هذا الملف (client-app/src/lib/api.ts) المسؤول عن جميع طلبات التواصل مع الخادم (API).
/**
 * نظام التواصل مع API
 * يحتوي على الدوال الأساسية لإرسال واستقبال البيانات من الخادم (Backend).
 */

// في الإنتاج على Vercel: استخدم مسار نسبي (vercel.json يوجه /api/* للباكند)
// في التطوير: استخدم NEXT_PUBLIC_API_URL أو localhost
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? ''  // مسار نسبي - vercel.json يتولى التوجيه
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

import { apiCache } from './api-cache';

/**
 * الدالة الأساسية لإرسال طلبات الـ API مع دعم المهلة الزمنية وإعادة المحاولة
 */
export async function fetchAPI(endpoint: string, options: RequestInit & { useCache?: boolean; timeout?: number } = {}, retries = 2) {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';

    // [[ARABIC_COMMENT]] 1. استرجاع فوري من الكاش لجميع طلبات GET (سرعة 0 مللي ثانية)
    if (isGet && options.useCache !== false && !endpoint.includes('nocache')) {
        const cached = apiCache.get(endpoint);
        if (cached) {
            // نرجع البيانات المخزنة فوراً ونطلق استعلام التحديث بالخلفية
            fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar',
                    ...(typeof window !== 'undefined' && localStorage.getItem('hm_token') ? { 'Authorization': `Bearer ${localStorage.getItem('hm_token')}` } : {})
                }
            })
            .then(r => r.json())
            .then(freshData => {
                if (freshData && (freshData.success || Array.isArray(freshData))) {
                    apiCache.set(endpoint, freshData);
                }
            })
            .catch(() => {});

            return cached;
        }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    const defaultHeaders: Record<string, string> = isFormData
        ? { 'Accept': 'application/json' }
        : { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    defaultHeaders['X-Tenant-ID'] = process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar';

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('hm_token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const controller = new AbortController();
    const customTimeout = options.timeout || 60000;
    const timeoutId = setTimeout(() => controller.abort(), customTimeout);

    const defaultOptions: RequestInit = {
        ...options,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
            ...defaultHeaders,
            ...(options.headers as Record<string, string> || {}),
        },
    };

    try {
        const response = await fetch(url, defaultOptions);
        clearTimeout(timeoutId);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            let message = data.message || (typeof data.error === 'string' ? data.error : data.error?.message) || `فشل الطلب: ${response.status}`;
            
            if (response.status === 429) {
                message = 'تم تجاوز عدد المحاولات المسموح بها، يرجى الانتظار دقيقة والتحقق مرة أخرى.';
            }

            if (response.status >= 500 && retries > 0) {
                await new Promise(res => setTimeout(res, 800));
                return fetchAPI(endpoint, options, retries - 1);
            }

            const errorObj: any = new Error(message);
            errorObj.status = response.status;
            errorObj.data = data;
            throw errorObj;
        }

        // حفظ الاستجابة الناجحة لطلبات GET ومسح الكاش عند الإضافة أو التعديل
        if (isGet) {
            apiCache.set(endpoint, data);
        } else {
            apiCache.clear();
        }

        return data;
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        
        const err = error instanceof Error ? error : new Error(String(error));
        if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
            console.warn(`[API Retry] Retrying ${url}... Attempts left: ${retries}`);
            return fetchAPI(endpoint, options, retries - 1);
        }

        console.error(`[API Error] ${url}:`, err);
        throw err;
    }
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export const api = {
    auth: {
        login: (credentials: object) => fetchAPI('/api/v2/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        clientLogin: (credentials: object) => fetchAPI('/api/v2/auth/client-login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),
        clientRegister: (data: object) => fetchAPI('/api/v2/auth/client-register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        // التسجيل/الدخول التلقائي للعملاء
        autoLogin: (data: { name: string; password: string; deviceId?: string }) =>
            fetchAPI('/api/v2/auth/auto-login', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        sendOtp: (payload: { phone: string }) =>
            fetchAPI('/api/v2/auth/otp/send', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        verifyOtp: (payload: { phone: string; code: string }) =>
            fetchAPI('/api/v2/auth/otp/verify', {
                method: 'POST',
                body: JSON.stringify(payload),
            }),
        register: (data: object) => fetchAPI('/api/v2/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        verify: () => fetchAPI('/api/v2/auth/verify'),
        logout: () => fetchAPI('/api/v2/auth/logout', {
            method: 'POST',
        }),
        changePassword: (data: object) => fetchAPI('/api/v2/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    // --- خدمات التحليلات والإحصائيات (Analytics) ---
    analytics: {
        // الحصول على الملخص العام
        getSummary: (period?: 'all' | 'week' | 'month' | 'year') =>
            fetchAPI(`/api/v2/analytics${period ? `?period=${period}` : ''}`),
        // عرض أحدث العمليات والأنشطة
        getActivities: (limit = 10) => fetchAPI(`/api/v2/analytics/activities?limit=${limit}`),
        // الإحصائيات التفصيلية بالرسوم البيانية
        getDetailed: (period?: 'all' | 'week' | 'month' | 'year') =>
            fetchAPI(`/api/v2/analytics/detailed${period ? `?period=${period}` : ''}`),
    },
    users: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/users?${query}`);
        },
        heartbeat: () => fetchAPI('/api/v2/users/heartbeat', { method: 'POST', body: JSON.stringify({}) }),
        getProfile: () => fetchAPI('/api/v2/users/profile'),
        updateProfile: (data: object) => fetchAPI('/api/v2/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        create: (data: object) => fetchAPI('/api/v2/users', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: object) => fetchAPI(`/api/v2/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        updateRole: (id: string, role: string) => fetchAPI(`/api/v2/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),
        ban: (id: string, banned: boolean) => fetchAPI(`/api/v2/users/${id}/ban`, {
            method: 'PATCH',
            body: JSON.stringify({ banned }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/users/${id}`, { method: 'DELETE' }),
    },
    // --- خدمات إدارة السيارات والمعرض (Cars) ---
    cars: {
        // جلب قائمة السيارات المتوفرة
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/cars?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/cars/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/cars', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/cars/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id: string) => fetchAPI(`/api/v2/cars/${id}`, {
            method: 'DELETE'
        }),
        getStyles: () => fetchAPI('/api/v2/cars/makes'),
        // تحديد السيارة كمباعة وبأي سعر
        markSold: (id: string, soldPrice?: number) => fetchAPI(`/api/v2/cars/${id}/sold`, {
            method: 'PATCH',
            body: JSON.stringify({ soldPrice }),
        }),
    },
    auctions: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/auctions?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/auctions/${id}`),
        placeBid: (id: string, amount: number) => fetchAPI(`/api/v2/auctions/${id}/bid`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        }),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/auctions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/auctions/${id}`, {
            method: 'DELETE',
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/auctions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    },
    parts: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/parts?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/parts/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/parts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/parts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/parts/${id}`, {
            method: 'DELETE',
        }),
        scrape: (data?: { targetUrl?: string; maxBrands?: number; maxModelsPerBrand?: number }) => fetchAPI('/api/v2/parts/scrape/brands', {
            method: 'POST',
            body: JSON.stringify(data || {})
        }),
        toggleStock: (id: string) => fetchAPI(`/api/v2/parts/${id}/toggle-stock`, {
            method: 'PATCH'
        }),
    },
    dashboard: {
        getClientData: () => fetchAPI('/api/v2/dashboard/client'),
        getAdminData: () => fetchAPI('/api/v2/dashboard/admin'),
    },
    orders: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/orders?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/orders/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, status: string) => fetchAPI(`/api/v2/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/orders/${id}`, { method: 'DELETE' }),
    },
    // --- خدمات الفواتير (Invoices) ---
    invoices: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/invoices?${query}`);
        },
        getNextNumber: () => fetchAPI('/api/v2/invoices/next-number'),
        getById: (id: string) => fetchAPI(`/api/v2/invoices/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, status: string) => fetchAPI(`/api/v2/invoices/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/invoices/${id}`, { method: 'DELETE' }),
    },
    upload: {
        image: async (formData: FormData) => {
            if (typeof window !== 'undefined') {
                try {
                    // Import dynamically to avoid SSR issues
                    const imageCompression = (await import('browser-image-compression')).default;
                    const imageFile = formData.get('image') as File;
                    
                    if (imageFile && imageFile.type.startsWith('image/')) {
                        const options = {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1600,
                            useWebWorker: true,
                        };
                        
                        const compressedFile = await imageCompression(imageFile, options);

                        // Replace the old large file with the extremely optimized compressed version
                        formData.set('image', compressedFile, compressedFile.name);
                    }
                } catch (error) {
                    console.error('Image compression failed (Falling back to original upload):', error);
                }
            }
            
            return fetchAPI('/api/v2/upload', {
                method: 'POST',
                body: formData,
            });
        },
        multiple: (formData: FormData) => fetchAPI('/api/v2/upload/multiple', {
            method: 'POST',
            body: formData,
        }),
        base64: (image: string, name?: string) => fetchAPI('/api/v2/upload/base64', {
            method: 'POST',
            body: JSON.stringify({ image, name }),
        }),
        getStatus: () => fetchAPI('/api/v2/upload/status'),
    },

    brands: {
        list: (category?: 'cars' | 'parts', options?: { targetShowroom?: 'hm_local' | 'korean_import'; includeInactive?: boolean }) => {
            const params = new URLSearchParams();
            if (category) params.set('category', category);
            if (options?.targetShowroom) params.set('targetShowroom', options.targetShowroom);
            if (options?.includeInactive) params.set('includeInactive', 'true');
            const query = params.toString();
            return fetchAPI(`/api/v2/brands${query ? `?${query}` : ''}`);
        },
        create: (data: { name: string; logoUrl?: string; category: 'cars' | 'parts' | 'both' }) =>
            fetchAPI('/api/v2/brands', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        update: (id: string, data: Record<string, unknown>) =>
            fetchAPI(`/api/v2/brands/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            fetchAPI(`/api/v2/brands/${id}`, {
                method: 'DELETE',
            }),
    },
    favorites: {
        list: () => fetchAPI('/api/v2/favorites'),
        check: (carId: string) => fetchAPI(`/api/v2/favorites/check/${carId}`),
        add: (carId: string) => fetchAPI('/api/v2/favorites', {
            method: 'POST',
            body: JSON.stringify({ carId }),
        }),
        remove: (carId: string) => fetchAPI(`/api/v2/favorites/${carId}`, {
            method: 'DELETE',
        }),
        clear: () => fetchAPI('/api/v2/favorites', {
            method: 'DELETE',
        }),
    },
    bids: {
        myBids: () => fetchAPI('/api/v2/bids/my'),
        auctionBids: (auctionId: string, limit?: number) =>
            fetchAPI(`/api/v2/bids/auction/${auctionId}?limit=${limit || 20}`),
        place: (auctionId: string, amount: number) => fetchAPI('/api/v2/bids', {
            method: 'POST',
            body: JSON.stringify({ auctionId, amount }),
        }),
        highest: (auctionId: string) => fetchAPI(`/api/v2/bids/highest/${auctionId}`),
    },
    reviews: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/reviews?${query}`);
        },
        carReviews: (carId: string) => fetchAPI(`/api/v2/reviews/car/${carId}`),
        add: (carId: string, rating: number, comment?: string) => fetchAPI('/api/v2/reviews', {
            method: 'POST',
            body: JSON.stringify({ carId, rating, comment }),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/reviews/${id}`, {
            method: 'DELETE',
        }),
    },
    messages: {
        conversations: () => fetchAPI('/api/v2/messages/conversations'),
        conversation: (userId: string, page?: number) =>
            fetchAPI(`/api/v2/messages/conversation/${userId}?page=${page || 1}`),
        send: (receiverId: string, content: string) => fetchAPI('/api/v2/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content }),
        }),
        getSupportMessages: () => fetchAPI('/api/v2/messages/support'),
        sendSupportMessage: (content: string) => fetchAPI('/api/v2/messages/support', {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
        markRead: (messageId: string) => fetchAPI(`/api/v2/messages/${messageId}/read`, {
            method: 'PATCH',
        }),
        unreadCount: () => fetchAPI('/api/v2/messages/unread-count'),
    },
    comparisons: {
        get: () => fetchAPI('/api/v2/comparisons'),
        add: (carId: string) => fetchAPI('/api/v2/comparisons/add', {
            method: 'POST',
            body: JSON.stringify({ carId }),
        }),
        remove: (carId: string) => fetchAPI(`/api/v2/comparisons/remove/${carId}`, {
            method: 'DELETE',
        }),
        clear: () => fetchAPI('/api/v2/comparisons/clear', {
            method: 'DELETE',
        }),
        compare: (carIds: string[]) => fetchAPI('/api/v2/comparisons/compare', {
            method: 'POST',
            body: JSON.stringify({ carIds }),
        }),
    },
    contact: {
        send: (data: { name: string; email: string; phone?: string; subject?: string; message: string }) =>
            fetchAPI('/api/v2/contact', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/contact?${query}`);
        },
        updateStatus: (id: string, status: string) =>
            fetchAPI(`/api/v2/contact/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }),
        delete: (id: string) =>
            fetchAPI(`/api/v2/contact/${id}`, {
                method: 'DELETE',
            }),
    },
    liveAuctions: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/live-auctions?${query}`);
        },
        getById: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}`),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/live-auctions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/live-auctions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}`, {
            method: 'DELETE',
        }),
        start: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}/start`, {
            method: 'POST',
        }),
        end: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}/end`, {
            method: 'POST',
        }),
        importExternal: (id: string) => fetchAPI(`/api/v2/live-auctions/${id}/import-external`, {
            method: 'POST',
        }),
        removeCar: (id: string, index: number) => fetchAPI(`/api/v2/live-auctions/${id}/cars/${index}`, {
            method: 'DELETE',
        }),
    },
    liveAuctionRequests: {
        list: (params: Record<string, string | number | boolean> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/live-auction-requests?${query}`);
        },
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/live-auction-requests', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateStatus: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/live-auction-requests/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    },
    smartAlerts: {
        list: () => fetchAPI('/api/v2/smart-alerts'),
        stats: () => fetchAPI('/api/v2/smart-alerts/stats'),
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/smart-alerts', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: Record<string, unknown>) => fetchAPI(`/api/v2/smart-alerts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        toggle: (id: string) => fetchAPI(`/api/v2/smart-alerts/${id}/toggle`, {
            method: 'PATCH',
        }),
        delete: (id: string) => fetchAPI(`/api/v2/smart-alerts/${id}`, {
            method: 'DELETE',
        }),
    },
    settings: {
        // جلب الإعدادات العامة (بدون توثيق)
        getPublic: () => fetchAPI('/api/v2/settings/public'),
        // جلب كل الإعدادات (للأدمن)
        getAll: () => fetchAPI('/api/v2/settings'),
        // تحديث روابط التواصل الاجتماعي
        updateSocialLinks: (data: { socialLinks: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/social-links', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث معلومات الاتصال
        updateContactInfo: (data: { contactInfo: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/contact-info', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث معلومات الموقع
        updateSiteInfo: (data: { siteInfo: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/site-info', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث إعدادات العملة
        updateCurrencySettings: (data: { currencySettings: Record<string, unknown> }) =>
            fetchAPI('/api/v2/settings/currency-settings', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث ميزات "لماذا تختارنا"
        updateFeatures: (data: { features: Array<Record<string, string>> }) =>
            fetchAPI('/api/v2/settings/features', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // تحديث محتوى الصفحة الرئيسية
        updateHomeContent: (data: { homeContent: Record<string, string> }) =>
            fetchAPI('/api/v2/settings/home-content', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // ── جلب إعدادات الإعلانات (للأدمن) ──
        getAdvertising: () => fetchAPI('/api/v2/settings/advertising'),
        // ── تحديث إعدادات الإعلانات (للأدمن) ──
        updateAdvertising: (data: { advertisingSettings: Record<string, unknown> }) =>
            fetchAPI('/api/v2/settings/advertising', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        // ── إعدادات CAR X: جلب (للأدمن) ──
        getCarXSettings: () => fetchAPI('/api/v2/settings/carx'),
        // ── إعدادات CAR X: تحديث (للأدمن) ──
        updateCarXSettings: (data: { carxSettings: Record<string, unknown> }) =>
            fetchAPI('/api/v2/settings/carx', {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
    },
    // ── الطلبات الخاصة (Concierge) ──
    concierge: {
        // إرسال طلب جديد (سيارة أو قطع غيار)
        create: (data: Record<string, unknown>) => fetchAPI('/api/v2/concierge', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        // جلب جميع الطلبات (للأدمن)
        list: (params: Record<string, string | number> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/concierge?${query}`);
        },
        // إحصائيات الطلبات الخاصة
        stats: () => fetchAPI('/api/v2/concierge/stats'),
        // تحديث حالة طلب
        updateStatus: (id: string, status: string, data: Record<string, unknown> = {}) => fetchAPI(`/api/v2/concierge/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, ...data }),
        }),
        // حذف طلب
        delete: (id: string) => fetchAPI(`/api/v2/concierge/${id}`, { method: 'DELETE' }),
    },
    // ── المعرض الكوري (Encar) ──
    showroom: {
        // جلب سيارات المعرض (الصفحة رقم page)
        getCars: (page = 1) => fetchAPI(`/api/v2/showroom/cars?page=${page}`),
        // جلب إعدادات المعرض (للأدمن)
        getSettings: () => fetchAPI('/api/v2/showroom/settings'),
        // تحديث رابط Encar (للأدمن)
        updateSettings: (data: { encarUrl: string }) => fetchAPI('/api/v2/showroom/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        scrape: () => fetchAPI('/api/v2/showroom/scrape', {
            method: 'POST'
        }),
    },

    // ── الإشعارات (Notifications) ──
    notifications: {
        list: () => fetchAPI('/api/v2/notifications'),
        // تعيين كل الإشعارات كمقروءة (بدون id) أو إشعار واحد (بـ id)
        markRead: (id?: string) => id
            ? fetchAPI(`/api/v2/notifications/${id}/read`, { method: 'PATCH' })
            : fetchAPI('/api/v2/notifications/read', { method: 'POST' }),
        deleteNotification: (id: string) => fetchAPI(`/api/v2/notifications/${id}`, { method: 'DELETE' }),
        send: (data: { title: string; message: string; type: string; actionUrl?: string }) => fetchAPI('/api/v2/notifications/send', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        broadcast: (title: string, message: string, url?: string) => fetchAPI('/api/v2/notifications/broadcast', {
            method: 'POST',
            body: JSON.stringify({ title, message, url }),
        }),
        // [[ARABIC_COMMENT]] تسجيل اشتراك جديد لإشعارات PWA
        subscribePush: (subscription: PushSubscription, deviceInfo?: Record<string, unknown>) => fetchAPI('/api/v2/notifications/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({ subscription, deviceInfo }),
        }),
        // [[ARABIC_COMMENT]] إلغاء اشتراك إشعارات PWA
        unsubscribePush: (endpoint: string) => fetchAPI('/api/v2/notifications/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ endpoint }),
        }),
    },
    // ── الأمن والحماية (Security) ──
    security: {
        getDashboard: () => fetchAPI('/api/v2/security/dashboard'),
        getDevices: (params: Record<string, string | number> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/security/devices?${query}`);
        },
        getDeviceDetails: (id: string) => fetchAPI(`/api/v2/security/devices/${id}`),
        toggleBan: (id: string, data?: { reason?: string; duration?: string }) =>
            fetchAPI(`/api/v2/security/toggle-ban/${id}`, {
                method: 'POST',
                body: JSON.stringify(data || {}),
            }),
        toggleExempt: (id: string, data?: { reason?: string }) =>
            fetchAPI(`/api/v2/security/toggle-exempt/${id}`, {
                method: 'POST',
                body: JSON.stringify(data || {}),
            }),
        updateTrust: (id: string, action: 'boost' | 'reduce' | 'reset') =>
            fetchAPI(`/api/v2/security/trust/${id}`, {
                method: 'POST',
                body: JSON.stringify({ action }),
            }),
        addNote: (id: string, note: string) =>
            fetchAPI(`/api/v2/security/add-note/${id}`, {
                method: 'POST',
                body: JSON.stringify({ note }),
            }),
        getSessions: (params?: Record<string, string>) => {
            const query = params ? new URLSearchParams(params).toString() : '';
            return fetchAPI(`/api/v2/security/sessions?${query}`);
        },
        terminateSession: (id: string) =>
            fetchAPI(`/api/v2/security/sessions/${id}/terminate`, { method: 'POST' }),
        terminateAllSessions: (userId: string) =>
            fetchAPI(`/api/v2/security/sessions/terminate-all/${userId}`, { method: 'POST' }),
        getReport: () => fetchAPI('/api/v2/security/report'),
        cleanup: (daysOld?: number) =>
            fetchAPI('/api/v2/security/cleanup', {
                method: 'POST',
                body: JSON.stringify({ daysOld: daysOld || 90 }),
            }),
        bulkAction: (ids: string[], action: 'ban' | 'unban' | 'delete') =>
            fetchAPI('/api/v2/security/bulk-action', {
                method: 'POST',
                body: JSON.stringify({ ids, action }),
            }),
        deleteDevice: (id: string) => fetchAPI(`/api/v2/security/devices/${id}`, { method: 'DELETE' }),
    },
    // ── نظام الاستيراد الذكي المنفصل (Separated Import System) ──
    import: {
        // [[ARABIC_COMMENT]] استيراد منفصل لسيارات المعرض بعدد محدد
        showroom: (limit = 20, targetUrl = '') =>
            fetchAPI('/api/v2/import/showroom', {
                method: 'POST',
                body: JSON.stringify({ limit, targetUrl }),
                timeout: 60000,
            }),
        // [[ARABIC_COMMENT]] استيراد شامل لكافة أصناف قطع الغيار
        parts: (targetUrl = '') =>
            fetchAPI('/api/v2/import/parts', {
                method: 'POST',
                body: JSON.stringify({ targetUrl }),
                timeout: 60000,
            }),
        // [[ARABIC_COMMENT]] استيراد تلقائي للوكالات والقطع من autospare.com.eg بدون سعر
        autospare: () =>
            fetchAPI('/api/v2/import/autospare', {
                method: 'POST',
                body: JSON.stringify({ skipPrice: true, whatsappRequest: true, applyWatermark: true }),
                timeout: 120000,
            }),
        // [[ARABIC_COMMENT]] استيراد منفصل لسيارات المزاد المباشر بعدد محدد
        liveAuctions: (limit = 10, targetUrl = '') =>
            fetchAPI('/api/v2/import/live-auctions', {
                method: 'POST',
                body: JSON.stringify({ limit, targetUrl }),
                timeout: 60000,
            }),
        // [[ARABIC_COMMENT]] جلب سجلات وتاريخ جميع الدفعات المنفصلة
        getLogs: () => fetchAPI('/api/v2/import/logs'),
        // [[ARABIC_COMMENT]] معاينة بيانات سيارة أو قطعة غيار من رابط خارجي قبل الحفظ
        preview: (url: string, type: 'car' | 'part') =>
            fetchAPI('/api/v2/import/preview', {
                method: 'POST',
                body: JSON.stringify({ url, type }),
                timeout: 60000,
            }),
        // [[ARABIC_COMMENT]] حفظ البيانات المستوردة كمسودة في قاعدة البيانات
        save: (data: Record<string, unknown>, type: 'car' | 'part') =>
            fetchAPI('/api/v2/import/save', {
                method: 'POST',
                body: JSON.stringify({ data, type }),
                timeout: 30000,
            }),
        // [[ARABIC_COMMENT]] جلب تاريخ عمليات الاستيراد السابقة
        getHistory: (params: Record<string, string | number> = {}) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return fetchAPI(`/api/v2/import/history?${query}`);
        },
    },
};
