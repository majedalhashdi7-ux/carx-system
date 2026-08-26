// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/auctions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const { requireAuthAPI } = require('../../../middleware/auth');
const { getModel, addTenantFilter, getTenantId } = require('../../../tenants/tenant-model-helper');
const { 
  successResponse, 
  errorResponse, 
  validationErrorResponse, 
  notFoundResponse, 
  serverErrorResponse, 
  sendResponse 
} = require('../../../utils/apiResponse');

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

// GET /api/v2/auctions - قائمة المزادات
router.get('/', async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const SiteSettings = getModel(req, 'SiteSettings');
        const { status, source, limit = 10 } = req.query;
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (source) {
            query.source = source;
        }

        const settings = SiteSettings ? await SiteSettings.getSettings().catch(() => null) : null;
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        const now = new Date();

        // تحديث حالة المزادات تلقائياً قبل الإرجاع
        await Auction.updateMany(
            { status: 'running', endsAt: { $lt: now } },
            { $set: { status: 'ended' } }
        ).catch(() => {});

        const auctions = await Auction.find(addTenantFilter(req, query))
            .populate('car')
            .populate('highestBidder', 'name email')
            .sort({ createdAt: -1, endsAt: 1 })
            .limit(Number(limit) || 100)
            .lean();

        res.json({
            success: true,
            data: auctions.map(a => {
                const carObj = a.car || {
                    id: a._id,
                    title: a.title || a.titleAr || 'مزاد كوري مستورد',
                    make: a.make || a.makeAr || 'Hyundai',
                    model: a.model || 'Tucson',
                    images: a.images || [],
                    year: a.year || new Date().getFullYear(),
                    price: a.priceSar || a.startingPrice || 0
                };
                return {
                    _id: a._id,
                    id: a._id,
                    title: a.title || carObj.title,
                    titleAr: a.titleAr || a.title || carObj.title,
                    status: a.status || 'running',
                    source: a.source || 'encar',
                    externalId: a.externalId,
                    externalUrl: a.externalUrl,
                    images: a.images && a.images.length > 0 ? a.images : carObj.images,
                    image: (a.images && a.images[0]) || carObj.image || (carObj.images && carObj.images[0]),
                    currentBid: applyMultiplier(a.currentPrice || a.startingPrice || a.priceSar || 15000, auctionMultiplier),
                    currentPrice: applyMultiplier(a.currentPrice || a.startingPrice || a.priceSar || 15000, auctionMultiplier),
                    startingPrice: applyMultiplier(a.startingPrice || a.priceSar || 15000, auctionMultiplier),
                    minBidIncrement: applyMultiplier(a.minBidIncrement || 0, auctionMultiplier),
                    currency: a.currency || 'SAR',
                    endsAt: a.endsAt,
                    startsAt: a.startsAt,
                    bidders: a.bidsCount || 0,
                    car: carObj
                };
            })
        });
    } catch (error) {
        console.error('API Auctions error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

// GET /api/v2/auctions/:id - جلب مزاد محدد
router.get('/:id', async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const SiteSettings = getModel(req, 'SiteSettings');
        const idParam = req.params.id;
        const mongoose = require('mongoose');

        const idConditions = [{ _id: idParam }, { id: idParam }];
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            idConditions.push({ _id: new mongoose.Types.ObjectId(idParam) });
        }
        
        const auction = await Auction.findOne(addTenantFilter(req, { $or: idConditions }))
            .populate('car')
            .populate('highestBidder', 'name')
            .lean();

        if (!auction) {
            return sendResponse(res, notFoundResponse('Auction'));
        }

        const settings = SiteSettings ? await SiteSettings.getSettings().catch(() => null) : null;
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);

        res.json({
            success: true,
            data: {
                _id: auction._id,
                id: auction._id,
                status: auction.status,
            currentBid: applyMultiplier(auction.currentPrice || auction.startingPrice, auctionMultiplier),
            currentPrice: applyMultiplier(auction.currentPrice || auction.startingPrice, auctionMultiplier),
            startingPrice: applyMultiplier(auction.startingPrice, auctionMultiplier),
            minBidIncrement: applyMultiplier(auction.minBidIncrement || 0, auctionMultiplier),
                currency: auction.currency || 'SAR',
                endsAt: auction.endsAt,
                startsAt: auction.startsAt,
                bidders: auction.bidsCount || 0,
                highestBidder: auction.highestBidder ? auction.highestBidder.name : null,
                car: auction.car ? {
                    id: auction.car._id,
                    title: auction.car.title,
                    make: auction.car.make,
                    model: auction.car.model,
                    images: auction.car.images,
                    year: auction.car.year,
                    description: auction.car.description,
                    mileage: auction.car.mileage,
                    fuelType: auction.car.fuelType,
                    transmission: auction.car.transmission,
                    color: auction.car.color
                } : null
            }
        });
    } catch (error) {
        console.error('API Get Auction error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

// POST /api/v2/auctions - إنشاء مزاد جديد (Auth required)
router.post('/', requireAuthAPI, async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const Car = getModel(req, 'Car');
        const SiteSettings = getModel(req, 'SiteSettings');
        const { carId, startPrice, startsAt, endsAt } = req.body;

        if (!carId || !startPrice || !startsAt || !endsAt) {
            return sendResponse(res, validationErrorResponse(null, 'All fields (carId, startPrice, startsAt, endsAt) are required'));
        }

        // Verify car exists
        const car = await Car.findOne(addTenantFilter(req, { _id: carId }));
        if (!car) {
            return sendResponse(res, notFoundResponse('Car'));
        }

        const settings = SiteSettings ? await SiteSettings.getSettings().catch(() => null) : null;
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);
        const baseStartPrice = toBaseAmount(startPrice, auctionMultiplier);

        const auction = new Auction({
            car: carId,
            startingPrice: baseStartPrice,
            currentPrice: baseStartPrice,
            startsAt,
            endsAt,
            status: 'scheduled',
            tenantId: getTenantId(req)
        });

        await auction.save();

        res.status(201).json({
            success: true,
            message: 'Auction created successfully',
            data: auction
        });
    } catch (error) {
        console.error('API Create Auction error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

// PUT /api/v2/auctions/:id - تحديث مزاد (Auth required)
router.put('/:id', requireAuthAPI, async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const { status, endsAt } = req.body;
        const auction = await Auction.findOne(addTenantFilter(req, { _id: req.params.id }));

        if (!auction) {
            return sendResponse(res, notFoundResponse('Auction'));
        }

        if (status) auction.status = status;
        if (endsAt) auction.endsAt = endsAt;

        await auction.save();

        res.json({
            success: true,
            message: 'Auction updated successfully',
            data: auction
        });
    } catch (error) {
        console.error('API Update Auction error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

// DELETE /api/v2/auctions/:id - حذف مزاد (Auth required)
router.delete('/:id', requireAuthAPI, async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const auction = await Auction.findOneAndDelete(addTenantFilter(req, { _id: req.params.id }));
        if (!auction) {
            return sendResponse(res, notFoundResponse('Auction'));
        }
        res.json({ success: true, message: 'Auction deleted successfully' });
    } catch (error) {
        console.error('API Delete Auction error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

// POST /api/v2/auctions/:id/bid - المزايدة (Auth required)
router.post('/:id/bid', requireAuthAPI, async (req, res) => {
    try {
        const Auction = getModel(req, 'Auction');
        const SiteSettings = getModel(req, 'SiteSettings');
        const { amount } = req.body;
        const auction = await Auction.findOne(addTenantFilter(req, { _id: req.params.id }));

        if (!auction) {
            return sendResponse(res, notFoundResponse('Auction'));
        }

        if (auction.status !== 'running') {
            return sendResponse(res, errorResponse('Auction is not active', 'AUCTION_NOT_ACTIVE', 400));
        }

        const settings = SiteSettings ? await SiteSettings.getSettings().catch(() => null) : null;
        const auctionMultiplier = normalizeMultiplier(settings?.currencySettings?.auctionMultiplier || 1);
        const currentHighest = auction.currentPrice || auction.startingPrice;
        const baseAmount = toBaseAmount(amount, auctionMultiplier);

        if (baseAmount <= currentHighest) {
            return sendResponse(res, errorResponse(
                `Bid must be higher than ${applyMultiplier(currentHighest, auctionMultiplier)}`,
                'BID_TOO_LOW',
                400
            ));
        }

        auction.currentPrice = baseAmount;
        auction.highestBidder = req.user.userId;

        await auction.save();

        res.json({
            success: true,
            message: 'Bid placed successfully',
            data: {
                currentPrice: applyMultiplier(auction.currentPrice, auctionMultiplier),
                highestBidder: req.user.userId
            }
        });
    } catch (error) {
        console.error('API Bid error:', error);
        return sendResponse(res, serverErrorResponse('Internal Server Error', error));
    }
});

module.exports = router;
