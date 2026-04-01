# 🚀 تنفيذ النشر - hmcar.xyz

## 📋 حالة التنفيذ

**الدومين:** hmcar.xyz  
**IP:** 216.198.79.1  
**التاريخ:** 2026-03-28

---

## ✅ المرحلة 1: التحضير (مكتمل)

- ✅ تحديث `.env`
- ✅ تحديث `client-app/.env.production`
- ✅ تحديث `nginx-hmcar.conf`
- ✅ إنشاء جميع الأدلة
- ✅ إنشاء السكريبتات

---

## 🔄 المرحلة 2: إعداد DNS (يدوي - مطلوب منك)

### الخطوات:

1. **افتح لوحة تحكم الدومين hmcar.xyz**

2. **اذهب إلى DNS Management**

3. **أضف السجلات التالية:**

```
Type: A
Name: @
Value: 216.198.79.1
TTL: 3600

Type: A
Name: www
Value: 216.198.79.1
TTL: 3600
```

4. **احذف أي سجلات قديمة** تشير إلى عناوين أخرى

5. **احفظ التغييرات**

6. **انتظر 10-30 دقيقة** لانتشار DNS

7. **تحقق من DNS:**
```bash
nslookup hmcar.xyz
```

---

## 🖥️ المرحلة 3: النشر على السيرفر

### الخطوة 1: الاتصال بالسيرفر

```bash
ssh root@216.198.79.1
```

### الخطوة 2: إعداد السيرفر (مرة واحدة فقط)

```bash
# تحديث النظام
sudo apt-get update && sudo apt-get upgrade -y

# تثبيت Node.js v22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت Nginx
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# تثبيت PM2
sudo npm install -g pm2

# تثبيت Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# إعداد Firewall
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# إنشاء مجلد المشروع
sudo mkdir -p /var/www/hmcar
sudo chown -R $USER:$USER /var/www/hmcar
```

### الخطوة 3: رفع المشروع

**خيار A: من جهازك باستخدام SCP**

```bash
# من Windows (PowerShell)
scp -r C:\car-auction\* root@216.198.79.1:/var/www/hmcar/
```

**خيار B: استخدام Git**

```bash
# على السيرفر
cd /var/www
git clone [your-repo-url] hmcar
```

### الخطوة 4: إعداد Environment Variables

```bash
cd /var/www/hmcar

# Backend
cat > .env << 'EOF'
ALLOWED_ORIGINS="https://hmcar.xyz,https://www.hmcar.xyz"
BASE_URL="https://hmcar.xyz"
BCRYPT_ROUNDS="8"
CLOUDINARY_API_KEY="972165144124738"
CLOUDINARY_API_SECRET="MhvHGsOgAtuURenr_H9cMUOBpx4"
CLOUDINARY_CLOUD_NAME="dndy0luqc"
EMAIL_PASS="nakdvllltbaxwbpd"
EMAIL_SERVICE="gmail"
EMAIL_USER="divdhash9@gmail.com"
ENABLE_DEV_ADMIN="false"
JWT_SECRET="5a7c12c08ba86c78b6fafda82c4bf621122a6c98aa331c6bedb0bd7b7d7cba22dcdd78d57ac6833b03b41918e3280117"
KV_REST_API_READ_ONLY_TOKEN="ggAAAAAAAUbUAAIgcDHUES2f7K_PvusZ7tEuFph0aRVLXpLOpwllFh8XS444UA"
KV_REST_API_TOKEN="gQAAAAAAAUbUAAIncDE3YzM0YTAxMDEyYjM0YzdhOWYwNDM2MWFkNTk3MzUwZHAxODM2Njg"
KV_REST_API_URL="https://brave-drake-83668.upstash.io"
KV_URL="rediss://default:gQAAAAAAAUbUAAIncDE3YzM0YTAxMDEyYjM0YzdhOWYwNDM2MWFkNTk3MzUwZHAxODM2Njg@brave-drake-83668.upstash.io:6379"
MONGO_URI="mongodb+srv://hmcar_user:Daood11223345@cluster0.tirfqnb.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0"
NODE_ENV="production"
PORT="4001"
PROD_ADMIN_EMAIL="admin@hmcar.com"
PROD_ADMIN_NAME="HM Car Admin"
PROD_ADMIN_PASSWORD="HmCar@2026!"
REDIS_URL="rediss://default:gQAAAAAAAUbUAAIncDE3YzM0YTAxMDEyYjM0YzdhOWYwNDM2MWFkNTk3MzUwZHAxODM2Njg@brave-drake-83668.upstash.io:6379"
SESSION_SECRET="fed2f48619b92bb38236503548d11686ab9cde64c856d0d49a157a439df7645be9969d9fe508ba3c66998e497a87fc0e"
VERCEL="1"
VERCEL_ENV="production"
EOF

# Frontend
cd client-app
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://hmcar.xyz
NEXT_PUBLIC_SOCKET_URL=https://hmcar.xyz
NODE_ENV=production
EOF
cd ..
```

### الخطوة 5: تثبيت Dependencies والبناء

```bash
cd /var/www/hmcar

# Backend
echo "📦 تثبيت Backend Dependencies..."
npm install --production

# Frontend
echo "📦 تثبيت وبناء Frontend..."
cd client-app
npm install
npm run build
cd ..

echo "✅ اكتمل التثبيت والبناء"
```

### الخطوة 6: إعداد Nginx

```bash
# نسخ ملف الإعداد
sudo cp /var/www/hmcar/nginx-hmcar.conf /etc/nginx/sites-available/hmcar

# إنشاء symlink
sudo ln -s /etc/nginx/sites-available/hmcar /etc/nginx/sites-enabled/

# حذف الإعداد الافتراضي
sudo rm -f /etc/nginx/sites-enabled/default

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx

echo "✅ تم إعداد Nginx"
```

### الخطوة 7: الحصول على SSL Certificate

```bash
# الحصول على الشهادة
sudo certbot --nginx -d hmcar.xyz -d www.hmcar.xyz --non-interactive --agree-tos --email admin@hmcar.xyz --redirect

echo "✅ تم إعداد SSL"
```

### الخطوة 8: تشغيل التطبيق

```bash
cd /var/www/hmcar

# Backend
pm2 start server.js --name "hmcar-backend" --env production

# Frontend
cd client-app
pm2 start npm --name "hmcar-frontend" -- start
cd ..

# حفظ الإعدادات
pm2 save

# تفعيل التشغيل التلقائي
pm2 startup

echo "✅ التطبيق يعمل الآن!"
```

---

## ✅ المرحلة 4: التحقق

### 1. حالة التطبيقات

```bash
pm2 status
```

### 2. فحص API

```bash
curl https://hmcar.xyz/api/health
```

### 3. فحص الموقع

افتح المتصفح: https://hmcar.xyz

### 4. السجلات

```bash
pm2 logs
```

---

## 📝 ملاحظات مهمة

1. **DNS:** يجب إعداد DNS أولاً قبل البدء بالنشر
2. **SSL:** لن يعمل Certbot إلا بعد انتشار DNS
3. **Ports:** تأكد من أن Ports 80, 443, 4001, 3000 متاحة
4. **Firewall:** تأكد من فتح Ports في UFW

---

## 🐛 حل المشاكل السريع

### Port مشغول:
```bash
sudo lsof -ti:4001 | xargs kill -9
sudo lsof -ti:3000 | xargs kill -9
```

### Nginx Error:
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### PM2 Error:
```bash
pm2 delete all
pm2 start server.js --name hmcar-backend
cd client-app && pm2 start npm --name hmcar-frontend -- start
```

---

## 📞 الدعم

راجع الأدلة التفصيلية:
- [HMCAR_XYZ_DEPLOYMENT.md](./HMCAR_XYZ_DEPLOYMENT.md)
- [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md)

---

**الحالة:** جاهز للتنفيذ  
**الخطوة التالية:** إعداد DNS ثم الاتصال بالسيرفر
