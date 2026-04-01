#!/usr/bin/env node
/**
 * validate-config.js
 * يتحقق من صحة إعدادات المشروع قبل النشر
 */

require('dotenv').config();

const errors = [];
const warnings = [];

console.log('🔍 جاري التحقق من إعدادات المشروع...\n');

// ─────────────────────────────────────────────
// 1. التحقق من المتغيرات المطلوبة
// ─────────────────────────────────────────────
const requiredVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'BASE_URL',
];

const optionalVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS',
    'REDIS_URL',
];

console.log('📋 المتغيرات المطلوبة:');
requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        errors.push(`❌ ${varName} غير موجود`);
        console.log(`   ❌ ${varName}`);
    } else {
        console.log(`   ✅ ${varName}`);
    }
});

console.log('\n📋 المتغيرات الاختيارية:');
optionalVars.forEach(varName => {
    if (!process.env[varName]) {
        warnings.push(`⚠️  ${varName} غير موجود (اختياري)`);
        console.log(`   ⚠️  ${varName}`);
    } else {
        console.log(`   ✅ ${varName}`);
    }
});

// ─────────────────────────────────────────────
// 2. التحقق من صحة MONGO_URI
// ─────────────────────────────────────────────
console.log('\n🗄️  قاعدة البيانات:');
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
        errors.push('❌ MONGO_URI يجب أن يبدأ بـ mongodb:// أو mongodb+srv://');
        console.log('   ❌ صيغة MONGO_URI خاطئة');
    } else if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        warnings.push('⚠️  MONGO_URI يشير لقاعدة بيانات محلية');
        console.log('   ⚠️  قاعدة بيانات محلية (للتطوير فقط)');
    } else {
        console.log('   ✅ MONGO_URI صحيح');
    }
}

// ─────────────────────────────────────────────
// 3. التحقق من BASE_URL
// ─────────────────────────────────────────────
console.log('\n🌐 الدومين:');
const baseUrl = process.env.BASE_URL;
if (baseUrl) {
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        errors.push('❌ BASE_URL يجب أن يبدأ بـ http:// أو https://');
        console.log('   ❌ صيغة BASE_URL خاطئة');
    } else if (baseUrl.includes('hmcar.xyz')) {
        errors.push('❌ BASE_URL يشير لـ hmcar.xyz (الدومين غير موجود)');
        console.log('   ❌ hmcar.xyz غير موجود - استخدم hmcar.okigo.net');
    } else if (baseUrl.includes('localhost')) {
        warnings.push('⚠️  BASE_URL يشير لـ localhost (للتطوير فقط)');
        console.log('   ⚠️  localhost (للتطوير فقط)');
    } else {
        console.log(`   ✅ ${baseUrl}`);
    }
}

// ─────────────────────────────────────────────
// 4. التحقق من JWT_SECRET
// ─────────────────────────────────────────────
console.log('\n🔐 الأمان:');
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
    if (jwtSecret.length < 32) {
        errors.push('❌ JWT_SECRET قصير جداً (يجب أن يكون 32 حرف على الأقل)');
        console.log('   ❌ JWT_SECRET قصير جداً');
    } else if (jwtSecret === 'your-secret-key' || jwtSecret === 'change-me') {
        errors.push('❌ JWT_SECRET يستخدم قيمة افتراضية غير آمنة');
        console.log('   ❌ JWT_SECRET غير آمن');
    } else {
        console.log('   ✅ JWT_SECRET');
    }
}

const sessionSecret = process.env.SESSION_SECRET;
if (sessionSecret) {
    if (sessionSecret.length < 32) {
        errors.push('❌ SESSION_SECRET قصير جداً');
        console.log('   ❌ SESSION_SECRET قصير جداً');
    } else {
        console.log('   ✅ SESSION_SECRET');
    }
}

// ─────────────────────────────────────────────
// 5. التحقق من NODE_ENV
// ─────────────────────────────────────────────
console.log('\n⚙️  البيئة:');
const nodeEnv = process.env.NODE_ENV;
if (!nodeEnv) {
    warnings.push('⚠️  NODE_ENV غير محدد (سيتم استخدام development)');
    console.log('   ⚠️  NODE_ENV غير محدد');
} else if (nodeEnv !== 'development' && nodeEnv !== 'production' && nodeEnv !== 'test') {
    warnings.push(`⚠️  NODE_ENV قيمة غير معروفة: ${nodeEnv}`);
    console.log(`   ⚠️  NODE_ENV: ${nodeEnv} (غير معروف)`);
} else {
    console.log(`   ✅ NODE_ENV: ${nodeEnv}`);
}

// ─────────────────────────────────────────────
// 6. التحقق من BCRYPT_ROUNDS
// ─────────────────────────────────────────────
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
if (bcryptRounds < 8) {
    warnings.push('⚠️  BCRYPT_ROUNDS أقل من 8 (غير آمن)');
    console.log('   ⚠️  BCRYPT_ROUNDS أقل من 8');
} else if (bcryptRounds > 12) {
    warnings.push('⚠️  BCRYPT_ROUNDS أكبر من 12 (بطيء جداً)');
    console.log('   ⚠️  BCRYPT_ROUNDS أكبر من 12');
} else {
    console.log(`   ✅ BCRYPT_ROUNDS: ${bcryptRounds}`);
}

// ─────────────────────────────────────────────
// النتيجة النهائية
// ─────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));

if (errors.length > 0) {
    console.log('\n❌ وجدت أخطاء حرجة:\n');
    errors.forEach(err => console.log(`   ${err}`));
}

if (warnings.length > 0) {
    console.log('\n⚠️  تحذيرات:\n');
    warnings.forEach(warn => console.log(`   ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ جميع الإعدادات صحيحة!');
    process.exit(0);
} else if (errors.length === 0) {
    console.log('\n✅ لا توجد أخطاء حرجة (فقط تحذيرات)');
    process.exit(0);
} else {
    console.log('\n❌ يرجى إصلاح الأخطاء قبل النشر');
    process.exit(1);
}
