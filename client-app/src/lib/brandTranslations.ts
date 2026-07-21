/**
 * brandTranslations.ts
 * قاموس الترجمة الثنائية للوكالات — عربي ↔ إنجليزي
 * يُستخدم لتصحيح عرض الأسماء وكذلك في Clearbit logo fallback
 */

// خريطة: الاسم المخزن في DB → { ar: الاسم العربي, en: الاسم الإنجليزي, clearbitKey: مفتاح Clearbit }
interface BrandEntry { ar: string; en: string; clearbitKey: string; }

const BRAND_MAP: Record<string, BrandEntry> = {
    // ── كوريا ──
    'hyundai': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    'kia': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    'genesis': { ar: 'جينيسيس', en: 'Genesis', clearbitKey: 'genesis' },
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
    'brilliance': { ar: 'بريليانس', en: 'Brilliance', clearbitKey: 'brilliance' },
    'zotye': { ar: 'زوتيه', en: 'Zotye', clearbitKey: 'zotye' },
    'foton': { ar: 'فوتون', en: 'Foton', clearbitKey: 'foton' },
    'saic': { ar: 'سايك', en: 'SAIC', clearbitKey: 'saic' },
    // ── أوروبا ──
    'bmw': { ar: 'بي ام دبليو', en: 'BMW', clearbitKey: 'bmw' },
    'mercedes': { ar: 'مرسيدس', en: 'Mercedes', clearbitKey: 'mercedes' },
    'mercedes-benz': { ar: 'مرسيدس بنز', en: 'Mercedes-Benz', clearbitKey: 'mercedes-benz' },
    'audi': { ar: 'أودي', en: 'Audi', clearbitKey: 'audi' },
    'volkswagen': { ar: 'فولكس واجن', en: 'Volkswagen', clearbitKey: 'volkswagen' },
    'porsche': { ar: 'بورش', en: 'Porsche', clearbitKey: 'porsche' },
    'volvo': { ar: 'فولفو', en: 'Volvo', clearbitKey: 'volvo' },
    'peugeot': { ar: 'بيجو', en: 'Peugeot', clearbitKey: 'peugeot' },
    'renault': { ar: 'رينو', en: 'Renault', clearbitKey: 'renault' },
    'citroen': { ar: 'سيتروين', en: 'Citroen', clearbitKey: 'citroen' },
    'fiat': { ar: 'فيات', en: 'Fiat', clearbitKey: 'fiat' },
    'alfa romeo': { ar: 'ألفا روميو', en: 'Alfa Romeo', clearbitKey: 'alfa-romeo' },
    'ferrari': { ar: 'فيراري', en: 'Ferrari', clearbitKey: 'ferrari' },
    'lamborghini': { ar: 'لامبورغيني', en: 'Lamborghini', clearbitKey: 'lamborghini' },
    'land rover': { ar: 'لاند روفر', en: 'Land Rover', clearbitKey: 'land-rover' },
    'jaguar': { ar: 'جاكوار', en: 'Jaguar', clearbitKey: 'jaguar' },
    'bentley': { ar: 'بنتلي', en: 'Bentley', clearbitKey: 'bentley' },
    'rolls-royce': { ar: 'رولز رويس', en: 'Rolls-Royce', clearbitKey: 'rolls-royce' },
    'maserati': { ar: 'مازيراتي', en: 'Maserati', clearbitKey: 'maserati' },
    'mini': { ar: 'ميني', en: 'Mini', clearbitKey: 'mini' },
    'skoda': { ar: 'سكودا', en: 'Skoda', clearbitKey: 'skoda' },
    'seat': { ar: 'سيات', en: 'Seat', clearbitKey: 'seat' },
    'opel': { ar: 'أوبل', en: 'Opel', clearbitKey: 'opel' },
    // ── أمريكا ──
    'ford': { ar: 'فورد', en: 'Ford', clearbitKey: 'ford' },
    'chevrolet': { ar: 'شيفروليه', en: 'Chevrolet', clearbitKey: 'chevrolet' },
    'gmc': { ar: 'جي ام سي', en: 'GMC', clearbitKey: 'gmc' },
    'cadillac': { ar: 'كاديلاك', en: 'Cadillac', clearbitKey: 'cadillac' },
    'lincoln': { ar: 'لينكولن', en: 'Lincoln', clearbitKey: 'lincoln' },
    'dodge': { ar: 'دودج', en: 'Dodge', clearbitKey: 'dodge' },
    'jeep': { ar: 'جيب', en: 'Jeep', clearbitKey: 'jeep' },
    'chrysler': { ar: 'كرايسلر', en: 'Chrysler', clearbitKey: 'chrysler' },
    'ram': { ar: 'رام', en: 'Ram', clearbitKey: 'ram' },
    'tesla': { ar: 'تسلا', en: 'Tesla', clearbitKey: 'tesla' },
    // ── وكالات قطع الغيار المشهورة ──
    'esperanza': { ar: 'اسبرانزا', en: 'Esperanza', clearbitKey: 'esperanza' },
    'اسبرانزا': { ar: 'اسبرانزا', en: 'Esperanza', clearbitKey: 'esperanza' },
    'إنفينيتي': { ar: 'إنفينيتي', en: 'Infiniti', clearbitKey: 'infiniti' },
    'ام جي': { ar: 'ام جي', en: 'MG', clearbitKey: 'mg' },
    'هيونداي': { ar: 'هيونداي', en: 'Hyundai', clearbitKey: 'hyundai' },
    'كيا': { ar: 'كيا', en: 'Kia', clearbitKey: 'kia' },
    'تويوتا': { ar: 'تويوتا', en: 'Toyota', clearbitKey: 'toyota' },
    'نيسان': { ar: 'نيسان', en: 'Nissan', clearbitKey: 'nissan' },
    'هوندا': { ar: 'هوندا', en: 'Honda', clearbitKey: 'honda' },
    'ميتسوبيشي': { ar: 'ميتسوبيشي', en: 'Mitsubishi', clearbitKey: 'mitsubishi' },
    'مازدا': { ar: 'مازدا', en: 'Mazda', clearbitKey: 'mazda' },
    'سوزوكي': { ar: 'سوزوكي', en: 'Suzuki', clearbitKey: 'suzuki' },
    'جيلي': { ar: 'جيلي', en: 'Geely', clearbitKey: 'geely' },
    'هافال': { ar: 'هافال', en: 'Haval', clearbitKey: 'haval' },
    'شيري': { ar: 'شيري', en: 'Chery', clearbitKey: 'chery' },
};

/**
 * جلب معلومات الوكالة (الاسم بالعربي والإنجليزي ومفتاح Clearbit)
 */
export function getBrandInfo(rawName: string): BrandEntry {
    if (!rawName) return { ar: '', en: '', clearbitKey: '' };
    const key = rawName.toLowerCase().trim();
    // بحث مباشر
    if (BRAND_MAP[key]) return BRAND_MAP[key];
    // بحث جزئي
    for (const [k, v] of Object.entries(BRAND_MAP)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    // لا توجد ترجمة — نُعيد الاسم كما هو
    return { ar: rawName, en: rawName, clearbitKey: key.replace(/\s+/g, '-') };
}

/**
 * اسم العرض حسب اللغة
 */
export function getBrandDisplayName(rawName: string, isRTL: boolean): string {
    const info = getBrandInfo(rawName);
    return isRTL ? info.ar : info.en;
}

/**
 * رابط شعار Clearbit للوكالة
 */
export function getClearbitLogoUrl(rawName: string): string {
    const { clearbitKey } = getBrandInfo(rawName);
    if (!clearbitKey) return '';
    return `https://logo.clearbit.com/${clearbitKey}.com`;
}

/**
 * هل الرابط مسار محلي لا يعمل على Vercel؟
 */
export function isLocalPath(url: string): boolean {
    if (!url) return true;
    return url.startsWith('/uploads/') || url.startsWith('/images/') || url.startsWith('./') || url.startsWith('../');
}
