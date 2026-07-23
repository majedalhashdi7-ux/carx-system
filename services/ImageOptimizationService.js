// [[ARABIC_HEADER]] هذا الملف (services/ImageOptimizationService.js) مسؤول عن ضغط وتحسين صور السيارات وقطع الغيار تلقائياً.

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const cdnService = require('./CDNService');

class ImageOptimizationService {
    /**
     * معالجة وضغط عنوان صورة مفرد وتوليد رابط محسن وخفيف السعة
     * @param {string} imageUrl - رابط الصورة الأصلية
     * @param {Object} options - خيارات الضغط
     */
    static async optimizeImageUrl(imageUrl, options = {}) {
        if (!imageUrl || typeof imageUrl !== 'string') {
            return imageUrl || '';
        }

        const {
            width = 800,
            quality = 80,
            folder = 'hmcar-imports'
        } = options;

        // 1. إصلاح أخطاء الروابط المكررة أو النسبية من Encar
        let cleanUrl = imageUrl.trim();
        if (cleanUrl.includes('https://ci.encar.comhttps://ci.encar.com')) {
            cleanUrl = cleanUrl.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        }
        if (cleanUrl.endsWith('_')) {
            cleanUrl = cleanUrl.startsWith('http') ? `${cleanUrl}001.jpg` : `https://ci.encar.com${cleanUrl}001.jpg`;
        }
        if (cleanUrl.startsWith('/carpicture')) {
            cleanUrl = `https://ci.encar.com${cleanUrl}`;
        }
        if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('http')) {
            cleanUrl = `https://ci.encar.com/carpicture${cleanUrl}`;
        }

        // 2. إذا كان CDN مفعّلاً، ارفعه واجلب رابط CDN محسن
        if (cdnService.isAvailable()) {
            try {
                const cdnResult = await cdnService.uploadImage(cleanUrl, folder);
                if (cdnResult && cdnResult.url) {
                    return cdnResult.url;
                }
            } catch (err) {
                console.warn('[ImageOptimization] Cloudinary fallback to proxy:', err.message);
            }
        }

        // 3. التوجيه عبر Proxy المحسن لـ Next.js إذا كانت من موقع Encar الخارجي لتقليل الحجم
        if (cleanUrl.includes('encar.com') || cleanUrl.includes('encar.co.kr')) {
            return `/api/v2/image-proxy?url=${encodeURIComponent(cleanUrl)}`;
        }

        return cleanUrl;
    }

    /**
     * ضغط مصفوفة صور كاملة تلقائياً
     * @param {string[]} imagesArray - مصفوفة الروابط
     * @param {Object} options - خيارات المعالجة
     */
    static async optimizeImagesList(imagesArray = [], options = {}) {
        if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
            return [];
        }

        const results = await Promise.all(
            imagesArray.map(img => this.optimizeImageUrl(img, options))
        );

        // إزالة الروابط الفارغة أو المكررة
        return [...new Set(results.filter(Boolean))];
    }
}

module.exports = ImageOptimizationService;
