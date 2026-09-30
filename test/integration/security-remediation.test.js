const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');
const speakeasy = require('speakeasy');
const { placeBid } = require('../../services/BiddingService');
const { generateToken, requireAuthAPI } = require('../../middleware/auth');

describe('Security integration on isolated replica set', function () {
  this.timeout(120000);
  let replica, connection, models, user, req, app, previousEnv;
  before(async () => {
    previousEnv = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'integration-only-secret-never-used-in-production';
    replica = await MongoMemoryReplSet.create({ binary: { downloadDir: require('path').join(__dirname, '../../.cache/mongodb') }, replSet: { count: 1 } });
    connection = await mongoose.createConnection(replica.getUri('security_remediation')).asPromise();
    models = {};
    for (const name of ['User', 'Auction', 'Bid']) models[name] = connection.model(name, require(`../../models/${name}`).schema);
    await Promise.all(Object.values(models).map(model => model.init()));
    models.SiteSettings = { getSettings: async () => ({ currencySettings: { auctionMultiplier: 1, usdToSar: 3.75 } }) };
    models.AuditLog = { logUserAction: async () => {} };
    models.DeviceFingerprint = { findOne: async () => null };
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.tenant = { id: 'hmcar' }; req.tenantModels = models; next(); });
    app.use('/auth', require('../../routes/api/v2/auth'));
    app.use('/system', require('../../routes/api/v2/system'));
    app.use('/parts', require('../../routes/api/v2/parts'));
    app.use('/upload', require('../../routes/api/v2/upload'));
    app.use('/live-auctions', require('../../routes/api/v2/live-auctions'));
    app.get('/protected', requireAuthAPI, (req, res) => res.json({ role: req.user.role }));
  });
  beforeEach(async () => {
    await Promise.all(['User', 'Auction', 'Bid'].map(name => models[name].deleteMany({})));
    user = await models.User.create({ tenantId: 'hmcar', name: 'Test buyer', email: 'buyer@example.com', password: 'test-password-123', role: 'buyer', status: 'active' });
    req = { tenant: { id: 'hmcar' }, tenantModels: models, user: { userId: String(user._id) } };
  });
  after(async () => {
    if (connection) await connection.close();
    if (replica) await replica.stop();
    for (const [key, value] of Object.entries(previousEnv || {})) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });
  async function auction(extra = {}) {
    return models.Auction.create({ tenantId: 'hmcar', car: new mongoose.Types.ObjectId(), startingPrice: 100, currentPrice: 100, startsAt: new Date(Date.now() - 60000), endsAt: new Date(Date.now() + 600000), status: 'running', ...extra });
  }
  it('commits the winning price and its bid record together', async () => {
    const record = await auction();
    await placeBid(req, record._id.toString(), 200);
    expect(await models.Bid.countDocuments({ auction: record._id, userId: user._id })).to.equal(1);
    const updated = await models.Auction.findById(record._id);
    expect(updated.currentPrice).to.equal(200);
    expect(updated.bidsCount).to.equal(1);
  });
  it('keeps the highest price under concurrent bidding', async () => {
    const record = await auction();
    const outcomes = await Promise.allSettled([placeBid(req, String(record._id), 200), placeBid(req, String(record._id), 400)]);
    expect(outcomes.filter(x => x.status === 'fulfilled').length).to.be.greaterThan(0);
    const updated = await models.Auction.findById(record._id);
    expect(updated.currentPrice).to.equal(400);
    expect(updated.bidsCount).to.equal(await models.Bid.countDocuments({ auction: record._id }));
  });
  it('rejects expired and future auctions without writing bids', async () => {
    for (const extra of [{ endsAt: new Date(Date.now() - 1000) }, { startsAt: new Date(Date.now() + 60000) }]) {
      const record = await auction(extra);
      let rejected;
      try { await placeBid(req, String(record._id), 500); } catch (error) { rejected = error; }
      expect(rejected?.status).to.equal(400);
    }
    expect(await models.Bid.countDocuments()).to.equal(0);
  });
  it('rolls back the price if saving the bid fails', async () => {
    const record = await auction();
    const broken = { ...req, tenantModels: { ...models, Bid: { create: async () => { throw new Error('storage failure'); } } } };
    try { await placeBid(broken, String(record._id), 500); } catch {}
    expect((await models.Auction.findById(record._id)).currentPrice).to.equal(100);
    expect(await models.Bid.countDocuments()).to.equal(0);
  });
  it('issues a challenge after password login and accepts only the verified 2FA token', async () => {
    user.twoFactorEnabled = true;
    user.twoFactorSecret = speakeasy.generateSecret().base32;
    await user.save();
    const login = await request(app).post('/auth/login').send({ email: user.email, password: 'test-password-123' }).expect(200);
    expect(login.body.requiresTwoFactor).to.equal(true);
    expect(login.body.token).to.equal(undefined);
    await request(app).get('/protected').set('Authorization', `Bearer ${login.body.tempToken}`).expect(401);
    const code = speakeasy.totp({ secret: user.twoFactorSecret, encoding: 'base32' });
    const verified = await request(app).post('/auth/2fa/verify').send({ tempToken: login.body.tempToken, code }).expect(200);
    await request(app).get('/protected').set('Authorization', `Bearer ${verified.body.token}`).expect(200);
  });
  it('revokes a real token after logout', async () => {
    const token = generateToken(user, 'hmcar');
    await request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get('/protected').set('Authorization', `Bearer ${token}`).expect(401);
  });
  it('revokes a real token after a password update', async () => {
    const token = generateToken(user, 'hmcar');
    user.password = 'changed-password-456';
    await user.save();
    await request(app).get('/protected').set('Authorization', `Bearer ${token}`).expect(401);
  });
  it('removes unsafe maintenance routes even with historical bypass values', async () => {
    for (const path of ['fast-seed', 'init-db', 'seed-data', 'import-batch']) {
      await request(app).post(`/system/${path}`).send({ secret: 'hmcar-import-2026' }).expect(410);
      await request(app).get(`/system/${path}?secret=hmcar-init-2026`).expect(410);
    }
    await request(app).get('/auth/temp-reset-admin-password').expect(404);
  });
  it('rejects buyer mutations of parts and image uploads', async () => {
    const token = generateToken(user, 'hmcar');
    for (const [method, path] of [['post', '/parts'], ['put', `/parts/${user._id}`], ['delete', `/parts/${user._id}`], ['patch', `/parts/${user._id}/sold`], ['post', '/upload']]) {
      await request(app)[method](path).set('Authorization', `Bearer ${token}`).send({ soldQty: 1 }).expect(403);
    }
  });
  it('rejects unauthenticated synchronization requests', async () => {
    await request(app).get('/live-auctions/sync-all').expect(403);
  });
});
