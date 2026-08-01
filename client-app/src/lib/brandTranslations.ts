/**
 * brandTranslations.ts
 * قاموس الترجمة الثنائية والتحويل الفوري كوري ↔ عربي ↔ إنجليزي
 * لضمان عدم ظهور أي نصوص كورية غير مترجمة للمستخدم
 */

interface BrandEntry { ar: string; en: string; clearbitKey: string; }

const BRAND_MAP: Record<string, BrandEntry> = {
    // ── كوريا ──
    'hyundai': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    'kia': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    'genesis': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis' },
    'ssangyong': { ar: 'سانغ يونغ', en: 'SsangYong', clearbitKey: 'ssangyong' },
    'kg mobility': { ar: 'كاي جي موبيليتي', en: 'KG Mobility', clearbitKey: 'kg-mobility' },
    'samsung': { ar: 'سامسونج', en: 'Samsung', clearbitKey: 'samsung' },
    // ── اليابان ──
    'toyota': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota' },
    'honda': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda' },
    'nissan': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan' },
    'infiniti': { ar: 'إنفينيتي', en: 'Infiniti', clearbitKey: 'infiniti' },
    'lexus': { ar: 'لكزس', en: 'Lexus', clearbitKey: 'lexus' },
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
    'mercedes': { ar: 'مرسيدس', en: 'Mercedes', clearbitKey: 'mercedes' },
    'mercedes-benz': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'audi': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi' },
    'volkswagen': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen' },
    'porsche': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche' },
    'volvo': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo' },
    'land rover': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'land-rover' },
    'jaguar': { ar: 'جاكوار', en: 'Jaguar', clearbitKey: 'jaguar' },
    // ── أمريكا ──
    'ford': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford' },
    'chevrolet': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet' },
    'gmc': { ar: 'جي ام سي', en: 'GMC', clearbitKey: 'gmc' },
    'cadillac': { ar: 'كاديلاك', en: 'Cadillac', clearbitKey: 'cadillac' },
    'jeep': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep' },
    'dodge': { ar: 'دودج', en: 'Dodge', clearbitKey: 'dodge' },
    'tesla': { ar: 'تسلا', en: 'Tesla', clearbitKey: 'tesla' },
};

export function getBrandInfo(rawName: string): BrandEntry {
    if (!rawName) return { ar: '', en: '', clearbitKey: '' };
    const key = rawName.toLowerCase().trim();
    if (BRAND_MAP[key]) return BRAND_MAP[key];
    for (const [k, v] of Object.entries(BRAND_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
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
    // Manufacturers
    [/현대/g, { ar: 'هيونداي', en: 'Hyundai' }],
    [/기아/g, { ar: 'كيا', en: 'Kia' }],
    [/제네시스/g, { ar: 'جينيسيس', en: 'Genesis' }],
    [/KG모빌리티\(쌍용\)|\(쌍용\)|KG모빌리티|쌍용/g, { ar: 'سانغ يونغ', en: 'SsangYong' }],
    [/르노코리아\(삼성\)|\(삼성\)|르노코리아|삼성/g, { ar: 'رينو سامسونج', en: 'Renault Samsung' }],
    [/쉐보레\(GM대우\)|GM대우/g, { ar: 'شيفروليه', en: 'Chevrolet' }],
    [/벤츠/g, { ar: 'مرسيدس', en: 'Mercedes-Benz' }],
    [/아우디/g, { ar: 'أودي', en: 'Audi' }],
    [/폭스바겐/g, { ar: 'فولكس واغن', en: 'Volkswagen' }],
    [/볼보/g, { ar: 'فولفو', en: 'Volvo' }],
    [/렉서스/g, { ar: 'لكزس', en: 'Lexus' }],
    [/토요타/g, { ar: 'تويوتا', en: 'Toyota' }],
    [/시리즈/g, { ar: 'فئة', en: 'Series' }],

    // Popular Korean Models
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

/**
 * تنظيف وترجمة أي نص كوري عام
 */
export function cleanKoreanText(text: string, isRTL: boolean = true): string {
    if (!text || typeof text !== 'string') return '';
    let result = text;
    KOREAN_TITLE_TOKENS.forEach(([pattern, trans]) => {
        result = result.replace(pattern, isRTL ? trans.ar : trans.en);
    });
    return result.trim();
}

/**
 * تنسيق وترجمة عنوان أو مواصفات السيارة المستوردة حسب اللغة (عربي / إنجليزي)
 */
export function formatCarTitle(rawTitle: string, rawMake: string, isRTL: boolean): string {
    if (!rawTitle) return '';
    let title = rawTitle;

    KOREAN_TITLE_TOKENS.forEach(([pattern, trans]) => {
        title = title.replace(pattern, isRTL ? trans.ar : trans.en);
    });

    const brandName = getBrandDisplayName(rawMake || '', isRTL);
    if (brandName && !title.toLowerCase().includes(brandName.toLowerCase())) {
        title = `${brandName} ${title}`;
    }

    return title.trim();
}
