// Unit Tests for Order Model
const { expect } = require('chai');
const { setupTestDB, clearDatabase, closeDatabase } = require('../../helpers/setup');
const { createUserData, createOrderData } = require('../../helpers/factories');
const Order = require('../../../models/Order');
const User = require('../../../models/User');

describe('Order Model - Unit Tests', () => {
    before(async () => {
        await setupTestDB();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    after(async () => {
        await closeDatabase();
    });

    describe('Order Creation', () => {
        it('should create an order with valid data', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000001';
            
            const order = await Order.create(orderData);

            expect(order).to.have.property('_id');
            expect(order.buyer.toString()).to.equal(user._id.toString());
            expect(order.orderNumber).to.equal('HM-2026-000001');
        });

        it('should set default values correctly', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000002';
            
            const order = await Order.create(orderData);

            expect(order.status).to.equal('pending');
            expect(order.channel).to.equal('whatsapp');
            expect(order.items).to.be.an('array').that.is.empty;
        });

        it('should create order with items', async () => {
            const user = await User.create(createUserData());
            const items = [{
                itemType: 'car',
                refId: '507f1f77bcf86cd799439011',
                titleSnapshot: 'Toyota Camry 2023',
                qty: 1,
                unitPriceSar: 100000
            }];
            const orderData = createOrderData(user._id, items);
            orderData.orderNumber = 'HM-2026-000003';
            
            const order = await Order.create(orderData);

            expect(order.items).to.have.lengthOf(1);
            expect(order.items[0].itemType).to.equal('car');
            expect(order.items[0].titleSnapshot).to.equal('Toyota Camry 2023');
        });
    });

    describe('Order Status', () => {
        it('should update order status', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000004';
            const order = await Order.create(orderData);

            order.status = 'confirmed';
            await order.save();

            const updated = await Order.findById(order._id);
            expect(updated.status).to.equal('confirmed');
        });

        it('should track status history', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000005';
            const order = await Order.create(orderData);

            order.statusHistory.push({
                from: 'pending',
                to: 'confirmed',
                at: new Date()
            });
            await order.save();

            const updated = await Order.findById(order._id);
            expect(updated.statusHistory).to.have.lengthOf(1);
            expect(updated.statusHistory[0].to).to.equal('confirmed');
        });

        it('should support all status transitions', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000006';
            const order = await Order.create(orderData);

            const statuses = ['confirmed', 'processing', 'shipped_sea', 'customs_clearance', 'arrived', 'completed'];
            
            for (const status of statuses) {
                order.status = status;
                await order.save();
                
                const updated = await Order.findById(order._id);
                expect(updated.status).to.equal(status);
            }
        });
    });

    describe('Pricing', () => {
        it('should store pricing in multiple currencies', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000007';
            orderData.pricing = {
                subTotalSar: 100000,
                subTotalUsd: 26666,
                shippingSar: 5000,
                shippingUsd: 1333,
                grandTotalSar: 105000,
                grandTotalUsd: 28000
            };
            
            const order = await Order.create(orderData);

            expect(order.pricing.grandTotalSar).to.equal(105000);
            expect(order.pricing.grandTotalUsd).to.equal(28000);
        });

        it('should store exchange rate snapshot', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000008';
            orderData.pricing = {
                exchangeSnapshot: {
                    usdToSar: 3.75,
                    usdToKrw: 1350,
                    activeCurrency: 'SAR'
                }
            };
            
            const order = await Order.create(orderData);

            expect(order.pricing.exchangeSnapshot.usdToSar).to.equal(3.75);
            expect(order.pricing.exchangeSnapshot.activeCurrency).to.equal('SAR');
        });
    });

    describe('Validations', () => {
        it('should require orderNumber', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            delete orderData.orderNumber;

            try {
                await Order.create(orderData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should require buyer', async () => {
            const orderData = createOrderData(null, []);
            orderData.orderNumber = 'HM-2026-000009';

            try {
                await Order.create(orderData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });

        it('should enforce unique orderNumber', async () => {
            const user = await User.create(createUserData());
            const orderData1 = createOrderData(user._id, []);
            orderData1.orderNumber = 'HM-2026-000010';
            await Order.create(orderData1);

            const orderData2 = createOrderData(user._id, []);
            orderData2.orderNumber = 'HM-2026-000010';

            try {
                await Order.create(orderData2);
                expect.fail('Should have thrown duplicate key error');
            } catch (error) {
                expect(error.code).to.equal(11000);
            }
        });

        it('should enforce status enum', async () => {
            const user = await User.create(createUserData());
            const orderData = createOrderData(user._id, []);
            orderData.orderNumber = 'HM-2026-000011';
            orderData.status = 'invalid_status';

            try {
                await Order.create(orderData);
                expect.fail('Should have thrown validation error');
            } catch (error) {
                expect(error.name).to.equal('ValidationError');
            }
        });
    });

    describe('Order Items', () => {
        it('should support car items', async () => {
            const user = await User.create(createUserData());
            const items = [{
                itemType: 'car',
                refId: '507f1f77bcf86cd799439011',
                titleSnapshot: 'BMW X5 2023',
                qty: 1,
                unitPriceSar: 250000
            }];
            const orderData = createOrderData(user._id, items);
            orderData.orderNumber = 'HM-2026-000012';
            
            const order = await Order.create(orderData);

            expect(order.items[0].itemType).to.equal('car');
        });

        it('should support spare part items', async () => {
            const user = await User.create(createUserData());
            const items = [{
                itemType: 'sparePart',
                refId: '507f1f77bcf86cd799439011',
                titleSnapshot: 'Brake Pads',
                qty: 2,
                unitPriceSar: 500
            }];
            const orderData = createOrderData(user._id, items);
            orderData.orderNumber = 'HM-2026-000013';
            
            const order = await Order.create(orderData);

            expect(order.items[0].itemType).to.equal('sparePart');
            expect(order.items[0].qty).to.equal(2);
        });
    });
});
