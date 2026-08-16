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

// Configure multer with temp storage (Vercel compatible)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

// ═══════════════════════════════════════════════════════
// دالة رفع الصورة لـ Vercel Blob (الحل الجديد)
// ═══════════════════════════════════════════════════════
async function uploadToVercelBlob(filePath, originalName) {
    const { put } = require('@vercel/blob');
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(originalName) || '.jpg';
    const blobName = `cars/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    const blob = await put(blobName, fileBuffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: `image/${ext.replace('.', '') || 'jpeg'}`,
        addRandomSuffix: false,
    });

    return blob.url;
}

// ═══════════════════════════════════════════════════════
// نقطة رفع الصور - تجرب Vercel Blob أولاً، ثم Cloudinary، ثم محلي
// ═══════════════════════════════════════════════════════
router.post('/', uploadLimiter, requireAuthAPI, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No File',
                message: 'Please select an image to upload'
            });
        }

        // 1. محاولة Vercel Blob أولاً (الأولوية القصوى)
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
        if (blobToken && blobToken.startsWith('vercel_blob_rw_')) {
            try {
                const blobUrl = await uploadToVercelBlob(req.file.path, req.file.originalname);
                try { fs.unlinkSync(req.file.path); } catch { }
                console.log('✅ Image uploaded to Vercel Blob:', blobUrl);
                return res.json({
                    success: true,
                    url: blobUrl,
                    provider: 'vercel-blob',
                    message: 'تم رفع الصورة بنجاح إلى Vercel Blob'
                });
            } catch (blobErr) {
                console.warn('⚠️ Vercel Blob upload failed, trying Cloudinary:', blobErr.message);
            }
        }

        // 2. محاولة Cloudinary كـ fallback
        const hasCloud =
            config.cloudinary &&
            config.cloudinary.cloud_name &&
            config.cloudinary.api_key &&
            config.cloudinary.api_secret;

        if (hasCloud) {
            cloudinaryLib.config({
                cloud_name: config.cloudinary.cloud_name,
                api_key: config.cloudinary.api_key,
                api_secret: config.cloudinary.api_secret
            });
            const folder = config.cloudinary.upload?.folder || 'hm-car';
            const result = await cloudinaryLib.uploader.upload(req.file.path, {
                folder,
                resource_type: 'image',
                overwrite: true,
                use_filename: true,
                unique_filename: true,
                transformation: [
                    { width: 1000, crop: "limit" },
                    { quality: "60", fetch_format: "auto" }
                ]
            });
            try { fs.unlinkSync(req.file.path); } catch { }
            return res.json({
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
                provider: 'cloudinary',
                message: 'تم رفع الصورة إلى Cloudinary'
            });
        }

        // 3. بيئة الإنتاج بدون أي تخزين سحابي = خطأ
        if (process.env.NODE_ENV === 'production') {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'لم يتم إعداد Vercel Blob أو Cloudinary. لا يمكن رفع الصور في الإنتاج.'
            });
        }

        // 4. تطوير محلي فقط
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            url: imageUrl,
            provider: 'local',
            message: 'تم رفع الصورة محلياً (بيئة تطوير فقط)'
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Upload Failed',
            message: error.message || 'حدث خطأ أثناء رفع الصورة'
        });
    }
});

module.exports = router;
