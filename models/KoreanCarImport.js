// [[ARABIC_HEADER]] هذا الملف (models/KoreanCarImport.js) الموديل المخصص للسيارات الكورية المستوردة
const mongoose = require('mongoose');

const koreanCarImportSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'hmcar',
    index: true
  },
  importId: { type: String, unique: true, index: true },
  title: { type: String, required: true },
  titleAr: String,
  titleEn: String,
  make: { type: String, required: true },
  model: String,
  year: Number,
  priceKrw: { type: Number, required: true },
  priceSar: Number,
  priceUsd: Number,
  basePriceUsd: Number,
  mileage: Number,
  fuelType: { type: String, default: 'Petrol' },
  transmission: { type: String, default: 'Automatic' },
  color: String,
  condition: { type: String, default: 'excellent' },
  description: String,
  descriptionAr: String,
  descriptionEn: String,
  images: [String],
  mainImage: String,
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
    accidentDetailsAr: String,
    accidentDetailsEn: String,
    reportUrl: String,
  },

  externalUrl: String,
  encarId: String,
  vin: String,
  status: { type: String, enum: ['draft', 'imported', 'published', 'sold', 'archived'], default: 'imported', index: true },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rawKoreanData: mongoose.Schema.Types.Mixed
}, { timestamps: true });

koreanCarImportSchema.index({ tenantId: 1, status: 1 });
koreanCarImportSchema.index({ make: 1, model: 1, year: -1 });

module.exports = mongoose.model('KoreanCarImport', koreanCarImportSchema);
