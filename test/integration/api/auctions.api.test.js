// Auctions API Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, createCarData, createAuctionData, hashPassword } = require('../../helpers/factories');
const { generateToken } = require('../../helpers/auth');
const User = require('../../../models/User');
const Car = require('../../../models/Car');
const Auction = require('../../../models/Auction');

describe('Auctions API Integration Tests', () => {
    let app;
    let userToken;
    let user;
    let car;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        const userData = createUserData();
        user = await User.create({
            ...userData,
            password: await hashPassword(userData.password),
        });
        userToken = generateToken(user._id.toString());

        car = await Car.create(createCarData());
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('GET /api/v2/auctions', () => {
        it('should return list of auctions', async () => {
            await Auction.create(createAuctionData(car._id));
            await Auction.create(createAuctionData(car._id, { startingPrice: 15000 }));

            const res = await request(app)
                .get('/api/v2/auctions')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
        });

        it('should filter active auctions', async () => {
            await Auction.create(createAuctionData(car._id, { status: 'running' }));
            await Auction.create(createAuctionData(car._id, { status: 'ended' }));

            const res = await request(app)
                .get('/api/v2/auctions?status=running')
                .expect(200);

            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].status).to.equal('running');
        });
    });

    describe('GET /api/v2/auctions/:id', () => {
        it('should return auction details', async () => {
            const auction = await Auction.create(createAuctionData(car._id));

            const res = await request(app)
                .get(`/api/v2/auctions/${auction._id}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('_id', auction._id.toString());
        });

        it('should return 404 for non-existent auction', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/api/v2/auctions/${fakeId}`)
                .expect(404);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/v2/auctions/:id/bid', () => {
        it('should place bid successfully', async () => {
            const auction = await Auction.create(createAuctionData(car._id));

            const res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 21000 })
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('currentPrice', 21000);
        });

        it('should fail with low bid amount', async () => {
            const auction = await Auction.create(createAuctionData(car._id));

            const res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ amount: 15000 })
                .expect(400);

            expect(res.body).to.have.property('success', false);
        });

        it('should fail without authentication', async () => {
            const auction = await Auction.create(createAuctionData(car._id));

            const res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .send({ amount: 21000 })
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });
});
