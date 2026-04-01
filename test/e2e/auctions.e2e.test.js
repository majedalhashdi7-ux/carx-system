// Auctions E2E Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../helpers/setup');
const { createUserData, createCarData, createAuctionData, hashPassword } = require('../helpers/factories');
const User = require('../../models/User');
const Car = require('../../models/Car');
const Auction = require('../../models/Auction');

describe('Auctions Flow (E2E)', () => {
    let app;
    let user1Token;
    let user2Token;
    let user1Id;
    let user2Id;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        // Create first user
        const user1Data = createUserData({ email: 'user1@example.com' });
        const user1 = await User.create({
            ...user1Data,
            password: await hashPassword(user1Data.password),
        });
        user1Id = user1._id;

        const user1Login = await request(app)
            .post('/api/v2/auth/login')
            .send({
                email: user1Data.email,
                password: user1Data.password,
            });
        user1Token = user1Login.body.token;

        // Create second user
        const user2Data = createUserData({ 
            email: 'user2@example.com',
            phone: '+966509999999'
        });
        const user2 = await User.create({
            ...user2Data,
            password: await hashPassword(user2Data.password),
        });
        user2Id = user2._id;

        const user2Login = await request(app)
            .post('/api/v2/auth/login')
            .send({
                email: user2Data.email,
                password: user2Data.password,
            });
        user2Token = user2Login.body.token;
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Complete Auction Bidding Flow', () => {
        it('should browse auctions → view details → place bids → win auction', async () => {
            // Create car and auction
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id, {
                startingPrice: 20000,
                currentPrice: 20000,
                status: 'running',
            }));

            // Step 1: Browse active auctions
            const browseRes = await request(app)
                .get('/api/v2/auctions?status=running')
                .expect(200);

            expect(browseRes.body).to.have.property('success', true);
            expect(browseRes.body.data).to.be.an('array');
            expect(browseRes.body.data).to.have.lengthOf(1);

            // Step 2: View auction details
            const detailsRes = await request(app)
                .get(`/api/v2/auctions/${auction._id}`)
                .expect(200);

            expect(detailsRes.body.data).to.have.property('startingPrice', 20000);
            expect(detailsRes.body.data).to.have.property('status', 'running');

            // Step 3: User 1 places first bid
            const bid1Res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ amount: 21000 })
                .expect(200);

            expect(bid1Res.body).to.have.property('success', true);
            expect(bid1Res.body.data).to.have.property('currentPrice', 21000);

            // Step 4: User 2 places higher bid
            const bid2Res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user2Token}`)
                .send({ amount: 22000 })
                .expect(200);

            expect(bid2Res.body.data).to.have.property('currentPrice', 22000);

            // Step 5: User 1 places even higher bid
            const bid3Res = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ amount: 23000 })
                .expect(200);

            expect(bid3Res.body.data).to.have.property('currentPrice', 23000);

            // Step 6: View bid history
            const historyRes = await request(app)
                .get(`/api/v2/auctions/${auction._id}/bids`)
                .expect(200);

            expect(historyRes.body.data).to.be.an('array');
            expect(historyRes.body.data).to.have.lengthOf.at.least(3);

            // Step 7: View user's bids
            const myBidsRes = await request(app)
                .get('/api/v2/bids/my-bids')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(myBidsRes.body.data).to.be.an('array');
        });
    });

    describe('Auction Validation Flow', () => {
        it('should reject invalid bids', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id, {
                startingPrice: 20000,
                currentPrice: 20000,
                status: 'running',
            }));

            // Try to bid lower than current price
            const lowBidRes = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ amount: 15000 })
                .expect(400);

            expect(lowBidRes.body).to.have.property('success', false);

            // Try to bid on ended auction
            await Auction.findByIdAndUpdate(auction._id, { status: 'ended' });

            const endedBidRes = await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ amount: 25000 })
                .expect(400);

            expect(endedBidRes.body).to.have.property('success', false);
        });
    });

    describe('Auction Notifications Flow', () => {
        it('should track auction activity', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id));

            // Place bid
            await request(app)
                .post(`/api/v2/auctions/${auction._id}/bid`)
                .set('Authorization', `Bearer ${user1Token}`)
                .send({ amount: 21000 })
                .expect(200);

            // Check notifications
            const notificationsRes = await request(app)
                .get('/api/v2/notifications')
                .set('Authorization', `Bearer ${user1Token}`)
                .expect(200);

            expect(notificationsRes.body).to.have.property('success', true);
        });
    });

    describe('Auction Search and Filter Flow', () => {
        it('should filter auctions by various criteria', async () => {
            // Create multiple auctions
            const car1 = await Car.create(createCarData({ make: 'Toyota' }));
            const car2 = await Car.create(createCarData({ make: 'Honda' }));
            
            await Auction.create(createAuctionData(car1._id, {
                startingPrice: 20000,
                status: 'running',
            }));

            await Auction.create(createAuctionData(car2._id, {
                startingPrice: 25000,
                status: 'running',
            }));

            await Auction.create(createAuctionData(car1._id, {
                startingPrice: 30000,
                status: 'ended',
            }));

            // Filter by status
            const runningRes = await request(app)
                .get('/api/v2/auctions?status=running')
                .expect(200);

            expect(runningRes.body.data).to.have.lengthOf(2);

            // Filter by price range
            const priceRes = await request(app)
                .get('/api/v2/auctions?minPrice=20000&maxPrice=26000')
                .expect(200);

            expect(priceRes.body.data).to.have.lengthOf.at.least(1);
        });
    });
});
