// Core API utilities and exports
import { apiCache } from '../api-cache';

// API Base URL configuration
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
    ? ''  // Relative path - vercel.json handles routing
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');

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

            const customError: any = new Error(message);
            customError.status = response.status;
            throw customError;
        }

        // Cache if requested
        if (options.useCache) {
            apiCache.set(endpoint, data);
        }

        return data;
    } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Retry on network failure or timeout
        if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
            console.warn(`[API Retry] Retrying ${url}... Attempts left: ${retries}`);
            return fetchAPI(endpoint, options, retries - 1);
        }

        console.error(`[API Error] ${url}:`, error);
        throw error;
    }
}

// Export all API modules
export * from './auth';
export * from './cars';
export * from './parts';
