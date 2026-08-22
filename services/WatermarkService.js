// [[ARABIC_HEADER]] هذا الملف (services/WatermarkService.js) خدمة العلامة المائية للصور (HM CAR)

/**
 * خدمة العلامة المائية (Watermark)
 * تضمن ختم الشعار والهوية البصرية على صور السيارات المستوردة تلقائياً.
 * - Cloudinary: تطبيق العلامة المائية عبر Cloudinary Transformation API
 * - الروابط المحلية: تمرير عبر /api/v2/image-proxy للختم ديناميكياً
 * - الروابط الخارجية: تمرير عبر /api/v2/image-proxy مع watermark=true
 */

const WATERMARK_TEXT = 'HM CAR';
const WATERMARK_TEXT_AR = 'HM CAR | منصة السيارات';

class WatermarkService {
    /**
     * تطبيق العلامة المائية على رابط صورة واحد
     * @param {string} imageUrl رابط الصورة
     * @param {object} options خيارات العلامة المائية
     * @returns {string} رابط الصورة مع العلامة المائية
     */
    static applyWatermark(imageUrl, options = {}) {
        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) return imageUrl;

        const clean = imageUrl.trim();

        // ─── منع التكرار: إذا كانت الصورة تحمل علامة أو تمر عبر البروكسي مسبقاً ───
        if (clean.includes('image-proxy') || clean.includes('watermark=true') || clean.includes('l_text:')) {
            return clean;
        }

        const watermarkText = options.watermarkText || WATERMARK_TEXT;

        // ─── Cloudinary: تطبيق العلامة المائية عبر Transformation API ─────────
        if (clean.includes('res.cloudinary.com')) {
            const text = encodeURIComponent(watermarkText);
            const overlayTag = `l_text:Arial_28_bold:${text},co_white,o_60,g_south_east,x_20,y_20`;
            return clean.replace('/upload/', `/upload/${overlayTag}/`);
        }

        // ─── روابط خارجية (Encar وغيره): تمرير عبر الـ proxy ─────────────────
        if (clean.startsWith('http')) {
            const encodedUrl = encodeURIComponent(clean);
            const text = encodeURIComponent(watermarkText);
            return `/api/v2/image-proxy?url=${encodedUrl}&watermark=true&text=${text}`;
        }

        return clean;
    }

    /**
     * تطبيق العلامة المائية على قائمة من الصور
     * @param {string[]} images قائمة روابط الصور
     * @param {object} options خيارات إضافية
     * @returns {string[]} القائمة المعدلة
     */
    static processImagesList(images = [], options = {}) {
        if (!Array.isArray(images) || images.length === 0) return [];
        return images.map(img => this.applyWatermark(img, options)).filter(Boolean);
    }

    /**
     * تطبيق العلامة المائية على الصورة الرئيسية فقط
     * @param {string} imageUrl
     * @returns {string}
     */
    static applyToMainImage(imageUrl) {
        return this.applyWatermark(imageUrl, { watermarkText: WATERMARK_TEXT });
    }

    /**
     * التحقق من أن الصورة تحمل علامة مائية بالفعل
     * @param {string} imageUrl
     * @returns {boolean}
     */
    static hasWatermark(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return false;
        return imageUrl.includes('watermark=true') ||
            imageUrl.includes('l_text:') ||
            imageUrl.includes('image-proxy');
    }
}

module.exports = WatermarkService;
