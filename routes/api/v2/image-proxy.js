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

        // حساب أبعاد شارة العلامة المائية بناءً على حجم الصورة
        const fontSize = Math.max(14, Math.floor(Math.min(w, h) * 0.032));
        const badgeHeight = Math.max(28, fontSize * 2.2);
        const textLen = (text || WATERMARK_TEXT).length;
        const badgeWidth = Math.max(120, textLen * (fontSize * 0.65) + 36);
        const posX = Math.max(15, w - badgeWidth - 20);
        const posY = Math.max(15, h - badgeHeight - 20);

        // إنشاء SVG لشارة العلامة المائية الشفافة الفاخرة
        const svgText = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.45"/>
            </filter>
          </defs>
          <g filter="url(#wm-shadow)">
            <!-- خلفية الشارة الشفافة الفاخرة -->
            <rect x="${posX}" y="${posY}" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="rgba(10, 12, 16, 0.45)" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1"/>
            <!-- نقطة ذهبية أنيقة -->
            <circle cx="${posX + 16}" cy="${posY + badgeHeight / 2}" r="${Math.max(3, fontSize * 0.22)}" fill="#E5C158" opacity="0.9"/>
            <!-- النص -->
            <text x="${posX + 28}" y="${posY + badgeHeight / 2 + fontSize * 0.35}" font-family="Arial, 'Segoe UI', sans-serif" font-weight="bold" font-size="${fontSize}px" fill="rgba(255, 255, 255, 0.92)" letter-spacing="1.2px">${text || WATERMARK_TEXT}</text>
          </g>
        </svg>`;

        return await sharp(imageBuffer)
            .composite([{
                input: Buffer.from(svgText),
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
