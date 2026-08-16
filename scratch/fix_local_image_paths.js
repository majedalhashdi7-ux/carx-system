const mongoose = require('mongoose');
require('dotenv').config();

// خريطة صور عالية الجودة لكل نوع سيارة
const BRAND_IMAGES = {
  'mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
  'mercedes-benz': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
  'مرسيدس': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop',
  'بي إم دبليو': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop',
  'hyundai': 'https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1200&auto=format&fit=crop',
  'هيونداي': 'https://images.unsplash.com/photo-1612825173281-9a193378527e?q=80&w=1200&auto=format&fit=crop',
  'kia': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=1200&auto=format&fit=crop',
  'كيا': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=1200&auto=format&fit=crop',
  'genesis': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop',
  'جينيسيس': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200&auto=format&fit=crop',
  'toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1200&auto=format&fit=crop',
  'تويوتا': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1200&auto=format&fit=crop',
  'lexus': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200&auto=format&fit=crop',
  'لكزس': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200&auto=format&fit=crop',
  'audi': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop',
  'أودي': 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=1200&auto=format&fit=crop',
  'porsche': 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=1200&auto=format&fit=crop',
  'بورش': 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?q=80&w=1200&auto=format&fit=crop',
  'renault': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=1200&auto=format&fit=crop',
  'رينو': 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=1200&auto=format&fit=crop',
  'volvo': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop',
  'فولفو': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop',
  'mini': 'https://images.unsplash.com/photo-1633630672756-4f3e3e1c5b88?q=80&w=1200&auto=format&fit=crop',
  'ميني': 'https://images.unsplash.com/photo-1633630672756-4f3e3e1c5b88?q=80&w=1200&auto=format&fit=crop',
  'chevrolet': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop',
  'شيفروليه': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200&auto=format&fit=crop',
  'jeep': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop',
  'جيب': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200&auto=format&fit=crop',
};

const GENERIC_FALLBACK = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200&auto=format&fit=crop';

function isLocalPath(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.startsWith('/images/') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/public/') ||
    (url.startsWith('/') && !url.startsWith('/api/') && !url.startsWith('//'))
  );
}

function getBrandImage(make) {
  if (!make) return null;
  const key = (typeof make === 'object' ? make.name : make || '').toLowerCase().trim();
  return BRAND_IMAGES[key] || null;
}

async function fixLocalImages() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) { console.log('No MONGO_URI'); return; }
  
  await mongoose.connect(uri);
  const Car = mongoose.model('Car', new mongoose.Schema({}, { strict: false }));
  
  const cars = await Car.find({}).lean();
  console.log(`Checking ${cars.length} cars for local image paths...`);
  
  let fixedCount = 0;
  
  for (const car of cars) {
    const hasLocalMain = isLocalPath(car.mainImage);
    const hasLocalImages = Array.isArray(car.images) && car.images.some(isLocalPath);
    const hasRealImages = Array.isArray(car.images) && car.images.some(img => 
      typeof img === 'string' && img.startsWith('http') && !img.includes('unsplash.com') && !img.includes('photo_2026')
    );
    
    if (!hasLocalMain && !hasLocalImages) continue;
    if (hasRealImages) continue; // لديه صور حقيقية في images[]، اترك
    
    const brandImage = getBrandImage(car.make) || GENERIC_FALLBACK;
    const updates = {};
    
    if (hasLocalMain) {
      updates.mainImage = brandImage;
      updates.imageUrl = brandImage;
      updates.image = brandImage;
    }
    
    if (hasLocalImages) {
      const fixedImages = (car.images || []).map(img => 
        isLocalPath(img) ? brandImage : img
      );
      updates.images = fixedImages;
    }
    
    await Car.findByIdAndUpdate(car._id, { $set: updates });
    fixedCount++;
    console.log(`✅ Fixed local images for: ${car.title || car.make + ' ' + car.model} → ${brandImage}`);
  }
  
  console.log(`\n✅ Done! Fixed ${fixedCount} cars with local image paths.`);
  await mongoose.disconnect();
}

fixLocalImages().catch(console.error);
