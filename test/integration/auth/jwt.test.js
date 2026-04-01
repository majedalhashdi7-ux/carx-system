// JWT Integration Tests
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, hashPassword } = require('../../helpers/factories');
const { generateToken, generateAdminToken } = require('../../helpers/auth');
const User = require('../../../models/User');

describe('JWT Integration Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Token Generation', () => {
        it('should generate valid JWT token', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const token = generateToken(user._id.toString());

            expect(token).to.be.a('string');
            expect(token.split('.')).to.have.lengthOf(3); // JWT has 3 parts
        });

        it('should include user ID in token payload', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const token = generateToken(user._id.toString());
            const decoded = jwt.decode(token);

            expect(decoded).to.have.property('userId', user._id.toString());
        });

        it('should generate admin token with admin role', async () => {
            const adminData = createUserData({ role: 'admin' });
            const admin = await User.create({
                ...adminData,
                password: await hashPassword(adminData.password),
            });

            const token = generateAdminToken(admin._id.toString());
            const decoded = jwt.decode(token);

            expect(decoded).to.have.property('userId', admin._id.toString());
            expect(decoded).to.have.property('role', 'admin');
        });
    });

    describe('Token Verification', () => {
        it('should verify valid token', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const token = generateToken(user._id.toString());
            const secret = process.env.JWT_SECRET || 'test-secret';

            const decoded = jwt.verify(token, secret);
            expect(decoded).to.have.property('userId', user._id.toString());
        });

        it('should reject invalid token', () => {
            const invalidToken = 'invalid.token.here';
            const secret = process.env.JWT_SECRET || 'test-secret';

            try {
                jwt.verify(invalidToken, secret);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.name).to.equal('JsonWebTokenError');
            }
        });

        it('should reject expired token', () => {
            const secret = process.env.JWT_SECRET || 'test-secret';
            const expiredToken = jwt.sign(
                { userId: '123' },
                secret,
                { expiresIn: '0s' }
            );

            // Wait a moment to ensure expiration
            setTimeout(() => {
                try {
                    jwt.verify(expiredToken, secret);
                    expect.fail('Should have thrown an error');
                } catch (error) {
                    expect(error.name).to.equal('TokenExpiredError');
                }
            }, 100);
        });
    });

    describe('Token Expiration', () => {
        it('should set expiration time', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const token = generateToken(user._id.toString());
            const decoded = jwt.decode(token);

            expect(decoded).to.have.property('exp');
            expect(decoded.exp).to.be.a('number');
            expect(decoded.exp).to.be.greaterThan(Date.now() / 1000);
        });

        it('should include issued at timestamp', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const token = generateToken(user._id.toString());
            const decoded = jwt.decode(token);

            expect(decoded).to.have.property('iat');
            expect(decoded.iat).to.be.a('number');
            expect(decoded.iat).to.be.lessThanOrEqual(Date.now() / 1000);
        });
    });
});
