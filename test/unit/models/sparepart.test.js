// Unit Tests for SparePart Model
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createPartData } = require('../../helpers/factories');
const SparePart = require('../../../models/SparePart');

describe('SparePart Model - Unit Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Part Creation', () => {
        it('should create a spare part with valid data', async () => {
            const partData = createPartData();
            const part = await SparePart.create(partData);

            expect(part).to.have.property('_id');
            expect(part.name).to.equal(partData.name);
            expect(part.price).to.equal(partData.price);
        });

        it('should set default values correctly', async () => {
            const partData = createPartData();
            delete partData.stockQty; // Remove to test default
            const part = await SparePart.create(partData);

            expect(part.stockQty).to.equal(999);
            expect(part.soldCount).to.equal(0);
            expect(part.inStock).to.equal(true);
            expect(part.source).to.equal('manual');
        });

        it('should create part with bilingual names', async () => {
            const partData = createPartData({
                name: 'Oil Filter',
                nameEn: 'Oil Filter',
                nameAr: 'فلتر زيت'
            });
            const part = await SparePart.create(partData);

            expect(part.nameEn).to.equal('Oil Filter');
            expect(part.nameAr).to.equal('فلتر زيت');
        });
    });

    describe('Stock Management', () => {
        it('should update stock quantity', async () => {
            const part = await SparePart.create(createPartData({ stockQty: 100 }));

            part.stockQty = 50;
            await part.save();

            const updated = await SparePart.findById(part._id);
            expect(updated.stockQty).to.equal(50);
        });

        it('should track sold count', async () => {
            const part = await SparePart.create(createPartData());

            part.soldCount = 5;
            await part.save();

            const updated = await SparePart.findById(part._id);
            expect(updated.soldCount).to.equal(5);
        });

        it('should mark as out of stock', async () => {
            const part = await SparePart.create(createPartData());

            part.inStock = false;
            await part.save();

            const updated = await SparePart.findById(part._id);
            expect(updated.inStock).to.be.false;
        });
    });

    describe('Pricing', () => {
        it('should store multiple currency prices', async () => {
            const partData = createPartData({
                price: 150,
                priceSar: 562.5,
                priceUsd: 150,
                priceKrw: 202500
            });
            const part = await SparePart.create(partData);

            expect(part.priceSar).to.equal(562.5);
            expect(part.priceUsd).to.equal(150);
            expect(part.priceKrw).to.equal(202500);
        });
    });

    describe('Car Compatibility', () => {
        it('should store compatible car make and model', async () => {
            const partData = createPartData({
                carMake: 'Toyota',
                carModel: 'Camry',
                carYear: 2020
            });
            const part = await SparePart.create(partData);

            expect(part.carMake).to.equal('Toyota');
            expect(part.carModel).to.equal('Camry');
            expect(part.carYear).to.equal(2020);
        });

        it('should store bilingual car info', async () => {
            const partData = createPartData({
                carMake: 'Toyota',
                carMakeEn: 'Toyota',
                carModel: 'Camry',
                carModelEn: 'Camry'
            });
            const part = await SparePart.create(partData);

            expect(part.carMakeEn).to.equal('Toyota');
            expect(part.carModelEn).to.equal('Camry');
        });
    });

    describe('Validations', () => {
        it('should require name', async () => {
            const partData = createPartData();
            delete partData.name;

            try {
                await SparePart.create(partData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should require price', async () => {
            const partData = createPartData();
            delete partData.price;

            try {
                await SparePart.create(partData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });
    });

    describe('Part Types', () => {
        it('should store part type', async () => {
            const part = await SparePart.create(createPartData({ partType: 'engine' }));
            expect(part.partType).to.equal('engine');
        });

        it('should store bilingual part types', async () => {
            const partData = createPartData({
                partType: 'Brake',
                partTypeEn: 'Brake',
                partTypeAr: 'فرامل'
            });
            const part = await SparePart.create(partData);

            expect(part.partTypeEn).to.equal('Brake');
            expect(part.partTypeAr).to.equal('فرامل');
        });
    });
});
