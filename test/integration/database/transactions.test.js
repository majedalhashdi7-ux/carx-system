// Database Transactions Integration Tests
const { expect } = require('chai');
const mongoose = require('mongoose');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const User = require('../../../models/User');
const Order = require('../../../models/Order');

describe('Database Transactions Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Transaction Support', () => {
        it('should support basic transactions', async () => {
            const session = await mongoose.startSession();
            
            try {
                await session.startTransaction();

                const user = await User.create([{
                    name: 'Transaction User',
                    email: 'transaction@example.com',
                    password: 'hashedpassword',
                    phone: '+1234567890',
                    role: 'buyer',
                }], { session });

                await session.commitTransaction();
                
                const foundUser = await User.findOne({ email: 'transaction@example.com' });
                expect(foundUser).to.exist;
            } finally {
                await session.endSession();
            }
        });

        it('should rollback on transaction failure', async () => {
            const session = await mongoose.startSession();
            
            try {
                await session.startTransaction();

                await User.create([{
                    name: 'Rollback User',
                    email: 'rollback@example.com',
                    password: 'hashedpassword',
                    phone: '+1234567890',
                    role: 'buyer',
                }], { session });

                // Simulate error
                throw new Error('Simulated error');
            } catch (error) {
                await session.abortTransaction();
            } finally {
                await session.endSession();
            }

            const foundUser = await User.findOne({ email: 'rollback@example.com' });
            expect(foundUser).to.be.null;
        });
    });

    describe('Atomic Operations', () => {
        it('should perform atomic updates', async () => {
            const user = await User.create({
                name: 'Atomic User',
                email: 'atomic@example.com',
                password: 'hashedpassword',
                phone: '+1234567890',
                role: 'buyer',
            });

            const result = await User.findByIdAndUpdate(
                user._id,
                { $set: { name: 'Updated Name' } },
                { new: true }
            );

            expect(result.name).to.equal('Updated Name');
        });

        it('should handle concurrent updates correctly', async () => {
            const user = await User.create({
                name: 'Concurrent User',
                email: 'concurrent@example.com',
                password: 'hashedpassword',
                phone: '+1234567890',
                role: 'buyer',
            });

            const updates = [];
            for (let i = 0; i < 5; i++) {
                updates.push(
                    User.findByIdAndUpdate(
                        user._id,
                        { $set: { name: `Update ${i}` } },
                        { new: true }
                    )
                );
            }

            await Promise.all(updates);

            const finalUser = await User.findById(user._id);
            expect(finalUser.name).to.match(/^Update \d$/);
        });
    });
});
