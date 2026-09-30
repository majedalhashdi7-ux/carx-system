// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/bids.js) جزء من مشروع HM CAR

const express = require('express');
const router = express.Router();
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI } = require('../../../middleware/auth');

function normalizeMultiplier(value) {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : 1;
}

function applyMultiplier(amount, multiplier) {
    const safeAmount = Number(amount || 0);
    return Number((safeAmount * multiplier).toFixed(2));
}

function toBaseAmount(amount, multiplier) {
    const safeAmount = Number(amount || 0);
    return Number((safeAmount / multiplier).toFixed(2));
}

// الحصول على جميع مزايدات المستخدم
router.get('/my', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id || req.user.id;

        const Bid = getModel(req, 'Bid');
        const SiteSettings = getModel(req, 'SiteSettings');
        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const bids = await Bid.find(addTenantFilter(req, { userId }))
            .populate({
                path: 'auction',
                populate: { path: 'car', select: 'title make model year images' }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bids.map(b => ({
                id: b._id,
                amount: applyMultiplier(b.amount, auctionMultiplier),
                auction: b.auction,
                status: b.status || 'active',
                createdAt: b.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب المزايدات:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المزايدات' });
    }
});

// الحصول على مزايدات مزاد معين
router.get('/auction/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        const Bid = getModel(req, 'Bid');
        const SiteSettings = getModel(req, 'SiteSettings');
        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const bids = await Bid.find(addTenantFilter(req, { auction: auctionId }))
            .populate('userId', 'name')
            .sort({ amount: -1 })
            .limit(limit);

        res.json({
            success: true,
            data: bids.map(b => ({
                id: b._id,
                amount: applyMultiplier(b.amount, auctionMultiplier),
                bidder: {
                    id: b.userId?._id,
                    name: b.userId?.name ? b.userId.name.charAt(0) + '***' : 'مجهول'
                },
                createdAt: b.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب مزايدات المزاد:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المزايدات' });
    }
});

// إضافة مزايدة جديدة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const data = await require('../../../services/BiddingService').placeBid(req, req.body.auctionId, req.body.amount);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'فشل في تقديم المزايدة' });
    }
});

router.get('/highest/:auctionId', async (req, res) => {
    try {
        const { auctionId } = req.params;

        const Bid = getModel(req, 'Bid');
        const SiteSettings = getModel(req, 'SiteSettings');
        const settings = await SiteSettings.getSettings().catch(() => null);
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const highestBid = await Bid.findOne(addTenantFilter(req, { auction: auctionId }))
            .sort({ amount: -1 })
            .populate('userId', 'name');

        if (!highestBid) {
            return res.json({
                success: true,
                data: null,
                message: 'لا توجد مزايدات بعد'
            });
        }

        res.json({
            success: true,
            data: {
                id: highestBid._id,
                amount: applyMultiplier(highestBid.amount, auctionMultiplier),
                bidder: highestBid.userId?.name ? highestBid.userId.name.charAt(0) + '***' : 'مجهول',
                createdAt: highestBid.createdAt
            }
        });
    } catch (error) {
        console.error('خطأ في جلب أعلى مزايدة:', error);
        res.status(500).json({ success: false, error: 'فشل في الجلب' });
    }
});

module.exports = router;
