# ✅ Environment Variables الصحيحة لـ CAR X System

## 🎯 المتغيرات المطلوبة في Vercel Dashboard:

اذهب إلى:
```
https://vercel.com/majedalhashdi7-ux/carx-system/settings/environment-variables
```

---

## 📝 المتغيرات:

### 1. NEXT_PUBLIC_API_URL
```
NEXT_PUBLIC_API_URL=https://daood.okigo.net/api/v2
```
**مهم:** يجب أن يكون `/api/v2` وليس `/api`

---

### 2. NEXT_PUBLIC_TENANT
```
NEXT_PUBLIC_TENANT=carx
```

---

### 3. NEXT_PUBLIC_APP_NAME
```
NEXT_PUBLIC_APP_NAME=CAR X
```

---

### 4. NEXT_PUBLIC_WHATSAPP
```
NEXT_PUBLIC_WHATSAPP=+967781007805
```

---

### 5. NODE_ENV
```
NODE_ENV=production
```

---

## ⚠️ ملاحظات مهمة:

1. **احذف أي متغيرات قديمة** خاصة:
   - `NEXT_PUBLIC_APIURL` (بدون underscore)
   - `NEXT_PUBLIC_API_URL=https://hmcar-system.vercel.app/...` (API خاطئ)

2. **لا تضيف MONGO_URI** في carx-system
   - carx-system هو Frontend فقط
   - Backend (daood.okigo.net) يدير قواعد البيانات

3. **بعد إضافة المتغيرات:**
   - اضغط Save
   - اذهب إلى Deployments
   - اضغط Redeploy على آخر deployment

---

## 🔍 كيف يعمل النظام:

```
المستخدم يفتح: carx-system-psi.vercel.app
    ↓
carx-system يستدعي: daood.okigo.net/api/v2/cars
    ↓
Backend يرى: Host = carx-system-psi.vercel.app
    ↓
tenant-resolver يحدد: tenant = carx
    ↓
Backend يتصل بـ: carx_production database
    ↓
يرجع: سيارات CAR X فقط ✅
```

---

## ✅ النتيجة النهائية:

بعد التنفيذ:

```
✅ HMCAR (daood.okigo.net)
   - قاعدة بيانات: hmcar_production
   - البيانات: سيارات HM CAR فقط
   - منفصل تماماً

✅ CAR X (carx-system-psi.vercel.app)
   - قاعدة بيانات: carx_production
   - البيانات: سيارات CAR X فقط
   - منفصل تماماً

✅ لا تداخل في البيانات
✅ كل نظام مستقل
✅ نفس الفكرة، طريقة مختلفة
```
