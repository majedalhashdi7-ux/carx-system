// [[ARABIC_HEADER]] هذا الملف (models/LiveAuctionRequest.js) يحتوي على هيكل (Schema) لطلبات شراء السيارات في المزاد المباشر (Proxy Bidding).
const mongoose = require('mongoose');

const liveAuctionRequestSchema = new mongoose.Schema({
    // ربط الطلب بمستخدم مسجل (اختياري إذا كان العميل يزور الموقع كضيف)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // بيانات الضيف/العميل الأساسية لتسهيل التواصل عبر الواتساب لاحقاً
    guestName: { type: String, required: true },
    guestPhone: { type: String, required: true },
    
    // المزاد الحي المرتبط بالطلب
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveAuction', required: true },
    sessionTitle: { type: String }, // عنوان مبدئي للمزاد لتخفيف الأعباء على قاعدة البيانات (تجنب الـ population الكامل)
    
    // بيانات السيارة المطلوبة من المزاد
    car: {
        title: { type: String, required: true },
        lotNumber: { type: String },     // رقم اللوت في المزاد
        priceEstimate: { type: String }, // السعر التقديري المتوقع
        image: { type: String }          // صورة السيارة لتسهيل المعاينة على المشرف
    },
    
    // حالة الطلب الحالية ومساره
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'won', 'lost'],
        default: 'pending' // يبدأ كطلب قيد الانتظار
    },
    
    // الحد الأقصى للسعر الذي وافق عليه العميل للمزايدة عليه (يحدده المشرف بعد التواصل)
    agreedMaxPrice: { type: Number, default: 0 },
    
    // السعر النهائي الذي رست عليه السيارة (في حال الفوز)
    finalPurchasePrice: { type: Number, default: 0 },
    
    // ملاحظات وإرشادات خاصة بالمشرف (لا تظهر للعميل)
    adminNotes: { type: String, default: '' },
    
    // ارتباط الطلب بفاتورة تم إنشاؤها بعد الفوز بالمزاد
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
}, { timestamps: true });

module.exports = mongoose.model('LiveAuctionRequest', liveAuctionRequestSchema);
