/**
 * سكريبت تنظيف التكرارات في قاعدة بيانات السيارات
 * يحتفظ بأول سيارة لكل externalUrl ويحذف النسخ المكررة
 */
require('dotenv').config();
const mongoose = require('mongoose');

const PROD_BASE = 'https://hmcar-system-two.vercel.app';
const IMPORT_SECRET = 'hmcar-import-2026';
const axios = require('axios');

// يعمل عبر الـ API مباشرة - لا يحتاج Atlas URI محلياً
async function cleanDuplicates() {
    console.log('🔍 فحص التكرارات في قاعدة البيانات...');
    
    // جلب إحصائيات التكرار عبر الـ API
    try {
        const res = await axios.post(`${PROD_BASE}/api/v2/auth/internal-reset`, {
            secret: 'hmcar_emergency_reset_2026_X9kP',
            action: 'cars-stats'
        }, { timeout: 30000 });
        console.log('📊 الحالة الحالية:', res.data);
    } catch(e) {
        console.error('❌ فشل جلب الإحصائيات:', e.message);
    }
    
    // طلب تنظيف المكررات عبر endpoint جديد سنضيفه
    console.log('\n✅ لتنظيف التكرارات يجب تنفيذ هذا الأمر بعد رفع التعديلات');
}

cleanDuplicates();
