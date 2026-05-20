import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// المسارات التي تتطلب تسجيل دخول
const PROTECTED_PATHS = ['/admin'];

// المسارات العامة (لا تحتاج توكن)
const PUBLIC_PATHS = ['/login', '/register', '/', '/showroom', '/parts', '/brands', '/about', '/contact', '/faq', '/terms', '/privacy', '/shipping'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // هل المسار محمي؟
  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  // تحقق من التوكن في الـ cookies أولاً ثم الـ header
  const tokenFromCookie = request.cookies.get('carx_token')?.value;
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    // لا يوجد توكن → أعد التوجيه لصفحة تسجيل الدخول
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // حفظ المسار المطلوب للعودة إليه
    return NextResponse.redirect(loginUrl);
  }

  // التوكن موجود → اسمح بالمرور
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
