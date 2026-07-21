const axios = require('axios');
const cheerio = require('cheerio');

async function testDesert() {
    try {
        const url = 'https://desert-korea-auto.com/cars/?car_type=auction';
        console.log('Fetching:', url);
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
            },
            timeout: 25000
        });

        const $ = cheerio.load(res.data);
        console.log('HTML Length:', res.data.length);

        const items = [];
        const seenUrls = new Set();

        $('article, .car-card, .vehicle-card, .product, .inventory-item, div[class*="car"], a[href*="/cars/"]').each((i, element) => {
            const link = $(element).is('a') ? $(element) : $(element).find('a').first();
            let href = link.attr('href');
            if (!href || seenUrls.has(href)) return;

            const img = $(element).find('img').first().length ? $(element).find('img').first() : link.find('img').first();
            let imgSrc = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('data-original');
            const srcset = img.attr('srcset');
            if (!imgSrc && srcset) {
                imgSrc = srcset.split(',')[0].split(' ')[0];
            }

            let title = ($(element).find('h1, h2, h3, h4, .title, .car-title, .entry-title').text().trim() 
                || img.attr('alt') 
                || link.attr('title') 
                || link.text().trim() 
                || '').replace(/\s+/g, ' ').trim();

            if (href && title.length > 3) {
                if (href.startsWith('/')) href = 'https://desert-korea-auto.com' + href;
                if (imgSrc) {
                    if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;
                    if (imgSrc.startsWith('/')) imgSrc = 'https://desert-korea-auto.com' + imgSrc;
                }

                seenUrls.add(href);
                items.push({
                    title: title.slice(0, 80),
                    images: imgSrc ? [imgSrc] : [],
                    sourceUrl: href
                });
            }
        });

        console.log('Total items scraped:', items.length);
        console.log('Sample items:', JSON.stringify(items.slice(0, 10), null, 2));
    } catch (err) {
        console.error('Scrape error:', err.message);
    }
}

testDesert();
