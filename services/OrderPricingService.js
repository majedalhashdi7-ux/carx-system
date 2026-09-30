const mongoose = require('mongoose');
const { getModel, addTenantFilter } = require('../tenants/tenant-model-helper');
const round = value => Math.round(value * 100) / 100;
const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
const invalid = message => Object.assign(new Error(message), { status: 400 });

async function priceOrder(req, items, settings) {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw invalid('عناصر الطلب غير صالحة');
  const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
  const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);
  if (!positive(usdToSar) || !positive(usdToKrw)) throw invalid('أسعار الصرف غير صالحة');
  const normalizedItems = [];
  const seen = new Set();
  for (const item of items) {
    const qty = Number(item.qty ?? 1);
    if (!['car', 'sparePart', 'auctionWin'].includes(item.itemType) || !mongoose.isValidObjectId(item.refId) || !Number.isSafeInteger(qty) || qty < 1 || qty > 1000) throw invalid('عنصر أو كمية غير صالحة');
    const key = `${item.itemType}:${item.refId}`;
    if (seen.has(key)) throw invalid('لا يمكن تكرار العنصر داخل الطلب');
    seen.add(key);
    const model = getModel(req, item.itemType === 'car' ? 'Car' : item.itemType === 'sparePart' ? 'SparePart' : 'Auction');
    const product = await model.findOne(addTenantFilter(req, { _id: item.refId })).lean();
    if (!product) throw invalid('العنصر غير موجود');
    if (item.itemType === 'car' && (qty !== 1 || product.isSold || product.isActive === false)) throw invalid('السيارة غير متاحة');
    if (item.itemType === 'sparePart' && (product.inStock === false || qty > Number(product.stockQty))) throw invalid('الكمية المطلوبة غير متاحة');
    let unitPriceSar;
    if (item.itemType === 'auctionWin') {
      if (qty !== 1 || product.status !== 'ended' || new Date(product.endsAt).getTime() > Date.now() || String(product.highestBidder) !== String(req.user.userId || req.user.id)) throw invalid('الفوز بالمزاد غير صالح لهذا المستخدم');
      const multiplier = Number(settings?.currencySettings?.auctionMultiplier || 1);
      if (!positive(multiplier)) throw invalid('إعداد تسعير المزاد غير صالح');
      unitPriceSar = Number(product.currentPrice) * multiplier;
    } else {
      // Use the same canonical base USD price as the catalog when present.
      unitPriceSar = positive(product.basePriceUsd) ? Number(product.basePriceUsd) * usdToSar
        : positive(product.priceSar) ? Number(product.priceSar)
        : positive(product.priceUsd) ? Number(product.priceUsd) * usdToSar
        : positive(product.priceKrw) ? Number(product.priceKrw) / usdToKrw * usdToSar
        : Number(product.price);
    }
    if (!positive(unitPriceSar)) throw invalid('سعر العنصر غير متاح؛ تواصل مع الإدارة');
    normalizedItems.push({ itemType: item.itemType, refId: product._id, qty, titleSnapshot: product.title || product.name || `${product.make || ''} ${product.model || ''}`.trim() || 'مزاد', unitPriceSar: round(unitPriceSar), unitPriceUsd: round(unitPriceSar / usdToSar) });
  }
  const subTotalSar = round(normalizedItems.reduce((sum, item) => sum + item.unitPriceSar * item.qty, 0));
  // Shipping is quoted separately; never accept a client supplied charge.
  const pricing = { subTotalSar, subTotalUsd: round(subTotalSar / usdToSar), shippingSar: 0, shippingUsd: 0, grandTotalSar: subTotalSar, grandTotalUsd: round(subTotalSar / usdToSar), exchangeSnapshot: { usdToSar, usdToKrw, activeCurrency: settings?.currencySettings?.activeCurrency || 'SAR', capturedAt: new Date() } };
  return { items: normalizedItems, pricing };
}
module.exports = { priceOrder };
