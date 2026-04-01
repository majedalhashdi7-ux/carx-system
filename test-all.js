const axios = require('axios');
const cheerio = require('cheerio');

async function testBrands() {
    try {
        const { data: brandsHtml } = await axios.get('https://autospare.com.eg/brands', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $brands = cheerio.load(brandsHtml);
        const brands = [];
        $brands('a.brand-card-link').each((i, el) => {
            brands.push({
                name: $brands(el).find('h3').text().trim(),
                url: $brands(el).attr('href')
            });
        });
        console.log("Brands found count:", brands.length);
        
        for (const b of brands.slice(0, 31)) { // test first 31 brands
            const bUrl = b.url.startsWith('http') ? b.url : 'https://autospare.com.eg' + b.url;
            try {
                const { data: mHtml } = await axios.get(bUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $m = cheerio.load(mHtml);
                const subLinks = [];
                $m('a.text-decoration-none[href*="/brands/"]').each((i, el) => {
                    const h = $m(el).attr('href');
                    if (h && h.startsWith(b.url + '/')) subLinks.push(h);
                });
                console.log(`Brand: ${b.name} | Models: ${subLinks.length}`);
            } catch(e) { console.error(`  Error for ${b.name}: ${e.message}`); }
        }
    } catch(e) { console.error(e.message); }
}
testBrands();
