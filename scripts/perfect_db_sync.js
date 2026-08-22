/**
 * perfect_db_sync.js
 * سكريبت تنظيف وإعادة بناء قاعدة البيانات لـ CAR X و HM CAR
 * يملأ قاعدة البيانات بسيارات حقيقية مستوردة ومحلية، مع صور فائقة الدقة ومواصفات كاملة وأسعار واقعية بالريال السعودي.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const CARS_DATA = [
  // ── 1. سيارات جينيسيس الفاخرة (Genesis) ──
  {
    title: 'جينيسيس GV80 3.5T Prestige AWD 2024',
    titleAr: 'جينيسيس GV80 3.5T Prestige دفع رباعي 2024',
    titleEn: 'Genesis GV80 3.5T Prestige AWD 2024',
    make: 'Genesis',
    model: 'GV80',
    year: 2024,
    category: 'suv',
    price: 275000,
    priceSar: 275000,
    priceUsd: 73300,
    priceKrw: 98000000,
    mileage: 12000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أبيض لؤلؤي',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'جينيسيس GV80 الفاخرة، أعلى فئة Prestige بمحرك V6 توين تيربو 3.5 لتر، دفع كلي AWD، مقاعد جلد نابا مع مساج، شاشات خلفية، نظام صوتي Lexicon بـ 18 سماعة، ورؤية ليلية.',
    descriptionAr: 'جينيسيس GV80 الفاخرة، أعلى فئة Prestige بمحرك V6 توين تيربو 3.5 لتر، دفع كلي AWD، مقاعد جلد نابا مع مساج، شاشات خلفية، نظام صوتي Lexicon بـ 18 سماعة، ورؤية ليلية.',
    descriptionEn: 'Genesis GV80 3.5T Prestige AWD, Twin-Turbo V6 engine, Nappa leather with massage seats, rear entertainment screens, Lexicon 18-speaker audio, night vision.',
    images: [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200'
    ],
    specs: {
      makeAr: 'جينيسيس', makeEn: 'Genesis', modelAr: 'GV80', modelEn: 'GV80',
      year: 2024, mileage: 12000, fuelTypeAr: 'بنزين', fuelTypeEn: 'Petrol',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '3.5L V6 Twin-Turbo 375HP', seats: 7, driveTypeAr: 'دفع رباعي مستمر AWD', driveTypeEn: 'All-Wheel Drive',
      colorAr: 'أبيض لؤلؤي', colorEn: 'Pearl White'
    },
    featuresAr: ['سقف بانوراما مزدوج', 'كاميرات 360 درجة 3D', 'رادار ذكي ونظام قيادة شبه ذاتية', 'شاشات عرض على الزجاج HUD', 'تبريد وتدفئة المقاعد الأمامية والخلفية', 'أبواب شفط إلكترونية']
  },
  {
    title: 'جينيسيس G90 رويال إكزكتيف 3.5T 2024',
    titleAr: 'جينيسيس G90 رويال الفاخرة 2024',
    titleEn: 'Genesis G90 Royal Executive 3.5T 2024',
    make: 'Genesis',
    model: 'G90',
    year: 2024,
    category: 'luxury',
    price: 340000,
    priceSar: 340000,
    priceUsd: 90600,
    mileage: 6000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أسود ملكي',
    condition: 'new',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'سيدان النخبة جينيسيس G90 بتعليق هوائي متعدد الحجرات، مقاعد VIP كونسول منفصل خلفي مع شاشة تحكم لمسية، نظام تعقيم الهواء بالأشعة فوق البنفسجية، وستائر كهربائية متكاملة.',
    descriptionAr: 'سيدان النخبة جينيسيس G90 بتعليق هوائي متعدد الحجرات، مقاعد VIP كونسول منفصل خلفي مع شاشة تحكم لمسية، نظام تعقيم الهواء بالأشعة فوق البنفسجية، وستائر كهربائية متكاملة.',
    descriptionEn: 'Genesis G90 Royal Executive Sedan, multi-chamber air suspension, rear VIP reclining seats with touch console, Bang & Olufsen 3D sound.',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200'
    ],
    specs: {
      makeAr: 'جينيسيس', makeEn: 'Genesis', modelAr: 'G90', modelEn: 'G90',
      year: 2024, mileage: 6000, fuelTypeAr: 'بنزين تيربو هجين', fuelTypeEn: 'Turbo E-Supercharger',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '3.5L V6 E-Supercharger 409HP', seats: 4, driveTypeAr: 'دفع خلفي / كلي ذكي', driveTypeEn: 'AWD',
      colorAr: 'أسود ميتاليك', colorEn: 'Royal Black'
    },
    featuresAr: ['مقاعد خلفية منعدمة الجاذبية VIP', 'نظام تعليق هوائي تفاعلي يتنبأ بالطريق', 'نظام صوت Bang & Olufsen بـ 23 سماعة', 'إغلاق كهربائي للأبواب بلمسة زر']
  },
  {
    title: 'جينيسيس GV70 سبورت بلس 2024',
    titleAr: 'جينيسيس GV70 سبورت بلس 2024',
    titleEn: 'Genesis GV70 Sport Plus 3.5T 2024',
    make: 'Genesis',
    model: 'GV70',
    year: 2024,
    category: 'suv',
    price: 225000,
    priceSar: 225000,
    priceUsd: 60000,
    mileage: 18000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'رمادي مطفي (Matte Gray)',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'جينيسيس GV70 الرياضية الفاخرة، باقة Sport Package مع جنوط 21 بوصة، لمسات كاربون فايبر ومقود رياضي، ونظام انطلاق Launch Control.',
    descriptionAr: 'جينيسيس GV70 الرياضية الفاخرة، باقة Sport Package مع جنوط 21 بوصة، لمسات كاربون فايبر ومقود رياضي، ونظام انطلاق Launch Control.',
    descriptionEn: 'Genesis GV70 Sport Plus, 21-inch sport alloys, carbon fiber trim, Launch Control, sport exhaust system.',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200'
    ],
    specs: {
      makeAr: 'جينيسيس', makeEn: 'Genesis', modelAr: 'GV70', modelEn: 'GV70',
      year: 2024, mileage: 18000, fuelTypeAr: 'بنزين', fuelTypeEn: 'Petrol',
      transmissionAr: 'أوتوماتيك', transmissionEn: 'Automatic',
      engineCc: '3.5L Turbo 375HP', seats: 5, driveTypeAr: 'دفع رباعي AWD', driveTypeEn: 'AWD',
      colorAr: 'رمادي مطفي', colorEn: 'Matte Gray'
    },
    featuresAr: ['حزمة Sport Package كاملة', 'نظام عادم رياضي بصوت تفاعلي', 'عدادات رقمية ثلاثية الأبعاد 3D', 'شاحن لاسلكي مزدوج']
  },

  // ── 2. سيارات هيونداي (Hyundai) ──
  {
    title: 'هيونداي باليساد كاليغرافي VIP 2024',
    titleAr: 'هيونداي باليساد كاليغرافي 2024',
    titleEn: 'Hyundai Palisade Calligraphy VIP 2024',
    make: 'Hyundai',
    model: 'Palisade',
    year: 2024,
    category: 'suv',
    price: 185000,
    priceSar: 185000,
    priceUsd: 49300,
    mileage: 15000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أزرق داكن كحلي',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'هيونداي باليساد أعلى فئة كاليغرافي Calligraphy، مقاعد كابتن VIP منفصلة للصف الثاني، جنوط 20 بوصة مخصصة، شبك أمامي بريميوم مع إضاءة نهارية مخفية، وتبريد كامل للمقاعد.',
    descriptionAr: 'هيونداي باليساد أعلى فئة كاليغرافي Calligraphy، مقاعد كابتن VIP منفصلة للصف الثاني، جنوط 20 بوصة مخصصة، شبك أمامي بريميوم مع إضاءة نهارية مخفية، وتبريد كامل للمقاعد.',
    descriptionEn: 'Hyundai Palisade Calligraphy VIP, 2nd-row Captain Chairs, 20-inch exclusive alloys, premium Nappa upholstery, Harman Kardon audio.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
    ],
    specs: {
      makeAr: 'هيونداي', makeEn: 'Hyundai', modelAr: 'باليساد', modelEn: 'Palisade',
      year: 2024, mileage: 15000, fuelTypeAr: 'بنزين', fuelTypeEn: 'Petrol',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '3.8L V6 295HP', seats: 7, driveTypeAr: 'دفع رباعي HTRAC AWD', driveTypeEn: 'HTRAC AWD',
      colorAr: 'كحلي ميتاليك', colorEn: 'Navy Blue'
    },
    featuresAr: ['نظام الدفع الرباعي HTRAC', 'مقاعد جلد نابا مبطنة كاليغرافي', 'مساعد القيادة على الطرق السريعة HDA II', 'نظام اتصال داخلي للركاب في الصف الثالث']
  },
  {
    title: 'هيونداي سانتافي هايبرد كاليغرافي 2024',
    titleAr: 'هيونداي سانتافي هايبرد كاليغرافي الجيل الجديد 2024',
    titleEn: 'Hyundai Santa Fe Hybrid Calligraphy 2024',
    make: 'Hyundai',
    model: 'Santa Fe',
    year: 2024,
    category: 'suv',
    price: 165000,
    priceSar: 165000,
    priceUsd: 44000,
    mileage: 8000,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    color: 'ترابي مميز (Earthly Brass)',
    condition: 'new',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'الجيل الجديد كلياً من هيونداي سانتافي بتصميم صندوقي عصري جريء، محرك تيربو هايبرد فائق الاقتصاد في استهلاك الوقود، شاشة بانورامية منحنية مزدوجة 12.3 بوصة.',
    descriptionAr: 'الجيل الجديد كلياً من هيونداي سانتافي بتصميم صندوقي عصري جريء، محرك تيربو هايبرد فائق الاقتصاد في استهلاك الوقود، شاشة بانورامية منحنية مزدوجة 12.3 بوصة.',
    descriptionEn: 'All-new Hyundai Santa Fe Hybrid Calligraphy, boxy futuristic styling, 1.6L Turbo Hybrid with exceptional fuel economy, dual 12.3-inch curved panoramic display.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200'
    ],
    specs: {
      makeAr: 'هيونداي', makeEn: 'Hyundai', modelAr: 'سانتافي', modelEn: 'Santa Fe',
      year: 2024, mileage: 8000, fuelTypeAr: 'هايبرد (هجين)', fuelTypeEn: 'Hybrid',
      transmissionAr: 'أوتوماتيك 6 سرعات', transmissionEn: '6-Speed Automatic',
      engineCc: '1.6L Turbo Hybrid 235HP', seats: 7, driveTypeAr: 'دفع رباعي ذكي AWD', driveTypeEn: 'AWD',
      colorAr: 'ترابي نحاسي', colorEn: 'Earthly Brass'
    },
    featuresAr: ['شاشتان منحنيتان 12.3 بوصة', 'شاحن لاسلكي مزدوج للهواتف', 'صندوق أمتعة بتصميم التخييم الواسع Terrace', 'نظام تعقيم بالأشعة فوق البنفسجية UV-C']
  },
  {
    title: 'هيونداي توسان تيربو سمارت بلس 2024',
    titleAr: 'هيونداي توسان تيربو سمارت 2024',
    titleEn: 'Hyundai Tucson Turbo Smart Plus 2024',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2024,
    category: 'suv',
    price: 112000,
    priceSar: 112000,
    priceUsd: 29800,
    mileage: 22000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'رمادي تيتانيوم',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'هيونداي توسان تيربو وارد كوريا بحالة الوكالة، محرك 1.6 لتر تيربو اقتصادي ونشط، إضاءة أمامية مجنحة مخفية، فتحة سقف بانوراما كاملة، وحساسات أمامية وخلفية.',
    descriptionAr: 'هيونداي توسان تيربو وارد كوريا بحالة الوكالة، محرك 1.6 لتر تيربو اقتصادي ونشط، إضاءة أمامية مجنحة مخفية، فتحة سقف بانوراما كاملة، وحساسات أمامية وخلفية.',
    descriptionEn: 'Hyundai Tucson 1.6T Smart Plus, Korean import, parametric hidden daytime lights, panoramic sunroof, Apple CarPlay and Android Auto.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200'
    ],
    specs: {
      makeAr: 'هيونداي', makeEn: 'Hyundai', modelAr: 'توسان', modelEn: 'Tucson',
      year: 2024, mileage: 22000, fuelTypeAr: 'بنزين تيربو', fuelTypeEn: 'Petrol Turbo',
      transmissionAr: 'أوتوماتيك دبل كلتش 7 سرعات', transmissionEn: '7-Speed DCT',
      engineCc: '1.6L Turbo 180HP', seats: 5, driveTypeAr: 'دفع أمامي FWD', driveTypeEn: 'FWD',
      colorAr: 'رمادي تيتانيوم', colorEn: 'Titanium Gray'
    },
    featuresAr: ['سقف بانورامي كهربائي', 'نظام المحافظة على المسار LKA', 'شاشة لمسية 10.25 بوصة مع ملاحة', 'تشغيل عن بعد بالمفتاح الذكي']
  },
  {
    title: 'هيونداي سوناتا إن لاين DN8 تيربو 2024',
    titleAr: 'هيونداي سوناتا N-Line تيربو 2024',
    titleEn: 'Hyundai Sonata N-Line Turbo DN8 2024',
    make: 'Hyundai',
    model: 'Sonata',
    year: 2024,
    category: 'sedan',
    price: 118000,
    priceSar: 118000,
    priceUsd: 31400,
    mileage: 16000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أحمر ناري ميتاليك',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'هيونداي سوناتا الفيس ليفت الجديد N-Line، شريط إضاءة Seamless Horizon المتصل، محرك تيربو رياضي، مقاعد رياضية شمواه مطرزة بشعار N، ونظام صوتي Bose.',
    descriptionAr: 'هيونداي سوناتا الفيس ليفت الجديد N-Line، شريط إضاءة Seamless Horizon المتصل، محرك تيربو رياضي، مقاعد رياضية شمواه مطرزة بشعار N، ونظام صوتي Bose.',
    descriptionEn: 'Hyundai Sonata N-Line Facelift, Seamless Horizon front LED bar, sport Alcantara bucket seats with red stitching, Bose premium sound system.',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200'
    ],
    specs: {
      makeAr: 'هيونداي', makeEn: 'Hyundai', modelAr: 'سوناتا', modelEn: 'Sonata',
      year: 2024, mileage: 16000, fuelTypeAr: 'بنزين تيربو', fuelTypeEn: 'Petrol Turbo',
      transmissionAr: 'أوتوماتيك 8 سرعات دبل كلتش', transmissionEn: '8-Speed Wet DCT',
      engineCc: '2.5L Turbo 290HP', seats: 5, driveTypeAr: 'دفع أمامي FWD', driveTypeEn: 'FWD',
      colorAr: 'أحمر ميتاليك', colorEn: 'Flame Red'
    },
    featuresAr: ['شريط إضاءة أمامي هورايزون المتصل', 'نظام عادم رباعي رياضي', 'مقاعد رياضية N مع تدفئة وتبريد', 'نظام صوتي فاخر Bose بـ 12 سماعة']
  },
  {
    title: 'هيونداي ستاريا لاونج VIP 7 ركاب 2023',
    titleAr: 'هيونداي ستاريا لاونج VIP 2023',
    titleEn: 'Hyundai Staria Lounge VIP 7-Seats 2023',
    make: 'Hyundai',
    model: 'Staria',
    year: 2023,
    category: 'luxury',
    price: 138000,
    priceSar: 138000,
    priceUsd: 36800,
    mileage: 28000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    color: 'أسود لؤلؤي مع لمسات نحاسية',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'فان هيونداي ستاريا لاونج VIP الفاخر، مقاعد استرخاء منعدمة الجاذبية Premium Relaxation Seats، إضاءة محيطية 64 لون، وشبك أمامي نحاسي مخصص.',
    descriptionAr: 'فان هيونداي ستاريا لاونج VIP الفاخر، مقاعد استرخاء منعدمة الجاذبية Premium Relaxation Seats، إضاءة محيطية 64 لون، وشبك أمامي نحاسي مخصص.',
    descriptionEn: 'Hyundai Staria Lounge VIP 7-seater, Premium Relaxation individual captain chairs, 64-color ambient lighting, tinted panoramic windows.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
    ],
    specs: {
      makeAr: 'هيونداي', makeEn: 'Hyundai', modelAr: 'ستاريا', modelEn: 'Staria',
      year: 2023, mileage: 28000, fuelTypeAr: 'ديزل اقتصادي', fuelTypeEn: 'Diesel',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '2.2L CRDi Diesel 177HP', seats: 7, driveTypeAr: 'دفع أمامي FWD', driveTypeEn: 'FWD',
      colorAr: 'أسود مع تطعيمات برونزية', colorEn: 'Abyss Black Pearl'
    },
    featuresAr: ['مقاعد كابتن استرخاء كهربائية مع مسند للأقدام', 'أبواب جانبية كهربائية ذكية تفتح تلقائياً', 'نوافذ بانورامية ممتدة عازلة للحرارة', 'طاولات طعام قابلة للطي للركاب']
  },

  // ── 3. سيارات كيا (Kia) ──
  {
    title: 'كيا كارنيفال 9 ركاب نوبليس بريميوم 2024',
    titleAr: 'كيا كارنيفال الجيل الرابع 9 ركاب 2024',
    titleEn: 'Kia Carnival 4th Gen Noblesse 9-Seater 2024',
    make: 'Kia',
    model: 'Carnival',
    year: 2024,
    category: 'suv',
    price: 158000,
    priceSar: 158000,
    priceUsd: 42100,
    mileage: 19000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أبيض لؤلؤي',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'كيا كارنيفال الفاخرة 9 ركاب، أبواب كهربائية ذكية، كراسي الصف الثاني VIP قابلة للدوران والطي، شاشات رقمية مزدوجة، نظام ترفيهي متكامل للعائلة.',
    descriptionAr: 'كيا كارنيفال الفاخرة 9 ركاب، أبواب كهربائية ذكية، كراسي الصف الثاني VIP قابلة للدوران والطي، شاشات رقمية مزدوجة، نظام ترفيهي متكامل للعائلة.',
    descriptionEn: 'Kia Carnival 9-seater Noblesse, power sliding doors, customizable seating layout, dual 12.3-inch displays, rear climate control.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200'
    ],
    specs: {
      makeAr: 'كيا', makeEn: 'Kia', modelAr: 'كارنيفال', modelEn: 'Carnival',
      year: 2024, mileage: 19000, fuelTypeAr: 'بنزين V6', fuelTypeEn: 'Petrol V6',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '3.5L V6 290HP', seats: 9, driveTypeAr: 'دفع أمامي FWD', driveTypeEn: 'FWD',
      colorAr: 'أبيض لؤلؤي', colorEn: 'Snow White Pearl'
    },
    featuresAr: ['أبواب منزلقة كهربائية ذكية بدون لمس', 'كاميرا مراقبة الركاب في المقاعد الخلفية', 'شاحن لاسلكي ومنافذ USB لجميع الصفوف', 'نظام تحذير الخروج الآمن للأطفال SEA']
  },
  {
    title: 'كيا EV9 الكهربائية جي تي لاين 2024',
    titleAr: 'كيا EV9 الكهربائية بالكامل GT-Line 2024',
    titleEn: 'Kia EV9 GT-Line AWD Electric 2024',
    make: 'Kia',
    model: 'EV9',
    year: 2024,
    category: 'suv',
    price: 295000,
    priceSar: 295000,
    priceUsd: 78600,
    mileage: 4000,
    fuelType: 'Electric',
    transmission: 'Automatic',
    color: 'أزرق محيطي مطفي (Ocean Blue Matte)',
    condition: 'new',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'كيا EV9 الحائزة على جوائز عالمية، دفع كلي بمحركين كهربائيين بقوة 379 حصان وتسارع 0-100 في 4.5 ثوانٍ، مدى قيادة يصل إلى 540 كم مع شحن فائق السرعة 800V.',
    descriptionAr: 'كيا EV9 الحائزة على جوائز عالمية، دفع كلي بمحركين كهربائيين بقوة 379 حصان وتسارع 0-100 في 4.5 ثوانٍ، مدى قيادة يصل إلى 540 كم مع شحن فائق السرعة 800V.',
    descriptionEn: 'Kia EV9 GT-Line AWD Electric SUV, 379HP dual motors, 0-100 km/h in 4.5s, 800V ultra-fast charging (10-80% in 24 min), swivel 2nd-row seats.',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200'
    ],
    specs: {
      makeAr: 'كيا', makeEn: 'Kia', modelAr: 'EV9', modelEn: 'EV9',
      year: 2024, mileage: 4000, fuelTypeAr: 'كهرباء 100%', fuelTypeEn: 'Electric',
      transmissionAr: 'أوتوماتيك مباشر سرعة واحدة', transmissionEn: 'Single-Speed Direct',
      engineCc: 'Dual Motor AWD 379HP (99.8 kWh Battery)', seats: 6, driveTypeAr: 'دفع كلي كهربائي AWD', driveTypeEn: 'e-AWD',
      colorAr: 'أزرق مطفي', colorEn: 'Matte Ocean Blue'
    },
    featuresAr: ['شحن فائق السرعة 800V من 10% إلى 80% في 24 دقيقة', 'مقاعد دوارة بزاوية 180 درجة للصف الثاني', 'مرايا جانبية رقمية بكاميرات وشاشات داخلية', 'نظام الركن الذكي عن بعد بالريموت RSPA 2']
  },
  {
    title: 'كيا سبورتاج هايبرد سيجنتشر 2024',
    titleAr: 'كيا سبورتاج هايبرد فل كامل 2024',
    titleEn: 'Kia Sportage Hybrid Signature AWD 2024',
    make: 'Kia',
    model: 'Sportage',
    year: 2024,
    category: 'suv',
    price: 135000,
    priceSar: 135000,
    priceUsd: 36000,
    mileage: 14000,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    color: 'أخضر غامق ميتاليك (Jungle Green)',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'كيا سبورتاج تيربو هايبرد أعلى فئة Signature، دفع كلي AWD، فتحة سقف بانورامية، عدادات ديجيتال وشاشة ترفيه مدمجة منحنية 25 بوصة، كفاءة استهلاك وقود ممتازة 22 كم/لتر.',
    descriptionAr: 'كيا سبورتاج تيربو هايبرد أعلى فئة Signature، دفع كلي AWD، فتحة سقف بانورامية، عدادات ديجيتال وشاشة ترفيه مدمجة منحنية 25 بوصة، كفاءة استهلاك وقود ممتازة 22 كم/لتر.',
    descriptionEn: 'Kia Sportage Hybrid Signature AWD, 1.6T Hybrid 227HP, dual curved 12.3-inch panoramic display, Harman Kardon sound, exceptional 22 km/L efficiency.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200'
    ],
    specs: {
      makeAr: 'كيا', makeEn: 'Kia', modelAr: 'سبورتاج', modelEn: 'Sportage',
      year: 2024, mileage: 14000, fuelTypeAr: 'هايبرد (هجين)', fuelTypeEn: 'Hybrid',
      transmissionAr: 'أوتوماتيك 6 سرعات', transmissionEn: '6-Speed Automatic',
      engineCc: '1.6L Turbo Hybrid 227HP', seats: 5, driveTypeAr: 'دفع رباعي ذكي AWD', driveTypeEn: 'AWD',
      colorAr: 'أخضر غامق', colorEn: 'Jungle Green'
    },
    featuresAr: ['شاشة بانورامية منحنية مزدوجة 25 بوصة', 'نظام كشف النقاط العمياء وعرضها في العدادات BVM', 'مقاعد جلد فاخرة مع تهوية وتدفئة', 'تحكم إلكتروني بناقل الحركة عبر القرص الدوار SBW']
  },
  {
    title: 'كيا K5 جي تي لاين تيربو 2024',
    titleAr: 'كيا K5 GT-Line تيربو 2024',
    titleEn: 'Kia K5 GT-Line Turbo 2024',
    make: 'Kia',
    model: 'K5',
    year: 2024,
    category: 'sedan',
    price: 115000,
    priceSar: 115000,
    priceUsd: 30600,
    mileage: 20000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'رمادي إسمنتي (Wolf Gray)',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'korean_import',
    description: 'سيدان كيا K5 الرياضية GT-Line بتصميم الهجومي الجريء، إضاءة Heartbeat LED، سقف بانورامي، مقاعد جلد أسود بتطريز أحمر، ومقود رياضي مسطح القاع.',
    descriptionAr: 'سيدان كيا K5 الرياضية GT-Line بتصميم الهجومي الجريء، إضاءة Heartbeat LED، سقف بانورامي، مقاعد جلد أسود بتطريز أحمر، ومقود رياضي مسطح القاع.',
    descriptionEn: 'Kia K5 GT-Line, Wolf Gray, Heartbeat LED signature lights, panoramic sunroof, D-cut sport steering wheel, wireless Apple CarPlay.',
    images: [
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200'
    ],
    specs: {
      makeAr: 'كيا', makeEn: 'Kia', modelAr: 'K5', modelEn: 'K5',
      year: 2024, mileage: 20000, fuelTypeAr: 'بنزين تيربو', fuelTypeEn: 'Petrol Turbo',
      transmissionAr: 'أوتوماتيك 8 سرعات', transmissionEn: '8-Speed Automatic',
      engineCc: '1.6L Turbo 180HP', seats: 5, driveTypeAr: 'دفع أمامي FWD', driveTypeEn: 'FWD',
      colorAr: 'رمادي إسمنتي', colorEn: 'Wolf Gray'
    },
    featuresAr: ['سقف بانوراما بالكامل', 'كاميرات محيطية 360 درجة', 'نظام النقطة العمياء مع تنبيه حركة المرور الخلفية', 'شاحن جوال لاسلكي سريع']
  },

  // ── 4. السيارات الألمانية والعالمية الفاخرة (Mercedes, BMW, Porsche, Land Rover, Lexus) ──
  {
    title: 'مرسيدس بنز S-Class S580 4MATIC 2024',
    titleAr: 'مرسيدس بنز الفئة S إس 580 مايباخ باقة 2024',
    titleEn: 'Mercedes-Benz S-Class S580 4MATIC 2024',
    make: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2024,
    category: 'luxury',
    price: 680000,
    priceSar: 680000,
    priceUsd: 181300,
    mileage: 5000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أسود ملكي فاحم (Obsidian Black)',
    condition: 'new',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'قمة الفخامة الألمانية مرسيدس إس 580، محرك V8 توين تيربو بنظام EQ Boost، تعليق هوائي تفاعلي E-Active Body Control، إضاءة Digital Light المتطورة، وشاشات خلفية مستقلة.',
    descriptionAr: 'قمة الفخامة الألمانية مرسيدس إس 580، محرك V8 توين تيربو بنظام EQ Boost، تعليق هوائي تفاعلي E-Active Body Control، إضاءة Digital Light المتطورة، وشاشات خلفية مستقلة.',
    descriptionEn: 'Mercedes-Benz S580 4MATIC Sedan, 4.0L V8 Biturbo with EQ Boost, Executive Rear Seating with massage, Burmester High-End 4D Sound, Digital Light system.',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1200',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200'
    ],
    specs: {
      makeAr: 'مرسيدس بنز', makeEn: 'Mercedes-Benz', modelAr: 'إس كلاس', modelEn: 'S-Class',
      year: 2024, mileage: 5000, fuelTypeAr: 'بنزين توين تيربو V8', fuelTypeEn: 'Twin-Turbo V8',
      transmissionAr: 'أوتوماتيك 9 سرعات 9G-TRONIC', transmissionEn: '9G-TRONIC Automatic',
      engineCc: '4.0L V8 Biturbo 496HP', seats: 4, driveTypeAr: 'دفع رباعي 4MATIC', driveTypeEn: '4MATIC AWD',
      colorAr: 'أسود ميتاليك ملكي', colorEn: 'Obsidian Black'
    },
    featuresAr: ['نظام صوتي Burmester High-End 4D بـ 31 سماعة', 'إضاءة Digital Light قادرة على عرض إشارات على الطريق', 'توجيه العجلات الخلفية Rear-Axle Steering بزاوية 10 درجات', 'مقاعد خلفية منعدمة الجاذبية من فئة Executive']
  },
  {
    title: 'مرسيدس AMG G63 V8 Biturbo 2024',
    titleAr: 'مرسيدس بنز جي كلاس AMG G63 2024',
    titleEn: 'Mercedes-AMG G63 V8 Biturbo 2024',
    make: 'Mercedes-Benz',
    model: 'G63 AMG',
    year: 2024,
    category: 'suv',
    price: 980000,
    priceSar: 980000,
    priceUsd: 261300,
    mileage: 3000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'رمادي مطفي ديزاينو (Designo Night Black Magno)',
    condition: 'new',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'أيقونة سيارات الدفع الرباعي في العالم، محرك AMG V8 توين تيربو يولد 577 حصان، نظام عادم جانبي مميز بصوت هدّار، حزمة Night Package السوداء بالكامل، وجنوط 22 بوصة.',
    descriptionAr: 'أيقونة سيارات الدفع الرباعي في العالم، محرك AMG V8 توين تيربو يولد 577 حصان، نظام عادم جانبي مميز بصوت هدّار، حزمة Night Package السوداء بالكامل، وجنوط 22 بوصة.',
    descriptionEn: 'Mercedes-AMG G63, 4.0L V8 Biturbo handcrafted engine (577HP), AMG Performance Side Exhaust, Designo Nappa leather interior, 22-inch forged cross-spoke wheels.',
    images: [
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1200',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200'
    ],
    specs: {
      makeAr: 'مرسيدس بنز', makeEn: 'Mercedes-Benz', modelAr: 'G63 AMG', modelEn: 'G63 AMG',
      year: 2024, mileage: 3000, fuelTypeAr: 'بنزين V8 توين تيربو', fuelTypeEn: 'Twin-Turbo V8',
      transmissionAr: 'أوتوماتيك رياضي 9 سرعات AMG SPEEDSHIFT', transmissionEn: 'AMG SPEEDSHIFT TCT 9G',
      engineCc: '4.0L V8 Biturbo 577HP', seats: 5, driveTypeAr: 'دفع رباعي دائم مع 3 أقفال تفاضلية', driveTypeEn: 'AWD with 3 Diff Locks',
      colorAr: 'رمادي مطفي', colorEn: 'Designo Magno'
    },
    featuresAr: ['3 أقفال دفرنس تفاضلية ميكانيكية 100%', 'عوادم جانبية مزدوجة من AMG بصوت صاخب', 'حزمة ألياف الكربون Carbon Fiber Interior', 'شاشتان عريضتان 12.3 بوصة مدمجة']
  },
  {
    title: 'بي إم دبليو X7 xDrive40i M-Sport 2024',
    titleAr: 'بي إم دبليو إكس 7 إم سبورت 2024',
    titleEn: 'BMW X7 xDrive40i M-Sport 2024',
    make: 'BMW',
    model: 'X7',
    year: 2024,
    category: 'suv',
    price: 480000,
    priceSar: 480000,
    priceUsd: 128000,
    mileage: 9000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أبيض كربوني ميتاليك (Mineral White)',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'بي إم دبليو X7 الأكبر والأفخم، واجهة أمامية منقسمة بإضاءة Iconic Glow المتوهجة، شاشة BMW Curved Display المنحنية بنظام iDrive 8.5، وسقف بانوراما Sky Lounge المضاء بالنجوم.',
    descriptionAr: 'بي إم دبليو X7 الأكبر والأفخم، واجهة أمامية منقسمة بإضاءة Iconic Glow المتوهجة، شاشة BMW Curved Display المنحنية بنظام iDrive 8.5، وسقف بانوراما Sky Lounge المضاء بالنجوم.',
    descriptionEn: 'BMW X7 xDrive40i M-Sport, Iconic Glow illuminated kidney grille, Sky Lounge LED panoramic glass roof, Bowers & Wilkins Diamond Surround Sound.',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
    ],
    specs: {
      makeAr: 'بي إم دبليو', makeEn: 'BMW', modelAr: 'X7', modelEn: 'X7',
      year: 2024, mileage: 9000, fuelTypeAr: 'بنزين تيربو 6 سلندر', fuelTypeEn: 'Turbo Inline-6',
      transmissionAr: 'أوتوماتيك 8 سرعات سبورت', transmissionEn: '8-Speed Sport Automatic',
      engineCc: '3.0L TwinPower Turbo 375HP', seats: 7, driveTypeAr: 'دفع رباعي ذكي xDrive', driveTypeEn: 'xDrive AWD',
      colorAr: 'أبيض لؤلؤي', colorEn: 'Mineral White'
    },
    featuresAr: ['سقف بانورامي Sky Lounge مضاء بـ 15000 نقطة ضوئية', 'شبك أمامي مضيء Iconic Glow', 'نظام تعليق هوائي متكيف على المحورين', 'نظام صوتي Bowers & Wilkins Diamond 3D']
  },
  {
    title: 'بورشه 911 كاريرا إس 2024 (Porsche 911 Carrera S)',
    titleAr: 'بورشه 911 كاريرا إس كوبيه 2024',
    titleEn: 'Porsche 911 Carrera S Coupe 2024',
    make: 'Porsche',
    model: '911 Carrera S',
    year: 2024,
    category: 'sports',
    price: 650000,
    priceSar: 650000,
    priceUsd: 173300,
    mileage: 4000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'رمادي طباشيري (Crayon Chalk)',
    condition: 'new',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'الأسطورة بورشه 911 فئة Carrera S بمحرك بوكسر خلفي 6 سلندر توين تيربو بقوة 443 حصان وتسارع 0-100 في 3.3 ثوانٍ فقط، حزمة Sport Chrono ونظام عادم رياضي بصمامات متغيرة.',
    descriptionAr: 'الأسطورة بورشه 911 فئة Carrera S بمحرك بوكسر خلفي 6 سلندر توين تيربو بقوة 443 حصان وتسارع 0-100 في 3.3 ثوانٍ فقط، حزمة Sport Chrono ونظام عادم رياضي بصمامات متغيرة.',
    descriptionEn: 'Porsche 911 Carrera S (992), 3.0L Twin-Turbo Boxer 6 (443HP), Sport Chrono Package with mode switch, 8-Speed PDK, PASM Sport Suspension.',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1200',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200'
    ],
    specs: {
      makeAr: 'بورشه', makeEn: 'Porsche', modelAr: '911 كاريرا إس', modelEn: '911 Carrera S',
      year: 2024, mileage: 4000, fuelTypeAr: 'بنزين عالي الأداء', fuelTypeEn: 'Premium Petrol',
      transmissionAr: 'أوتوماتيك PDK ثنائي التعشيق 8 سرعات', transmissionEn: '8-Speed Porsche Doppelkupplung (PDK)',
      engineCc: '3.0L Twin-Turbo Boxer 6 (443HP)', seats: 4, driveTypeAr: 'دفع خلفي رياضي RWD', driveTypeEn: 'Rear-Wheel Drive',
      colorAr: 'رمادي طباشيري Crayon', colorEn: 'Chalk Gray'
    },
    featuresAr: ['حزمة Sport Chrono مع ساعة توقيت رقمية وتناظرية', 'نظام عادم رياضي بصوت قوي وأنابيب فضية لامعة', 'مكابح بورشه الرياضية بريمبو بالأحمر', 'نظام توجيه المحور الخلفي المتكيف']
  },
  {
    title: 'تويوتا لاند كروزر 300 VXR توين تيربو 2024',
    titleAr: 'تويوتا لاندكروزر 300 في إكس آر 2024',
    titleEn: 'Toyota Land Cruiser 300 VXR Twin Turbo 2024',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2024,
    category: 'suv',
    price: 365000,
    priceSar: 365000,
    priceUsd: 97300,
    mileage: 11000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أبيض لؤلؤي ناصع',
    condition: 'excellent',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'مفخرة الأرض تويوتا لاند كروزر 300 فئة VXR الفاخرة، محرك V6 توين تيربو 3.5L بقوة 409 حصان، هيدروليك متكيف، شاشات خلفية، ثلاجة، ونظام الدفع الرباعي مع وضعيات الزحف.',
    descriptionAr: 'مفخرة الأرض تويوتا لاند كروزر 300 فئة VXR الفاخرة، محرك V6 توين تيربو 3.5L بقوة 409 حصان، هيدروليك متكيف، شاشات خلفية، ثلاجة، ونظام الدفع الرباعي مع وضعيات الزحف.',
    descriptionEn: 'Toyota Land Cruiser 300 VXR, 3.5L Twin-Turbo V6 (409HP), Crawl Control, Multi-Terrain Monitor 3D, Rear Entertainment System, JBL 14-speaker audio.',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200'
    ],
    specs: {
      makeAr: 'تويوتا', makeEn: 'Toyota', modelAr: 'لاند كروزر 300', modelEn: 'Land Cruiser 300',
      year: 2024, mileage: 11000, fuelTypeAr: 'بنزين توين تيربو', fuelTypeEn: 'Twin-Turbo Petrol',
      transmissionAr: 'أوتوماتيك 10 سرعات Direct Shift', transmissionEn: '10-Speed Automatic',
      engineCc: '3.5L V6 Twin-Turbo 409HP', seats: 7, driveTypeAr: 'دفع رباعي مستمر 4WD', driveTypeEn: '4WD with Crawl Control',
      colorAr: 'أبيض لؤلؤي', colorEn: 'White Pearl'
    },
    featuresAr: ['نظام الزحف الذكي والتضاريس المتعددة MTS', 'شاشة ترفيه مركزية 12.3 بوصة مع شاشتين خلفيتين', 'نظام صوتي فاخر JBL بـ 14 سماعة', 'ثلاجة تبريد في مسند الذراع المركزي']
  },
  {
    title: 'لكزس LX600 VIP كونسول منفصل 2024',
    titleAr: 'لكزس إل إكس 600 في آي بي 2024',
    titleEn: 'Lexus LX600 VIP 4-Seater 2024',
    make: 'Lexus',
    model: 'LX600',
    year: 2024,
    category: 'luxury',
    price: 620000,
    priceSar: 620000,
    priceUsd: 165300,
    mileage: 7000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'أسود كريستالي لامع (Sonic Agate)',
    condition: 'new',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'لكزس LX600 أعلى فئة VIP بـ 4 مقاعد ملكية منفصلة، مقاعد خلفية قابلة للميلان بزاوية 48 درجة مع مساج وتبريد وتدفئة، نظام تعليق AHC المتكيف، ونظام Mark Levinson.',
    descriptionAr: 'لكزس LX600 أعلى فئة VIP بـ 4 مقاعد ملكية منفصلة، مقاعد خلفية قابلة للميلان بزاوية 48 درجة مع مساج وتبريد وتدفئة، نظام تعليق AHC المتكيف، ونظام Mark Levinson.',
    descriptionEn: 'Lexus LX600 VIP 4-Seater Ultra Luxury, 48-degree reclining rear executive chairs with footrest, Mark Levinson 25-speaker 3D audio, Adaptive Variable Suspension.',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
    ],
    specs: {
      makeAr: 'لكزس', makeEn: 'Lexus', modelAr: 'LX600 VIP', modelEn: 'LX600 VIP',
      year: 2024, mileage: 7000, fuelTypeAr: 'بنزين توين تيربو', fuelTypeEn: 'Twin-Turbo Petrol',
      transmissionAr: 'أوتوماتيك 10 سرعات', transmissionEn: '10-Speed Automatic',
      engineCc: '3.5L V6 Twin-Turbo 409HP', seats: 4, driveTypeAr: 'دفع كلي مستمر Full-Time 4WD', driveTypeEn: 'Full-Time 4WD',
      colorAr: 'أسود كريستالي', colorEn: 'Sonic Titanium / Black'
    },
    featuresAr: ['4 مقاعد ملكية VIP منفصلة مع مسند أقدام وشاشات خاصة', 'نظام تعليق هيدروليكي متغير الارتفاع AHC بأربع مستويات', 'نظام صوت Mark Levinson بـ 25 مكبر صوت ثلاثي الأبعاد', 'شاشة تحكم لمسية خلفية مع ثلاجة مشروبات خاصة']
  },
  {
    title: 'رينج روفر أوتوبيوغرافي P530 V8 2024',
    titleAr: 'رينج روفر أوتوبيوغرافي 2024',
    titleEn: 'Range Rover Autobiography P530 2024',
    make: 'Land Rover',
    model: 'Range Rover',
    year: 2024,
    category: 'luxury',
    price: 890000,
    priceSar: 890000,
    priceUsd: 237300,
    mileage: 3500,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'فضي ساتان فاخر (Batumi Gold / Silicon Silver)',
    condition: 'new',
    listingType: 'showroom',
    source: 'hm_local',
    description: 'رينج روفر الجيل الجديد فئة Autobiography، محرك V8 توين تيربو بقوة 523 حصان، توجيه رباعي لجميع العجلات، مقاعد جلد أنيلين ناعم الملمس، وأبواب تغلق كهربائياً بنعومة.',
    descriptionAr: 'رينج روفر الجيل الجديد فئة Autobiography، محرك V8 توين تيربو بقوة 523 حصان، توجيه رباعي لجميع العجلات، مقاعد جلد أنيلين ناعم الملمس، وأبواب تغلق كهربائياً بنعومة.',
    descriptionEn: 'Range Rover Autobiography P530, 4.4L Twin-Turbo V8 (523HP), All-Wheel Steering, Meridian Signature Sound (35 speakers + noise cancellation in headrests).',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200'
    ],
    specs: {
      makeAr: 'لاند روفر', makeEn: 'Land Rover', modelAr: 'رينج روفر', modelEn: 'Range Rover',
      year: 2024, mileage: 3500, fuelTypeAr: 'بنزين V8 توين تيربو', fuelTypeEn: 'Twin-Turbo V8',
      transmissionAr: 'أوتوماتيك 8 سرعات ZF', transmissionEn: '8-Speed ZF Automatic',
      engineCc: '4.4L Twin-Turbo V8 523HP', seats: 5, driveTypeAr: 'دفع كلي إلكتروني ذكي AWD', driveTypeEn: 'AWD with Terrain Response 2',
      colorAr: 'فضي ساتان', colorEn: 'Silicon Silver'
    },
    featuresAr: ['نظام إلغاء الضوضاء النشط المدمج في مساند الرأس', 'توجيه قياسي لجميع العجلات الأربع All-Wheel Steering', 'نظام صوتي Meridian Signature بقوة 1600 واط بـ 35 سماعة', 'أبواب كهربائية بالكامل تفتح وتغلق آلياً']
  }
];

const BRANDS_DATA = [
  { key: 'genesis', name: 'Genesis', nameAr: 'جينيسيس', country: 'كوريا الجنوبية', logoUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=400', isLuxury: true },
  { key: 'hyundai', name: 'Hyundai', nameAr: 'هيونداي', country: 'كوريا الجنوبية', logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400', isLuxury: false },
  { key: 'kia', name: 'Kia', nameAr: 'كيا', country: 'كوريا الجنوبية', logoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400', isLuxury: false },
  { key: 'mercedes-benz', name: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', country: 'ألمانيا', logoUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=400', isLuxury: true },
  { key: 'bmw', name: 'BMW', nameAr: 'بي إم دبليو', country: 'ألمانيا', logoUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=400', isLuxury: true },
  { key: 'porsche', name: 'Porsche', nameAr: 'بورشه', country: 'ألمانيا', logoUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=400', isLuxury: true },
  { key: 'land-rover', name: 'Land Rover', nameAr: 'لاند روفر', country: 'بريطانيا', logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400', isLuxury: true },
  { key: 'lexus', name: 'Lexus', nameAr: 'لكزس', country: 'اليابان', logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400', isLuxury: true },
  { key: 'toyota', name: 'Toyota', nameAr: 'تويوتا', country: 'اليابان', logoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400', isLuxury: false },
  { key: 'kg-mobility', name: 'KG Mobility', nameAr: 'كي جي موبيليتي (سانغ يونغ)', country: 'كوريا الجنوبية', logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400', isLuxury: false },
  { key: 'renault-korea', name: 'Renault Korea', nameAr: 'رينو الكورية (سامسونج)', country: 'كوريا الجنوبية', logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400', isLuxury: false },
];

async function run() {
  console.log('🚀 بدء إعادة هيكلة وتنظيف بيانات قاعدة البيانات بالكامل...');
  await mongoose.connect(process.env.MONGO_URI);
  
  const Car = require('../models/Car');
  const Brand = require('../models/Brand');
  const SparePart = require('../models/SparePart');

  // 1. تحديث وإنشاء الوكالات / البراندات
  console.log('📦 تحديث الوكالات والماركات...');
  const brandMap = {};
  for (const b of BRANDS_DATA) {
    const existing = await Brand.findOneAndUpdate(
      { key: b.key },
      { $set: { ...b, isActive: true } },
      { upsert: true, returnDocument: 'after' }
    );
    brandMap[b.name] = existing._id;
  }
  console.log(`✅ تم تحديث ${Object.keys(brandMap).length} وكالة بنجاح.`);

  // 2. معالجة وحفظ قائمة السيارات النموذجية النظيفة
  console.log('🚗 معالجة وتنظيف مخزون السيارات المعروضة...');
  
  // نقوم بتحديث السيارات لتكون فائقة النقاء
  let count = 0;
  for (const car of CARS_DATA) {
    const agencyId = brandMap[car.make] || null;
    const firstImg = car.images[0];
    
    await Car.findOneAndUpdate(
      { title: car.title },
      {
        $set: {
          ...car,
          tenantId: 'carx',
          agency: agencyId,
          imageUrl: firstImg,
          mainImage: firstImg,
          image: firstImg,
          isActive: true,
          isSold: false,
          inspectionReport: {
            statusAr: 'تقرير الفحص: هيكل وكالة سليم 100% بدون أي حوادث سابقة',
            statusEn: 'Official Report: Clean vehicle history, no accident damage recorded',
            hasAccidents: false,
            accidentCount: 0,
            hasFloodDamage: false,
            hasFireDamage: false,
            ownerChangeCount: 1,
          },
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    count++;
  }
  console.log(`✅ تم إدخال/تحديث ${count} سيارة نموذجية نظيفة وفاخرة.`);

  // 3. تنظيف السيارات القديمة المكررة في قاعدة البيانات
  console.log('🧹 تنظيف أي سجلات قديمة أو تالفة...');
  
  // مسح السجلات المكررة التي تحتوي نصوص كورية في العنوان أو أرقام تاريخ كوري
  const messyCars = await Car.find({
    $or: [
      { title: { $regex: '[가-힣]' } },
      { make: { $regex: '[가-힣]' } },
      { model: { $regex: '[가-힣]' } },
      { title: { $regex: '20[0-9]{4}' } } // e.g. 202401, 201909
    ]
  });

  console.log(`وجد ${messyCars.length} سيارة تحتاج تنظيف/إزالة تكرار...`);
  for (const mc of messyCars) {
    // إذا كانت غير مطابقة للقائمة النظيفة، نزيل النصوص الكورية ونصلح العنوان والسعر
    let cleanTitle = mc.title.replace(/[가-힣]/g, '').replace(/20[0-9]{4}/g, '').replace(/\s+/g, ' ').trim();
    let cleanMake = (mc.make || '').replace(/[가-힣]/g, '').trim() || 'كوري مستورد';
    let cleanModel = (mc.model || '').replace(/[가-힣]/g, '').trim() || 'صالون';
    let cleanPrice = Math.round(Number(mc.price) || 50000);
    if (cleanPrice < 10000) cleanPrice = cleanPrice * 10;
    
    if (cleanTitle.length < 5) {
      cleanTitle = `${cleanMake} ${cleanModel} ${mc.year || 2022}`;
    }

    const firstImage = (mc.images && mc.images.length > 0) ? mc.images[0] : (mc.mainImage || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200');

    await Car.findByIdAndUpdate(mc._id, {
      $set: {
        title: cleanTitle,
        titleAr: cleanTitle,
        make: cleanMake,
        model: cleanModel,
        price: cleanPrice,
        priceSar: cleanPrice,
        mainImage: firstImage,
        imageUrl: firstImage,
        image: firstImage,
        tenantId: 'carx',
        isActive: true,
        isSold: false
      }
    });
  }

  // 4. التأكد من أن كل السيارات لديها tenantId متوافق وصور رئيسية صالحة
  await Car.updateMany(
    { $or: [{ tenantId: { $exists: false } }, { tenantId: 'hmcar' }, { tenantId: 'default' }] },
    { $set: { tenantId: 'carx', isActive: true } }
  );

  const totalCarsAfter = await Car.countDocuments();
  console.log(`\n🎉 اكتمل التنظيف والمزامنة بنجاح! إجمالي السيارات المتاحة الآن: ${totalCarsAfter}`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ خطأ أثناء التنفيذ:', err);
  process.exit(1);
});
