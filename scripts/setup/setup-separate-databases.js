#!/usr/bin/env node

/**
 * إعداد قاعدتي بيانات منفصلتين تماماً
 */

const fs = require('fs');

console.log('🔧 إعداد قاعدتي بيانات منفصلتين...\n');

// Connection Strings منفصلة
const hmcarConnectionString = 'mongodb+srv://car-auction:jyT24fgC7TXfyKEt@cluster0.1bqjdzp.mongodb.net/hmcar_production?retryWrites=true&w=majority';
const carxConnectionString = 'mongodb+srv://car-auction:jyT24fgC7TXfyKEt@cluster0.1bqjdzp.mongodb.net/carx_production?retryWrites=true&w=majority';

// تحديث ملفات البيئة بقواعد بيانات منفصلة
function updateWithSeparateDatabases() {
    console.log('📝 تحديث ملفات البيئة بقواعد بيانات منفصلة...');
    
    // 1. تحديث .env الرئيسي
    const mainEnvContent = `# Multi-Tenant Car Auction System
# قاعدتا بيانات منفصلتان تماماً

# HM CAR Database - قاعدة بيانات HM CAR المنفصلة
MONGO_URI=${hmcarConnectionString}

# CAR X Database - قاعدة بيانات CAR X المنفصلة
MONGO_URI_CARX=${carxConnectionString}

# Authentication
NEXTAUTH_SECRET=ultra-secure-nextauth-secret-key-2024-production-final
NEXTAUTH_URL=https://daood.okigo.net

# Admin Configuration
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233
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

    // 2. تحديث client-app/.env.local (HM CAR فقط)
    const clientEnvContent = `# HM CAR Client App - قاعدة بيانات منفصلة
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=HM CAR
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# HM CAR Database - قاعدة بيانات HM CAR فقط
MONGO_URI=${hmcarConnectionString}

# Authentication
NEXTAUTH_SECRET=hmcar-secure-secret-2024-production-final
NEXTAUTH_URL=https://daood.okigo.net

# Admin
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233

# Production
NODE_ENV=production
`;

    fs.writeFileSync('client-app/.env.local', clientEnvContent);
    console.log('✅ تم تحديث client-app/.env.local (HM CAR)');

    // 3. تحديث carx-system/.env.local (CAR X فقط)
    const carxEnvContent = `# CAR X System - قاعدة بيانات منفصلة
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api
NEXT_PUBLIC_APP_NAME=CAR X
NEXT_PUBLIC_APP_URL=https://daood.okigo.net
NEXT_PUBLIC_WHATSAPP=+967781007805

# CAR X Database - قاعدة بيانات CAR X فقط
MONGO_URI=${carxConnectionString}

# Authentication
NEXTAUTH_SECRET=carx-ultra-secure-secret-2024-production-final
NEXTAUTH_URL=https://daood.okigo.net

# Admin
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233

# Currency
USD_TO_SAR=3.75
USD_TO_KRW=1300

# Production
NODE_ENV=production
`;

    fs.writeFileSync('carx-system/.env.local', carxEnvContent);
    console.log('✅ تم تحديث carx-system/.env.local (CAR X)');
}

// إنشاء دليل قواعد البيانات المنفصلة
function createSeparateDatabasesGuide() {
    console.log('📋 إنشاء دليل قواعد البيانات المنفصلة...');
    
    const guide = `# 🗄️ دليل قواعد البيانات المنفصلة

## ✅ قاعدتا بيانات منفصلتان تماماً

### 📊 HM CAR Database:
\`\`\`
Database Name: hmcar_production
Connection String: ${hmcarConnectionString}
User: car-auction
Password: jyT24fgC7TXfyKEt
\`\`\`

**المجموعات (Collections):**
- cars (سيارات HM CAR)
- parts (قطع غيار HM CAR)
- brands (وكالات HM CAR)
- users (مستخدمو HM CAR)
- auctions (مزادات HM CAR)
- orders (طلبات HM CAR)

---

### 📊 CAR X Database:
\`\`\`
Database Name: carx_production
Connection String: ${carxConnectionString}
User: car-auction
Password: jyT24fgC7TXfyKEt
\`\`\`

**المجموعات (Collections):**
- cars (سيارات CAR X)
- parts (قطع غيار CAR X)
- brands (وكالات CAR X)
- users (مستخدمو CAR X)
- orders (طلبات CAR X)

---

## 🔐 الفصل التام:

### ✅ ما تم:
- **قاعدتا بيانات منفصلتان**: hmcar_production و carx_production
- **بيانات منفصلة تماماً**: لا يوجد تداخل بين النظامين
- **مستخدمون منفصلون**: كل نظام له مستخدموه الخاصون
- **طلبات منفصلة**: كل نظام له طلباته الخاصة

### 🎯 الفائدة:
- **أمان أعلى**: فصل تام بين البيانات
- **أداء أفضل**: كل نظام مستقل
- **إدارة أسهل**: يمكن إدارة كل قاعدة بيانات بشكل منفصل
- **نسخ احتياطي منفصل**: لكل نظام نسخه الاحتياطية الخاصة

---

## 🚀 متغيرات البيئة للنشر:

### HM CAR (client-app):
\`\`\`
MONGO_URI=${hmcarConnectionString}
NEXTAUTH_SECRET=hmcar-secure-secret-2024-production-final
NEXTAUTH_URL=https://your-hmcar-domain.vercel.app
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233
WHATSAPP_NUMBER=+967781007805
USD_TO_SAR=3.75
USD_TO_KRW=1300
NODE_ENV=production
\`\`\`

### CAR X (carx-system):
\`\`\`
MONGO_URI=${carxConnectionString}
NEXTAUTH_SECRET=carx-ultra-secure-secret-2024-production-final
NEXTAUTH_URL=https://your-carx-domain.vercel.app
ADMIN_EMAIL=dawoodalhash@gmail.com
ADMIN_PASSWORD=daood@112233
WHATSAPP_NUMBER=+967781007805
USD_TO_SAR=3.75
USD_TO_KRW=1300
NODE_ENV=production
\`\`\`

---

## 📝 ملاحظات مهمة:

1. **كل نظام له قاعدة بيانات خاصة**
2. **لا يوجد تداخل في البيانات**
3. **يمكن نقل أي نظام لخادم منفصل بسهولة**
4. **كل نظام مستقل تماماً عن الآخر**

---

## 🎉 النتيجة:

**نظامان منفصلان تماماً بقاعدتي بيانات منفصلتين!**

- ✅ HM CAR → hmcar_production
- ✅ CAR X → carx_production
- ✅ فصل تام وأمان عالي
`;

    fs.writeFileSync('SEPARATE_DATABASES_GUIDE.md', guide);
    console.log('✅ تم إنشاء دليل قواعد البيانات المنفصلة');
}

// تشغيل الإعداد
function runSetup() {
    try {
        updateWithSeparateDatabases();
        createSeparateDatabasesGuide();
        
        console.log('\n🎉 تم إعداد قاعدتي بيانات منفصلتين بنجاح!');
        console.log('\n📊 قواعد البيانات:');
        console.log('✅ HM CAR: hmcar_production');
        console.log('✅ CAR X: carx_production');
        console.log('\n🔐 فصل تام بين النظامين!');
        
    } catch (error) {
        console.error('❌ خطأ في الإعداد:', error.message);
    }
}

if (require.main === module) {
    runSetup();
}

module.exports = { runSetup };