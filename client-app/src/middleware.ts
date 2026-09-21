import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @file middleware.ts
 * @description حماية مسارات /admin و /client على مستوى الـ Server (Edge)
 * يتحقق من وجود hm_token في الكوكيز قبل السماح بالدخول.
 * يضيف Security Headers لكل الاستجابات.
 * ملاحظة: هذا الملف يستبدل proxy.ts ويشمل كل وظائفه.
 */

const PROTECTED_ADMIN_PATHS = ['/admin'];
const PROTECTED_CLIENT_PATHS = ['/client', '/profile', '/orders', '/favorites', '/messages', '/notifications'];
const PUBLIC_EXCEPTIONS = ['/admin/login'];
// مسارات تسجيل الدخول — المستخدم المسجل يُعاد توجيهه منها
const AUTH_ROUTES = ['/login', '/register'];
const ADMIN_ROLES = ['admin', 'super_admin', 'manager'];

/**
 * يضيف Security Headers الأساسية لكل استجابة
 */
function withSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // تجاهل الملفات الثابتة والـ API
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') ||
        PUBLIC_EXCEPTIONS.includes(pathname)
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('hm_token')?.value;
    const userRole = request.cookies.get('hm_user_role')?.value;
    const isAuthenticated = !!token;

    // ── 1. منع المستخدم المسجل من الدخول لصفحات التوثيق ──
    if (AUTH_ROUTES.some(r => pathname === r) && isAuthenticated) {
        const dest = ADMIN_ROLES.includes(userRole || '')
            ? '/admin/dashboard'
            : '/client/dashboard';
        return withSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)));
    }

    // ── 2. حماية مسارات /admin ──
    const isAdminPath = PROTECTED_ADMIN_PATHS.some(p => pathname.startsWith(p));
    if (isAdminPath) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('role', 'admin');
            loginUrl.searchParams.set('redirect', pathname);
            return withSecurityHeaders(NextResponse.redirect(loginUrl));
        }

        // مستخدم عادي يحاول الوصول لـ admin
        if (userRole && !ADMIN_ROLES.includes(userRole)) {
            return withSecurityHeaders(NextResponse.redirect(new URL('/client/dashboard', request.url)));
        }

        return withSecurityHeaders(NextResponse.next());
    }

    // ── 3. حماية مسارات /client وغيرها ──
    const isClientPath = PROTECTED_CLIENT_PATHS.some(p => pathname.startsWith(p));
    if (isClientPath) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return withSecurityHeaders(NextResponse.redirect(loginUrl));
        }
    }

    return withSecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/client/:path*',
        '/profile/:path*',
        '/orders/:path*',
        '/favorites/:path*',
        '/messages/:path*',
        '/notifications/:path*',
        '/login',
        '/register',
    ],
};

