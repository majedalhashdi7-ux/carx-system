/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-Tenant Configuration
  // Supports HM CAR and CAR X tenants with dynamic domain detection

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache for remote images
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' }
    ],
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
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
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
    // ✅ في بيئة التطوير: إعادة توجيه للـ backend المحلي
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4001/api/:path*',
        },
      ];
    }
    // في الـ production: يتولى vercel.json التوجيه للـ vercel-server.js
    return [];
  },

  async redirects() {
    return [
      {
        source: '/gallery',
        destination: '/cars',
        permanent: false,
      },
      {
        source: '/showroom',
        destination: '/cars',
        permanent: false,
      },
      {
        source: '/showroom/:id',
        destination: '/cars/:id',
        permanent: false,
      },
      {
        source: '/social',
        destination: '/contact',
        permanent: false,
      },
      {
        source: '/cart',
        destination: '/cars',
        permanent: false,
      },
      {
        source: '/cart/share',
        destination: '/cars',
        permanent: false,
      },
      {
        source: '/compare',
        destination: '/comparisons',
        permanent: false,
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  productionBrowserSourceMaps: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  trailingSlash: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;