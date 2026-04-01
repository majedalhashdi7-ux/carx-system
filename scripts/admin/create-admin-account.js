#!/usr/bin/env node

/**
 * سكريبت إنشاء حساب الأدمن لـ CAR X
 * يقوم بإنشاء حساب الأدمن المطلوب: dawoodalhash@gmail.com
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminAccount() {
    console.log('🚀 بدء إنشاء حساب الأدمن...');
    
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
        const usersCollection = db.collection('users');

        // بيانات الأدمن المطلوبة
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

        // التحقق من وجود الحساب مسبقاً
        const existingAdmin = await usersCollection.findOne({ 
            email: adminData.email 
        });

        if (existingAdmin) {
            console.log('⚠️  حساب الأدمن موجود مسبقاً');
            
            // تحديث كلمة المرور والصلاحيات
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
            
            console.log('✅ تم تحديث حساب الأدمن بنجاح');
        } else {
            // إنشاء حساب جديد
            const hashedPassword = await bcrypt.hash(adminData.password, 12);
            adminData.password = hashedPassword;

            const result = await usersCollection.insertOne(adminData);
            
            if (result.insertedId) {
                console.log('✅ تم إنشاء حساب الأدمن بنجاح');
            } else {
                throw new Error('❌ فشل في إنشاء حساب الأدمن');
            }
        }

        // عرض تفاصيل الحساب
        console.log('\n📋 تفاصيل حساب الأدمن:');
        console.log('👤 الاسم:', adminData.name);
        console.log('📧 الإيميل:', adminData.email);
        console.log('🔑 كلمة المرور:', 'daood@112233');
        console.log('👑 الدور:', adminData.role);
        console.log('📱 الهاتف:', adminData.phone);
        console.log('🏙️  المدينة:', adminData.city);
        
        console.log('\n🎉 تم إنشاء/تحديث حساب الأدمن بنجاح!');
        console.log('🌐 يمكنك الآن تسجيل الدخول على: https://daood.okigo.net');

    } catch (error) {
        console.error('❌ خطأ في إنشاء حساب الأدمن:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 تم إغلاق الاتصال بقاعدة البيانات');
        }
    }
}

// تشغيل السكريبت
if (require.main === module) {
    createAdminAccount();
}

module.exports = { createAdminAccount };