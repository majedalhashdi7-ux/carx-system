#!/usr/bin/env node
/**
 * سكريبت تنظيف وإعادة زرع قطع الغيار الأصلية النظيفة لمنصة HM CAR
 * 1. حذف القطع التالفة والمشوهة
 * 2. زرع 80+ قطعة غيار حقيقية بأعلى جودة مع دعم لغوي متكامل (عربي/إنجليزي)
 */
require('dotenv').config();
const axios = require('axios');

const PROD_BASE = 'https://hmcar-system-two.vercel.app';
const IMPORT_SECRET = 'hmcar-import-2026';

// قائمة قطع الغيار الأصلية الموثوقة مع صور عالية الجودة
const GENUINE_PARTS = [
    // ─── GENESIS ───
    {
        name: 'طقم فحمات فرامل سيراميك أمامية أصلية - جينيسيس GV80 / G80',
        nameAr: 'طقم فحمات فرامل سيراميك أمامية أصلية - جينيسيس GV80 / G80',
        nameEn: 'Genuine OEM Front Ceramic Brake Pads Kit - Genesis GV80 / G80',
        brand: 'Genesis',
        carMake: 'Genesis',
        carMakeEn: 'Genesis',
        carModel: 'GV80',
        carModelEn: 'GV80',
        carYear: 2024,
        category: 'Brakes',
        categoryAr: 'فرامل',
        partType: 'Brakes',
        partTypeEn: 'Brakes',
        partTypeAr: 'فرامل',
        condition: 'NEW',
        price: 450,
        priceSar: 1687,
        priceUsd: 450,
        priceKrw: 607500,
        basePriceUsd: 450,
        stockQty: 18,
        compatibility: ['GV80', 'G80', 'GV70', 'G90'],
        images: [
            'https://images.unsplash.com/photo-1600703136783-bdd5e9867c49?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'طقم فحمات فرامل أمامية سيراميك أصلية معتمدة من مصنع جينيسيس كوريا توفر أعلى درجات الأداء والاستجابة بدون ضوضاء.',
        descriptionAr: 'طقم فحمات فرامل أمامية سيراميك أصلية معتمدة من مصنع جينيسيس كوريا توفر أعلى درجات الأداء والاستجابة بدون ضوضاء.',
        inStock: true
    },
    {
        name: 'شمعة إضاءة ليد ذكية كاملة أصلية (يسار) - جينيسيس G80 (RG3)',
        nameAr: 'شمعة إضاءة ليد ذكية كاملة أصلية (يسار) - جينيسيس G80 (RG3)',
        nameEn: 'Genuine Full LED Adaptive Headlamp Unit (Left) - Genesis G80 (RG3)',
        brand: 'Genesis',
        carMake: 'Genesis',
        carMakeEn: 'Genesis',
        carModel: 'G80',
        carModelEn: 'G80',
        carYear: 2023,
        category: 'Lights',
        categoryAr: 'إضاءة وشمعات',
        partType: 'Lights',
        partTypeEn: 'Lights',
        partTypeAr: 'إضاءة وشمعات',
        condition: 'NEW',
        price: 1350,
        priceSar: 5062,
        priceUsd: 1350,
        priceKrw: 1822500,
        basePriceUsd: 1350,
        stockQty: 6,
        compatibility: ['G80', 'Electrified G80', 'GV80'],
        images: [
            'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'شمعة ليد ماتريكس أصلية بتقنية الإضاءة التفاعلية الذكية كاملة مع وحدات التحكم.',
        descriptionAr: 'شمعة ليد ماتريكس أصلية بتقنية الإضاءة التفاعلية الذكية كاملة مع وحدات التحكم.',
        inStock: true
    },
    {
        name: 'مساعد هيدروليكي هوائي أمريكي/كوري متكيف - جينيسيس G90',
        nameAr: 'مساعد هيدروليكي هوائي متكيف - جينيسيس G90',
        nameEn: 'Adaptive Air Suspension Strut Assembly - Genesis G90',
        brand: 'Genesis',
        carMake: 'Genesis',
        carMakeEn: 'Genesis',
        carModel: 'G90',
        carModelEn: 'G90',
        carYear: 2024,
        category: 'Suspension',
        categoryAr: 'نظام التعليق',
        partType: 'Suspension',
        partTypeEn: 'Suspension',
        partTypeAr: 'نظام التعليق',
        condition: 'NEW',
        price: 1100,
        priceSar: 4125,
        priceUsd: 1100,
        priceKrw: 1485000,
        basePriceUsd: 1100,
        stockQty: 8,
        compatibility: ['G90', 'G90 LWB'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'مساعد تعليق هوائي متطور يوفر أقصى درجات الراحة والثبات على المنعطفات والسرعات العالية.',
        descriptionAr: 'مساعد تعليق هوائي متطور يوفر أقصى درجات الراحة والثبات على المنعطفات والسرعات العالية.',
        inStock: true
    },
    {
        name: 'شبك أمامي رياضي بتطعيمات كروم أسود - جينيسيس GV70 Sport',
        nameAr: 'شبك أمامي رياضي بتطعيمات كروم أسود - جينيسيس GV70 Sport',
        nameEn: 'Front Sport Crest Grille with Dark Chrome Accents - Genesis GV70',
        brand: 'Genesis',
        carMake: 'Genesis',
        carMakeEn: 'Genesis',
        carModel: 'GV70',
        carModelEn: 'GV70',
        carYear: 2024,
        category: 'Body',
        categoryAr: 'هيكل وبودي',
        partType: 'Body',
        partTypeEn: 'Body',
        partTypeAr: 'هيكل وبودي',
        condition: 'NEW',
        price: 520,
        priceSar: 1950,
        priceUsd: 520,
        priceKrw: 702000,
        basePriceUsd: 520,
        stockQty: 12,
        compatibility: ['GV70', 'GV70 Sport'],
        images: [
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'شبك أمامي أصلي بتصميم الشبكة الهندسية الشهيرة لجينيسيس مع تشطيب فاخر مقاوم للخدوش.',
        descriptionAr: 'شبك أمامي أصلي بتصميم الشبكة الهندسية الشهيرة لجينيسيس مع تشطيب فاخر مقاوم للخدوش.',
        inStock: true
    },

    // ─── HYUNDAI ───
    {
        name: 'شاحن تيربو أصلي كامل - هيونداي سوناتا / سنتافي 2.5T تيربو',
        nameAr: 'شاحن تيربو أصلي كامل - هيونداي سوناتا / سنتافي 2.5T تيربو',
        nameEn: 'Genuine OEM Turbocharger Assembly - Hyundai Sonata / Santa Fe 2.5T',
        brand: 'Hyundai',
        carMake: 'Hyundai',
        carMakeEn: 'Hyundai',
        carModel: 'Sonata',
        carModelEn: 'Sonata',
        carYear: 2023,
        category: 'Engine',
        categoryAr: 'محرك',
        partType: 'Engine',
        partTypeEn: 'Engine',
        partTypeAr: 'محرك',
        condition: 'NEW',
        price: 1200,
        priceSar: 4500,
        priceUsd: 1200,
        priceKrw: 1620000,
        basePriceUsd: 1200,
        stockQty: 7,
        compatibility: ['Sonata', 'Santa Fe', 'Tucson', 'Palisade'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'شاحن تيربو أصلي مع بلف التحكم الإلكتروني وحساس الضغط لمكائن Smartstream 2.5L Turbo.',
        descriptionAr: 'شاحن تيربو أصلي مع بلف التحكم الإلكتروني وحساس الضغط لمكائن Smartstream 2.5L Turbo.',
        inStock: true
    },
    {
        name: 'طقم ديسكات وفرامل أمامية رياضية مهواة - هيونداي إلنترا N / N-Line',
        nameAr: 'طقم ديسكات وفرامل أمامية رياضية مهواة - هيونداي إلنترا N / N-Line',
        nameEn: 'Front Ventilated Performance Brake Discs Kit - Hyundai Elantra N',
        brand: 'Hyundai',
        carMake: 'Hyundai',
        carMakeEn: 'Hyundai',
        carModel: 'Elantra',
        carModelEn: 'Elantra',
        carYear: 2024,
        category: 'Brakes',
        categoryAr: 'فرامل',
        partType: 'Brakes',
        partTypeEn: 'Brakes',
        partTypeAr: 'فرامل',
        condition: 'NEW',
        price: 380,
        priceSar: 1425,
        priceUsd: 380,
        priceKrw: 513000,
        basePriceUsd: 380,
        stockQty: 24,
        compatibility: ['Elantra', 'Elantra N', 'Sonata', 'Kona'],
        images: [
            'https://images.unsplash.com/photo-1600703136783-bdd5e9867c49?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'ديسكات فرامل مهواة معالجة حرارياً لتحمل أقسى درجات الحرارة والاستخدام الشاق.',
        descriptionAr: 'ديسكات فرامل مهواة معالجة حرارياً لتحمل أقسى درجات الحرارة والاستخدام الشاق.',
        inStock: true
    },
    {
        name: 'طقم فلاتر صيانة دورية شامل (زيت + هواء + مكيف + بنزين) - هيونداي باليسيد / سنتافي',
        nameAr: 'طقم فلاتر صيانة دورية شامل - هيونداي باليسيد / سنتافي',
        nameEn: 'Complete OEM Maintenance Filters Set (Oil + Air + Cabin + Fuel) - Hyundai Palisade',
        brand: 'Hyundai',
        carMake: 'Hyundai',
        carMakeEn: 'Hyundai',
        carModel: 'Palisade',
        carModelEn: 'Palisade',
        carYear: 2024,
        category: 'Filters',
        categoryAr: 'فلاتر',
        partType: 'Filters',
        partTypeEn: 'Filters',
        partTypeAr: 'فلاتر',
        condition: 'NEW',
        price: 120,
        priceSar: 450,
        priceUsd: 120,
        priceKrw: 162000,
        basePriceUsd: 120,
        stockQty: 50,
        compatibility: ['Palisade', 'Santa Fe', 'Tucson', 'Sonata'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'باقة الفلاتر الأصلية المعتمدة من Mobis للصيانة الدورية الشاملة لأداء نقي وعمر محرك أطول.',
        descriptionAr: 'باقة الفلاتر الأصلية المعتمدة من Mobis للصيانة الدورية الشاملة لأداء نقي وعمر محرك أطول.',
        inStock: true
    },
    {
        name: 'كمبروسر مكيف أصلي بنظام التحكم الإلكتروني - هيونداي توسان / كونا',
        nameAr: 'كمبروسر مكيف أصلي بنظام التحكم الإلكتروني - هيونداي توسان / كونا',
        nameEn: 'OEM AC Air Conditioning Compressor - Hyundai Tucson / Kona',
        brand: 'Hyundai',
        carMake: 'Hyundai',
        carMakeEn: 'Hyundai',
        carModel: 'Tucson',
        carModelEn: 'Tucson',
        carYear: 2023,
        category: 'Cooling',
        categoryAr: 'نظام التبريد',
        partType: 'Cooling',
        partTypeEn: 'Cooling',
        partTypeAr: 'نظام التبريد',
        condition: 'NEW',
        price: 620,
        priceSar: 2325,
        priceUsd: 620,
        priceKrw: 837000,
        basePriceUsd: 620,
        stockQty: 15,
        compatibility: ['Tucson', 'Kona', 'Elantra', 'Sonata'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'كمبروسر تكييف أصلي عالي الكفاءة يضمن أعلى درجات البرودة في الأجواء الحارة.',
        descriptionAr: 'كمبروسر تكييف أصلي عالي الكفاءة يضمن أعلى درجات البرودة في الأجواء الحارة.',
        inStock: true
    },

    // ─── KIA ───
    {
        name: 'طقم مساعدات رياضية متطورة مع اليايات - كيا K5 / K8',
        nameAr: 'طقم مساعدات رياضية متطورة مع اليايات - كيا K5 / K8',
        nameEn: 'Performance Suspension Struts & Springs Assembly - Kia K5 / K8',
        brand: 'Kia',
        carMake: 'Kia',
        carMakeEn: 'Kia',
        carModel: 'K5',
        carModelEn: 'K5',
        carYear: 2024,
        category: 'Suspension',
        categoryAr: 'نظام التعليق',
        partType: 'Suspension',
        partTypeEn: 'Suspension',
        partTypeAr: 'نظام التعليق',
        condition: 'NEW',
        price: 740,
        priceSar: 2775,
        priceUsd: 740,
        priceKrw: 999000,
        basePriceUsd: 740,
        stockQty: 14,
        compatibility: ['K5', 'K8', 'K7', 'Stinger'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'طقم مساعدات كامل أمامي وخلفي يمنح السيارة عزلاً فائقاً وثباتاً رياضياً فائقاً.',
        descriptionAr: 'طقم مساعدات كامل أمامي وخلفي يمنح السيارة عزلاً فائقاً وثباتاً رياضياً فائقاً.',
        inStock: true
    },
    {
        name: 'شريط إضاءة خلفية ليد متصل أصلي - كيا سبورتاج / سورينتو 2024',
        nameAr: 'شريط إضاءة خلفية ليد متصل أصلي - كيا سبورتاج / سورينتو 2024',
        nameEn: 'Full Width LED Tail Lamp Lightbar Assembly - Kia Sportage / Sorento',
        brand: 'Kia',
        carMake: 'Kia',
        carMakeEn: 'Kia',
        carModel: 'Sportage',
        carModelEn: 'Sportage',
        carYear: 2024,
        category: 'Lights',
        categoryAr: 'إضاءة وشمعات',
        partType: 'Lights',
        partTypeEn: 'Lights',
        partTypeAr: 'إضاءة وشمعات',
        condition: 'NEW',
        price: 490,
        priceSar: 1837,
        priceUsd: 490,
        priceKrw: 661500,
        basePriceUsd: 490,
        stockQty: 10,
        compatibility: ['Sportage', 'Sorento', 'Carnival', 'EV6'],
        images: [
            'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'الإضاءة الخلفية المتصلة الأصلية بتصميم Star-Map العصري من كيا.',
        descriptionAr: 'الإضاءة الخلفية المتصلة الأصلية بتصميم Star-Map العصري من كيا.',
        inStock: true
    },
    {
        name: 'طرمبة بنزين ضغط عالي GDI أصلية - كيا سورينتو / كارنيفال 3.5 V6',
        nameAr: 'طرمبة بنزين ضغط عالي GDI أصلية - كيا سورينتو / كارنيفال 3.5 V6',
        nameEn: 'High Pressure Direct Injection Fuel Pump (GDI) - Kia Sorento / Carnival 3.5 V6',
        brand: 'Kia',
        carMake: 'Kia',
        carMakeEn: 'Kia',
        carModel: 'Carnival',
        carModelEn: 'Carnival',
        carYear: 2023,
        category: 'Engine',
        categoryAr: 'محرك',
        partType: 'Engine',
        partTypeEn: 'Engine',
        partTypeAr: 'محرك',
        condition: 'NEW',
        price: 360,
        priceSar: 1350,
        priceUsd: 360,
        priceKrw: 486000,
        basePriceUsd: 360,
        stockQty: 16,
        compatibility: ['Carnival', 'Sorento', 'Telluride', 'K8', 'K9'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'مضخة وقود ضغط عالي أصلية تضمن حقن الوقود الدقيق واستقرار عزم المحرك.',
        descriptionAr: 'مضخة وقود ضغط عالي أصلية تضمن حقن الوقود الدقيق واستقرار عزم المحرك.',
        inStock: true
    },

    // ─── MERCEDES-BENZ ───
    {
        name: 'طقم فحمات فرامل سيراميك AMG أصلية - مرسيدس S-Class (W223) / E-Class (W213)',
        nameAr: 'طقم فحمات فرامل سيراميك AMG أصلية - مرسيدس S-Class / E-Class',
        nameEn: 'Genuine Mercedes-AMG Front Ceramic Brake Pads Set - S-Class / E-Class',
        brand: 'Mercedes-Benz',
        carMake: 'Mercedes-Benz',
        carMakeEn: 'Mercedes-Benz',
        carModel: 'S-Class',
        carModelEn: 'S-Class',
        carYear: 2024,
        category: 'Brakes',
        categoryAr: 'فرامل',
        partType: 'Brakes',
        partTypeEn: 'Brakes',
        partTypeAr: 'فرامل',
        condition: 'NEW',
        price: 680,
        priceSar: 2550,
        priceUsd: 680,
        priceKrw: 918000,
        basePriceUsd: 680,
        stockQty: 12,
        compatibility: ['S-Class', 'E-Class', 'C-Class', 'G-Class', 'GLE', 'GLS'],
        images: [
            'https://images.unsplash.com/photo-1600703136783-bdd5e9867c49?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'فحمات فرامل أصلية من مرسيدس بنز توفر قوة كبح جبارة وعمر تشغيلي طويل.',
        descriptionAr: 'فحمات فرامل أصلية من مرسيدس بنز توفر قوة كبح جبارة وعمر تشغيلي طويل.',
        inStock: true
    },
    {
        name: 'كمبروسر تعليق هوائي Airmatic أصلي - مرسيدس S-Class / G-Class / GLE',
        nameAr: 'كمبروسر تعليق هوائي Airmatic أصلي - مرسيدس S-Class / G-Class / GLE',
        nameEn: 'Genuine Airmatic Air Suspension Compressor Pump - Mercedes-Benz S-Class / GLE',
        brand: 'Mercedes-Benz',
        carMake: 'Mercedes-Benz',
        carMakeEn: 'Mercedes-Benz',
        carModel: 'S-Class',
        carModelEn: 'S-Class',
        carYear: 2023,
        category: 'Suspension',
        categoryAr: 'نظام التعليق',
        partType: 'Suspension',
        partTypeEn: 'Suspension',
        partTypeAr: 'نظام التعليق',
        condition: 'NEW',
        price: 1450,
        priceSar: 5437,
        priceUsd: 1450,
        priceKrw: 1957500,
        basePriceUsd: 1450,
        stockQty: 5,
        compatibility: ['S-Class', 'G-Class', 'GLE', 'GLS', 'E-Class'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'مضخة نظام الإيرماتيك الهوائي الأصلية من مرسيدس لتنظيم ارتفاع السيارة تلقائياً.',
        descriptionAr: 'مضخة نظام الإيرماتيك الهوائي الأصلية من مرسيدس لتنظيم ارتفاع السيارة تلقائياً.',
        inStock: true
    },

    // ─── BMW ───
    {
        name: 'طقم ديسكات فرامل M-Performance مقوسة ومثقوبة - بي إم دبليو الفئة السابعة / X5 / X7',
        nameAr: 'طقم ديسكات فرامل M-Performance مقوسة ومثقوبة - بي إم دبليو الفئة السابعة / X5 / X7',
        nameEn: 'BMW M-Performance Drilled & Slotted Brake Rotors Pair - 7 Series / X5 / X7',
        brand: 'BMW',
        carMake: 'BMW',
        carMakeEn: 'BMW',
        carModel: '7 Series',
        carModelEn: '7 Series',
        carYear: 2024,
        category: 'Brakes',
        categoryAr: 'فرامل',
        partType: 'Brakes',
        partTypeEn: 'Brakes',
        partTypeAr: 'فرامل',
        condition: 'NEW',
        price: 890,
        priceSar: 3337,
        priceUsd: 890,
        priceKrw: 1201500,
        basePriceUsd: 890,
        stockQty: 9,
        compatibility: ['7 Series', '5 Series', 'X5', 'X6', 'X7', 'M5'],
        images: [
            'https://images.unsplash.com/photo-1600703136783-bdd5e9867c49?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'ديسكات فرامل M-Performance عالية التهوية تمنع التلاشي الحراري وتضمن التوقف الفوري.',
        descriptionAr: 'ديسكات فرامل M-Performance عالية التهوية تمنع التلاشي الحراري وتضمن التوقف الفوري.',
        inStock: true
    },
    {
        name: 'شمعة ليد ليزر كاملة أصلية - بي إم دبليو X5 (G05) / X6 (G06)',
        nameAr: 'شمعة ليد ليزر كاملة أصلية - بي إم دبليو X5 / X6',
        nameEn: 'Genuine BMW Laserlight Adaptive Headlight Assembly - X5 / X6',
        brand: 'BMW',
        carMake: 'BMW',
        carMakeEn: 'BMW',
        carModel: 'X5',
        carModelEn: 'X5',
        carYear: 2024,
        category: 'Lights',
        categoryAr: 'إضاءة وشمعات',
        partType: 'Lights',
        partTypeEn: 'Lights',
        partTypeAr: 'إضاءة وشمعات',
        condition: 'NEW',
        price: 1850,
        priceSar: 6937,
        priceUsd: 1850,
        priceKrw: 2497500,
        basePriceUsd: 1850,
        stockQty: 4,
        compatibility: ['X5', 'X6', 'X7', '5 Series', '7 Series'],
        images: [
            'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'شمعة بي إم دبليو ليزر لايت الأصلية بمدى إضاءة يتجاوز 500 متر مع تحديد المسار الذكي.',
        descriptionAr: 'شمعة بي إم دبليو ليزر لايت الأصلية بمدى إضاءة يتجاوز 500 متر مع تحديد المسار الذكي.',
        inStock: true
    },

    // ─── TOYOTA / LEXUS ───
    {
        name: 'طقم مساعدات وفحمات أصلي تويوتا لاندكروزر LC300 / لكزس LX600',
        nameAr: 'طقم مساعدات وفحمات أصلي تويوتا لاندكروزر LC300 / لكزس LX600',
        nameEn: 'Genuine Heavy Duty Suspension & Brake Overhaul Kit - Land Cruiser LC300 / LX600',
        brand: 'Toyota',
        carMake: 'Toyota',
        carMakeEn: 'Toyota',
        carModel: 'Land Cruiser',
        carModelEn: 'Land Cruiser',
        carYear: 2024,
        category: 'Suspension',
        categoryAr: 'نظام التعليق',
        partType: 'Suspension',
        partTypeEn: 'Suspension',
        partTypeAr: 'نظام التعليق',
        condition: 'NEW',
        price: 950,
        priceSar: 3562,
        priceUsd: 950,
        priceKrw: 1282500,
        basePriceUsd: 950,
        stockQty: 16,
        compatibility: ['Land Cruiser', 'LX600', 'Prado', 'Sequoia'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'طقم الصيانة الشامل للتعليق والفرامل من تويوتا اليابانية مخصص للطرق الوعرة والصحراوية.',
        descriptionAr: 'طقم الصيانة الشامل للتعليق والفرامل من تويوتا اليابانية مخصص للطرق الوعرة والصحراوية.',
        inStock: true
    },
    {
        name: 'بطارية هايبرد أصلية معتمدة مع وحدة الإدارة - تويوتا كامري / لكزس ES300h',
        nameAr: 'بطارية هايبرد أصلية معتمدة مع وحدة الإدارة - تويوتا كامري / لكزس ES300h',
        nameEn: 'Genuine OEM Hybrid High Voltage Traction Battery - Toyota Camry / Lexus ES300h',
        brand: 'Toyota',
        carMake: 'Toyota',
        carMakeEn: 'Toyota',
        carModel: 'Camry',
        carModelEn: 'Camry',
        carYear: 2023,
        category: 'Electrical',
        categoryAr: 'كهرباء',
        partType: 'Electrical',
        partTypeEn: 'Electrical',
        partTypeAr: 'كهرباء',
        condition: 'NEW',
        price: 1950,
        priceSar: 7312,
        priceUsd: 1950,
        priceKrw: 2632500,
        basePriceUsd: 1950,
        stockQty: 8,
        compatibility: ['Camry', 'Corolla', 'Crown', 'ES300h', 'RAV4'],
        images: [
            'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'
        ],
        description: 'بطارية هايبرد جديدة بالكامل مع نظام التبريد وحساسات الشحن والتفريغ الأصلية من Denso/Toyota.',
        descriptionAr: 'بطارية هايبرد جديدة بالكامل مع نظام التبريد وحساسات الشحن والتفريغ الأصلية من Denso/Toyota.',
        inStock: true
    }
];

// دالة لتوليد المزيد من القطع المتنوعة لتغطية كل الفئات والموديلات
function generateExtendedCatalog() {
    const categories = [
        { en: 'Brakes', ar: 'فرامل' },
        { en: 'Engine', ar: 'محرك' },
        { en: 'Suspension', ar: 'نظام التعليق' },
        { en: 'Electrical', ar: 'كهرباء' },
        { en: 'Body', ar: 'هيكل وبودي' },
        { en: 'Filters', ar: 'فلاتر' },
        { en: 'Lights', ar: 'إضاءة وشمعات' },
        { en: 'Transmission', ar: 'ناقل الحركة' },
        { en: 'Cooling', ar: 'نظام التبريد' }
    ];

    const brands = [
        { en: 'Genesis', ar: 'جينيسيس', models: ['GV80', 'G80', 'GV70', 'G70', 'G90'] },
        { en: 'Hyundai', ar: 'هيونداي', models: ['Sonata', 'Elantra', 'Santa Fe', 'Tucson', 'Palisade', 'Azera', 'Kona'] },
        { en: 'Kia', ar: 'كيا', models: ['K5', 'K8', 'Sportage', 'Sorento', 'Carnival', 'EV6', 'Telluride'] },
        { en: 'Mercedes-Benz', ar: 'مرسيدس بنز', models: ['S-Class', 'E-Class', 'C-Class', 'G-Class', 'GLE', 'GLC'] },
        { en: 'BMW', ar: 'بي إم دبليو', models: ['7 Series', '5 Series', '3 Series', 'X5', 'X6', 'X7'] },
        { en: 'Toyota', ar: 'تويوتا', models: ['Land Cruiser', 'Camry', 'Corolla', 'Prado', 'RAV4', 'Hilux', 'Crown'] },
        { en: 'Lexus', ar: 'لكزس', models: ['LX600', 'LX570', 'ES350', 'LS500', 'RX350', 'GX460'] }
    ];

    const allParts = [...GENUINE_PARTS];

    const partTemplates = [
        {
            titleAr: 'طقم أقمشة فرامل خلفية أصلية',
            titleEn: 'Genuine Rear Brake Pads Set',
            catIndex: 0,
            basePrice: 160
        },
        {
            titleAr: 'طقم بواجي إيريديوم ليزر أصلية (6 حبات)',
            titleEn: 'Laser Iridium Spark Plugs Set of 6',
            catIndex: 1,
            basePrice: 110
        },
        {
            titleAr: 'فلتر زيت محرك أصلي مع الحلقات',
            titleEn: 'Genuine Engine Oil Filter Kit with O-Rings',
            catIndex: 5,
            basePrice: 28
        },
        {
            titleAr: 'فلتر هواء مكيف كربون نانو منقي للروائح',
            titleEn: 'Activated Nano-Carbon Cabin Air Filter',
            catIndex: 5,
            basePrice: 45
        },
        {
            titleAr: 'دينامو شحن أصلي عالي القدرة',
            titleEn: 'High Output OEM Alternator Assembly',
            catIndex: 3,
            basePrice: 480
        },
        {
            titleAr: 'مجموعة سير المحرك والشدادات الأصلية',
            titleEn: 'Serpentine Drive Belt & Tensioner Kit',
            catIndex: 1,
            basePrice: 190
        },
        {
            titleAr: 'رديتر ماء تبريد محرك ألمنيوم مقوى',
            titleEn: 'Heavy Duty Aluminum Engine Radiator',
            catIndex: 8,
            basePrice: 380
        },
        {
            titleAr: 'حساس تدفق الهواء الشامل MAF أصلي',
            titleEn: 'Genuine Mass Air Flow (MAF) Sensor',
            catIndex: 3,
            basePrice: 165
        },
        {
            titleAr: 'طقم كراسي مكينة وقير هيدروليكية',
            titleEn: 'Hydraulic Engine & Transmission Mounts Set',
            catIndex: 2,
            basePrice: 340
        },
        {
            titleAr: 'مقص أمامي سفلي مع الجلب الأصلية',
            titleEn: 'Front Lower Control Arm with Bushings',
            catIndex: 2,
            basePrice: 220
        },
        {
            titleAr: 'مرايا جانبية ذكية قابلة للطي مع كاميرا 360 ونقطة عمياء',
            titleEn: 'Smart Power Folding Side Mirror with 360 Camera & Blind Spot',
            catIndex: 4,
            basePrice: 420
        },
        {
            titleAr: 'كارتير زيت ناقل الحركة مع الفلتر والزيت المعتمد',
            titleEn: 'Transmission Oil Pan with Integrated Filter & Fluid Kit',
            catIndex: 7,
            basePrice: 260
        }
    ];

    brands.forEach(b => {
        b.models.forEach(m => {
            partTemplates.forEach(t => {
                const cat = categories[t.catIndex];
                const priceUsd = Math.round(t.basePrice * (b.en === 'Mercedes-Benz' || b.en === 'BMW' || b.en === 'Genesis' || b.en === 'Lexus' ? 1.35 : 1.0));
                const priceSar = Math.round(priceUsd * 3.75);
                const priceKrw = priceUsd * 1350;

                allParts.push({
                    name: `${t.titleAr} - ${b.ar} ${m}`,
                    nameAr: `${t.titleAr} - ${b.ar} ${m}`,
                    nameEn: `${t.titleEn} - ${b.en} ${m}`,
                    brand: b.en,
                    carMake: b.en,
                    carMakeEn: b.en,
                    carModel: m,
                    carModelEn: m,
                    carYear: 2024,
                    category: cat.en,
                    categoryAr: cat.ar,
                    partType: cat.en,
                    partTypeEn: cat.en,
                    partTypeAr: cat.ar,
                    condition: 'NEW',
                    price: priceSar,
                    priceSar,
                    priceUsd,
                    priceKrw,
                    basePriceUsd: priceUsd,
                    stockQty: Math.floor(Math.random() * 20) + 5,
                    compatibility: [m, ...b.models.filter(x => x !== m).slice(0, 2)],
                    images: [
                        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
                        'https://images.unsplash.com/photo-1600703136783-bdd5e9867c49?auto=format&fit=crop&q=80&w=800'
                    ],
                    description: `قطعة غيار أصلية معتمدة لسيارات ${b.ar} ${m} مصممة وفقاً لأعلى معايير الجودة والمطابقة الفنية.`,
                    descriptionAr: `قطعة غيار أصلية معتمدة لسيارات ${b.ar} ${m} مصممة وفقاً لأعلى معايير الجودة والمطابقة الفنية.`,
                    inStock: true
                });
            });
        });
    });

    return allParts;
}

(async () => {
    console.log('🚀 بدء تنظيف وزرع قطع الغيار الأصلية النظيفة في Atlas Production...');
    const catalog = generateExtendedCatalog();
    console.log(`📦 تم تجهيز ${catalog.length} قطعة غيار أصلية عالية الجودة.`);

    try {
        console.log('📡 رفع البيانات واستبدال القطع القديمة المكسورة...');
        const res = await axios.post(`${PROD_BASE}/api/v2/system/import-batch`, {
            secret: IMPORT_SECRET,
            collection: 'spareparts',
            documents: catalog,
            clearFirst: true // تنظيف البيانات التالفة أولاً
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000
        });

        console.log('\n════════════════════════════════════════');
        console.log('✅ نتيجة زرع قطع الغيار:');
        console.log(JSON.stringify(res.data, null, 2));
        console.log('════════════════════════════════════════');
    } catch (err) {
        if (err.response) {
            console.error('❌ خطأ من الخادم:', err.response.status, err.response.data);
        } else {
            console.error('❌ خطأ في الاتصال:', err.message);
        }
        process.exit(1);
    }
})();
