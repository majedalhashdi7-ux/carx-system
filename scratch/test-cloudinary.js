const fetch = require('node-fetch');

async function testUpload() {
  const cloudName = 'majedalhashdi';
  const preset = 'carx_preset';
  
  // A tiny 1x1 transparent GIF base64
  const base64Image = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  
  const formData = new URLSearchParams();
  formData.append('file', base64Image);
  formData.append('upload_preset', preset);
  
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

testUpload();
