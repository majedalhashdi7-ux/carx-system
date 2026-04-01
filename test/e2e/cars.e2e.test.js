// Cars E2E Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../helpers/setup');
const { createUserData, createAdminData, createCarData, hashPassword } = require('../helpers/factories');
const User = require('../../models/User');
const Car = require('../../models/Car');

describe('Cars Flow (E2E)', () => {
    let app;
    let userToken;
    let adminToken;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        // Create and login user
        const userData = createUserData();
        await User.create({
            ...userData,
            password: await hashPassword(userData.password),
        });

        const userLogin = await request(app)
            .post('/api/v2/auth/login')
            .send({
                email: userData.email,
                password: userData.password,
            });

        userToken = userLogin.body.token;

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

    describe('Browse and View Cars Flow', () => {
        it('should browse cars → filter → view details → add to favorites', async () => {
            // Admin creates cars
            const car1 = await Car.create(createCarData({ 
                make: 'Toyota', 
                model: 'Camry',
                price: 25000 
            }));
            
            const car2 = await Car.create(createCarData({ 
                make: 'Honda', 
                model: 'Accord',
                price: 27000 
            }));

            const car3 = await Car.create(createCarData({ 
                make: 'Toyota', 
                model: 'Corolla',
                price: 20000 
            }));

            // Step 1: Browse all cars
            const browseRes = await request(app)
                .get('/api/v2/cars')
                .expect(200);

            expect(browseRes.body).to.have.property('success', true);
            expect(browseRes.body.data).to.be.an('array');
            expect(browseRes.body.data).to.have.lengthOf(3);

            // Step 2: Filter by make
            const filterRes = await request(app)
                .get('/api/v2/cars?make=Toyota')
                .expect(200);

            expect(filterRes.body.data).to.have.lengthOf(2);
            expect(filterRes.body.data.every(car => car.make === 'Toyota')).to.be.true;

            // Step 3: Filter by price range
            const priceFilterRes = await request(app)
                .get('/api/v2/cars?minPrice=20000&maxPrice=26000')
                .expect(200);

            expect(priceFilterRes.body.data).to.have.lengthOf(2);

            // Step 4: View car details
            const detailsRes = await request(app)
                .get(`/api/v2/cars/${car1._id}`)
                .expect(200);

            expect(detailsRes.body).to.have.property('success', true);
            expect(detailsRes.body.data).to.have.property('make', 'Toyota');
            expect(detailsRes.body.data).to.have.property('model', 'Camry');

            // Step 5: Add to favorites
            const favoriteRes = await request(app)
                .post('/api/v2/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ carId: car1._id })
                .expect(201);

            expect(favoriteRes.body).to.have.property('success', true);

            // Step 6: View favorites
            const viewFavoritesRes = await request(app)
                .get('/api/v2/favorites')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(viewFavoritesRes.body.data).to.be.an('array');
            expect(viewFavoritesRes.body.data).to.have.lengthOf(1);
        });
    });

    describe('Search and Sort Flow', () => {
        it('should search cars by keyword and sort results', async () => {
            // Create test cars
            await Car.create(createCarData({ 
                title: 'Luxury Toyota Camry 2023',
                make: 'Toyota',
                price: 30000 
            }));
            
            await Car.create(createCarData({ 
                title: 'Sport Honda Civic 2023',
                make: 'Honda',
                price: 25000 
            }));

            await Car.create(createCarData({ 
                title: 'Family Toyota Corolla 2023',
                make: 'Toyota',
                price: 22000 
            }));

            // Step 1: Search by keyword
            const searchRes = await request(app)
                .get('/api/v2/cars?search=Toyota')
                .expect(200);

            expect(searchRes.body.data).to.have.lengthOf(2);

            // Step 2: Sort by price ascending
            const sortAscRes = await request(app)
                .get('/api/v2/cars?sortBy=price&order=asc')
                .expect(200);

            expect(sortAscRes.body.data[0].price).to.be.lessThan(sortAscRes.body.data[1].price);

            // Step 3: Sort by price descending
            const sortDescRes = await request(app)
                .get('/api/v2/cars?sortBy=price&order=desc')
                .expect(200);

            expect(sortDescRes.body.data[0].price).to.be.greaterThan(sortDescRes.body.data[1].price);
        });
    });

    describe('Pagination Flow', () => {
        it('should paginate through car listings', async () => {
            // Create 15 cars
            for (let i = 1; i <= 15; i++) {
                await Car.create(createCarData({ 
                    title: `Car ${i}`,
                    price: 20000 + (i * 1000)
                }));
            }

            // Step 1: Get first page
            const page1Res = await request(app)
                .get('/api/v2/cars?page=1&limit=5')
                .expect(200);

            expect(page1Res.body.data).to.have.lengthOf(5);
            expect(page1Res.body).to.have.property('pagination');
            expect(page1Res.body.pagination).to.have.property('currentPage', 1);
            expect(page1Res.body.pagination).to.have.property('totalPages', 3);

            // Step 2: Get second page
            const page2Res = await request(app)
                .get('/api/v2/cars?page=2&limit=5')
                .expect(200);

            expect(page2Res.body.data).to.have.lengthOf(5);
            expect(page2Res.body.pagination).to.have.property('currentPage', 2);

            // Step 3: Get last page
            const page3Res = await request(app)
                .get('/api/v2/cars?page=3&limit=5')
                .expect(200);

            expect(page3Res.body.data).to.have.lengthOf(5);
            expect(page3Res.body.pagination).to.have.property('currentPage', 3);
        });
    });

    describe('Car Comparison Flow', () => {
        it('should compare multiple cars', async () => {
            const car1 = await Car.create(createCarData({ 
                make: 'Toyota',
                price: 25000,
                mileage: 15000
            }));
            
            const car2 = await Car.create(createCarData({ 
                make: 'Honda',
                price: 27000,
                mileage: 12000
            }));

            // Compare cars
            const compareRes = await request(app)
                .post('/api/v2/comparisons')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ carIds: [car1._id, car2._id] })
                .expect(200);

            expect(compareRes.body).to.have.property('success', true);
            expect(compareRes.body.data).to.be.an('array');
            expect(compareRes.body.data).to.have.lengthOf(2);
        });
    });
});
