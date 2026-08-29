const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
    if (line.includes('MONGO') && line.includes('mongodb')) {
        const parts = line.split('=');
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        try {
            // Mask password
            const masked = v.replace(/:([^:@]+)@/, ':***@');
            console.log(`${k} = ${masked}`);
        } catch(e) {
            console.log(k, e.message);
        }
    }
});
