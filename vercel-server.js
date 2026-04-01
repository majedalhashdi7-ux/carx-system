// vercel-server.js - المدخل الرئيسي لبيئة Vercel Serverless

const mongoose = require('mongoose');

// ── ثوابت ──
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV);

const DB_OPTIONS = {
  maxPoolSize: 10, // زيادة للـ serverless
  minPoolSize: 2,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  bufferCommands: false, // أفضل للـ serverless
  retryWrites: true,
  w: 'majority',
  maxIdleTimeMS: 10000, // إغلاق الاتصالات الخاملة
};

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;
  connectionPromise = mongoose.connect(MONGO_URI, DB_OPTIONS)
    .then(() => { connectionPromise = null; })
    .catch((err) => { connectionPromise = null; throw err; });
  return connectionPromise;
}

// قائمة الـ origins المسموح بها
const ALLOWED_ORIGINS = [
  'https://daood.okigo.net',
  'https://www.daood.okigo.net',
  'https://hmcar.xyz',
  'https://www.hmcar.xyz',
  'https://hmcar.okigo.net',
  'https://www.hmcar.okigo.net',
  'https://car-auction-sand.vercel.app',
  'https://client-app-iota-eight.vercel.app',
  'https://hmcar-client-app.vercel.app', // Client App المنفصل
  'https://carx-system.vercel.app', // CarX System
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // السماح فقط للدومينات الموثوقة
  if (origin.endsWith('.okigo.net')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  
  // Vercel domains - فقط للمشروع الحالي
  if (origin.includes('car-auction') && origin.endsWith('.vercel.app')) return true;
  if (origin.includes('client-app') && origin.endsWith('.vercel.app')) return true;
  if (origin.includes('hmcar-client-app') && origin.endsWith('.vercel.app')) return true;
  if (origin.includes('carx-system') && origin.endsWith('.vercel.app')) return true;
  
  return false;
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Tenant-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// CORS middleware للـ serverless
function createCorsMiddleware() {
  return (req, res, next) => {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}

// ── Handler الرئيسي ──
module.exports = async (req, res) => {
  // CORS على مستوى الـ handler - قبل أي شيء
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (!MONGO_URI) {
      return res.status(500).json({ success: false, message: 'MONGO_URI is not set', code: 'MISSING_ENV' });
    }

    try { await connectDB(); } catch (dbError) {
      console.error('[Vercel] DB error:', dbError.message);
    }

    // استخدام App class من modules/app.js
    const App = require('./modules/app');
    const appInstance = new App({
      isServerless: true,
      corsConfig: createCorsMiddleware()
    });
    const expressApp = appInstance.getExpressApp();
    
    return expressApp(req, res);

  } catch (fatalError) {
    console.error('[Vercel] FATAL:', fatalError.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Server initialization failed' });
    }
  }
};
