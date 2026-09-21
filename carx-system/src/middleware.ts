import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * @file middleware.ts — CarX System
 * @description حماية مسارات الإدارة والعميل بتوكن carx_token
 * يضيف Security Headers لكل الاستجابات
 */

// المسارات التي تتطلب تسجيل دخول بصلاحيات إدارية
const ADMIN_PATHS = ['/admin'];
// مسارات العميل المحمية
const CLIENT_PATHS = ['/profile', '/my-orders'];
// مسارات التوثيق — يُعاد توجيه المستخدم المسجل منها
const AUTH_ROUTES = ['/login', '/register'];

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // تجاهل الملفات الثابتة والـ API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // تحقق من التوكن في الـ cookies أولاً ثم الـ header
  const tokenFromCookie = request.cookies.get('carx_token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = tokenFromCookie || tokenFromHeader;
  const isAuthenticated = !!token;

  // ── 1. منع المستخدم المسجل من الدخول لصفحات التوثيق ──
  if (AUTH_ROUTES.some(r => pathname === r) && isAuthenticated) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)));
  }

  // ── 2. حماية مسارات /admin ──
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // ── 3. حماية مسارات العميل (/profile, /my-orders) ──
  if (CLIENT_PATHS.some(p => pathname.startsWith(p))) {
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
    '/profile/:path*',
    '/my-orders/:path*',
    '/login',
    '/register',
  ],
};
