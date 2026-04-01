#!/usr/bin/env node

/**
 * إعادة نشر جميع المشاريع
 */

const { execSync } = require('child_process');

console.log('🚀 بدء إعادة النشر...');

try {
    // نشر HM CAR
    console.log('📦 نشر HM CAR...');
    process.chdir('client-app');
    execSync('vercel --prod', { stdio: 'inherit' });
    process.chdir('..');
    
    // نشر CAR X
    console.log('📦 نشر CAR X...');
    process.chdir('carx-system');
    execSync('vercel --prod', { stdio: 'inherit' });
    process.chdir('..');
    
    console.log('🎉 تم النشر بنجاح!');
    
} catch (error) {
    console.error('❌ خطأ في النشر:', error.message);
}
