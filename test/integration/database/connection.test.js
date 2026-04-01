// Database Connection Integration Tests
const { expect } = require('chai');
const mongoose = require('mongoose');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');

describe('Database Connection Tests', () => {
    describe('Connection Management', () => {
        it('should connect to test database successfully', async () => {
            await setupTestDB();
            
            expect(mongoose.connection.readyState).to.equal(1); // 1 = connected
            expect(mongoose.connection.name).to.exist;
            
            await closeDatabase();
        });

        it('should handle connection errors gracefully', async () => {
            // Close any existing connection
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
            }

            try {
                await mongoose.connect('mongodb://invalid-host:27017/test', {
                    serverSelectionTimeoutMS: 1000,
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.exist;
            }
        });
    });

    describe('Database Operations', () => {
        before(async () => {
            await setupTestDB();
        });

        afterEach(async () => {
            await clearDatabase();
        });

        after(async () => {
            await closeDatabase();
        });

        it('should create and retrieve documents', async () => {
            const User = require('../../../models/User');
            
            const user = await User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedpassword',
                phone: '+1234567890',
                role: 'buyer',
            });

            const foundUser = await User.findById(user._id);
            expect(foundUser).to.exist;
            expect(foundUser.email).to.equal('test@example.com');
        });

        it('should handle concurrent operations', async () => {
            const User = require('../../../models/User');
            
            const operations = [];
            for (let i = 0; i < 10; i++) {
                operations.push(
                    User.create({
                        name: `User ${i}`,
                        email: `user${i}@example.com`,
                        password: 'hashedpassword',
                        phone: `+123456789${i}`,
                        role: 'buyer',
                    })
                );
            }

            const users = await Promise.all(operations);
            expect(users).to.have.lengthOf(10);

            const count = await User.countDocuments();
            expect(count).to.equal(10);
        });
    });
});
