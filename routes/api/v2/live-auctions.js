// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/live-auctions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { requireAuthAPI } = require('../../../middleware/auth');
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');

// GET /api/v2/live-auctions - Get all live auction sessions
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const LiveAuction = getModel(req, 'LiveAuction');
        const sessions = await LiveAuction.find(addTenantFilter(req, query)).sort({ startTime: -1, createdAt: -1 });
        res.json({ success: true, data: sessions });
    } catch (error) {
        console.error('Error fetching live auctions:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// GET /api/v2/live-auctions/sync-all - Run sync on all live auctions across all tenants (Cron/Admin)
router.get('/sync-all', async (req, res) => {
    try {
        const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
        const count = await LiveAuctionSyncService.syncAllSessions();
        res.json({
            success: true,
            message: `تم تحديث عدد ${count} من جلسات المزاد المباشر تلقائياً بنجاح.`,
            syncedSessions: count
        });
    } catch (error) {
        console.error('Error running live-auctions sync-all:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/v2/live-auctions/:id - Get specific session details
router.get('/:id', async (req, res) => {
    try {
        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error fetching live auction session:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/live-auctions - Create a new session (Admin)
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        // In a real app, check if user is admin
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = new LiveAuction({ ...req.body, tenantId: getTenantId(req) });
        await session.save();
        res.status(201).json({ success: true, data: session });
    } catch (error) {
        console.error('Error creating live auction session:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// PUT /api/v2/live-auctions/:id - Update session (Admin)
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOneAndUpdate(
            addTenantFilter(req, { _id: req.params.id }),
            req.body,
            { new: true }
        );
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error updating live auction session:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// DELETE /api/v2/live-auctions/:id - Delete session (Admin)
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOneAndDelete(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error('Error deleting live auction session:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/live-auctions/:id/start - Start session and notify all (Admin)
router.post('/:id/start', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const AdvancedNotification = getModel(req, 'AdvancedNotification');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        session.status = 'live';
        session.startTime = new Date();
        await session.save();

        // Broadcast notification to all users
        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🔥 المزاد المباشر بدأ الآن!',
            message: `انضم إلينا الآن في مزاد: ${session.title}. السيارات معروضة حالياً!`,
            actionUrl: `/auctions/live/${session._id}`,
            priority: 'URGENT',
            channels: ['IN_APP', 'PUSH']
        });

        res.json({ success: true, message: 'Auction started and users notified' });
    } catch (error) {
        console.error('Error starting live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/v2/live-auctions/:id/end - End session (Admin)
router.post('/:id/end', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const AdvancedNotification = getModel(req, 'AdvancedNotification');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        session.status = 'ended';
        session.endTime = new Date();
        await session.save();

        // Broadcast notification to all users
        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🏁 انتهى المزاد المباشر',
            message: `شكراً لمشاركتكم. انتهى مزاد ${session.title} بنجاح. ترقبوا المزادات القادمة!`,
            actionUrl: '/auctions',
            priority: 'MEDIUM',
            channels: ['IN_APP']
        });

        res.json({ success: true, message: 'Auction ended' });
    } catch (error) {
        console.error('Error ending live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/v2/live-auctions/:id/import-external - Import cars from session's externalUrl (Admin)
router.post('/:id/import-external', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        const url = session.externalUrl;
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ success: false, error: 'الرابط الخارجي للجلسة غير صالح أو فارغ. يرجى تحديث الرابط الخارجي أولاً.' });
        }

        const ScraperService = require('../../../services/ScraperService');
        const { processMany } = require('../../../services/externalImageService');
        const axios = require('axios');
        const cheerio = require('cheerio');

        // Helper function to scrape multiple cars from a list page
        const scrapeMultipleCars = async (targetUrl) => {
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

                // Resolve relative URLs
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

                // Filter out icons, logos, banners
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

            // Fallback to images with alt text if anchors had no text
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
        };

        let importedCars = [];

        // 1. Try to scrape as a single car detail page first
        try {
            const singleScraped = await ScraperService.scrapeUrl(url);
            if (singleScraped.success && singleScraped.data && singleScraped.data.images && singleScraped.data.images.length > 0) {
                // Ensure unique images
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
            console.warn('[ImportLive] Single page scrape attempt failed, moving to list scrape...', singleErr.message);
        }

        // 2. If single scrape didn't return a rich page, try list scrape
        if (importedCars.length === 0 || (importedCars[0].images.length <= 1 && !url.includes('encar.com/dc/dc_cardetail.do'))) {
            try {
                importedCars = await scrapeMultipleCars(url);
            } catch (listErr) {
                console.error('[ImportLive] List scrape failed:', listErr.message);
            }
        }

        if (importedCars.length === 0) {
            return res.status(400).json({ success: false, error: 'لم نتمكن من كشط أي سيارات من هذا الرابط. يرجى التأكد من صحة الرابط أو إدخال السيارات يدوياً.' });
        }

        // 3. Process and optimize images locally to ensure they don't break
        for (let car of importedCars) {
            if (car.images && car.images.length > 0) {
                try {
                    car.images = await processMany(car.images, 'auctions');
                } catch (imgErr) {
                    console.warn(`[ImportLive] Image processing failed for ${car.title}:`, imgErr.message);
                }
            }
        }

        // Save imported cars to the session
        session.cars = importedCars;
        await session.save();

        res.json({
            success: true,
            message: `تم استيراد وتحديث عدد ${importedCars.length} سيارات في جلسة المزاد بنجاح.`,
            data: session
        });

    } catch (error) {
        console.error('Error importing external auction cars:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
