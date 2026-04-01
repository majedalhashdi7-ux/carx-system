# 🚀 سكريبت إعداد مستودع client-app المنفصل
# التاريخ: 2026-03-31

Write-Host "==================================" -ForegroundColor Blue
Write-Host "🚀 إعداد مستودع client-app المنفصل" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host ""

# الخطوة 1: التحقق من وجود client-app
Write-Host "[1/6] التحقق من وجود مجلد client-app..." -ForegroundColor Cyan
if (-not (Test-Path "client-app")) {
    Write-Host "❌ خطأ: مجلد client-app غير موجود" -ForegroundColor Red
    exit 1
}
Write-Host "✅ مجلد client-app موجود" -ForegroundColor Green
Write-Host ""

# الخطوة 2: الدخول إلى مجلد client-app
Write-Host "[2/6] الدخول إلى مجلد client-app..." -ForegroundColor Cyan
Set-Location client-app
Write-Host "✅ تم الدخول إلى client-app" -ForegroundColor Green
Write-Host ""

# الخطوة 3: التحقق من عدم وجود git repository
Write-Host "[3/6] التحقق من حالة Git..." -ForegroundColor Cyan
if (Test-Path ".git") {
    Write-Host "⚠️  يوجد git repository بالفعل" -ForegroundColor Yellow
    $response = Read-Host "هل تريد حذفه وإنشاء واحد جديد؟ (y/n)"
    if ($response -match "^[yY]") {
        Remove-Item -Recurse -Force .git
        Write-Host "✅ تم حذف Git repository القديم" -ForegroundColor Green
    } else {
        Write-Host "❌ تم الإلغاء" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# الخطوة 4: إنشاء git repository جديد
Write-Host "[4/6] إنشاء Git repository جديد..." -ForegroundColor Cyan
git init
Write-Host "✅ تم إنشاء Git repository" -ForegroundColor Green
Write-Host ""

# الخطوة 5: إضافة الملفات
Write-Host "[5/6] إضافة الملفات..." -ForegroundColor Cyan
git add .
git commit -m "Initial commit: HM CAR Client App - Multi-Tenant Platform

✨ الميزات:
- Multi-Tenant Architecture
- Real-time Auctions
- Mobile Apps (iOS & Android)
- 3D Graphics
- Responsive Design
- SEO Optimized

🚀 جاهز للنشر على Vercel"

Write-Host "✅ تم إضافة الملفات والـ commit" -ForegroundColor Green
Write-Host ""

# الخطوة 6: إعداد Remote
Write-Host "[6/6] إعداد GitHub Remote..." -ForegroundColor Cyan
Write-Host "الآن يجب عليك:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. اذهب إلى GitHub: https://github.com/new"
Write-Host "2. أنشئ repository جديد باسم: client-app"
Write-Host "3. اختر Private أو Public"
Write-Host "4. لا تضف README أو .gitignore (موجودين بالفعل)"
Write-Host "5. اضغط Create Repository"
Write-Host ""
Write-Host "6. ثم نفذ الأوامر التالية:"
Write-Host ""
Write-Host "git remote add origin https://github.com/majedalhashdi7-ux/client-app.git" -ForegroundColor Green
Write-Host "git branch -M main" -ForegroundColor Green
Write-Host "git push -u origin main" -ForegroundColor Green
Write-Host ""
Write-Host "==================================" -ForegroundColor Blue
Write-Host "✅ الإعداد المحلي اكتمل!" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. أنشئ repository على GitHub"
Write-Host "2. نفذ الأوامر أعلاه"
Write-Host "3. اذهب إلى Vercel وانشر المشروع"
Write-Host ""
