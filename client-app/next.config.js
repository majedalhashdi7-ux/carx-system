/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-Tenant Configuration
  // Supports HM CAR and CAR X tenants with dynamic domain detection

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' }
    ],
    unoptimized: true,
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
    // Only rewrite in local development when backend is running on port 4001
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4001/api/:path*',
      },
    ];
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  trailingSlash: false,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;