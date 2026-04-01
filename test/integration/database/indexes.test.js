// Database Indexes Integration Tests
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const User = require('../../../models/User');
const Car = require('../../../models/Car');

describe('Database Indexes Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Unique Indexes', () => {
        it('should enforce unique email constraint', async () => {
            await User.create({
                name: 'User 1',
                email: 'unique@example.com',
                password: 'hashedpassword',
                phone: '+1234567890',
                role: 'buyer',
            });

            try {
                await User.create({
                    name: 'User 2',
                    email: 'unique@example.com',
                    password: 'hashedpassword',
                    phone: '+1234567891',
                    role: 'buyer',
                });
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000); // Duplicate key error
            }
        });

        it('should allow same email after deletion', async () => {
            const user = await User.create({
                name: 'User 1',
                email: 'reuse@example.com',
                password: 'hashedpassword',
                phone: '+1234567890',
                role: 'buyer',
            });

            await User.deleteOne({ _id: user._id });

            const newUser = await User.create({
                name: 'User 2',
                email: 'reuse@example.com',
                password: 'hashedpassword',
                phone: '+1234567891',
                role: 'buyer',
            });

            expect(newUser).to.exist;
            expect(newUser.email).to.equal('reuse@example.com');
        });
    });

    describe('Query Performance', () => {
        it('should use indexes for email queries', async () => {
            // Create multiple users
            for (let i = 0; i < 100; i++) {
                await User.create({
                    name: `User ${i}`,
                    email: `user${i}@example.com`,
                    password: 'hashedpassword',
                    phone: `+123456789${i}`,
                    role: 'buyer',
                });
            }

            const start = Date.now();
            const user = await User.findOne({ email: 'user50@example.com' });
            const duration = Date.now() - start;

            expect(user).to.exist;
            expect(duration).to.be.lessThan(100); // Should be fast with index
        });

        it('should efficiently query cars by make and model', async () => {
            // Create multiple cars
            for (let i = 0; i < 50; i++) {
                await Car.create({
                    title: `Car ${i}`,
                    make: i % 2 === 0 ? 'Toyota' : 'Honda',
                    model: `Model ${i}`,
                    year: 2020 + (i % 5),
                    price: 20000 + (i * 1000),
                    mileage: 10000 + (i * 1000),
                    condition: 'excellent',
                    description: `Description ${i}`,
                    images: [`https://example.com/car${i}.jpg`],
                });
            }

            const start = Date.now();
            const cars = await Car.find({ make: 'Toyota' });
            const duration = Date.now() - start;

            expect(cars).to.have.lengthOf(25);
            expect(duration).to.be.lessThan(100);
        });
    });
});
