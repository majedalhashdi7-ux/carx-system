#!/usr/bin/env node

/**
 * إصلاح المشاكل الحرجة في النظام
 * Critical Issues Fix Script
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 بدء إصلاح المشاكل الحرجة...');

// 1. إصلاح CAR X .env.local - إزالة كلمة السر المكشوفة
function fixCarXEnv() {
    console.log('🔴 إصلاح CAR X .env.local...');
    
    const envPath = 'carx-system/.env.local';
    const envContent = `# CAR X System - Local Development Environment

# Database - استخدم قاعدة بيانات CAR X الحقيقية
MONGO_URI=mongodb+srv://carx_user:SECURE_PASSWORD@cluster.mongodb.net/carx_production?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=carx-ultra-secure-key-2024-production
NEXTAUTH_URL=https://daood.okigo.net

# Contact Information
WHATSAPP_NUMBER=+967781007805
ADMIN_EMAIL=dawoodalhash@gmail.com

# Currency Exchange Rates
USD_TO_SAR=3.75
USD_TO_KRW=1300

# Development Mode
NODE_ENV=production
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ تم إصلاح CAR X .env.local');
}

// 2. إصلاح tenants.json - إزالة البيانات الوهمية
function fixTenantsConfig() {
    console.log('🟡 إصلاح tenants.json...');
    
    const tenantsConfig = {
        "defaultTenant": "hmcar",
        "tenants": {
            "hmcar": {
                "id": "hmcar",
                "name": "HM CAR",
                "nameEn": "HM CAR",
                "description": "منصة مزادات ومبيعات السيارات الفاخرة",
                "descriptionEn": "Premium Car Auction & Sales Platform",
                "domains": ["localhost:4002", "localhost:3000", "hmcar.vercel.app", "hmcar.xyz", "www.hmcar.xyz", "hmcar-system.vercel.app", "daood.okigo.net"],
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
                "domains": ["localhost:3001", "carx.localhost", "carx-motors.com", "www.carx-motors.com", "carx-system.vercel.app"],
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
    console.log('✅ تم إصلاح tenants.json - إزالة المعارض الوهمية');
}

// 3. إصلاح next.config.js - جعله ديناميكي
function fixNextConfig() {
    console.log('🟡 إصلاح next.config.js...');
    
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dynamic Multi-Tenant Configuration
  
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
        hostname: 'hmcar.vercel.app',
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

  // Dynamic Environment Variables - يتم تحديدها حسب المعرض
  env: {
    SYSTEM_NAME: process.env.TENANT_NAME || 'Multi-Tenant System',
    SYSTEM_DOMAIN: process.env.VERCEL_URL || 'localhost:3000',
    SYSTEM_VERSION: '2.0.0',
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

module.exports = nextConfig;`;

    fs.writeFileSync('carx-system/next.config.js', nextConfigContent);
    console.log('✅ تم إصلاح next.config.js - أصبح ديناميكي');
}

// 4. إنشاء .env.production آمن
function createSecureEnvProduction() {
    console.log('🔐 إنشاء .env.production آمن...');
    
    const envProductionContent = `# CAR X System - Production Environment
# ⚠️ هذا الملف للإنتاج - لا تضع كلمات سر هنا!

# Database - يجب تعيينها في Vercel Environment Variables
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
# MONGO_URI_CARX=mongodb+srv://carx_user:password@cluster.mongodb.net/carx_production

# Authentication - يجب تعيينها في Vercel Environment Variables
# NEXTAUTH_SECRET=your-super-secure-secret-key
# NEXTAUTH_URL=https://your-domain.com

# Contact Information
WHATSAPP_NUMBER=+967781007805
ADMIN_EMAIL=dawoodalhash@gmail.com

# Currency Exchange Rates
USD_TO_SAR=3.75
USD_TO_KRW=1300

# Production Mode
NODE_ENV=production
`;

    fs.writeFileSync('carx-system/.env.production', envProductionContent);
    console.log('✅ تم إنشاء .env.production آمن');
}

// 5. إنشاء دليل Vercel Environment Variables
function createVercelEnvGuide() {
    console.log('📋 إنشاء دليل متغيرات Vercel...');
    
    const guideContent = `# 🔐 دليل متغيرات البيئة في Vercel

## المتغيرات المطلوبة في Vercel Dashboard

### 1. قاعدة البيانات
\`\`\`
MONGO_URI=mongodb+srv://hmcar_user:SECURE_PASSWORD@cluster.mongodb.net/hmcar_production
MONGO_URI_CARX=mongodb+srv://carx_user:SECURE_PASSWORD@cluster.mongodb.net/carx_production
\`\`\`

### 2. المصادقة
\`\`\`
NEXTAUTH_SECRET=your-ultra-secure-secret-key-here
NEXTAUTH_URL=https://your-domain.com
\`\`\`

### 3. كلمة سر الإدارة
\`\`\`
ADMIN_PASSWORD=your-secure-admin-password
\`\`\`

## كيفية إضافة المتغيرات في Vercel:

1. اذهب إلى Vercel Dashboard
2. اختر المشروع
3. Settings → Environment Variables
4. أضف كل متغير بشكل منفصل
5. اختر Environment: Production, Preview, Development

## ⚠️ تحذير أمني:
- لا تضع كلمات السر في ملفات .env المرفوعة على GitHub
- استخدم كلمات سر قوية ومعقدة
- غيّر كلمات السر بانتظام
`;

    fs.writeFileSync('VERCEL_ENV_VARIABLES_GUIDE.md', guideContent);
    console.log('✅ تم إنشاء دليل متغيرات Vercel');
}

// تشغيل جميع الإصلاحات
async function runAllFixes() {
    try {
        fixCarXEnv();
        fixTenantsConfig();
        fixNextConfig();
        createSecureEnvProduction();
        createVercelEnvGuide();
        
        console.log('\n🎉 تم إصلاح جميع المشاكل الحرجة بنجاح!');
        console.log('\n📋 الخطوات التالية:');
        console.log('1. ✅ تم إصلاح CAR X .env.local');
        console.log('2. ✅ تم إزالة المعارض الوهمية من tenants.json');
        console.log('3. ✅ تم جعل next.config.js ديناميكي');
        console.log('4. ✅ تم إنشاء .env.production آمن');
        console.log('5. ✅ تم إنشاء دليل متغيرات Vercel');
        console.log('\n🔐 يجب الآن:');
        console.log('- إضافة متغيرات البيئة الحساسة في Vercel Dashboard');
        console.log('- ربط قواعد البيانات الحقيقية');
        console.log('- تحديث كلمات السر');
        
    } catch (error) {
        console.error('❌ خطأ في الإصلاح:', error.message);
    }
}

// تشغيل السكريبت
if (require.main === module) {
    runAllFixes();
}

module.exports = { runAllFixes };