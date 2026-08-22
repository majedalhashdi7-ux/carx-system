// [[ARABIC_HEADER]] image-proxy.js - بروكسي الصور مع دعم العلامة المائية HM CAR
// يستقبل صور خارجية ويضيف عليها علامة مائية ثم يعيدها للمستخدم

const express = require('express');
const router = express.Router();
const axios = require('axios');

// محاولة تحميل Sharp لمعالجة الصور
let sharp;
try {
    sharp = require('sharp');
} catch {
    sharp = null;
    console.warn('[ImageProxy] Sharp not available - watermark will be text overlay only');
}

const WATERMARK_TEXT = 'HM CAR';

/**
 * إضافة علامة مائية نصية على الصورة باستخدام Sharp
 */
async function applyWatermarkWithSharp(imageBuffer, text = WATERMARK_TEXT) {
    if (!sharp) return imageBuffer;

    try {
        const img = sharp(imageBuffer);
        const meta = await img.metadata();
        const w = meta.width || 800;
        const h = meta.height || 600;

        // حجم الخط بناءً على الصورة
        const fontSize = Math.max(18, Math.floor(Math.min(w, h) * 0.045));

        // إنشاء SVG للعلامة المائية
        const svgText = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              .wm {
                font-family: Arial, Helvetica, sans-serif;
                font-weight: bold;
                font-size: ${fontSize}px;
                fill: rgba(255,255,255,0.75);
                letter-spacing: 2px;
              }
              .shadow {
                font-family: Arial, Helvetica, sans-serif;
                font-weight: bold;
                font-size: ${fontSize}px;
                fill: rgba(0,0,0,0.45);
                letter-spacing: 2px;
              }
            </style>
          </defs>
          <!-- ظل -->
          <text x="${w - 20}" y="${h - 22}" text-anchor="end" class="shadow">${text}</text>
          <!-- النص الرئيسي -->
          <text x="${w - 18}" y="${h - 20}" text-anchor="end" class="wm">${text}</text>
        </svg>`;

        return await sharp(imageBuffer)
            .composite([{
                input: Buffer.from(svgText),
                gravity: 'southeast',
                blend: 'over'
            }])
            .jpeg({ quality: 85 })
            .toBuffer();
    } catch (e) {
        console.warn('[ImageProxy] Sharp watermark failed:', e.message);
        return imageBuffer;
    }
}

/**
 * GET /api/v2/image-proxy?url=...&watermark=true&text=...
 * يجلب الصورة من أي مصدر خارجي ويضيف عليها علامة مائية HM CAR
 */
router.get('/', async (req, res) => {
    try {
        const { url: rawImageUrl, watermark, text } = req.query;

        if (!rawImageUrl || typeof rawImageUrl !== 'string') {
            return res.redirect('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000');
        }

        let imageUrl = String(rawImageUrl).trim();

        // 1. فك التغليف المتكرر إذا كان الرابط ممرراً عبر البروكسي عدة مرات
        while (imageUrl.includes('/api/v2/image-proxy?url=') || imageUrl.includes('/api/v2/image-proxy%3Furl%3D')) {
            try {
                const match = imageUrl.match(/url=([^&]+)/i) || imageUrl.match(/url%3D([^&]+)/i);
                if (match && match[1]) {
                    imageUrl = decodeURIComponent(match[1]).trim();
                } else {
                    break;
                }
            } catch {
                break;
            }
        }

        // 2. تصحيح البادئة المزدوجة للـ URL
        if (imageUrl.includes('https://ci.encar.comhttps://')) {
            imageUrl = imageUrl.replace('https://ci.encar.comhttps://', 'https://');
        }
        if (imageUrl.includes('ci.encar.comhttps://')) {
            imageUrl = imageUrl.replace(/.*https:\/\//, 'https://');
        }

        // 3. تصحيح المسارات النسبية لـ Encar
        if (imageUrl.startsWith('/carpicture') || imageUrl.startsWith('carpicture')) {
            const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
            imageUrl = `https://ci.encar.com${cleanPath}`;
        } else if (!imageUrl.startsWith('http') && (imageUrl.includes('/001/') || imageUrl.includes('.jpg') || imageUrl.includes('.png'))) {
            imageUrl = `https://ci.encar.com/carpicture/${imageUrl.replace(/^\/+/, '')}`;
        }

        if (imageUrl.endsWith('_')) {
            imageUrl = `${imageUrl}001.jpg`;
        }

        if (!imageUrl.startsWith('http')) {
            return res.redirect('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000');
        }

        const isEncar = imageUrl.includes('encar.com') || imageUrl.includes('encar.co.kr') ||
            imageUrl.includes('ci.encar') || imageUrl.includes('carpicture');

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        };

        if (isEncar) {
            headers['Referer'] = 'https://www.encar.com/';
            headers['Origin'] = 'https://www.encar.com';
            headers['Sec-Fetch-Dest'] = 'image';
            headers['Sec-Fetch-Mode'] = 'no-cors';
            headers['Sec-Fetch-Site'] = 'cross-site';
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers,
            timeout: 15000,
        });

        let imageData = Buffer.from(response.data);
        const contentType = response.headers['content-type'] || 'image/jpeg';

        // تطبيق العلامة المائية إذا طُلب أو دائماً للصور الخارجية عند توفر Sharp
        const shouldWatermark = (watermark === 'true' || isEncar) && !!sharp;
        if (shouldWatermark) {
            try {
                const wmText = (text ? decodeURIComponent(text) : WATERMARK_TEXT);
                imageData = await applyWatermarkWithSharp(imageData, wmText);
                res.setHeader('Content-Type', 'image/jpeg');
            } catch {
                res.setHeader('Content-Type', contentType);
            }
        } else {
            res.setHeader('Content-Type', contentType);
        }

        res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable'); // 7 أيام
        res.setHeader('X-Watermarked', shouldWatermark ? 'true' : 'false');
        return res.send(imageData);

    } catch (err) {
        console.warn('[ImageProxy] Failed for:', req.query.url, '-', err.message);
        return res.redirect('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000');
    }
});

module.exports = router;
