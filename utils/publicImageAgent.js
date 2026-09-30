const dns = require('dns');
const net = require('net');
const https = require('https');

const blocked = new net.BlockList();
for (const [address, prefix] of [['0.0.0.0',8], ['10.0.0.0',8], ['100.64.0.0',10], ['127.0.0.0',8], ['169.254.0.0',16], ['172.16.0.0',12], ['192.0.0.0',24], ['192.168.0.0',16], ['198.18.0.0',15], ['224.0.0.0',4], ['240.0.0.0',4]]) blocked.addSubnet(address, prefix, 'ipv4');

function isPublicIPv4(address) {
  return net.isIPv4(address) && !blocked.check(address, 'ipv4');
}

function publicLookup(hostname, options, callback) {
  // Resolve once and pin the checked address into the actual TLS connection.
  dns.lookup(hostname, { all: true, family: 4 }, (error, records) => {
    if (error) return callback(error);
    if (!records.length || records.some(record => !isPublicIPv4(record.address))) return callback(new Error('Private image destination rejected'));
    if (options?.all) return callback(null, records);
    callback(null, records[0].address, 4);
  });
}

module.exports = { isPublicIPv4, publicLookup, agent: new https.Agent({ lookup: publicLookup }) };
