const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { generateToken, getJwtSecret, requireAuthAPI } = require('../../middleware/auth');
const { canJoinRoom } = require('../../utils/socketAccess');
const { isPublicIPv4, publicLookup } = require('../../utils/publicImageAgent');
const { priceOrder } = require('../../services/OrderPricingService');
const { normalizeImage, requireUploadPermission } = require('../../utils/uploadPolicy');
const id = '507f1f77bcf86cd799439011';

describe('Security regression coverage', () => {
  let env, req, res, next, user;
  beforeEach(() => {
    env = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'a-secure-unit-test-secret-not-for-production';
    user = { _id: id, name: 'Buyer', role: 'buyer', tenantId: 'hmcar', status: 'active', tokenVersion: 0, permissions: [] };
    req = { headers: {}, tenant: { id: 'hmcar' }, tenantModels: { User: { findOne: sinon.stub().resolves(user) } } };
    res = { status: sinon.stub().returnsThis(), json: sinon.stub().returnsThis() };
    next = sinon.spy();
  });
  afterEach(() => {
    sinon.restore();
    for (const [key, value] of Object.entries(env)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });

  for (const role of ['buyer', 'admin', 'super_admin', 'manager']) it(`rejects cross-tenant ${role} token before DB access`, async () => {
    req.headers.authorization = `Bearer ${generateToken({ ...user, role }, 'carx')}`;
    await requireAuthAPI(req, res, next);
    expect(res.status.calledWith(403)).to.equal(true);
    expect(req.tenantModels.User.findOne.called).to.equal(false);
  });
  it('rejects a temporary 2FA token at protected APIs', async () => {
    req.headers.authorization = `Bearer ${jwt.sign({ userId: id, tenantId: 'hmcar', requiresTwoFactor: true }, getJwtSecret())}`;
    await requireAuthAPI(req, res, next);
    expect(res.status.calledWith(401)).to.equal(true);
    expect(next.called).to.equal(false);
  });
  it('rejects tokens issued before logout/password change', async () => {
    req.headers.authorization = `Bearer ${generateToken(user, 'hmcar')}`;
    user.tokenVersion = 1;
    await requireAuthAPI(req, res, next);
    expect(res.status.calledWith(401)).to.equal(true);
  });
  it('uses current database role instead of stale admin claim', async () => {
    req.headers.authorization = `Bearer ${generateToken({ ...user, role: 'admin' }, 'hmcar')}`;
    await requireAuthAPI(req, res, next);
    expect(next.calledOnce).to.equal(true);
    expect(req.user.role).to.equal('buyer');
  });
  it('rejects disabled accounts and pre-2FA access tokens', async () => {
    req.headers.authorization = `Bearer ${generateToken(user, 'hmcar')}`;
    user.twoFactorEnabled = true;
    await requireAuthAPI(req, res, next);
    expect(res.status.calledWith(401)).to.equal(true);
    user.twoFactorEnabled = false;
    user.status = 'suspended';
    await requireAuthAPI(req, res, next);
    expect(next.called).to.equal(false);
  });
  it('rejects missing and historical production JWT secrets', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(getJwtSecret).to.throw();
    process.env.JWT_SECRET = 'hmcar_jwt_secret_key_2026_production_shared';
    expect(getJwtSecret).to.throw();
  });
  it('restricts staff and personal socket rooms', () => {
    const buyer = { isAuthenticated: true, user: { role: 'buyer', userId: id } };
    expect(canJoinRoom(buyer, 'admin_room')).to.equal(false);
    expect(canJoinRoom(buyer, `user_${id}`)).to.equal(true);
    expect(canJoinRoom(buyer, 'user_someone_else')).to.equal(false);
    expect(canJoinRoom(buyer, { room: 'admin_room' })).to.equal(false);
    expect(canJoinRoom({ isAuthenticated: false }, `auction_${id}`)).to.equal(true);
  });
  it('blocks local, private, metadata and shared-network IPs', () => {
    for (const ip of ['127.0.0.1', '10.0.0.4', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.100.100.200', '::1']) expect(isPublicIPv4(ip)).to.equal(false);
    expect(isPublicIPv4('8.8.8.8')).to.equal(true);
  });
  it('rejects allowlisted hosts resolving to internal IPs', async () => {
    sinon.stub(require('dns'), 'lookup').callsFake((_host, _options, callback) => callback(null, [{ address: '127.0.0.1', family: 4 }]));
    const error = await new Promise(resolve => publicLookup('images.unsplash.com', {}, err => resolve(err)));
    expect(error).to.be.instanceOf(Error);
  });
  it('prices orders from the catalog despite forged client prices/rates', async () => {
    req.user = user;
    req.tenantModels.Car = { findOne: sinon.stub().returns({ lean: async () => ({ _id: id, title: 'Car', basePriceUsd: 10000, isActive: true }) }) };
    const result = await priceOrder(req, [{ itemType: 'car', refId: id, qty: 1, unitPriceSar: 1 }], { currencySettings: { usdToSar: 3.75 } });
    expect(result.pricing.grandTotalSar).to.equal(37500);
    expect(result.items[0].unitPriceSar).to.equal(37500);
  });
  for (const qty of [-1, 0, 1.5, 1001]) it(`rejects invalid order quantity ${qty}`, async () => {
    let error;
    try { await priceOrder(req, [{ itemType: 'car', refId: id, qty }], {}); } catch (caught) { error = caught; }
    expect(error?.status).to.equal(400);
  });
  it('denies buyer uploads', () => {
    requireUploadPermission({ user }, res, next);
    expect(res.status.calledWith(403)).to.equal(true);
  });
  it('rejects HTML and SVG disguised as image uploads', async () => {
    for (const body of ['<html>not an image</html>', '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>']) {
      let rejected = false;
      try { await normalizeImage(Buffer.from(body)); } catch { rejected = true; }
      expect(rejected).to.equal(true);
    }
  });
  it('re-encodes uploaded pixels as WebP', async () => {
    const sharp = require('sharp');
    const input = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#fff' } }).png().toBuffer();
    const output = await normalizeImage(input);
    expect((await sharp(output).metadata()).format).to.equal('webp');
  });
});
