// Cloudinary upload helper for CAR X - Uses Direct REST API (no heavy SDK)

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'majedalhashdi';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'carx_preset';

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'فشل رفع الصورة إلى الخادم السحابي');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err: any) {
    console.error('Cloudinary Upload Error:', err);
    throw new Error(err.message || 'فشل الاتصال بخادم رفع الصور السحابي');
  }
};

// Helper to build optimized Cloudinary URLs
export const getOptimizedUrl = (publicId: string, width = 800) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicId}`;
