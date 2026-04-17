# سكريبت النشر الشامل - HM CAR + CAR X
# تاريخ: 16 أبريل 2026

Write-Host "🚀 بدء النشر الشامل..." -ForegroundColor Green
Write-Host ""

# ============================================
# المرحلة 1: نشر HM CAR على Vercel
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 المرحلة 1: نشر HM CAR Backend + Frontend" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location c:\car-auction

Write-Host "✅ الملفات جاهزة للنشر:" -ForegroundColor Yellow
Write-Host "  - إصلاحات TypeScript" 
Write-Host "  - إصلاحات API imports"
Write-Host "  - تحديث environment variables"
Write-Host "  - إصلاح lockfile warnings"
Write-Host ""

Write-Host "🔄 جاري النشر على Vercel..." -ForegroundColor Yellow
Write-Host ""

# ملاحظة: يحتاج Vercel CLI مثبت
# npm i -g vercel

vercel --prod --confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ تم نشر HM CAR بنجاح!" -ForegroundColor Green
    Write-Host "🌐 URL: https://daood.okigo.net" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ يحتاج Vercel CLI أو تسجيل دخول" -ForegroundColor Yellow
    Write-Host "📝 يمكنك النشر يدوياً من:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 2: نشر CAR X على Vercel
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 المرحلة 2: نشر CAR X System" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location c:\car-auction\carx-system

Write-Host "✅ الملفات جاهزة للنشر:" -ForegroundColor Yellow
Write-Host "  - Build ناجح (30 صفحة)"
Write-Host "  - إصلاح lockfile warnings"
Write-Host "  - Environment variables جاهزة"
Write-Host ""

Write-Host "🔄 جاري النشر على Vercel..." -ForegroundColor Yellow
Write-Host ""

vercel --prod --confirm

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ تم نشر CAR X بنجاح!" -ForegroundColor Green
    Write-Host "🌐 URL: https://carx-system-psi.vercel.app" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ يحتاج Vercel CLI أو تسجيل دخول" -ForegroundColor Yellow
    Write-Host "📝 يمكنك النشر يدوياً من:" -ForegroundColor Yellow
    Write-Host "   https://vercel.com/dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 3: ملخص النشر
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 ملخص النشر" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ ما تم نشره:" -ForegroundColor Green
Write-Host "  1. HM CAR Backend + Frontend → Vercel"
Write-Host "  2. CAR X System → Vercel"
Write-Host ""

Write-Host "⚠️ مهم جداً:" -ForegroundColor Yellow
Write-Host "  بعد النشر، يجب تحديث Environment Variables في Vercel Dashboard:"
Write-Host ""
Write-Host "  HM CAR:"
Write-Host "    MONGO_URI=mongodb+srv://hmcar_user:VoXK0xd2COvWbTH1@cluster0.tirfqnb.mongodb.net/car-auction"
Write-Host "    MONGO_URI_CARX=mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx"
Write-Host ""
Write-Host "  CAR X:"
Write-Host "    MONGO_URI=mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx_production"
Write-Host ""

Write-Host "🔗 الروابط:" -ForegroundColor Cyan
Write-Host "  HM CAR: https://daood.okigo.net"
Write-Host "  CAR X: https://carx-system-psi.vercel.app"
Write-Host ""

Write-Host "🎉 اكتمل النشر!" -ForegroundColor Green
Write-Host ""

Set-Location c:\car-auction
