#!/bin/bash

# CAR X System Setup Script
# سكريبت إعداد نظام CAR X

echo "🚀 بدء إعداد نظام CAR X..."

# تثبيت المكتبات
echo "📦 تثبيت المكتبات..."
npm install

# نسخ ملف البيئة
echo "⚙️ إعداد متغيرات البيئة..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ تم إنشاء ملف .env"
    echo "⚠️  يرجى تعديل متغيرات البيئة في ملف .env"
else
    echo "✅ ملف .env موجود مسبقاً"
fi

# فحص Node.js version
NODE_VERSION=$(node -v)
echo "📋 إصدار Node.js: $NODE_VERSION"

# فحص npm version  
NPM_VERSION=$(npm -v)
echo "📋 إصدار npm: $NPM_VERSION"

# إنشاء مجلدات إضافية
echo "📁 إنشاء المجلدات المطلوبة..."
mkdir -p public/images
mkdir -p public/icons
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/utils

echo "✅ تم إعداد نظام CAR X بنجاح!"
echo ""
echo "🔧 الخطوات التالية:"
echo "1. عدّل ملف .env بالإعدادات الصحيحة"
echo "2. شغّل الأمر: npm run dev"
echo "3. افتح المتصفح على: http://localhost:3001"
echo ""
echo "📚 للمزيد من المعلومات، راجع:"
echo "- README.md"
echo "- DEPLOYMENT_GUIDE.md"
echo ""
echo "🎉 نظام CAR X جاهز للعمل!"