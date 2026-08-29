/**
 * brandTranslations.ts
 * قاموس الترجمة الثنائية والتحويل الفوري كوري ↔ عربي ↔ إنجليزي
 * لضمان عدم ظهور أي نصوص كورية غير مترجمة للمستخدم
 */

interface BrandEntry { ar: string; en: string; clearbitKey: string; }

const BRAND_MAP: Record<string, BrandEntry> = {
    // ── كوريا ──
    'hyundai': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    'هيونداي': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    '현대': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    'kia': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    'كيا': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    '기아': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    'genesis': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis' },
    'جينيسيس': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis' },
    '제네시스': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis' },
    'ssangyong': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong' },
    'سانغ يونغ': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong' },
    '쌍용': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong' },
    'kg mobility': { ar: 'كاي جي موبيليتي', en: 'KG Mobility', clearbitKey: 'kg-mobility' },
    'samsung': { ar: 'سامسونج', en: 'Samsung', clearbitKey: 'samsung' },
    'renault samsung': { ar: 'رينو سامسونج', en: 'Renault Samsung', clearbitKey: 'samsung' },
    '르노코리아': { ar: 'رينو سامسونج', en: 'Renault Samsung', clearbitKey: 'samsung' },

    // ── اليابان ──
    'toyota': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota' },
    'تويوتا': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota' },
    'honda': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda' },
    'هوندا': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda' },
    'nissan': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan' },
    'نيسان': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan' },
    'infiniti': { ar: 'إنفينيتي', en: 'Infiniti', clearbitKey: 'infiniti' },
    'lexus': { ar: 'لكزس', en: 'Lexus', clearbitKey: 'lexus' },
    'لكزس': { ar: 'لكزس', en: 'Lexus', clearbitKey: 'lexus' },
    'mazda': { ar: 'مازدا', en: 'Mazda', clearbitKey: 'mazda' },
    'mitsubishi': { ar: 'ميتسوبيشي', en: 'Mitsubishi', clearbitKey: 'mitsubishi' },
    'subaru': { ar: 'سوبارو', en: 'Subaru', clearbitKey: 'subaru' },
    'suzuki': { ar: 'سوزوكي', en: 'Suzuki', clearbitKey: 'suzuki' },
    'isuzu': { ar: 'إيسوزو', en: 'Isuzu', clearbitKey: 'isuzu' },

    // ── الصين ──
    'mg': { ar: 'ام جي', en: 'MG', clearbitKey: 'mg' },
    'geely': { ar: 'جيلي', en: 'Geely', clearbitKey: 'geely' },
    'haval': { ar: 'هافال', en: 'Haval', clearbitKey: 'haval' },
    'chery': { ar: 'شيري', en: 'Chery', clearbitKey: 'chery' },
    'byd': { ar: 'بي واي دي', en: 'BYD', clearbitKey: 'byd' },
    'great wall': { ar: 'جريت وول', en: 'Great Wall', clearbitKey: 'great-wall' },
    'changan': { ar: 'شانجان', en: 'Changan', clearbitKey: 'changan' },

    // ── أوروبا ──
    'bmw': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw' },
    'بي ام دبليو': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw' },
    'بي إم دبليو': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw' },
    'mercedes': { ar: 'مرسيدس', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'مرسيدس': { ar: 'مرسيدس', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'mercedes-benz': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'مرسيدس بنز': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'audi': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi' },
    'أودي': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi' },
    'volkswagen': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen' },
    'فولكس واجن': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen' },
    'porsche': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche' },
    'بورش': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche' },
    'volvo': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo' },
    'فولفو': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo' },
    'land rover': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'land-rover' },
    'لاند روفر': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'land-rover' },
    'jaguar': { ar: 'جاكوار', en: 'Jaguar', clearbitKey: 'jaguar' },
    'mini': { ar: 'ميني', en: 'MINI', clearbitKey: 'mini' },
    'ميني': { ar: 'ميني', en: 'MINI', clearbitKey: 'mini' },

    // ── أمريكا ──
    'ford': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford' },
    'فورد': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford' },
    'chevrolet': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet' },
    'شيفروليه': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet' },
    'gmc': { ar: 'جي ام سي', en: 'GMC', clearbitKey: 'gmc' },
    'cadillac': { ar: 'كاديلاك', en: 'Cadillac', clearbitKey: 'cadillac' },
    'jeep': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep' },
    'جيب': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep' },
    'dodge': { ar: 'دودج', en: 'Dodge', clearbitKey: 'dodge' },
    'tesla': { ar: 'تسلا', en: 'Tesla', clearbitKey: 'tesla' },
};

export function getBrandInfo(rawName: string): BrandEntry {
    if (!rawName) return { ar: '', en: '', clearbitKey: '' };
    const key = rawName.toLowerCase().trim();
    if (BRAND_MAP[key]) return BRAND_MAP[key];

    // Search by English name, Arabic name, or key match
    for (const [k, v] of Object.entries(BRAND_MAP)) {
        if (key === k || key === v.ar.toLowerCase() || key === v.en.toLowerCase()) return v;
        if (key.includes(k) || key.includes(v.ar.toLowerCase()) || key.includes(v.en.toLowerCase())) return v;
    }
    return { ar: rawName, en: rawName, clearbitKey: key.replace(/\s+/g, '-') };
}

export function getBrandDisplayName(rawName: string, isRTL: boolean): string {
    const info = getBrandInfo(rawName);
    return isRTL ? info.ar : info.en;
}

export function getClearbitLogoUrl(rawName: string): string {
    const { clearbitKey } = getBrandInfo(rawName);
    if (!clearbitKey) return '';
    return `https://logo.clearbit.com/${clearbitKey}.com`;
}

export function isLocalPath(url: string): boolean {
    if (!url) return true;
    return url.startsWith('/uploads/') || url.startsWith('/images/') || url.startsWith('./') || url.startsWith('../');
}

// ── ترجمة عناوين ومواصفات السيارات الكورية ──
const KOREAN_TITLE_TOKENS: Array<[RegExp, { ar: string; en: string }]> = [
    // Manufacturers & Brands
    [/지프/g, { ar: 'جيب', en: 'Jeep' }],
    [/현대/g, { ar: 'هيونداي', en: 'Hyundai' }],
    [/기아/g, { ar: 'كيا', en: 'Kia' }],
    [/제네시스/g, { ar: 'جينيسيس', en: 'Genesis' }],
    [/KG모빌리티\(쌍용\)|\(쌍용\)|KG모빌리티|쌍용/g, { ar: 'سانغ يونغ', en: 'SsangYong' }],
    [/르노코리아\(삼성\)|\(삼성\)|르노코리아|삼성/g, { ar: 'رينو سامسونج', en: 'Renault Samsung' }],
    [/쉐보레\(GM대우\)|GM대우/g, { ar: 'شيفروليه', en: 'Chevrolet' }],
    [/메르세데스-벤츠|메르세데스|벤츠/g, { ar: 'مرسيدس بنز', en: 'Mercedes-Benz' }],
    [/아우디/g, { ar: 'أودي', en: 'Audi' }],
    [/폭스바겐/g, { ar: 'فولكس واغن', en: 'Volkswagen' }],
    [/볼보/g, { ar: 'فولفو', en: 'Volvo' }],
    [/렉서스/g, { ar: 'لكزس', en: 'Lexus' }],
    [/토요타/g, { ar: 'تويوتا', en: 'Toyota' }],
    [/포르쉐/g, { ar: 'بورش', en: 'Porsche' }],
    [/랜드로버/g, { ar: 'لاند روفر', en: 'Land Rover' }],
    [/레인지로버/g, { ar: 'رينج روفر', en: 'Range Rover' }],
    [/포드/g, { ar: 'فورد', en: 'Ford' }],
    [/시리즈/g, { ar: 'فئة', en: 'Series' }],

    // Jeep & SUV Trims
    [/랭글러/g, { ar: 'رانجلر', en: 'Wrangler' }],
    [/루비콘/g, { ar: 'روبيكون', en: 'Rubicon' }],
    [/사하라/g, { ar: 'ساهارا', en: 'Sahara' }],
    [/오버랜드/g, { ar: 'أوفرلاند', en: 'Overland' }],
    [/체로키/g, { ar: 'شيروكي', en: 'Cherokee' }],
    [/컴패스/g, { ar: 'كومباس', en: 'Compass' }],
    [/레니게이드/g, { ar: 'رينيجيد', en: 'Renegade' }],
    [/4도어/g, { ar: '4 أبواب', en: '4-Door' }],
    [/2도어/g, { ar: '2 أبواب', en: '2-Door' }],
    [/얼\s*클리어\s*코트|클리어\s*코트/g, { ar: 'كليير كوت', en: 'Clear Coat' }],

    // Popular Korean & Foreign Models
    [/쏘렌토/g, { ar: 'سورينتو', en: 'Sorento' }],
    [/그랜저/g, { ar: 'جرانديور', en: 'Grandeur' }],
    [/카니발/g, { ar: 'كاردينال (كانيڤال)', en: 'Carnival' }],
    [/아반떼/g, { ar: 'أڤانتي (إلانترا)', en: 'Avante (Elantra)' }],
    [/팰리세이드/g, { ar: 'باليسيد', en: 'Palisade' }],
    [/스타리아/g, { ar: 'ستاريا', en: 'Staria' }],
    [/포터/g, { ar: 'بورتر', en: 'Porter' }],
    [/봉고/g, { ar: 'بونجو', en: 'Bongo' }],
    [/투싼/g, { ar: 'توسان', en: 'Tucson' }],
    [/스포티지/g, { ar: 'سبورتاج', en: 'Sportage' }],
    [/모닝/g, { ar: 'مورنينج', en: 'Morning' }],
    [/레이/g, { ar: 'راي', en: 'Ray' }],
    [/쏘나타|소나타/g, { ar: 'سوناتا', en: 'Sonata' }],
    [/코나/g, { ar: 'كونا', en: 'Kona' }],
    [/베뉴/g, { ar: 'فينيو', en: 'Venue' }],
    [/아이오닉/g, { ar: 'آيونيك', en: 'Ioniq' }],
    [/익스플로러/g, { ar: 'اكسبلورر', en: 'Explorer' }],
    [/머스탱/g, { ar: 'موستانج', en: 'Mustang' }],
    [/파나메라/g, { ar: 'باناميرا', en: 'Panamera' }],
    [/카이엔/g, { ar: 'كايين', en: 'Cayenne' }],
    [/마칸/g, { ar: 'ماكان', en: 'Macan' }],
    [/타이칸/g, { ar: 'تايكان', en: 'Taycan' }],
    [/EV6/g, { ar: 'EV6', en: 'EV6' }],
    [/EV9/g, { ar: 'EV9', en: 'EV9' }],

    // Specs & Trim Details
    [/올\s*뉴/g, { ar: 'أول نيو', en: 'All New' }],
    [/더\s*뉴/g, { ar: 'ذا نيو', en: 'The New' }],
    [/(\d+)인승/g, { ar: '$1 مقاعد', en: '$1-Seater' }],
    [/디젤/g, { ar: 'ديزل', en: 'Diesel' }],
    [/가솔린\+전기/g, { ar: 'بنزين + كهرباء', en: 'Gasoline + Electric' }],
    [/가솔린/g, { ar: 'بنزين', en: 'Gasoline' }],
    [/LPG\(일반인\s*구입\)|LPG/g, { ar: 'غاز (LPG)', en: 'LPG Gas' }],
    [/하이브리드/g, { ar: 'هايبرد', en: 'Hybrid' }],
    [/전기/g, { ar: 'كهربائي', en: 'EV' }],
    [/터보/g, { ar: 'توربو', en: 'Turbo' }],
    [/오토|자동/g, { ar: 'أوتوماتيك', en: 'Automatic' }],
    [/수동/g, { ar: 'يدوي', en: 'Manual' }],
    [/(\d+)세대/g, { ar: 'الجيل $1', en: 'Gen $1' }],
    [/무사고/g, { ar: 'خالية من الحوادث', en: 'Accident-Free' }],
    [/풀옵션/g, { ar: 'فل كامل', en: 'Full Option' }],
];

const ARABIC_TO_ENGLISH_TOKENS: Array<[RegExp, string]> = [
    // Brands
    [/هيونداي/g, 'Hyundai'],
    [/كيا/g, 'Kia'],
    [/جينيسيس/g, 'Genesis'],
    [/بي إم دبليو|بي ام دبليو/g, 'BMW'],
    [/مرسيدس بنز|مرسيدس/g, 'Mercedes-Benz'],
    [/تويوتا/g, 'Toyota'],
    [/لكزس/g, 'Lexus'],
    [/أودي/g, 'Audi'],
    [/بورش/g, 'Porsche'],
    [/فولفو/g, 'Volvo'],
    [/لاند روفر/g, 'Land Rover'],
    [/فورد/g, 'Ford'],
    [/شيفروليه/g, 'Chevrolet'],
    [/جيب/g, 'Jeep'],
    [/نيسان/g, 'Nissan'],
    [/سانغ يونغ/g, 'SsangYong'],
    [/رينو سامسونج|رينو/g, 'Renault'],

    // Terms & Specs
    [/الجيل\s*(\d+)/g, 'Gen $1'],
    [/نيو/g, 'New'],
    [/أول نيو/g, 'All-New'],
    [/بنزين \+ كهرباء/g, 'Gasoline + Electric'],
    [/بنزين/g, 'Gasoline'],
    [/ديزل/g, 'Diesel'],
    [/هايبرد/g, 'Hybrid'],
    [/كهربائي/g, 'Electric (EV)'],
    [/غاز\s*\(LPG\)|غاز/g, 'LPG Gas'],
    [/أوتوماتيك/g, 'Automatic'],
    [/يدوي/g, 'Manual'],
    [/فل كامل/g, 'Full Option'],
    [/مقاعد/g, 'Seats'],
    [/دفع رباعي/g, 'AWD'],
    [/تيربو/g, 'Turbo'],
    [/معرض/g, 'Showroom'],
    [/مفحوصة/g, 'Inspected'],
];

export function cleanKoreanText(text: string, isRTL: boolean = true): string {
    if (!text || typeof text !== 'string') return '';
    let result = text;
    
    // Apply Korean tokens
    KOREAN_TITLE_TOKENS.forEach(([pattern, trans]) => {
        result = result.replace(pattern, isRTL ? trans.ar : trans.en);
    });

    // If English mode, translate any Arabic tokens to English
    if (!isRTL) {
        ARABIC_TO_ENGLISH_TOKENS.forEach(([pattern, enText]) => {
            result = result.replace(pattern, enText);
        });
    }

    // إزالة أية حروف كورية متبقية غير مترجمة
    result = result.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
    result = result.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();
    return result;
}

/**
 * تنسيق وترجمة عنوان أو مواصفات السيارة المستوردة حسب اللغة (عربي / إنجليزي)
 */
export function formatCarTitle(rawTitle: string, rawMake: string, isRTL: boolean): string {
    if (!rawTitle) return '';
    let title = cleanKoreanText(rawTitle, isRTL);

    const brandInfo = getBrandInfo(rawMake || '');
    const brandName = isRTL ? brandInfo.ar : brandInfo.en;

    // In English mode, ensure brand in title is English
    if (!isRTL && brandInfo.ar && title.includes(brandInfo.ar)) {
        title = title.replace(new RegExp(brandInfo.ar, 'g'), brandInfo.en);
    }

    // Check all brand representations to avoid duplicates (ar/en/raw)
    const titleLower = title.toLowerCase();
    const alreadyHasBrand =
        (brandName && titleLower.includes(brandName.toLowerCase())) ||
        (brandInfo.ar && titleLower.includes(brandInfo.ar.toLowerCase())) ||
        (brandInfo.en && titleLower.includes(brandInfo.en.toLowerCase())) ||
        (rawMake && titleLower.includes(rawMake.toLowerCase()));

    if (brandName && !alreadyHasBrand) {
        title = `${brandName} ${title}`;
    }

    return title.trim();
}
