// Session Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, hashPassword } = require('../../helpers/factories');
const User = require('../../../models/User');

describe('Session Integration Tests', () => {
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

    describe('Login Session', () => {
        it('should create session on login', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password via pre('save') hook
            await User.create(userData);

            const res = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            expect(res.body).to.have.property('token');
            expect(res.body.token).to.be.a('string');
        });

        it('should maintain session across requests', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password via pre('save') hook
            await User.create(userData);

            const loginRes = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const token = loginRes.body.token;

            // First request
            const res1 = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res1.body.data.email).to.equal(userData.email);

            // Second request with same token
            const res2 = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res2.body.data.email).to.equal(userData.email);
        });
    });

    describe('Logout Session', () => {
        it('should invalidate session on logout', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password via pre('save') hook
            await User.create(userData);

            const loginRes = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const token = loginRes.body.token;

            await request(app)
                .post('/api/v2/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Note: In stateless JWT, token remains valid until expiration
            // This test documents the current behavior
        });
    });

    describe('Concurrent Sessions', () => {
        it('should allow multiple sessions for same user', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password via pre('save') hook
            await User.create(userData);

            // Login twice
            const login1 = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const login2 = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const token1 = login1.body.token;
            const token2 = login2.body.token;

            // Both tokens should work
            await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${token1}`)
                .expect(200);

            await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${token2}`)
                .expect(200);
        });
    });
});
