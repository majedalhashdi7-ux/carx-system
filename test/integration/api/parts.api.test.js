// Parts API Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createPartData } = require('../../helpers/factories');
const SparePart = require('../../../models/SparePart');

describe('Parts API Integration Tests', () => {
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

    describe('GET /api/v2/parts', () => {
        it('should return list of parts', async () => {
            await SparePart.create(createPartData());
            await SparePart.create(createPartData({ name: 'Brake Pad' }));

            const res = await request(app)
                .get('/api/v2/parts')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
        });

        it('should filter parts by type', async () => {
            await SparePart.create(createPartData({ partType: 'engine' }));
            await SparePart.create(createPartData({ partType: 'brake' }));

            const res = await request(app)
                .get('/api/v2/parts?partType=engine')
                .expect(200);

            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].partType).to.equal('engine');
        });

        it('should search parts by name', async () => {
            await SparePart.create(createPartData({ name: 'Engine Oil Filter' }));
            await SparePart.create(createPartData({ name: 'Brake Pad' }));

            const res = await request(app)
                .get('/api/v2/parts?search=Engine')
                .expect(200);

            expect(res.body.data).to.have.lengthOf(1);
            expect(res.body.data[0].name).to.include('Engine');
        });
    });

    describe('GET /api/v2/parts/:id', () => {
        it('should return part details', async () => {
            const part = await SparePart.create(createPartData());

            const res = await request(app)
                .get(`/api/v2/parts/${part._id}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('_id', part._id.toString());
            expect(res.body.data).to.have.property('name', part.name);
        });

        it('should return 404 for non-existent part', async () => {
            const fakeId = '507f1f77bcf86cd799439011';

            const res = await request(app)
                .get(`/api/v2/parts/${fakeId}`)
                .expect(404);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('Stock Management', () => {
        it('should check part availability', async () => {
            const part = await SparePart.create(createPartData({ stockQty: 5 }));

            const res = await request(app)
                .get(`/api/v2/parts/${part._id}`)
                .expect(200);

            expect(res.body.data).to.have.property('stockQty', 5);
            expect(res.body.data.stockQty).to.be.greaterThan(0);
        });

        it('should show out of stock parts', async () => {
            const part = await SparePart.create(createPartData({ stockQty: 0 }));

            const res = await request(app)
                .get(`/api/v2/parts/${part._id}`)
                .expect(200);

            expect(res.body.data).to.have.property('stockQty', 0);
        });
    });
});
