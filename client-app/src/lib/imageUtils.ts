/**
 * imageUtils.ts
 * دوال مساعدة مركزية لمعالجة صور السيارات
 * تضمن مرور صور Encar عبر image-proxy مع إضافة علامة HM CAR المائية
 */

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop';

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
 * تحويل رابط صورة Encar إلى رابط image-proxy مع علامة HM CAR
 * - يُعيد نفس الرابط إذا لم يكن من Encar
 * - يمر عبر /api/v2/image-proxy مع watermark=true
 */
export function getProxiedImageUrl(url: string | null | undefined, watermarkText = 'HM CAR'): string {
    if (!url || typeof url !== 'string') return FALLBACK_IMAGE;

    // Cloudinary URLs جيدة مباشرة
    if (url.includes('res.cloudinary.com')) return url;

    // إذا كانت الصورة بالفعل تمر عبر proxy
    if (url.includes('/api/v2/image-proxy')) return url;

    // صورة محلية - لا حاجة لـ proxy
    if (url.startsWith('/uploads/') || url.startsWith('/public/')) return url;

    // Encar أو صور خارجية → نمررها عبر proxy
    if (url.startsWith('http')) {
        const encoded = encodeURIComponent(url);
        const text = encodeURIComponent(watermarkText);
        return `/api/v2/image-proxy?url=${encoded}&watermark=true&text=${text}`;
    }

    return url || FALLBACK_IMAGE;
}

/**
 * معالجة مصفوفة صور السيارة
 */
export function processCarImages(images: (string | null | undefined)[], watermarkText = 'HM CAR'): string[] {
    if (!Array.isArray(images)) return [FALLBACK_IMAGE];
    const processed = images
        .filter((img): img is string => !!img && typeof img === 'string')
        .map(img => getProxiedImageUrl(img, watermarkText));
    return processed.length > 0 ? processed : [FALLBACK_IMAGE];
}

/**
 * جلب الصورة الأولى الصالحة من السيارة
 */
export function getCarMainImage(car: {
    images?: (string | null)[];
    imageUrl?: string | null;
    image?: string | null;
} | null | undefined): string {
    if (!car) return FALLBACK_IMAGE;
    const firstImage = car.images?.[0] || car.imageUrl || car.image || null;
    return getProxiedImageUrl(firstImage);
}

export { FALLBACK_IMAGE };
