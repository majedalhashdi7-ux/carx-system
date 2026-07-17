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

        const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
        const success = await LiveAuctionSyncService.syncSession(session);

        if (!success) {
            return res.status(400).json({ success: false, error: 'لم نتمكن من كشط أي سيارات من هذا الرابط. يرجى التأكد من صحة الرابط أو إدخال السيارات يدوياً.' });
        }

        // جلب الجلسة المحدثة لضمان إرسال أحدث البيانات
        const updatedSession = await LiveAuction.findById(session._id);

        res.json({
            success: true,
            message: updatedSession.status === 'ended' 
                ? 'تم إيقاف المزاد المباشر لأن المزاد الخارجي قد انتهى.'
                : `تم استيراد وتحديث عدد ${updatedSession.cars.length} سيارات في جلسة المزاد بنجاح.`,
            data: updatedSession
        });

    } catch (error) {
        console.error('Error importing external auction cars:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
