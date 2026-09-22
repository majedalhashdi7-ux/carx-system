/**
 * @file server.js
 * @description نقطة الدخول للخادم المستمر على Render
 * يدعم Socket.io WebSocket بشكل كامل + Multi-Tenant + Keep-Alive
 */
'use strict';

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('./middleware/auth').getJwtSecret();

// التحقق من MongoDB URI
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI_HMCAR;

if (!MONGO_URI) {
  console.error('[server] MONGO_URI is not set. Exiting.');
  process.exit(1);
}

// تأكد من أن process.env.MONGO_URI موجود لأن database.js يقرأه عبر config
process.env.MONGO_URI = MONGO_URI;

const PORT = parseInt(process.env.PORT || '4001', 10);

// ── التحميل ──
const App          = require('./modules/app');
const database     = require('./modules/core/database');
const socketModule = require('./modules/socket');

// ── Express App ──
const appInstance = new App({ isServerless: false, port: PORT });
appInstance.registerErrorHandlers();
const expressApp = appInstance.getExpressApp();

// ── HTTP Server ──
const server = http.createServer(expressApp);

// ── Keep-Alive Ping (يمنع Render Free من السكون) ──
function startKeepAlivePing() {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const INTERVAL   = 14 * 60 * 1000; // 14 دقيقة

  // [[FIX]] اختيار http أو https تلقائياً حسب البروتوكول
  const httpClient = RENDER_URL.startsWith('https') ? require('https') : require('http');

  setInterval(() => {
    httpClient.get(`${RENDER_URL}/api/health`, (res) => {
      console.log(`[keep-alive] ${res.statusCode}`);
      // استهلاك البيانات لمنع تسرب الذاكرة
      res.resume();
    }).on('error', (err) => {
      console.warn(`[keep-alive] failed: ${err.message}`);
    });
  }, INTERVAL);

  console.log(`[keep-alive] Active — pinging every 14 min`);
}

// ── Graceful Shutdown ──
function gracefulShutdown(signal) {
  console.log(`[server] ${signal} — shutting down...`);
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      console.log('[server] MongoDB closed. Bye.');
      process.exit(0);
    });
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('uncaughtException',  (err) => console.error('[server] Uncaught:', err.message));
process.on('unhandledRejection', (r)   => console.error('[server] Unhandled:', r));

// ── بدء الخادم ──
async function startServer() {
  try {
    // 1. قاعدة البيانات
    await database.connect();
    console.log('[server] MongoDB connected');

    // 2. تشغيل الخادم
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] HM CAR Backend running on port ${PORT}`);
      console.log(`[server] NODE_ENV: ${process.env.NODE_ENV || 'production'}`);
    });

    // 3. Socket.io — يستخدم إعداداته المدمجة في modules/socket.js
    socketModule.init(server);
    console.log('[server] Socket.io initialized — WebSocket ENABLED');

    // 4. Keep-Alive
    if (process.env.RENDER || process.env.NODE_ENV === 'production') {
      startKeepAlivePing();
    }

  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

startServer();
