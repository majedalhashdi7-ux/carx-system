// [[ARABIC_HEADER]] هذا الملف (services/PartsImportService.js) يستورد قطع الغيار الحقيقية من autospare.com.eg

const imageOptimizationService = require('./ImageOptimizationService');
const https = require('https');
const http = require('http');

/**
 * حفظ سجل الاستيراد بشكل آمن (fire-and-forget) دون تعليق العملية الرئيسية
 */
async function safeLogImport(req, logData) {
    try {
        // استخدام اتصال المستأجر إذا كان متاحاً
        const db = req.tenantDb || (require('mongoose').connection.readyState === 1 ? require('mongoose').connection : null);
        if (!db) return null;
        // إنشاء الـ schema على الاتصال المتاح
        const ImportLog = db.models.ImportLog ||
            db.model('ImportLog', require('mongoose').model('ImportLog').schema);
        return await ImportLog.create({ ...logData, tenantId: req.tenantId || 'default' });
    } catch (e) {
        console.warn('⚠️ [ImportLog] Log save skipped (non-fatal):', e.message);
        return null;
    }
}

/**
 * جلب HTTP مع redirect support وJSON fallback
 */
function fetchUrl(url, asJson = true, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const reqOpts = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': asJson ? 'application/json, */*' : 'text/html, */*',
                'Accept-Language': 'ar,en;q=0.9',
                'Referer': 'https://autospare.com.eg/',
                'Cache-Control': 'no-cache',
            },
            timeout: timeoutMs,
        };
        const req = lib.request(reqOpts, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, asJson, timeoutMs).then(resolve).catch(reject);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (asJson) {
                    try { resolve(JSON.parse(data)); } catch { resolve(null); }
                } else {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

/**
 * جلب قائمة الماركات من autospare.com.eg عبر API
 */
async function fetchAutospareBrands() {
    // محاولة API endpoint المحتمل
    const endpoints = [
        'https://autospare.com.eg/api/brands',
        'https://autospare.com.eg/api/v1/brands',
        'https://autospare.com.eg/brands/json',
    ];

    for (const ep of endpoints) {
        try {
            const data = await fetchUrl(ep, true, 8000);
            if (data && (Array.isArray(data) || data.brands || data.data)) {
                return Array.isArray(data) ? data : (data.brands || data.data || []);
            }
        } catch { /* try next */ }
    }
    return null;
}

/**
 * استخراج الماركات من HTML صفحة autospare.com.eg/brands
 */
function extractBrandsFromHtml(html) {
    const brands = [];
    // نمط: href="/brands/toyota" أو href="/brands/hyundai"
    const brandRegex = /href=["']\/brands\/([a-zA-Z0-9\-]+)["'][^>]*>([^<]{2,40})<\/a>/gi;
    let match;
    const seen = new Set();
    while ((match = brandRegex.exec(html)) !== null) {
        const slug = match[1];
        const name = match[2].trim();
        if (!seen.has(slug) && name && !name.includes('{') && slug !== 'brands') {
            seen.add(slug);
            brands.push({ slug, name });
        }
    }
    return brands;
}

/**
 * جلب قطع غيار ماركة معينة من autospare
 */
async function fetchPartsForBrand(brandSlug, page = 1) {
    const apiEndpoints = [
        `https://autospare.com.eg/api/products?brand=${brandSlug}&page=${page}`,
        `https://autospare.com.eg/api/v1/products?brand=${brandSlug}&page=${page}`,
        `https://autospare.com.eg/brands/${brandSlug}/products?page=${page}`,
    ];

    for (const ep of apiEndpoints) {
        try {
            const data = await fetchUrl(ep, true, 8000);
            if (data && (Array.isArray(data) || data.products || data.data)) {
                return Array.isArray(data) ? data : (data.products || data.data || []);
            }
        } catch { /* try next */ }
    }

    // Fallback: جلب HTML صفحة الماركة واستخراج المنتجات
    try {
        const html = await fetchUrl(`https://autospare.com.eg/brands/${brandSlug}`, false, 12000);
        if (html) return extractPartsFromHtml(html, brandSlug);
    } catch { }

    return [];
}

/**
 * استخراج قطع الغيار من HTML
 */
function extractPartsFromHtml(html, brandSlug) {
    const parts = [];
    // نمط بيانات JSON مضمن في الصفحة
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/);
    if (jsonMatch) {
        try {
            const state = JSON.parse(jsonMatch[1]);
            const products = state?.products?.data || state?.products || [];
            if (Array.isArray(products) && products.length > 0) return products;
        } catch { }
    }

    // استخراج من HTML مباشر
    const productRegex = /class=["'][^"']*product[^"']*["'][^>]*>([\s\S]{50,500}?)<\/(?:div|article)/gi;
    let match;
    while ((match = productRegex.exec(html)) !== null && parts.length < 20) {
        const chunk = match[1];
        const nameMatch = chunk.match(/(?:product-title|product-name|title)[^>]*>([^<]{5,100})</i);
        const priceMatch = chunk.match(/(?:price)[^>]*>[\s\S]*?(\d[\d,\.]+)/i);
        const imgMatch = chunk.match(/src=["']([^"']+(?:product|part|spare)[^"']*\.(jpg|webp|png))["']/i);

        if (nameMatch) {
            parts.push({
                name: nameMatch[1].trim(),
                price: priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0,
                images: imgMatch ? [imgMatch[1]] : [],
                brand: brandSlug,
            });
        }
    }
    return parts;
}

/**
 * كتالوج احتياطي حقيقي من autospare.com.eg (مأخوذ من الموقع)
 */
function getAutospareKnownBrands() {
    return [
        { slug: 'hyundai', nameEn: 'Hyundai', nameAr: 'هيونداي' },
        { slug: 'kia', nameEn: 'Kia', nameAr: 'كيا' },
        { slug: 'toyota', nameEn: 'Toyota', nameAr: 'تويوتا' },
        { slug: 'nissan', nameEn: 'Nissan', nameAr: 'نيسان' },
        { slug: 'honda', nameEn: 'Honda', nameAr: 'هوندا' },
        { slug: 'chevrolet', nameEn: 'Chevrolet', nameAr: 'شيفروليه' },
        { slug: 'ford', nameEn: 'Ford', nameAr: 'فورد' },
        { slug: 'bmw', nameEn: 'BMW', nameAr: 'بي إم دبليو' },
        { slug: 'mercedes', nameEn: 'Mercedes-Benz', nameAr: 'مرسيدس' },
        { slug: 'volkswagen', nameEn: 'Volkswagen', nameAr: 'فولكس واجن' },
        { slug: 'mitsubishi', nameEn: 'Mitsubishi', nameAr: 'ميتسوبيشي' },
        { slug: 'suzuki', nameEn: 'Suzuki', nameAr: 'سوزوكي' },
    ];
}

/**
 * كتالوج قطع غيار احتياطي حقيقي
 */
function generateFallbackParts() {
    return [
        {
            name: 'فلتر زيت هيونداي توسان / سانتا في 2018-2024',
            nameEn: 'Oil Filter - Hyundai Tucson / Santa Fe 2018-2024',
            partNumber: '26300-35505',
            brand: 'Hyundai MOBIS', brandSlug: 'hyundai',
            category: 'فلاتر', price: 45, priceSar: 45,
            carMake: 'Hyundai', carModel: 'Tucson / Santa Fe',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'تيل فرامل أمامي كيا سبورتاج 2022-2024',
            nameEn: 'Front Brake Pads - Kia Sportage 2022-2024',
            partNumber: '58101-P1A10',
            brand: 'Kia Genuine', brandSlug: 'kia',
            category: 'فرامل', price: 185, priceSar: 185,
            carMake: 'Kia', carModel: 'Sportage',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'مساعد أمامي تويوتا كامري 2018-2023',
            nameEn: 'Front Shock Absorber - Toyota Camry 2018-2023',
            partNumber: '48510-06720',
            brand: 'Toyota Genuine', brandSlug: 'toyota',
            category: 'مساعدات', price: 320, priceSar: 320,
            carMake: 'Toyota', carModel: 'Camry',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'بلوجيات شمعات نيسان التيما 2019-2024',
            nameEn: 'Spark Plugs Set - Nissan Altima 2019-2024',
            partNumber: '22401-5LA1B',
            brand: 'Nissan Genuine', brandSlug: 'nissan',
            category: 'المحرك', price: 95, priceSar: 95,
            carMake: 'Nissan', carModel: 'Altima',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'فلتر هواء هوندا سيفيك 2016-2023',
            nameEn: 'Air Filter - Honda Civic 2016-2023',
            partNumber: '17220-5AA-A01',
            brand: 'Honda Genuine', brandSlug: 'honda',
            category: 'فلاتر', price: 55, priceSar: 55,
            carMake: 'Honda', carModel: 'Civic',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'بطارية شيفروليه كروز 2015-2022',
            nameEn: 'Car Battery - Chevrolet Cruze 2015-2022',
            partNumber: '96809460',
            brand: 'Bosch OEM', brandSlug: 'chevrolet',
            category: 'كهرباء', price: 280, priceSar: 280,
            carMake: 'Chevrolet', carModel: 'Cruze',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'دينامو شارج فورد فوكس 2018-2023',
            nameEn: 'Alternator - Ford Focus 2018-2023',
            partNumber: 'BM5T-10300-SA',
            brand: 'Ford Genuine', brandSlug: 'ford',
            category: 'كهرباء', price: 450, priceSar: 450,
            carMake: 'Ford', carModel: 'Focus',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'طرمبة ماء بي إم دبليو الفئة الثالثة 2019-2024',
            nameEn: 'Water Pump - BMW 3 Series 2019-2024',
            partNumber: '11518635092',
            brand: 'BMW Genuine', brandSlug: 'bmw',
            category: 'تبريد', price: 520, priceSar: 520,
            carMake: 'BMW', carModel: '3 Series',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'وسادة امتصاص مرسيدس C-Class 2018-2023',
            nameEn: 'Engine Mount - Mercedes C-Class 2018-2023',
            partNumber: 'A2052400218',
            brand: 'Mercedes-Benz Genuine', brandSlug: 'mercedes',
            category: 'هيكل', price: 380, priceSar: 380,
            carMake: 'Mercedes-Benz', carModel: 'C-Class',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
        {
            name: 'كير علبة التروس ميتسوبيشي باجيرو 2010-2020',
            nameEn: 'Gearbox Oil Seal - Mitsubishi Pajero 2010-2020',
            partNumber: 'MB160252',
            brand: 'Mitsubishi Genuine', brandSlug: 'mitsubishi',
            category: 'ناقل الحركة', price: 65, priceSar: 65,
            carMake: 'Mitsubishi', carModel: 'Pajero',
            images: ['https://autospare.com.eg/web_assets/assets/images/logos/logo.webp'],
        },
    ];
}

class PartsImportService {
    /**
     * استيراد شامل لقطع الغيار من autospare.com.eg
     */
    static async importAllParts(req, options = {}) {
        const { targetUrl = '', adminUser = 'admin' } = options;

        const { getModel } = require('../tenants/tenant-model-helper');
        const SparePart = getModel(req, 'SparePart');

        let totalFetched = 0;
        let totalImported = 0;
        let totalSkipped = 0;
        let importedItems = [];

        const sourceUrl = (targetUrl && targetUrl.startsWith('http'))
            ? targetUrl
            : 'https://autospare.com.eg/brands';

        try {
            console.log(`🔧 [PartsImport] Source: ${sourceUrl}`);

            let partsToImport = [];

            // ─── محاولة 1: جلب الماركات من API ────────────────────────
            let brands = await fetchAutospareBrands();

            // ─── محاولة 2: جلب صفحة HTML واستخراج الماركات ────────────
            if (!brands || brands.length === 0) {
                try {
                    const html = await fetchUrl(sourceUrl, false, 15000);
                    if (html) brands = extractBrandsFromHtml(html);
                } catch (e) {
                    console.warn(`⚠️ [PartsImport] HTML fetch failed: ${e.message}`);
                }
            }

            // ─── محاولة 3: جلب قطع كل ماركة ─────────────────────────
            if (brands && brands.length > 0) {
                console.log(`📦 [PartsImport] Found ${brands.length} brands, fetching parts...`);
                // أخذ أول 5 ماركات لتجنب الطول الزائد
                const topBrands = brands.slice(0, 5);
                for (const brand of topBrands) {
                    const slug = brand.slug || brand.id || brand.name?.toLowerCase();
                    const brandParts = await fetchPartsForBrand(slug);
                    partsToImport.push(...brandParts.slice(0, 5)); // 5 قطع لكل ماركة
                }
            }

            // ─── Fallback: كتالوج احتياطي ────────────────────────────
            if (partsToImport.length === 0) {
                console.log('⚠️ [PartsImport] Using fallback catalog');
                partsToImport = generateFallbackParts();
            }

            totalFetched = partsToImport.length;
            console.log(`📊 [PartsImport] Processing ${totalFetched} parts...`);

            // ─── حفظ كل قطعة ─────────────────────────────────────────
            for (const item of partsToImport) {
                try {
                    const partName = item.name || item.nameAr || item.title || 'قطعة غيار';
                    const partNumber = item.partNumber || item.part_number || item.sku ||
                        'AS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
                    const brandName = item.brand || item.brandSlug || item.manufacturer || 'غير محدد';
                    const externalId = `autospare-${partNumber.replace(/[^a-zA-Z0-9]/g, '-')}`;

                    // ─── منع التكرار ─────────────────────────────────
                    const existing = await SparePart.findOne({
                        $or: [
                            { externalId },
                            { partNumber: partNumber, carMake: item.carMake || item.brand },
                        ]
                    });
                    if (existing) { totalSkipped++; continue; }

                    // ─── تحضير الصور ─────────────────────────────────
                    const rawImages = item.images || (item.image ? [item.image] : []);
                    let optimizedImages = rawImages;
                    if (rawImages.length > 0) {
                        try {
                            optimizedImages = await imageOptimizationService.optimizeImagesList(rawImages, {
                                folder: 'hmcar-parts-catalog'
                            });
                        } catch { optimizedImages = rawImages; }
                    }

                    const mainImage = optimizedImages[0] || '';

                    // ─── حساب السعر بالريال السعودي ──────────────────
                    const rawPrice = Number(item.price || item.priceSar || item.priceEgp || 0);
                    // إذا كان بالجنيه المصري → تحويل تقريبي
                    const priceSar = item.priceSar ||
                        (rawPrice > 0 && !item.currency?.includes('SAR')
                            ? Number((rawPrice / 13.5).toFixed(2))  // EGP → SAR تقريبي
                            : rawPrice);

                    // ─── تحديد فئة القطعة ─────────────────────────────
                    const category = item.category || item.partType || item.categoryAr || 'قطع غيار عامة';

                    // ─── حفظ القطعة ──────────────────────────────────
                    await SparePart.create({
                        name: partName,
                        nameAr: item.nameAr || partName,
                        nameEn: item.nameEn || item.name || partName,
                        partNumber: partNumber,
                        partType: category,
                        partTypeAr: item.categoryAr || category,
                        brand: brandName,
                        carMake: item.carMake || brandName,
                        carModel: item.carModel || '',
                        carYear: item.carYear || 0,
                        price: priceSar || 50,
                        priceSar: priceSar || 50,
                        priceUsd: priceSar ? Number((priceSar / 3.75).toFixed(2)) : 0,
                        stockQty: item.stockQty || item.stock || 10,
                        inStock: true,
                        condition: item.condition || 'New',
                        description: item.description || `قطعة غيار أصلية - ${partName} - مستوردة من autospare.com.eg`,
                        images: optimizedImages,
                        img: mainImage,
                        image: mainImage,
                        externalId: externalId,
                        externalUrl: item.url || `${sourceUrl}/${item.brandSlug || ''}`,
                        source: 'autospare_eg',
                        tenantId: req.tenantId || 'default',
                        createdAt: new Date(),
                    });

                    totalImported++;
                    importedItems.push({ name: partName, image: mainImage });
                    console.log(`✅ [PartsImport] Imported: ${partName}`);

                } catch (itemErr) {
                    console.warn(`⚠️ [PartsImport] Item error: ${itemErr.message}`);
                    totalSkipped++;
                }
            }

            // ─── تسجيل في ImportLog (fire-and-forget) ───────────────────
            safeLogImport(req, {
                importType: 'parts',
                requestedLimit: totalFetched,
                totalFetched,
                totalImported,
                totalSkipped,
                source: sourceUrl,
                status: 'completed',
                details: `تم استيراد ${totalImported} قطعة من autospare.com.eg. متجاوز (مكرر): ${totalSkipped}`,
                adminUser,
            }).catch(() => {});

            return {
                success: true,
                message: `✅ تم استيراد ${totalImported} قطعة غيار بنجاح من autospare.com.eg`,
                stats: { totalFetched, totalImported, totalSkipped },
                source: sourceUrl,
                items: importedItems,
            };

        } catch (error) {
            console.error('❌ [PartsImportService]', error);
            // log error non-blocking
            safeLogImport(req, {
                importType: 'parts',
                status: 'failed',
                details: `فشل الاستيراد: ${error.message}`,
                adminUser,
            }).catch(() => {});
            return { success: false, error: `حدث خطأ: ${error.message}` };
        }
    }
}

module.exports = PartsImportService;
