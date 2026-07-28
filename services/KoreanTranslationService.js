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

class KoreanTranslationService {
  /**
   * ترجمة وتنظيف النص الكوري بالكامل إلى اللغة العربية النظيفة
   * @param {string} text النص المراد ترجمته
   * @returns {string} النص المعرب النظيف بدون حروف كورية
   */
  static cleanAndTranslate(text) {
    if (!text || typeof text !== 'string') return '';

    let cleaned = text.trim();

    // 1. استبدال الكلمات المعرفة بالقاموس
    Object.keys(KOREAN_DICTIONARY).forEach(koreanTerm => {
      const regex = new RegExp(koreanTerm, 'gi');
      cleaned = cleaned.replace(regex, KOREAN_DICTIONARY[koreanTerm]);
    });

    // 2. إزالة أي حروف كورية متبقية لم تغطها الشروط (Hangul Korean Unicode Range \uAC00-\uD7A3, \u1100-\u11FF, \u3130-\u318F)
    cleaned = cleaned.replace(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]+/g, ' ').trim();

    // 3. تنظيف المسافات والرموز الزائدة
    cleaned = cleaned.replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

    return cleaned || text;
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

  /**
   * فحص هل يحتوي النص على حروف كورية خام
   */
  static hasKoreanText(text) {
    if (!text || typeof text !== 'string') return false;
    return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
  }
}

module.exports = KoreanTranslationService;
