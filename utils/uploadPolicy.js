function requireUploadPermission(req, res, next) {
  const user = req.user;
  if (user && (['admin', 'super_admin'].includes(user.role) || (user.permissions || []).some(p => ['manage_cars', 'manage_parts', 'manage_brands', 'manage_settings'].includes(p)))) return next();
  return res.status(403).json({ success: false, error: 'Upload permission required' });
}
async function normalizeImage(buffer) {
  if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error('Invalid image size');
  const sharp = require('sharp');
  const metadata = await sharp(buffer, { limitInputPixels: 40000000 }).metadata();
  if (!['jpeg', 'png', 'webp', 'gif', 'avif'].includes(metadata.format)) throw new Error('Unsupported image type');
  return sharp(buffer, { limitInputPixels: 40000000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}
module.exports = { requireUploadPermission, normalizeImage };
