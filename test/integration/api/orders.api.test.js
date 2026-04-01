// Orders API Integration Tests
const request = require('supertest');
const { expect } = require('chai');
const App = require('../../../modules/app');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, createOrderData, createPartData, hashPassword } = require('../../helpers/factories');
const { generateToken } = require('../../helpers/auth');
const User = require('../../../models/User');
const Order = require('../../../models/Order');
const SparePart = require('../../../models/SparePart');

describe('Orders API Integration Tests', () => {
    let app;
    let userToken;
    let user;
    let part;

    before(async () => {
        await setupTestDB();
        const appInstance = new App({ isServerless: true });
        app = appInstance.getExpressApp();
    });

    beforeEach(async () => {
        const userData = createUserData();
        // User.create() will automatically hash the password
        user = await User.create(userData);
        userToken = generateToken(user._id.toString());

        part = await SparePart.create(createPartData());
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('GET /api/v2/orders', () => {
        it('should return user orders', async () => {
            const items = [{ part: part._id, quantity: 2, price: part.price }];
            await Order.create(createOrderData(user._id, items));
            await Order.create(createOrderData(user._id, items));

            const res = await request(app)
                .get('/api/v2/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.be.an('array');
            expect(res.body.data).to.have.lengthOf(2);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .get('/api/v2/orders')
                .expect(401);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('POST /api/v2/orders', () => {
        it('should create order successfully', async () => {
            const orderData = {
                items: [
                    { part: part._id, quantity: 2, price: part.price }
                ]
            };

            const res = await request(app)
                .post('/api/v2/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(201);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('buyer', user._id.toString());
            expect(res.body.data.items).to.have.lengthOf(1);
        });

        it('should fail with empty items', async () => {
            const orderData = { items: [] };

            const res = await request(app)
                .post('/api/v2/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .send(orderData)
                .expect(400);

            expect(res.body).to.have.property('success', false);
        });
    });

    describe('GET /api/v2/orders/:id', () => {
        it('should return order details', async () => {
            const items = [{ part: part._id, quantity: 2, price: part.price }];
            const order = await Order.create(createOrderData(user._id, items));

            const res = await request(app)
                .get(`/api/v2/orders/${order._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body.data).to.have.property('_id', order._id.toString());
        });

        it('should fail for other user order', async () => {
            const otherUserData = createUserData({ email: 'other@example.com', phone: '+9876543210' });
            // User.create() will automatically hash the password
            const otherUser = await User.create(otherUserData);

            const items = [{ part: part._id, quantity: 2, price: part.price }];
            const order = await Order.create(createOrderData(otherUser._id, items));

            const res = await request(app)
                .get(`/api/v2/orders/${order._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(res.body).to.have.property('success', false);
        });
    });
});
