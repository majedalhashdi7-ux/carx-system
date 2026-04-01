# Script لفصل client-app وجعله مستودع مستقل
# HM CAR Project - Client App Separation

Write-Host "🚀 بدء عملية فصل client-app..." -ForegroundColor Green
Write-Host ""

# المتغيرات
$currentPath = Get-Location
$clientAppPath = Join-Path $currentPath "client-app"
$newRepoPath = "C:\hmcar-client-app"
$githubRepo = "https://github.com/majedalhashdi7-ux/hmcar-client-app.git"

# الخطوة 1: نسخ client-app إلى مجلد جديد
Write-Host "📁 الخطوة 1: نسخ client-app إلى مجلد جديد..." -ForegroundColor Cyan
if (Test-Path $newRepoPath) {
    Write-Host "⚠️  المجلد موجود مسبقاً، سيتم حذفه..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $newRepoPath
}

Write-Host "📋 نسخ الملفات..." -ForegroundColor Gray
Copy-Item -Path $clientAppPath -Destination $newRepoPath -Recurse -Force

Write-Host "✅ تم النسخ بنجاح" -ForegroundColor Green
Write-Host ""

# الخطوة 2: حذف مجلد .git القديم
Write-Host "📁 الخطوة 2: إزالة ارتباط Git القديم..." -ForegroundColor Cyan
$oldGitPath = Join-Path $newRepoPath ".git"
if (Test-Path $oldGitPath) {
    Remove-Item -Recurse -Force $oldGitPath
    Write-Host "✅ تم إزالة .git القديم" -ForegroundColor Green
}
Write-Host ""

# الخطوة 3: تهيئة Git جديد
Write-Host "📁 الخطوة 3: تهيئة Git جديد..." -ForegroundColor Cyan
Set-Location $newRepoPath
git init
Write-Host "✅ تم تهيئة Git" -ForegroundColor Green
Write-Host ""

# الخطوة 4: إضافة جميع الملفات
Write-Host "📁 الخطوة 4: إضافة الملفات..." -ForegroundColor Cyan
git add .
Write-Host "✅ تم إضافة الملفات" -ForegroundColor Green
Write-Host ""

# الخطوة 5: أول commit
Write-Host "📁 الخطوة 5: إنشاء أول commit..." -ForegroundColor Cyan
git commit -m "Initial commit - HM CAR Client App (Separated from main repo)"
Write-Host "✅ تم إنشاء commit" -ForegroundColor Green
Write-Host ""

# الخطوة 6: ربط بالمستودع الجديد
Write-Host "📁 الخطوة 6: ربط بالمستودع الجديد..." -ForegroundColor Cyan
Write-Host "⚠️  تأكد من إنشاء المستودع على GitHub أولاً:" -ForegroundColor Yellow
Write-Host "   $githubRepo" -ForegroundColor Yellow
Write-Host ""
Read-Host "اضغط Enter بعد إنشاء المستودع على GitHub"

git remote add origin $githubRepo
git branch -M main
Write-Host "✅ تم ربط المستودع" -ForegroundColor Green
Write-Host ""

# الخطوة 7: رفع الكود
Write-Host "📁 الخطوة 7: رفع الكود إلى GitHub..." -ForegroundColor Cyan
git push -u origin main
Write-Host "✅ تم رفع الكود بنجاح!" -ForegroundColor Green
Write-Host ""

# الخطوة 8: معلومات النشر
Write-Host "🎉 تم فصل client-app بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 المعلومات:" -ForegroundColor Cyan
Write-Host "   المجلد الجديد: $newRepoPath" -ForegroundColor White
Write-Host "   المستودع:      $githubRepo" -ForegroundColor White
Write-Host ""
Write-Host "🔗 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "   1. اذهب إلى Vercel: https://vercel.com/new" -ForegroundColor White
Write-Host "   2. اختر المستودع: hmcar-client-app" -ForegroundColor White
Write-Host "   3. Framework: Next.js" -ForegroundColor White
Write-Host "   4. Root Directory: ./" -ForegroundColor White
Write-Host "   5. أضف Environment Variables:" -ForegroundColor White
Write-Host "      NEXT_PUBLIC_API_URL=https://hmcar-system.vercel.app/api/v2" -ForegroundColor Gray
Write-Host "      NEXT_PUBLIC_TENANT=hmcar" -ForegroundColor Gray
Write-Host "   6. انقر Deploy" -ForegroundColor White
Write-Host ""
Write-Host "✅ انتهى!" -ForegroundColor Green

# العودة للمجلد الأصلي
Set-Location "C:\car-auction"
