#!/usr/bin/env node

/**
 * فحص الإعداد الموجود والخطوات النهائية
 */

const fs = require('fs');

console.log('🔍 فحص الإعداد الموجود...\n');

// فحص ملفات البيئة الموجودة
function checkExistingEnvFiles() {
    console.log('📁 فحص ملفات البيئة الموجودة:');
    
    const envFiles = [
        '.env',
        'client-app/.env.local', 
        'carx-system/.env.local',
        'client-app/.env.production',
        'carx-system/.env.production'
    ];
    
    envFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} موجود`);
            
            // فحص محتوى الملف
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('SECURE_PASSWORD') || content.includes('your-username')) {
                console.log(`   ⚠️ يحتوي على بيانات وهمية - يحتاج تحديث`);
            } else if (content.includes('mongodb+srv://')) {
                console.log(`   ✅ يحتوي على connection string حقيقي`);
            }
        } else {
            console.log(`❌ ${file} مفقود`);
        }
    });
}

// فحص إعدادات المشاريع
function checkProjectConfigs() {
    console.log('\n⚙️ فحص إعدادات المشاريع:');
    
    // فحص package.json
    ['client-app/package.json', 'carx-system/package.json'].forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} موجود`);
        } else {
            console.log(`❌ ${file} مفقود`);
        }
    });
    
    // فحص next.config.js
    ['client-app/next.config.js', 'carx-system/next.config.js'].forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} موجود`);
        } else {
            console.log(`❌ ${file} مفقود`);
        }
    });
}

// عرض الخطوات النهائية
function showFinalSteps() {
    console.log('\n🚀 الخطوات النهائية للنشر:\n');
    
    console.log('🔥 إذا كان لديك MongoDB connection string جاهز:');
    console.log('1. أعطني الـ connection string');
    console.log('2. سأحدث جميع الملفات');
    console.log('3. ننشر على Vercel');
    
    console.log('\n🔥 إذا كنت تريد النشر مباشرة:');
    console.log('1. cd client-app');
    console.log('2. npm install');
    console.log('3. vercel --prod');
    console.log('4. cd ../carx-system');
    console.log('5. npm install');
    console.log('6. vercel --prod');
    
    console.log('\n🔥 إذا كنت تريد التشغيل محلياً أولاً:');
    console.log('1. cd client-app && npm run dev');
    console.log('2. cd carx-system && npm run dev');
}

// تشغيل الفحص
function runCheck() {
    checkExistingEnvFiles();
    checkProjectConfigs();
    showFinalSteps();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 أخبرني ماذا تريد أن نعمل:');
    console.log('• تحديث connection strings؟');
    console.log('• النشر مباشرة على Vercel؟');
    console.log('• التشغيل محلياً أولاً؟');
}

if (require.main === module) {
    runCheck();
}