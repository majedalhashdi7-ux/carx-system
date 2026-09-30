// [[ARABIC_HEADER]] ظ‡ط°ط§ ط§ظ„ظ…ظ„ظپ (routes/api/v2/index.js) ط¬ط²ط، ظ…ظ† ظ…ط´ط±ظˆط¹ HM CAR ظˆظٹط­طھظˆظٹ طھط¹ظ„ظٹظ‚ط§طھ ط¹ط±ط¨ظٹط© ظ„ط¶ظ…ط§ظ† ط§ظ„ظˆط¶ظˆط­.

/**
 * @file routes/api/v2/index.js
 * @description ط§ظ„ظ…ظˆط¬ظ‡ ط§ظ„ط±ط¦ظٹط³ظٹ ظ„ط¥طµط¯ط§ط± API ط§ظ„ط«ط§ظ†ظٹ (V2).
 * ظٹظ‚ظˆظ… ط¨طھط¬ظ…ظٹط¹ ظƒط§ظپط© ط§ظ„ظ…ط³ط§ط±ط§طھ ط§ظ„ظپط±ط¹ظٹط© (ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†طŒ ط§ظ„ط³ظٹط§ط±ط§طھطŒ ط§ظ„ظ…ط²ط§ط¯ط§طھطŒ ط¥ظ„ط®) ظ…ط¹ طھظپط¹ظٹظ„ ط³ظٹط§ط³ط© طھظ‚ظٹظٹط¯ ط§ظ„ط·ظ„ط¨ط§طھ (Rate Limiting).
 */

const express = require('express');
const router = express.Router();
const { apiRateLimiter } = require('../../../middleware/securityEnhanced');
const { tenantMiddleware } = require('../../../middleware/tenantMiddleware');
const { 
  generalLimiter, 
  authLimiter, 
  strictLimiter, 
  publicLimiter,
  searchLimiter,
  uploadLimiter 
} = require('../../../middleware/rateLimiter');

/**
 * ط¥ط¹ط¯ط§ط¯ ط·ط¨ظ‚ط© طھظ‚ظٹظٹط¯ ط§ظ„ط·ظ„ط¨ط§طھ (Rate Limiter)
 * ظ„ط­ظ…ط§ظٹط© ط§ظ„ط®ط§ط¯ظ… ظ…ظ† ط§ظ„ظ‡ط¬ظ…ط§طھ ظˆط²ظٹط§ط¯ط© ط¹ط¯ط¯ ط§ظ„ط·ظ„ط¨ط§طھ ظ…ظ† ظ†ظپط³ ط§ظ„ط¹ظ†ظˆط§ظ†.
 */
router.use(generalLimiter);
router.use(tenantMiddleware({ required: true, connectDb: true }));

/**
 * ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط¥طµط¯ط§ط± ط§ظ„ط­ط§ظ„ظٹ ظ„ظ„ظ€ API
 */
router.get('/', (req, res) => {
  res.json({
    name: 'ظˆط§ط¬ظ‡ط© ط¨ط±ظ…ط¬ط© طھط·ط¨ظٹظ‚ط§طھ HM CAR',
    version: '2.0.0',
    description: 'ظ†ط¸ط§ظ… ظ…طھط·ظˆط± ظ„ط¥ط¯ط§ط±ط© ظ…ط²ط§ط¯ط§طھ ط§ظ„ط³ظٹط§ط±ط§طھ ظˆط¨ظٹط¹ ط§ظ„ظ‚ط·ط¹',
    endpoints: {
      auth: 'ظ†ط¸ط§ظ… ط§ظ„ظ…طµط§ط¯ظ‚ط© ظˆط§ظ„ط¯ط®ظˆظ„',
      users: 'ط¥ط¯ط§ط±ط© ط­ط³ط§ط¨ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ†',
      cars: 'ط¥ط¯ط§ط±ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ظٹط§ط±ط§طھ ط§ظ„ظ…ط¹ط±ظˆط¶ط©',
      auctions: 'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط²ط§ط¯ط§طھ ظˆط§ظ„ظ…ط²ط§ظٹط¯ط§طھ ط§ظ„ظپظˆط±ظٹط©',
      analytics: 'ظ†ط¸ط§ظ… ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ ظˆط§ظ„طھظ‚ط§ط±ظٹط±'
    },
    status: 'Active',
    serverTime: new Date().toISOString()
  });
});

/**
 * ظ†ظ‚ط·ط© ظپط­طµ ط§ظ„ط­ط§ظ„ط© ط§ظ„طµط­ظٹط© ط§ظ„ظ…طھظ‚ط¯ظ…ط© (Advanced Health Check)
 * طھظ‚ظˆظ… ط¨ظپط­طµ ط­ط§ظ„ط© ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆط§ط³طھظ‡ظ„ط§ظƒ ط§ظ„ط°ط§ظƒط±ط©.
 */
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbConnection = req.tenantDb || mongoose.connection;
    const ready = dbConnection.readyState === 1;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: ready ? 'متصل' : 'منقطع',
        name: dbConnection.name || 'unknown',
        host: dbConnection.host || 'unknown',
      },
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      tenant: req.tenant?.id || 'unknown',
    });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// --- ط±ط¨ط· ط§ظ„ظ…ط³ط§ط±ط§طھ ط§ظ„ظپط±ط¹ظٹط© (Sub-Routes) ---

router.use('/tenant', publicLimiter, require('./tenant'));              // ظ†ط¸ط§ظ… ط§ظ„ظ…ط¹ط§ط±ط¶ ط§ظ„ظ…طھط¹ط¯ط¯ط© (Multi-Tenant)
router.use('/auth', authLimiter, require('./auth'));                    // ط§ظ„ظ…طµط§ط¯ظ‚ط© - ط­ظ…ط§ظٹط© ظ…ط´ط¯ط¯ط©
router.use('/users', strictLimiter, require('./users'));                // ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/cars', publicLimiter, require('./cars'));
router.use('/auctions', strictLimiter, require('./auctions'));          // ط§ظ„ظ…ط²ط§ط¯ط§طھ - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/parts', publicLimiter, require('./parts'));
router.use('/dashboard', strictLimiter, require('./dashboard'));        // ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ… - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/orders', strictLimiter, require('./orders'));              // ط§ظ„ط·ظ„ط¨ط§طھ - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/notifications', publicLimiter, require('./notifications')); // ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ
router.use('/analytics', strictLimiter, require('./analytics'));        // ط§ظ„طھط­ظ„ظٹظ„ط§طھ - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/upload', uploadLimiter, require('./upload.js'));           // ط±ظپط¹ ط§ظ„ظ…ظ„ظپط§طھ - ط­ط¯ طµط§ط±ظ…
router.use('/search', searchLimiter, (req, res) => {
  // TODO: ط±ط¨ط· router ط§ظ„ط¨ط­ط« (search.js) ط¹ظ†ط¯ ط¥ظ†ط´ط§ط¦ظ‡
  res.status(501).json({
    success: false,
    message: 'ظ†ط¸ط§ظ… ط§ظ„ط¨ط­ط« ظ‚ظٹط¯ ط§ظ„طھط·ظˆظٹط±',
    code: 'NOT_IMPLEMENTED'
  });
});                                                  // ط§ظ„ط¨ط­ط« - ظ‚ظٹط¯ ط§ظ„طھط·ظˆظٹط±
router.use('/settings', require('./settings')); // ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ
router.use('/messages', publicLimiter, require('./messages'));          // ط§ظ„ط±ط³ط§ط¦ظ„
router.use('/reviews', publicLimiter, require('./reviews'));            // ط§ظ„طھظ‚ظٹظٹظ…ط§طھ
router.use('/comparisons', publicLimiter, require('./comparisons'));    // ط§ظ„ظ…ظ‚ط§ط±ظ†ط§طھ
router.use('/brands', publicLimiter, require('./brands'));              // ط§ظ„ظ…ط§ط±ظƒط§طھ
router.use('/contact', strictLimiter, require('./contact'));            // ط§ظ„ط§طھطµط§ظ„ - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/leads', strictLimiter, require('./leads'));                // ط§ظ„ط¹ظ…ظ„ط§ط، ط§ظ„ظ…ط­طھظ…ظ„ظˆظ† (Leads)
router.use('/favorites', publicLimiter, require('./favorites'));        // ط§ظ„ظ…ظپط¶ظ„ط©
router.use('/bids', strictLimiter, require('./bids'));                  // ط§ظ„ظ…ط²ط§ظٹط¯ط§طھ - ط­ظ…ط§ظٹط© ظ…طھظˆط³ط·ط©
router.use('/live-auctions', publicLimiter, require('./live-auctions'));// ط§ظ„ظ…ط²ط§ط¯ط§طھ ط§ظ„ظ…ط¨ط§ط´ط±ط©
router.use('/live-auction-requests', strictLimiter, require('./live-auction-requests')); // ط·ظ„ط¨ط§طھ ط§ظ„ط´ط±ط§ط، ظ„ظ„ظ…ط²ط§ط¯ ط§ظ„ظ…ط¨ط§ط´ط±
router.use('/smart-alerts', publicLimiter, require('./smart-alerts')); // ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ط°ظƒظٹط©
router.use('/security', strictLimiter, require('./security'));         // ظ‚ط³ظ… ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„ط£ط¬ظ‡ط²ط© ط§ظ„ظ…ط­ط¸ظˆط±ط©
router.use('/backup', strictLimiter, require('./backup'));             // [[ARABIC_COMMENT]] ط§ظ„ظ†ط³ط® ط§ظ„ط§ط­طھظٹط§ط·ظٹ ط§ظ„طھظ„ظ‚ط§ط¦ظٹ
router.use('/concierge', strictLimiter, require('./concierge'));       // ط§ظ„ط·ظ„ط¨ط§طھ ط§ظ„ط®ط§طµط© (ط·ظ„ط¨ ط³ظٹط§ط±ط© / ظ‚ط·ط¹ ط؛ظٹط§ط±)
router.use('/showroom', publicLimiter, require('./showroom'));          // ط§ظ„ظ…ط¹ط±ط¶ ط§ظ„ظƒظˆط±ظٹ (Encar)
router.use('/invoices', strictLimiter, require('./invoices'));          // ظ†ط¸ط§ظ… ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظ…ط®طµطµ (Invoices)
router.use('/system', strictLimiter, require('./system'));            // ط§ظ„ظپط­طµ ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ظ†ط¸ط§ظ…
router.use('/import', strictLimiter, require('./import'));            // ظ†ط¸ط§ظ… ط§ظ„ط§ط³طھظٹط±ط§ط¯ ط§ظ„ظ…طھظ‚ط¯ظ… ظ…ظ† ط§ظ„ط±ظˆط§ط¨ط·
router.use('/image-proxy', publicLimiter, require('./image-proxy'));    // ظˆظƒظٹظ„ طµظˆط± ط§ظ„ط³ظٹط§ط±ط§طھ ظˆط§ظ„ظ‚ط·ط¹ ظ…ظ† ط§ظ„ظ…ظˆط§ظ‚ط¹ ط§ظ„ط®ط§ط±ط¬ظٹط©

/**
 * ظ…ط¹ط§ظ„ط¬ ط§ظ„ط£ط®ط·ط§ط، ط§ظ„ظ…ط±ظƒط²ظٹ ظ„ظ…ط³ط§ط±ط§طھ API
 * ظٹظ‚ظˆظ… ط¨طھط­ظ„ظٹظ„ ظ†ظˆط¹ ط§ظ„ط®ط·ط£ ظˆط¥ط±ط¬ط§ط¹ ط±ط³ط§ظ„ط© ظˆط§ط¶ط­ط© ظ„ظ„ظ…ط¨ط±ظ…ط¬/ط§ظ„ط¹ظ…ظٹظ„.
 */
router.use((error, req, res, next) => {
  console.error('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ API:', error);

  // ط£ط®ط·ط§ط، ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ (Mongoose Validation)
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'ط®ط·ط£ ظپظٹ طµط­ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ',
      message: error.message,
      details: error.errors
    });
  }

  // ط£ط®ط·ط§ط، ط§ظ„ظ…ط¹ط±ظپط§طھ ط؛ظٹط± ط§ظ„طµط­ظٹط­ط© (Invalid IDs)
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'ظ…ط¹ط±ظپ ط؛ظٹط± طµط§ظ„ط­',
      message: 'ط§ظ„ظ…ط¹ط±ظپ ط§ظ„ظ…ظ…ط±ط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ط£ظˆ ط¨طھظ†ط³ظٹظ‚ ط®ط§ط·ط¦'
    });
  }

  // ط£ط®ط·ط§ط، طھظƒط±ط§ط± ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظپط±ظٹط¯ط© (Duplicate Key)
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'ط¨ظٹط§ظ†ط§طھ ظ…ظƒط±ط±ط©',
      message: 'ظ‡ط°ط§ ط§ظ„ط³ط¬ظ„ ظ…ظˆط¬ظˆط¯ ط¨ط§ظ„ظپط¹ظ„ ظپظٹ ط§ظ„ظ†ط¸ط§ظ…'
    });
  }

  // ط®ط·ط£ ط¹ط§ظ… ط؛ظٹط± ظ…طھظˆظ‚ط¹
  res.status(error.status || 500).json({
    error: error.name || 'ط®ط·ط£ ط¯ط§ط®ظ„ظٹ',
    message: error.message || 'ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹ ظپظٹ ط§ظ„ط®ط§ط¯ظ…',
    path: req.path
  });
});

/**
 * ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط±ظˆط§ط¨ط· ط؛ظٹط± ط§ظ„ظ…ط¹ط±ظˆظپط© ظ„ظ€ API
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'ط؛ظٹط± ظ…ظˆط¬ظˆط¯',
    message: `ط§ظ„ظ…ط³ط§ط± ${req.method} ${req.originalUrl} ط؛ظٹط± ظ…طھط§ط­ ظپظٹ ط§ظ„ظ†ط¸ط§ظ….`
  });
});

module.exports = router;
