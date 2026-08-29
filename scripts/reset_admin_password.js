#!/usr/bin/env node
/**
 * إعادة تعيين كلمة مرور الأدمن - HM CAR Production
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// استخدام MONGO_URI_HMCAR إذا كانت موجودة (Production Atlas)
const MONGO_URI = process.env.MONGO_URI_HMCAR || process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('URI starts with:', MONGO_URI.substring(0, 30) + '...');

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

const TARGET_EMAIL = 'dawoodalhash@gmail.com';
const NEW_PASSWORD = 'daood@112233';

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected!\n');

        // ابحث عن المستخدم
        const user = await User.findOne({ email: TARGET_EMAIL }).lean();
        if (!user) {
            console.log('❌ User not found:', TARGET_EMAIL);
            
            // اعرض جميع المستخدمين
            const allUsers = await User.find({}, { email: 1, role: 1, tenantId: 1 }).lean();
            console.log('All users in DB:');
            allUsers.forEach(u => console.log(`  - ${u.email} [${u.role}] tenant:${u.tenantId}`));
            
            await mongoose.disconnect();
            return;
        }

        console.log(`Found user: ${user.email} | Role: ${user.role} | Tenant: ${user.tenantId}`);

        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12);
        
        // تحديث كلمة المرور
        await User.updateOne(
            { email: TARGET_EMAIL },
            { 
                $set: { 
                    password: hashedPassword,
                    isActive: true,
                    isVerified: true,
                    isBanned: false
                } 
            }
        );

        console.log('\n✅ Password reset successfully!');
        console.log(`   Email: ${TARGET_EMAIL}`);
        console.log(`   New Password: ${NEW_PASSWORD}`);
        
        // تحقق من الـ hash
        const updated = await User.findOne({ email: TARGET_EMAIL }).lean();
        const isValid = await bcrypt.compare(NEW_PASSWORD, updated.password);
        console.log(`   Verification: ${isValid ? '✅ Password works!' : '❌ Failed!'}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
