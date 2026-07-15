/** @type {import('next').NextConfig} */
const nextConfig = {
  // Multi-Tenant Configuration
  // Supports HM CAR and CAR X tenants with dynamic domain detection

  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'hmcar-system-two.vercel.app' },
      { protocol: 'https', hostname: 'carx-system-five.vercel.app' },
      { protocol: 'https', hostname: 'www.carx-system-five.vercel.app' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'hmcar.vercel.app' },
      { protocol: 'https', hostname: 'www.hmcar.vercel.app' },
      { protocol: 'https', hostname: 'hmcar.xyz' },
      { protocol: 'https', hostname: 'www.hmcar.xyz' },
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
    SYSTEM_DOMAIN: process.env.VERCEL_URL || 'hmcar-system-two.vercel.app',
    SYSTEM_VERSION: '2.0.0',
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