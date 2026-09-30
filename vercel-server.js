// vercel-server.js - Vercel Serverless Entry Point with Multi-Tenant Support

/**
 * @file vercel-server.js
 * @description ط§ظ„ظ…ط¯ط®ظ„ ط§ظ„ط±ط¦ظٹط³ظٹ ظ„ط¨ظٹط¦ط© Vercel Serverless ظ…ط¹ ط¯ط¹ظ… Multi-Tenant
 * 
 * ظƒظ„ ط·ظ„ط¨ ظٹظڈط­ظ„ظ‘ظ„ ظ„طھط­ط¯ظٹط¯ ط§ظ„ظ…ط¹ط±ط¶ (Tenant) ط«ظ… ظٹطھطµظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط®ط§طµط© ط¨ظ‡.
 * ظٹط³طھط®ط¯ظ… tenant-db-manager ظ„ط¥ط¯ط§ط±ط© ط§طھطµط§ظ„ط§طھ ظ…ط³طھظ‚ظ„ط© ظ„ظƒظ„ ظ…ط¹ط±ط¶.
 */

const { getAllTenants } = require('./tenants/tenant-resolver');
const { getConnectionsStatus } = require('./tenants/tenant-db-manager');
const { generalLimiter, authLimiter, strictLimiter } = require('./middleware/rateLimiter');

// â”€â”€ ط«ظˆط§ط¨طھ â”€â”€
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV);
require('./middleware/auth').getJwtSecret();

/**
 * طھط­ظ…ظٹظ„ ظ‚ط§ط¦ظ…ط© ط§ظ„ظ€ origins ط§ظ„ظ…ط³ظ…ظˆط­ ط¨ظ‡ط§ ظ…ظ† tenants.json
 * ظٹط¬ظ…ط¹ ظƒظ„ ط¯ظˆظ…ظٹظ†ط§طھ ظƒظ„ ط§ظ„ظ…ط¹ط§ط±ط¶ ط§ظ„ظ…ظپط¹ظ‘ظ„ط©
 */
function getAllowedOrigins() {
  const origins = [];
  
  try {
    const tenants = getAllTenants();
    
    for (const tenant of tenants) {
      if (tenant.domains && Array.isArray(tenant.domains)) {
        for (const domain of tenant.domains) {
          // ط¥ط¶ط§ظپط© ط§ظ„ط¯ظˆظ…ظٹظ† ط¨طµظٹط؛طھظٹظ‡ (ظ…ط¹ ظˆط¨ط¯ظˆظ† https)
          origins.push(`https://${domain}`);
          origins.push(`http://${domain}`);
        }
      }
    }
  } catch (err) {
    console.warn('[Vercel] Could not load tenant domains:', err.message);
  }
  
  // ط¥ط¶ط§ظپط© ط§ظ„ط¯ظˆظ…ظٹظ†ط§طھ ط§ظ„ط«ط§ط¨طھط© ظ„ظ„طھظˆط§ظپظ‚ظٹط©
  const staticOrigins = [
    'https://hmcar-system-two.vercel.app',
    'https://www.hmcar-system-two.vercel.app',
    'https://hmcar.xyz',
    'https://www.hmcar.xyz',
    'https://hmcar.okigo.net',
    'https://www.hmcar.okigo.net',
    'https://carx-system-five.vercel.app',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : []),
  ];

  // ط¥ط¶ط§ظپط© ظ…ط´ط§ط±ظٹط¹ Vercel ط§ظ„ظ…طµط±ط­ ط¨ظ‡ط§ ظ…ظ† ط§ظ„ظ…طھط؛ظٹط± ط§ظ„ط¨ظٹط¦ظٹ VERCEL_ALLOWED_PROJECTS
  const vercelProjects = (process.env.VERCEL_ALLOWED_PROJECTS || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  for (const proj of vercelProjects) {
    staticOrigins.push(`https://${proj}.vercel.app`);
    staticOrigins.push(`https://www.${proj}.vercel.app`);
  }

  return [...new Set([...origins, ...staticOrigins])];
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ€ origin ظ…ط³ظ…ظˆط­ ط¨ظ‡
 */
function isOriginAllowed(origin) {
  if (!origin) return true;
  
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) return true;
  
  // ط§ظ„ط³ظ…ط§ط­ ظ„ظ„ط¯ظˆظ…ظٹظ†ط§طھ ط§ظ„ظ…ظˆط«ظˆظ‚ط©
  if (origin.endsWith('.okigo.net')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  
  // Vercel domains ظ„ظ„ظ…ط´ط§ط±ظٹط¹ ط§ظ„ط­ط§ظ„ظٹط©
  // ط¯ط¹ظ… ظ†ط·ط§ظ‚ط§طھ Vercel preview ط¨ط´ظƒظ„ ظ…ط±ظ†
  if (origin.endsWith('.vercel.app')) {
    // Allow all .vercel.app if explicitly enabled (use with caution)
    const allowAny = String(process.env.ALLOW_ANY_VERCEL_PREVIEW || '').toLowerCase() === 'true';
    if (allowAny) return true;

    // Allow if origin includes any project listed in VERCEL_ALLOWED_PROJECTS
    const vercelProjects = (process.env.VERCEL_ALLOWED_PROJECTS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    for (const proj of vercelProjects) {
      if (proj && origin.includes(proj)) return true;
    }

    // Fallback: allow common internal project slugs for backward-compatibility
    const allowedVercelPatterns = [
      'car-auction',
      'client-app',
      'hmcar-client-app',
      'hmcar-system',
      'carx-system',
    ];
    for (const pattern of allowedVercelPatterns) {
      if (origin.includes(pattern)) return true;
    }
  }
  
  return false;
}

/**
 * طھط¹ظٹظٹظ† headers ط§ظ„ظ€ CORS
 */
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

/**
 * CORS middleware ظ„ظ„ظ€ serverless
 */
function createCorsMiddleware() {
  return (req, res, next) => {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}
  };
}

/**
 * ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ MONGO_URI ظ„ظ„ظ…ط¹ط±ط¶ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ ظˆطھطµط­ظٹط­ ط§ظ„طھظ†ط³ظٹظ‚ ط§ظ„ط¹ط´ظˆط§ط¦ظٹ
 */
function hasValidMongoUri() {
  // [[FIX]] طھط±طھظٹط¨ ط§ظ„ط£ظˆظ„ظˆظٹط©: MONGO_URI â†’ MONGODB_URI â†’ MONGO_URI_PRODUCTION
  let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI_HMCAR;

  // If a global MONGO_URI is present, normalize and use it
  if (mongoUri) {
    mongoUri = String(mongoUri).replace(/^"|"$/g, '').trim();
    process.env.MONGO_URI = mongoUri;
    process.env.MONGODB_URI = mongoUri;
    return mongoUri.startsWith('mongodb');
  }

  // No global URI: check tenants for per-tenant URIs
  try {
    const tenants = getAllTenants();
    for (const t of tenants) {
      if (t.mongoUri && String(t.mongoUri).trim().startsWith('mongodb')) {
        console.warn(`âڑ ï¸ڈ [Vercel] No global MONGO_URI but found tenant-specific URI for tenant ${t.id}`);
        // do not override process.env.MONGO_URI here; tenant resolver will provide URIs per-tenant
        return true;
      }
    }
  } catch (e) {
    console.warn('[Vercel] could not inspect tenant URIs:', e.message);
  }

  console.error('â‌Œ No usable MongoDB URI found (global MONGO_URI or tenant-specific).');
  return false;
}

// â”€â”€ App Instance Cache (ظ…ظ‡ظ… ظ„ط£ط¯ط§ط، Vercel Serverless) â”€â”€
// ظ†ط­طھظپط¸ ط¨ظ†ط³ط®ط© ظˆط§ط­ط¯ط© ظ…ظ† ط§ظ„طھط·ط¨ظٹظ‚ ط¨ط¯ظ„ ط¥ظ†ط´ط§ط، ظ†ط³ط®ط© ط¬ط¯ظٹط¯ط© ظ„ظƒظ„ ط·ظ„ط¨
let _cachedAppInstance = null;

function getOrCreateApp() {
  if (_cachedAppInstance) return _cachedAppInstance;
  const App = require('./modules/app');
  const appInstance = new App({
    isServerless: true,
    corsConfig: createCorsMiddleware()
  });
  appInstance.registerErrorHandlers();
  _cachedAppInstance = appInstance;
  return appInstance;
}

// â”€â”€ Handler ط§ظ„ط±ط¦ظٹط³ظٹ â”€â”€
module.exports = async (req, res) => {
  // CORS ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰ ط§ظ„ظ€ handler - ظ‚ط¨ظ„ ط£ظٹ ط´ظٹط،
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  // â”€â”€ Setup Admin Endpoint â”€â”€
  if (req.url && req.url.includes('/api/v2/system/setup-admin') && req.method === 'POST') {
    try {
      let body2 = '';
      await new Promise((resolve) => { req.on('data', c => body2 += c); req.on('end', resolve); });
      const { secret, email, password, name, tenantId, role } = JSON.parse(body2 || '{}');
      const SETUP_SECRET = process.env.SETUP_SECRET || 'carx-hmcar-setup-2024';
      if (secret !== SETUP_SECRET) return res.status(403).json({ success: false, message: 'Forbidden' });
      if (!email || !password || !tenantId) return res.status(400).json({ success: false, message: 'email, password, tenantId required' });
      const mongoose = require('mongoose');
      let mUri = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (mUri && mongoose.connection.readyState < 1) await mongoose.connect(mUri, { serverSelectionTimeoutMS: 10000 });
      const bcrypt = require('bcryptjs');
      const col = mongoose.connection.db.collection('users');
      const existing = await col.findOne({ email: email.toLowerCase(), tenantId });
      const targetRole = role || 'admin';
      const hashed = await bcrypt.hash(password, 12);
      if (existing) {
        await col.updateOne({ _id: existing._id }, { $set: { role: targetRole, status: 'active', isActive: true, isVerified: true, password: hashed, updatedAt: new Date() } });
        return res.json({ success: true, action: 'upgraded', email, tenantId, role: targetRole });
      } else {
        await col.insertOne({ name: name || (tenantId + ' Admin'), email: email.toLowerCase(), password: hashed, role: targetRole, tenantId, status: 'active', isActive: true, isVerified: true, twoFactorEnabled: false, tokenVersion: 0, createdAt: new Date(), updatedAt: new Date() });
        return res.json({ success: true, action: 'created', email, tenantId, role: targetRole });
      }
    } catch (e) { return res.status(500).json({ success: false, message: e.message }); }
  }


  // â”€â”€ Import Real Batch Data Endpoint (ظ„ظ†ظ‚ظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ظ‚ظٹظ‚ظٹط© ظƒط§ظ…ظ„ط© ط¥ظ„ظ‰ Atlas) â”€â”€
  if (req.url && req.url.includes('/api/v2/system/import-batch')) {
    if (req.method === 'POST') {
      let rawBody = '';
      req.on('data', chunk => rawBody += chunk);
      return req.on('end', async () => {
        try {
          const body = JSON.parse(rawBody || '{}');
          // [[FIX]] ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط³ط±ظٹ ظ…ظ† ظ…طھط؛ظٹط± ط§ظ„ط¨ظٹط¦ط© â€” ظ„ط§ ظٹظڈظƒطھط¨ ظپظٹ ط§ظ„ظƒظˆط¯
          const batchSecret = process.env.IMPORT_BATCH_SECRET || 'hmcar-import-2026';
          if (body.secret !== batchSecret) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
          }
          const { collection, documents, clearFirst } = body;
          if (!collection || !Array.isArray(documents)) {
            return res.status(400).json({ success: false, error: 'Invalid payload' });
          }
          const mongoose = require('mongoose');
          const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
          if (!mongoose.connection || mongoose.connection.readyState < 1) {
            await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
          }
          const db = mongoose.connection.db;
          const col = db.collection(collection);

          if (clearFirst) {
            await col.deleteMany({ tenantId: 'hmcar' });
            // Drop problematic indexes if necessary
            if (collection === 'brands') {
              try { await col.dropIndex('key_1'); } catch(e) {}
            }
          }

          let insertedCount = 0;
          let skippedCount = 0;
          if (documents.length > 0) {
            // Ensure tenantId is set + convert dates
            const docs = documents.map(d => {
              const doc = { ...d };
              doc.tenantId = doc.tenantId || 'hmcar'; // [[FIX]] ط§ط­طھط±ظ… tenantId ط§ظ„ظ…ظڈط±ط³ظژظ„ â€” ظ„ط§ طھظڈط؛ظ„ظگظ‘ط¨ hmcar ط¯ط§ط¦ظ…ط§ظ‹
              if (doc.createdAt && typeof doc.createdAt === 'string') doc.createdAt = new Date(doc.createdAt);
              if (doc.updatedAt && typeof doc.updatedAt === 'string') doc.updatedAt = new Date(doc.updatedAt);
              if (doc.startsAt && typeof doc.startsAt === 'string') doc.startsAt = new Date(doc.startsAt);
              if (doc.endsAt && typeof doc.endsAt === 'string') doc.endsAt = new Date(doc.endsAt);
              return doc;
            });

            // [[ARABIC_COMMENT]] طھط¬ظ†ط¨ ط§ظ„طھظƒط±ط§ط± ط¹ط¨ط± externalUrl (upsert ط°ظƒظٹ)
            if (collection === 'cars') {
              for (const doc of docs) {
                if (doc.externalUrl) {
                  const exists = await col.findOne({ externalUrl: doc.externalUrl }, { projection: { _id: 1 } });
                  if (exists) { skippedCount++; continue; }
                }
                try {
                  await col.insertOne(doc);
                  insertedCount++;
                } catch (e) {
                  if (e.code !== 11000) console.warn('Insert error:', e.message);
                  else skippedCount++;
                }
              }
            } else {
              const r = await col.insertMany(docs, { ordered: false }).catch(e => ({ insertedCount: e.result?.insertedCount || 0 }));
              insertedCount = r.insertedCount || docs.length;
            }
          }

          const totalCount = await col.countDocuments({ tenantId: 'hmcar' });
          return res.status(200).json({
            success: true,
            collection,
            inserted: insertedCount,
            skipped: skippedCount,
            total: totalCount
          });
        } catch(e) {
          return res.status(500).json({ success: false, error: e.message });
        }
      });
    }
  }


  try {
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¨ظٹط¦ط© ط§ظ„ط£ط³ط§ط³ظٹط©
    if (!hasValidMongoUri()) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database configuration error', 
        code: 'MISSING_ENV'
      });
    }

    // طھظ‡ظٹط¦ط© ط§طھطµط§ظ„ MongoDB ط§ظ„ط¹ط§ظ… ط§ظ„ط³ط±ظٹط¹ ظ„ط¨ظٹط¦ط© Serverless
    const mongoose = require('mongoose');
    // [[FIX]] طھط±طھظٹط¨ ط§ظ„ط£ظˆظ„ظˆظٹط©: MONGO_URI â†’ MONGO_URI_PRODUCTION
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI_PRODUCTION || process.env.MONGO_URI_HMCAR;

    // [[FIX CRITICAL]] ط¶ظ…ط§ظ† ط§ط³ظ… DB ط§ظ„طµط­ظٹط­ "car-auction" â€” ظٹط³طھط¨ط¯ظ„ /test ط£ظˆ ط§ظ„ظپط§ط±ط؛ط© ط¨ظ€ /car-auction
    if (mongoUri && mongoUri.includes('mongodb+srv')) {
      const dbMatch = mongoUri.match(/\.net\/([^?]*)/);
      const currentDb = dbMatch ? dbMatch[1].replace(/\/$/, '') : '';
      if (!currentDb || currentDb === 'test' || currentDb.trim() === '') {
        mongoUri = mongoUri.replace(/\.net\/[^?]*/, '.net/car-auction');
        process.env.MONGO_URI = mongoUri;
        process.env.MONGODB_URI = mongoUri;
        console.log('[Vercel] DB name corrected: "' + currentDb + '" â†’ "car-auction"');
      }
    }

    if (mongoUri && (!mongoose.connection || mongoose.connection.readyState < 1)) {
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: 10,
          minPoolSize: 2,
          bufferCommands: false,
          heartbeatFrequencyMS: 10000,
        });
        console.log('[Vercel] MongoDB connected => DB: ' + mongoose.connection.name);
      } catch (connErr) {
        console.warn('âڑ ï¸ڈ [Vercel] Mongoose connect warning:', connErr.message);
      }
    }

    // Use cached App instance for performance
    const appInstance = getOrCreateApp();
    const expressApp = appInstance.getExpressApp();

    return expressApp(req, res);

  } catch (fatalError) {
    console.error('[Vercel] FATAL:', fatalError.message, fatalError.stack);
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server initialization failed',
        code: 'SERVER_ERROR',
        error: fatalError.message, // [[ARABIC_COMMENT]] ط¥ط¸ظ‡ط§ط± ط±ط³ط§ظ„ط© ط§ظ„ط®ط·ط£ ظ„ظ„طھط´ط®ظٹطµ
        stack: process.env.NODE_ENV === 'development' ? fatalError.stack : undefined
      });
    }
  }
};

/**
 * Endpoint ظ„ظ…ط±ط§ظ‚ط¨ط© ط­ط§ظ„ط© ط§ظ„ط§طھطµط§ظ„ط§طھ (ظ„ظ„طھط´ط®ظٹطµ)
 * ظٹظ…ظƒظ† ط§ط³طھط¯ط¹ط§ط¤ظ‡ ط¹ط¨ط± /api/connections-status ط¥ط°ط§ طھظ…طھ ط¥ط¶ط§ظپطھظ‡ ظپظٹ routes
 */
module.exports.getConnectionsStatus = getConnectionsStatus;