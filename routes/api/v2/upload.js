// [[ARABIC_HEADER]] هذا الملف (routes/api/v2/upload.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { requireAuthAPI } = require('../../../middleware/auth');
const { uploadLimiter } = require('../../../middleware/rateLimiter');
const config = require('../../../modules/core/config');
const cloudinaryLib = require('cloudinary').v2;

// إعداد التخزين المؤقت في نظام الملفات المتوافق مع Serverless (Vercel)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname || '.jpg'));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('الملف المرفوع ليس صورة صالحة! يرجى رفع صورة بصيغة (JPG, PNG, WebP).'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB حد أقصى
});

// ═══════════════════════════════════════════════════════
// مساعد تهيئة Cloudinary الذكي
// ═══════════════════════════════════════════════════════
function getCloudinaryConfig() {
    // 1. فحص CLOUDINARY_URL المباشر
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
        try {
            const parsed = new URL(cloudinaryUrl);
            const apiKey = parsed.username;
            const apiSecret = parsed.password;
            const cloudName = parsed.hostname;
            if (apiKey && apiSecret && cloudName) {
                return { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret };
            }
        } catch (e) {
            console.warn('⚠️ خطأ في تحليل CLOUDINARY_URL:', e.message);
        }
    }

    // 2. فحص المتغيرات المنفصلة
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || config.cloudinary?.cloud_name;
    const api_key = process.env.CLOUDINARY_API_KEY || config.cloudinary?.api_key;
    const api_secret = process.env.CLOUDINARY_API_SECRET || config.cloudinary?.api_secret;

    if (cloud_name && api_key && api_secret) {
        return { cloud_name, api_key, api_secret };
    }

    return null;
}

// ═══════════════════════════════════════════════════════
// دالة رفع ملف صورة واحدة إلى السحابة (Blob أو Cloudinary)
// ═══════════════════════════════════════════════════════
async function uploadSingleImageToCloud(filePath, originalName) {
    // 1. محاولة Vercel Blob أولاً
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken && blobToken.startsWith('vercel_blob_rw_')) {
        try {
            const { put } = require('@vercel/blob');
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(originalName) || '.jpg';
            const blobName = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

            const blob = await put(blobName, fileBuffer, {
                access: 'public',
                token: blobToken,
                contentType: `image/${ext.replace('.', '') || 'jpeg'}`,
                addRandomSuffix: false,
            });

            return { url: blob.url, provider: 'vercel-blob' };
        } catch (blobErr) {
            console.warn('⚠️ فشل الرفع لـ Vercel Blob، المحاولة مع Cloudinary:', blobErr.message);
        }
    }

    // 2. محاولة Cloudinary
    const cloudConfig = getCloudinaryConfig();
    if (cloudConfig) {
        cloudinaryLib.config({
            cloud_name: cloudConfig.cloud_name,
            api_key: cloudConfig.api_key,
            api_secret: cloudConfig.api_secret,
            secure: true
        });

        const folder = config.cloudinary?.upload?.folder || 'hm-car';
        const result = await cloudinaryLib.uploader.upload(filePath, {
            folder,
            resource_type: 'image',
            overwrite: true,
            use_filename: true,
            unique_filename: true,
            transformation: [
                { width: 1600, crop: "limit" },
                { quality: "auto", fetch_format: "auto" }
            ]
        });

        return { url: result.secure_url, public_id: result.public_id, provider: 'cloudinary' };
    }

    // 3. بيئة الإنتاج بدون أي سحابة
    if (process.env.NODE_ENV === 'production') {
        throw new Error('لم يتم إعداد مزود تخزين سحابي (Cloudinary أو Vercel Blob). يرجى إضافة مفاتيح Cloudinary في إعدادات البيئة.');
    }

    // 4. بيئة التطوير المحلي (Local Fallback)
    const fileName = path.basename(filePath);
    return { url: `/uploads/${fileName}`, provider: 'local' };
}

// ═══════════════════════════════════════════════════════
// GET /api/v2/upload/status - فحص حالة وجاهزية التخزين السحابي
// ═══════════════════════════════════════════════════════
router.get('/status', (req, res) => {
    const cloudConfig = getCloudinaryConfig();
    const hasBlob = !!(process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_'));
    const hasCloudinary = !!cloudConfig;

    res.json({
        success: true,
        isConfigured: hasBlob || hasCloudinary,
        providers: {
            vercelBlob: {
                active: hasBlob,
                status: hasBlob ? 'Ready' : 'Not Configured'
            },
            cloudinary: {
                active: hasCloudinary,
                cloudName: cloudConfig?.cloud_name || null,
                status: hasCloudinary ? 'Ready' : 'Not Configured'
            }
        },
        activeProvider: hasBlob ? 'vercel-blob' : (hasCloudinary ? 'cloudinary' : (process.env.NODE_ENV === 'production' ? 'none' : 'local-disk')),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ═══════════════════════════════════════════════════════
// POST /api/v2/upload - رفع صورة واحدة
// ═══════════════════════════════════════════════════════
router.post('/', uploadLimiter, requireAuthAPI, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No File',
                message: 'يرجى اختيار صورة للرفع'
            });
        }

        const uploadResult = await uploadSingleImageToCloud(req.file.path, req.file.originalname);
        
        // تنظيف الملف المؤقت
        try { fs.unlinkSync(req.file.path); } catch { }

        return res.json({
            success: true,
            url: uploadResult.url,
            provider: uploadResult.provider,
            public_id: uploadResult.public_id,
            message: `تم رفع الصورة بنجاح عبر (${uploadResult.provider})`
        });

    } catch (error) {
        if (req.file && req.file.path) {
            try { fs.unlinkSync(req.file.path); } catch { }
        }
        console.error('❌ خطأ في رفع الصورة:', error.message);
        res.status(500).json({
            success: false,
            error: 'Upload Failed',
            message: error.message || 'حدث خطأ أثناء رفع الصورة'
        });
    }
});

// ═══════════════════════════════════════════════════════
// POST /api/v2/upload/multiple - رفع عدة صور دفعة واحدة
// ═══════════════════════════════════════════════════════
router.post('/multiple', uploadLimiter, requireAuthAPI, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No Files',
                message: 'يرجى اختيار صور للرفع'
            });
        }

        const uploadPromises = req.files.map(async (file) => {
            try {
                const result = await uploadSingleImageToCloud(file.path, file.originalname);
                try { fs.unlinkSync(file.path); } catch { }
                return { success: true, url: result.url, provider: result.provider, originalName: file.originalname };
            } catch (err) {
                try { fs.unlinkSync(file.path); } catch { }
                return { success: false, error: err.message, originalName: file.originalname };
            }
        });

        const results = await Promise.all(uploadPromises);
        const successful = results.filter(r => r.success);

        return res.json({
            success: successful.length > 0,
            uploadedCount: successful.length,
            totalCount: req.files.length,
            urls: successful.map(r => r.url),
            results,
            message: `تم رفع ${successful.length} من أصل ${req.files.length} صورة بنجاح`
        });

    } catch (error) {
        console.error('❌ خطأ في الرفع المتعدد:', error.message);
        res.status(500).json({
            success: false,
            error: 'Batch Upload Failed',
            message: error.message || 'حدث خطأ أثناء رفع الصور'
        });
    }
});

// ═══════════════════════════════════════════════════════
// POST /api/v2/upload/base64 - رفع صورة عبر Base64 data URL
// ═══════════════════════════════════════════════════════
router.post('/base64', uploadLimiter, requireAuthAPI, async (req, res) => {
    try {
        const { image, name } = req.body;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid Payload',
                message: 'يرجى توفير بيانات الصورة بصيغة Base64'
            });
        }

        const cloudConfig = getCloudinaryConfig();
        if (cloudConfig) {
            cloudinaryLib.config({
                cloud_name: cloudConfig.cloud_name,
                api_key: cloudConfig.api_key,
                api_secret: cloudConfig.api_secret,
                secure: true
            });

            const folder = config.cloudinary?.upload?.folder || 'hm-car';
            const result = await cloudinaryLib.uploader.upload(image, {
                folder,
                resource_type: 'image',
                transformation: [
                    { width: 1600, crop: "limit" },
                    { quality: "auto", fetch_format: "auto" }
                ]
            });

            return res.json({
                success: true,
                url: result.secure_url,
                provider: 'cloudinary',
                message: 'تم رفع صورة Base64 إلى Cloudinary بنجاح'
            });
        }

        // تحويل Base64 إلى ملف مؤقت لـ Vercel Blob أو Local
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, message: 'صيغة Base64 غير صالحة' });
        }

        const ext = matches[1].split('/')[1] || 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const tempPath = path.join(os.tmpdir(), `base64-${Date.now()}.${ext}`);
        fs.writeFileSync(tempPath, buffer);

        const uploadResult = await uploadSingleImageToCloud(tempPath, name || `upload.${ext}`);
        try { fs.unlinkSync(tempPath); } catch { }

        return res.json({
            success: true,
            url: uploadResult.url,
            provider: uploadResult.provider,
            message: `تم رفع صورة Base64 بنجاح عبر (${uploadResult.provider})`
        });

    } catch (error) {
        console.error('❌ خطأ في رفع Base64:', error.message);
        res.status(500).json({
            success: false,
            error: 'Base64 Upload Failed',
            message: error.message || 'حدث خطأ أثناء رفع الصورة'
        });
    }
});

module.exports = router;
