// [[ARABIC_HEADER]] هذا الملف (models/SparePart.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/SparePart.js
const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  // اسم القطعة
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true }, // الاسم بالإنجليزية
  nameAr: { type: String, trim: true },
  // نوع القطعة (مثال: مكابح/فلتر...)
  partType: { type: String, trim: true },
  partTypeEn: { type: String, trim: true }, // النوع بالإنجليزية
  partTypeAr: { type: String, trim: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null }, // Unified Brand
  // بيانات المركبة المستهدفة (اختياري)
  carMake: { type: String, trim: true },
  carMakeEn: { type: String, trim: true }, // الماركة بالإنجليزية
  carMakeLogoUrl: { type: String, trim: true },
  carModel: { type: String, trim: true },
  carModelEn: { type: String, trim: true }, // الموديل بالإنجليزية
  carYear: { type: Number },
  // السعر (قديم/أساسي) + أسعار متعددة عملات 
  basePriceUsd: { type: Number },
  price: { type: Number, required: true },
  priceSar: { type: Number },
  priceUsd: { type: Number },
  priceKrw: { type: Number },
  // وصف وصور
  description: { type: String },
  images: [String],
  externalUrl: { type: String, trim: true },
  source: { type: String, trim: true, default: 'manual' },
  // المبيعات والمخزون
  stockQty: { type: Number, default: 999 }, // قيمة عالية افتراضية لتجنب انتهاء المخزون التلقائي
  soldCount: { type: Number, default: 0 },  // إجمالي كمية القطع المباعة
  inStock: { type: Boolean, default: true },
  createdByFirebaseUid: { type: String, required: false, default: '' },
  updatedByFirebaseUid: { type: String, required: false, default: '' }
}, { timestamps: true });

// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
sparePartSchema.index(
  { name: 'text', nameAr: 'text', carMake: 'text', carModel: 'text' },
  {
    weights: {
      name: 10,
      nameAr: 10,
      carMake: 3,
      carModel: 3
    },
    name: "SparePartTextSearch"
  }
);
sparePartSchema.index({ carMake: 1, carModel: 1, carYear: -1 });
sparePartSchema.index({ inStock: 1, price: 1 });
sparePartSchema.index({ brand: 1 });

module.exports = mongoose.model('SparePart', sparePartSchema);
