// CAR X - نماذج قاعدة البيانات
import mongoose from 'mongoose';

// ============== Car Model ==============
const carSchema = new mongoose.Schema({
  title: { type: String, required: true },
  make: String,
  makeLogoUrl: String,
  model: String,
  year: Number,
  category: { type: String, default: 'sedan' },
  listingType: { type: String, enum: ['store', 'auction', 'showroom'], default: 'store' },
  source: { type: String, enum: ['hm_local', 'korean_import'], default: 'korean_import', index: true },
  externalUrl: { type: String, default: '' },
  basePriceUsd: Number,
  price: Number,
  priceSar: Number,
  priceUsd: Number,
  priceKrw: Number,
  displayCurrency: { type: String, enum: ['SAR', 'USD', 'KRW'], default: 'SAR' },
  mileage: Number,
  fuelType: { type: String, default: 'Petrol' },
  transmission: { type: String, default: 'Automatic' },
  color: String,
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'needs work'], default: 'good' },
  description: String,
  images: [String],
  isSold: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
}, { timestamps: true });

carSchema.index({ isActive: 1, listingType: 1, createdAt: -1 });
carSchema.index({ make: 1, model: 1, year: -1 });
carSchema.index({ price: 1 });
carSchema.index({ source: 1, isActive: 1 });
carSchema.index(
  { title: 'text', description: 'text', make: 'text', model: 'text' },
  { weights: { title: 10, make: 5, model: 5, description: 2 } }
);

// ============== Brand Model ==============
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true, default: '' },
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logoUrl: { type: String, default: '' },
  forCars: { type: Boolean, default: true },
  forSpareParts: { type: Boolean, default: false },
  models: { type: [String], default: [] },
  targetShowroom: { type: String, enum: ['hm_local', 'korean_import', 'both'], default: 'korean_import' },
  isActive: { type: Boolean, default: true },
  location: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  description: { type: String, default: '' },
  description_ar: { type: String, default: '' },
}, { timestamps: true });

brandSchema.pre('validate', function (next) {
  if (!this.key && this.name) {
    this.key = String(this.name).trim().toLowerCase();
  }
  if (this.key) this.key = String(this.key).trim().toLowerCase();
  if (this.name) this.name = String(this.name).trim();
  next();
});

// ============== SparePart Model ==============
const sparePartSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, trim: true },
  nameAr: { type: String, trim: true },
  partType: { type: String, trim: true },
  partTypeAr: { type: String, trim: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'CXBrand', default: null },
  carMake: { type: String, trim: true },
  carModel: { type: String, trim: true },
  carYear: { type: Number },
  basePriceUsd: { type: Number },
  price: { type: Number, required: true },
  priceSar: { type: Number },
  priceUsd: { type: Number },
  description: { type: String },
  images: [String],
  source: { type: String, trim: true, default: 'manual' },
  stockQty: { type: Number, default: 999 },
  soldCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  compatibility: [String],
  condition: { type: String, enum: ['NEW', 'USED', 'REFURBISHED'], default: 'NEW' },
}, { timestamps: true });

sparePartSchema.index(
  { name: 'text', nameAr: 'text', carMake: 'text', carModel: 'text' },
  { weights: { name: 10, nameAr: 10, carMake: 3, carModel: 3 } }
);

// ============== User Model (CAR X) ==============
const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, sparse: true, trim: true },
  phone: { type: String, unique: true, required: false, sparse: true },
  password: { type: String, required: false },
  role: { type: String, enum: ['buyer', 'admin', 'manager'], default: 'buyer' },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  lastLoginAt: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

// ============== Register models safely (avoid OverwriteModelError) ==============
export const Car = mongoose.models.CXCar || mongoose.model('CXCar', carSchema);
export const Brand = mongoose.models.CXBrand || mongoose.model('CXBrand', brandSchema);
export const SparePart = mongoose.models.CXSparePart || mongoose.model('CXSparePart', sparePartSchema);
export const User = mongoose.models.CXUser || mongoose.model('CXUser', userSchema);
