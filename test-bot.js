const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://autospare.com.eg/brands/%D8%A5%D9%86%D9%81%D9%8A%D9%86%D9%8A%D8%AA%D9%8A', {headers: {'User-Agent':'Mozilla/5.0'}})
.then(r => {
    const $ = cheerio.load(r.data);
    let results = [];
    $('a[href*="/products/"]').each((i, el) => {
        results.push({
            href: $(el).attr('href'),
            text: $(el).text().trim().substring(0, 30)
        });
    });
    console.log("Infinity page products found:", results.length);
});
