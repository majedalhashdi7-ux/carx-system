// Test Setup Helper
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to in-memory MongoDB for testing
 */
async function setupTestDB() {
    try {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.TESTING = 'true';

        // Create in-memory MongoDB instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        // Connect mongoose
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

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
    
    // Also drop indexes to avoid unique constraint issues
    for (const key in collections) {
        try {
            await collections[key].dropIndexes();
        } catch (error) {
            // Ignore errors if no indexes exist
        }
    }
}

/**
 * Close database connection
 */
async function closeDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    console.log('✅ Test database closed');
}

module.exports = {
    setupTestDB,
    clearDatabase,
    closeDatabase,
};
