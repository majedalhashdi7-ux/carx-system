// [[ARABIC_HEADER]] هذا الملف (models/ImportLog.js) يُوثق سجلات عمليات الاستيراد المنفصلة (سيارات المعرض، قطع الغيار، والمزادات المباشرة).

const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
    tenantId: {
        type: String,
        default: 'default',
        index: true
    },
    importType: {
        type: String,
        enum: ['showroom_cars', 'parts', 'live_auctions'],
        required: true,
        index: true
    },
    requestedLimit: {
        type: Number,
        default: 0
    },
    totalFetched: {
        type: Number,
        default: 0
    },
    totalImported: {
        type: Number,
        default: 0
    },
    totalSkipped: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        default: 'encar_korea'
    },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'failed'],
        default: 'completed',
        index: true
    },
    details: {
        type: String,
        default: ''
    },
    adminUser: {
        type: String,
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('ImportLog', importLogSchema);
