#!/bin/bash

# سكريبت النشر على VPS
# HM CAR - VPS Deployment Script

set -e

echo "🚀 بدء نشر HM CAR..."
echo "═══════════════════════════════════════"

# ألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# المسار الأساسي
PROJECT_DIR="/var/www/hmcar"

# التحقق من وجود المشروع
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ المشروع غير موجود في $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR

# 1. Pull latest changes (إذا كان Git)
if [ -d ".git" ]; then
    print_info "جاري تحديث الكود من Git..."
    git pull origin main
    print_success "تم تحديث الكود"
fi

# 2. Backend Dependencies
print_info "تثبيت Backend Dependencies..."
npm install --production
print_success "تم تثبيت Backend Dependencies"

# 3. Frontend Build
print_info "بناء Frontend..."
cd client-app
npm install
npm run build
cd ..
print_success "تم بناء Frontend"

# 4. Restart Services
print_info "إعادة تشغيل الخدمات..."

# إعادة تشغيل Backend
if pm2 list | grep -q "hmcar-backend"; then
    pm2 restart hmcar-backend
    print_success "تم إعادة تشغيل Backend"
else
    pm2 start server.js --name "hmcar-backend" --env production
    print_success "تم تشغيل Backend"
fi

# إعادة تشغيل Frontend
if pm2 list | grep -q "hmcar-frontend"; then
    pm2 restart hmcar-frontend
    print_success "تم إعادة تشغيل Frontend"
else
    cd client-app
    pm2 start npm --name "hmcar-frontend" -- start
    cd ..
    print_success "تم تشغيل Frontend"
fi

# حفظ إعدادات PM2
pm2 save

# 5. Reload Nginx
print_info "إعادة تحميل Nginx..."
sudo nginx -t && sudo systemctl reload nginx
print_success "تم إعادة تحميل Nginx"

echo ""
echo "═══════════════════════════════════════"
print_success "تم النشر بنجاح!"
echo "═══════════════════════════════════════"
echo ""
print_info "حالة التطبيقات:"
pm2 status
echo ""
