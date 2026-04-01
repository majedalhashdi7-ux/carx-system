// Cars API Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, createAdminData, createCarData, hashPassword } = require('../../helpers/factories');
const { generateToken, generateAdminToken } = require('../../helpers/auth');
const User = require('../../../models/User');
const Car = require('../../../models/Car');

describe('Cars API Integration Tests', () => {
    let app;
    let adminToken;
    let userToken;
    let adminUser;
    let normalUser;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        // Create admin user - User.create() will automatically hash the password
        const adminData = createAdminData();
        adminUser = await User.create(adminData);
        adminToken = generateAdminToken(adminUser._id.toString());

        // Create normal user - User.create() will automatically hash the password
        const userData = createUserData();
        normalUser = await User.create(userData);
        userToken = generateToken(normalUser._id.toString());
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('GET /api/v2/cars', () => {
        it('should return list of cars', async () => {
            await Car.create(createCarData());
            await Car.create(createCarData({ make: 'Honda' }));

            const res = await request(app)
                .get('/api/v2/cars')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
        });

        it('should filter cars by make', async () => {
            await Car.create(createCarData({ make: 'Toyota' }));
            await Car.create(createCarData({ make: 'Honda' }));

            const res = await request(app)
                .get('/api/v2/cars?make=Toyota')
                .expect(200);

            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].make).to.equal('Toyota');
        });

        it('should paginate results', async () => {
            for (let i = 0; i < 15; i++) {
                await Car.create(createCarData({ title: `Car ${i}` }));
            }

            const res = await request(app)
                .get('/api/v2/cars?page=1&limit=10')
                .expect(200);

            expect(res.body.data).to.have.lengthOf(10);
            expect(res.body).to.have.property('pagination');
        });
    });

    describe('GET /api/v2/cars/:id', () => {
        it('should return car details', async () => {
            const car = await Car.create(createCarData());

            const res = await request(app)
                .get(`/api/v2/cars/${car._id}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('_id', car._id.toString());
            expect(res.body.data).to.have.property('make', car.make);
        });

        it('should return 404 for non-existent car', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/api/v2/cars/${fakeId}`)
                .expect(404);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/v2/cars', () => {
        it('should create car as admin', async () => {
            const carData = createCarData();

            const res = await request(app)
                .post('/api/v2/cars')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(carData)
                .expect(201);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('make', carData.make);
        });

        it('should fail without admin role', async () => {
            const carData = createCarData();

            const res = await request(app)
                .post('/api/v2/cars')
                .set('Authorization', `Bearer ${userToken}`)
                .send(carData)
                .expect(403);

            expect(res.body).to.have.property('success', false);
        });

        it('should fail without authentication', async () => {
            const carData = createCarData();

            const res = await request(app)
                .post('/api/v2/cars')
                .send(carData)
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('PUT /api/v2/cars/:id', () => {
        it('should update car as admin', async () => {
            const car = await Car.create(createCarData());

            const res = await request(app)
                .put(`/api/v2/cars/${car._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 30000 })
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('price', 30000);
        });

        it('should fail without admin role', async () => {
            const car = await Car.create(createCarData());

            const res = await request(app)
                .put(`/api/v2/cars/${car._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ price: 30000 })
                .expect(403);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('DELETE /api/v2/cars/:id', () => {
        it('should delete car as admin', async () => {
            const car = await Car.create(createCarData());

            const res = await request(app)
                .delete(`/api/v2/cars/${car._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);

            const deletedCar = await Car.findById(car._id);
            expect(deletedCar).to.be.null;
        });

        it('should fail without admin role', async () => {
            const car = await Car.create(createCarData());

            const res = await request(app)
                .delete(`/api/v2/cars/${car._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(res.body).to.have.property('success', false);
        });
    });
});
