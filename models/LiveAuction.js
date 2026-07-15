// [[ARABIC_HEADER]] هذا الملف (models/LiveAuction.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const mongoose = require('mongoose');

// [[ARABIC_COMMENT]] نموذج السيارة الفردية داخل جلسة المزاد
const liveAuctionCarSchema = new mongoose.Schema({
    title: { type: String, required: true },
    images: [String],
    condition: { type: String, default: '' },       // مثال: damaged, clean, etc.
    description: { type: String, default: '' },     // تفاصيل الأضرار والحالة
    priceEstimate: { type: String, default: '' },   // السعر التقديري أو النطاق
    lotNumber: { type: String, default: '' },        // رقم اللوت في المزاد
    auctionName: { type: String, default: '' },     // اسم شركة المزاد مثل Copart
});

// [[ARABIC_COMMENT]] نموذج جلسة المزاد الكاملة
const liveAuctionSchema = new mongoose.Schema({
    // معرّف المستأجر (Tenant ID) للفصل بين بيانات المستأجرين
    tenantId: {
        type: String,
        required: true,
        default: 'default',
        index: true
    },
    title: { type: String, required: true },        // عنوان الجلسة
    externalUrl: { type: String, default: '' },     // رابط المزاد الخارجي (iframe أو رابط مباشر)
    status: {
        type: String,
        enum: ['upcoming', 'live', 'ended'],
        default: 'upcoming'
    },
    cars: [liveAuctionCarSchema],
    startTime: { type: Date },
    endTime: { type: Date },
    whatsappNumber: { type: String, default: '' },  // رقم واتساب مخصص لهذا المزاد
    messageTemplate: { type: String, default: '' }, // قالب رسالة الواتساب
    // [[ARABIC_COMMENT]] بيانات دخول المزاد الخارجي (اسم المستخدم وكلمة السر للدخول للرابط)
    auctionUsername: { type: String, default: '' }, // اسم المستخدم للموقع الخارجي
    auctionPassword: { type: String, default: '' }, // كلمة السر للموقع الخارجي
    // [[ARABIC_COMMENT]] خيار التحديث التلقائي للمزاد كل 24 ساعة (تلقائي / يدوي)
    autoSync: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('LiveAuction', liveAuctionSchema);
