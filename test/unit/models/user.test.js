// Unit Tests for User Model
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, createAdminData, hashPassword } = require('../../helpers/factories');
const User = require('../../../models/User');

describe('User Model - Unit Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('User Creation', () => {
        it('should create a user with valid data', async () => {
            const userData = createUserData();
            const user = await User.create(userData);

            expect(user).to.have.property('_id');
            expect(user.name).to.equal(userData.name);
            expect(user.email).to.equal(userData.email);
            expect(user.role).to.equal('buyer');
        });

        it('should hash password on save', async () => {
            const userData = createUserData({ password: 'plaintext123' });
            const user = await User.create(userData);

            expect(user.password).to.not.equal('plaintext123');
            expect(user.password).to.have.lengthOf.at.least(50);
        });

        it('should create admin user with correct role', async () => {
            const adminData = createAdminData();
            const admin = await User.create(adminData);

            expect(admin.role).to.equal('admin');
        });

        it('should set default values correctly', async () => {
            const userData = createUserData();
            const user = await User.create(userData);

            expect(user.status).to.equal('active');
            expect(user.loginAttempts).to.equal(0);
            expect(user.twoFactorEnabled).to.equal(false);
            expect(user.isOnline).to.equal(false);
        });
    });

    describe('Password Comparison', () => {
        it('should compare password correctly', async () => {
            const userData = createUserData({ password: 'testpass123' });
            const user = await User.create(userData);

            const isMatch = await user.comparePassword('testpass123');
            expect(isMatch).to.be.true;
        });

        it('should reject incorrect password', async () => {
            const userData = createUserData({ password: 'testpass123' });
            const user = await User.create(userData);

            const isMatch = await user.comparePassword('wrongpass');
            expect(isMatch).to.be.false;
        });
    });

    describe('Login Attempts', () => {
        it('should increment login attempts', async () => {
            const user = await User.create(createUserData());
            
            await user.incLoginAttempts();
            const updated = await User.findById(user._id);
            
            expect(updated.loginAttempts).to.equal(1);
        });

        it('should suspend user after 5 failed attempts', async () => {
            let user = await User.create(createUserData());
            
            for (let i = 0; i < 5; i++) {
                await user.incLoginAttempts();
                user = await User.findById(user._id); // Reload after each increment
            }
            
            expect(user.status).to.equal('suspended');
            expect(user.lockoutCode).to.have.lengthOf(6);
        });

        it('should reset login attempts on success', async () => {
            const user = await User.create(createUserData({ loginAttempts: 3 }));
            
            await user.resetLoginAttempts();
            const updated = await User.findById(user._id);
            
            expect(updated.loginAttempts).to.equal(0);
        });
    });

    describe('Validations', () => {
        it('should require name', async () => {
            const userData = createUserData();
            delete userData.name;

            try {
                await User.create(userData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should enforce unique email', async () => {
            const userData = createUserData({ email: 'test@example.com' });
            await User.create(userData);

            try {
                await User.create(userData);
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000);
            }
        });

        it('should enforce role enum', async () => {
            const userData = createUserData({ role: 'invalid_role' });

            try {
                await User.create(userData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });
    });

    describe('Virtual Properties', () => {
        it('should calculate isLocked correctly when suspended', async () => {
            const user = await User.create(createUserData({ status: 'suspended' }));
            expect(user.isLocked).to.be.true;
        });

        it('should calculate isLocked correctly with lockUntil', async () => {
            const futureDate = new Date(Date.now() + 60000);
            const user = await User.create(createUserData({ lockUntil: futureDate }));
            expect(user.isLocked).to.be.true;
        });

        it('should not be locked when active', async () => {
            const user = await User.create(createUserData({ status: 'active' }));
            expect(user.isLocked).to.be.false;
        });
    });
});
