// [[ARABIC_HEADER]] هذا الملف (models/Bid.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Bid.js
const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  // Optional for legacy bids; all new auction bids set this reference.
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', index: true },
  // معرّف المستأجر (Tenant ID) للفصل بين بيانات المستأجرين
  tenantId: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  // مرجع السيارة المرتبط بهذه المزايدة
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  // مرجع المستخدم الذي أدخل المزايدة
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // اسم معروض للمزايد (اختياري) يظهر في الواجهة
  displayName: { type: String, default: '' },
  // مبلغ المزايدة
  amount: { type: Number, required: true },
  // تاريخ المزايدة
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
// Composite indexes for multi-tenant queries
bidSchema.index({ tenantId: 1, carId: 1 });
bidSchema.index({ tenantId: 1, userId: 1 });
bidSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);
