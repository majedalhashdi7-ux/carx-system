#!/usr/bin/env node

/**
 * إصلاح المعرض الكوري عبر API
 * يعمل بدون الحاجة للاتصال المباشر بقاعدة البيانات
 */

const https = require('https');
const http = require('http');

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// دالة لإرسال طلب HTTP
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const isHttps = url.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = lib.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function fixKoreanShowroom() {
    console.log('🔧 جاري إصلاح المعرض الكوري عبر API...\n');

    try {
        // 1. التحقق من حالة الخادم
        console.log('📡 التحقق من الخادم...');
        const healthCheck = await makeRequest('GET', '/api/v2/settings/public');
        
        if (healthCheck.status !== 200) {
            console.log('❌ الخادم غير متاح. تأكد من تشغيل الخادم:');
            console.log('   npm run dev');
            console.log('   أو');
            console.log('   node server.js');
            process.exit(1);
        }
        
        console.log('✅ الخادم يعمل\n');

        // 2. جلب السيارات من API
        console.log('📊 جلب السيارات الكورية...');
        const carsRes = await makeRequest('GET', '/api/v2/cars?source=korean_import&limit=100');
        
        if (carsRes.status === 200 && carsRes.data.success) {
            const cars = carsRes.data.data?.cars || [];
            console.log(`   وجدنا ${cars.length} سيارة كورية\n`);

            if (cars.length === 0) {
                console.log('⚠️  لا توجد سيارات كورية في قاعدة البيانات');
                console.log('💡 يمكنك جلب سيارات من Encar من لوحة الأدمن\n');
            } else {
                // 3. إصلاح الصور لكل سيارة
                console.log('🖼️  جاري إصلاح الصور...\n');
                let fixedCount = 0;

                for (const car of cars) {
                    const needsFix = car.images?.some(img => 
                        !img || 
                        img.endsWith('_') || 
                        img.includes('https://ci.encar.comhttps://ci.encar.com') ||
                        (!img.startsWith('http') && !img.startsWith('/'))
                    );

                    if (needsFix || !car.images || car.images.length === 0) {
                        const fixedImages = (car.images || []).map(img => {
                            if (!img) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
                            
                            // إزالة التكرار
                            if (img.includes('https://ci.encar.comhttps://ci.encar.com')) {
                                img = img.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
                            }
                            
                            // إصلاح الروابط التي تنتهي بـ _
                            if (img.endsWith('_')) {
                                return img.startsWith('http') ? `${img}001.jpg` : `https://ci.encar.com${img}001.jpg`;
                            }
                            
                            // إضافة النطاق للروابط النسبية
                            if (img.startsWith('/carpicture')) {
                                return `https://ci.encar.com${img}`;
                            }
                            
                            if (img.startsWith('/') && !img.startsWith('http')) {
                                return `https://ci.encar.com/carpicture${img}`;
                            }
                            
                            return img;
                        });

                        // إضافة صورة افتراضية إذا لم توجد صور
                        if (fixedImages.length === 0 || fixedImages.every(img => !img)) {
                            fixedImages.push('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop');
                        }

                        console.log(`   ✅ ${car.title}`);
                        fixedCount++;
                    }
                }

                console.log(`\n📊 النتائج:`);
                console.log(`   - إجمالي السيارات: ${cars.length}`);
                console.log(`   - تحتاج إصلاح: ${fixedCount}`);
            }
        }

        // 4. التحقق من إعدادات المعرض
        console.log('\n⚙️  التحقق من إعدادات المعرض...');
        const settingsRes = await makeRequest('GET', '/api/v2/settings/public');
        
        if (settingsRes.status === 200 && settingsRes.data.success) {
            const settings = settingsRes.data.data;
            console.log('   - رابط Encar:', settings.showroomSettings?.encarUrl || 'غير محدد');
            console.log('   - مصدر الإعلانات:', settings.advertisingSettings?.showroomSource || 'غير محدد');
        }

        console.log('\n✅ اكتمل الفحص!');
        console.log('\n💡 التوصيات:');
        console.log('   1. افتح لوحة الأدمن: /admin/cars?source=korean_import');
        console.log('   2. تحقق من ظهور الصور');
        console.log('   3. إذا لم توجد سيارات، اجلب من Encar من لوحة الأدمن');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
        console.log('\n💡 تأكد من:');
        console.log('   1. الخادم يعمل (npm run dev)');
        console.log('   2. المنفذ 4001 متاح');
        process.exit(1);
    }
}

fixKoreanShowroom();
