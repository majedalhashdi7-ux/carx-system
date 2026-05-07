# تفعيل Sentry - خطوات الإعداد (شاملة)

## 1. الحصول على DSN
1. سجل دخول في [Sentry.io](https://sentry.io)
2. أنشئ مشروعاً جديداً.
3. انسخ الـ DSN الخاص بك.

## 2. الإعداد المحلي (.env)
أضف السطر التالي لملف الـ `.env`:
```env
NEXT_PUBLIC_SENTRY_DSN=رابط_الـ_DSN_الخاص_بك
```

## 3. إعداد الإنتاج (Vercel)
لضمان عمل تتبع الأخطاء على الموقع المباشر:
1. اذهب إلى **Vercel Dashboard** > **Settings** > **Environment Variables**.
2. أضف `NEXT_PUBLIC_SENTRY_DSN`.
3. احفظ الإعدادات وأعد النشر (Redeploy).

## 4. التغطية الحالية
*   **Frontend:** يتم تفعيل Sentry تلقائياً عبر ملف `client-app/src/lib/sentry.ts`.
*   **Backend:** تم دمج Sentry في `modules/app.js` ويقوم بتتبع:
    *   أخطاء الـ API (500 Errors).
    *   فشل الاتصال بقاعدة البيانات.
    *   أداء الطلبات (Performance Tracing).

## 💡 نصيحة
يمكنك تتبع الأخطاء بشكل منفصل لكل معرض (Tenant) عبر ميزة الـ Tags في Sentry، حيث يقوم النظام بإرسال `tenantId` مع كل خطأ.
