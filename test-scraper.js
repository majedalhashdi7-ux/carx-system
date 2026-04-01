const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const {data} = await axios.get('https://autospare.com.eg/brands/toyota/corolla/');
    const $ = cheerio.load(data);
    const results = [];
    $('a.text-decoration-none[href*="/products/"]').each((i, el)=>{
        const $el = $(el);
        const sourceUrl = $el.attr('href');
        const root = $el.closest('.card, .product, .col-lg-4, .col-6, article, li');
        const pName = $el.text().trim().replace(/\s+/g, ' ');
        const imgEl = root.find('img').first();
        let pImg = imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || imgEl.attr('src');
        if (!pImg || pImg.includes('data:image') || pImg.includes('placeholder')) {
            const sourceImg = root.find('source').first().attr('srcset');
            if (sourceImg) pImg = sourceImg.split(' ')[0];
        }
        if (!pImg || pImg.includes('data:image') || pImg.includes('placeholder')) {
            pImg = $el.find('img').attr('src') || $el.find('img').attr('data-src') || pImg;
        }
        if (pName) {
            results.push({ pName: pName.substring(0, 30), pImg });
        }
    });
    console.log(results.slice(0, 5));
}
test().catch(console.error);
