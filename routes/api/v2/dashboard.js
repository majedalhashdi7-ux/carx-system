// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/dashboard.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { getModel } = require('../../../tenants/tenant-model-helper');
const { requireAuthAPI } = require('../../../middleware/auth');

// GET /api/v2/dashboard/client - بيانات لوحة تحكم العميل
router.get('/client', requireAuthAPI, async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const Car = getModel(req, 'Car');
        const Auction = getModel(req, 'Auction');
        const Order = getModel(req, 'Order');
        const Favorite = getModel(req, 'Favorite');
        const Notification = getModel(req, 'Notification');

        // جلب الإحصائيات
        const [
            availableCars,
            liveAuctions,
            myOrders,
            pendingOrders,
            recentCars,
            myFavorites,
            unreadNotifications
        ] = await Promise.all([
            // عدد السيارات المتاحة
            Car.countDocuments({ isActive: true, isSold: false }),

            // عدد المزادات المباشرة
            Auction.countDocuments({ status: 'running' }),

            // عدد طلباتي (النشطة)
            Order.countDocuments({ buyer: userId, status: { $ne: 'cancelled' } }),

            // الطلبات قيد المعالجة
            Order.countDocuments({
                buyer: userId,
                status: { $in: ['pending', 'confirmed'] }
            }),

            // أحدث السيارات (6 سيارات)
            Car.find({ isActive: true, isSold: false })
                .sort({ createdAt: -1 })
                .limit(6)
                .select('title make model year price priceSar priceUsd priceKrw images category')
                .lean(),

            // المفضلة
            Favorite.countDocuments({ user: userId }),

            // إشعارات غير مقروءة
            Notification.countDocuments({ user: userId, read: false })
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    availableCars,
                    liveAuctions,
                    myOrders,
                    activeOrders: myOrders, // Alias for AppHome
                    pendingOrders,
                    myFavorites,
                    favoriteCars: myFavorites, // Alias for AppHome
                    watchedAuctions: liveAuctions, // Alias for AppHome
                    unreadNotifications
                },
                unreadNotifications, // Also top level for badges
                recentCars: recentCars.map(car => ({
                    id: car._id.toString(), // [[ARABIC_COMMENT]] تحويل ObjectId إلى string لضمان صحة الروابط
                    title: car.title,
                    make: car.make,
                    model: car.model,
                    year: car.year,
                    price: car.price || car.priceSar || (car.priceUsd ? car.priceUsd * 3.75 : 0) || 0,
                    image: car.images?.[0] || '',
                    category: car.category
                }))
            }
        });
    } catch (error) {
        console.error('Dashboard client error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

// GET /api/v2/dashboard/admin - بيانات لوحة تحكم المسؤول
router.get('/admin', requireAuthAPI, async (req, res) => {
    try {
        // التحقق من أن المستخدم مسؤول
        if (!req.user.role || !['admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        const Car = getModel(req, 'Car');
        const User = getModel(req, 'User');
        const Auction = getModel(req, 'Auction');
        const Order = getModel(req, 'Order');

        const [
            totalCars,
            totalUsers,
            totalAuctions,
            runningAuctions,
            totalOrders,
            pendingOrders
        ] = await Promise.all([
            Car.countDocuments(),
            User.countDocuments(),
            Auction.countDocuments(),
            Auction.countDocuments({ status: 'running' }),
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' })
        ]);

        res.json({
            success: true,
            data: {
                totalCars,
                totalUsers,
                totalAuctions,
                runningAuctions,
                totalOrders,
                pendingOrders
            }
        });
    } catch (error) {
        console.error('Dashboard admin error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
