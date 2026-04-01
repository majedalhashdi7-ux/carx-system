// Authentication E2E Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../helpers/setup');

describe('Authentication Flow (E2E)', () => {
    let app;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Complete User Registration and Login Flow', () => {
        it('should complete full registration → login → profile → logout flow', async () => {
            // Step 1: Register new user
            const userData = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                password: 'SecurePass123!',
                phone: '+966501234567',
                role: 'buyer',
            };

            const registerRes = await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(201);

            expect(registerRes.body).to.have.property('success', true);
            expect(registerRes.body).to.have.property('token');
            expect(registerRes.body.data).to.have.property('email', userData.email);
            expect(registerRes.body.data).to.have.property('name', userData.name);

            const registrationToken = registerRes.body.token;

            // Step 2: Login with credentials
            const loginRes = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            expect(loginRes.body).to.have.property('success', true);
            expect(loginRes.body).to.have.property('token');
            
            const loginToken = loginRes.body.token;

            // Step 3: Verify token works
            const verifyRes = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${loginToken}`)
                .expect(200);

            expect(verifyRes.body).to.have.property('success', true);
            expect(verifyRes.body.data).to.have.property('email', userData.email);

            // Step 4: Update profile
            const updateRes = await request(app)
                .put('/api/v2/users/profile')
                .set('Authorization', `Bearer ${loginToken}`)
                .send({
                    name: 'John Updated Doe',
                    phone: '+966509876543',
                })
                .expect(200);

            expect(updateRes.body).to.have.property('success', true);
            expect(updateRes.body.data.name).to.equal('John Updated Doe');

            // Step 5: Logout
            const logoutRes = await request(app)
                .post('/api/v2/auth/logout')
                .set('Authorization', `Bearer ${loginToken}`)
                .expect(200);

            expect(logoutRes.body).to.have.property('success', true);
        });

        it('should handle failed login attempts correctly', async () => {
            // Register user
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'CorrectPass123!',
                phone: '+966501111111',
                role: 'buyer',
            };

            await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(201);

            // Attempt login with wrong password
            const failedLogin = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword',
                })
                .expect(401);

            expect(failedLogin.body).to.have.property('success', false);

            // Successful login after failed attempt
            const successLogin = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            expect(successLogin.body).to.have.property('success', true);
            expect(successLogin.body).to.have.property('token');
        });
    });

    describe('Password Reset Flow', () => {
        it('should handle password reset request', async () => {
            // Register user
            const userData = {
                name: 'Reset User',
                email: 'reset@example.com',
                password: 'OldPass123!',
                phone: '+966502222222',
                role: 'buyer',
            };

            await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(201);

            // Request password reset
            const resetRes = await request(app)
                .post('/api/v2/auth/forgot-password')
                .send({ email: userData.email })
                .expect(200);

            expect(resetRes.body).to.have.property('success', true);
        });
    });

    describe('Token Expiration Flow', () => {
        it('should reject expired or invalid tokens', async () => {
            const invalidToken = 'invalid.token.here';

            const res = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });
});
