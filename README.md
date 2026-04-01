# 🚗 Multi-Tenant Car Auction System

## النظام الشامل لمزادات السيارات متعدد العملاء

### 🎯 المشاريع المتاحة

#### 1. **HM CAR** (client-app)
- **الوصف**: منصة مزادات ومبيعات السيارات الفاخرة
- **الدومين**: https://daood.okigo.net
- **المجلد**: `client-app/`
- **اللون الأساسي**: ذهبي (#D4AF37)

#### 2. **CAR X** (carx-system)  
- **الوصف**: معرض وأمزاد CAR X
- **الدومين**: https://daood.okigo.net (نفس الدومين، معرض مختلف)
- **المجلد**: `carx-system/`
- **اللون الأساسي**: أسود وأحمر (#000000, #ff0000)

### 🚀 التشغيل السريع

#### تشغيل HM CAR:
```bash
cd client-app
npm install
npm run dev
# يعمل على http://localhost:3000
```

#### تشغيل CAR X:
```bash
cd carx-system  
npm install
npm run dev
# يعمل على http://localhost:3001
```

### 🔧 الإعدادات

#### متغيرات البيئة المطلوبة في Vercel:
```
MONGO_URI=mongodb+srv://hmcar_user:PASSWORD@cluster.mongodb.net/hmcar_production
MONGO_URI_CARX=mongodb+srv://carx_user:PASSWORD@cluster.mongodb.net/carx_production
NEXTAUTH_SECRET=your-secure-secret-key
ADMIN_PASSWORD=your-secure-admin-password
```

### 📁 هيكل المشروع
```
├── client-app/          # HM CAR System
├── carx-system/         # CAR X System  
├── tenants/            # إعدادات العملاء
├── scripts/            # سكريبتات الإدارة
└── README.md           # هذا الملف
```

### 🔐 الأمان
- جميع كلمات السر في متغيرات البيئة
- لا توجد بيانات حساسة في الكود
- تشفير قواعد البيانات
- حماية من CSRF و XSS

### 📞 الدعم
- **الإيميل**: dawoodalhash@gmail.com
- **واتساب**: +967781007805

---
*آخر تحديث: ٣٠‏/٣‏/٢٠٢٦*
