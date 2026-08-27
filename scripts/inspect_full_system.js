require('dotenv').config({ path: 'c:/car-auction/.env' });
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('=== MongoDB Database Inspection ===');
  console.log('Database Name:', mongoose.connection.name);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (let col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`- ${col.name}: ${count} documents`);
  }

  console.log('\n=== Cars Collection Details ===');
  const cars = await mongoose.connection.db.collection('cars').find({}).toArray();
  console.log('Total Cars:', cars.length);
  const byTenant = {};
  cars.forEach(c => {
    const t = c.tenantId || 'no-tenant';
    byTenant[t] = (byTenant[t] || 0) + 1;
  });
  console.log('Cars by Tenant:', byTenant);

  // Check Brands
  const brands = await mongoose.connection.db.collection('brands').find({}).toArray();
  console.log('\n=== Brands Collection Details ===');
  console.log('Total Brands:', brands.length);
  brands.forEach(b => console.log(`  - ${b.nameAr || b.name} (${b.nameEn || b.name}) [Tenant: ${b.tenantId}]`));

  // Check Users
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('\n=== Users Collection Details ===');
  console.log('Total Users:', users.length);
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) [Role: ${u.role}, Tenant: ${u.tenantId}]`));

  // Check Orders
  const orders = await mongoose.connection.db.collection('orders').find({}).toArray();
  console.log('\n=== Orders Collection Details ===');
  console.log('Total Orders:', orders.length);

  // Check Invoices
  const invoices = await mongoose.connection.db.collection('invoices').find({}).toArray();
  console.log('\n=== Invoices Collection Details ===');
  console.log('Total Invoices:', invoices.length);

  // Check Parts
  const parts = await mongoose.connection.db.collection('parts').find({}).toArray();
  console.log('\n=== Parts Collection Details ===');
  console.log('Total Parts:', parts.length);

  // Check SiteSettings
  const settings = await mongoose.connection.db.collection('sitesettings').find({}).toArray();
  console.log('\n=== SiteSettings Details ===');
  console.log('Total Settings Docs:', settings.length);
  settings.forEach(s => console.log(`  - Tenant: ${s.tenantId}, Showroom URL: ${s.showroomEncarUrl?.substring(0, 60)}...`));

  await mongoose.disconnect();
}
run().catch(console.error);
