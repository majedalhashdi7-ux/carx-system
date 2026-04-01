#!/usr/bin/env node

/**
 * إصلاح المعرض الكوري باستخدام vercel curl
 */

require('dotenv').config();
const { execSync } = require('child_process');

const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com';
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || 'HmCar@2026!';

function vercelCurl(method, path, data = null, token = null) {
    try {
        let cmd = `vercel curl "${path}" --`;
        
        cmd += ` --request ${method}`;
        
        if (token) {
            cmd += ` --header "Authorization: Bearer ${token}"`;
        }
        
        cmd += ` --header "Content-Type: application/json"`;
        
        if (data) {
            const jsonData = JSON.stringify(data).replace(/"/g, '\\"');
            cmd += ` --data "${jsonData}"`;
        }
        
        const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        return JSON.parse(output);
    } catch (error) {
        console.error('خطأ في الطلب:', error.message);
        if (error.stdout) {
            try {
                return JSON.parse(error.stdout);
            } catch (e) {
                return { success: false, message: error.stdout };
            }
        }
        return { success: false, message: error.message };
    }
}

async function login() {
    console.log('🔐 تسجيل الدخول...');
    console.log(`   البريد: ${ADMIN_EMAIL}\n`);
    
    const res = vercelCurl('POST', '/api/v2/auth/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
    });

    if (res.success && res.token) {
        console.log('✅ تم تسجيل الدخول بنجاح!\n');
        return res.token;
    } else {
        console.log('❌ فشل تسجيل الدخول:', res.message);
        return null;
    }
}

async function checkShowroom(token) {
    console.log('📊 جاري فحص المعرض الكوري...\n');
    
    const res = vercelCurl('GET', '/api/v2/cars?source=korean_import&limit=100', null, token);
    
    if (res.success) {
        const cars = res.data?.cars || [];
        console.log(`✅ وجدنا ${cars.length} سيارة كورية\n`);
        
        if (cars.length === 0) {
            console.log('⚠️  لا توجد سيارات كورية\n');
            return { cars: [], needsFix: 0, problematicCars: [] };
        }
        
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
            });
            console.log('');
        }
        
        return { cars, needsFix, problematicCars };
    } else {
        console.log('❌ فشل جلب البيانات:', res.message);
        return { cars: [], needsFix: 0, problematicCars: [] };
    }
}

function fixCarImages(car, token) {
    const fixedImages = (car.images || []).map(img => {
        if (!img) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
        
        let url = img;
        
        if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
            url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        }
        
        if (url.endsWith('_')) {
            return url.startsWith('http') ? `${url}001.jpg` : `https://ci.encar.com${url}001.jpg`;
        }
        
        if (url.startsWith('/carpicture')) {
            return `https://ci.encar.com${url}`;
        }
        
        if (url.startsWith('/') && !url.startsWith('http')) {
            return `https://ci.encar.com/carpicture${url}`;
        }
        
        return url;
    }).filter(img => img);

    if (fixedImages.length === 0) {
        fixedImages.push('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop');
    }

    const res = vercelCurl('PUT', `/api/v2/cars/${car._id || car.id}`, {
        images: fixedImages
    }, token);

    if (res.success) {
        return { success: true, car: car.title || car.make + ' ' + car.model };
    } else {
        return { success: false, car: car.title || car.make + ' ' + car.model, error: res.message };
    }
}

function fixAllCars(problematicCars, token) {
    console.log('🔧 جاري إصلاح الصور...\n');
    
    let fixed = 0;
    let failed = 0;
    
    for (let i = 0; i < problematicCars.length; i++) {
        const car = problematicCars[i];
        const carName = car.title || `${car.make} ${car.model}`;
        process.stdout.write(`   [${i + 1}/${problematicCars.length}] ${carName}... `);
        
        const result = fixCarImages(car, token);
        
        if (result.success) {
            console.log('✅');
            fixed++;
        } else {
            console.log(`❌`);
            failed++;
        }
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`   - تم إصلاحها: ${fixed}`);
    console.log(`   - فشلت: ${failed}\n`);
    
    return { fixed, failed };
}

function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔧 إصلاح المعرض الكوري - Vercel');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const token = login();
    if (!token) {
        console.log('⚠️  تسجيل الدخول فشل، لكن سنحاول الفحص بدون توكن...\n');
    }
    
    const result = checkShowroom(token);
    
    if (!result || !result.cars) {
        console.log('❌ فشل جلب البيانات\n');
        process.exit(1);
    }
    
    const { cars, needsFix, problematicCars } = result;
    
    if (cars.length === 0) {
        console.log('💡 لا توجد سيارات كورية.\n');
        process.exit(0);
    }
    
    if (needsFix > 0) {
        console.log(`🔧 سيتم إصلاح ${needsFix} سيارة...\n`);
        fixAllCars(problematicCars, token);
        
        console.log('✅ اكتمل الإصلاح!');
        console.log('💡 تحقق من لوحة الأدمن\n');
    } else {
        console.log('✅ جميع الصور سليمة! لا حاجة للإصلاح.\n');
    }
    
    process.exit(0);
}

main();
