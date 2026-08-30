/**
 * brandTranslations.ts
 * قاموس الترجمة الثنائية والتحويل الفوري كوري ↔ عربي ↔ إنجليزي
 * لضمان عدم ظهور أي نصوص كورية غير مترجمة للمستخدم
 */

interface BrandEntry { ar: string; en: string; clearbitKey: string; domain?: string; }

/** خريطة شاملة للماركات مع دومين الموقع الرسمي للشعار */
const BRAND_MAP: Record<string, BrandEntry> = {
    // ── كوريا ──
    'hyundai': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai', domain: 'hyundai.com' },
    'هيونداي': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai', domain: 'hyundai.com' },
    '현대': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai', domain: 'hyundai.com' },
    'kia': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia', domain: 'kia.com' },
    'كيا': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia', domain: 'kia.com' },
    '기아': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia', domain: 'kia.com' },
    'genesis': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis', domain: 'genesis.com' },
    'جينيسيس': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis', domain: 'genesis.com' },
    '제네시스': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis', domain: 'genesis.com' },
    'ssangyong': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong', domain: 'ssangyong.com' },
    'سانغ يونغ': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong', domain: 'ssangyong.com' },
    '쌍용': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong', domain: 'ssangyong.com' },
    'kg mobility': { ar: 'كاي جي موبيليتي', en: 'KG Mobility', clearbitKey: 'kg-mobility', domain: 'kgmobility.com' },
    'كاي جي موبيليتي': { ar: 'كاي جي موبيليتي', en: 'KG Mobility', clearbitKey: 'kg-mobility', domain: 'kgmobility.com' },
    'samsung': { ar: 'سامسونج', en: 'Samsung', clearbitKey: 'samsung', domain: 'samsung.com' },
    'renault samsung': { ar: 'رينو سامسونج', en: 'Renault Samsung', clearbitKey: 'renault', domain: 'renault.com' },
    '르노코리아': { ar: 'رينو سامسونج', en: 'Renault Samsung', clearbitKey: 'renault', domain: 'renault.com' },

    // ── الصين ──
    'speranza': { ar: 'اسبرانزا', en: 'Speranza', clearbitKey: 'speranza', domain: 'speranza.com.eg' },
    'اسبرانزا': { ar: 'اسبرانزا', en: 'Speranza', clearbitKey: 'speranza', domain: 'speranza.com.eg' },
    'mg': { ar: 'ام جي', en: 'MG', clearbitKey: 'mg', domain: 'mgmotor.com' },
    'ام جي': { ar: 'ام جي', en: 'MG', clearbitKey: 'mg', domain: 'mgmotor.com' },
    'geely': { ar: 'جيلي', en: 'Geely', clearbitKey: 'geely', domain: 'geely.com' },
    'haval': { ar: 'هافال', en: 'Haval', clearbitKey: 'haval', domain: 'haval.com' },
    'chery': { ar: 'شيري', en: 'Chery', clearbitKey: 'chery', domain: 'chery.com' },
    'byd': { ar: 'بي واي دي', en: 'BYD', clearbitKey: 'byd', domain: 'byd.com' },
    'great wall': { ar: 'جريت وول', en: 'Great Wall', clearbitKey: 'gwm', domain: 'gwm.com' },
    'changan': { ar: 'شانجان', en: 'Changan', clearbitKey: 'changan', domain: 'changan.com.cn' },

    // ── اليابان ──
    'toyota': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota', domain: 'toyota.com' },
    'تويوتا': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota', domain: 'toyota.com' },
    'honda': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda', domain: 'honda.com' },
    'هوندا': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda', domain: 'honda.com' },
    'nissan': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan', domain: 'nissan.com' },
    'نيسان': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan', domain: 'nissan.com' },
    'infiniti': { ar: 'إنفينيتي', en: 'Infiniti', clearbitKey: 'infiniti', domain: 'infiniti.com' },
    'إنفينيتي': { ar: 'إنفينيتي', en: 'Infiniti', clearbitKey: 'infiniti', domain: 'infiniti.com' },
    'lexus': { ar: 'لكزس', en: 'Lexus', clearbitKey: 'lexus', domain: 'lexus.com' },
    'لكزس': { ar: 'لكزس', en: 'Lexus', clearbitKey: 'lexus', domain: 'lexus.com' },
    'mazda': { ar: 'مازدا', en: 'Mazda', clearbitKey: 'mazda', domain: 'mazda.com' },
    'mitsubishi': { ar: 'ميتسوبيشي', en: 'Mitsubishi', clearbitKey: 'mitsubishi', domain: 'mitsubishi-motors.com' },
    'subaru': { ar: 'سوبارو', en: 'Subaru', clearbitKey: 'subaru', domain: 'subaru.com' },
    'suzuki': { ar: 'سوزوكي', en: 'Suzuki', clearbitKey: 'suzuki', domain: 'suzuki.com' },
    'isuzu': { ar: 'إيسوزو', en: 'Isuzu', clearbitKey: 'isuzu', domain: 'isuzu.com' },

    // ── أوروبا ──
    'bmw': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw', domain: 'bmw.com' },
    'بي ام دبليو': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw', domain: 'bmw.com' },
    'بي إم دبليو': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw', domain: 'bmw.com' },
    'mercedes': { ar: 'مرسيدس', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz', domain: 'mercedes-benz.com' },
    'مرسيدس': { ar: 'مرسيدس', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz', domain: 'mercedes-benz.com' },
    'mercedes-benz': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz', domain: 'mercedes-benz.com' },
    'مرسيدس بنز': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz', domain: 'mercedes-benz.com' },
    'audi': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi', domain: 'audi.com' },
    'أودي': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi', domain: 'audi.com' },
    'volkswagen': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen', domain: 'vw.com' },
    'فولكس واجن': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen', domain: 'vw.com' },
    'porsche': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche', domain: 'porsche.com' },
    'بورش': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche', domain: 'porsche.com' },
    'volvo': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo', domain: 'volvocars.com' },
    'فولفو': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo', domain: 'volvocars.com' },
    'land rover': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'landrover', domain: 'landrover.com' },
    'لاند روفر': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'landrover', domain: 'landrover.com' },
    'jaguar': { ar: 'جاكوار', en: 'Jaguar', clearbitKey: 'jaguar', domain: 'jaguar.com' },
    'جاكوار': { ar: 'جاكوار', en: 'Jaguar', clearbitKey: 'jaguar', domain: 'jaguar.com' },
    'mini': { ar: 'ميني', en: 'MINI', clearbitKey: 'mini', domain: 'mini.com' },
    'ميني': { ar: 'ميني', en: 'MINI', clearbitKey: 'mini', domain: 'mini.com' },
    'peugeot': { ar: 'بيجو', en: 'Peugeot', clearbitKey: 'peugeot', domain: 'peugeot.com' },
    'renault': { ar: 'رينو', en: 'Renault', clearbitKey: 'renault', domain: 'renault.com' },
    'fiat': { ar: 'فيات', en: 'Fiat', clearbitKey: 'fiat', domain: 'fiat.com' },
    'alfa romeo': { ar: 'ألفا روميو', en: 'Alfa Romeo', clearbitKey: 'alfaromeo', domain: 'alfaromeo.com' },

    // ── أمريكا ──
    'ford': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford', domain: 'ford.com' },
    'فورد': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford', domain: 'ford.com' },
    'chevrolet': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet', domain: 'chevrolet.com' },
    'شيفروليه': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet', domain: 'chevrolet.com' },
    'gmc': { ar: 'جي ام سي', en: 'GMC', clearbitKey: 'gmc', domain: 'gmc.com' },
    'cadillac': { ar: 'كاديلاك', en: 'Cadillac', clearbitKey: 'cadillac', domain: 'cadillac.com' },
    'jeep': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep', domain: 'jeep.com' },
    'جيب': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep', domain: 'jeep.com' },
    'dodge': { ar: 'دودج', en: 'Dodge', clearbitKey: 'dodge', domain: 'dodge.com' },
    'tesla': { ar: 'تسلا', en: 'Tesla', clearbitKey: 'tesla', domain: 'tesla.com' },
    'lincoln': { ar: 'لينكولن', en: 'Lincoln', clearbitKey: 'lincoln', domain: 'lincoln.com' },
    'ram': { ar: 'رام', en: 'RAM', clearbitKey: 'ram', domain: 'ramtrucks.com' },
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

/**
 * يعيد قائمة مرتبة من روابط شعار الماركة من مصادر CDN متعددة موثوقة
 * يُجرَّب الأول فإن فشل يُجرَّب الثاني... وهكذا
 */
export function getBrandLogoUrls(rawName: string): string[] {
    const info = getBrandInfo(rawName);
    const { clearbitKey, domain } = info;
    if (!clearbitKey) return [];

    const urls: string[] = [];

    // المصدر 1: Clearbit (الأكثر شهرة للشعارات عالية الجودة)
    urls.push(`https://logo.clearbit.com/${domain || clearbitKey + '.com'}`);

    // المصدر 2: Google Favicons (موثوق جداً ومتاح دائماً)
    urls.push(`https://www.google.com/s2/favicons?domain=${domain || clearbitKey + '.com'}&sz=128`);

    // المصدر 3: Brandfetch CDN
    urls.push(`https://cdn.brandfetch.io/${domain || clearbitKey + '.com'}/w/128/h/128/logo`);

    return urls.filter(Boolean);
}

/** للتوافق مع الكود القديم — يُعيد أول رابط متاح */
export function getClearbitLogoUrl(rawName: string): string {
    const urls = getBrandLogoUrls(rawName);
    return urls[0] || '';
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
