const fs = require('fs');
const envContent = fs.readFileSync('.env.prod.local', 'utf8');
const lines = envContent.split('\n');
console.log('Total lines:', lines.length);
lines.forEach(line => {
    if (line.includes('MONGO') || line.includes('mongodb')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) return;
        const key = line.substring(0, eqIdx);
        const rawVal = line.substring(eqIdx + 1).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        const masked = rawVal.replace(/:([^@:]+)@/, ':***@');
        console.log(`${key} = ${masked.substring(0, 90)}`);
    }
});
