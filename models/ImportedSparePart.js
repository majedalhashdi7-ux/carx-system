// [[ARABIC_HEADER]] هذا الملف (models/ImportedSparePart.js) الموديل المخصص لقطع الغيار المستوردة بشكل مستقل
const mongoose = require('mongoose');

const importedSparePartSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    default: 'hmcar',
    index: true
  },
  importId: { type: String, unique: true, index: true },
  partName: { type: String, required: true },
  partNameAr: String,
  partNameEn: String,
  partNumber: { type: String, index: true }, // OEM Number
  brand: String,
  compatibleModels: [String],
  category: { type: String, default: 'general' },
  priceSar: { type: Number, required: true },
  priceUsd: Number,
  priceKrw: Number,
  costPriceSar: Number,
  stockQuantity: { type: Number, default: 1 },
  condition: { type: String, enum: ['new_original', 'new_commercial', 'used_excellent', 'used_good'], default: 'new_original' },
  description: String,
  descriptionAr: String,
  images: [String],
  mainImage: String,
  watermarkedImages: [String],
  externalSourceUrl: String,
  status: { type: String, enum: ['imported', 'in_stock', 'sold_out', 'hidden'], default: 'imported', index: true },
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

importedSparePartSchema.index({ tenantId: 1, partNumber: 1 });
importedSparePartSchema.index({ brand: 1, category: 1 });

module.exports = mongoose.model('ImportedSparePart', importedSparePartSchema);
