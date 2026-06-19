#!/usr/bin/env node

/**
 * نشر تلقائي للنظامين على Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء النشر التلقائي للنظامين...\n');

// معلومات النشر
const deploymentInfo = {
    hmcar: {
        name: 'HM CAR',
        directory: 'client-app',
        envVars: {
            'MONGO_URI': process.env.MONGO_URI || '',
            'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET || '',
            'NEXTAUTH_URL': process.env.NEXTAUTH_URL || 'https://hmcar-system-two.vercel.app',
            'ADMIN_EMAIL': process.env.ADMIN_EMAIL || 'dawoodalhash@gmail.com',
            'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD || '',
            'WHATSAPP_NUMBER': process.env.WHATSAPP_NUMBER || '+967781007805',
            'USD_TO_SAR': process.env.USD_TO_SAR || '3.75',
            'USD_TO_KRW': process.env.USD_TO_KRW || '1300',
            'NODE_ENV': 'production'
        }
    },
    carx: {
        name: 'CAR X',
        directory: 'carx-system',
        envVars: {
            'MONGO_URI': process.env.MONGO_URI || '',
            'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET || '',
            'NEXTAUTH_URL': process.env.NEXTAUTH_URL || 'https://hmcar-system-two.vercel.app',
            'ADMIN_EMAIL': process.env.ADMIN_EMAIL || 'dawoodalhash@gmail.com',
            'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD || '',
            'WHATSAPP_NUMBER': process.env.WHATSAPP_NUMBER || '+967781007805',
            'USD_TO_SAR': process.env.USD_TO_SAR || '3.75',
            'USD_TO_KRW': process.env.USD_TO_KRW || '1300',
            'NODE_ENV': 'production'
        }
    }
};

// فحص Vercel CLI
function checkVercelCLI() {
    try {
        execSync('vercel --version', { stdio: 'pipe' });
        console.log('✅ Vercel CLI متوفر');
        return true;
    } catch (error) {
        console.log('❌ Vercel CLI غير مثبت');
        console.log('📥 تثبيت Vercel CLI...');
        try {
            execSync('npm install -g vercel', { stdio: 'inherit' });
            console.log('✅ تم تثبيت Vercel CLI');
            return true;
        } catch (installError) {
            console.error('❌ فشل في تثبيت Vercel CLI:', installError.message);
            return false;
        }
    }
}

function run(cmd, cwd, label) {
    try {
        execSync(cmd, { cwd, stdio: 'inherit', encoding: 'utf-8' });
        return true;
    } catch (err) {
        console.error(`❌ فشل: ${label}`);
        console.error(err.message);
        return false;
    }
}

function hasLocalBinary(directory, binary) {
    const fullPath = path.resolve(directory);
    const binaryPath = path.join(fullPath, 'node_modules', '.bin', binary);
    return fs.existsSync(binaryPath);
}

// التحقق من وجود المجلد وأنه مشروع Node قابل للبناء
function isProjectDirectory(directory) {
    const fullPath = path.resolve(directory);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'package.json'));
}

// تثبيت التبعيات إذا كانت غير موجودة أو ناقصة
function ensureDependenciesInstalled(directory) {
    const fullPath = path.resolve(directory);
    const nodeModulesPath = path.join(fullPath, 'node_modules');
    const packageLockPath = path.join(fullPath, 'package-lock.json');
    const missingModules = !fs.existsSync(nodeModulesPath);
    const missingBinary = !hasLocalBinary(directory, 'next');

    if ((missingModules || missingBinary) && fs.existsSync(packageLockPath)) {
        console.log(`📦 تثبيت التبعيات في ${directory}...`);
        return run('npm ci --no-audit --no-fund', fullPath, 'npm ci');
    }

    if (missingModules && !fs.existsSync(packageLockPath)) {
        console.log(`📦 تثبيت التبعيات في ${directory} باستخدام npm install...`);
        return run('npm install --no-audit --no-fund', fullPath, 'npm install');
    }

    return true;
}

// بناء المشروع
function buildProject(directory, name) {
    console.log(`🔨 بناء ${name}...`);

    if (!isProjectDirectory(directory)) {
        console.log(`⚠️ تخطي ${name} لأن المجلد غير موجود أو لا يحتوي على package.json: ${directory}`);
        return false;
    }

    if (!ensureDependenciesInstalled(directory)) {
        return false;
    }

    try {
        execSync('npm run build', { 
            cwd: directory, 
            stdio: 'inherit',
            timeout: 300000 // 5 دقائق
        });
        console.log(`✅ تم بناء ${name} بنجاح`);
        return true;
    } catch (error) {
        console.error(`❌ فشل في بناء ${name}:`, error.message);
        return false;
    }
}

// نشر على Vercel
function deployToVercel(directory, name) {
    console.log(`🚀 نشر ${name} على Vercel...`);
    try {
        const result = execSync('vercel --prod --yes', { 
            cwd: directory, 
            encoding: 'utf8',
            timeout: 600000 // 10 دقائق
        });
        
        // استخراج URL من النتيجة
        const lines = result.split('\n');
        const deploymentUrl = lines.find(line => line.includes('https://'));
        
        if (deploymentUrl) {
            console.log(`✅ تم نشر ${name} بنجاح!`);
            console.log(`🔗 الرابط: ${deploymentUrl.trim()}`);
            return deploymentUrl.trim();
        } else {
            console.log(`✅ تم نشر ${name} بنجاح!`);
            return 'تم النشر بنجاح';
        }
    } catch (error) {
        console.error(`❌ فشل في نشر ${name}:`, error.message);
        return null;
    }
}

// إنشاء تقرير النشر
function createDeploymentReport(results) {
    const report = `# 🎉 تقرير النشر التلقائي

## ✅ نتائج النشر

### HM CAR:
- **الحالة**: ${results.hmcar.success ? '✅ نجح' : '❌ فشل'}
- **الرابط**: ${results.hmcar.url || 'غير متوفر'}

### CAR X:
- **الحالة**: ${results.carx.success ? '✅ نجح' : '❌ فشل'}
- **الرابط**: ${results.carx.url || 'غير متوفر'}

## 🔐 بيانات الدخول

### حساب الإدارة:
- **الإيميل**: dawoodalhash@gmail.com
- **كلمة السر**: ${process.env.ADMIN_PASSWORD || 'غير متوفر'}

### قاعدة البيانات:
- **Connection String**: ${process.env.MONGO_URI || 'غير متوفر'}

## 📞 معلومات الاتصال:
- **واتساب**: +967781007805
- **إيميل**: dawoodalhash@gmail.com

---
**تاريخ النشر**: ${new Date().toLocaleString('ar-SA')}
**النشر بواسطة**: سكريبت النشر التلقائي
`;

    fs.writeFileSync('DEPLOYMENT_REPORT.md', report);
    console.log('📄 تم إنشاء تقرير النشر');
}

// تشغيل النشر التلقائي
async function runAutoDeploy() {
    const results = {
        hmcar: { success: false, url: null },
        carx: { success: false, url: null }
    };

    try {
        // فحص Vercel CLI
        if (!checkVercelCLI()) {
            throw new Error('Vercel CLI غير متوفر');
        }

        // نشر HM CAR
        console.log('\n🔥 نشر HM CAR...');
        if (buildProject(deploymentInfo.hmcar.directory, deploymentInfo.hmcar.name)) {
            const hmcarUrl = deployToVercel(deploymentInfo.hmcar.directory, deploymentInfo.hmcar.name);
            if (hmcarUrl) {
                results.hmcar.success = true;
                results.hmcar.url = hmcarUrl;
            }
        }

        // نشر CAR X
        console.log('\n🔥 نشر CAR X...');
        if (buildProject(deploymentInfo.carx.directory, deploymentInfo.carx.name)) {
            const carxUrl = deployToVercel(deploymentInfo.carx.directory, deploymentInfo.carx.name);
            if (carxUrl) {
                results.carx.success = true;
                results.carx.url = carxUrl;
            }
        }

        // إنشاء التقرير
        createDeploymentReport(results);

        // عرض النتائج
        console.log('\n🎉 انتهى النشر التلقائي!');
        console.log('\n📊 النتائج:');
        console.log(`HM CAR: ${results.hmcar.success ? '✅ نجح' : '❌ فشل'}`);
        console.log(`CAR X: ${results.carx.success ? '✅ نجح' : '❌ فشل'}`);

        if (results.hmcar.success && results.carx.success) {
            console.log('\n🎊 مبروك! تم نشر النظامين بنجاح!');
            console.log('\n🔗 الروابط:');
            if (results.hmcar.url) console.log(`HM CAR: ${results.hmcar.url}`);
            if (results.carx.url) console.log(`CAR X: ${results.carx.url}`);
        }

    } catch (error) {
        console.error('❌ خطأ في النشر التلقائي:', error.message);
        createDeploymentReport(results);
    }
}

if (require.main === module) {
    runAutoDeploy();
}

module.exports = { runAutoDeploy };