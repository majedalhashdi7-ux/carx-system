const mongoose = require('mongoose');
require('dotenv').config();

async function checkSettings() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGO_URI is missing');
        process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    const SiteSettings = require('../models/SiteSettings');
    const settings = await mongoose.connection.collection('sitesettings').findOne({ key: 'main' });
    
    console.log('Current Main Settings:', JSON.stringify(settings, null, 2));
    
    process.exit(0);
}

checkSettings();
