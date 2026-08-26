/**
 * سكريبت الفحص الشامل لجميع مسارات النظام (Frontend Pages & Backend APIs)
 * يفحص سرعة الاستجابة ورمز الحالة وصحة البيانات المسترجعة
 */
const https = require('https');

const BASE_URL = 'https://hmcar-system-two.vercel.app';

function testRoute(path, isJson = false) {
    return new Promise((resolve) => {
        const start = Date.now();
        const url = `${BASE_URL}${path}`;
        
        const req = https.get(url, {
            headers: {
                'User-Agent': 'HMCarRouteAuditor/2.0',
                'Accept': isJson ? 'application/json' : 'text/html,application/xhtml+xml,application/xml',
                'X-Tenant-ID': 'hmcar'
            },
            timeout: 15000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                let parsed = null;
                let error = null;
                
                if (isJson) {
                    try {
                        parsed = JSON.parse(data);
                    } catch (e) {
                        error = 'Invalid JSON response';
                    }
                }

                resolve({
                    path,
                    status: res.statusCode,
                    duration,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    dataSize: Buffer.byteLength(data),
                    isJson,
                    parsed,
                    error,
                    cacheHeader: res.headers['x-vercel-cache'] || res.headers['x-cache'] || 'N/A'
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                path,
                status: 0,
                duration: Date.now() - start,
                success: false,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                path,
                status: 408,
                duration: Date.now() - start,
                success: false,
                error: 'Request Timeout (15s)'
            });
        });
    });
}

async function audit() {
    console.log('🔍 بدء الفحص الشامل لمسارات نظام HM CAR (' + BASE_URL + ')\n');
    console.log('='.repeat(80));

    // 1. فحص الـ APIs أولاً للحصول على IDs حقيقية للسيارات وقطع الغيار
    console.log('\n📡 [1/3] فحص نقاط الـ API الخلفية (Backend APIs):');
    console.log('-'.repeat(80));

    const apiRoutes = [
        { path: '/api/health', desc: 'فحص صحة الخادم السحابي' },
        { path: '/api/v2/cars', desc: 'قائمة السيارات' },
        { path: '/api/v2/cars/makes', desc: 'ماركات السيارات المستوردة' },
        { path: '/api/v2/parts', desc: 'قائمة قطع الغيار' },
        { path: '/api/v2/brands', desc: 'الوكالات والمصنعين' },
        { path: '/api/v2/auctions', desc: 'المزادات الحالية' },
        { path: '/api/v2/live-auctions', desc: 'جلسات المزادات الحية' },
        { path: '/api/v2/showroom/cars', desc: 'سيارات المعرض الكوري' },
        { path: '/api/v2/settings/public', desc: 'إعدادات الموقع العامة وشعار المعرض' },
        { path: '/api/v2/reviews', desc: 'تقييمات وآراء العملاء' }
    ];

    let sampleCarId = null;
    let samplePartId = null;
    let sampleAuctionId = null;

    let apiPassed = 0;
    for (const r of apiRoutes) {
        const result = await testRoute(r.path, true);
        const icon = result.success ? '✅' : '❌';
        const cache = result.cacheHeader !== 'N/A' ? ` [Cache: ${result.cacheHeader}]` : '';
        console.log(`${icon} ${result.status} | ${result.duration.toString().padStart(4)}ms | ${r.path.padEnd(28)} | ${r.desc}${cache}`);

        if (result.success) {
            apiPassed++;
            if (r.path === '/api/v2/cars' && result.parsed?.data) {
                const cars = result.parsed.data.cars || (Array.isArray(result.parsed.data) ? result.parsed.data : []);
                if (cars.length > 0) sampleCarId = cars[0]._id || cars[0].id;
            }
            if (r.path === '/api/v2/parts' && result.parsed?.data) {
                const parts = result.parsed.data.parts || (Array.isArray(result.parsed.data) ? result.parsed.data : []);
                if (parts.length > 0) samplePartId = parts[0]._id || parts[0].id;
            }
            if (r.path === '/api/v2/auctions' && result.parsed?.data) {
                const auctions = Array.isArray(result.parsed.data) ? result.parsed.data : result.parsed.data.auctions || [];
                if (auctions.length > 0) sampleAuctionId = auctions[0]._id || auctions[0].id;
            }
        }
    }

    // 2. فحص مسارات التفاصيل المحددة (Dynamic Detail Routes)
    console.log('\n🔍 [2/3] فحص مسارات التفاصيل الديناميكية (Dynamic Detail Routes):');
    console.log('-'.repeat(80));

    const dynamicRoutes = [];
    if (sampleCarId) {
        dynamicRoutes.push({ path: `/api/v2/cars/${sampleCarId}`, desc: `API تفاصيل السيارة (${sampleCarId})`, isJson: true });
        dynamicRoutes.push({ path: `/cars/${sampleCarId}`, desc: `صفحة تفاصيل السيارة (${sampleCarId})`, isJson: false });
    }
    if (samplePartId) {
        dynamicRoutes.push({ path: `/api/v2/parts/${samplePartId}`, desc: `API تفاصيل القطعة (${samplePartId})`, isJson: true });
        dynamicRoutes.push({ path: `/parts?highlight=${samplePartId}`, desc: `صفحة قطع الغيار مع القطعة (${samplePartId})`, isJson: false });
    }
    if (sampleAuctionId) {
        dynamicRoutes.push({ path: `/api/v2/auctions/${sampleAuctionId}`, desc: `API تفاصيل المزاد (${sampleAuctionId})`, isJson: true });
        dynamicRoutes.push({ path: `/auctions/${sampleAuctionId}`, desc: `صفحة تفاصيل المزاد (${sampleAuctionId})`, isJson: false });
    }

    let dynamicPassed = 0;
    for (const r of dynamicRoutes) {
        const result = await testRoute(r.path, r.isJson);
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.status} | ${result.duration.toString().padStart(4)}ms | ${r.path.padEnd(35)} | ${r.desc}`);
        if (result.success) dynamicPassed++;
    }

    // 3. فحص صفحات الواجهة الأمامية (Frontend Pages)
    console.log('\n🖥️ [3/3] فحص صفحات الواجهة العامة (Frontend Pages):');
    console.log('-'.repeat(80));

    const frontendRoutes = [
        { path: '/', desc: 'الصفحة الرئيسية (Home)' },
        { path: '/cars', desc: 'معرض السيارات' },
        { path: '/parts', desc: 'سوق قطع الغيار' },
        { path: '/auctions', desc: 'المزادات' },
        { path: '/auctions/live', desc: 'المزادات الحية المباشرة' },
        { path: '/showroom', desc: 'المعرض الكوري المباشر' },
        { path: '/brands', desc: 'دليل الوكالات والمصنعين' },
        { path: '/compare', desc: 'مقارنة السيارات' },
        { path: '/concierge', desc: 'الطلب المخصص (كونسيرج)' },
        { path: '/contact', desc: 'اتصل بنا' },
        { path: '/gallery', desc: 'معرض الصور' },
        { path: '/cart', desc: 'سلة المشتريات' },
        { path: '/favorites', desc: 'المفضلة' },
        { path: '/login', desc: 'تسجيل الدخول' },
        { path: '/register', desc: 'إنشاء حساب جديد' },
        { path: '/forgot-password', desc: 'استعادة كلمة المرور' },
        { path: '/privacy', desc: 'سياسة الخصوصية والشروط' },
        { path: '/support', desc: 'الدعم والمساعدة' },
        { path: '/robots.txt', desc: 'ملف محركات البحث (Robots)' },
        { path: '/sitemap.xml', desc: 'خريطة الموقع (Sitemap)' }
    ];

    let fePassed = 0;
    for (const r of frontendRoutes) {
        const result = await testRoute(r.path, false);
        const icon = result.success ? '✅' : '❌';
        console.log(`${icon} ${result.status} | ${result.duration.toString().padStart(4)}ms | ${r.path.padEnd(25)} | ${r.desc}`);
        if (result.success) fePassed++;
    }

    // ملخص النتائج
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص تقرير فحص مسارات النظام:');
    console.log(`- نقاط الـ API الخلفية:      ${apiPassed}/${apiRoutes.length} مسار يعمل بنجاح`);
    console.log(`- المسارات الديناميكية:       ${dynamicPassed}/${dynamicRoutes.length} مسار يعمل بنجاح`);
    console.log(`- صفحات الواجهة الأمامية:    ${fePassed}/${frontendRoutes.length} صفحة تعمل بنجاح`);
    const totalPassed = apiPassed + dynamicPassed + fePassed;
    const totalAll = apiRoutes.length + dynamicRoutes.length + frontendRoutes.length;
    console.log(`- النسبة الإجمالية:           ${((totalPassed / totalAll) * 100).toFixed(1)}% (${totalPassed}/${totalAll})`);
    console.log('='.repeat(80));
}

audit().catch(console.error);
