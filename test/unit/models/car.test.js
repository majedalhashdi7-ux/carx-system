// Unit Tests for Car Model
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createCarData } = require('../../helpers/factories');
const Car = require('../../../models/Car');

describe('Car Model - Unit Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Car Creation', () => {
        it('should create a car with valid data', async () => {
            const carData = createCarData();
            const car = await Car.create(carData);

            expect(car).to.have.property('_id');
            expect(car.make).to.equal(carData.make);
            expect(car.model).to.equal(carData.model);
            expect(car.year).to.equal(carData.year);
        });

        it('should set default values correctly', async () => {
            const carData = createCarData();
            const car = await Car.create(carData);

            expect(car.isSold).to.equal(false);
            expect(car.isActive).to.equal(true);
            expect(car.listingType).to.equal('store');
            expect(car.source).to.equal('hm_local');
        });

        it('should create car with korean_import source', async () => {
            const carData = createCarData({ 
                source: 'korean_import',
                priceKrw: 25000000
            });
            const car = await Car.create(carData);

            expect(car.source).to.equal('korean_import');
            expect(car.priceKrw).to.equal(25000000);
        });
    });

    describe('Car Status', () => {
        it('should mark car as sold', async () => {
            const car = await Car.create(createCarData());
            
            car.isSold = true;
            car.soldAt = new Date();
            await car.save();

            const updated = await Car.findById(car._id);
            expect(updated.isSold).to.be.true;
            expect(updated.soldAt).to.be.instanceOf(Date);
        });

        it('should deactivate car', async () => {
            const car = await Car.create(createCarData());
            
            car.isActive = false;
            await car.save();

            const updated = await Car.findById(car._id);
            expect(updated.isActive).to.be.false;
        });
    });

    describe('Listing Types', () => {
        it('should create store listing', async () => {
            const car = await Car.create(createCarData({ listingType: 'store' }));
            expect(car.listingType).to.equal('store');
        });

        it('should create auction listing', async () => {
            const car = await Car.create(createCarData({ listingType: 'auction' }));
            expect(car.listingType).to.equal('auction');
        });

        it('should create showroom listing', async () => {
            const car = await Car.create(createCarData({ listingType: 'showroom' }));
            expect(car.listingType).to.equal('showroom');
        });
    });

    describe('Validations', () => {
        it('should require title', async () => {
            const carData = createCarData();
            delete carData.title;

            try {
                await Car.create(carData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should enforce listingType enum', async () => {
            const carData = createCarData({ listingType: 'invalid_type' });

            try {
                await Car.create(carData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should enforce source enum', async () => {
            const carData = createCarData({ source: 'invalid_source' });

            try {
                await Car.create(carData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });
    });

    describe('Pricing', () => {
        it('should store multiple currency prices', async () => {
            const carData = createCarData({
                priceSar: 100000,
                priceUsd: 26666,
                priceKrw: 36000000
            });
            const car = await Car.create(carData);

            expect(car.priceSar).to.equal(100000);
            expect(car.priceUsd).to.equal(26666);
            expect(car.priceKrw).to.equal(36000000);
        });

        it('should set display currency', async () => {
            const car = await Car.create(createCarData({ displayCurrency: 'USD' }));
            expect(car.displayCurrency).to.equal('USD');
        });
    });
});
