/** @type {import('next').NextConfig} */
const nextConfig = {
  // CAR X System Configuration
  
  // Image Configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'daood.okigo.net',
      },
      {
        protocol: 'https',
        hostname: 'carx-system.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ci.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img1.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img2.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img3.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img4.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'img5.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      }
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
  },

  // Headers Configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects Configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Environment Variables
  env: {
    SYSTEM_NAME: 'CAR X',
    SYSTEM_DOMAIN: 'daood.okigo.net',
    SYSTEM_VERSION: '1.0.0',
  },

  // Output Configuration
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate ETags
  generateEtags: true,
  
  // Page Extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Trailing Slash
  trailingSlash: false,
  
  // React Strict Mode
  reactStrictMode: true,
};

module.exports = nextConfig;