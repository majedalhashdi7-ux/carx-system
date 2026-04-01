// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/live-auction-requests.js) مسؤول عن إدارة طلبات الشراء المباشرة من المزاد (Proxy Bidding).
const express = require('express');
const router = express.Router();
const LiveAuctionRequest = require('../../../models/LiveAuctionRequest');
const Invoice = require('../../../models/Invoice');
const AdvancedNotification = require('../../../models/AdvancedNotification');
const { requireAuthAPI } = require('../../../middleware/auth'); // Optionally require if guest can bid

// ==========================================
// [[ARABIC_COMMENT]] إضافة طلب مزايدة جديد
// يقوم العميل بالضغط على (يطلب المزايدة) من النظام. يتم هنا حفظ الطلب في القاعدة
// ثم إرسال إشعار فوري وتنبيه للمشرفين لقبول أو رفض الطلب.
// ==========================================
router.post('/', async (req, res) => {
    try {
        const { session, sessionTitle, car, guestName, guestPhone, userId } = req.body;
        
        const newReq = new LiveAuctionRequest({
            session,
            sessionTitle,
            car,
            guestName,
            guestPhone,
            user: userId || null
        });

        await newReq.save();

        // Notify Admins
        await AdvancedNotification.broadcast({
            type: 'AUCTION',
            title: 'طلب مزايدة مباشـر جديد! 🚀',
            message: `طلب مزايدة من ${guestName} على سيارة: ${car.title}`,
            actionUrl: `/admin/live-auctions/requests`,
            priority: 'URGENT',
            channels: ['IN_APP']
        });

        res.status(201).json({ success: true, data: newReq });
    } catch (error) {
        console.error('Error creating live auction request:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// [[ARABIC_COMMENT]] استعراض وجلب الطلبات
// إذا كان المستخدم أدمن: يرى جميع الطلبات لجميع العملاء.
// إذا كان عميل عادي: يرى فقط الطلبات التي تخصه بناءً على معرف الحساب الخاص به.
// ==========================================
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            query.user = req.user._id; // Normal user only sees their own
        } else if (req.query.sessionId) {
            query.session = req.query.sessionId;
        }

        const requests = await LiveAuctionRequest.find(query).sort({ createdAt: -1 }).populate('session', 'title status').populate('invoice');
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// ==========================================
// [[ARABIC_COMMENT]] تحديث حالة الطلب وإصدار الفواتير
// يمكن للمشرف تحديث الحالة (موافق، مرفوض، زبون خسر المزاد، زبون فاز).
// الأهم: إذا كانت الحالة "won" (فوز) سيقوم النظام أوتوماتيكياً بإصدار فاتورة مبدئية مسودة!
// يربط فيها اسم العميل والسيارة وسعر الفوز لكي يقوم المشرف باستكمال رسومها لاحقاً.
// ==========================================
router.put('/:id/status', requireAuthAPI, async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const { status, agreedMaxPrice, finalPurchasePrice, adminNotes } = req.body;
        const request = await LiveAuctionRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ success: false, error: 'Not found' });

        request.status = status;
        if (agreedMaxPrice !== undefined) request.agreedMaxPrice = agreedMaxPrice;
        if (finalPurchasePrice !== undefined) request.finalPurchasePrice = finalPurchasePrice;
        if (adminNotes !== undefined) request.adminNotes = adminNotes;

        // If WON, auto generate invoice
        if (status === 'won' && !request.invoice) {
            const invoiceNumber = 'INV-LIV-' + Date.now().toString().slice(-6);
            
            const newInvoice = new Invoice({
                invoiceNumber,
                buyerName: request.guestName,
                buyerPhone: request.guestPhone,
                items: [{
                    description: `السيارة: ${request.car.title} (المزاد המباشر: ${request.sessionTitle})`,
                    qty: 1,
                    unitPriceKrw: finalPurchasePrice || agreedMaxPrice || 0,
                    unitPriceUsd: 0,
                    unitPriceSar: 0
                }],
                totalKrw: finalPurchasePrice || agreedMaxPrice || 0,
                createdBy: req.user._id,
                notes: 'تمت المزايدة بنجاح من خلال نظام المزاد המباشر - Proxy Bidding',
                status: 'draft' // keep draft so admin can adjust fees
            });
            await newInvoice.save();
            request.invoice = newInvoice._id;
        }

        await request.save();

        if (request.user) {
            let notifTitle = 'تحديث المزايدة';
            let notifMsg = `تم تحديث حالة طلب المزايدة الخاصة بك على ${request.car.title}`;
            let prio = 'normal';
            
            if (status === 'approved') {
                notifTitle = 'موافقة على المزايدة!';
                notifMsg = `تم الموافقة على المزايدة الخاصة بك على سيارة ${request.car.title} بحد أقصى ${agreedMaxPrice || 'متفق عليه'} KRW.`;
                prio = 'high';
            } else if (status === 'won') {
                notifTitle = 'مبروك! فوز بالمزاد 🏆';
                notifMsg = `لقد فزت بمزاد السيارة ${request.car.title}. تم إصدار فاتورة مبدئية يرجى الاطلاع عليها.`;
                prio = 'high';
            } else if (status === 'lost') {
                notifTitle = 'خسارة المزاد';
                notifMsg = `للأسف خسرنا المزاد على سيارة ${request.car.title}. حظ أوفر في المرات القادمة!`;
            } else if (status === 'rejected') {
                notifTitle = 'رفض الطلب';
                notifMsg = `تم رفض طلب المزايدة على سيارة ${request.car.title}.`;
            }
            
            try {
                const UserNotification = require('../../../models/UserNotification');
                await UserNotification.createNotification({
                    user: request.user,
                    title: notifTitle,
                    message: notifMsg,
                    type: 'bid',
                    actionUrl: '/auctions',
                    priority: prio
                });
            } catch (err) {
                console.error("Failed to notify user of auction status", err);
            }
        }

        res.json({ success: true, data: request });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
