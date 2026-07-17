// [[ARABIC_HEADER]] هذا الملف (services/LiveAuctionSyncService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { getAllTenants } = require('../tenants/tenant-resolver');
const { getConnection } = require('../tenants/tenant-db-manager');
const ScraperService = require('./ScraperService');
const { processMany } = require('./externalImageService');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * دالة كشط سيارات متعددة من صفحة قائمة (List Scrape)
 */
async function scrapeMultipleCars(targetUrl) {
    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8,ko;q=0.7'
        },
        timeout: 20000
    });
    const $ = cheerio.load(response.data);
    const items = [];
    const seenImages = new Set();

    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const img = $(el).find('img').first();
        let imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-original') || img.attr('data-lazy-src');
        if (!imgSrc) return;

        // حل روابط المسارات النسبية
        if (imgSrc.startsWith('//')) {
            imgSrc = 'https:' + imgSrc;
        } else if (imgSrc.startsWith('/')) {
            try {
                const urlObj = new URL(targetUrl);
                imgSrc = `${urlObj.origin}${imgSrc}`;
            } catch(e) { return; }
        }

        if (!imgSrc.startsWith('http') || seenImages.has(imgSrc)) return;

        const titleText = $(el).text().trim() || $(el).attr('title') || img.attr('alt') || '';
        if (titleText.length < 5) return;

        // فلترة الصور غير المرغوبة كالشعارات والأيقونات والإعلانات
        const lowerSrc = imgSrc.toLowerCase();
        const excludePatterns = ['logo', 'icon', 'favicon', 'sprite', 'pixel', 'tracking', 'banner', 'ad_', 'advertisement', '.svg', '1x1', 'spacer'];
        if (excludePatterns.some(p => lowerSrc.includes(p))) return;

        seenImages.add(imgSrc);
        items.push({
            title: titleText.replace(/\s+/g, ' ').trim(),
            images: [imgSrc],
            condition: 'مستعملة',
            description: 'سيارة مستوردة تلقائياً من مزاد خارجي',
            priceEstimate: 'اتصل بنا لمعرفة السعر',
            lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
            auctionName: targetUrl.includes('copart') ? 'Copart' : targetUrl.includes('encar') ? 'Encar' : 'Lotte'
        });
    });

    // استخدام صور alt في حال لم تكن النصوص متوفرة
    if (items.length === 0) {
        $('img').each((i, el) => {
            let src = $(el).attr('src') || $(el).attr('data-src');
            if (!src) return;

            if (src.startsWith('//')) {
                src = 'https:' + src;
            } else if (src.startsWith('/')) {
                try {
                    const urlObj = new URL(targetUrl);
                    src = `${urlObj.origin}${src}`;
                } catch(e) { return; }
            }

            if (!src.startsWith('http') || seenImages.has(src)) return;

            const lowerSrc = src.toLowerCase();
            const excludePatterns = ['logo', 'icon', 'favicon', 'sprite', 'pixel', 'tracking', 'banner', 'ad_', 'advertisement', '.svg', '1x1', 'spacer'];
            if (excludePatterns.some(p => lowerSrc.includes(p))) return;

            const titleText = $(el).attr('alt') || $(el).attr('title') || '';
            if (titleText.length > 5) {
                seenImages.add(src);
                items.push({
                    title: titleText.trim(),
                    images: [src],
                    condition: 'مستعملة',
                    description: 'سيارة مستوردة تلقائياً من صور المزاد',
                    priceEstimate: 'اتصل بنا',
                    lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
                    auctionName: 'مستورد'
                });
            }
        });
    }

    return items.slice(0, 30);
}

/**
 * تحديث سيارات المزاد لجلسة محددة
 */
async function syncSession(session) {
    const url = session.externalUrl;
    if (!url || !url.startsWith('http')) {
        console.log(`[Cron Sync] Skipping session ${session._id} — invalid or empty URL`);
        return false;
    }

    console.log(`[Cron Sync] Syncing session ${session._id} (${session.title}) from URL: ${url}`);
    
    // فحص ما إذا كان المزاد الخارجي قد انتهى
    let hasEnded = false;
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8,ko;q=0.7'
            },
            timeout: 20000
        });
        const $ = cheerio.load(response.data);
        const pageText = $.text().toLowerCase();
        
        // كلمات تدل على انتهاء المزاد (عربي، إنجليزي، كوري)
        hasEnded = ['ended', 'closed', '종료', 'انتهى', 'مغلق', 'complete', 'finished', 'expired', 'sale complete'].some(kw => pageText.includes(kw));
    } catch (err) {
        console.warn(`[Cron Sync] Fetch failed while checking ended status for session ${session._id}:`, err.message);
        if (err.response && (err.response.status === 404 || err.response.status === 410)) {
            hasEnded = true;
        }
    }

    if (hasEnded) {
        console.log(`[Cron Sync] Live auction has ended for session ${session._id}. Stopping auction.`);
        session.status = 'ended';
        session.endTime = new Date();
        await session.save();
        return true;
    }

    let importedCars = [];

    // 1. محاولة الكشط كصفحة تفاصيل سيارة واحدة أولاً
    try {
        const singleScraped = await ScraperService.scrapeUrl(url);
        if (singleScraped.success && singleScraped.data && singleScraped.data.images && singleScraped.data.images.length > 0) {
            const uniqueImages = Array.from(new Set(singleScraped.data.images));
            importedCars.push({
                title: singleScraped.data.title || 'سيارة مستوردة',
                images: uniqueImages,
                condition: 'مستعملة نظيفة',
                description: singleScraped.data.description || 'تفاصيل مستوردة من الرابط الخارجي مباشرة.',
                priceEstimate: singleScraped.data.price ? `${singleScraped.data.price.toLocaleString('ar-SA')} ر.س` : 'اتصل بنا',
                lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
                auctionName: url.includes('copart') ? 'Copart' : url.includes('encar') ? 'Encar' : 'Lotte'
            });
        }
    } catch (singleErr) {
        console.warn(`[Cron Sync] Single page scrape attempt failed for ${session._id}:`, singleErr.message);
    }

    // 2. إذا لم ترجع الصفحة تفاصيل غنية، كشط القائمة كسيارات متعددة
    if (importedCars.length === 0 || (importedCars[0].images.length <= 1 && !url.includes('encar.com/dc/dc_cardetail.do'))) {
        try {
            importedCars = await scrapeMultipleCars(url);
        } catch (listErr) {
            console.error(`[Cron Sync] List scrape failed for ${session._id}:`, listErr.message);
        }
    }

    // إذا اختفت كل السيارات وكان المزاد يحتوي على سيارات سابقاً، فهذا يعني أن المزاد قد انتهى أو تمت تصفيته
    if (importedCars.length === 0 && session.cars && session.cars.length > 0) {
        console.log(`[Cron Sync] Session ${session._id} has no cars remaining. Stopping auction.`);
        session.status = 'ended';
        session.endTime = new Date();
        await session.save();
        return true;
    }

    if (importedCars.length === 0) {
        console.warn(`[Cron Sync] No cars scraped for session ${session._id}`);
        return false;
    }

    // 3. معالجة وتحسين الصور محلياً
    for (let car of importedCars) {
        if (car.images && car.images.length > 0) {
            try {
                car.images = await processMany(car.images, 'auctions');
            } catch (imgErr) {
                console.warn(`[Cron Sync] Image processing failed for ${car.title}:`, imgErr.message);
            }
        }
    }

    // حفظ السيارات الجديدة في الجلسة (السيارات التي اختفت سيتم حذفها تلقائياً لأن القائمة تُستبدل بالكامل)
    session.cars = importedCars;
    await session.save();
    console.log(`[Cron Sync] Successfully synced ${importedCars.length} cars for session ${session._id}`);
    return true;
}

/**
 * تحديث كل جلسات المزاد المباشر عبر جميع قواعد بيانات المعارض
 */
async function syncAllSessions() {
    console.log(`\n========================================`);
    console.log(`[Cron Sync] Starting global Live Auction auto-sync...`);
    console.log(`========================================`);

    const tenants = getAllTenants();
    let totalSynced = 0;

    for (const tenant of tenants) {
        try {
            console.log(`\n[Cron Sync] Processing tenant: ${tenant.id}`);
            const { connection, models } = await getConnection(tenant.id, tenant.mongoUri);
            
            if (!models.LiveAuction) {
                console.log(`[Cron Sync] LiveAuction model not found for tenant: ${tenant.id}`);
                continue;
            }

            // جلب كل الجلسات الحالية أو القادمة التي تحتوي على رابط استيراد خارجي ومفعل لها المزامنة التلقائية
            const activeSessions = await models.LiveAuction.find({
                status: { $in: ['upcoming', 'live'] },
                externalUrl: { $regex: /^https?:\/\// },
                autoSync: true
            });

            console.log(`[Cron Sync] Found ${activeSessions.length} active sessions with externalUrl for tenant: ${tenant.id}`);

            for (const session of activeSessions) {
                try {
                    const success = await syncSession(session);
                    if (success) totalSynced++;
                } catch (sessionErr) {
                    console.error(`[Cron Sync] Error syncing session ${session._id} for tenant ${tenant.id}:`, sessionErr.message);
                }
            }

        } catch (tenantErr) {
            console.error(`[Cron Sync] Failed to connect/sync database for tenant ${tenant.id}:`, tenantErr.message);
        }
    }

    console.log(`\n========================================`);
    console.log(`[Cron Sync] Sync completed successfully. Total sessions synced: ${totalSynced}`);
    console.log(`========================================\n`);
    
    return totalSynced;
}

module.exports = {
    syncSession,
    syncAllSessions
};
