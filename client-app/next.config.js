/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-Tenant HM CAR Configuration
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'daood.okigo.net' },
      { protocol: 'https', hostname: 'hmcar.vercel.app' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ci.encar.com' },
      { protocol: 'https', hostname: 'img.encar.com' },
      { protocol: 'https', hostname: 'img1.encar.com' },
      { protocol: 'https', hostname: 'img2.encar.com' },
      { protocol: 'https', hostname: 'img3.encar.com' },
      { protocol: 'https', hostname: 'img4.encar.com' },
      { protocol: 'https', hostname: 'img5.encar.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'source.unsplash.com' }
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
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
    SYSTEM_DOMAIN: process.env.VERCEL_URL || 'daood.okigo.net',
    SYSTEM_VERSION: '2.0.0',
  },

  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  trailingSlash: false,
  reactStrictMode: true,
};

module.exports = nextConfig;