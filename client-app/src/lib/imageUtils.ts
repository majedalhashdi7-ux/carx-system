/**
 * imageUtils.ts
 * دوال مساعدة مركزية لمعالجة وتصحيح صور السيارات
 * تضمن معالجة الروابط وتمرير صور Encar عبر image-proxy مع إضافة علامة HM CAR المائية
 */

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop';

/**
 * تنظيف وتصحيح روابط الصور (معالجة البادئات المزدوجة والمسارات النسبية)
 */
export function normalizeImageUrl(rawUrl: string | null | undefined): string {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return FALLBACK_IMAGE;
    let url = rawUrl.trim();

    // فك التغليف إذا كان الرابط داخل /api/v2/image-proxy?url=
    while (url.includes('/api/v2/image-proxy?url=') || url.includes('/api/v2/image-proxy%3Furl%3D')) {
        try {
            const match = url.match(/url=([^&]+)/i) || url.match(/url%3D([^&]+)/i);
            if (match && match[1]) {
                url = decodeURIComponent(match[1]).trim();
            } else {
                break;
            }
        } catch {
            break;
        }
    }

    // تصحيح البادئة المزدوجة للرابط
    if (url.includes('https://ci.encar.comhttps://')) {
        url = url.replace('https://ci.encar.comhttps://', 'https://');
    }
    if (url.includes('ci.encar.comhttps://')) {
        url = url.replace(/.*https:\/\//, 'https://');
    }

    // تصحيح المسارات النسبية لـ Encar
    if (url.startsWith('/carpicture')) {
        url = `https://ci.encar.com${url}`;
    } else if (url.startsWith('carpicture/')) {
        url = `https://ci.encar.com/${url}`;
    } else if (!url.startsWith('http') && !url.startsWith('/uploads/') && !url.startsWith('/public/') && !url.startsWith('/api/') && !url.startsWith('data:')) {
        url = `https://ci.encar.com/carpicture/${url.replace(/^\/+/, '')}`;
    }

    // تصحيح أسماء الملفات التي تنتهي بـ _
    if (url.endsWith('_')) {
        url = `${url}001.jpg`;
    }

    return url;
}

/**
 * تحديد ما إذا كانت الصورة خارجية من Encar
 */
export function isEncarImage(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return (
        url.includes('ci.encar.com') ||
        url.includes('encar.com') ||
        url.includes('carpicture') ||
        url.includes('encar.co.kr')
    );
}

/**
 * تحويل رابط صورة Encar أو المصادر الخارجية إلى رابط image-proxy مع علامة HM CAR المائية
 * يُمرر عبر الباك إند لمنع حجب Hotlinking 403 وتسريع العرض بالحفظ المؤقت
 */
export function getProxiedImageUrl(rawUrl: string | null | undefined, watermarkText = 'HM CAR'): string {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return FALLBACK_IMAGE;
    const normalized = normalizeImageUrl(rawUrl);

    // إذا كانت الصورة Cloudinary أو data URI
    if (
        normalized.startsWith('data:') ||
        normalized.includes('res.cloudinary.com')
    ) {
        return normalized;
    }

    // إذا كانت الصورة تحمل علامة image-proxy مسبقاً بعد فك التغليف
    if (normalized.includes('/api/v2/image-proxy')) {
        return normalized;
    }

    // الصور الخارجية (Encar وغيره) نمررها عبر بروكسي الباك إند
    if (normalized.startsWith('http')) {
        return `/api/v2/image-proxy?url=${encodeURIComponent(normalized)}&watermark=true&text=${encodeURIComponent(watermarkText)}`;
    }

    return normalized;
}

/**
 * توليد وتوسيع قائمة صور السيارة لتشمل جميع الزوايا الكاملة (001 إلى 020)
 * إذا كانت الصورة من Encar وتحتوي على 001.jpg أو نمط مماثل
 */
export function expandCarImages(images: (string | null | undefined)[]): string[] {
    if (!Array.isArray(images) || images.length === 0) return [FALLBACK_IMAGE];
    const valid = images.filter((img): img is string => !!img && typeof img === 'string' && img.trim() !== '');
    if (valid.length === 0) return [FALLBACK_IMAGE];

    // إذا كانت هناك بالفعل عدة صور مختلفة (أكثر من 4 صور)، نحتفظ بها
    if (valid.length > 4) {
        return valid;
    }

    // البحث عن أي رابط صورة لـ Encar يحتوي على نمط ترقيم (مثل _001.jpg أو 001.jpg أو نهاية _)
    for (const rawUrl of valid) {
        const normalized = normalizeImageUrl(rawUrl);
        const match = normalized.match(/^(.*?)_0*1\.(jpe?g|png|webp)(\?.*)?$/i) ||
                      normalized.match(/^(.*?)001\.(jpe?g|png|webp)(\?.*)?$/i) ||
                      (normalized.endsWith('_') ? [null, normalized.slice(0, -1), 'jpg', ''] : null);
        if (match) {
            const prefix = match[1];
            const ext = match[2] || 'jpg';
            const query = match[3] || '';
            const expanded: string[] = [];
            // توليد الصور من 001 إلى 020
            for (let i = 1; i <= 20; i++) {
                const numStr = String(i).padStart(3, '0');
                const candidate = `${prefix}_${numStr}.${ext}${query}`;
                expanded.push(candidate);
            }
            return expanded;
        }
    }

    return valid;
}

/**
 * معالجة مصفوفة صور السيارة مع التوسيع التلقائي لكامل صور المعرض (20 زاوية)
 */
export function processCarImages(images: (string | null | undefined)[], watermarkText = 'HM CAR'): string[] {
    if (!Array.isArray(images) || images.length === 0) return [FALLBACK_IMAGE];
    const expanded = expandCarImages(images);
    const processed = expanded
        .filter((img): img is string => !!img && typeof img === 'string' && img.trim() !== '')
        .map(img => getProxiedImageUrl(img, watermarkText));
    return processed.length > 0 ? processed : [FALLBACK_IMAGE];
}

/**
 * جلب الصورة الأولى الصالحة من السيارة (تفضل الصور الحقيقية على النافذة المؤقتة Unsplash)
 */
export function getCarMainImage(car: {
    images?: (string | null)[];
    imageUrl?: string | null;
    image?: string | null;
    mainImage?: string | null;
} | null | undefined): string {
    if (!car) return FALLBACK_IMAGE;

    // تجميع كافة الصور المرشحة
    const candidates: string[] = [];
    if (Array.isArray(car.images)) {
        car.images.forEach(img => { if (typeof img === 'string' && img.trim()) candidates.push(img.trim()); });
    }
    if (car.mainImage && typeof car.mainImage === 'string' && car.mainImage.trim()) candidates.push(car.mainImage.trim());
    if (car.imageUrl && typeof car.imageUrl === 'string' && car.imageUrl.trim()) candidates.push(car.imageUrl.trim());
    if (car.image && typeof car.image === 'string' && car.image.trim()) candidates.push(car.image.trim());

    // البحث عن أول صورة حقيقية ليست Unsplash placeholder
    const realImage = candidates.find(img => !img.includes('unsplash.com'));

    // اختيار الصورة الحقيقية إن وجدت
    const selected = realImage || candidates[0] || FALLBACK_IMAGE;
    return getProxiedImageUrl(selected);
}

export { FALLBACK_IMAGE };
