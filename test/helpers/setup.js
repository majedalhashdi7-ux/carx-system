// Test Setup Helper
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let mongoServer = null;
let isConnected = false;

/**
 * Connect to in-memory MongoDB for testing.
 * Idempotent — safe to call from multiple test files.
 */
async function setupTestDB() {
    try {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.TESTING = 'true';
        process.env.JWT_SECRET = 'test-secret-key';

        // If already connected, just clear the database and return
        if (isConnected && mongoose.connection.readyState === 1) {
            await clearDatabase();
            console.log('📊 قاعدة البيانات متصلة');
            console.log('✅ Test database connected');
            return;
        }

        // Create in-memory MongoDB replica set (required for transactions)
        mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        const mongoUri = mongoServer.getUri();

        // Connect mongoose
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;

        // Load all models to ensure schemas are registered
        const fs = require('fs');
        const path = require('path');
        const modelsPath = path.join(__dirname, '..', '..', 'models');
        if (fs.existsSync(modelsPath)) {
            fs.readdirSync(modelsPath).forEach(file => {
                if (file.endsWith('.js')) {
                    try {
                        require(path.join(modelsPath, file));
                    } catch (e) {
                        // Ignore model loading errors if any
                    }
                }
            });
        }

        // Wait for indexes to build/sync
        const models = mongoose.modelNames();
        await Promise.all(models.map(modelName => mongoose.model(modelName).syncIndexes().catch(() => {})));

        console.log('📊 قاعدة البيانات متصلة');
        console.log('✅ Test database connected');
    } catch (error) {
        console.error('❌ Test database connection failed:', error);
        throw error;
    }
}

/**
 * Clear all collections
 */
async function clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

/**
 * Close database connection
 */
async function closeDatabase() {
    // Only close if this is the last caller — we use a simple reference count approach
    // For simplicity we only close when explicitly asked from the last test suite.
    // Check if there are other test suites still running is not trivial, so we
    // just clear the DB here and let the process exit clean up the server.
    await clearDatabase();
    console.log('📊 قاعدة البيانات منقطعة');
    console.log('✅ Test database closed');
}

/**
 * Force close — used only if you want to fully tear down (e.g. final test suite)
 */
async function forceCloseDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
    isConnected = false;
    console.log('📊 قاعدة البيانات منقطعة');
    console.log('✅ Test database fully closed');
}

module.exports = {
    setupTestDB,
    clearDatabase,
    closeDatabase,
    forceCloseDatabase,
};
