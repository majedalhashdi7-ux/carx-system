const axios = require('axios');

async function testApi() {
    try {
        const url = 'https://car-auction-sand.vercel.app/api/v2/parts?limit=1000';
        console.log("Calling:", url);
        const res = await axios.get(url, { timeout: 30000 });
        console.log("Status:", res.status);
        console.log("Success:", res.data.success);
        console.log("Parts count returned:", (res.data.parts || []).length);
        if (res.data.parts && res.data.parts.length > 0) {
            console.log("Sample part:", res.data.parts[0].name, "Brand:", res.data.parts[0].brand);
        }
    } catch(e) {
        console.error("Error:", e.message);
        if(e.response) console.log("Data:", e.response.data);
    }
}
testApi();
