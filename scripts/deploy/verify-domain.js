#!/usr/bin/env node

/**
 * سكريبت التحقق من إعدادات الدومين
 * يفحص جميع الإعدادات والاتصالات
 */

const https = require('https');
const dns = require('dns').promises;

async function checkDNS(domain) {
    console.log(`\n🔍 فحص DNS لـ ${domain}...`);
    try {
        const addresses = await dns.resolve4(domain);
        console.log(`✅ DNS يعمل: ${addresses.join(', ')}`);
        return true;
    } catch (error) {
        console.log(`❌ DNS لا يعمل: ${error.message}`);
        return false;
    }
}

async function checkHTTPS(url) {
    console.log(`\n🔒 فحص HTTPS لـ ${url}...`);
    return new Promise((resolve) => {
        https.get(url, (res) => {
            console.log(`✅ HTTPS يعمل - Status: ${res.statusCode}`);
            resolve(true);
        }).on('error', (error) => {
            console.log(`❌ HTTPS لا يعمل: ${error.message}`);
            resolve(false);
        });
    });
}

async function checkAPI(baseUrl) {
    console.log(`\n🔌 فحص API لـ ${baseUrl}...`);
    return new Promise((resolve) => {
        https.get(`${baseUrl}/api/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✅ API يعمل:`, json);
                    resolve(true);
                } catch {
                    console.log(`⚠️  API يعمل لكن الاستجابة غير صحيحة`);
                    resolve(false);
                }
            });
        }).on('error', (error) => {
            console.log(`❌ API لا يعمل: ${error.message}`);
            resolve(false);
        });
    });
}

async function verifyDomain() {
    console.log('🌐 أداة التحقق من الدومين - HM CAR\n');
    console.log('═══════════════════════════════════════\n');

    // قراءة الدومين من .env
    require('dotenv').config();
    const baseUrl = process.env.BASE_URL || 'https://hmcar.okigo.net';
    const domain = baseUrl.replace(/^https?:\/\//, '');

    console.log(`📋 الدومين المستهدف: ${domain}`);
    console.log(`📋 URL الأساسي: ${baseUrl}\n`);

    const results = {
        dns: false,
        https: false,
        api: false,
        www: false
    };

    // فحص DNS
    results.dns = await checkDNS(domain);

    // فحص HTTPS
    if (results.dns) {
        results.https = await checkHTTPS(baseUrl);
    }

    // فحص API
    if (results.https) {
        results.api = await checkAPI(baseUrl);
    }

    // فحص WWW
    const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`;
    results.www = await checkDNS(wwwDomain);

    // النتيجة النهائية
    console.log('\n═══════════════════════════════════════');
    console.log('📊 ملخص النتائج:\n');
    console.log(`DNS:   ${results.dns ? '✅' : '❌'}`);
    console.log(`HTTPS: ${results.https ? '✅' : '❌'}`);
    console.log(`API:   ${results.api ? '✅' : '❌'}`);
    console.log(`WWW:   ${results.www ? '✅' : '❌'}`);
    console.log('═══════════════════════════════════════\n');

    const allPassed = Object.values(results).every(r => r);
    
    if (allPassed) {
        console.log('🎉 جميع الفحوصات نجحت! الدومين جاهز للاستخدام.\n');
    } else {
        console.log('⚠️  بعض الفحوصات فشلت. راجع التفاصيل أعلاه.\n');
        console.log('💡 نصائح:\n');
        if (!results.dns) {
            console.log('- تحقق من سجلات DNS في لوحة تحكم الدومين');
            console.log('- انتظر 24-48 ساعة لانتشار DNS\n');
        }
        if (!results.https) {
            console.log('- تحقق من إضافة الدومين في Vercel');
            console.log('- انتظر بضع دقائق لإصدار شهادة SSL\n');
        }
        if (!results.api) {
            console.log('- تحقق من Environment Variables في Vercel');
            console.log('- تحقق من إعدادات CORS\n');
        }
    }

    process.exit(allPassed ? 0 : 1);
}

// تشغيل السكريبت
verifyDomain().catch(error => {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
});
