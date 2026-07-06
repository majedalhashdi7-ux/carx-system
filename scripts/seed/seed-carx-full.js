// seed-carx-full.js - تهيئة بيانات CAR X ضمن النظام المتعدد المستأجرين
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد النماذج (Models)
const User = require('../../models/User');
const Car = require('../../models/Car');
const Brand = require('../../models/Brand');

const TENANT_ID = 'carx';

async function seedCarx() {
    console.log('🚀 بدء تهيئة بيانات مستأجر CAR X...');

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error('❌ MONGO_URI غير موجود في ملف .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ تم الاتصال بقاعدة البيانات');

        // 1. إنشاء حساب مدير لـ CAR X
        console.log('👤 إنشاء حساب مدير لـ CAR X...');
        const adminEmail = 'carx-admin@hmcar.com';
        const existingAdmin = await User.findOne({ email: adminEmail, tenantId: TENANT_ID });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            await User.create({
                name: 'مدير نظام كار إكس',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                tenantId: TENANT_ID,
                status: 'active'
            });
            console.log('✅ تم إنشاء حساب المدير: carx-admin@hmcar.com / Admin@123');
        } else {
            console.log('⚠️ حساب المدير موجود مسبقاً');
        }

        // 2. إنشاء ماركات سيارات لـ CAR X
        console.log('🏎️ إضافة ماركات سيارات...');
        const brandsData = [
            { name: 'مرسيدس بنز', nameEn: 'Mercedes-Benz', key: 'mercedes', logoUrl: '/uploads/brands/mercedes.png' },
            { name: 'بي إم دبليو', nameEn: 'BMW', key: 'bmw', logoUrl: '/uploads/brands/bmw.png' },
            { name: 'بورشه', nameEn: 'Porsche', key: 'porsche', logoUrl: '/uploads/brands/porsche.png' }
        ];

        for (const b of brandsData) {
            await Brand.findOneAndUpdate(
                { key: b.key, tenantId: TENANT_ID },
                { ...b, tenantId: TENANT_ID },
                { upsert: true }
            );
        }
        console.log('✅ تم إضافة الماركات');

        // 3. إضافة سيارات عينة لـ CAR X
        console.log('🚗 إضافة سيارات عرض...');
        const carsData = [
            {
                title: 'Mercedes-Benz G-Class AMG 63',
                make: 'Mercedes-Benz',
                model: 'G63',
                year: 2024,
                price: 950000,
                mileage: 0,
                fuelType: 'Petrol',
                transmission: 'Automatic',
                condition: 'excellent',
                description: 'أفخم سيارة دفع رباعي في العالم، بمحرك V8 جبار وتصميم أيقوني.',
                mainImage: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&q=80',
                isActive: true,
                tenantId: TENANT_ID
            },
            {
                title: 'BMW M8 Competition',
                make: 'BMW',
                model: 'M8',
                year: 2023,
                price: 680000,
                mileage: 5000,
                fuelType: 'Petrol',
                transmission: 'Automatic',
                condition: 'excellent',
                description: 'القوة المطلقة من قسم M في بي إم دبليو، أداء رياضي لا يضاهى.',
                mainImage: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80',
                isActive: true,
                tenantId: TENANT_ID
            },
            {
                title: 'Porsche 911 Turbo S',
                make: 'Porsche',
                model: '911',
                year: 2024,
                price: 1100000,
                mileage: 0,
                fuelType: 'Petrol',
                transmission: 'Automatic',
                condition: 'excellent',
                description: 'أسطورة بورش، السيارة الرياضية الأكثر كمالاً في تاريخ الصناعة.',
                mainImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80',
                isActive: true,
                tenantId: TENANT_ID
            }
        ];

        await Car.deleteMany({ tenantId: TENANT_ID }); // تنظيف البيانات القديمة لهذا المستأجر فقط
        await Car.insertMany(carsData);
        console.log('✅ تم إضافة السيارات بنجاح');

        console.log('\n✨ تم الانتهاء من تهيئة CAR X بنجاح!');
        process.exit(0);
    } catch (error) {
        console.error('❌ خطأ أثناء التهيئة:', error);
        process.exit(1);
    }
}

seedCarx();
