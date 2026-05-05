# تفعيل Sentry - خطوات الإعداد

## الخطوة 1: الحصول على DSN
1. سجل دخول في https://sentry.io
2. أنشئ مشروع جديد (Next.js)
3. انسخ الـ DSN

## الخطوة 2: إضافة المتغير في .env
```
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxx.ingest.sentry.io/xxxxxxx
```

## الخطوة 3: التحقق من التفعيل
بعد إضافة DSN، شغّل التطبيق وافتح Console لتأكد من عدم وجود أخطاء Sentry.

## ملاحظات
- Sentry مُثبت بالفعل في package.json
- التكوين موجود في sentry.client.config.ts
- لا يحتاج Sentry قاعدة بيانات لتعمل
