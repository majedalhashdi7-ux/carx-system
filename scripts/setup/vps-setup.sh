#!/bin/bash

# سكريبت الإعداد التلقائي لـ VPS
# HM CAR - VPS Setup Script

set -e

echo "🚀 بدء إعداد HM CAR على VPS..."
echo "═══════════════════════════════════════"

# ألوان للطباعة
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# دالة للطباعة الملونة
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# التحقق من الصلاحيات
if [ "$EUID" -eq 0 ]; then 
    print_error "لا تشغل هذا السكريبت كـ root. استخدم sudo عند الحاجة."
    exit 1
fi

# 1. تحديث النظام
print_info "تحديث النظام..."
sudo apt-get update
sudo apt-get upgrade -y
print_success "تم تحديث النظام"

# 2. تثبيت Node.js
print_info "تثبيت Node.js v22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "تم تثبيت Node.js $(node -v)"
else
    print_success "Node.js موجود بالفعل: $(node -v)"
fi

# 3. تثبيت Nginx
print_info "تثبيت Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_success "تم تثبيت Nginx"
else
    print_success "Nginx موجود بالفعل"
fi

# 4. تثبيت PM2
print_info "تثبيت PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "تم تثبيت PM2"
else
    print_success "PM2 موجود بالفعل"
fi

# 5. تثبيت Certbot
print_info "تثبيت Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
    print_success "تم تثبيت Certbot"
else
    print_success "Certbot موجود بالفعل"
fi

# 6. إعداد Firewall
print_info "إعداد Firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
print_success "تم إعداد Firewall"

# 7. إنشاء مجلد المشروع
print_info "إنشاء مجلد المشروع..."
sudo mkdir -p /var/www/hmcar
sudo chown -R $USER:$USER /var/www/hmcar
print_success "تم إنشاء مجلد المشروع"

echo ""
echo "═══════════════════════════════════════"
print_success "تم إعداد السيرفر بنجاح!"
echo "═══════════════════════════════════════"
echo ""
print_info "الخطوات التالية:"
echo "1. ارفع المشروع إلى /var/www/hmcar"
echo "2. أنشئ ملف .env بالإعدادات المطلوبة"
echo "3. نفذ: cd /var/www/hmcar && npm install"
echo "4. نفذ: cd /var/www/hmcar/client-app && npm install && npm run build"
echo "5. أعد إعداد Nginx (راجع VPS_DEPLOYMENT_GUIDE.md)"
echo "6. احصل على SSL: sudo certbot --nginx -d [your-domain.com]"
echo "7. شغل التطبيق: pm2 start server.js --name hmcar-backend"
echo ""
