const { expect } = require('chai');
const { resolveTenant } = require('../../tenants/tenant-resolver');

describe('Tenant Resolver Security', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('ignores mismatched x-tenant-id in production when host is resolved', () => {
    process.env.NODE_ENV = 'production';

    const req = {
      headers: {
        host: 'daood.okigo.net',
        'x-tenant-id': 'carx',
      },
      query: {},
    };

    const tenant = resolveTenant(req);
    expect(tenant).to.be.an('object');
    expect(tenant.id).to.equal('hmcar');
  });

  it('ignores mismatched query tenant in production when host is resolved', () => {
    process.env.NODE_ENV = 'production';

    const req = {
      headers: {
        host: 'daood.okigo.net',
      },
      query: {
        tenant: 'carx',
      },
    };

    const tenant = resolveTenant(req);
    expect(tenant).to.be.an('object');
    expect(tenant.id).to.equal('hmcar');
  });
});
