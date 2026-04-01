// [[ARABIC_HEADER]] خدمة معالجة الصور الخارجية - تحميل، ضغط، وتحسين الصور من مصادر خارجية (Encar, Autospare)
// يهدف هذا الملف لضمان خفة وسرعة النظام عبر تخزين نسخ محسنة من الصور بدلاً من الاعتماد الكلي على روابط خارجية كبيرة

const axios = require('axios');
const path = require('path');
const fs = require('fs/promises');
const stream = require('stream');
const crypto = require('crypto');
const config = require('../modules/core/config');
const cloudinaryLib = require('cloudinary').v2;
const { optimizeImage } = require('../utils/imageOptimizer');

/**
 * تحميل صورة من رابط خارجي ومعالجتها
 * @param {string} url رابط الصورة
 * @param {string} folder المجلد المستهدف (e.g., 'showroom', 'parts')
 * @param {object} options خيارات الحجم والجودة (width, height, quality)
 * @returns {Promise<string|null>} المسار المحلي الجديد أو الرابط الأصلي في حالة الفشل
 */
async function downloadAndOptimize(url, folder = 'imported', options = {}) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return url;

    // 1. إنشاء اسم فريد بناءً على الرابط
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const filename = `${hash}_opt.webp`;
    const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
    const filepath = path.join(uploadsDir, filename);

    try {
        // 2. التحقق من وجود الملف مسبقاً (لتوفير الموارد)
        try {
            await fs.access(filepath);
            return `/uploads/${folder}/${filename}`;
        } catch {
            // الملف غير موجود، ننتقل للتحميل
        }

        // 3. تحميل الصورة
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.data) return url;

        // 4. ضغط وتحسين الصورة باستخدام Sharp
        const optimizedBuffer = await optimizeImage(Buffer.from(response.data), {
            width: options.width || 800,
            height: options.height || 600,
            quality: options.quality || 70,
            format: 'webp'
        });

        // 5. محاولة الرفع الدائم إلى كلاوديناري لضمان حفظ الصور مهما حصل (Vercel Reset)
        const hasCloud = config?.cloudinary?.cloud_name && config?.cloudinary?.api_key && config?.cloudinary?.api_secret;
        if (hasCloud) {
            cloudinaryLib.config({
                cloud_name: config.cloudinary.cloud_name,
                api_key: config.cloudinary.api_key,
                api_secret: config.cloudinary.api_secret
            });
            
            return new Promise((resolve) => {
                const uploadStream = cloudinaryLib.uploader.upload_stream({
                    folder: `hm-car-import/${folder}`,
                    resource_type: 'image',
                    overwrite: true,
                    unique_filename: true
                }, async (error, result) => {
                    if (error) {
                        console.warn(`[Cloudinary] Failed to upload ${url}:`, error.message);
                        // الحفظ المحلي الاحتياطي
                        try {
                            await fs.mkdir(uploadsDir, { recursive: true });
                            await fs.writeFile(filepath, optimizedBuffer);
                        } catch(e) {}
                        resolve(`/uploads/${folder}/${filename}`);
                    } else {
                        resolve(result.secure_url); // حفظ الرابط الدائم
                    }
                });
                
                const bufferStream = new stream.PassThrough();
                bufferStream.end(optimizedBuffer);
                bufferStream.pipe(uploadStream);
            });
        }

        // الحفظ المحلي كبديل لبيئة التطوير
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(filepath, optimizedBuffer);

        return `/uploads/${folder}/${filename}`;

    } catch (error) {
        console.warn(`[ExternalImage] Failed for ${url}:`, error.message);
        return url;
    }
}

/**
 * معالجة مجموعة من الروابط
 */
async function processMany(urls = [], folder = 'imported') {
    if (!urls || !Array.isArray(urls)) return [];
    
    // نستخدم Promise.all مع حد أقصى للطلبات المتزامنة (اختياري، هنا نكتفي بالبساطة)
    const results = await Promise.all(
        urls.filter(Boolean).map(url => downloadAndOptimize(url, folder))
    );
    
    return results.filter(Boolean);
}

module.exports = {
    downloadAndOptimize,
    processMany
};
