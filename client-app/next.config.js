/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-Tenant Configuration
  // Supports HM CAR and CAR X tenants with dynamic domain detection

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' }
    ],
    // unoptimized: true → تمت الإزالة لتفعيل تحسين الصور التلقائي
    // عند تفعيل Cloudinary استخدم loader مخصص بدلاً من هذا
    unoptimized: process.env.NEXT_PUBLIC_IMAGES_UNOPTIMIZED === 'true',
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },

  env: {
    SYSTEM_NAME: 'HM CAR',
    SYSTEM_DOMAIN: process.env.VERCEL_URL || 'hmcar-system-two.vercel.app',
    SYSTEM_VERSION: '2.0.0',
  },

  async rewrites() {
    // ✅ إعادة التوجيه للـ backend فقط في بيئة التطوير المحلي
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4001/api/:path*',
        },
      ];
    }
    return [];
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  trailingSlash: false,
  reactStrictMode: true,
  typescript: {
    // ✅ تم تفعيل TypeScript errors — لا تنشر كود فيه أخطاء نوعية
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;