// [[ARABIC_HEADER]] هذا الملف (models/Car.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// models/Car.js
const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  // معرّف المستأجر (Tenant ID) للفصل بين بيانات المستأجرين
  tenantId: {
    type: String,
    required: true,
    default: 'default',
    index: true
  },
  // مالك/بائع السيارة (عادة أدمن في هذا المشروع)
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true }, // مثال: Toyota Corolla 2018
  titleAr: String,
  titleEn: String,
  // نوع العرض: متجر أو سيارة مزاد
  listingType: { type: String, enum: ['store', 'auction', 'showroom'], default: 'store' },
  // رابط خارجي والمعرفات الخاصة بالاستيراد والبحث
  externalUrl: { type: String, default: '' },
  // unique: true + sparse: true يمنع الاستيراد المكرر للسيارات من المصادر الخارجية
  // sparse يتجاهل السيارات ذات externalId الفارغ (السيارات المحلية)
  externalId: { type: String, default: '', index: true, sparse: true },
  externalRef: { type: String, default: '' },
  // مصدر السيارة لتطبيق الفصل التام بين مخزون HM المحلي والمعرض الكوري
  source: { type: String, enum: ['hm_local', 'korean_import', 'encar_korea', 'hmcar'], default: 'hm_local', index: true },
  // الوكالة/البراند المرتبطة بالسيارة المحلية (اختياري)
  agency: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  // بيانات المركبة
  make: String,
  makeLogoUrl: String,
  model: String,
  year: Number,
  // تصنيف/فئة السيارة
  category: { type: String, default: 'sedan' }, // Changed to String for flexibility
  // السعر (price قديم) + سعر بالريال/الدولار/الوون
  basePriceUsd: Number,
  price: Number,
  priceSar: Number,
  priceUsd: Number,
  priceKrw: Number,           // [[ARABIC_COMMENT]] السعر بالوون الكوري
  displayCurrency: { type: String, enum: ['SAR', 'USD', 'KRW'], default: 'SAR' }, // [[ARABIC_COMMENT]] العملة المعروضة للسيارة
  mileage: Number,
  fuelType: { type: String, default: 'Petrol' },
  transmission: { type: String, default: 'Automatic' },
  color: String,
  // الحالة العامة
  condition: { type: String, default: 'good' },
  description: String,
  descriptionAr: String,
  descriptionEn: String,
  images: [String], // مسارات الصور ضمن /uploads
  // [[FIX]] imageUrl — الصورة الرئيسية للسيارة، تُحفظ كـ alias لأول صورة في images[]
  imageUrl: { type: String, default: '' },
  mainImage: { type: String, default: '' },
  originalImages: [String],
  watermarkedImages: [String],

  // ── المواصفات التفصيلية ثنائية اللغة (Arabic / English Specs) ──
  specs: {
    makeAr: String,
    makeEn: String,
    modelAr: String,
    modelEn: String,
    year: Number,
    mileage: Number,
    fuelTypeAr: String,
    fuelTypeEn: String,
    transmissionAr: String,
    transmissionEn: String,
    engineCc: String,
    vin: String,
    trimAr: String,
    trimEn: String,
    seats: Number,
    driveTypeAr: String,
    driveTypeEn: String,
    colorAr: String,
    colorEn: String,
  },

  // ── المميزات والخيارات الإضافية (Bilingual Features & Options) ──
  featuresAr: [String],
  featuresEn: [String],

  // ── تقرير الفحص والهيكل (Inspection & Body Condition Report) ──
  inspectionReport: {
    statusAr: { type: String, default: 'لا توجد أضرار مُسجّلة على هيكل هذه السيارة' },
    statusEn: { type: String, default: 'No accident damage recorded on vehicle body' },
    hasAccidents: { type: Boolean, default: false },
    accidentCount: { type: Number, default: 0 },
    myAccidentCount: { type: Number, default: 0 },
    otherAccidentCount: { type: Number, default: 0 },
    ownerChangeCount: { type: Number, default: 1 },
    simpleRepairCount: { type: Number, default: 0 },
    hasFloodDamage: { type: Boolean, default: false },
    hasFireDamage: { type: Boolean, default: false },
    accidentDetailsAr: String,
    accidentDetailsEn: String,
    reportUrl: String,
    sheetPhotoUrl: String,
    outerBodyParts: mongoose.Schema.Types.Mixed,
    chassisParts: mongoose.Schema.Types.Mixed,
  },
  // حالة البيع
  isSold: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // للتحكم في عرض السيارة
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  soldAt: { type: Date, default: null },
  soldPrice: { type: Number, default: null },
  buyerNote: { type: String, default: '' },
  // حقول إضافية
  badge: { type: String, default: '' }, // مثل: "جديد", "خاص", "مميز"
  makeAr: { type: String, default: '' },
  fuelAr: { type: String, default: '' },
  transmissionAr: { type: String, default: '' },
  // بيانات بيع معلّق (pendingSale) يتم إنشاؤها عند ضغط العميل شراء، ويؤكدها الأدمن لاحقاً
  pendingSaleToken: { type: String, default: '' },
  pendingSaleBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pendingSaleAt: { type: Date, default: null }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ======== Virtual Getters — توحيد الحقول المكررة ========
// هذه الحقول تجمع بين المستويين (الجذر و specs) وتعيد القيمة من أي منهما

/** الماركة بالعربية — يدعم كلاً من makeAr (جذر) و specs.makeAr */
carSchema.virtual('makeArUnified').get(function () {
  return this.makeAr || this.specs?.makeAr || this.make || '';
});

/** نوع الوقود بالعربية — يدعم fuelAr و specs.fuelTypeAr */
carSchema.virtual('fuelArUnified').get(function () {
  return this.fuelAr || this.specs?.fuelTypeAr || this.fuelType || '';
});

/** ناقل الحركة بالعربية — يدعم transmissionAr و specs.transmissionAr */
carSchema.virtual('transmissionArUnified').get(function () {
  return this.transmissionAr || this.specs?.transmissionAr || this.transmission || '';
});

/** المسافة — يدعم mileage و specs.mileage */
carSchema.virtual('mileageUnified').get(function () {
  return this.mileage || this.specs?.mileage || 0;
});

/** السنة — يدعم year و specs.year */
carSchema.virtual('yearUnified').get(function () {
  return this.year || this.specs?.year || 0;
});

/** الصورة الرئيسية — يدعم imageUrl, mainImage, وأول عنصر في images[] */
carSchema.virtual('primaryImage').get(function () {
  return this.imageUrl || this.mainImage || (this.images && this.images[0]) || '';
});


// [[ARABIC_COMMENT]] إضافة فهارس (Indexes) لتحسين سرعة الاستعلامات
// Composite indexes for multi-tenant queries
carSchema.index({ tenantId: 1, isActive: 1 });
carSchema.index({ tenantId: 1, listingType: 1 });
carSchema.index({ tenantId: 1, source: 1 });
carSchema.index({ tenantId: 1, seller: 1 });
carSchema.index({ isActive: 1, listingType: 1, createdAt: -1 });
carSchema.index({ make: 1, model: 1, year: -1 });
carSchema.index({ price: 1, priceUsd: 1 });
carSchema.index({ source: 1, isActive: 1 });
carSchema.index({ seller: 1 });
// [[PERFORMANCE]] فهرس مركب لتسريع الاستعلامات الرئيسية (tenantId + isActive + createdAt)
carSchema.index({ tenantId: 1, isActive: 1, createdAt: -1 });
carSchema.index({ tenantId: 1, isSold: 1, isActive: 1, createdAt: -1 });
carSchema.index({ tenantId: 1, source: 1, isActive: 1 });
carSchema.index(
  { title: 'text', description: 'text' },
  { 
    weights: {
      title: 10,       // [[ARABIC_COMMENT]] إعطاء الأولوية القصوى للعنوان في نتائج البحث
      description: 2   // الوصف له أهمية أقل
    },
    name: "CarTextSearch"
  }
);

// ======== Hook: تفعيل التنبيهات الذكية عند إضافة سيارة جديدة ========
carSchema.post('save', function (doc) {
  // فقط عند إنشاء وثيقة جديدة (isNew=true عند أول save)
  if (this.wasNew) {
    try {
      const SmartAlertService = require('../services/SmartAlertService');
      SmartAlertService.checkNewCar(doc).catch(err =>
        console.error('[Car Model] خطأ في SmartAlert checkNewCar:', err.message)
      );
    } catch (err) {
      // تجاهل الخطأ إذا لم تكن الخدمة متاحة
    }
  }
});

// تخزين حالة isNew قبل الحفظ
carSchema.pre('save', function (next) {
  // [[ARABIC_COMMENT]] محاولة ذكية لتحديد المصدر بناءً على البيانات المتوفرة
  const isKorean = this.source === 'korean_import' || 
                   this.listingType === 'showroom' || 
                   (this.externalUrl && this.externalUrl.includes('encar.com')) ||
                   (this.priceKrw != null && this.priceKrw > 0);

  if (!this.source) {
    this.source = isKorean ? 'korean_import' : 'hm_local';
  }
  
  if (!this.listingType) {
    this.listingType = this.source === 'korean_import' ? 'showroom' : 'store';
  }

  // ضمان توافق listingType مع source إذا كانا متعارضين بشكل واضح (اختياري، يفضل تركه للمسؤول)
  // if (this.source === 'korean_import' && this.listingType !== 'showroom') this.listingType = 'showroom';

  // [[FIX]] مزامنة imageUrl تلقائياً من images[0] للضمان التوافق بين الواجهة والموديل
  if (this.images && this.images.length > 0 && !this.imageUrl) {
    this.imageUrl = this.images[0];
  } else if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
  }

  this.wasNew = this.isNew;
  next();
});

module.exports = mongoose.model('Car', carSchema);
