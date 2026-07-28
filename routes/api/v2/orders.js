// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/orders.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI } = require('../../../middleware/auth');

function toFiniteNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

// GET /api/v2/orders - جلب طلبات المستخدم (أو الكل للأدمن)
router.get('/', requireAuthAPI, async (req, res) => {
    try {
        const Order = getModel(req, 'Order');
        const userId = req.user.userId || req.user._id;
        const { status, page = 1, limit = 10 } = req.query;

        let filter = { buyer: userId };
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            filter = {};
        }

        filter = addTenantFilter(req, filter);
        if (status) filter.status = status;

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('buyer', 'name email phone')
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Order.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total,
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// POST /api/v2/orders - إنشاء طلب جديد (يُستدعى عند الضغط على زر واتساب أو تأكيد السلة)
// [[ARABIC_COMMENT]] تم إضافة المصادقة لمنع إنشاء طلبات مزيفة
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const Order = getModel(req, 'Order');
        const SiteSettings = getModel(req, 'SiteSettings');
        
        let { items, pricing, notes, channel = 'whatsapp' } = req.body;

        // دعم حجز السيارات المباشر من صفحة تفاصيل السيارة في carx-system
        if (!items && req.body.car) {
            const Car = getModel(req, 'Car');
            const carDoc = await Car.findById(req.body.car).lean().catch(() => null);
            items = [{
                itemType: 'car',
                refId: req.body.car,
                titleSnapshot: carDoc ? carDoc.title : 'حجز سيارة',
                qty: 1,
                unitPriceSar: req.body.totalAmount || (carDoc ? carDoc.price : 0)
            }];
            pricing = {
                grandTotalSar: req.body.totalAmount || (carDoc ? carDoc.price : 0),
                subTotalSar: req.body.totalAmount || (carDoc ? carDoc.price : 0)
            };
        }

        const buyerId = req.user.userId || req.user._id;
        const settings = await SiteSettings.getSettings().catch(() => null);

        const usdToSar = toFiniteNumber(req.body?.currencySnapshot?.usdToSar) || toFiniteNumber(settings?.currencySettings?.usdToSar) || 3.75;
        const usdToKrw = toFiniteNumber(req.body?.currencySnapshot?.usdToKrw) || toFiniteNumber(settings?.currencySettings?.usdToKrw) || 1350;
        const activeCurrency = String(req.body?.currencySnapshot?.activeCurrency || settings?.currencySettings?.activeCurrency || 'SAR').toUpperCase();

        const normalizedPricing = {
            subTotalSar: toFiniteNumber(pricing?.subTotalSar),
            subTotalUsd: toFiniteNumber(pricing?.subTotalUsd),
            shippingSar: toFiniteNumber(pricing?.shippingSar),
            shippingUsd: toFiniteNumber(pricing?.shippingUsd),
            grandTotalSar: toFiniteNumber(pricing?.grandTotalSar),
            grandTotalUsd: toFiniteNumber(pricing?.grandTotalUsd),
        };

        if (!normalizedPricing.subTotalUsd && normalizedPricing.subTotalSar > 0) {
            normalizedPricing.subTotalUsd = Number((normalizedPricing.subTotalSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.subTotalSar && normalizedPricing.subTotalUsd > 0) {
            normalizedPricing.subTotalSar = Number((normalizedPricing.subTotalUsd * usdToSar).toFixed(2));
        }

        if (!normalizedPricing.shippingUsd && normalizedPricing.shippingSar > 0) {
            normalizedPricing.shippingUsd = Number((normalizedPricing.shippingSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.shippingSar && normalizedPricing.shippingUsd > 0) {
            normalizedPricing.shippingSar = Number((normalizedPricing.shippingUsd * usdToSar).toFixed(2));
        }

        if (!normalizedPricing.grandTotalUsd && normalizedPricing.grandTotalSar > 0) {
            normalizedPricing.grandTotalUsd = Number((normalizedPricing.grandTotalSar / usdToSar).toFixed(2));
        }
        if (!normalizedPricing.grandTotalSar && normalizedPricing.grandTotalUsd > 0) {
            normalizedPricing.grandTotalSar = Number((normalizedPricing.grandTotalUsd * usdToSar).toFixed(2));
        }

        normalizedPricing.exchangeSnapshot = {
            usdToSar,
            usdToKrw,
            activeCurrency: ['SAR', 'USD', 'KRW'].includes(activeCurrency) ? activeCurrency : 'SAR',
            capturedAt: new Date(),
        };

        const normalizedItems = Array.isArray(items)
            ? items.map((item) => {
                const unitPriceSar = Math.max(0, toFiniteNumber(item?.unitPriceSar));
                const unitPriceUsd = Math.max(0, toFiniteNumber(item?.unitPriceUsd));

                const resolvedUnitPriceSar = unitPriceSar || (unitPriceUsd > 0 ? Number((unitPriceUsd * usdToSar).toFixed(2)) : 0);
                const resolvedUnitPriceUsd = unitPriceUsd || (unitPriceSar > 0 ? Number((unitPriceSar / usdToSar).toFixed(2)) : 0);

                return {
                    ...item,
                    unitPriceSar: resolvedUnitPriceSar,
                    unitPriceUsd: resolvedUnitPriceUsd,
                };
            })
            : [];

        // التأكد العالي من الأمان (Security & Validation Checks)
        if (!normalizedItems || normalizedItems.length === 0) {
            return res.status(400).json({ success: false, error: 'الطلب لا يحتوي على عناصر' });
        }
        
        if (normalizedPricing.grandTotalSar < 0 || normalizedPricing.subTotalSar < 0 || normalizedPricing.shippingSar < 0) {
             return res.status(400).json({ success: false, error: 'تم التلاعب بالأسعار وإرسال قيم سالبة غير معتمدة' });
        }

        // توليد رقم طلب فريد وآمن مع التحقق من عدم التكرار في قاعدة البيانات
        let orderNumber;
        let orderExists = true;
        const crypto = require('crypto');
        while (orderExists) {
            const randHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 أحرف
            orderNumber = `HM-${new Date().getFullYear()}-${randHex}`;
            const existingOrder = await Order.findOne(addTenantFilter(req, { orderNumber }));
            if (!existingOrder) {
                orderExists = false;
            }
        }

        const newOrder = new Order({
            orderNumber,
            buyer: buyerId,
            items: normalizedItems,
            pricing: normalizedPricing,
            notes,
            channel,
            status: 'pending',
            tenantId: getTenantId(req)
        });

        await newOrder.save();

        // [[ARABIC_COMMENT]] إرسال إشعار لكافة المشرفين عند وجود طلب جديد
        try {
            const User = getModel(req, 'User');
            const UserNotification = getModel(req, 'UserNotification');

            const admins = await User.find(addTenantFilter(req, { role: { $in: ['admin', 'super_admin'] } })).select('_id');
            const notifications = admins.map(admin => ({
                user: admin._id,
                title: 'طلب شراء جديد',
                message: `وصل طلب جديد برقم ${orderNumber} لـ ${items[0]?.titleSnapshot}`,
                type: 'info',
                actionUrl: `/admin/orders/${newOrder._id}`,
                tenantId: getTenantId(req)
            }));

            if (notifications.length > 0) {
                await UserNotification.insertMany(notifications);
            }
        } catch (notifyErr) {
            console.error('Failed to create admin notifications:', notifyErr);
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: newOrder
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
    }
});

// GET /api/v2/orders/:id - جلب تفاصيل طلب محدد
router.get('/:id', requireAuthAPI, async (req, res) => {
    try {
        const Order = getModel(req, 'Order');
        const userId = req.user.userId || req.user._id;
        
        // جلب الطلب دون تصفية المشتري للتحقق من وجوده أولاً
        const order = await Order.findOne(addTenantFilter(req, { _id: req.params.id })).populate('buyer', 'name email phone').lean();

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // إذا كان المشتري مختلفاً وليس مسؤولاً، يتم إرجاع 403 Forbidden
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            const buyerIdStr = order.buyer?._id?.toString() || order.buyer?.toString();
            if (buyerIdStr !== userId.toString()) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// PATCH /api/v2/orders/:id/status - تحديث حالة الطلب (admin only)
router.patch('/:id/status', requireAuthAPI, async (req, res) => {
    try {
        const Order = getModel(req, 'Order');
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { status } = req.body;
        const order = await Order.findOne(addTenantFilter(req, { _id: req.params.id }));
        if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

        const oldStatus = order.status;
        order.status = status;
        order.statusHistory.push({
            from: oldStatus,
            to: status,
            by: req.user.userId || req.user._id,
            at: new Date()
        });

        await order.save();

        // إرسال إشعار للمشتري عند تغيير حالة الطلب
        try {
            const UserNotification = getModel(req, 'UserNotification');
            const notification = new UserNotification({
                user: order.buyer,
                title: 'تحديث حالة الطلب',
                message: `تم تحديث حالة طلبك رقم ${order.orderNumber} إلى: ${status}`,
                type: 'info',
                actionUrl: `/orders/${order._id}`,
                tenantId: getTenantId(req)
            });
            await notification.save();

            // طباعة رابط الواتساب التخيلي لإرسال الإشعار للعميل
            const User = getModel(req, 'User');
            const buyer = await User.findById(order.buyer);
            // [[FIX]] استخدام CLIENT_URL الديناميكي بدلاً من localhost الثابت
            if (buyer && buyer.phone && process.env.NODE_ENV !== 'production') {
                const clientBaseUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'https://hmcar.xyz';
                console.log(`\n==================================================`);
                console.log(`[NOTIFICATION] WHATSAPP NOTIFICATION MOCK:`);
                console.log(`To: ${buyer.name} (${buyer.phone})`);
                console.log(`Message: مرحباً ${buyer.name}، تم تحديث حالة طلبك رقم ${order.orderNumber} إلى ${status}. تفاصيل: ${clientBaseUrl}/orders/${order._id}`);
                console.log(`==================================================\n`);
            }
        } catch (notifyErr) {
            console.error('Failed to notify order buyer:', notifyErr);
        }

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
