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
    sourceUrl: { type: String, default: '' },       // رابط السيارة في الموقع الأصلي
    externalId: { type: String, default: '', index: true }, // معرف خارجي (Encar ID)
    externalUrl: { type: String, default: '' },     // رابط السيارة في الموقع الخارجي
    make: { type: String, default: '' },            // الماركة
    model: { type: String, default: '' },           // الموديل
    year: { type: Number, default: 0 },             // سنة الصنع
    mileage: { type: Number, default: 0 },          // عداد الكيلومترات
    fuelType: { type: String, default: '' },        // نوع الوقود
    transmission: { type: String, default: '' },    // ناقل الحركة
    price: { type: Number, default: 0 },            // السعر
    priceSar: { type: Number, default: 0 },         // السعر بالريال
    priceUsd: { type: Number, default: 0 },         // السعر بالدولار
    priceKrw: { type: Number, default: 0 },         // السعر بالوون
    importSource: { type: String, default: 'encar' }, // مصدر الاستيراد
    // [[ARABIC_COMMENT]] حقل الإخفاء: true = السيارة اختفت من المزاد الخارجي ولا تُعرض للعملاء
    isHidden: { type: Boolean, default: false },
    disappearedAt: { type: Date, default: null },   // وقت اختفاء السيارة من المزاد
    lastSyncedAt: { type: Date, default: null },    // آخر تزامن
}, { _id: true });

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
    externalUrl: { type: String, default: '' },     // رابط المزاد الخارجي للاستيراد منه
    externalId: { type: String, default: '', index: true }, // معرف خارجي فريد
    importSource: { type: String, default: 'manual' }, // مصدر الاستيراد: manual, encar
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
    // [[ARABIC_COMMENT]] خيار التحديث التلقائي للمزاد كل 24 ساعة
    autoSync: { type: Boolean, default: false },
    lastSyncedAt: { type: Date, default: null },    // آخر وقت تزامن تلقائي
}, { timestamps: true });

module.exports = mongoose.model('LiveAuction', liveAuctionSchema);
