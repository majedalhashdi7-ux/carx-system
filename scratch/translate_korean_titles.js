const mongoose = require('mongoose');
require('dotenv').config();

// قاموس ترجمة العلامات التجارية الكورية للعربية
const BRAND_TRANSLATIONS = {
  '현대': 'هيونداي', '기아': 'كيا', '제네시스': 'جينيسيس',
  '쉐보레': 'شيفروليه', '르노코리아': 'رينو الكورية', '쌍용': 'سانغ يونغ',
  'KG모빌리티': 'كي جي موبيليتي', 'KG모빌리티(쌍용)': 'كي جي موبيليتي',
};

const MODEL_TRANSLATIONS = {
  '그랜저': 'جرانديور', '소나타': 'سوناتا', '아반떼': 'إيلانترا',
  '투싼': 'توسان', '산타페': 'سانتا في', '팰리세이드': 'باليسيد',
  '스포티지': 'سبورتاج', '쏘렌토': 'سورينتو', '카니발': 'كارنيفال',
  '셀토스': 'سيلتوس', 'GV80': 'GV80', 'G80': 'G80', 'G90': 'G90',
  '코란도': 'كورانديو', '트랙스': 'تراكس', '싼타페': 'سانتا في',
  'SM6': 'SM6', 'QM6': 'QM6',
};

const KNOWN_BRANDS = {
  'BMW': 'بي إم دبليو', 'Mercedes-Benz': 'مرسيدس بنز',
  'Mercedes': 'مرسيدس', 'Hyundai': 'هيونداي', 'Kia': 'كيا',
  'Genesis': 'جينيسيس', 'Volvo': 'فولفو', 'MINI': 'ميني',
  'Jeep': 'جيب', 'Toyota': 'تويوتا', 'Lexus': 'لكزس',
  'Audi': 'أودي', 'Porsche': 'بورش', 'Chevrolet': 'شيفروليه',
  'Renault': 'رينو', 'KG모빌리티(쌍용)': 'كي جي موبيليتي(سانغ يونغ)',
  '쉐보레(GM대우)': 'شيفروليه (GM Daewoo)',
};

function hasKoreanText(str) {
  if (!str || typeof str !== 'string') return false;
  return /[\uAC00-\uD7A3]/.test(str);
}

function translateTitle(title, make, model) {
  if (!title) return null;
  
  // إذا العنوان لا يحتوي على كوري
  if (!hasKoreanText(title)) return null;
  
  let translated = title;
  
  // استبدال اسم العلامة التجارية
  const rawMake = typeof make === 'object' ? (make?.name || '') : (make || '');
  if (rawMake && KNOWN_BRANDS[rawMake]) {
    translated = translated.replace(rawMake, KNOWN_BRANDS[rawMake]);
  }
  
  // استبدال النماذج المعروفة
  for (const [korean, arabic] of Object.entries(MODEL_TRANSLATIONS)) {
    if (translated.includes(korean)) {
      translated = translated.replace(new RegExp(korean, 'g'), arabic);
    }
  }
  
  // استبدال أي نص كوري متبقٍّ بما هو موجود في القاموس
  for (const [korean, arabic] of Object.entries(BRAND_TRANSLATIONS)) {
    if (translated.includes(korean)) {
      translated = translated.replace(new RegExp(korean, 'g'), arabic);
    }
  }
  
  return translated;
}

async function translateKoreanTitles() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) { console.log('No MONGO_URI'); return; }
  
  await mongoose.connect(uri);
  const Car = mongoose.model('Car', new mongoose.Schema({}, { strict: false }));
  
  const cars = await Car.find({}).lean();
  console.log(`Checking ${cars.length} cars for Korean titles...`);
  
  let translatedCount = 0;
  
  for (const car of cars) {
    // إذا titleAr موجود ولا يحتوي على كوري - تخطَّ
    if (car.titleAr && !hasKoreanText(car.titleAr)) continue;
    
    const title = car.title || '';
    const rawMake = typeof car.make === 'object' ? car.make?.name : (car.make || '');
    
    if (!hasKoreanText(title)) continue;
    
    const newTitleAr = translateTitle(title, rawMake, car.model);
    if (!newTitleAr || newTitleAr === car.titleAr) continue;
    
    await Car.findByIdAndUpdate(car._id, { $set: { titleAr: newTitleAr } });
    translatedCount++;
    console.log(`✅ [${translatedCount}] ${title}`);
    console.log(`   → ${newTitleAr}`);
  }
  
  console.log(`\n✅ Done! Translated ${translatedCount} Korean titles.`);
  await mongoose.disconnect();
}

translateKoreanTitles().catch(console.error);
