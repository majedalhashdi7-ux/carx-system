// [[ARABIC_HEADER]] خدمة تهيئة البيانات الأساسية (SeedService)
// تضمن وجود الأدمن الرئيسي والإعدادات الافتراضية عند تشغيل الموقع لأول مرة

const mongoose = require('mongoose');
const User = require('../models/User');
const SiteSettings = require('../models/SiteSettings');
const Car = require('../models/Car');
const Auction = require('../models/Auction');

class SeedService {
    /**
     * تشغيل كافة عمليات التهيئة
     */
    async runAll() {
        console.log('🌱 Starting database seeding...');
        await this.seedProductionAdmin();
        await this.seedDefaultSettings();
        await this.seedRealData();
        console.log('✅ Database seeding complete.');
    }

    /**
     * تهيئة حساب المشرف الرئيسي
     */
    async seedProductionAdmin() {
        try {
            const adminEmail = process.env.PROD_ADMIN_EMAIL || 'admin@hmcar.com';
            const adminExists = await User.findOne({
                $or: [{ email: adminEmail }, { username: 'admin' }]
            });

            if (!adminExists) {
                if (!process.env.PROD_ADMIN_PASSWORD) {
                    console.warn('⚠️ No PROD_ADMIN_PASSWORD provided. Admin creation skipped.');
                    return;
                }
                const admin = new User({
                    name: process.env.PROD_ADMIN_NAME || 'HM Admin',
                    email: adminEmail,
                    username: 'admin',
                    password: process.env.PROD_ADMIN_PASSWORD,
                    role: 'super_admin',
                    status: 'active',
                    permissions: ['super_admin', 'manage_users', 'manage_settings', 'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics', 'manage_content', 'manage_footer', 'manage_whatsapp', 'manage_concierge']
                });
                await admin.save();
                console.log(`👤 Admin created successfully: ${adminEmail}`);
            } else if (adminExists.status === 'suspended') {
                await User.updateOne({ _id: adminExists._id }, { $set: { status: 'active' } });
                console.log('👤 Admin status restored to active');
            }
        } catch (e) {
            console.error('❌ Admin seed error:', e.message);
        }
    }

    /**
     * تهيئة الإعدادات الافتراضية للموقع
     */
    async seedDefaultSettings() {
        try {
            const existing = await SiteSettings.findOne({ key: 'main' });
            if (!existing || !existing.features || existing.features.length === 0) {
                const defaultFeatures = [
                    { icon: 'Shield', title: 'ضمان شامل', titleEn: 'Full Warranty', desc: 'ضمان شامل على جميع السيارات', descEn: 'Comprehensive warranty on all cars' },
                    { icon: 'Truck', title: 'شحن عالمي', titleEn: 'Global Shipping', desc: 'توصيل إلى أي مكان في العالم', descEn: 'Delivery to anywhere worldwide' },
                    { icon: 'CreditCard', title: 'دفع آمن', titleEn: 'Secure Payment', desc: 'طرق دفع متعددة وآمنة', descEn: 'Multiple secure payment methods' },
                    { icon: 'Award', title: 'فحص شامل', titleEn: 'Full Inspection', desc: 'فحص 200 نقطة للسيارات', descEn: '200-point vehicle inspection' },
                    { icon: 'Zap', title: 'مزايدة سريعة', titleEn: 'Quick Bid', desc: 'نظام مزايدة فوري وسريع', descEn: 'Instant and fast bidding system' },
                    { icon: 'Globe', title: 'سيارات كورية', titleEn: 'Korean Cars', desc: 'أفضل السيارات الكورية', descEn: 'Best Korean vehicles' }
                ];

                await SiteSettings.findOneAndUpdate(
                    { key: 'main' },
                    {
                        $set: {
                            'socialLinks.whatsapp': existing?.socialLinks?.whatsapp || '+967781007805',
                            'contactInfo.phone': existing?.contactInfo?.phone || '+967781007805',
                            'contactInfo.email': existing?.contactInfo?.email || 'info@hmcar.com',
                            'siteInfo.siteName': existing?.siteInfo?.siteName || 'HM CAR',
                            'siteInfo.siteDescription': existing?.siteInfo?.siteDescription || 'منصة مزادات ومبيعات السيارات الفاخرة',
                            'currencySettings.usdToSar': existing?.currencySettings?.usdToSar || 3.75,
                            'currencySettings.usdToKrw': existing?.currencySettings?.usdToKrw || 1350,
                            'features': defaultFeatures,
                            'advertisingSettings': {
                                'showLiveAuction': existing?.advertisingSettings?.showLiveAuction ?? true,
                                'showroomSource': existing?.advertisingSettings?.showroomSource || 'hmcar',
                                'bannerLabel': existing?.advertisingSettings?.bannerLabel || '⚡ عروض حصرية',
                                'bannerLabelEn': existing?.advertisingSettings?.bannerLabelEn || '⚡ EXCLUSIVE DEALS'
                            }
                        }
                    },
                    { upsert: true, new: true }
                );
                console.log('⚙️ Default site settings initialized');
            }
        } catch (e) {
            console.error('❌ Settings seed error:', e.message);
        }
    }

    /**
     * إضافة بيانات تجريبية (سيارات ومزادات)
     */
    async seedRealData() {
        if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_ADMIN !== 'true') return;
        try {
            const count = await Car.countDocuments();
            if (count > 0) return;

            const cars = [
                {
                    title: 'Mercedes-Benz G63 AMG 2024',
                    make: 'Mercedes',
                    model: 'G63',
                    year: 2024,
                    price: 850000,
                    priceSar: 850000,
                    images: ['https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&q=80&w=800'],
                    description: 'The ultimate luxury off-roader.',
                    fuelType: 'Petrol',
                    transmission: 'Automatic',
                    color: 'Metallic Black',
                    condition: 'excellent',
                    isActive: true,
                    listingType: 'store'
                },
                {
                    title: 'Porsche 911 Turbo S 2023',
                    make: 'Porsche',
                    model: '911',
                    year: 2023,
                    price: 920000,
                    priceSar: 920000,
                    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
                    description: 'Master of German engineering.',
                    fuelType: 'Petrol',
                    transmission: 'Automatic',
                    color: 'Silver',
                    condition: 'excellent',
                    isActive: true,
                    listingType: 'auction'
                }
            ];

            const createdCars = await Car.create(cars);
            const porsche = createdCars.find(c => c.model === '911');
            if (porsche) {
                await Auction.create({
                    car: porsche._id,
                    startingPrice: 850000,
                    currentPrice: 850000,
                    startsAt: new Date(),
                    endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    status: 'running',
                    currency: 'SAR'
                });
            }
            console.log('🚙 Sample cars and auctions seeded');
        } catch (e) {
            console.error('❌ Data seed error:', e.message);
        }
    }
}

module.exports = new SeedService();
