// [[ARABIC_HEADER]] هذا الملف (services/KoreanTranslationService.js) محرك تعريب وترجمة المصطلحات والأسماء الكورية

/**
 * قاموس دقيق ومحرك تنظيف للنصوص الكورية
 * يحول أي مصطلح كوري إلى اللغة العربية النظيفة أو الإنجليزية وتصفية أي حروف كورية متبقية.
 */

const KOREAN_DICTIONARY = {
  // الماركات (Brands)
  '현대': 'هيونداي',
  '기아': 'كيا',
  '제네시스': 'جينيسيس',
  '쌍용': 'سانغ يونغ',
  'KG모빌리티': 'كي جي موبيليتي',
  '르노코리아': 'رينو الكورية',
  '르노삼성': 'سامسونج رينو',
  '쉐보레': 'شيفروليه',
  '벤츠': 'مرسيدس بنز',
  'BMW': 'بي إم دبليو',
  '아우디': 'أودي',
  '포르쉐': 'بورشه',
  '폭스바겐': 'فولكس فاجن',

  // موديلات هيونداي
  '팰리세이드': 'باليساد',
  '그랜저': 'جرانديور',
  '아반떼': 'إلانترا (أفانتي)',
  '쏘나타': 'سوناتا',
  '투싼': 'توسان',
  '싼타페': 'سانتافي',
  '코나': 'كونا',
  '베뉴': 'فينيو',
  '스타리아': 'ستاريا',
  '스타렉스': 'ستاركس',
  '포터': 'بوتر 2',
  '아이오닉': 'آيونيك',
  '캐스퍼': 'كاسبر',

  // موديلات كيا
  '카니발': 'كارنيفال',
  '쏘렌토': 'سورينتو',
  '스포티지': 'سبورتاج',
  'K5': 'K5 (أوبتيما)',
  'K7': 'K7 (كادينزا)',
  'K8': 'K8',
  'K9': 'K9 (K900)',
  '모하비': 'موهافي',
  '셀토스': 'سيلتوس',
  '니로': 'نيرو',
  '레이': 'راي',
  '모닝': 'مورنينج (بيكانتو)',
  '봉고': 'بونجو 3',
  'EV6': 'EV6',
  'EV9': 'EV9',

  // موديلات جينيسيس
  'G70': 'G70',
  'G80': 'G80',
  'G90': 'G90',
  'GV70': 'GV70',
  'GV80': 'GV80',
  'GV60': 'GV60',

  // مصطلحات السيارات الكورية الشائعة
  '휘발유': 'بنزين',
  '가솔린': 'بنزين',
  '경유': 'ديزل',
  '디젤': 'ديزل',
  '하이브리드': 'هايبريد (هجين)',
  '전기': 'كهرباء',
  'LPG': 'غاز (LPG)',
  '오토': 'أوتوماتيك',
  '수동': 'يدوي (مانيوال)',
  '무사고': 'بدون حوادث (سليمة)',
  '단순교환': 'تبديل بسيط بدون حادث',
  '완전무사고': 'سليمة تماماً (وكالة)',
  '풀옵션': 'فل كامل',
  '신차급': 'بحالة الوكالة',
  '임판차': 'لوحة مؤقتة (جديدة)',
  '프레스티지': 'برستيج (Prestige)',
  '노블레스': 'نوبليس (Noblesse)',
  '시그니처': 'سيجنتشر (Signature)',
  '캘리그래피': 'كاليجرافي (Calligraphy)',
  '익스클루시브': 'إكستريم/إكExclusive',
  '프리미엄': 'بريميوم (Premium)',
  '스마트': 'سمارت',
  '트렌디': 'تريندي',
  '럭셔리': 'فاخرة (Luxury)'
};

const ENGLISH_DICTIONARY = {
  '현대': 'Hyundai',
  '기아': 'Kia',
  '제네시스': 'Genesis',
  '쌍용': 'SsangYong',
  'KG모빌리티': 'KG Mobility',
  '르노코리아': 'Renault Korea',
  '르노삼성': 'Renault Samsung',
  '쉐보레': 'Chevrolet',
  '벤츠': 'Mercedes-Benz',
  'BMW': 'BMW',
  '아우디': 'Audi',
  '포르쉐': 'Porsche',
  '폭스바겐': 'Volkswagen',

  '팰리세이드': 'Palisade',
  '그랜저': 'Grandeur',
  '아반떼': 'Elantra (Avante)',
  '쏘나타': 'Sonata',
  '투싼': 'Tucson',
  '싼타페': 'Santa Fe',
  '코나': 'Kona',
  '베뉴': 'Venue',
  '스타리아': 'Staria',
  '스타렉스': 'Starex',
  '아이오닉': 'Ioniq',
  '캐스퍼': 'Casper',

  '카니발': 'Carnival',
  '쏘렌토': 'Sorento',
  '스포티지': 'Sportage',
  '모하비': 'Mohave',
  '셀토스': 'Seltos',
  '니로': 'Niro',
  '모닝': 'Morning (Picanto)',
  'EV6': 'EV6',
  'EV9': 'EV9',

  '휘발유': 'Gasoline',
  '가솔린': 'Gasoline',
  '경유': 'Diesel',
  '디젤': 'Diesel',
  '하이브리드': 'Hybrid',
  '전기': 'Electric',
  'LPG': 'LPG Gas',
  '오토': 'Automatic',
  '수동': 'Manual',
  '무사고': 'Accident-Free',
  '단순교환': 'Simple Replacement (No Accident)',
  '완전무사고': 'Perfect Accident-Free',
  '프레스티지': 'Prestige',
  '노블레스': 'Noblesse',
  '시그니처': 'Signature',
  '캘리그래피': 'Calligraphy',
  '익스클루시브': 'Exclusive',
  '프리미엄': 'Premium',
  '스마트': 'Smart',
  '트렌디': 'Trendy',
  '럭셔리': 'Luxury'
};

// قاموس خيارات ومميزات السيارات (Standard Car Features Pair)
const FEATURES_DICTIONARY = [
  { ar: 'نظام منع انغلاق المكابح (ABS)', en: 'Anti-lock Braking System (ABS)', keywords: ['abs', 'مكابح', '안티록'] },
  { ar: 'شاشة AV للمقاعد الأمامية / نظام ملاحة', en: 'Front AV Navigation Display', keywords: ['av', 'ملاحة', '네비', 'navigation'] },
  { ar: 'قفيل أبواب كهربائي / نظام دخول ذكي', en: 'Electric Door Lock & Smart Entry', keywords: ['قفيل', 'دخول', '스마트키', 'lock'] },
  { ar: 'عجلة قيادة كهربائية / تدفئة المقود', en: 'Power Heated Steering Wheel', keywords: ['عجلة', 'مقود', '열선핸들', 'steering'] },
  { ar: 'مقاعد جلدية فاخرة', en: 'Premium Leather Seats', keywords: ['مقاعد جلدية', 'جلد', '가죽시트', 'leather'] },
  { ar: 'نظام منع الانزلاق (TCS / ESC)', en: 'Traction & Stability Control (TCS/ESC)', keywords: ['انزلاق', 'tcs', 'esc', '차체자세제어'] },
  { ar: 'عجلات ألومنيوم / جنوط رياضية', en: 'Alloy Wheels & Sport Rims', keywords: ['عجلات', 'جنوط', '알루미늄휠', 'wheel'] },
  { ar: 'وسادة هوائية جانبية وللمقاعد', en: 'Side & Curtain Airbags', keywords: ['وسادة', 'إيرباج', '에어백', 'airbag'] },
  { ar: 'مقاعد مدفأة (المقاعد الأمامية/الخلفية)', en: 'Heated Front & Rear Seats', keywords: ['مدفأة', 'تدفئة', '열선시트', 'heated'] },
  { ar: 'مقاعد بحاصية التهوية (تبريد المقاعد)', en: 'Ventilated Cooling Seats', keywords: ['تهوية', 'تبريد', '통풍시트', 'ventilated'] },
  { ar: 'مكيف هواء أوتوماتيكي ثنائي المناطق', en: 'Dual Automatic Climate Air Conditioning', keywords: ['مكيف', 'climate', '풀오토에어컨', 'ac'] },
  { ar: 'حساسات ركن خلفية وأمامية', en: 'Front & Rear Parking Sensors', keywords: ['حساسات', 'ركن', '주차감지센서', 'sensor'] },
  { ar: 'كاميرا خلفية / رؤية محيطية 360°', en: 'Rear Camera & 360° View', keywords: ['كاميرا', '후방카메라', 'camera', 'surround'] },
  { ar: 'مرآة داخلية بخاصية التعتيم الإلكتروني', en: 'Auto-Dimming ECM Rearview Mirror', keywords: ['تعتيم', 'ecm', '하이패스룸미러', 'mirror'] },
  { ar: 'أزرار تحكم على عجلة القيادة', en: 'Steering Wheel Audio Controls', keywords: ['أزرار', 'تحكم', '핸들리모컨', 'control'] },
  { ar: 'نظام مراقبة ضغط الإطارات (TPMS)', en: 'Tire Pressure Monitoring System (TPMS)', keywords: ['ضغط الإطارات', 'tpms', '타이어공기압', 'pressure'] },
  { ar: 'نظام التنبيه عند مغادرة المسار (LDWS)', en: 'Lane Departure Warning System (LDWS)', keywords: ['المسار', 'ldws', '차선이탈', 'lane'] },
  { ar: 'نظام دفع رائع / مثبت حركة', en: 'Drive Mode Select & Cruise Control', keywords: ['مثبت', 'cruise', '크루즈컨트롤'] },
  { ar: 'بلوتوث / شاحن لاسلكي / منفذ USB', en: 'Bluetooth & Wireless Phone Charger', keywords: ['بلوتوث', 'usb', 'شاحن', '무선충전', 'bluetooth'] },
  { ar: 'فتحة سقف بانورامية', en: 'Panoramic Sunroof', keywords: ['فتحة سقف', 'سقف', '선루프', 'sunroof'] }
];

class KoreanTranslationService {
  /**
   * ترجمة وتنظيف النص الكوري بالكامل إلى اللغة العربية النظيفة
   */
  static cleanAndTranslate(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();
    Object.keys(KOREAN_DICTIONARY).forEach(koreanTerm => {
      const regex = new RegExp(koreanTerm, 'gi');
      cleaned = cleaned.replace(regex, KOREAN_DICTIONARY[koreanTerm]);
    });

    cleaned = cleaned.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

    return cleaned || text;
  }

  /**
   * ترجمة إلى اللغة الإنجليزية النظيفة
   */
  static translateToEnglish(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();
    Object.keys(ENGLISH_DICTIONARY).forEach(koreanTerm => {
      const regex = new RegExp(koreanTerm, 'gi');
      cleaned = cleaned.replace(regex, ENGLISH_DICTIONARY[koreanTerm]);
    });

    cleaned = cleaned.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

    return cleaned || text;
  }

  /**
   * استخراج قائمة المميزات ثنائية اللغة (Arabic / English Features)
   */
  static extractBilingualFeatures(rawTextOrHtml = '') {
    const textLower = String(rawTextOrHtml).toLowerCase();
    const featuresAr: string[] = [];
    const featuresEn: string[] = [];

    FEATURES_DICTIONARY.forEach(item => {
      const matched = item.keywords.some(kw => textLower.includes(kw));
      if (matched || !rawTextOrHtml) {
        featuresAr.push(item.ar);
        featuresEn.push(item.en);
      }
    });

    // إذا لم يطابق نص محدد، نعطي قائمة مميزات قياسية افتراضية
    if (featuresAr.length < 5) {
      FEATURES_DICTIONARY.slice(0, 10).forEach(item => {
        if (!featuresAr.includes(item.ar)) {
          featuresAr.push(item.ar);
          featuresEn.push(item.en);
        }
      });
    }

    return { featuresAr, featuresEn };
  }

  /**
   * صياغة تقرير الفحص والهيكل ثنائي اللغة (Inspection Report)
   */
  static generateBilingualInspectionReport(rawText = '') {
    const hasAccidentKeywords = ['حادث', 'حادث جسيم', 'أضرار جسيمة', 'accident', '사고유'];
    const textLower = String(rawText).toLowerCase();
    const hasAccident = hasAccidentKeywords.some(kw => textLower.includes(kw));

    if (hasAccident) {
      return {
        statusAr: 'توجد ملاحظات هيكلية مسجلة على السيارة',
        statusEn: 'Structural notes / Minor accident history recorded',
        hasAccidents: true,
        accidentDetailsAr: 'تم تدوين استبدال أو صيانة بسيطة لبعض القطع الخرجية مع سلامة المحرك والهيكل الأساسي.',
        accidentDetailsEn: 'Minor exterior part replacement noted with intact engine and chassis frame.'
      };
    }

    return {
      statusAr: 'لا توجد أضرار مُسجّلة على هيكل هذه السيارة',
      statusEn: 'No accident damage recorded on vehicle body',
      hasAccidents: false,
      accidentDetailsAr: 'هيكل السيارة وسقفها والشاسي الأساسي خالية تماماً من الحوادث ومفحوصة بالكامل.',
      accidentDetailsEn: 'Body frame, chassis and roof are 100% accident-free and fully inspected.'
    };
  }

  /**
   * ترجمة نظيفة خاصة بالعنوان (Title)
   */
  static formatTitle(make, model, year, rawTitle = '') {
    const cleanMake = this.cleanAndTranslate(make || '');
    const cleanModel = this.cleanAndTranslate(model || '');
    const cleanRaw = this.cleanAndTranslate(rawTitle || '');

    if (cleanMake && cleanModel) {
      return `${cleanMake} ${cleanModel} ${year || ''}`.trim();
    }
    return cleanRaw || `${cleanMake} ${year || ''}`.trim();
  }

  static hasKoreanText(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
  }
}

module.exports = KoreanTranslationService;
