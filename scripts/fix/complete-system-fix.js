#!/usr/bin/env node

/**
 * إصلاح شامل ونهائي للنظام
 * Complete System Fix Script
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 بدء الإصلاح الشامل للنظام...\n');

// 1. إصلاح قواعد البيانات والبيئة
function fixDatabaseAndEnv() {
    console.log('🔧 إصلاح قواعد البيانات والبيئة...');
    
    // إصلاح .env الرئيسي
    const mainEnvContent = `# Multi-Tenant Car Auction System
# Production Environment Variables

# Database Configuration
MONGO_URI=mongodb+srv://hmcar_production:SECURE_PASSWORD_HERE@cluster.mongodb.net/hmcar_production?retryWrites=true&w=majority
MONGO_URI_CARX=mongodb+srv://carx_production:SECURE_PASSWORD_HERE@cluster.mongodb.net/carx_production?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=ultra-secure-nextauth-secret-key-2024-production
NEXTAUTH_URL=https://daood.okigo.net

# Admin Configuration
ADMIN_EMAIL=dawoodalhash@gmail.com
WHATSAPP_NUMBER=+967781007805

# Currency Exchange
USD_TO_SAR=3.75
USD_TO_KRW=1300

# System Configuration
NODE_ENV=production
SYSTEM_VERSION=2.0.0
`;

    fs.writeFileSync('.env', mainEnvContent);
    console.log('✅ تم إصلاح .env الرئيسي');
}
// 2. إصلاح client-app .env.local
function fixClientAppEnv() {
    console.log('🔧 إصلاح client-app .env.local...');
    
    const clientEnvContent = `# HM CAR Client App - Local Development
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=HM CAR
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# Database
MONGO_URI=mongodb+srv://hmcar_production:SECURE_PASSWORD@cluster.mongodb.net/hmcar_production?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=hmcar-secure-secret-2024
NEXTAUTH_URL=https://daood.okigo.net

# Development
NODE_ENV=production
`;

    fs.writeFileSync('client-app/.env.local', clientEnvContent);
    console.log('✅ تم إصلاح client-app .env.local');
}

// 3. إصلاح carx-system .env.local
function fixCarXEnv() {
    console.log('🔧 إصلاح carx-system .env.local...');
    
    const carxEnvContent = `# CAR X System - Production Environment
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=CAR X
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# Database
MONGO_URI=mongodb+srv://carx_production:SECURE_PASSWORD@cluster.mongodb.net/carx_production?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=carx-ultra-secure-secret-2024
NEXTAUTH_URL=https://daood.okigo.net

# Admin
ADMIN_EMAIL=dawoodalhash@gmail.com

# Currency
USD_TO_SAR=3.75
USD_TO_KRW=1300

# Production
NODE_ENV=production
`;

    fs.writeFileSync('carx-system/.env.local', carxEnvContent);
    console.log('✅ تم إصلاح carx-system .env.local');
}
// 4. إصلاح tenants.json نهائياً
function fixTenantsConfig() {
    console.log('🔧 إصلاح tenants.json نهائياً...');
    
    const tenantsConfig = {
        "defaultTenant": "hmcar",
        "tenants": {
            "hmcar": {
                "id": "hmcar",
                "name": "HM CAR",
                "nameEn": "HM CAR",
                "description": "منصة مزادات ومبيعات السيارات الفاخرة",
                "descriptionEn": "Premium Car Auction & Sales Platform",
                "domains": [
                    "localhost:3000", 
                    "localhost:4002",
                    "hmcar.vercel.app", 
                    "hmcar.xyz", 
                    "www.hmcar.xyz",
                    "daood.okigo.net"
                ],
                "mongoUri": "ENV:MONGO_URI",
                "logo": "/uploads/tenants/hmcar/logo.png",
                "favicon": "/uploads/tenants/hmcar/favicon.ico",
                "theme": {
                    "primaryColor": "#D4AF37",
                    "secondaryColor": "#1a1a2e",
                    "accentColor": "#e94560",
                    "backgroundColor": "#0f0f23",
                    "textColor": "#ffffff"
                },
                "contact": {
                    "whatsapp": "+967781007805",
                    "email": "info@hmcar.com",
                    "phone": "+967781007805"
                },
                "settings": {
                    "currency": "SAR",
                    "language": "ar",
                    "direction": "rtl"
                },
                "enabled": true
            },
            "carx": {
                "id": "carx",
                "name": "CAR X",
                "nameEn": "CAR X",
                "description": "معرض وأمزاد CAR X",
                "descriptionEn": "CAR X Showroom & Auctions",
                "domains": [
                    "localhost:3001", 
                    "carx.localhost",
                    "carx-system.vercel.app"
                ],
                "mongoUri": "ENV:MONGO_URI_CARX",
                "logo": "/uploads/tenants/carx/logo.png",
                "favicon": "/uploads/tenants/carx/favicon.ico",
                "theme": {
                    "primaryColor": "#000000",
                    "secondaryColor": "#ff0000",
                    "accentColor": "#cc0000",
                    "backgroundColor": "#111111",
                    "textColor": "#ffffff"
                },
                "contact": {
                    "whatsapp": "+967781007805",
                    "email": "info@carx-motors.com",
                    "phone": "+967781007805"
                },
                "settings": {
                    "currency": "SAR",
                    "language": "ar",
                    "direction": "rtl"
                },
                "enabled": true
            }
        }
    };

    fs.writeFileSync('tenants/tenants.json', JSON.stringify(tenantsConfig, null, 2));
    console.log('✅ تم إصلاح tenants.json نهائياً');
}
// 5. إصلاح client-app next.config.js
function fixClientNextConfig() {
    console.log('🔧 إصلاح client-app next.config.js...');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;`;

    fs.writeFileSync('client-app/next.config.js', nextConfigContent);
    console.log('✅ تم إصلاح client-app next.config.js');
}
// 6. إصلاح carx-system next.config.js
function fixCarXNextConfig() {
    console.log('🔧 إصلاح carx-system next.config.js...');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // CAR X System Configuration
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: 'daood.okigo.net' },
      { protocol: 'https', hostname: 'carx-system.vercel.app' },
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
    SYSTEM_NAME: 'CAR X',
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

module.exports = nextConfig;`;

    fs.writeFileSync('carx-system/next.config.js', nextConfigContent);
    console.log('✅ تم إصلاح carx-system next.config.js');
}
// 7. إنشاء ملفات الإنتاج الآمنة
function createProductionFiles() {
    console.log('🔧 إنشاء ملفات الإنتاج الآمنة...');
    
    // client-app .env.production
    const clientProdEnv = `# HM CAR Production Environment
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=HM CAR
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805
NODE_ENV=production
`;
    fs.writeFileSync('client-app/.env.production', clientProdEnv);
    
    // carx-system .env.production
    const carxProdEnv = `# CAR X Production Environment
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=CAR X
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805
NODE_ENV=production
`;
    fs.writeFileSync('carx-system/.env.production', carxProdEnv);
    
    console.log('✅ تم إنشاء ملفات الإنتاج الآمنة');
}

// 8. تشغيل جميع الإصلاحات
async function runCompleteSystemFix() {
    try {
        fixDatabaseAndEnv();
        fixClientAppEnv();
        fixCarXEnv();
        fixTenantsConfig();
        fixClientNextConfig();
        fixCarXNextConfig();
        createProductionFiles();
        
        console.log('\n🎉 تم إصلاح النظام بالكامل بنجاح!');
        console.log('\n📋 ملخص الإصلاحات:');
        console.log('✅ إصلاح .env الرئيسي');
        console.log('✅ إصلاح client-app .env.local');
        console.log('✅ إصلاح carx-system .env.local');
        console.log('✅ إصلاح tenants.json نهائياً');
        console.log('✅ إصلاح client-app next.config.js');
        console.log('✅ إصلاح carx-system next.config.js');
        console.log('✅ إنشاء ملفات الإنتاج الآمنة');
        
    } catch (error) {
        console.error('❌ خطأ في الإصلاح:', error.message);
    }
}

// تشغيل السكريبت
if (require.main === module) {
    runCompleteSystemFix();
}

module.exports = { runCompleteSystemFix };