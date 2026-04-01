// script for importing directly
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const Brand = require('./models/Brand');
const SparePart = require('./models/SparePart');
const SiteSettings = require('./models/SiteSettings');
const { downloadAndOptimize } = require('./services/externalImageService');

function cleanModelName(value = '') {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeExternalImage(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http')) return trimmed;
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    return `https://autospare.com.eg${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function translatePartNameToArabic(value = '') {
    if (!value || typeof value !== 'string') return '';
    return value
        .replace(/engine/gi, 'محرك')
        .replace(/transmission/gi, 'ناقل الحركة')
        .replace(/gearbox/gi, 'جير')
        .replace(/brake/gi, 'فرامل')
        .replace(/pad(s)?/gi, 'فحمات')
        .replace(/disc/gi, 'دسك')
        .replace(/filter/gi, 'فلتر')
        .replace(/air\s*filter/gi, 'فلتر هواء')
        .replace(/oil\s*filter/gi, 'فلتر زيت')
        .replace(/fuel\s*filter/gi, 'فلتر وقود')
        .replace(/spark\s*plug/gi, 'بوجي')
        .replace(/battery/gi, 'بطارية')
        .replace(/radiator/gi, 'رديتر')
        .replace(/pump/gi, 'مضخة')
        .replace(/suspension/gi, 'نظام التعليق')
        .replace(/shock/gi, 'مساعد')
        .replace(/arm/gi, 'ذراع')
        .replace(/sensor/gi, 'حساس')
        .replace(/head\s*lamp|headlight/gi, 'شمعة أمامية')
        .replace(/tail\s*lamp|taillight/gi, 'شمعة خلفية')
        .replace(/bumper/gi, 'صدام')
        .replace(/door/gi, 'باب')
        .replace(/mirror/gi, 'مرآة')
        .replace(/wheel/gi, 'جنط')
        .replace(/tire|tyre/gi, 'إطار')
        .replace(/kit/gi, 'طقم')
        .trim();
}

async function runImport() {
    try {
        console.log('Connecting to database...');
        // Load production env for testing cloud DB directly
        require('dotenv').config({ path: './.env.production.vercel' });
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) throw new Error('MONGO_URI is missing');
        await mongoose.connect(mongoUri.replace(/\\r\\n|\r\n/g, '').replace(/"/g, ''));
        console.log('Connected to DB. Starting import...');

        const BASE_URL = 'https://autospare.com.eg';
        const BRANDS_URL = `${BASE_URL}/brands`;
        
        // Settings for import size
        const maxBrands = 5;
        const maxModelsPerBrand = 2; // For quick test/import
        
        const settings = await SiteSettings.getSettings().catch(() => null);
        const usdToSar = Number(settings?.currencySettings?.usdToSar || 3.75);
        const usdToKrw = Number(settings?.currencySettings?.usdToKrw || 1350);

        const { data: brandsHtml } = await axios.get(BRANDS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $brands = cheerio.load(brandsHtml);
        const results = { brandsCreated: 0, modelsUpdated: 0, partsCreated: 0 };
        const brandsToProcess = [];

        $brands('a.brand-card-link').each((i, el) => {
            const name = $brands(el).find('h3').text().trim();
            const href = $brands(el).attr('href');
            const logo = $brands(el).find('img').attr('src');

            if (name && href) {
                brandsToProcess.push({
                    name,
                    url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                    logo: logo ? (logo.startsWith('http') ? logo : `${BASE_URL}${logo}`) : ''
                });
            }
        });

        const limitBrands = brandsToProcess.slice(0, Math.max(1, maxBrands));
        console.log(`Found ${brandsToProcess.length} brands. Processing ${limitBrands.length} brands...`);

        for (const bData of limitBrands) {
            console.log(`Processing brand: ${bData.name}...`);
            let brand = await Brand.findOne({ key: bData.name.toLowerCase() });
            let logoUrl = '';
            try {
                logoUrl = await downloadAndOptimize(bData.logo, 'brands', { width: 250, height: 250, quality: 75 });
            } catch (err) {
                console.log(`Failed to download logo for ${bData.name}`);
            }

            if (!brand) {
                brand = await Brand.create({
                    name: bData.name,
                    key: bData.name.toLowerCase(),
                    logoUrl: logoUrl || bData.logo,
                    forSpareParts: true,
                    forCars: false,
                    targetShowroom: 'both',
                    models: []
                });
                results.brandsCreated++;
            } else {
                if (!brand.forSpareParts) {
                    brand.forSpareParts = true;
                }
                if (logoUrl && !brand.logoUrl) {
                    brand.logoUrl = logoUrl;
                }
                await brand.save();
            }

            try {
                const { data: modelsHtml } = await axios.get(bData.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                const $models = cheerio.load(modelsHtml);
                const modelsFound = [];
                const modelUrls = [];

                $models('a.text-decoration-none[href*="/brands/"]').each((i, el) => {
                    const mHref = ($models(el).attr('href') || '').trim();
                    if (!mHref) return;
                    const absoluteHref = mHref.startsWith('http') ? mHref : `${BASE_URL}${mHref}`;
                    if (!absoluteHref.startsWith(`${bData.url}/`)) return;

                    const fromText = $models(el).text().trim();
                    const fromUrl = decodeURIComponent(absoluteHref.split('/').pop() || '').trim();
                    const mName = fromText || fromUrl;

                    if (mName && absoluteHref) {
                        modelsFound.push(mName);
                        modelUrls.push(absoluteHref);
                    }
                });

                if (modelsFound.length > 0) {
                    const uniqueModels = [...new Set([...(brand.models || []), ...modelsFound])];
                    brand.models = uniqueModels;
                    await brand.save();
                    results.modelsUpdated++;
                }

                console.log(`  Found ${modelsFound.length} models for ${bData.name}. Processing parts for ${Math.min(modelUrls.length, maxModelsPerBrand)} models...`);

                for (let i = 0; i < Math.min(modelUrls.length, Math.max(1, maxModelsPerBrand)); i++) {
                    const mUrl = modelUrls[i];
                    const modelName = cleanModelName(modelsFound[i]);

                    const { data: partsHtml } = await axios.get(mUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const $parts = cheerio.load(partsHtml);

                    const cards = [];
                    $parts('a.text-decoration-none[href*="/products/"]').each((j, el) => {
                        const linkHref = ($parts(el).attr('href') || '').trim();
                        if (!linkHref) return;

                        const sourceUrl = linkHref.startsWith('http') ? linkHref : `${BASE_URL}${linkHref}`;
                        const pName = $parts(el).text().trim();
                        const cardRoot = $parts(el).closest('div.col-lg-4, div.col-md-6, div.col-6, div.product, div.card, article, li');

                        const pImg = cardRoot.find('img').first().attr('src')
                            || cardRoot.find('img').first().attr('data-src')
                            || cardRoot.find('img').first().attr('data-lazy-src');

                        const cardText = cardRoot.text().replace(/\s+/g, ' ');
                        const pPriceText = cardText.replace(/,/g, '').match(/(\d+)\s*جنيه/);
                        const pPrice = pPriceText ? parseInt(pPriceText[1], 10) : 0;

                        if (!pName) return;
                        cards.push({
                            pName,
                            pImg: normalizeExternalImage(pImg),
                            pPrice,
                            sourceUrl,
                        });
                    });

                    // Only take a few cards per model to not overwhelm the script right now
                    const limitCards = cards.slice(0, 10);
                    for (const card of limitCards) {
                        const existing = await SparePart.findOne({
                            name: card.pName,
                            carMake: brand.name,
                            carModel: modelName
                        });

                        if (existing) continue;

                        const partsMultiplier = Number(settings?.currencySettings?.partsMultiplier || 1.15);
                        const sarPrice = Math.ceil(card.pPrice * 0.12 * partsMultiplier);
                        const usdPrice = Number((sarPrice / usdToSar).toFixed(2));
                        const krwPrice = Math.round(usdPrice * usdToKrw);

                        let localPartImg = '';
                        try {
                            localPartImg = await downloadAndOptimize(card.pImg, 'parts', { width: 500, height: 400, quality: 70 });
                        } catch(e) {}

                        await SparePart.create({
                            name: card.pName,
                            nameAr: translatePartNameToArabic(card.pName) || card.pName,
                            partType: 'General',
                            partTypeAr: 'عام',
                            brand: brand._id,
                            carMake: brand.name,
                            carMakeLogoUrl: brand.logoUrl || '',
                            carModel: modelName,
                            price: sarPrice,
                            basePriceUsd: usdPrice,
                            priceSar: sarPrice,
                            priceUsd: usdPrice,
                            priceKrw: krwPrice,
                            stockQty: 5,
                            inStock: true,
                            images: localPartImg ? [localPartImg] : [],
                            externalUrl: card.sourceUrl,
                            source: 'autospare'
                        });
                        results.partsCreated++;
                        process.stdout.write('.');
                    }
                    console.log(` Imported ${limitCards.length} parts for ${modelName}.`);
                }
            } catch (err) {
                console.error(`Error scraping brand ${bData.name}:`, err.message);
            }
        }
        
        console.log('\nImport Complete!', results);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runImport();
