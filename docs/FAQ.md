# الأسئلة الشائعة - HM CAR

**Frequently Asked Questions**

---

## 🤔 أسئلة عامة

### ما هو HM CAR؟
نظام مزادات سيارات متعدد المستأجرين (Multi-Tenant) احترافي مبني بـ Node.js و Next.js.

### هل النظام مجاني؟
نعم، الكود مفتوح المصدر تحت رخصة MIT.

### ما هي المتطلبات؟
- Node.js 22.x
- MongoDB 6.x
- Redis (اختياري)

---

## 🏗️ أسئلة تقنية

### كيف أضيف tenant جديد؟
```bash
npm run add:tenant
# اتبع التعليمات
```

### كيف أغير theme لـ tenant؟
عدّل `tenants.json`:
```json
{
  "theme": {
    "primaryColor": "#1a73e8",
    "logo": "/logos/tenant.png"
  }
}
```

### كيف أضيف API endpoint جديد؟
راجع [دليل التطوير](DEVELOPMENT_GUIDE.md#api-development)

---

## 🧪 أسئلة الاختبارات

### كيف أشغل الاختبارات؟
```bash
npm test              # جميع الاختبارات
npm run test:unit     # Unit tests
npm run test:e2e      # E2E tests
```

### لماذا بعض الاختبارات تفشل؟
راجع [دليل حل المشاكل](TROUBLESHOOTING.md#test-failures)

---

## 🚀 أسئلة النشر

### كيف أنشر على Vercel؟
راجع [دليل النشر](DEPLOYMENT_GUIDE.md)

### هل يمكن النشر على AWS؟
نعم، لكن يحتاج تعديلات. راجع التوثيق.

---

## 📞 الدعم

لم تجد إجابة؟
- 📧 support@hmcar.com
- 💬 Discord: https://discord.gg/hmcar

---

**Last Updated:** March 31, 2026
