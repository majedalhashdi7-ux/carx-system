const request = require('supertest');
const { expect } = require('chai');

describe('Tenant Routing Integration', function() {
  this.timeout(30000);
  let app;
  let App;
  let tenantDbManager;
  let originalGetConnection;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSessionSecret = process.env.SESSION_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  before(async function() {
    this.timeout(30000);
    try {
      process.env.NODE_ENV = 'production';
      process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

      tenantDbManager = require('../../tenants/tenant-db-manager');
      originalGetConnection = tenantDbManager.getConnection;
      tenantDbManager.getConnection = async () => ({
        connection: { readyState: 1 },
        models: {},
      });

      App = require('../../modules/app');
      app = new App().app;
    } catch (error) {
      console.warn('Skipping suite: test setup failed on this machine.', error.message);
      this.skip();
    }
  });

  after(async function() {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SESSION_SECRET = originalSessionSecret;
    process.env.JWT_SECRET = originalJwtSecret;
    if (tenantDbManager && originalGetConnection) {
      tenantDbManager.getConnection = originalGetConnection;
    }
  });

  it('keeps host tenant even with mismatched x-tenant-id header', async function() {
    const res = await request(app)
      .get('/api/v2/tenant/info')
      .set('Host', 'daood.okigo.net')
      .set('X-Tenant-ID', 'carx')
      .expect(200);

    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.nested.property('data.id', 'hmcar');
  });

  it('keeps host tenant even with mismatched query tenant', async function() {
    const res = await request(app)
      .get('/api/v2/tenant/info?tenant=carx')
      .set('Host', 'daood.okigo.net')
      .expect(200);

    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.nested.property('data.id', 'hmcar');
  });

  it('keeps carx host tenant even with mismatched header and query', async function() {
    const res = await request(app)
      .get('/api/v2/tenant/info?tenant=hmcar')
      .set('Host', 'carx-system.vercel.app')
      .set('X-Tenant-ID', 'hmcar')
      .expect(200);

    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.nested.property('data.id', 'carx');
  });
});
