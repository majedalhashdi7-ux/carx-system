#!/usr/bin/env node

/**
 * التحقق النهائي من جاهزية النظام للنشر
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 التحقق النهائي من جاهزية النظام...\n');

const checks = {
    passed: [],
    failed: [],
    warnings: []
};

// 1. التحقق من ملفات البيئة
function checkEnvFiles() {
    console.log('📝 التحقق من ملفات البيئة...');
    
    const envFiles = [
        { path: '.env', name: 'Main .env' },
        { path: 'client-app/.env.local', name: 'HM CAR .env.local' },
        { path: 'carx-system/.env.local', name: 'CAR X .env.local' }
    ];
    
    envFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf8');
            
            // التحقق من وجود MONGO_URI
            if (content.includes('MONGO_URI=mongodb+srv://')) {
                // التحقق من قاعدة البيانات المنفصلة
                if (file.path.includes('client-app') && content.includes('hmcar_production')) {
                    checks.passed.push(`✅ ${file.name}: قاعدة بيانات HM CAR منفصلة`);
                } else if (file.path.includes('carx-system') && content.includes('carx_production')) {
                    checks.passed.push(`✅ ${file.name}: قاعدة بيانات CAR X منفصلة`);
                } else if (file.path === '.env') {
                    if (content.includes('hmcar_production') && content.includes('carx_production')) {
                        checks.passed.push(`✅ ${file.name}: قاعدتا بيانات منفصلتان`);
                    } else {
                        checks.warnings.push(`⚠️ ${file.name}: قد لا تحتوي على قواعد بيانات منفصلة`);
                    }
                }
            } else {
                checks.failed.push(`❌ ${file.name}: MONGO_URI غير موجود أو غير صحيح`);
            }
            
            // التحقق من عدم وجود placeholders
            if (content.includes('your-username') || content.includes('your-password')) {
                checks.failed.push(`❌ ${file.name}: يحتوي على placeholders`);
            }
            
            // التحقق من NEXTAUTH_SECRET
            if (!content.includes('NEXTAUTH_SECRET=')) {
                checks.failed.push(`❌ ${file.name}: NEXTAUTH_SECRET مفقود`);
            } else {
                checks.passed.push(`✅ ${file.name}: NEXTAUTH_SECRET موجود`);
            }
            
        } else {
            checks.failed.push(`❌ ${file.name}: الملف غير موجود`);
        }
    });
}

// 2. التحقق من مجلدات البناء
function checkBuildFolders() {
    console.log('\n🏗️ التحقق من مجلدات البناء...');
    
    const buildFolders = [
        { path: 'client-app/.next', name: 'HM CAR Build' },
        { path: 'carx-system/.next', name: 'CAR X Build' }
    ];
    
    buildFolders.forEach(folder => {
        if (fs.existsSync(folder.path)) {
            checks.passed.push(`✅ ${folder.name}: موجود`);
        } else {
            checks.warnings.push(`⚠️ ${folder.name}: غير موجود (سيتم البناء على Vercel)`);
        }
    });
}

// 3. التحقق من package.json
function checkPackageJson() {
    console.log('\n📦 التحقق من package.json...');
    
    const packages = [
        { path: 'client-app/package.json', name: 'HM CAR' },
        { path: 'carx-system/package.json', name: 'CAR X' }
    ];
    
    packages.forEach(pkg => {
        if (fs.existsSync(pkg.path)) {
            const content = JSON.parse(fs.readFileSync(pkg.path, 'utf8'));
            
            if (content.scripts && content.scripts.build) {
                checks.passed.push(`✅ ${pkg.name}: build script موجود`);
            } else {
                checks.failed.push(`❌ ${pkg.name}: build script مفقود`);
            }
            
            if (content.dependencies && content.dependencies.next) {
                checks.passed.push(`✅ ${pkg.name}: Next.js مثبت`);
            } else {
                checks.failed.push(`❌ ${pkg.name}: Next.js غير مثبت`);
            }
        } else {
            checks.failed.push(`❌ ${pkg.name}: package.json غير موجود`);
        }
    });
}

// 4. التحقق من tenants.json
function checkTenantsJson() {
    console.log('\n🏢 التحقق من tenants.json...');
    
    if (fs.existsSync('tenants/tenants.json')) {
        const content = JSON.parse(fs.readFileSync('tenants/tenants.json', 'utf8'));
        
        if (content.tenants) {
            const tenantNames = Object.keys(content.tenants);
            
            if (tenantNames.includes('hmcar')) {
                checks.passed.push('✅ HM CAR موجود في tenants.json');
            } else {
                checks.failed.push('❌ HM CAR غير موجود في tenants.json');
            }
            
            if (tenantNames.includes('carx')) {
                checks.passed.push('✅ CAR X موجود في tenants.json');
            } else {
                checks.failed.push('❌ CAR X غير موجود في tenants.json');
            }
            
            // التحقق من عدم وجود معرضات وهمية
            const fakeTenants = ['alwaha', 'luxury', 'stars'];
            const hasFakeTenants = tenantNames.some(name => fakeTenants.includes(name));
            
            if (hasFakeTenants) {
                checks.warnings.push('⚠️ يوجد معرضات وهمية في tenants.json');
            } else {
                checks.passed.push('✅ لا يوجد معرضات وهمية');
            }
        }
    } else {
        checks.warnings.push('⚠️ tenants.json غير موجود');
    }
}

// 5. التحقق من next.config.js
function checkNextConfig() {
    console.log('\n⚙️ التحقق من next.config.js...');
    
    const configs = [
        { path: 'client-app/next.config.js', name: 'HM CAR' },
        { path: 'carx-system/next.config.js', name: 'CAR X' }
    ];
    
    configs.forEach(config => {
        if (fs.existsSync(config.path)) {
            const content = fs.readFileSync(config.path, 'utf8');
            
            // التحقق من أنه ديناميكي
            if (content.includes('process.env.NEXT_PUBLIC_APP_NAME')) {
                checks.passed.push(`✅ ${config.name}: next.config.js ديناميكي`);
            } else if (content.includes('HM CAR') && config.path.includes('client-app')) {
                checks.passed.push(`✅ ${config.name}: next.config.js مضبوط لـ HM CAR`);
            } else if (content.includes('CAR X') && config.path.includes('carx-system')) {
                checks.passed.push(`✅ ${config.name}: next.config.js مضبوط لـ CAR X`);
            } else {
                checks.warnings.push(`⚠️ ${config.name}: next.config.js قد يحتاج تحديث`);
            }
        } else {
            checks.failed.push(`❌ ${config.name}: next.config.js غير موجود`);
        }
    });
}

// تشغيل جميع الفحوصات
function runAllChecks() {
    checkEnvFiles();
    checkBuildFolders();
    checkPackageJson();
    checkTenantsJson();
    checkNextConfig();
    
    // طباعة النتائج
    console.log('\n' + '='.repeat(60));
    console.log('📊 نتائج الفحص النهائي:');
    console.log('='.repeat(60) + '\n');
    
    if (checks.passed.length > 0) {
        console.log('✅ الفحوصات الناجحة:');
        checks.passed.forEach(check => console.log(`   ${check}`));
        console.log('');
    }
    
    if (checks.warnings.length > 0) {
        console.log('⚠️ التحذيرات:');
        checks.warnings.forEach(warning => console.log(`   ${warning}`));
        console.log('');
    }
    
    if (checks.failed.length > 0) {
        console.log('❌ الفحوصات الفاشلة:');
        checks.failed.forEach(fail => console.log(`   ${fail}`));
        console.log('');
    }
    
    // الخلاصة
    console.log('='.repeat(60));
    const total = checks.passed.length + checks.warnings.length + checks.failed.length;
    const successRate = ((checks.passed.length / total) * 100).toFixed(1);
    
    console.log(`\n📈 معدل النجاح: ${successRate}%`);
    console.log(`   ✅ ناجح: ${checks.passed.length}`);
    console.log(`   ⚠️ تحذيرات: ${checks.warnings.length}`);
    console.log(`   ❌ فاشل: ${checks.failed.length}`);
    
    if (checks.failed.length === 0) {
        console.log('\n🎉 النظام جاهز للنشر على Vercel!');
        console.log('📋 راجع ملف: خطة_النشر_النهائية.md');
    } else {
        console.log('\n⚠️ يوجد مشاكل يجب حلها قبل النشر');
    }
    
    console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
    runAllChecks();
}

module.exports = { runAllChecks };
