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
 * إضافة علامة مائية نصية شبه شفافة وأنيقة على الصورة باستخدام Sharp
 */
async function applyWatermarkWithSharp(imageBuffer, text = WATERMARK_TEXT) {
    if (!sharp) return imageBuffer;

    try {
        const img = sharp(imageBuffer);
        const meta = await img.metadata();
        const w = meta.width || 800;
        const h = meta.height || 600;

        // حساب أبعاد شارة العلامة المائية بناءً على حجم الصورة
        const fontSize = Math.max(12, Math.floor(Math.min(w, h) * 0.028));
        const badgeHeight = Math.max(26, fontSize * 2.1);
        const displayText = (text && text.trim()) ? text.trim() : 'HM CAR';
        const badgeWidth = Math.max(105, displayText.length * (fontSize * 0.62) + 38);
        const posX = Math.max(16, w - badgeWidth - 18);
        const posY = Math.max(16, h - badgeHeight - 18);

        // إنشاء SVG لشارة العلامة المائية الشفافة الفاخرة الخاصة بـ HM CAR
        const svgText = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="wm-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2"/>
            </filter>
            <linearGradient id="wm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#C9A96E" stop-opacity="0.95"/>
              <stop offset="100%" stop-color="#F5D9A0" stop-opacity="0.95"/>
            </linearGradient>
          </defs>
          <g>
            <!-- خلفية الشارة الشبه شفافة الفاخرة (Frosted Glass) -->
            <rect x="${posX}" y="${posY}" width="${badgeWidth}" height="${badgeHeight}" rx="${badgeHeight / 2}" fill="rgba(8, 9, 13, 0.55)" stroke="rgba(201, 169, 110, 0.35)" stroke-width="1"/>
            <!-- درع / نقطة HM CAR الذهبية الفاخرة -->
            <circle cx="${posX + 15}" cy="${posY + badgeHeight / 2}" r="${Math.max(3, fontSize * 0.22)}" fill="url(#wm-grad)"/>
            <!-- النص -->
            <text x="${posX + 26}" y="${posY + badgeHeight / 2 + fontSize * 0.35}" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="${fontSize}px" fill="rgba(255, 255, 255, 0.95)" letter-spacing="1.5px">${displayText}</text>
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
        const isAutospare = imageUrl.includes('autospare.com.eg') || imageUrl.includes('autospare');

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
        } else if (isAutospare) {
            headers['Referer'] = 'https://autospare.com.eg/';
            headers['Origin'] = 'https://autospare.com.eg';
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
        const isPart = req.query.url && (
            req.query.url.includes('part') ||
            req.query.url.includes('autospare') ||
            req.query.url.includes('spare')
        );
        const fallbackUrl = isPart
            ? 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=800&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';
        return res.redirect(fallbackUrl);
    }
});

module.exports = router;
