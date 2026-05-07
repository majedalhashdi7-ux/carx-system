// [[ARABIC_HEADER]] خدمة تهيئة البيانات الأساسية (SeedService)
// تضمن وجود الأدمن الرئيسي والإعدادات الافتراضية عند تشغيل الموقع لأول مرة
// 
// ⚠️ متوافقة مع Multi-Tenant: تقبل models كمعامل أو تستخدم النماذج الافتراضية

const mongoose = require('mongoose');

// النماذج الافتراضية للاستخدام عند عدم توفير models (للتشغيل الأولي)
let defaultModels = null;

function getDefaultModels() {
    if (!defaultModels) {
        defaultModels = {
            User: require('../models/User'),
            SiteSettings: require('../models/SiteSettings'),
            Car: require('../models/Car'),
            Auction: require('../models/Auction')
        };
    }
    return defaultModels;
}

class SeedService {
    /**
     * تشغيل كافة عمليات التهيئة
     * @param {Object} models - نماذج المعرض (tenantModels) - اختياري للتشغيل الأولي
     * @param {string} tenantId - معرف المعرض للتسجيل
     */
    async runAll(models = null, tenantId = 'default') {
        console.log(`🌱 Starting database seeding for tenant: ${tenantId}...`);
        const modelsToUse = models || getDefaultModels();
        const { connection } = mongoose;
        
        // Try to drop old unique indexes that cause multi-tenant collisions
        try {
            if (connection.db) {
                const dropIndexes = [
                    { coll: 'users', idx: 'username_1' },
                    { coll: 'users', idx: 'email_1' },
                    { coll: 'users', idx: 'phone_1' },
                    { coll: 'sitesettings', idx: 'key_1' },
                    { coll: 'roles', idx: 'name_1' },
                    { coll: 'advancedpermissions', idx: 'name_1' }
                ];
                
                for (const item of dropIndexes) {
                    try {
                        await connection.db.collection(item.coll).dropIndex(item.idx);
                        console.log(`✅ Dropped legacy index ${item.idx} on ${item.coll}`);
                    } catch (e) {
                        // Ignore if index doesn't exist
                    }
                }
            }
        } catch (e) {
            console.warn(`⚠️ Could not drop legacy indexes: ${e.message}`);
        }
        
        await this.seedPermissions(modelsToUse, tenantId);
        await this.seedRoles(modelsToUse, tenantId);
        await this.seedProductionAdmin(modelsToUse, tenantId);
        await this.seedDefaultSettings(modelsToUse, tenantId);
        await this.seedRealData(modelsToUse, tenantId);
        console.log(`✅ Database seeding complete for tenant: ${tenantId}.`);
    }

    /**
     * تهيئة الصلاحيات المتقدمة
     */
    async seedPermissions(models, tenantId) {
        try {
            const { AdvancedPermission, User } = models;
            if (!AdvancedPermission) return;

            const count = await AdvancedPermission.countDocuments();
            if (count > 0) return;

            // الحصول على أي مستخدم أدمن كمرجع
            let systemUser = await User.findOne({ role: 'super_admin' });
            if (!systemUser) {
                // إنشاء مستخدم نظام مؤقت لربط الصلاحيات
                systemUser = { _id: new mongoose.Types.ObjectId() };
            }

            const permissions = [
                { name: 'MANAGE_CARS', description: 'إدارة السيارات والمخزون', category: 'CONTENT_MANAGEMENT', type: 'ADMIN', resources: ['cars'], actions: ['create', 'read', 'update', 'delete', 'import'], isSystem: true, createdBy: systemUser._id },
                { name: 'MANAGE_AUCTIONS', description: 'إدارة المزادات والمزايدات', category: 'CONTENT_MANAGEMENT', type: 'ADMIN', resources: ['auctions', 'bids'], actions: ['create', 'read', 'update', 'delete', 'approve'], isSystem: true, createdBy: systemUser._id },
                { name: 'VIEW_REPORTS', description: 'عرض التقارير والتحليلات', category: 'REPORTS', type: 'READ', resources: ['reports'], actions: ['read', 'export'], isSystem: true, createdBy: systemUser._id },
                { name: 'MANAGE_USERS', description: 'إدارة حسابات المستخدمين والصلاحيات', category: 'USER_MANAGEMENT', type: 'ADMIN', resources: ['users'], actions: ['create', 'read', 'update', 'delete'], isSystem: true, createdBy: systemUser._id },
                { name: 'MANAGE_SYSTEM', description: 'إدارة إعدادات النظام والنسخ الاحتياطي', category: 'SYSTEM_ADMINISTRATION', type: 'ADMIN', resources: ['settings', 'backups'], actions: ['update', 'backup', 'configure'], isSystem: true, createdBy: systemUser._id }
            ];

            await AdvancedPermission.insertMany(permissions.map(p => ({ ...p, tenantId })));
            console.log(`🔑 Permissions seeded for ${tenantId}`);
        } catch (e) {
            console.error(`❌ Permissions seed error:`, e.message);
        }
    }

    /**
     * تهيئة الأدوار المتقدمة
     */
    async seedRoles(models, tenantId) {
        try {
            const { Role, AdvancedPermission, User } = models;
            if (!Role || !AdvancedPermission) return;

            const count = await Role.countDocuments();
            if (count > 0) return;

            const permissions = await AdvancedPermission.find({ tenantId });
            const permMap = permissions.reduce((acc, p) => { acc[p.name] = p._id; return acc; }, {});

            let systemUser = await User.findOne({ role: 'super_admin' });
            if (!systemUser) systemUser = { _id: new mongoose.Types.ObjectId() };

            const roles = [
                {
                    name: 'SUPER_ADMIN_ROLE',
                    displayName: 'مدير النظام الخارق',
                    description: 'صلاحيات كاملة على كل شيء',
                    level: 100,
                    isSystem: true,
                    permissions: Object.values(permMap),
                    createdBy: systemUser._id,
                    tenantId
                },
                {
                    name: 'EDITOR_ROLE',
                    displayName: 'محرر محتوى',
                    description: 'إدارة السيارات والمزادات فقط',
                    level: 50,
                    isSystem: true,
                    permissions: [permMap['MANAGE_CARS'], permMap['MANAGE_AUCTIONS']],
                    createdBy: systemUser._id,
                    tenantId
                }
            ];

            await Role.insertMany(roles);
            console.log(`🎭 Roles seeded for ${tenantId}`);
        } catch (e) {
            console.error(`❌ Roles seed error:`, e.message);
        }
    }

    /**
     * تهيئة حساب المشرف الرئيسي
     * @param {Object} models - نماذج المعرض
     * @param {string} tenantId - معرف المعرض
     */
    async seedProductionAdmin(models = null, tenantId = 'default') {
        try {
            const modelsToUse = models || getDefaultModels();
            const { User, Role } = modelsToUse;
            
            if (!User) {
                console.warn(`⚠️ User model not available for tenant ${tenantId}`);
                return;
            }
            
            const adminEmail = process.env.PROD_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@hmcar.com';
            const adminPassword = process.env.PROD_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'hm@2024admin';
            
            const adminExists = await User.findOne({
                tenantId,
                $or: [{ email: adminEmail }, { username: 'admin' }]
            });

            if (!adminExists) {
                const superRole = Role ? await Role.findOne({ name: 'SUPER_ADMIN_ROLE', tenantId }) : null;
                
                const admin = new User({
                    tenantId: tenantId,
                    name: process.env.PROD_ADMIN_NAME || 'HM Admin',
                    email: adminEmail,
                    username: 'admin',
                    password: adminPassword,
                    role: 'super_admin',
                    advancedRole: superRole ? superRole._id : undefined,
                    status: 'active',
                    permissions: ['super_admin', 'manage_users', 'manage_settings', 'manage_cars', 'manage_parts', 'manage_auctions', 'view_analytics']
                });
                await admin.save();
                console.log(`👤 Admin created successfully for ${tenantId}: ${adminEmail}`);
            }
        } catch (e) {
            console.error(`❌ Admin seed error for ${tenantId}:`, e.message);
        }
    }

    /**
     * تهيئة الإعدادات الافتراضية للموقع
     * @param {Object} models - نماذج المعرض
     * @param {string} tenantId - معرف المعرض
     */
    async seedDefaultSettings(models = null, tenantId = 'default') {
        try {
            const modelsToUse = models || getDefaultModels();
            const { SiteSettings } = modelsToUse;
            
            if (!SiteSettings) return;
            
            const existing = await SiteSettings.findOne({ key: 'main', tenantId });
            if (!existing || !existing.features || existing.features.length === 0) {
                const defaultFeatures = [
                    { icon: 'Shield', title: 'ضمان شامل', titleEn: 'Full Warranty', desc: 'ضمان شامل على جميع السيارات المستوردة', descEn: 'Comprehensive warranty on all imported cars' },
                    { icon: 'Truck', title: 'شحن من كوريا', titleEn: 'Korean Shipping', desc: 'توصيل مباشر من كوريا إلى باب منزلك', descEn: 'Direct delivery from Korea to your door' },
                    { icon: 'Award', title: 'فحص Encar', titleEn: 'Encar Inspection', desc: 'فحص شامل ومعتمد من Encar كوريا', descEn: 'Comprehensive inspection certified by Encar Korea' }
                ];

                await SiteSettings.findOneAndUpdate(
                    { key: 'main', tenantId },
                    {
                        $set: {
                            tenantId: tenantId,
                            'socialLinks.whatsapp': '+967781007805',
                            'contactInfo.phone': '+967781007805',
                            'contactInfo.email': 'info@hmcar.com',
                            'siteInfo.siteName': tenantId === 'carx' ? 'CAR X' : 'HM CAR',
                            'siteInfo.siteDescription': 'نظام متطور لاستيراد السيارات من كوريا والمزادات العالمية',
                            'currencySettings.usdToSar': 3.75,
                            'currencySettings.usdToKrw': 1350,
                            'features': defaultFeatures,
                            'advertisingSettings': {
                                'showLiveAuction': true,
                                'showroomSource': 'hmcar',
                                'bannerLabel': '🔥 عروض كورية حصرية',
                                'bannerLabelEn': '🔥 EXCLUSIVE KOREAN DEALS'
                            }
                        }
                    },
                    { upsert: true, new: true }
                );
                console.log(`⚙️ Default site settings initialized for ${tenantId}`);
            }
        } catch (e) {
            if (e.message.includes('E11000') || e.message.includes('duplicate key')) {
                console.warn(`⚠️ SiteSettings index collision for ${tenantId}, skipping default settings seed.`);
            } else {
                console.error(`❌ Settings seed error for ${tenantId}:`, e.message);
            }
        }
    }

    /**
     * إضافة بيانات تجريبية (سيارات ومزادات)
     */
    async seedRealData(models = null, tenantId = 'default') {
        try {
            const modelsToUse = models || getDefaultModels();
            const { Car, Auction, Brand } = modelsToUse;
            if (!Car) return;

            // فحص بالـ tenantId لضمان استقلالية كل معرض
            const count = await Car.countDocuments({ tenantId });
            if (count > 0) return;

            const cars = [
                {
                    title: 'Hyundai Palisade Calligraphy 2024',
                    make: 'Hyundai', model: 'Palisade', year: 2024,
                    price: 185000, priceSar: 185000,
                    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800'],
                    description: 'هيونداي باليسيد كاليجرافي 2024 - الإصدار الكوري الفاخر، استيراد مباشر من كوريا. مزود بجميع المواصفات الممتازة.',
                    fuelType: 'Diesel', transmission: 'Automatic', color: 'أبيض لؤلؤي',
                    condition: 'excellent', isActive: true, listingType: 'store', mileage: 0
                },
                {
                    title: 'Kia Carnival Hi-Limousine 2023',
                    make: 'Kia', model: 'Carnival', year: 2023,
                    price: 210000, priceSar: 210000,
                    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800'],
                    description: 'كيا كارنيفال هاي ليموزين 2023 - نسخة VIP الفاخرة للعائلات الكبيرة والأعمال التجارية.',
                    fuelType: 'Petrol', transmission: 'Automatic', color: 'أسود لامع',
                    condition: 'excellent', isActive: true, listingType: 'store', mileage: 0
                },
                {
                    title: 'Genesis G80 Sport 2024',
                    make: 'Genesis', model: 'G80', year: 2024,
                    price: 245000, priceSar: 245000,
                    images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=800'],
                    description: 'جينيسيس G80 سبورت 2024 - السيارة الفاخرة الكورية التي تنافس الألمانية بتصميم عصري.',
                    fuelType: 'Petrol', transmission: 'Automatic', color: 'رمادي مدهش',
                    condition: 'excellent', isActive: true, listingType: 'store', mileage: 0
                },
                {
                    title: 'Hyundai Tucson N-Line 2024',
                    make: 'Hyundai', model: 'Tucson', year: 2024,
                    price: 132000, priceSar: 132000,
                    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'],
                    description: 'هيونداي توسان N-Line 2024 - دفع رباعي، مواصفات كاملة، استيراد كوريا.',
                    fuelType: 'Petrol', transmission: 'Automatic', color: 'أزرق معدني',
                    condition: 'excellent', isActive: true, listingType: 'store', mileage: 0
                },
                {
                    title: 'Kia EV6 GT-Line 2023',
                    make: 'Kia', model: 'EV6', year: 2023,
                    price: 195000, priceSar: 195000,
                    images: ['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800'],
                    description: 'كيا EV6 الكهربائية GT-Line - سيارة المستقبل بتصميم ثوري وأداء استثنائي. شحن سريع 800V.',
                    fuelType: 'Electric', transmission: 'Automatic', color: 'أبيض ثلجي',
                    condition: 'excellent', isActive: true, listingType: 'store', mileage: 0
                },
                {
                    title: 'Hyundai Santa Fe Premium 2023',
                    make: 'Hyundai', model: 'Santa Fe', year: 2023,
                    price: 158000, priceSar: 158000,
                    images: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80&w=800'],
                    description: 'هيونداي سانتافي 2023 برييميوم - 7 مقاعد، دفع رباعي كامل، باقة التقنية الكاملة.',
                    fuelType: 'Petrol', transmission: 'Automatic', color: 'بني فاخر',
                    condition: 'good', isActive: true, listingType: 'store', mileage: 25000
                },
            ];

            const createdCars = await Car.create(cars.map(c => ({ ...c, tenantId })));
            
            if (Auction) {
                const kia = createdCars.find(c => c.model === 'Carnival');
                if (kia) {
                    await Auction.create({
                        car: kia._id,
                        startingPrice: 190000,
                        currentPrice: 195000,
                        startsAt: new Date(),
                        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                        status: 'running',
                        currency: 'SAR',
                        tenantId
                    });
                }
            }

            if (Brand) {
                const brands = [
                    { name: 'Hyundai', nameAr: 'هيونداي', logo: 'https://www.car-logos.org/wp-content/uploads/2011/09/hyundai.png' },
                    { name: 'Kia', nameAr: 'كيا', logo: 'https://www.car-logos.org/wp-content/uploads/2011/09/kia.png' },
                    { name: 'Genesis', nameAr: 'جينيسيس', logo: 'https://www.car-logos.org/wp-content/uploads/2015/12/genesis.png' }
                ];
                await Brand.insertMany(brands.map(b => ({ ...b, tenantId })));
            }
            console.log(`🚙 Data seeded for ${tenantId}`);
        } catch (e) {
            console.error(`❌ Data seed error:`, e.message);
        }
    }
}

module.exports = new SeedService();
