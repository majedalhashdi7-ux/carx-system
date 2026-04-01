// Unit Tests for Auction Model
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createCarData, createAuctionData } = require('../../helpers/factories');
const Auction = require('../../../models/Auction');
const Car = require('../../../models/Car');

describe('Auction Model - Unit Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Auction Creation', () => {
        it('should create an auction with valid data', async () => {
            const car = await Car.create(createCarData());
            const auctionData = createAuctionData(car._id);
            const auction = await Auction.create(auctionData);

            expect(auction).to.have.property('_id');
            expect(auction.car.toString()).to.equal(car._id.toString());
            expect(auction.startingPrice).to.equal(auctionData.startingPrice);
        });

        it('should set default values correctly', async () => {
            const car = await Car.create(createCarData());
            const auctionData = createAuctionData(car._id);
            delete auctionData.status; // Remove to test default
            delete auctionData.currentPrice; // Remove to test default
            const auction = await Auction.create(auctionData);

            expect(auction.status).to.equal('scheduled');
            expect(auction.currency).to.equal('SAR');
            expect(auction.currentPrice).to.equal(0);
        });

        it('should create auction with USD currency', async () => {
            const car = await Car.create(createCarData());
            const auctionData = createAuctionData(car._id, { currency: 'USD' });
            const auction = await Auction.create(auctionData);

            expect(auction.currency).to.equal('USD');
        });
    });

    describe('Auction Status', () => {
        it('should create scheduled auction', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id, { status: 'scheduled' }));

            expect(auction.status).to.equal('scheduled');
        });

        it('should update to running status', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id));

            auction.status = 'running';
            await auction.save();

            const updated = await Auction.findById(auction._id);
            expect(updated.status).to.equal('running');
        });

        it('should update to ended status', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id));

            auction.status = 'ended';
            await auction.save();

            const updated = await Auction.findById(auction._id);
            expect(updated.status).to.equal('ended');
        });
    });

    describe('isActive Method', () => {
        it('should return true for active auction', async () => {
            const car = await Car.create(createCarData());
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            const auction = await Auction.create(createAuctionData(car._id, {
                startsAt: now,
                endsAt: tomorrow,
                status: 'running'
            }));

            expect(auction.isActive()).to.be.true;
        });

        it('should return false for ended auction', async () => {
            const car = await Car.create(createCarData());
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            const auction = await Auction.create(createAuctionData(car._id, {
                startsAt: now,
                endsAt: tomorrow,
                status: 'ended'
            }));

            expect(auction.isActive()).to.be.false;
        });

        it('should return false for future auction', async () => {
            const car = await Car.create(createCarData());
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
            
            const auction = await Auction.create(createAuctionData(car._id, {
                startsAt: tomorrow,
                endsAt: dayAfter,
                status: 'scheduled'
            }));

            expect(auction.isActive()).to.be.false;
        });
    });

    describe('Validations', () => {
        it('should require car reference', async () => {
            const auctionData = createAuctionData(null);

            try {
                await Auction.create(auctionData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should require startingPrice', async () => {
            const car = await Car.create(createCarData());
            const auctionData = createAuctionData(car._id);
            delete auctionData.startingPrice;

            try {
                await Auction.create(auctionData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should enforce status enum', async () => {
            const car = await Car.create(createCarData());
            const auctionData = createAuctionData(car._id, { status: 'invalid_status' });

            try {
                await Auction.create(auctionData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });
    });

    describe('Bidding', () => {
        it('should update current price', async () => {
            const car = await Car.create(createCarData());
            const auction = await Auction.create(createAuctionData(car._id, { startingPrice: 20000 }));

            auction.currentPrice = 25000;
            await auction.save();

            const updated = await Auction.findById(auction._id);
            expect(updated.currentPrice).to.equal(25000);
        });
    });
});
