#!/usr/bin/env node

/**
 * إصلاح المعرض الكوري على الموقع المباشر (الإنتاج)
 * يعمل عبر API مع الموقع المنشور على hmcar.xyz
 */

const https = require('https');
const readline = require('readline');

// رابط الموقع المباشر
const PRODUCTION_URL = 'https://hmcar.xyz';

// واجهة للإدخال من المستخدم
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

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

        // إضافة التوكن إذا كان موجوداً
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
    console.log('🔐 تسجيل الدخول للموقع المباشر\n');
    
    const email = await question('البريد الإلكتروني للأدمن: ');
    const password = await question('كلمة المرور: ');
    
    console.log('\n🔄 جاري تسجيل الدخول...');
    
    try {
        const res = await makeRequest('POST', '/api/v2/auth/login', {
            email: email.trim(),
            password: password.trim()
        });

        if (res.status === 200 && res.data.success && res.data.token) {
            console.log('✅ تم تسجيل الدخول بنجاح!\n');
            return res.data.token;
        } else {
            console.log('❌ فشل تسجيل الدخول:', res.data.message || 'خطأ غير معروف');
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
        // جلب السيارات الكورية
        const res = await makeRequest('GET', '/api/v2/cars?source=korean_import&limit=100', null, token);
        
        if (res.status === 200 && res.data.success) {
            const cars = res.data.data?.cars || [];
            console.log(`✅ وجدنا ${cars.length} سيارة كورية\n`);
            
            if (cars.length === 0) {
                console.log('⚠️  لا توجد سيارات كورية في قاعدة البيانات');
                console.log('💡 يمكنك جلب سيارات من Encar من لوحة الأدمن\n');
                return { cars: [], needsFix: 0 };
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
                    problematicCars.push({
                        id: car.id,
                        title: car.title,
                        images: car.images
                    });
                }
            }
            
            console.log(`📊 الإحصائيات:`);
            console.log(`   - إجمالي السيارات: ${cars.length}`);
            console.log(`   - تحتاج إصلاح: ${needsFix}`);
            console.log(`   - سليمة: ${cars.length - needsFix}\n`);
            
            if (needsFix > 0) {
                console.log('🔍 عينة من السيارات التي تحتاج إصلاح:');
                problematicCars.slice(0, 5).forEach((car, i) => {
                    console.log(`   ${i + 1}. ${car.title}`);
                    console.log(`      الصور: ${car.images?.length || 0}`);
                });
                console.log('');
            }
            
            return { cars, needsFix, problematicCars };
        } else {
            console.log('❌ فشل جلب البيانات:', res.data.message);
            return { cars: [], needsFix: 0 };
        }
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        return { cars: [], needsFix: 0 };
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
    });

    // إضافة صورة افتراضية إذا لم توجد صور
    if (fixedImages.length === 0 || fixedImages.every(img => !img)) {
        fixedImages.push('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop');
    }

    // تحديث السيارة
    try {
        const res = await makeRequest('PUT', `/api/v2/cars/${car.id}`, {
            images: fixedImages
        }, token);

        if (res.status === 200 && res.data.success) {
            return { success: true, car: car.title };
        } else {
            return { success: false, car: car.title, error: res.data.message };
        }
    } catch (error) {
        return { success: false, car: car.title, error: error.message };
    }
}

async function fixAllCars(problematicCars, token) {
    console.log('🔧 جاري إصلاح الصور...\n');
    
    let fixed = 0;
    let failed = 0;
    
    for (let i = 0; i < problematicCars.length; i++) {
        const car = problematicCars[i];
        process.stdout.write(`   [${i + 1}/${problematicCars.length}] ${car.title}... `);
        
        const result = await fixCarImages(car, token);
        
        if (result.success) {
            console.log('✅');
            fixed++;
        } else {
            console.log(`❌ (${result.error})`);
            failed++;
        }
        
        // تأخير بسيط لتجنب الضغط على الخادم
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 النتائج:`);
    console.log(`   - تم إصلاحها: ${fixed}`);
    console.log(`   - فشلت: ${failed}`);
    
    return { fixed, failed };
}

async function scrapeNewCars(token) {
    console.log('\n📥 جلب سيارات جديدة من Encar...');
    console.log('⏳ قد يستغرق هذا دقيقة...\n');
    
    try {
        const res = await makeRequest('POST', '/api/v2/showroom/scrape', {}, token);
        
        if (res.status === 200 && res.data.success) {
            console.log('✅', res.data.message);
            return true;
        } else {
            console.log('❌ فشل الجلب:', res.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ:', error.message);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🔧 إصلاح المعرض الكوري - الموقع المباشر');
    console.log('   🌐 ' + PRODUCTION_URL);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // 1. تسجيل الدخول
    const token = await login();
    if (!token) {
        console.log('\n❌ لا يمكن المتابعة بدون تسجيل الدخول');
        rl.close();
        process.exit(1);
    }
    
    // 2. فحص المعرض
    const { cars, needsFix, problematicCars } = await checkShowroom(token);
    
    if (cars.length === 0) {
        const scrape = await question('هل تريد جلب سيارات من Encar؟ (y/n): ');
        if (scrape.toLowerCase() === 'y' || scrape.toLowerCase() === 'yes') {
            await scrapeNewCars(token);
        }
        rl.close();
        process.exit(0);
    }
    
    // 3. إصلاح الصور إذا لزم الأمر
    if (needsFix > 0) {
        const fix = await question(`\nهل تريد إصلاح ${needsFix} سيارة؟ (y/n): `);
        if (fix.toLowerCase() === 'y' || fix.toLowerCase() === 'yes') {
            await fixAllCars(problematicCars, token);
        }
    } else {
        console.log('✅ جميع الصور سليمة! لا حاجة للإصلاح.\n');
    }
    
    // 4. خيارات إضافية
    console.log('\n💡 خيارات إضافية:');
    console.log('   1. جلب سيارات جديدة من Encar');
    console.log('   2. إعادة فحص المعرض');
    console.log('   3. الخروج');
    
    const choice = await question('\nاختر (1-3): ');
    
    if (choice === '1') {
        await scrapeNewCars(token);
    } else if (choice === '2') {
        rl.close();
        main();
        return;
    }
    
    console.log('\n✅ اكتمل العمل!');
    console.log('💡 يمكنك الآن التحقق من الموقع: ' + PRODUCTION_URL + '/admin/cars?source=korean_import\n');
    
    rl.close();
    process.exit(0);
}

// معالجة الأخطاء
process.on('unhandledRejection', (error) => {
    console.error('\n❌ خطأ غير متوقع:', error.message);
    rl.close();
    process.exit(1);
});

// تشغيل البرنامج
main();
