// Core API utilities and exports
import { apiCache } from '../api-cache';
import { getTenantApiUrl } from '../tenant-config';

// API Base URL configuration
const API_BASE_URL = getTenantApiUrl();

export interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

/**
 * Core fetch function with caching, timeout, and retry support
 */
export async function fetchAPI(
    endpoint: string,
    options: RequestInit & { useCache?: boolean; timeout?: number } = {},
    retries = 2
) {
    // Check cache first
    if (options.useCache && (options.method === 'GET' || !options.method)) {
        const cached = apiCache.get(endpoint);
        if (cached) return cached;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;

    // Set default headers
    const defaultHeaders: Record<string, string> = isFormData
        ? { 'Accept': 'application/json' }
        : { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    // [[FIX]] إضافة X-Tenant-ID لتحديد المعرض الصحيح في الـ Backend
    defaultHeaders['X-Tenant-ID'] = process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar';

    // Add auth token if available
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('hm_token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    // Setup timeout
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
                message = 'لقد قمت بعدد كبير من المحاولات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.';
            }

            const customError = new Error(message) as Error & { status: number };
            customError.status = response.status;
            throw customError;
        }

        // Cache if requested
        if (options.useCache) {
            apiCache.set(endpoint, data);
        }

        return data;
    } catch (error: unknown) {
        clearTimeout(timeoutId);
        
        // Retry on network failure or timeout
        const err = error instanceof Error ? error : new Error(String(error));
        if (retries > 0 && (err.name === 'AbortError' || err.message.includes('fetch'))) {
            console.warn(`[API Retry] Retrying ${url}... Attempts left: ${retries}`);
            return fetchAPI(endpoint, options, retries - 1);
        }

        console.error(`[API Error] ${url}:`, err);
        throw err;
    }
}

// Export all API modules
export * from './auth';
export * from './cars';
export * from './parts';
