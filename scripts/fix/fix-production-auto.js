#!/usr/bin/env node

/**
 * إصلاح المعرض الكوري على الموقع المباشر - تنفيذ تلقائي
 * يستخدم بيانات الأدمن من .env
 */

require('dotenv').config();
const https = require('https');

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://car-auction-hfuho9slb-daood-alhashdis-projects.vercel.app';
const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com';
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || 'HmCar@2026!';

// دالة لإرسال طلب HTTPS
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, PRODUCTION_URL);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
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

async function login() {
    console.log('🔐 تسجيل الدخول للموقع المباشر...');
    console.log(`   البريد: ${ADMIN_EMAIL}\n`);
    
    try {
        const res = await makeRequest('POST', '/api/v2/auth/login', {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (res.status === 200 && res.data.success && res.data.token) {
            console.log('✅ تم تسجيل الدخول بنجاح!\n');
            return res.data.token;
        } else {
            console.log('❌ فشل تسجيل الدخول:', res.data.message || 'خطأ غير معروف');
            console.log('   الحالة:', res.status);
            console.log('   البيانات:', JSON.stringify(res.data, null, 2));
            return null;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        return null;
    }
}

async function checkShowroom(token) {
    console.log('📊 جاري فحص المعرض الكوري...\n');
    
    try {
        const res = await makeRequest('GET', '/api/v2/cars?source=korean_import&limit=100', null, token);
        
        if (res.status === 200 && res.data.success) {
            const cars = res.data.data?.cars || [];
            console.log(`✅ وجدنا ${cars.length} سيارة كورية\n`);
            
            if (cars.length === 0) {
                console.log('⚠️  لا توجد سيارات كورية في قاعدة البيانات\n');
                return { cars: [], needsFix: 0, problematicCars: [] };
            }
            
            // فحص الصور
            let needsFix = 0;
            const problematicCars = [];
            
            for (const car of cars) {
                const hasIssue = !car.images || 
                                car.images.length === 0 ||
                                car.images.some(img => 
                                    !img || 
                                    img.endsWith('_') || 
                                    img.includes('https://ci.encar.comhttps://ci.encar.com')
                                );
                
                if (hasIssue) {
                    needsFix++;
                    problematicCars.push(car);
                }
            }
            
            console.log(`📊 الإحصائيات:`);
            console.log(`   - إجمالي السيارات: ${cars.length}`);
            console.log(`   - تحتاج إصلاح: ${needsFix}`);
            console.log(`   - سليمة: ${cars.length - needsFix}\n`);
            
            if (needsFix > 0) {
                console.log('🔍 عينة من السيارات التي تحتاج إصلاح:');
                problematicCars.slice(0, 5).forEach((car, i) => {
                    console.log(`   ${i + 1}. ${car.title || car.make + ' ' + car.model}`);
                    console.log(`      الصور: ${car.images?.length || 0}`);
                    if (car.images && car.images.length > 0) {
                        console.log(`      مثال: ${car.images[0]?.substring(0, 60)}...`);
                    }
                });
                console.log('');
            }
            
            return { cars, needsFix, problematicCars };
        } else {
            console.log('❌ فشل جلب البيانات:', res.data.message);
            console.log('   الحالة:', res.status);
            return { cars: [], needsFix: 0, problematicCars: [] };
        }
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        return { cars: [], needsFix: 0, problematicCars: [] };
    }
}

async function fixCarImages(car, token) {
    // معالجة الصور
    const fixedImages = (car.images || []).map(img => {
        if (!img) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
        
        let url = img;
        
        // إزالة التكرار
        if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
            url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        }
        
        // إصلاح الروابط التي تنتهي بـ _
        if (url.endsWith('_')) {
            return url.startsWith('http') ? `${url}001.jpg` : `https://ci.encar.com${url}001.jpg`;
        }
        
        // إضافة النطاق للروابط النسبية
        if (url.startsWith('/carpicture')) {
            return `https://ci.encar.com${url}`;
        }
        
        if (url.startsWith('/') && !url.startsWith('http')) {
            return `https://ci.encar.com/carpicture${url}`;
        }
        
        return url;
    }).filter(img => img); // إزالة القيم الفارغة

    // إضافة صورة افتراضية إذا لم توجد صور
    if (fixedImages.length === 0) {
        fixedImages.push('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop');
    }

    // تحديث السيارة
    try {
        const res = await makeRequest('PUT', `/api/v2/cars/${car._id || car.id}`, {
            images: fixedImages
        }, token);

        if (res.status === 200 && res.data.success) {
            return { success: true, car: car.title || car.make + ' ' + car.model };
        } else {
            return { success: false, car: car.title || car.make + ' ' + car.model, error: res.data.message };
        }
    } catch (error) {
        return { success: false, car: car.title || car.make + ' ' + car.model, error: error.message };
    }
}

async function fixAllCars(problematicCars, token) {
    console.log('🔧 جاري إصلاح الصور...\n');
    
    let fixed = 0;
    let failed = 0;
    const errors = [];
    
    for (let i = 0; i < problematicCars.length; i++) {
        const car = problematicCars[i];
        const carName = car.title || `${car.make} ${car.model}`;
        process.stdout.write(`   [${i + 1}/${problematicCars.length}] ${carName}... `);
        
        const result = await fixCarImages(car, token);
        
        if (result.success) {
            console.log('✅');
            fixed++;
        } else {
            console.log(`❌`);
            failed++;
            errors.push({ car: carName, error: result.error });
        }
        
        // تأخير بسيط لتجنب الضغط على الخادم
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`   - تم إصلاحها: ${fixed}`);
    console.log(`   - فشلت: ${failed}\n`);
    
    if (errors.length > 0 && errors.length <= 5) {
        console.log('❌ الأخطاء:');
        errors.forEach(e => {
            console.log(`   - ${e.car}: ${e.error}`);
        });
        console.log('');
    }
    
    return { fixed, failed };
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔧 إصلاح المعرض الكوري - تنفيذ تلقائي');
    console.log('   🌐 ' + PRODUCTION_URL);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // 1. تسجيل الدخول
    const token = await login();
    if (!token) {
        console.log('\n❌ لا يمكن المتابعة بدون تسجيل الدخول');
        process.exit(1);
    }
    
    // 2. فحص المعرض
    const { cars, needsFix, problematicCars } = await checkShowroom(token);
    
    if (cars.length === 0) {
        console.log('💡 لا توجد سيارات كورية. يمكنك جلبها من لوحة الأدمن.\n');
        process.exit(0);
    }
    
    // 3. إصلاح الصور إذا لزم الأمر
    if (needsFix > 0) {
        console.log(`🔧 سيتم إصلاح ${needsFix} سيارة تلقائياً...\n`);
        await fixAllCars(problematicCars, token);
        
        console.log('✅ اكتمل الإصلاح!');
        console.log('💡 تحقق من الموقع: ' + PRODUCTION_URL + '/admin/cars?source=korean_import');
        console.log('💡 صفحة المعرض: ' + PRODUCTION_URL + '/showroom\n');
    } else {
        console.log('✅ جميع الصور سليمة! لا حاجة للإصلاح.\n');
    }
    
    process.exit(0);
}

// معالجة الأخطاء
process.on('unhandledRejection', (error) => {
    console.error('\n❌ خطأ غير متوقع:', error.message);
    process.exit(1);
});

// تشغيل البرنامج
main();
