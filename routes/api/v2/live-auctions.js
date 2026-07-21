// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/live-auctions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { requireAuthAPI } = require('../../../middleware/auth');
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');

const JWT_SECRET = process.env.JWT_SECRET || 'hmcar_jwt_secret_key_2026_fallback';

// ─── GET /api/v2/live-auctions ─── جلب كل جلسات المزاد
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const LiveAuction = getModel(req, 'LiveAuction');
        let sessions = await LiveAuction.find(addTenantFilter(req, query)).sort({ startTime: -1, createdAt: -1 });

        const Car = getModel(req, 'Car');

        // ضمان أن الجلسات تحتوي على سيارات، وإن كانت فارغة نملؤها بالسيارات الكورية المستوردة تلقائياً
        for (const session of sessions) {
            if (!session.cars || session.cars.length === 0) {
                if (session.externalUrl && session.externalUrl.startsWith('http')) {
                    const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
                    await LiveAuctionSyncService.syncSession(session).catch(() => {});
                }
                const importedCars = await Car.find({
                    $or: [
                        { listingType: 'showroom' },
                        { source: 'korean_import' },
                        { externalUrl: { $regex: 'http', $options: 'i' } }
                    ]
                }).limit(40).lean().catch(() => []);

                if (importedCars && importedCars.length > 0) {
                    session.cars = importedCars.map(c => ({
                        title: c.title || `${c.make || ''} ${c.model || ''}`,
                        images: c.images?.length > 0 ? c.images : [c.img || c.image].filter(Boolean),
                        condition: 'مستعملة',
                        description: c.description || 'سيارة كورية مستوردة من المعرض المباشر',
                        priceEstimate: c.priceSar ? `${c.priceSar.toLocaleString('ar-SA')} ر.س` : (c.price ? `${c.price.toLocaleString('ar-SA')} ر.س` : 'تواصل معنا'),
                        lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
                        sourceUrl: c.externalUrl || ''
                    }));
                    await session.save().catch(() => {});
                }
            }
        }

        // إذا لم تكن هناك جلسات مزاد، ننشئ جلسة افتراضية ونربط سيارات كورية تلقائياً
        if (sessions.length === 0 && (!status || status === 'live')) {
            const defaultUrl = 'https://car.encar.com/list/car?search=%7B%22action%22%3A%22(And.Hidden.N._.CarType.A.)%22%7D';
            try {
                const importedCars = await Car.find({
                    $or: [
                        { listingType: 'showroom' },
                        { source: 'korean_import' },
                        { externalUrl: { $regex: 'http', $options: 'i' } }
                    ]
                }).limit(40).lean().catch(() => []);

                const defaultCars = (importedCars || []).map(c => ({
                    title: c.title || `${c.make || ''} ${c.model || ''}`,
                    images: c.images?.length > 0 ? c.images : [c.img || c.image].filter(Boolean),
                    condition: 'مستعملة',
                    description: c.description || 'سيارة كورية مستوردة من المعرض المباشر',
                    priceEstimate: c.priceSar ? `${c.priceSar.toLocaleString('ar-SA')} ر.س` : (c.price ? `${c.price.toLocaleString('ar-SA')} ر.س` : 'تواصل معنا'),
                    lotNumber: 'LOT-' + Math.floor(100000 + Math.random() * 900000),
                    sourceUrl: c.externalUrl || ''
                }));

                const defaultSession = new LiveAuction({
                    tenantId: getTenantId(req),
                    title: 'المزاد المباشر كوريا الجنوبية (Encar Live)',
                    externalUrl: defaultUrl,
                    status: 'live',
                    autoSync: true,
                    cars: defaultCars
                });
                await defaultSession.save();

                const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
                LiveAuctionSyncService.syncSession(defaultSession).catch(err => {
                    console.warn('[LiveAuctions] Background sync error:', err.message);
                });

                sessions = [defaultSession];
            } catch (seedErr) {
                console.warn('[LiveAuctions] Auto-seed failed:', seedErr.message);
            }
        }

        // إخفاء السيارات المختفية عن العملاء (إلا في وضع الأدمن)
        const isAdmin = req.headers.authorization && (() => {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                return ['admin', 'super_admin'].includes(decoded.role);
            } catch { return false; }
        })();

        const sessionsData = sessions.map(s => {
            const obj = s.toObject();
            if (!isAdmin) {
                // العملاء يرون فقط السيارات غير المخفية
                obj.cars = (obj.cars || []).filter(c => !c.isHidden);
            }
            return obj;
        });

        res.json({ success: true, data: sessionsData });
    } catch (error) {
        console.error('Error fetching live auctions:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// ─── GET /api/v2/live-auctions/sync-all ─── تشغيل التزامن التلقائي لكل الجلسات (Cron/Admin)
router.get('/sync-all', async (req, res) => {
    try {
        const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
        const result = await LiveAuctionSyncService.syncAllSessions();
        res.json({
            success: true,
            message: `تم تحديث عدد ${result.totalSynced} من جلسات المزاد. أخطاء: ${result.totalErrors}`,
            syncedSessions: result.totalSynced,
            errors: result.totalErrors
        });
    } catch (error) {
        console.error('Error running sync-all:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── GET /api/v2/live-auctions/:id ─── جلب تفاصيل جلسة محددة
router.get('/:id', async (req, res) => {
    try {
        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        const isAdmin = req.headers.authorization && (() => {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return ['admin', 'super_admin'].includes(decoded.role);
            } catch { return false; }
        })();

        const obj = session.toObject();
        if (!isAdmin) {
            obj.cars = (obj.cars || []).filter(c => !c.isHidden);
        }

        res.json({ success: true, data: obj });
    } catch (error) {
        console.error('Error fetching live auction session:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// ─── POST /api/v2/live-auctions ─── إنشاء جلسة جديدة (Admin)
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

// ─── PUT /api/v2/live-auctions/:id ─── تحديث جلسة (Admin)
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');

        // جلب الجلسة الحالية أولاً للحفاظ على بيانات السيارات
        const existing = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!existing) return res.status(404).json({ success: false, error: 'Session not found' });

        // لا نسمح بالكتابة فوق السيارات إلا إذا أُرسلت صراحةً
        const updateData = { ...req.body };
        if (!updateData.cars && existing.cars?.length > 0) {
            delete updateData.cars; // الحفاظ على السيارات الموجودة
        }

        const session = await LiveAuction.findOneAndUpdate(
            addTenantFilter(req, { _id: req.params.id }),
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error updating live auction session:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// ─── DELETE /api/v2/live-auctions/:id ─── حذف جلسة (Admin)
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

// ─── POST /api/v2/live-auctions/:id/start ─── تشغيل المزاد (Admin)
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

        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🔥 المزاد المباشر بدأ الآن!',
            message: `انضم إلينا الآن في مزاد: ${session.title}. السيارات معروضة حالياً!`,
            actionUrl: `/auctions/live/${session._id}`,
            priority: 'URGENT',
            channels: ['IN_APP', 'PUSH']
        });

        res.json({ success: true, message: 'Auction started and users notified', data: session });
    } catch (error) {
        console.error('Error starting live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── POST /api/v2/live-auctions/:id/end ─── إنهاء المزاد (Admin)
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

        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: '🏁 انتهى المزاد المباشر',
            message: `شكراً لمشاركتكم. انتهى مزاد ${session.title} بنجاح. ترقبوا المزادات القادمة!`,
            actionUrl: '/auctions',
            priority: 'MEDIUM',
            channels: ['IN_APP']
        });

        res.json({ success: true, message: 'Auction ended', data: session });
    } catch (error) {
        console.error('Error ending live auction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── POST /api/v2/live-auctions/:id/import-external ─── استيراد سيارات من الرابط الخارجي (Admin)
// يمكن تمرير externalUrl في body لتحديث رابط المزاد والاستيراد منه مباشرة
router.post('/:id/import-external', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        // السماح بتحديث الرابط من البودي مباشرة
        if (req.body.externalUrl && req.body.externalUrl.startsWith('http')) {
            session.externalUrl = req.body.externalUrl.trim();
        }

        const url = session.externalUrl;
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({
                success: false,
                error: 'الرابط الخارجي غير صالح أو فارغ. يرجى إضافة رابط المزاد الخارجي أولاً.'
            });
        }

        const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
        const ok = await LiveAuctionSyncService.syncSession(session);

        if (!ok) {
            return res.status(400).json({
                success: false,
                error: 'لم نتمكن من استخراج أي سيارات من هذا الرابط. يرجى التحقق من صحة الرابط.'
            });
        }

        const updatedSession = await LiveAuction.findById(session._id);
        const visibleCars = (updatedSession.cars || []).filter(c => !c.isHidden);
        const hiddenCars = (updatedSession.cars || []).filter(c => c.isHidden);

        res.json({
            success: true,
            message: updatedSession.status === 'ended'
                ? 'تم إيقاف المزاد المباشر لأن المزاد الخارجي قد انتهى.'
                : `✅ تم استيراد ${visibleCars.length} سيارة بنجاح. ${hiddenCars.length > 0 ? `(${hiddenCars.length} سيارة اختفت من المزاد وتم إخفاؤها)` : ''}`,
            data: updatedSession,
            stats: {
                visible: visibleCars.length,
                hidden: hiddenCars.length,
                total: updatedSession.cars?.length || 0
            }
        });

    } catch (error) {
        console.error('Error importing external auction cars:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── POST /api/v2/live-auctions/:id/sync ─── تحديث يدوي للمزاد (Admin)
// نفس وظيفة import-external لكن باسم أوضح
router.post('/:id/sync', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        if (req.body.externalUrl && req.body.externalUrl.startsWith('http')) {
            session.externalUrl = req.body.externalUrl.trim();
        }

        if (!session.externalUrl?.startsWith('http')) {
            return res.status(400).json({ success: false, error: 'لا يوجد رابط خارجي لهذه الجلسة' });
        }

        const LiveAuctionSyncService = require('../../../services/LiveAuctionSyncService');
        const ok = await LiveAuctionSyncService.syncSession(session);

        const updated = await LiveAuction.findById(session._id);
        const visible = (updated.cars || []).filter(c => !c.isHidden).length;
        const hidden = (updated.cars || []).filter(c => c.isHidden).length;

        res.json({
            success: ok,
            message: ok
                ? `✅ تم التحديث: ${visible} سيارة ظاهرة، ${hidden} سيارة مخفية`
                : 'لم يتم استخراج أي سيارات من الرابط',
            data: updated,
            stats: { visible, hidden, total: updated.cars?.length || 0 }
        });
    } catch (error) {
        console.error('Error syncing session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ─── PATCH /api/v2/live-auctions/:id/car/:carId ─── تحديث بيانات سيارة واحدة (Admin)
// يحافظ على البيانات المُعدَّلة يدوياً من الأدمن
router.patch('/:id/car/:carId', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const LiveAuction = getModel(req, 'LiveAuction');
        const session = await LiveAuction.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

        const carIdx = session.cars.findIndex(c => String(c._id) === req.params.carId);
        if (carIdx === -1) return res.status(404).json({ success: false, error: 'Car not found in session' });

        // تحديث الحقول المسموح بها فقط
        const allowed = ['title', 'condition', 'description', 'priceEstimate', 'lotNumber', 'auctionName', 'isHidden'];
        for (const field of allowed) {
            if (req.body[field] !== undefined) {
                session.cars[carIdx][field] = req.body[field];
            }
        }

        session.markModified('cars');
        await session.save();

        res.json({ success: true, data: session.cars[carIdx], message: 'تم تحديث بيانات السيارة' });
    } catch (error) {
        console.error('Error updating car in session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
