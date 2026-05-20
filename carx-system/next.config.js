/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // أُزيل ignoreBuildErrors لضمان اكتشاف الأخطاء في الإنتاج
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // يسمح بجميع المصادر الخارجية للصور
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
