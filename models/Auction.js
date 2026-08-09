// [[ARABIC_HEADER]] هذا الملف (models/Auction.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Auction.js
const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  // معرّف المستأجر (Tenant ID) للفصل بين بيانات المستأجرين
  tenantId: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  // السيارة المرتبطة بالمزاد
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  externalId: { type: String, default: '', index: true },
  externalUrl: { type: String, default: '' },
  title: { type: String, default: '' },
  titleAr: { type: String, default: '' },
  titleEn: { type: String, default: '' },
  images: [String],
  make: { type: String, default: '' },
  makeAr: { type: String, default: '' },
  model: { type: String, default: '' },
  year: { type: Number, default: 0 },
  mileage: { type: Number, default: 0 },
  specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  inspectionReport: { type: mongoose.Schema.Types.Mixed, default: {} },
  // السعر الابتدائي
  startingPrice: { type: Number, required: true },
  // السعر الحالي (آخر مزايدة)
  currentPrice: { type: Number, default: 0 },
  currentBid: { type: Number, default: 0 },
  priceKrw: { type: Number, default: 0 },
  priceSar: { type: Number, default: 0 },
  priceUsd: { type: Number, default: 0 },
  bidsCount: { type: Number, default: 0 },
  // العملة الأساسية للمزاد
  currency: { type: String, enum: ['SAR', 'USD', 'KRW'], default: 'SAR' },
  // أعلى مزايد (مرجع مستخدم)
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // وقت البداية والنهاية
  startsAt: { type: Date },
  endsAt: { type: Date },
  // حالة المزاد
  status: { type: String, enum: ['scheduled', 'running', 'ended', 'upcoming'], default: 'scheduled' },
  source: { type: String, default: 'hmcar' }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
// Composite indexes for multi-tenant queries
auctionSchema.index({ tenantId: 1, status: 1 });
auctionSchema.index({ tenantId: 1, endsAt: 1 });
auctionSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
auctionSchema.index({ car: 1 });
auctionSchema.index({ endsAt: 1 });

auctionSchema.methods.isActive = function() {
  // يتحقق إن كان المزاد ضمن الفترة الزمنية ولم يتم إغلاقه
  const now = new Date();
  return now >= this.startsAt && now <= this.endsAt && this.status !== 'ended';
};

module.exports = mongoose.model('Auction', auctionSchema);