// [[ARABIC_HEADER]] هذا الملف (modules/core/database.js) جزء من مشروع HM CAR

/**
 * [[ملف الاتصال بقاعدة البيانات]] - modules/core/database.js
 * مُحسَّن لـ Vercel Serverless + MongoDB Atlas
 * - إدارة الاتصال مع connection caching
 * - timeout مناسب لـ Atlas cold start
 */

const mongoose = require('mongoose');
const config = require('./config');

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.NOW_REGION);

/**
 * فئة لإدارة قاعدة البيانات
 */
class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this._connectingPromise = null;
  }

  /**
   * الاتصال بقاعدة البيانات
   */
  async connect() {
    // إذا كان متصلاً بالفعل، لا تعد
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return this.connection;
    }

    // تجنب التوازي في الاتصال
    if (this._connectingPromise) {
      return this._connectingPromise;
    }

    this._connectingPromise = this._doConnect()
      .finally(() => { this._connectingPromise = null; });

    return this._connectingPromise;
  }

  async _doConnect() {
    try {
      console.log('🔄 جاري الاتصال بقاعدة البيانات...');

      let uri = config.database.uri;

      // دعم وضع الذاكرة (memory://) للتطوير المحلي
      if (uri && uri.startsWith('memory://')) {
        console.log('📦 استخدام MongoDB في الذاكرة (in-memory)...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        this.memoryServer = await MongoMemoryServer.create({
          instance: { dbName: 'car-auction' },
        });
        uri = this.memoryServer.getUri();
        console.log('✅ تم تشغيل MongoDB في الذاكرة');
      }

      // إعدادات الاتصال - مُحسَّنة لـ Vercel Serverless + Atlas
      const options = {
        maxPoolSize: IS_SERVERLESS ? 5 : 10,
        serverSelectionTimeoutMS: 20000,  // 20 ثانية لـ Atlas cold start
        socketTimeoutMS: 45000,
        connectTimeoutMS: 20000,
        bufferCommands: true,
        retryWrites: true,
      };

      // الاتصال
      this.connection = await mongoose.connect(uri, options);
      this.isConnected = true;
      console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

      // تخطي الـ seeding في Vercel (قاعدة البيانات جاهزة)
      if (IS_SERVERLESS || process.env.SKIP_SEED === 'true') {
        console.log('⏭️ تخطي seeding في بيئة Serverless...');
        return this.connection;
      }

      // إنشاء حساب المشرف التلقائي إذا كان مفعلاً (للتطوير فقط)
      await this.seedDevAdmin();
      await this.seedDemoData();

      return this.connection;
    } catch (error) {
      console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * إنشاء حساب مشرف تلقائي للتطوير
   */
  async seedDevAdmin() {
    if (process.env.ENABLE_DEV_ADMIN !== 'true') return;
    try {
      const User = require('../../models/User');
      const existing = await User.findOne({ email: process.env.DEV_ADMIN_EMAIL });
      if (!existing) {
        await User.create({
          name: process.env.DEV_ADMIN_NAME || 'Admin',
          email: process.env.DEV_ADMIN_EMAIL,
          password: process.env.DEV_ADMIN_PASSWORD,
          role: 'admin',
          isActive: true,
        });
        console.log(`👤 تم إنشاء حساب المشرف: ${process.env.DEV_ADMIN_EMAIL}`);
      }
    } catch (e) {
      console.warn('⚠️ تعذر إنشاء حساب المشرف:', e.message);
    }
  }

  /**
   * إضافة بيانات تجريبية (سيارات) للواجهة
   */
  async seedDemoData() {
    if (process.env.ENABLE_DEV_ADMIN !== 'true') return;
    try {
      const Car = require('../../models/Car');
      const carsCount = await Car.countDocuments();

      if (carsCount === 0) {
        console.log('🌱 جاري إضافة بيانات تجريبية (سيارات)...');

        const demoCars = [
          {
            title: 'Mercedes-Benz S-Class 2024',
            make: 'Mercedes',
            model: 'S-Class',
            year: 2024,
            price: 450000,
            priceSar: 450000,
            mileage: 5000,
            images: ['/images/photo_2026-02-07_22-24-18.jpg'],
            description: 'Luxury sedan with full options.',
            fuelType: 'Petrol',
            transmission: 'Automatic',
            color: 'Black',
            condition: 'excellent',
            isActive: true,
            listingType: 'store'
          },
          {
            title: 'BMW X7 2024',
            make: 'BMW',
            model: 'X7',
            year: 2024,
            price: 380000,
            priceSar: 380000,
            mileage: 12000,
            images: ['/images/photo_2026-02-07_22-24-39.jpg'],
            description: 'Premium SUV for family.',
            fuelType: 'Diesel',
            transmission: 'Automatic',
            color: 'White',
            condition: 'excellent',
            isActive: true,
            listingType: 'store'
          },
        ];

        await Car.create(demoCars);
        console.log(`✅ تم إضافة ${demoCars.length} سيارات تجريبية`);
      }
    } catch (e) {
      console.warn('⚠️ تعذر إضافة بيانات تجريبية:', e.message);
    }
  }

  /**
   * قطع الاتصال بقاعدة البيانات
   */
  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
      }
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال:', error.message);
      throw error;
    }
  }

  /**
   * التحقق من حالة الاتصال
   */
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * الحصول على حالة الاتصال
   */
  getStatus() {
    const states = {
      0: 'منقطع',
      1: 'متصل',
      2: 'جاري الاتصال',
      3: 'جاري قطع الاتصال'
    };

    return {
      state: states[mongoose.connection.readyState],
      isConnected: this.isConnected,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// إنشاء نسخة واحدة من مدير قاعدة البيانات
const databaseManager = new DatabaseManager();

// أحداث قاعدة البيانات
mongoose.connection.on('connected', () => {
  console.log('📊 قاعدة البيانات متصلة');
  databaseManager.isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ خطأ في قاعدة البيانات:', err.message);
  databaseManager.isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('📊 قاعدة البيانات منقطعة');
  databaseManager.isConnected = false;
});

// عند إغلاق التطبيق (غير مطلوب في Serverless)
if (!IS_SERVERLESS) {
  process.on('SIGINT', async () => {
    await databaseManager.disconnect();
    process.exit(0);
  });
}

module.exports = databaseManager;
