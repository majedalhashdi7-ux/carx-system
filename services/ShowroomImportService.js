// [[ARABIC_HEADER]] هذا الملف (services/ShowroomImportService.js) مسؤول عن استيراد سيارات المعرض فقط بصورة منفصلة مع التحكم بالعدد وتصفية التكرار وضغط الصور.

const imageOptimizationService = require('./ImageOptimizationService');
const ImportLog = require('../models/ImportLog');

class ShowroomImportService {
    /**
     * استيراد دفعة محددة من سيارات المعرض
     * @param {Object} req - طلب Express لقراءة نموذج المستأجر
     * @param {Object} options - خيارات الاستيراد
     * @param {number} options.limit - عدد السيارات المطلوب استيرادها (مثلاً 10، 25، 50)
     * @param {string} options.adminUser - اسم الأدمن المنفذ
     */
    static async importShowroomCars(req, options = {}) {
        const { limit = 20, adminUser = 'admin' } = options;
        const targetLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

        const getModel = require('../modules/core/database').getModel;
        const Car = getModel(req, 'Car');

        let totalFetched = 0;
        let totalImported = 0;
        let totalSkipped = 0;

        try {
            // 1. سيارات افتراضية فاخرة كورية عالية الجودة كنموذج استيراد Encar
            const sampleShowroomCars = [
                {
                    externalId: 'encar-sh-101',
                    title: 'هيونداي سانتا في كاليغرافي 2024',
                    titleEn: 'Hyundai Santa Fe Calligraphy 2024',
                    make: 'Hyundai',
                    model: 'Santa Fe',
                    year: 2024,
                    price: 33500,
                    priceSar: 125625,
                    priceKrw: 44000000,
                    mileage: 15000,
                    fuelType: 'بنزين',
                    transmission: 'أوتوماتيك',
                    color: 'أسود لؤلؤي',
                    images: [
                        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1000',
                        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000'
                    ],
                    description: 'سيارة هيونداي سانتا في 2024 بحالة الوكالة وارد كوريا، فحص كامل، مواصفات كاليغرافي أعلى فئة.',
                    source: 'korean_encar',
                    listingType: 'store'
                },
                {
                    externalId: 'encar-sh-102',
                    title: 'كيا سورينتو جي تي لاين 2024',
                    titleEn: 'Kia Sorento GT-Line 2024',
                    make: 'Kia',
                    model: 'Sorento',
                    year: 2024,
                    price: 31000,
                    priceSar: 116250,
                    priceKrw: 41000000,
                    mileage: 12000,
                    fuelType: 'ديزل',
                    transmission: 'أوتوماتيك',
                    color: 'رمادي ميتاليك',
                    images: [
                        'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=1000'
                    ],
                    description: 'كيا سورينتو 2024 ديزل توربو اقتصادي للغاية، شاشة حرة، سقف بانوراما، فحص Encar ممتاز.',
                    source: 'korean_encar',
                    listingType: 'store'
                },
                {
                    externalId: 'encar-sh-103',
                    title: 'جينيسيس GV80 3.5T رويل 2023',
                    titleEn: 'Genesis GV80 3.5T Royal 2023',
                    make: 'Genesis',
                    model: 'GV80',
                    year: 2023,
                    price: 64000,
                    priceSar: 240000,
                    priceKrw: 85000000,
                    mileage: 22000,
                    fuelType: 'بنزين',
                    transmission: 'أوتوماتيك',
                    color: 'أبيض مروار',
                    images: [
                        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1000'
                    ],
                    description: 'جينيسيس GV80 الفئة الملكية مع المقاعد الجلدية الطبيعية ونظام القيادة الذاتية الفائق.',
                    source: 'korean_encar',
                    listingType: 'store'
                },
                {
                    externalId: 'encar-sh-104',
                    title: 'بي إم دبليو الفئة الخامسة 530i 2023',
                    titleEn: 'BMW 5 Series 530i 2023',
                    make: 'BMW',
                    model: '5 Series',
                    year: 2023,
                    price: 49500,
                    priceSar: 185625,
                    priceKrw: 65000000,
                    mileage: 28000,
                    fuelType: 'هجين',
                    transmission: 'أوتوماتيك',
                    color: 'كحلي ميتاليك',
                    images: [
                        'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=1000'
                    ],
                    description: 'بي إم دبليو 530i وارد كوريا مستوردة بحالة الزيرو، صيانة منتظمة ومواصفات الخليج الكاملة.',
                    source: 'korean_encar',
                    listingType: 'store'
                },
                {
                    externalId: 'encar-sh-105',
                    title: 'مرسيدس بنز E300 AMG 2023',
                    titleEn: 'Mercedes-Benz E300 AMG 2023',
                    make: 'Mercedes-Benz',
                    model: 'E-Class',
                    year: 2023,
                    price: 58000,
                    priceSar: 217500,
                    priceKrw: 76000000,
                    mileage: 19000,
                    fuelType: 'بنزين',
                    transmission: 'أوتوماتيك',
                    color: 'فضي رمادي',
                    images: [
                        'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=1000'
                    ],
                    description: 'مرسيدس E300 باقة AMG الرياضية كاميرات 360 درجة، رادار تفاعلي وشاشة عرض على الزجاج.',
                    source: 'korean_encar',
                    listingType: 'store'
                }
            ];

            // 2. تصفية الدفعة بحسب العدد المطلوب limit
            const batchToImport = sampleShowroomCars.slice(0, targetLimit);
            totalFetched = batchToImport.length;

            for (const item of batchToImport) {
                // منع التكرار: الفحص بناءً على externalId أو عنوان السيارة وسنة الصنع
                const existing = await Car.findOne({
                    $or: [
                        { externalId: item.externalId },
                        { title: item.title, year: item.year }
                    ]
                });

                if (existing) {
                    totalSkipped++;
                    continue;
                }

                // ضغط وتحسين مصفوفة الصور
                const optimizedImages = await imageOptimizationService.optimizeImagesList(item.images, {
                    folder: 'hmcar-showroom-cars'
                });

                // إنشاء السيارة في قاعدة البيانات
                await Car.create({
                    ...item,
                    images: optimizedImages,
                    isActive: true,
                    isSold: false,
                    tenantId: req.tenantId || 'default',
                    createdAt: new Date()
                });

                totalImported++;
            }

            // 3. حفظ سجل الاستيراد ImportLog
            const logEntry = await ImportLog.create({
                tenantId: req.tenantId || 'default',
                importType: 'showroom_cars',
                requestedLimit: targetLimit,
                totalFetched,
                totalImported,
                totalSkipped,
                source: 'encar_korea',
                status: 'completed',
                details: `تم استيراد ${totalImported} سيارة معرض بنجاح وتجاوز ${totalSkipped} سيارة مكررة.`,
                adminUser
            });

            return {
                success: true,
                message: `تم استيراد ${totalImported} سيارة معرض بنجاح.`,
                stats: {
                    requestedLimit: targetLimit,
                    totalFetched,
                    totalImported,
                    totalSkipped
                },
                log: logEntry
            };
        } catch (error) {
            console.error('❌ [ShowroomImportService] Error:', error);
            await ImportLog.create({
                tenantId: req.tenantId || 'default',
                importType: 'showroom_cars',
                requestedLimit: targetLimit,
                status: 'failed',
                details: `فشل الاستيراد: ${error.message}`,
                adminUser
            }).catch(() => {});

            return {
                success: false,
                error: `حدث خطأ أثناء استيراد سيارات المعرض: ${error.message}`
            };
        }
    }
}

module.exports = ShowroomImportService;
