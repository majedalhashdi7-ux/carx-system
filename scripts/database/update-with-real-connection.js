#!/usr/bin/env node

/**
 * تحديث النظام بالـ Connection Strings الحقيقية الموجودة
 */

const fs = require('fs');

console.log('🚀 تحديث النظام بالبيانات الحقيقية الموجودة...\n');

// استخدام الـ Connection String الموجود من الملفات
const realConnectionString = 'mongodb+srv://car-auction:<db_password>@cluster0.1bqjdzp.mongodb.net/?appName=Cluster0';

// تحديث جميع ملفات البيئة
function updateAllEnvFiles() {
    console.log('🔧 تحديث ملفات البيئة...');
    
    // 1. تحديث .env الرئيسي
    const mainEnvContent = `# Multi-Tenant Car Auction System
# Production Environment Variables

# Database Configuration - استخدام الـ Connection String الحقيقي
MONGO_URI=${realConnectionString.replace('<db_password>', 'YOUR_PASSWORD_HERE')}
MONGO_URI_CARX=${realConnectionString.replace('<db_password>', 'YOUR_PASSWORD_HERE')}

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
    console.log('✅ تم تحديث .env الرئيسي');

    // 2. تحديث client-app/.env.local
    const clientEnvContent = `# HM CAR Client App - Production Ready
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=HM CAR
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# Database - Connection String حقيقي
MONGO_URI=${realConnectionString.replace('<db_password>', 'YOUR_PASSWORD_HERE')}

# Authentication
NEXTAUTH_SECRET=hmcar-secure-secret-2024-production
NEXTAUTH_URL=https://daood.okigo.net

# Production
NODE_ENV=production
`;

    fs.writeFileSync('client-app/.env.local', clientEnvContent);
    console.log('✅ تم تحديث client-app/.env.local');

    // 3. تحديث carx-system/.env.local
    const carxEnvContent = `# CAR X System - Production Ready
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=CAR X
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# Database - Connection String حقيقي
MONGO_URI=${realConnectionString.replace('<db_password>', 'YOUR_PASSWORD_HERE')}

# Authentication
NEXTAUTH_SECRET=carx-ultra-secure-secret-2024-production
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
    console.log('✅ تم تحديث carx-system/.env.local');
}

// إنشاء دليل Vercel Environment Variables
function createVercelGuide() {
    console.log('📋 إنشاء دليل Vercel Environment Variables...');
    
    const vercelGuide = `# 🔐 متغيرات البيئة المطلوبة في Vercel

## 🎯 للنشر الفوري - استخدم هذه القيم:

### HM CAR Project:
\`\`\`
MONGO_URI=${realConnectionString.replace('<db_password>', 'YOUR_ACTUAL_PASSWORD')}
NEXTAUTH_SECRET=hmcar-ultra-secure-secret-2024-production
NEXTAUTH_URL=https://daood.okigo.net
ADMIN_EMAIL=dawoodalhash@gmail.com
WHATSAPP_NUMBER=+967781007805
USD_TO_SAR=3.75
USD_TO_KRW=1300
NODE_ENV=production
\`\`\`

### CAR X Project:
\`\`\`
MONGO_URI=${realConnectionString.replace('<db_password>', 'YOUR_ACTUAL_PASSWORD')}
NEXTAUTH_SECRET=carx-ultra-secure-secret-2024-production
NEXTAUTH_URL=https://daood.okigo.net
ADMIN_EMAIL=dawoodalhash@gmail.com
WHATSAPP_NUMBER=+967781007805
USD_TO_SAR=3.75
USD_TO_KRW=1300
NODE_ENV=production
\`\`\`

## 🔥 خطوات النشر السريع:

### 1. نشر HM CAR:
\`\`\`bash
cd client-app
vercel --prod
\`\`\`

### 2. نشر CAR X:
\`\`\`bash
cd carx-system
vercel --prod
\`\`\`

## ⚠️ مهم:
- استبدل \`YOUR_ACTUAL_PASSWORD\` بكلمة السر الحقيقية لقاعدة البيانات
- Connection String الأساسي: ${realConnectionString}
- فقط غيّر \`<db_password>\` بكلمة السر الحقيقية

## 🎉 النتيجة:
- HM CAR: https://your-hmcar-domain.vercel.app
- CAR X: https://your-carx-domain.vercel.app
`;

    fs.writeFileSync('VERCEL_ENV_VARIABLES_READY.md', vercelGuide);
    console.log('✅ تم إنشاء دليل Vercel Environment Variables');
}

// تشغيل التحديث
function runUpdate() {
    try {
        updateAllEnvFiles();
        createVercelGuide();
        
        console.log('\n🎉 تم تحديث النظام بالبيانات الحقيقية!');
        console.log('\n📋 ما تم:');
        console.log('✅ تحديث جميع ملفات .env بالـ Connection String الحقيقي');
        console.log('✅ إنشاء دليل Vercel Environment Variables');
        console.log('✅ النظام جاهز للنشر الفوري');
        
        console.log('\n🚀 الخطوات التالية:');
        console.log('1. استبدل YOUR_PASSWORD_HERE بكلمة السر الحقيقية');
        console.log('2. انشر على Vercel باستخدام الدليل المُنشأ');
        console.log('3. استمتع بالنظامين يعملان بالكامل!');
        
    } catch (error) {
        console.error('❌ خطأ في التحديث:', error.message);
    }
}

if (require.main === module) {
    runUpdate();
}

module.exports = { runUpdate };