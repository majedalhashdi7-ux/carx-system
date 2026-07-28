// [[ARABIC_HEADER]] هذا الملف (services/WatermarkService.js) خدمة العلامة المائية للصور (HM CAR Watermark Service)

/**
 * خدمة العلامة المائية (Watermark)
 * تضمن ختم الشعار والهوية البصرية على صور السيارات والمزادات المستوردة تلقائياً.
 */

class WatermarkService {
  /**
   * معالجة مائية لرابط صورة (إنشاء رابط مروس أو ختم مائي)
   * @param {string} imageUrl رابط الصورة الأصلي
   * @param {object} options خيارات العلامة المائية
   * @returns {string} رابط الصورة مع العلامة المائية
   */
  static applyWatermark(imageUrl, options = {}) {
    if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;

    const watermarkText = options.watermarkText || 'HM CAR | منصة السيارات المباشرة';
    
    // إذا كانت الصورة مسجلة على Cloudinary، نستخدم Cloudinary Transformation لتركيب العلامة المائية
    if (imageUrl.includes('res.cloudinary.com')) {
      // تركيب علامة مائية عالي الدقة عبر Cloudinary API
      const overlayTag = `l_text:Arial_24_bold:${encodeURIComponent(watermarkText)},co_rgb:ffffff80,g_south_east,x_15,y_15`;
      return imageUrl.replace('/upload/', `/upload/${overlayTag}/`);
    }

    // إذا كانت الصورة خارجية (Encar أو غيره)، نمررها عبر proxy العلامة المائية الخاص بالنظام
    const encodedUrl = encodeURIComponent(imageUrl);
    return `/api/v2/image-proxy?url=${encodedUrl}&watermark=true&text=${encodeURIComponent(watermarkText)}`;
  }

  /**
   * تطبيق العلامة المائية على مصفوفة كاملة من الصور
   * @param {Array<string>} images قائمة روابط الصور
   * @returns {Array<string>} القائمة المعدلة مع العلامة المائية
   */
  static processImagesList(images = [], options = {}) {
    if (!Array.isArray(images) || images.length === 0) return [];
    return images.map(img => this.applyWatermark(img, options));
  }
}

module.exports = WatermarkService;
