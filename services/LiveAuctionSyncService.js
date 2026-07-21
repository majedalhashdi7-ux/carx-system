// [[ARABIC_HEADER]] هذا الملف (services/LiveAuctionSyncService.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const { getAllTenants } = require('../tenants/tenant-resolver');
const { getConnection } = require('../tenants/tenant-db-manager');
const ScraperService = require('./ScraperService');
const { downloadAndOptimize } = require('./externalImageService');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * ضغط وتحسين صور السيارة محلياً لجعلها خفيفة على النظام
 * - تحميل الصورة من الرابط الخارجي
 * - ضغطها إلى WebP بجودة جيدة وحجم صغير
 * - تخزينها محلياً أو في Cloudinary
 */
async function processCarImages(images = [], folder = 'auctions') {
    const results = [];
    // على Vercel بدون Cloudinary، نحافظ على الروابط الأصلية لكي لا تتعطل الصور وتصبح 404
    const hasCloud = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY;
    if (!hasCloud && process.env.VERCEL) {
        return images.filter(Boolean);
    }
    for (const imgUrl of images) {
        if (!imgUrl || typeof imgUrl !== 'string') continue;
        try {
            const optimized = await downloadAndOptimize(imgUrl, folder, {
                width: 900,
                height: 600,
                quality: 72  // جودة مُحسَّنة: أخف حجماً مع وضوح جيد
            });
            results.push(optimized || imgUrl);
        } catch (err) {
            console.warn(`[LiveSync] Image optimization failed for ${imgUrl}: ${err.message}`);
            results.push(imgUrl); // نبقي الرابط الأصلي كبديل
        }
    }
    return results.filter(Boolean);
}

/**
 * كشط سيارات متعددة من صفحة قائمة مزاد (List Page Scrape)
 * يستخرج البيانات من أي صفحة HTML وتصفية الصور غير المناسبة
 */
async function scrapeMultipleCars(targetUrl) {
    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8,ko;q=0.7'
        },
        timeout: 25000
    });
    const $ = cheerio.load(response.data);
    const items = [];
    const seenImages = new Set();

    // كلمات مفتاحية لتصفية الصور غير المرغوبة
    const excludePatterns = [
        'logo', 'icon', 'favicon', 'sprite', 'pixel', 'tracking',
        'banner', 'ad_', 'advertisement', '.svg', '1x1', 'spacer',
        'avatar', 'profile', 'thumbnail_placeholder'
    ];

    function resolveUrl(src) {
        if (!src) return null;
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) {
            try {
                const urlObj = new URL(targetUrl);
                return `${urlObj.origin}${src}`;
            } catch { return null; }
        }
        return src.startsWith('http') ? src : null;
    }

    function isValidImage(src) {
        if (!src || !src.startsWith('http')) return false;
        if (seenImages.has(src)) return false;
        const lowerSrc = src.toLowerCase();
        return !excludePatterns.some(p => lowerSrc.includes(p));
    }

    // استخراج اسم المزاد من الرابط
    const auctionName = targetUrl.includes('copart') ? 'Copart' 
        : targetUrl.includes('encar') ? 'Encar' 
        : targetUrl.includes('lotte') ? 'Lotte' 
        : targetUrl.includes('iaai') ? 'IAAI'
        : new URL(targetUrl).hostname.replace('www.', '');

    const seenUrls = new Set();
    const excludeTitles = ['السيارات', 'مسح الكل', 'الرئيسية', 'معرض الصور', 'تواصل معنا', 'اتصل بنا', 'home', 'cars', 'clear all', 'بحث'];

    $('article, .car-card, .vehicle-card, .product, .inventory-item, div[class*="car"], a[href*="/cars/"]').each((i, element) => {
        const link = $(element).is('a') ? $(element) : $(element).find('a').first();
        let href = link.attr('href');
        if (!href) return;

        let fullHref = href.startsWith('http') ? href : (() => { try { return new URL(href, targetUrl).href; } catch { return href; } })();
        if (seenUrls.has(fullHref)) return;

        const img = $(element).find('img').first().length ? $(element).find('img').first() : link.find('img').first();
        let imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('data-original');
        const srcset = img.attr('srcset');
        if (!imgSrc && srcset) {
            imgSrc = srcset.split(',')[0].split(' ')[0];
        }
        imgSrc = resolveUrl(imgSrc);

        let titleText = ($(element).find('h1, h2, h3, h4, .title, .car-title, .entry-title').text().trim() 
            || img.attr('alt') 
            || link.attr('title') 
            || link.text().trim() 
            || '').replace(/\s+/g, ' ').trim();

        if (titleText.length < 4) return;
        const lowerTitle = titleText.toLowerCase();
        if (excludeTitles.some(t => lowerTitle === t.toLowerCase())) return;

        let priceText = $(element).find('.price, .amount, .car-price, [class*="price"]').first().text().trim();
        if (!priceText) priceText = 'اتصل بنا لمعرفة السعر';

        seenUrls.add(fullHref);
        items.push({
            title: titleText,
            images: imgSrc ? [imgSrc] : [],
            condition: 'مستعملة',
            description: `سيارة مستوردة تلقائياً من مزاد ${auctionName}`,
            priceEstimate: priceText,
            lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
            auctionName,
            sourceUrl: fullHref
        });
    });

    return items.slice(0, 150);
}

/**
 * مزامنة سيارات جلسة مزاد واحدة
 * - يحافظ على البيانات المُعدَّلة يدوياً (lotNumber, priceEstimate, condition)
 * - يخفي السيارات التي اختفت ويضيف السيارات الجديدة
 * - يضغط الصور قبل الحفظ
 */
async function syncSession(session) {
    const url = session.externalUrl;
    if (!url || !url.startsWith('http')) {
        console.log(`[LiveSync] Skipping session ${session._id} — invalid URL`);
        return false;
    }

    console.log(`[LiveSync] Starting sync for session: ${session._id} (${session.title}) → ${url}`);

    // فحص انتهاء المزاد للمنصات الكبرى فقط
    const isMajorPlatform = ['copart.com', 'iaai.com', 'encar.com'].some(d => url.includes(d));
    if (isMajorPlatform) {
        try {
            const resp = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                timeout: 15000
            });
            const $ = cheerio.load(resp.data);
            const pageText = $.text().toLowerCase();
            const endedKeywords = ['auction ended', 'auction closed', '종료', 'انتهى المزاد', 'sale completed', 'lot sold'];
            if (endedKeywords.some(kw => pageText.includes(kw))) {
                console.log(`[LiveSync] Auction ended for session ${session._id}`);
                session.status = 'ended';
                session.endTime = new Date();
                await session.save();
                return true;
            }
        } catch (err) {
            if (err.response?.status === 404 || err.response?.status === 410) {
                console.log(`[LiveSync] URL returned ${err.response.status} for session ${session._id} — marking ended`);
                session.status = 'ended';
                session.endTime = new Date();
                await session.save();
                return true;
            }
            console.warn(`[LiveSync] Failed to check auction status: ${err.message}`);
        }
    }

    let scrapedCars = [];

    // محاولة 1: استخراج سيارة واحدة من صفحة تفاصيل
    const isListPage = /\/list|\/cars|car_type=|search=|page=|\/search|\/listing/.test(url);
    if (!isListPage) {
        try {
            const singleResult = await ScraperService.scrapeUrl(url);
            if (singleResult.success && singleResult.data?.images?.length > 0) {
                scrapedCars.push({
                    title: singleResult.data.title || 'سيارة مستوردة',
                    images: Array.from(new Set(singleResult.data.images)),
                    condition: 'مستعملة',
                    description: singleResult.data.description || 'تفاصيل مستوردة من الرابط الخارجي.',
                    priceEstimate: singleResult.data.price ? `${singleResult.data.price.toLocaleString('ar-SA')} ر.س` : 'اتصل بنا',
                    lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
                    auctionName: url.includes('copart') ? 'Copart' : url.includes('encar') ? 'Encar' : 'مستورد',
                    sourceUrl: url
                });
            }
        } catch (err) {
            console.warn(`[LiveSync] Single page scrape failed: ${err.message}`);
        }
    }

    // محاولة 2: كشط قائمة سيارات
    if (scrapedCars.length === 0) {
        try {
            scrapedCars = await scrapeMultipleCars(url);
        } catch (err) {
            console.error(`[LiveSync] List scrape failed: ${err.message}`);
        }
    }

    // إذا لم تُستخرج أي سيارات
    if (scrapedCars.length === 0) {
        console.warn(`[LiveSync] No cars scraped for session ${session._id}`);
        return false;
    }

    // ضغط وتحسين الصور
    console.log(`[LiveSync] Processing images for ${scrapedCars.length} cars...`);
    for (const car of scrapedCars) {
        if (car.images?.length > 0) {
            car.images = await processCarImages(car.images, 'auctions');
        }
    }

    // === منطق الحفاظ على البيانات + تتبع السيارات المختفية ===
    // نحافظ على السيارات الموجودة ونضيف الجديدة فقط
    const existingCarsMap = new Map();
    const hiddenCarsMap = new Map();

    if (session.cars?.length > 0) {
        for (const c of session.cars) {
            // السيارات المخفية (isHidden=true) تُحفظ في خريطة منفصلة
            if (c.isHidden) {
                hiddenCarsMap.set(c.sourceUrl || c.lotNumber || c.title, c);
            } else {
                existingCarsMap.set(c.sourceUrl || c.lotNumber || c.title, c);
            }
        }
    }

    // تحديد السيارات الجديدة والمحدَّثة
    const scrapedKeys = new Set();
    const updatedCars = [];

    for (const scraped of scrapedCars) {
        const key = scraped.sourceUrl || scraped.lotNumber || scraped.title;
        scrapedKeys.add(key);

        if (existingCarsMap.has(key)) {
            // ✅ سيارة موجودة: نحدّث الصور فقط ونحافظ على بقية البيانات المُعدَّلة يدوياً
            const existing = existingCarsMap.get(key);
            updatedCars.push({
                ...existing.toObject ? existing.toObject() : existing,
                // تحديث الصور إذا جاءت جديدة (وليست روابط خارجية فقط)
                images: scraped.images?.length > 0 ? scraped.images : existing.images,
                isHidden: false, // إعادة إظهار السيارة إذا كانت مخفية
                lastSyncedAt: new Date()
            });
        } else if (hiddenCarsMap.has(key)) {
            // سيارة كانت مخفية وظهرت مجدداً: نعيد إظهارها
            const hidden = hiddenCarsMap.get(key);
            updatedCars.push({
                ...hidden.toObject ? hidden.toObject() : hidden,
                images: scraped.images?.length > 0 ? scraped.images : hidden.images,
                isHidden: false,
                lastSyncedAt: new Date()
            });
        } else {
            // ✅ سيارة جديدة: نضيفها
            updatedCars.push({
                ...scraped,
                isHidden: false,
                lastSyncedAt: new Date()
            });
        }
    }

    // إضافة السيارات التي اختفت (كمخفية بدلاً من الحذف)
    for (const [key, existing] of existingCarsMap) {
        if (!scrapedKeys.has(key)) {
            updatedCars.push({
                ...existing.toObject ? existing.toObject() : existing,
                isHidden: true, // إخفاء السيارة من العميل لكن احتفاظها في النظام
                disappearedAt: new Date()
            });
            console.log(`[LiveSync] Car hidden (disappeared from auction): ${existing.title}`);
        }
    }

    // حفظ النتائج
    session.cars = updatedCars;
    session.lastSyncedAt = new Date();
    await session.save();

    // حفظ وتحديث السيارات المستوردة أيضاً في مجموعة Car المستقلة لتظهر للأدمن في قسم السيارات والمعرض
    try {
        const Car = session.db ? session.db.model('Car') : null;
        if (Car && updatedCars.length > 0) {
            for (const c of updatedCars) {
                if (c.isHidden) continue;
                const carTitle = c.title || 'سيارة مزاد كورية';
                await Car.findOneAndUpdate(
                    { title: carTitle },
                    {
                        $set: {
                            tenantId: session.tenantId,
                            title: carTitle,
                            make: c.make || 'وارد كوريا',
                            model: c.model || 'مزاد مباشر',
                            year: c.year || 2023,
                            price: c.price || 0,
                            priceSar: c.priceSar || 0,
                            images: c.images || [],
                            img: c.images?.[0] || '',
                            image: c.images?.[0] || '',
                            listingType: 'showroom',
                            source: 'korean_import',
                            externalUrl: c.sourceUrl || session.externalUrl,
                            isActive: true,
                            isSold: false,
                        }
                    },
                    { upsert: true, new: true }
                ).catch(() => {});
            }
        }
    } catch (carErr) {
        console.warn('[LiveSync] Failed to upsert Car documents:', carErr.message);
    }

    const visibleCount = updatedCars.filter(c => !c.isHidden).length;
    const hiddenCount = updatedCars.filter(c => c.isHidden).length;
    console.log(`[LiveSync] ✅ Session ${session._id} synced: ${visibleCount} visible, ${hiddenCount} hidden`);
    return true;
}

/**
 * مزامنة جلسة مزاد عبر رابط مباشر (يُستخدم لإنشاء جلسة جديدة أو تحديثها)
 */
async function syncSessionByUrl(externalUrl, session) {
    const tempSession = session;
    tempSession.externalUrl = externalUrl;
    return syncSession(tempSession);
}

/**
 * تحديث كل جلسات المزاد المباشر عبر جميع قواعد بيانات المعارض
 * يُشغَّل كل 24 ساعة تلقائياً (Cron Job)
 */
async function syncAllSessions() {
    console.log(`\n============================================`);
    console.log(`[LiveSync] Starting global auto-sync...`);
    console.log(`============================================`);

    const tenants = getAllTenants();
    let totalSynced = 0;
    let totalErrors = 0;

    for (const tenant of tenants) {
        try {
            console.log(`\n[LiveSync] Processing tenant: ${tenant.id}`);
            const { models } = await getConnection(tenant.id, tenant.mongoUri);

            if (!models.LiveAuction) {
                console.log(`[LiveSync] LiveAuction model not found for: ${tenant.id}`);
                continue;
            }

            const activeSessions = await models.LiveAuction.find({
                status: { $in: ['upcoming', 'live'] },
                externalUrl: { $regex: /^https?:\/\// },
                autoSync: true
            });

            console.log(`[LiveSync] Found ${activeSessions.length} auto-sync sessions for ${tenant.id}`);

            for (const session of activeSessions) {
                try {
                    const ok = await syncSession(session);
                    if (ok) totalSynced++;
                } catch (err) {
                    console.error(`[LiveSync] Error for session ${session._id}:`, err.message);
                    totalErrors++;
                }
            }
        } catch (err) {
            console.error(`[LiveSync] Tenant ${tenant.id} error:`, err.message);
            totalErrors++;
        }
    }

    console.log(`\n============================================`);
    console.log(`[LiveSync] Done. Synced: ${totalSynced}, Errors: ${totalErrors}`);
    console.log(`============================================\n`);

    return { totalSynced, totalErrors };
}

module.exports = {
    syncSession,
    syncSessionByUrl,
    syncAllSessions
};
