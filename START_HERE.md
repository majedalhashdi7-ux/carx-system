# 🎯 ابدأ من هنا - نشر hmcar.xyz

## 📊 الحالة الحالية

✅ **تم الإعداد:**
- جميع ملفات الإعدادات محدثة
- Nginx config جاهز
- السكريبتات جاهزة
- الأدلة جاهزة

⏳ **مطلوب منك:**
- إعداد DNS للدومين hmcar.xyz
- الوصول إلى السيرفر 216.198.79.1

---

## 🚀 خطوات التنفيذ (بالترتيب)

### الخطوة 1: إعداد DNS ⚠️ (مطلوب الآن)

**الحالة:** ❌ DNS غير مُعد بعد

**ما تحتاج فعله:**

1. افتح لوحة تحكم الدومين `hmcar.xyz`
2. اذهب إلى DNS Settings / DNS Management
3. أضف هذه السجلات:

```
Type: A
Name: @ (أو اتركه فارغاً)
Value: 216.198.79.1
TTL: 3600

Type: A
Name: www
Value: 216.198.79.1
TTL: 3600
```

4. احفظ التغييرات
5. انتظر 10-30 دقيقة

**للتحقق:**
```bash
nslookup hmcar.xyz
```

يجب أن ترى: `Address: 216.198.79.1`

**دليل مفصل:** [DNS_SETUP_HMCAR_XYZ.md](./DNS_SETUP_HMCAR_XYZ.md)

---

### الخطوة 2: الاتصال بالسيرفر

بعد إعداد DNS:

```bash
ssh root@216.198.79.1
```

إذا لم يكن لديك SSH:
- استخدم PuTTY على Windows
- أو أي SSH client آخر

---

### الخطوة 3: تنفيذ النشر

**على السيرفر:**

#### أ. إعداد السيرفر (مرة واحدة):

```bash
# تحديث النظام
sudo apt-get update && sudo apt-get upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت Nginx
sudo apt-get install -y nginx

# تثبيت PM2
sudo npm install -g pm2

# تثبيت Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Firewall
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### ب. رفع المشروع:

**من جهازك (Windows PowerShell):**

```powershell
# انتقل لمجلد المشروع
cd C:\car-auction

# رفع الملفات
scp -r * root@216.198.79.1:/var/www/hmcar/
```

**أو على السيرفر باستخدام Git:**

```bash
cd /var/www
git clone [your-repo-url] hmcar
```

#### ج. التثبيت والبناء:

```bash
cd /var/www/hmcar

# Backend
npm install --production

# Frontend
cd client-app
npm install
npm run build
cd ..
```

#### د. إعداد Nginx:

```bash
sudo cp nginx-hmcar.conf /etc/nginx/sites-available/hmcar
sudo ln -s /etc/nginx/sites-available/hmcar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### هـ. SSL Certificate:

```bash
sudo certbot --nginx -d hmcar.xyz -d www.hmcar.xyz
```

#### و. تشغيل التطبيق:

```bash
cd /var/www/hmcar
pm2 start server.js --name hmcar-backend
cd client-app
pm2 start npm --name hmcar-frontend -- start
cd ..
pm2 save
pm2 startup
```

---

## ✅ التحقق

```bash
# حالة التطبيقات
pm2 status

# فحص API
curl https://hmcar.xyz/api/health

# السجلات
pm2 logs
```

**في المتصفح:**
- https://hmcar.xyz

---

## 📚 الأدلة المساعدة

### للمبتدئين:
1. [DNS_SETUP_HMCAR_XYZ.md](./DNS_SETUP_HMCAR_XYZ.md) - إعداد DNS
2. [HMCAR_XYZ_DEPLOYMENT.md](./HMCAR_XYZ_DEPLOYMENT.md) - دليل النشر الكامل

### للمتقدمين:
3. [EXECUTE_DEPLOYMENT.md](./EXECUTE_DEPLOYMENT.md) - أوامر سريعة
4. [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) - دليل شامل

### للمراجعة:
5. [VPS_DEPLOYMENT_CHECKLIST.md](./VPS_DEPLOYMENT_CHECKLIST.md) - قائمة تحقق
6. [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - ملخص

---

## 🎯 الخطوة الحالية

**أنت الآن في:** الخطوة 1 - إعداد DNS

**ما تحتاج فعله:**
1. ✅ افتح لوحة تحكم hmcar.xyz
2. ✅ أضف سجلات DNS (A Records)
3. ✅ انتظر 10-30 دقيقة
4. ✅ تحقق من DNS: `nslookup hmcar.xyz`
5. ✅ بعد ذلك، اتصل بالسيرفر ونفذ الخطوات

---

## 📞 هل تحتاج مساعدة؟

**لإعداد DNS:**
- راجع [DNS_SETUP_HMCAR_XYZ.md](./DNS_SETUP_HMCAR_XYZ.md)

**للنشر:**
- راجع [HMCAR_XYZ_DEPLOYMENT.md](./HMCAR_XYZ_DEPLOYMENT.md)

**لحل المشاكل:**
- راجع قسم "حل المشاكل" في أي دليل

---

**الحالة:** ⏳ في انتظار إعداد DNS  
**الخطوة التالية:** إعداد DNS للدومين hmcar.xyz  
**التاريخ:** 2026-03-28
