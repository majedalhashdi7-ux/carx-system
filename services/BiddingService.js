const mongoose = require('mongoose');
const { getModel, addTenantFilter, getTenantId } = require('../tenants/tenant-model-helper');

function bidError(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

async function placeBid(req, auctionId, amount) {
  if (!mongoose.isValidObjectId(auctionId) || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw bidError('معرف المزاد أو مبلغ المزايدة غير صالح');
  }
  const Auction = getModel(req, 'Auction');
  const Bid = getModel(req, 'Bid');
  const SiteSettings = getModel(req, 'SiteSettings');
  const settings = await SiteSettings.getSettings();
  const multiplier = Number(settings?.currencySettings?.auctionMultiplier || 1);
  if (!Number.isFinite(multiplier) || multiplier <= 0) throw bidError('إعداد تسعير المزاد غير صالح', 503);
  const baseAmount = Math.round(amount / multiplier * 100) / 100;
  if (baseAmount <= 0) throw bidError('مبلغ المزايدة غير صالح');
  const userId = req.user.userId || req.user.id;
  const session = await Auction.db.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const auction = await Auction.findOne(addTenantFilter(req, { _id: auctionId })).session(session);
      if (!auction) throw bidError('المزاد غير موجود', 404);
      const now = new Date();
      if (auction.status !== 'running' || !auction.startsAt || !auction.endsAt || auction.startsAt > now || auction.endsAt <= now) {
        throw bidError('المزاد غير نشط أو انتهى وقته');
      }
      const minimum = Math.max(auction.currentPrice || 0, auction.startingPrice || 0) + (auction.minBidIncrement || 100);
      if (baseAmount < minimum) throw bidError(`الحد الأدنى للمزايدة ${Math.round(minimum * multiplier * 100) / 100}`);
      const extended = auction.endsAt.getTime() - now.getTime() < 120000;
      const endsAt = extended ? new Date(auction.endsAt.getTime() + 120000) : auction.endsAt;
      const updated = await Auction.findOneAndUpdate(
        addTenantFilter(req, { _id: auction._id, currentPrice: auction.currentPrice, status: 'running', endsAt: { $gt: now } }),
        { $set: { currentPrice: baseAmount, currentBid: baseAmount, highestBidder: userId, endsAt }, $inc: { bidsCount: 1 } },
        { new: true, session, runValidators: true }
      );
      if (!updated) throw bidError('تغير سعر المزاد؛ أعد المحاولة', 409);
      const [bid] = await Bid.create([{
        auction: auction._id, carId: auction.car || auction.carId, userId,
        amount: baseAmount, tenantId: getTenantId(req),
      }], { session });
      result = { id: bid._id, amount: Math.round(baseAmount * multiplier * 100) / 100, newCurrentPrice: Math.round(baseAmount * multiplier * 100) / 100, highestBidder: userId, endTime: endsAt, extended };
    });
  } finally {
    await session.endSession();
  }
  // Broadcast only after both the price and the bid are committed.
  try {
    const socket = require('../modules/socket');
    const payload = { ...result, auctionId: String(auctionId), timestamp: new Date() };
    socket.emitToTenantRoom(getTenantId(req), `auction_${auctionId}`, 'bid:placed', payload);
    socket.emitToTenantRoom(getTenantId(req), 'general', 'auction:price_update', payload);
  } catch (error) {
    console.warn('[Bid broadcast]', error.message);
  }
  return result;
}

module.exports = { placeBid };
