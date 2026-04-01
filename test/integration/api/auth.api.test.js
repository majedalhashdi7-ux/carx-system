// Auth API Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, hashPassword } = require('../../helpers/factories');
const User = require('../../../models/User');

describe('Auth API Integration Tests', () => {
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

    describe('POST /api/v2/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = createUserData();

            const res = await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(201);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
            expect(res.body.data).to.have.property('email', userData.email);
        });

        it('should fail with duplicate email', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password
            await User.create(userData);

            const res = await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(409); // Changed from 400 to 409 for duplicate

            expect(res.body).to.have.property('success', false);
        });

        it('should fail with invalid email', async () => {
            const userData = createUserData({ email: 'invalid-email' });

            const res = await request(app)
                .post('/api/v2/auth/register')
                .send(userData)
                .expect(400);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/v2/auth/login', () => {
        it('should login with valid credentials', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password
            await User.create(userData);

            const res = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('token');
        });

        it('should fail with wrong password', async () => {
            const userData = createUserData();
            // User.create() will automatically hash the password
            await User.create(userData);

            const res = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });

        it('should fail with non-existent user', async () => {
            const res = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('GET /api/v2/auth/verify', () => {
        it('should verify valid token', async () => {
            const userData = createUserData();
            const user = await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const loginRes = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const token = loginRes.body.token;

            const res = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('email', userData.email);
        });

        it('should fail with invalid token', async () => {
            const res = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });

        it('should fail without token', async () => {
            const res = await request(app)
                .get('/api/v2/auth/verify')
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/v2/auth/logout', () => {
        it('should logout successfully', async () => {
            const userData = createUserData();
            await User.create({
                ...userData,
                password: await hashPassword(userData.password),
            });

            const loginRes = await request(app)
                .post('/api/v2/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                });

            const token = loginRes.body.token;

            const res = await request(app)
                .post('/api/v2/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
        });
    });
});
