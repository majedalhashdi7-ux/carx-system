#!/usr/bin/env node
/**
 * حذف جميع السيارات الوهمية (hm_local) وإبقاء الحقيقية فقط (encar_korea)
 * هذا السكريبت آمن - يحتفظ بالسيارات الحقيقية فقط
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CarSchema = new mongoose.Schema({}, { strict: false });
const Car = mongoose.model('Car', CarSchema);

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // أحصِ السيارات قبل الحذف
        const totalBefore = await Car.countDocuments();
        const hmcarBefore = await Car.countDocuments({ tenantId: 'hmcar' });
        const realCars = await Car.countDocuments({ source: 'encar_korea' });
        const fakeCars = await Car.countDocuments({ source: 'hm_local' });
        
        console.log('=== Before Cleanup ===');
        console.log(`Total: ${totalBefore}`);
        console.log(`HM CAR tenant: ${hmcarBefore}`);
        console.log(`Real (encar_korea): ${realCars}`);
        console.log(`Fake (hm_local): ${fakeCars}`);
        
        if (fakeCars === 0) {
            console.log('\n✅ No fake cars to delete!');
            await mongoose.disconnect();
            return;
        }

        // عرض السيارات الوهمية للمراجعة قبل الحذف
        const fakeList = await Car.find({ source: 'hm_local' }, { title: 1, tenantId: 1 }).lean();
        console.log('\n=== Fake Cars to Delete ===');
        fakeList.forEach((c, i) => {
            console.log(`${i+1}. [${c.tenantId}] ${c.title?.substring(0, 60)}`);
        });
        
        // حذف السيارات الوهمية
        console.log('\n🗑️ Deleting fake cars (source: hm_local)...');
        const deleted = await Car.deleteMany({ source: 'hm_local' });
        console.log(`✅ Deleted ${deleted.deletedCount} fake cars\n`);
        
        // إحصائيات بعد الحذف
        const totalAfter = await Car.countDocuments();
        const hmcarAfter = await Car.countDocuments({ tenantId: 'hmcar' });
        const activeAfter = await Car.countDocuments({ tenantId: 'hmcar', isActive: { $ne: false }, isSold: { $ne: true } });
        
        console.log('=== After Cleanup ===');
        console.log(`Total: ${totalAfter}`);
        console.log(`HM CAR tenant: ${hmcarAfter}`);
        console.log(`Active in HM CAR: ${activeAfter}`);
        
        // عيّنة من السيارات الحقيقية
        const samples = await Car.find({ tenantId: 'hmcar', source: 'encar_korea' })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
        
        console.log('\n=== Sample Real Cars ===');
        samples.forEach((c, i) => {
            console.log(`${i+1}. ✅ ${c.title}`);
            console.log(`   Images: ${c.images?.length || 0}`);
        });
        
        await mongoose.disconnect();
        console.log('\n🎉 Cleanup complete!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
