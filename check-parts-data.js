const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const SparePart = require('./models/SparePart');
const Brand = require('./models/Brand');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
    const models = await SparePart.distinct('carModel', { carMake: 'اوبل' });
    console.log('=== Opel carModel values ===');
    models.forEach(m => console.log(JSON.stringify(m)));
    
    const mgModels = await SparePart.distinct('carModel', { carMake: 'ام جي' });
    console.log('\n=== MG carModel values ===');
    mgModels.forEach(m => console.log(JSON.stringify(m)));
    
    mongoose.disconnect();
}).catch(e => { console.error('DB Error:', e.message); process.exit(1); });
