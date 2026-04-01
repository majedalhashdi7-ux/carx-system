# Scripts Directory

دليل شامل لجميع scripts المشروع، منظمة حسب الوظيفة.

---

## 📁 الهيكل

```
scripts/
├── setup/      - إعداد النظام والبيئات
├── check/      - فحص الحالة والصحة
├── fix/        - إصلاح المشاكل
├── deploy/     - نشر وتحديث
├── database/   - إدارة قاعدة البيانات
├── admin/      - إدارة المستخدمين والمعارض
├── monitoring/ - مراقبة وتقارير
└── utils/      - أدوات مساعدة
```

---

## 🚀 setup/ - إعداد النظام

Scripts لإعداد البيئات المختلفة:

```bash
# إعداد production
node scripts/setup/setup-production.js

# إعداد Railway
node scripts/setup/setup-railway.js

# إعداد قواعد بيانات منفصلة
node scripts/setup/setup-separate-databases.js

# إعداد Korean Showroom
node scripts/setup/setup-korean-showroom.js

# إعداد VPS
bash scripts/setup/vps-setup.sh

# تهيئة النظام
node scripts/setup/initializeSystem.js
```

---

## 🔍 check/ - فحص الحالة

Scripts للتحقق من صحة النظام:

```bash
# فحص شامل للنظام
node scripts/check/check-system.js

# فحص صحة التطبيق
node scripts/check/healthCheck.js

# فحص النشر
node scripts/check/check-deployment.js

# فحص DNS
node scripts/check/check-dns.js

# فحص الإعدادات
node scripts/check/check-settings.js

# فحص البيئة
node scripts/check/checkEnvironment.js

# فحص CAR X UI
node scripts/check/check-carx-ui.js

# فحص CAR X كامل
node scripts/check/check-carx-complete.js

# فحص Korean Showroom
node scripts/check/check-korean-showroom.js

# فحص الحالة النهائية
node scripts/check/final-status-check.js
```

---

## 🔧 fix/ - إصلاح المشاكل

Scripts لإصلاح المشاكل الشائعة:

```bash
# إصلاح المشاكل الحرجة
node scripts/fix/fix-critical-issues.js

# إصلاح المشاكل المتبقية
node scripts/fix/fix-remaining-issues.js

# إصلاح عبر API
node scripts/fix/fix-via-api.js

# إصلاح عبر Vercel cURL
node scripts/fix/fix-via-vercel-curl.js

# إصلاح البيانات الحية
node scripts/fix/fix-live-data.js
node scripts/fix/fix-live-data-local.js

# إصلاح Korean Showroom
node scripts/fix/fix-korean-cars.js
node scripts/fix/fix-korean-images.js
node scripts/fix/fix-korean-car-images.js
node scripts/fix/fix-korean-via-api.js
node scripts/fix/fix-production-korean-showroom.js

# إصلاح Production تلقائي
node scripts/fix/fix-production-auto.js

# إصلاح شامل
node scripts/fix/complete-system-fix.js

# التحقق من الإصلاحات
node scripts/fix/verify-fixes.js
```

---

## 🚀 deploy/ - النشر

Scripts للنشر والتحديث:

```bash
# نشر تلقائي
node scripts/deploy/auto-deploy.js
bash scripts/deploy/auto-deploy.sh

# إعادة نشر إجباري
node scripts/deploy/force-redeploy.js

# إعادة نشر الكل
node scripts/deploy/redeploy-all.js

# نشر على VPS
bash scripts/deploy/vps-deploy.sh

# تحديث الدومين
node scripts/deploy/update-domain.js

# التحقق من الدومين
node scripts/deploy/verify-domain.js
```

---

## 💾 database/ - قاعدة البيانات

Scripts لإدارة قاعدة البيانات:

```bash
# إضافة indexes
node scripts/database/addDatabaseIndexes.js

# تحسين indexes
node scripts/database/optimizeDatabaseIndexes.js

# إعادة تعيين قاعدة البيانات
node scripts/database/reset-database.js

# تحديث الاتصال
node scripts/database/update-with-real-connection.js
```

---

## 👤 admin/ - الإدارة

Scripts لإدارة المستخدمين والمعارض:

```bash
# إنشاء حساب admin
node scripts/admin/create-admin-account.js

# إنشاء admin محلي
node scripts/admin/createLocalAdmin.js

# إنشاء admin production
node scripts/admin/createProductionAdmin.js

# إضافة معرض (tenant)
node scripts/admin/add-tenant.js

# عرض المعارض
node scripts/admin/list-tenants.js
```

---

## 📊 monitoring/ - المراقبة

Scripts للمراقبة والتقارير:

```bash
# مراقبة الصحة (مستمرة)
node scripts/monitoring/health-monitor.js start

# فحص صحة واحد
node scripts/monitoring/health-monitor.js check

# إنشاء تقرير يومي
node scripts/monitoring/health-monitor.js report

# عرض لوحة التحكم
node scripts/monitoring/health-monitor.js dashboard

# نسخ احتياطي production
node scripts/monitoring/production-backup.js

# وكيل المراقبة
node scripts/monitoring/monitoringAgent.js
```

---

## 🛠️ utils/ - أدوات مساعدة

Scripts مساعدة متنوعة:

```bash
# التحقق من الإعدادات
node scripts/utils/validate-config.js

# تفعيل جميع الميزات
node scripts/utils/activate-all-features.js

# تنظيف المشروع
bash scripts/utils/clean-project.sh
# أو على Windows:
powershell scripts/utils/clean-project.ps1

# التحقق النهائي
node scripts/utils/final-verification.js
```

---

## 📝 أمثلة الاستخدام

### سيناريو 1: إعداد بيئة جديدة
```bash
# 1. إعداد النظام
node scripts/setup/setup-production.js

# 2. إنشاء admin
node scripts/admin/create-admin-account.js

# 3. فحص النظام
node scripts/check/check-system.js

# 4. نشر
node scripts/deploy/auto-deploy.js
```

### سيناريو 2: إصلاح مشكلة
```bash
# 1. فحص المشكلة
node scripts/check/check-system.js

# 2. إصلاح
node scripts/fix/fix-critical-issues.js

# 3. التحقق
node scripts/fix/verify-fixes.js
```

### سيناريو 3: إضافة معرض جديد
```bash
# 1. إضافة المعرض
node scripts/admin/add-tenant.js

# 2. فحص الإعدادات
node scripts/check/check-system.js

# 3. إعادة النشر
node scripts/deploy/force-redeploy.js
```

### سيناريو 4: مراقبة مستمرة
```bash
# بدء المراقبة
node scripts/monitoring/health-monitor.js start

# في terminal آخر - عرض لوحة التحكم
node scripts/monitoring/health-monitor.js dashboard
```

---

## ⚠️ ملاحظات مهمة

### متغيرات البيئة
معظم Scripts تحتاج متغيرات بيئة من `.env`:
- `MONGO_URI` - اتصال قاعدة البيانات
- `JWT_SECRET` - مفتاح JWT
- `SESSION_SECRET` - مفتاح الجلسة
- `ADMIN_EMAIL` - بريد المدير
- `ADMIN_PASSWORD` - كلمة مرور المدير

### الأذونات
بعض Scripts تحتاج أذونات خاصة:
```bash
# على Linux/Mac
chmod +x scripts/setup/*.sh
chmod +x scripts/deploy/*.sh
chmod +x scripts/utils/*.sh
```

### النسخ الاحتياطي
قبل تشغيل scripts الإصلاح أو قاعدة البيانات:
```bash
# نسخ احتياطي
node scripts/monitoring/production-backup.js
```

---

## 🆘 المساعدة

إذا واجهت مشاكل:

1. تحقق من الـ logs في `logs/`
2. راجع التقارير في `reports/`
3. استخدم `check-system.js` للتشخيص
4. راجع التوثيق في `docs/`

---

## 📚 مصادر إضافية

- [دليل Multi-Tenant](../MULTI_TENANT_GUIDE.md)
- [دليل النشر](../DEPLOYMENT_GUIDE.md)
- [دليل الصيانة](../MAINTENANCE_GUIDE.md)

---

**آخر تحديث:** 31 مارس 2026  
**الإصدار:** 2.0.0
