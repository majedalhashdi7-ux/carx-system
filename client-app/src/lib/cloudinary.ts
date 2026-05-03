// Cloudinary upload helper - يستخدم REST API مباشرة بدون SDK

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  return data.secure_url;
};

// Helper لبناء رابط صورة محسّن من Cloudinary
export const getOptimizedUrl = (publicId: string, width = 800) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},f_auto,q_auto/${publicId}`;