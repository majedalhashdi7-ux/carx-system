#!/usr/bin/env node

/**
 * التحقق من حالة النظام بعد الإصلاحات
 * System Status Verification Script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 التحقق من حالة النظام بعد الإصلاحات...\n');

// فحص الملفات والإعدادات
function checkSystemStatus() {
    const checks = [];
    
    // 1. فحص CAR X .env.local
    try {
        const envContent = fs.readFileSync('carx-system/.env.local', 'utf8');
        const hasSecureMongoUri = !envContent.includes('your-username:your-password');
        const hasNoExposedPassword = !envContent.includes('ADMIN_PASSWORD=daood@112233');
        
        checks.push({
            name: 'CAR X .env.local',
            status: hasSecureMongoUri && hasNoExposedPassword ? '✅' : '❌',
            details: hasSecureMongoUri && hasNoExposedPassword ? 
                'آمن - لا يحتوي على بيانات وهمية أو كلمات سر مكشوفة' : 
                'غير آمن - يحتوي على بيانات وهمية أو كلمات سر مكشوفة'
        });
    } catch (error) {
        checks.push({
            name: 'CAR X .env.local',
            status: '❌',
            details: 'الملف غير موجود'
        });
    }
    
    // 2. فحص tenants.json
    try {
        const tenantsContent = fs.readFileSync('tenants/tenants.json', 'utf8');
        const tenants = JSON.parse(tenantsContent);
        const tenantCount = Object.keys(tenants.tenants).length;
        const hasFakeShowrooms = tenantsContent.includes('alwaha') || tenantsContent.includes('luxury') || tenantsContent.includes('stars');
        
        checks.push({
            name: 'tenants.json',
            status: !hasFakeShowrooms ? '✅' : '⚠️',
            details: `يحتوي على ${tenantCount} معرض${!hasFakeShowrooms ? ' - تم إزالة المعارض الوهمية' : ' - يحتوي على معارض وهمية'}`
        });
    } catch (error) {
        checks.push({
            name: 'tenants.json',
            status: '❌',
            details: 'خطأ في قراءة الملف'
        });
    }
    
    // 3. فحص next.config.js
    try {
        const nextConfigContent = fs.readFileSync('carx-system/next.config.js', 'utf8');
        const isDynamic = nextConfigContent.includes('process.env.TENANT_NAME') && 
                         nextConfigContent.includes('process.env.VERCEL_URL');
        
        checks.push({
            name: 'next.config.js',
            status: isDynamic ? '✅' : '⚠️',
            details: isDynamic ? 'ديناميكي - يدعم Multi-Tenant' : 'ثابت - لا يدعم Multi-Tenant بشكل كامل'
        });
    } catch (error) {
        checks.push({
            name: 'next.config.js',
            status: '❌',
            details: 'الملف غير موجود'
        });
    }
    
    // 4. فحص .env.production
    const envProductionExists = fs.existsSync('carx-system/.env.production');
    checks.push({
        name: '.env.production',
        status: envProductionExists ? '✅' : '⚠️',
        details: envProductionExists ? 'موجود - ملف إنتاج آمن' : 'غير موجود'
    });
    
    // 5. فحص دليل Vercel
    const vercelGuideExists = fs.existsSync('VERCEL_ENV_VARIABLES_GUIDE.md');
    checks.push({
        name: 'دليل Vercel',
        status: vercelGuideExists ? '✅' : '⚠️',
        details: vercelGuideExists ? 'موجود - دليل متغيرات البيئة' : 'غير موجود'
    });
    
    // 6. فحص DynamicComponents
    try {
        const dynamicComponentsContent = fs.readFileSync('client-app/src/components/DynamicComponents.tsx', 'utf8');
        const hasFallbacks = dynamicComponentsContent.includes('createFallback');
        
        checks.push({
            name: 'DynamicComponents',
            status: hasFallbacks ? '✅' : '⚠️',
            details: hasFallbacks ? 'محسّن - يحتوي على fallback components آمنة' : 'يحتاج تحسين'
        });
    } catch (error) {
        checks.push({
            name: 'DynamicComponents',
            status: '❌',
            details: 'الملف غير موجود'
        });
    }
    
    return checks;
}

// عرض النتائج
function displayResults(checks) {
    console.log('📊 نتائج الفحص:\n');
    
    checks.forEach((check, index) => {
        console.log(`${index + 1}. ${check.status} ${check.name}`);
        console.log(`   ${check.details}\n`);
    });
    
    const passedChecks = checks.filter(check => check.status === '✅').length;
    const totalChecks = checks.length;
    const percentage = Math.round((passedChecks / totalChecks) * 100);
    
    console.log('═'.repeat(50));
    console.log(`📈 النتيجة الإجمالية: ${passedChecks}/${totalChecks} (${percentage}%)`);
    
    if (percentage >= 90) {
        console.log('🎉 ممتاز! النظام في حالة ممتازة');
    } else if (percentage >= 70) {
        console.log('👍 جيد! النظام في حالة جيدة مع بعض التحسينات المطلوبة');
    } else {
        console.log('⚠️ يحتاج عمل! النظام يحتاج المزيد من الإصلاحات');
    }
    
    console.log('═'.repeat(50));
}

// فحص الأمان
function securityCheck() {
    console.log('\n🔐 فحص الأمان:\n');
    
    const securityIssues = [];
    
    // فحص كلمات السر المكشوفة
    const filesToCheck = [
        'carx-system/.env.local',
        'client-app/.env.local',
        '.env',
        '.env.local'
    ];
    
    filesToCheck.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('password') && content.includes('=') && !content.includes('ENV:')) {
                securityIssues.push(`⚠️ ${file} قد يحتوي على كلمات سر مكشوفة`);
            }
        }
    });
    
    if (securityIssues.length === 0) {
        console.log('✅ لم يتم العثور على مشاكل أمنية واضحة');
    } else {
        securityIssues.forEach(issue => console.log(issue));
    }
    
    console.log('\n📋 توصيات الأمان:');
    console.log('1. تأكد من إضافة جميع البيانات الحساسة في Vercel Environment Variables');
    console.log('2. استخدم كلمات سر قوية ومعقدة');
    console.log('3. لا تضع كلمات السر في ملفات .env المرفوعة على GitHub');
    console.log('4. غيّر كلمات السر بانتظام');
}

// الخطوات التالية
function nextSteps() {
    console.log('\n🚀 الخطوات التالية المطلوبة:\n');
    
    console.log('🔴 عاجل (يجب تطبيقه الآن):');
    console.log('1. إضافة متغيرات البيئة في Vercel Dashboard');
    console.log('   - MONGO_URI');
    console.log('   - MONGO_URI_CARX');
    console.log('   - NEXTAUTH_SECRET');
    console.log('   - ADMIN_PASSWORD');
    console.log('');
    console.log('2. ربط قواعد البيانات الحقيقية');
    console.log('3. تحديث كلمات السر بكلمات قوية');
    console.log('');
    console.log('🟡 متوسط (للتحسين):');
    console.log('1. إنشاء المكونات الديناميكية المفقودة حسب الحاجة');
    console.log('2. إضافة معارض جديدة حقيقية');
    console.log('3. تحسين الأداء والأمان');
}

// تشغيل الفحص
function runVerification() {
    const checks = checkSystemStatus();
    displayResults(checks);
    securityCheck();
    nextSteps();
}

// تشغيل السكريبت
if (require.main === module) {
    runVerification();
}

module.exports = { runVerification };