
const { resolveTenant } = require('../tenants/tenant-resolver');
require('dotenv').config();

const mockReq = {
    headers: {
        host: 'carx-system-five.vercel.app'
    },
    query: {}
};

console.log('Resolving tenant for host:', mockReq.headers.host);
const tenant = resolveTenant(mockReq);

if (tenant) {
    console.log('Tenant ID:', tenant.id);
    console.log('Mongo URI:', tenant.mongoUri ? 'Exists' : 'MISSING');
    if (tenant.mongoUri) {
        console.log('URI Start:', tenant.mongoUri.substring(0, 30));
    }
} else {
    console.log('Tenant NOT FOUND');
}
