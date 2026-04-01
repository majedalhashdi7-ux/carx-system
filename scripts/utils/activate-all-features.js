#!/usr/bin/env node

/**
 * سكريبت تفعيل جميع مميزات CAR X
 * يقوم بتفعيل وإعداد جميع المميزات المطلوبة
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function activateAllFeatures() {
    console.log('🚀 بدء تفعيل جميع مميزات CAR X...');
    
    let client;
    try {
        // الاتصال بقاعدة البيانات
        const mongoUri = process.env.MONGO_URI_CARX || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('❌ لم يتم العثور على MONGO_URI في متغيرات البيئة');
        }

        console.log('📡 الاتصال بقاعدة البيانات...');
        client = new MongoClient(mongoUri);
        await client.connect();
        
        const db = client.db();

        // 1. إنشاء حساب الأدمن
        console.log('\n👑 إنشاء حساب الأدمن...');
        await createAdminAccount(db);

        // 2. إعداد إعدادات النظام
        console.log('\n⚙️ إعداد إعدادات النظام...');
        await setupSystemSettings(db);

        // 3. إنشاء فئات السيارات الأساسية
        console.log('\n🚗 إنشاء فئات السيارات...');
        await createCarCategories(db);

        // 4. إنشاء حالات السيارات
        console.log('\n📊 إنشاء حالات السيارات...');
        await createCarStatuses(db);

        // 5. إعداد أنواع قطع الغيار
        console.log('\n🔧 إعداد أنواع قطع الغيار...');
        await createPartCategories(db);

        // 6. إعداد أنواع المزادات
        console.log('\n🏆 إعداد أنواع المزادات...');
        await createAuctionTypes(db);

        console.log('\n🎉 تم تفعيل جميع المميزات بنجاح!');
        console.log('🌐 الموقع جاهز على: https://daood.okigo.net');

    } catch (error) {
        console.error('❌ خطأ في تفعيل المميزات:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
        }
    }
}

async function createAdminAccount(db) {
    const usersCollection = db.collection('users');

    const adminData = {
        name: 'Dawood Al Hash',
        email: 'dawoodalhash@gmail.com',
        password: 'daood@112233',
        role: 'admin',
        phone: '+967781007805',
        city: 'صنعاء',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
            'manage_users',
            'manage_cars',
            'manage_auctions',
            'manage_parts',
            'manage_settings',
            'view_analytics',
            'manage_tenants'
        ]
    };

    const existingAdmin = await usersCollection.findOne({ email: adminData.email });

    if (existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminData.password, 12);
        await usersCollection.updateOne(
            { email: adminData.email },
            {
                $set: {
                    password: hashedPassword,
                    role: 'admin',
                    permissions: adminData.permissions,
                    updatedAt: new Date(),
                    isActive: true
                }
            }
        );
        console.log('✅ تم تحديث حساب الأدمن');
    } else {
        const hashedPassword = await bcrypt.hash(adminData.password, 12);
        adminData.password = hashedPassword;
        await usersCollection.insertOne(adminData);
        console.log('✅ تم إنشاء حساب الأدمن');
    }
}

async function setupSystemSettings(db) {
    const settingsCollection = db.collection('settings');

    const systemSettings = {
        _id: 'system_config',
        siteName: 'CAR X',
        siteNameAr: 'كار إكس',
        description: 'منصة السيارات المتقدمة',
        descriptionEn: 'Advanced Car Platform',
        currency: 'SAR',
        language: 'ar',
        direction: 'rtl',
        theme: {
            primaryColor: '#000000',
            secondaryColor: '#ff0000',
            accentColor: '#cc0000',
            backgroundColor: '#111111',
            textColor: '#ffffff'
        },
        contact: {
            whatsapp: '+967781007805',
            email: 'info@carx-motors.com',
            phone: '+967781007805'
        },
        features: {
            showroom: true,
            auctions: true,
            parts: true,
            authentication: true,
            emailAutoComplete: true,
            socialMedia: true,
            videoBackground: true,
            modernDesign: true
        },
        socialMedia: {
            instagram: 'https://instagram.com/carx',
            facebook: 'https://facebook.com/carx',
            youtube: 'https://youtube.com/carx',
            whatsapp: '+967781007805'
        },
        updatedAt: new Date()
    };

    await settingsCollection.replaceOne(
        { _id: 'system_config' },
        systemSettings,
        { upsert: true }
    );
    console.log('✅ تم إعداد إعدادات النظام');
}

async function createCarCategories(db) {
    const categoriesCollection = db.collection('car_categories');

    const categories = [
        { name: 'سيدان', nameEn: 'Sedan', isActive: true },
        { name: 'SUV', nameEn: 'SUV', isActive: true },
        { name: 'هاتشباك', nameEn: 'Hatchback', isActive: true },
        { name: 'كوبيه', nameEn: 'Coupe', isActive: true },
        { name: 'بيك أب', nameEn: 'Pickup', isActive: true },
        { name: 'رياضية', nameEn: 'Sports', isActive: true },
        { name: 'فاخرة', nameEn: 'Luxury', isActive: true },
        { name: 'كهربائية', nameEn: 'Electric', isActive: true }
    ];

    for (const category of categories) {
        await categoriesCollection.updateOne(
            { nameEn: category.nameEn },
            { $set: { ...category, updatedAt: new Date() } },
            { upsert: true }
        );
    }
    console.log('✅ تم إنشاء فئات السيارات');
}

async function createCarStatuses(db) {
    const statusesCollection = db.collection('car_statuses');

    const statuses = [
        { name: 'متوفر', nameEn: 'available', color: '#10b981', isActive: true },
        { name: 'محجوز', nameEn: 'reserved', color: '#f59e0b', isActive: true },
        { name: 'مباع', nameEn: 'sold', color: '#ef4444', isActive: true },
        { name: 'قيد المراجعة', nameEn: 'pending', color: '#6b7280', isActive: true },
        { name: 'في المزاد', nameEn: 'auction', color: '#8b5cf6', isActive: true }
    ];

    for (const status of statuses) {
        await statusesCollection.updateOne(
            { nameEn: status.nameEn },
            { $set: { ...status, updatedAt: new Date() } },
            { upsert: true }
        );
    }
    console.log('✅ تم إنشاء حالات السيارات');
}

async function createPartCategories(db) {
    const partCategoriesCollection = db.collection('part_categories');

    const partCategories = [
        { name: 'قطع المحرك', nameEn: 'Engine Parts', isActive: true },
        { name: 'قطع الفرامل', nameEn: 'Brake Parts', isActive: true },
        { name: 'قطع التعليق', nameEn: 'Suspension Parts', isActive: true },
        { name: 'قطع الكهرباء', nameEn: 'Electrical Parts', isActive: true },
        { name: 'قطع الهيكل', nameEn: 'Body Parts', isActive: true },
        { name: 'الإطارات', nameEn: 'Tires', isActive: true },
        { name: 'الزيوت والسوائل', nameEn: 'Oils & Fluids', isActive: true },
        { name: 'الإكسسوارات', nameEn: 'Accessories', isActive: true }
    ];

    for (const category of partCategories) {
        await partCategoriesCollection.updateOne(
            { nameEn: category.nameEn },
            { $set: { ...category, updatedAt: new Date() } },
            { upsert: true }
        );
    }
    console.log('✅ تم إعداد أنواع قطع الغيار');
}

async function createAuctionTypes(db) {
    const auctionTypesCollection = db.collection('auction_types');

    const auctionTypes = [
        { name: 'مزاد مباشر', nameEn: 'Live Auction', isActive: true },
        { name: 'مزاد صامت', nameEn: 'Silent Auction', isActive: true },
        { name: 'مزاد سريع', nameEn: 'Quick Auction', isActive: true },
        { name: 'مزاد حصري', nameEn: 'Exclusive Auction', isActive: true }
    ];

    for (const type of auctionTypes) {
        await auctionTypesCollection.updateOne(
            { nameEn: type.nameEn },
            { $set: { ...type, updatedAt: new Date() } },
            { upsert: true }
        );
    }
    console.log('✅ تم إعداد أنواع المزادات');
}

// تشغيل السكريبت
if (require.main === module) {
    activateAllFeatures();
}

module.exports = { activateAllFeatures };