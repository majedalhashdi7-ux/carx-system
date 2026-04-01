#!/bin/bash

# 🚀 سكريبت إعداد مستودع client-app المنفصل
# التاريخ: 2026-03-31

echo "=================================="
echo "🚀 إعداد مستودع client-app المنفصل"
echo "=================================="
echo ""

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# الخطوة 1: التحقق من وجود client-app
echo -e "${BLUE}[1/6]${NC} التحقق من وجود مجلد client-app..."
if [ ! -d "client-app" ]; then
    echo -e "${RED}❌ خطأ: مجلد client-app غير موجود${NC}"
    exit 1
fi
echo -e "${GREEN}✅ مجلد client-app موجود${NC}"
echo ""

# الخطوة 2: الدخول إلى مجلد client-app
echo -e "${BLUE}[2/6]${NC} الدخول إلى مجلد client-app..."
cd client-app
echo -e "${GREEN}✅ تم الدخول إلى client-app${NC}"
echo ""

# الخطوة 3: التحقق من عدم وجود git repository
echo -e "${BLUE}[3/6]${NC} التحقق من حالة Git..."
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  يوجد git repository بالفعل${NC}"
    echo -e "${YELLOW}هل تريد حذفه وإنشاء واحد جديد؟ (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf .git
        echo -e "${GREEN}✅ تم حذف Git repository القديم${NC}"
    else
        echo -e "${RED}❌ تم الإلغاء${NC}"
        exit 1
    fi
fi
echo ""

# الخطوة 4: إنشاء git repository جديد
echo -e "${BLUE}[4/6]${NC} إنشاء Git repository جديد..."
git init
echo -e "${GREEN}✅ تم إنشاء Git repository${NC}"
echo ""

# الخطوة 5: إضافة الملفات
echo -e "${BLUE}[5/6]${NC} إضافة الملفات..."
git add .
git commit -m "Initial commit: HM CAR Client App - Multi-Tenant Platform

✨ الميزات:
- Multi-Tenant Architecture
- Real-time Auctions
- Mobile Apps (iOS & Android)
- 3D Graphics
- Responsive Design
- SEO Optimized

🚀 جاهز للنشر على Vercel"

echo -e "${GREEN}✅ تم إضافة الملفات والـ commit${NC}"
echo ""

# الخطوة 6: إعداد Remote
echo -e "${BLUE}[6/6]${NC} إعداد GitHub Remote..."
echo -e "${YELLOW}الآن يجب عليك:${NC}"
echo ""
echo "1. اذهب إلى GitHub: https://github.com/new"
echo "2. أنشئ repository جديد باسم: client-app"
echo "3. اختر Private أو Public"
echo "4. لا تضف README أو .gitignore (موجودين بالفعل)"
echo "5. اضغط Create Repository"
echo ""
echo "6. ثم نفذ الأوامر التالية:"
echo ""
echo -e "${GREEN}git remote add origin https://github.com/majedalhashdi7-ux/client-app.git${NC}"
echo -e "${GREEN}git branch -M main${NC}"
echo -e "${GREEN}git push -u origin main${NC}"
echo ""
echo -e "${BLUE}=================================="
echo "✅ الإعداد المحلي اكتمل!"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}الخطوات التالية:${NC}"
echo "1. أنشئ repository على GitHub"
echo "2. نفذ الأوامر أعلاه"
echo "3. اذهب إلى Vercel وانشر المشروع"
echo ""
