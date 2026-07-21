const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/v2/image-proxy?url=...
router.get('/', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
            return res.redirect('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000');
        }

        const isEncar = imageUrl.includes('encar.com') || imageUrl.includes('encar.co.kr');
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        };
        if (isEncar) {
            headers['Referer'] = 'https://www.encar.com/';
        }

        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers,
            timeout: 12000,
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, immutable');
        return res.send(response.data);
    } catch (err) {
        console.warn('[ImageProxy] Failed to proxy image:', req.query.url, err.message);
        return res.redirect('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000');
    }
});

module.exports = router;
