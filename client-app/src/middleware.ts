import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @file middleware.ts
 * @description حماية مسارات /admin و /client على مستوى الـ Server (Edge)
 * يتحقق من وجود hm_token في الكوكيز قبل السماح بالدخول
 */

const PROTECTED_ADMIN_PATHS = ['/admin'];
const PROTECTED_CLIENT_PATHS = ['/client'];
const PUBLIC_EXCEPTIONS = ['/admin/login'];

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

    // فحص حماية مسارات /admin
    const isAdminPath = PROTECTED_ADMIN_PATHS.some(p => pathname.startsWith(p));
    if (isAdminPath) {
        const token = request.cookies.get('hm_token')?.value;
        const userRole = request.cookies.get('hm_user_role')?.value;

        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('role', 'admin');
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        const ADMIN_ROLES = ['admin', 'super_admin', 'manager'];
        if (userRole && !ADMIN_ROLES.includes(userRole)) {
            return NextResponse.redirect(new URL('/client/dashboard', request.url));
        }

        return NextResponse.next();
    }

    // فحص حماية مسارات /client
    const isClientPath = PROTECTED_CLIENT_PATHS.some(p => pathname.startsWith(p));
    if (isClientPath) {
        const token = request.cookies.get('hm_token')?.value;
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/client/:path*',
    ],
};
