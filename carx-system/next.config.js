/** @type {import('next').NextConfig} */
const nextConfig = {
  // [[FIX]] ضبط متغيرات البيئة الافتراضية لـ carx-system في الإنتاج
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://hmcar-system-two.vercel.app/api/v2',
    NEXT_PUBLIC_TENANT_ID: 'carx',
    NEXT_PUBLIC_SYSTEM_NAME: 'CAR X',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://carx-system-five.vercel.app',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // السماح بجميع الصور الخارجية الآمنة
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // تجنب خطأ "Unable to find lambda for route"
  trailingSlash: false,
  poweredByHeader: false,
};

module.exports = nextConfig;
