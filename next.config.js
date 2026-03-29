/** @type {import('next').NextConfig} */
const nextConfig = {
  // CAR X System Configuration
  experimental: {
    appDir: true,
  },
  
  // Image Configuration
  images: {
    domains: [
      'localhost',
      'daood.okigo.net',
      'carx-system.vercel.app',
      'images.unsplash.com',
      'ci.encar.com',
      'img.encar.com',
      'encar.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.encar.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'daood.okigo.net',
      }
    ],
    unoptimized: false,
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

  // Webpack Configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Custom webpack configuration for CAR X
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    };

    return config;
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
  
  // SWC Minify
  swcMinify: true,
};

module.exports = nextConfig;