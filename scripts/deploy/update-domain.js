#!/usr/bin/env node

/**
 * سكريبت تحديث الدومين
 * يقوم بتحديث جميع ملفات الإعدادات بالدومين الجديد
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function updateDomain() {
    console.log('🌐 أداة تحديث الدومين - HM CAR\n');
    console.log('═══════════════════════════════════════\n');

    // الحصول على الدومين الجديد
    const newDomain = await question('أدخل الدومين الجديد (مثال: hmcar.com): ');
    
    if (!newDomain || !newDomain.includes('.')) {
        console.error('❌ الدومين غير صحيح!');
        rl.close();
        return;
    }

    const httpsUrl = `https://${newDomain}`;
    const wwwUrl = `https://www.${newDomain}`;
    const allowedOrigins = `${httpsUrl},${wwwUrl}`;

    console.log('\n📝 سيتم تحديث الدومين إلى:');
    console.log(`   الدومين: ${newDomain}`);
    console.log(`   URL: ${httpsUrl}`);
    console.log(`   WWW: ${wwwUrl}\n`);

    const confirm = await question('هل تريد المتابعة؟ (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('❌ تم الإلغاء');
        rl.close();
        return;
    }

    console.log('\n🔄 جاري التحديث...\n');

    // قائمة الملفات للتحديث
    const files = [
        {
            path: '.env',
            updates: {
                'BASE_URL=': `BASE_URL="${httpsUrl}"`,
                'ALLOWED_ORIGINS=': `ALLOWED_ORIGINS="${allowedOrigins}"`
            }
        },
        {
            path: 'client-app/.env.production',
            updates: {
                'NEXT_PUBLIC_API_URL=': `NEXT_PUBLIC_API_URL=${httpsUrl}`,
                'NEXT_PUBLIC_SOCKET_URL=': `NEXT_PUBLIC_SOCKET_URL=${httpsUrl}`
            }
        },
        {
            path: 'client-app/.env.local',
            updates: {
                'NEXT_PUBLIC_API_URL=': `NEXT_PUBLIC_API_URL=${httpsUrl}`,
                'NEXT_PUBLIC_SOCKET_URL=': `NEXT_PUBLIC_SOCKET_URL=${httpsUrl}`
            }
        }
    ];

    let updatedCount = 0;
    let errorCount = 0;

    for (const file of files) {
        try {
            const filePath = path.join(process.cwd(), file.path);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  الملف غير موجود: ${file.path}`);
                continue;
            }

            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            for (const [key, value] of Object.entries(file.updates)) {
                const regex = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'gm');
                if (regex.test(content)) {
                    content = content.replace(regex, value);
                    modified = true;
                } else {
                    // إضافة السطر إذا لم يكن موجوداً
                    content += `\n${value}`;
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ تم تحديث: ${file.path}`);
                updatedCount++;
            }
        } catch (error) {
            console.error(`❌ خطأ في تحديث ${file.path}:`, error.message);
            errorCount++;
        }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`✅ تم تحديث ${updatedCount} ملف`);
    if (errorCount > 0) {
        console.log(`⚠️  ${errorCount} خطأ`);
    }
    console.log('═══════════════════════════════════════\n');

    console.log('📋 الخطوات التالية:\n');
    console.log('1. حدّث Environment Variables في Vercel Dashboard:');
    console.log(`   BASE_URL=${httpsUrl}`);
    console.log(`   ALLOWED_ORIGINS=${allowedOrigins}`);
    console.log(`   NEXT_PUBLIC_API_URL=${httpsUrl}`);
    console.log(`   NEXT_PUBLIC_SOCKET_URL=${httpsUrl}\n`);
    
    console.log('2. أضف سجلات DNS في لوحة تحكم الدومين\n');
    
    console.log('3. أضف الدومين في Vercel Dashboard\n');
    
    console.log('4. أعد نشر المشروع:');
    console.log('   vercel --prod\n');
    
    console.log('5. راجع الدليل الكامل في: DOMAIN_SETUP_GUIDE.md\n');

    rl.close();
}

// تشغيل السكريبت
updateDomain().catch(error => {
    console.error('❌ خطأ:', error.message);
    rl.close();
    process.exit(1);
});
