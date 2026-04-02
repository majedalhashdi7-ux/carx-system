# دليل إضافة Environment Variables الصحيح لـ CAR X

## ✅ الخطوات الصحيحة

### 1. افتح Vercel Dashboard
- اذهب إلى: https://vercel.com/dashboard
- اختر مشروع `carx-system`

### 2. اذهب إلى Settings
- اضغط على تبويب **Settings**
- من القائمة الجانبية اختر **Environment Variables**

### 3. أضف المتغيرات التالية بالضبط

⚠️ **مهم جداً**: انتبه للأسماء بالضبط (مع الـ underscore)

```
NEXT_PUBLIC_API_URL = https://hmcar-system.vercel.app/api/v2
NEXT_PUBLIC_TENANT = carx
NEXT_PUBLIC_APP_NAME = CAR X
NEXT_PUBLIC_WHATSAPP = +967781007805
NODE_ENV = production
```

### 4. تأكد من الإعدادات
- ✅ Environment: اختر **Production**, **Preview**, و **Development**
- ✅ اضغط **Save** لكل متغير

### 5. أعد النشر (Redeploy)
- اذهب إلى تبويب **Deployments**
- اضغط على آخر deployment
- اضغط على الثلاث نقاط (⋯)
- اختر **Redeploy**
- ✅ تأكد من تفعيل **Use existing Build Cache** (اختياري)

---

## ❌ الأخطاء الشائعة

### خطأ 1: كتابة اسم المتغير خطأ
```
❌ NEXT_PUBLIC_APIURL (خطأ - بدون underscore)
✅ NEXT_PUBLIC_API_URL (صحيح - مع underscore)
```

### خطأ 2: نسيان إعادة النشر
- بعد إضافة المتغيرات، يجب إعادة النشر (Redeploy)
- المتغيرات لا تطبق تلقائياً على النشر الحالي

### خطأ 3: اختيار Environment خطأ
- تأكد من اختيار **Production** على الأقل
- يفضل اختيار الثلاثة (Production, Preview, Development)

---

## 🔍 التحقق من النجاح

بعد إعادة النشر، تحقق من:

1. **Build Status**: يجب أن يكون ✅ **Ready**
2. **افتح الموقع**: https://carx-system.vercel.app
3. **تحقق من الاتصال بالـ Backend**: يجب أن يعمل بدون أخطاء 404

---

## 📝 ملاحظات مهمة

1. **Backend مشترك**: CAR X و HM CAR يستخدمان نفس الـ Backend
   - Backend URL: `https://hmcar-system.vercel.app/api/v2`
   - الفصل يتم عبر `NEXT_PUBLIC_TENANT`

2. **Tenant**: 
   - HM CAR: `tenant=hmcar`
   - CAR X: `tenant=carx`

3. **لا تحتاج Backend منفصل**: النظام الحالي يعمل بكفاءة مع Backend واحد

---

## 🎯 النتيجة المتوقعة

بعد اتباع الخطوات:
- ✅ carx-system يبني بنجاح
- ✅ الموقع يعمل على https://carx-system.vercel.app
- ✅ الاتصال بالـ Backend يعمل بدون مشاكل
- ✅ البيانات تظهر بشكل صحيح

---

تم التحديث: 2026-04-02
