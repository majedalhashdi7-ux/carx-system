const axios = require('axios');
const cheerio = require('cheerio');

async function testFetch() {
    try {
        const url = 'https://autospare.com.eg/brands';
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        
        const models = [];
        $('a.text-decoration-none[href*="/brands/"]').each((i, el) => {
            const href = $(el).attr('href');
            if(href && !models.includes(href)) models.push(href);
        });

        console.log("Models found:", models.length, models.slice(0, 5));

        if (models.length > 0) {
            const mUrl = models[0].startsWith('http') ? models[0] : 'https://autospare.com.eg' + models[0];
            const { data: mData } = await axios.get(mUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const m$ = cheerio.load(mData);
            
            const results = [];
            let i = 0;
            m$('a.text-decoration-none[href*="/products/"]').each((j, el) => {
                if (i > 3) return;
                i++;
                const cardRoot = m$(el).closest('div.col-lg-4, div.col-md-6, div.col-6, div.product, div.card, article, li');
                const imgEl = cardRoot.find('img').first();
                let pImg = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src');
                if (!pImg || pImg.includes('data:image') || pImg.includes('placeholder')) {
                    const sourceImg = cardRoot.find('source').first().attr('srcset');
                    if (sourceImg) pImg = sourceImg.split(' ')[0];
                }
                if (!pImg || pImg.includes('data:image') || pImg.includes('placeholder')) {
                    pImg = m$(el).find('img').attr('src') || m$(el).find('img').attr('data-src') || pImg;
                }
                console.log("Extracted pImg:", pImg);
            });
        }
    } catch (e) {
        console.error("Error:", e.message);
        if(e.response) console.error("Status:", e.response.status, e.response.statusText);
    }
}
testFetch();
