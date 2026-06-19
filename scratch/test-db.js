const mongoose = require('mongoose');

// Try direct connection using one of the shards resolved by nslookup
const uri = 'mongodb://hmcar_admin:2svcqiBXi2ak6V3T@ac-zyizetm-shard-00-02.jb1hm41.mongodb.net:27017/car-auction?ssl=true&authSource=admin&replicaSet=atlas-zyizetm-shard-0';

console.log('Connecting to:', uri.replace(/:([^:]+)@/, ':****@'));

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ Connected successfully to MongoDB Atlas via direct shard URI!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err);
  process.exit(1);
});
