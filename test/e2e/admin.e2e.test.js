// Admin E2E Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../helpers/setup');
const { createAdminData, createCarData, hashPassword } = require('../helpers/factories');
const User = require('../../models/User');
const Car = require('../../models/Car');
const Auction = require('../../models/Auction');

describe('Admin Flow (E2E)', () => {
    let app;
    let adminToken;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        // Create and login admin
        const adminData = createAdminData();
        await User.create({
            ...adminData,
            password: await hashPassword(adminData.password),
        });

        const adminLogin = await request(app)
            .post('/api/v2/auth/login')
            .send({
                email: adminData.email,
                password: adminData.password,
            });

        adminToken = adminLogin.body.token;
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Admin Car Management Flow', () => {
        it('should login → create car → update car → create auction', async () => {
            // Step 1: Verify admin access
            const verifyRes = await request(app)
                .get('/api/v2/auth/verify')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(verifyRes.body.data).to.have.property('role', 'admin');

            // Step 2: Create new car
            const carData = createCarData();
            const createCarRes = await request(app)
                .post('/api/v2/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(carData)
                .expect(201);

            expect(createCarRes.body).to.have.property('success', true);
            expect(createCarRes.body.data).to.have.property('make', carData.make);

            const carId = createCarRes.body.data._id;

            // Step 3: Update car details
            const updateCarRes = await request(app)
                .put(`/api/v2/cars/${carId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 30000,
                    description: 'Updated description',
                })
                .expect(200);

            expect(updateCarRes.body.data).to.have.property('price', 30000);

            // Step 4: Create auction for the car
            const auctionData = {
                car: carId,
                startingPrice: 25000,
                startsAt: new Date(),
                endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            };

            const createAuctionRes = await request(app)
                .post('/api/v2/auctions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(auctionData)
                .expect(201);

            expect(createAuctionRes.body).to.have.property('success', true);
            expect(createAuctionRes.body.data).to.have.property('startingPrice', 25000);
        });
    });

    describe('Admin Dashboard Flow', () => {
        it('should access dashboard and view statistics', async () => {
            // Create test data
            await Car.create(createCarData());
            await Car.create(createCarData({ make: 'Honda' }));

            // Access dashboard
            const dashboardRes = await request(app)
                .get('/api/v2/dashboard/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(dashboardRes.body).to.have.property('success', true);
            expect(dashboardRes.body.data).to.have.property('totalCars');
        });
    });

    describe('Admin User Management Flow', () => {
        it('should manage users', async () => {
            // View all users
            const usersRes = await request(app)
                .get('/api/v2/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(usersRes.body).to.have.property('success', true);
            expect(usersRes.body.data).to.be.an('array');
        });
    });
});
