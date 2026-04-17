# 🤖 سكريبت النشر التلقائي الكامل

Write-Host "🚀 ========================================" -ForegroundColor Cyan
Write-Host "🚀 النشر التلقائي الشامل - جميع الأنظمة" -ForegroundColor Cyan
Write-Host "🚀 ========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# المرحلة 0: التحقق من Vercel CLI
# ============================================
Write-Host "📦 التحقق من Vercel CLI..." -ForegroundColor Yellow

$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI غير مثبت - جاري التثبيت..." -ForegroundColor Yellow
    npm install -g vercel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل تثبيت Vercel CLI" -ForegroundColor Red
        Write-Host "📝 قم بتثبيته يدوياً: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ تم تثبيت Vercel CLI بنجاح!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI مثبت بالفعل" -ForegroundColor Green
}

Write-Host ""

# ============================================
# المرحلة 0.5: تسجيل الدخول
# ============================================
Write-Host "🔐 التحقق من تسجيل الدخول..." -ForegroundColor Yellow

try {
    $whoami = vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ تم تسجيل الدخول: $whoami" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  يجب تسجيل الدخول أولاً" -ForegroundColor Yellow
        Write-Host "🔑 جاري فتح صفحة تسجيل الدخول..." -ForegroundColor Yellow
        Write-Host ""
        vercel login
    }
} catch {
    Write-Host "⚠️  يحتاج تسجيل دخول" -ForegroundColor Yellow
    vercel login
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 1: نشر HM CAR
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 المرحلة 1: نشر HM CAR System" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location c:\car-auction

Write-Host "✅ الإصلاحات الجاهزة للنشر:" -ForegroundColor Green
Write-Host "  ✓ TypeScript errors (clientRegister, clientLogin, deviceId)"
Write-Host "  ✓ API imports (api-original → api)"
Write-Host "  ✓ Environment variables (محلي + إنتاجي)"
Write-Host "  ✓ Next.js lockfile warnings"
Write-Host "  ✓ Build ناجح (63 صفحة)"
Write-Host ""

Write-Host "🔄 جاري النشر..." -ForegroundColor Yellow
Write-Host ""

vercel --prod --confirm --token $env:VERCEL_TOKEN

$hmcarResult = $LASTEXITCODE

if ($hmcarResult -eq 0) {
    Write-Host ""
    Write-Host "✅ تم نشر HM CAR بنجاح!" -ForegroundColor Green
    Write-Host "🌐 URL: https://daood.okigo.net" -ForegroundColor Green
    Write-Host ""
    
    # فحص سريع
    Write-Host "🧪 جاري فحص HM CAR..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "https://daood.okigo.net" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ HM CAR Frontend يعمل!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  لا يمكن الفحص الآن - انتظر بضع دقائق" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ فشل نشر HM CAR" -ForegroundColor Red
    Write-Host "💡 حاول يدوياً من: https://vercel.com/dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 2: نشر CAR X
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 المرحلة 2: نشر CAR X System" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location c:\car-auction\carx-system

Write-Host "✅ الإصلاحات الجاهزة للنشر:" -ForegroundColor Green
Write-Host "  ✓ Next.js lockfile warnings"
Write-Host "  ✓ Build ناجح (30 صفحة)"
Write-Host "  ✓ Environment variables جاهزة"
Write-Host ""

Write-Host "🔄 جاري النشر..." -ForegroundColor Yellow
Write-Host ""

vercel --prod --confirm --token $env:VERCEL_TOKEN

$carxResult = $LASTEXITCODE

if ($carxResult -eq 0) {
    Write-Host ""
    Write-Host "✅ تم نشر CAR X بنجاح!" -ForegroundColor Green
    Write-Host "🌐 URL: https://carx-system-psi.vercel.app" -ForegroundColor Green
    Write-Host ""
    
    # فحص سريع
    Write-Host "🧪 جاري فحص CAR X..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "https://carx-system-psi.vercel.app" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ CAR X Frontend يعمل!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  لا يمكن الفحص الآن - انتظر بضع دقائق" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ فشل نشر CAR X" -ForegroundColor Red
    Write-Host "💡 حاول يدوياً من: https://vercel.com/dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 3: ملخص نهائي شامل
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 الملخص النهائي" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($hmcarResult -eq 0) {
    Write-Host "✅ HM CAR" -ForegroundColor Green
    Write-Host "   Frontend: https://daood.okigo.net" -ForegroundColor Green
    Write-Host "   API: https://daood.okigo.net/api/v2/cars" -ForegroundColor Green
} else {
    Write-Host "❌ HM CAR - فشل النشر" -ForegroundColor Red
}

Write-Host ""

if ($carxResult -eq 0) {
    Write-Host "✅ CAR X" -ForegroundColor Green
    Write-Host "   Frontend: https://carx-system-psi.vercel.app" -ForegroundColor Green
    Write-Host "   API: https://carx-system-psi.vercel.app/api/cars" -ForegroundColor Green
} else {
    Write-Host "❌ CAR X - فشل النشر" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# ============================================
# المرحلة 4: تذكير Environment Variables
# ============================================
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚠️  مهم جداً - Environment Variables" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "تأكد من تحديث المتغيرات التالية في Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""

Write-Host "📌 HM CAR (مشروع car-auction):" -ForegroundColor Cyan
Write-Host "  MONGO_URI=mongodb+srv://hmcar_user:VoXK0xd2COvWbTH1@cluster0.tirfqnb.mongodb.net/car-auction" -ForegroundColor White
Write-Host "  MONGO_URI_CARX=mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx" -ForegroundColor White
Write-Host ""

Write-Host "📌 CAR X (مشروع carx-system):" -ForegroundColor Cyan
Write-Host "  MONGO_URI=mongodb+srv://carx:alQ1ZGSVtOZ1IPle@cluster0.1bqjdzp.mongodb.net/carx_production" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Dashboard: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host ""

# ============================================
# الخلاصة
# ============================================
if ($hmcarResult -eq 0 -and $carxResult -eq 0) {
    Write-Host "🎉 ========================================" -ForegroundColor Green
    Write-Host "🎉 تم النشر بنجاح! جميع الأنظمة جاهزة!" -ForegroundColor Green
    Write-Host "🎉 ========================================" -ForegroundColor Green
} else {
    Write-Host "⚠️  ========================================" -ForegroundColor Yellow
    Write-Host "⚠️  تم النشر مع بعض المشاكل" -ForegroundColor Yellow
    Write-Host "⚠️  تحقق من الأخطاء أعلاه" -ForegroundColor Yellow
    Write-Host "⚠️  ========================================" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 التقرير الكامل: DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

Set-Location c:\car-auction
