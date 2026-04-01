/**
 * fix-via-api.js
 * يصلح البيانات عبر API الموقع الحي مباشرة
 * لا يحتاج اتصال مباشر بـ MongoDB
 */

const https = require('https');

const BASE_URL = 'https://hmcar.okigo.net';

// ── بيانات الأدمن ──
const ADMIN_EMAIL = 'admin@hmcar.com';
const ADMIN_PASSWORD = 'HmCar@2026';

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const url = new URL(BASE_URL + path);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, data: raw }); }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginRes = await request('POST', '/api/v2/auth/login', {
        identifier: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
    });

    if (!loginRes.data?.token) {
        console.error('❌ فشل تسجيل الدخول:', JSON.stringify(loginRes.data));
        process.exit(1);
    }

    const token = loginRes.data.token;
    console.log('✅ تم تسجيل الدخول');

    // 2. جلب السيارات وإصلاح السنة
    console.log('\n📅 جلب السيارات لإصلاح السنة...');
    let fixedCount = 0;
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const carsRes = await request('GET', `/api/v2/cars?limit=50&page=${page}`, null, token);
        const cars = carsRes.data?.data?.cars || [];
        totalPages = carsRes.data?.data?.pagination?.pages || 1;

        console.log(`   صفحة ${page}/${totalPages} - ${cars.length} سيارة`);

        for (const car of cars) {
            if (car.year > 9999) {
                const correctYear = Math.floor(car.year / 100);
                const updateRes = await request('PUT', `/api/v2/cars/${car.id}`, {
                    year: correctYear
                }, token);

                if (updateRes.status === 200) {
                    fixedCount++;
                    process.stdout.write(`\r   تم إصلاح ${fixedCount} سيارة...`);
                }
            }
        }
        page++;
    }
    console.log(`\n   ✅ تم إصلاح ${fixedCount} سيارة`);

    // 3. إصلاح المزادات - جلبها وإغلاق المنتهية
    console.log('\n🔨 إصلاح المزادات...');
    const auctionsRes = await request('GET', '/api/v2/auctions?status=running&limit=50', null, token);
    const auctions = auctionsRes.data?.data || [];
    const now = new Date();
    let endedCount = 0;

    for (const auction of auctions) {
        if (new Date(auction.endsAt) < now) {
            const updateRes = await request('PUT', `/api/v2/auctions/${auction.id}`, {
                status: 'ended'
            }, token);
            if (updateRes.status === 200) endedCount++;
        }
    }
    console.log(`   ✅ تم إغلاق ${endedCount} مزاد منتهي`);

    // 4. إصلاح رابط الواتساب
    console.log('\n📱 إصلاح رابط الواتساب...');
    const settingsRes = await request('GET', '/api/v2/settings/public', null, token);
    const currentWhatsapp = settingsRes.data?.data?.socialLinks?.whatsapp || '';
    console.log(`   الحالي: ${currentWhatsapp}`);

    const cleanNumber = currentWhatsapp
        .replace('https://wa.me/', '')
        .replace(/[+\-\s]/g, '');
    const correctUrl = `https://wa.me/${cleanNumber}`;

    const updateSettingsRes = await request('PUT', '/api/v2/settings/social-links', {
        socialLinks: {
            ...settingsRes.data?.data?.socialLinks,
            whatsapp: correctUrl
        }
    }, token);

    if (updateSettingsRes.status === 200) {
        console.log(`   ✅ تم التصحيح إلى: ${correctUrl}`);
    } else {
        console.log(`   ⚠️ الحالة: ${updateSettingsRes.status}`);
    }

    // ملخص
    console.log('\n─────────────────────────────────');
    console.log('✅ اكتملت جميع الإصلاحات:');
    console.log(`   • سنة السيارات: ${fixedCount} سيارة`);
    console.log(`   • المزادات المغلقة: ${endedCount}`);
    console.log(`   • الواتساب: تم`);
    console.log('─────────────────────────────────');
}

run().catch(err => {
    console.error('❌ خطأ:', err.message);
    process.exit(1);
});
