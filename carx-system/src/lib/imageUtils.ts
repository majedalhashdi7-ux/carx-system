// Image utility functions for CAR X
// Compresses images client-side using Canvas API — no external service needed

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 - 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Compress an image file using Canvas API.
 * Returns a base64 data URL (can be stored directly in MongoDB).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 900,
    quality = 0.78,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // White background for transparent PNGs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل قراءة الصورة'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple files and return array of base64 strings.
 * Limits to maxFiles images total.
 */
export async function compressMultiple(
  files: FileList | File[],
  options: CompressOptions = {},
  maxFiles = 8
): Promise<string[]> {
  const arr = Array.from(files).slice(0, maxFiles);
  const results: string[] = [];
  for (const file of arr) {
    try {
      const compressed = await compressImage(file, options);
      results.push(compressed);
    } catch {
      // skip failed files silently
    }
  }
  return results;
}

/**
 * Compress a logo/avatar to a small circle-friendly square (max 400x400).
 */
export async function compressLogo(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    mimeType: 'image/webp',
  });
}

/** Format bytes to a human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Estimate base64 data URL size in bytes */
export function estimateDataUrlSize(dataUrl: string): number {
  // base64 overhead is ~1.33x + ~22 chars for the header
  return Math.round((dataUrl.length - 22) * 0.75);
}

// ═══════════════════════════════════════════════════════════
// Vercel Blob Upload — رفع صور دائمة عبر Vercel Blob
// ═══════════════════════════════════════════════════════════

/**
 * رفع صورة واحدة إلى Vercel Blob وإرجاع رابط دائم.
 * يستخدم API route /api/upload داخلياً.
 */
export async function uploadToVercelBlob(
  file: File,
  folder: 'cars' | 'parts' | 'brands' | 'logos' = 'cars'
): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);

  const apiBase = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || '');

  const res = await fetch(`${apiBase}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.message || 'فشل رفع الصورة');
  }

  const data = await res.json();
  if (!data.url) throw new Error('لم يُرجع الخادم رابط الصورة');
  return data.url;
}

/**
 * رفع عدة صور إلى Vercel Blob بالتسلسل.
 * يعود بمصفوفة روابط دائمة.
 */
export async function uploadMultipleToBlob(
  files: FileList | File[],
  folder: 'cars' | 'parts' | 'brands' | 'logos' = 'cars',
  maxFiles = 8,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const arr = Array.from(files).slice(0, maxFiles);
  const results: string[] = [];

  for (let i = 0; i < arr.length; i++) {
    try {
      onProgress?.(i + 1, arr.length);
      const url = await uploadToVercelBlob(arr[i], folder);
      results.push(url);
    } catch (err) {
      console.warn(`Failed to upload image ${i + 1}:`, err);
      // تخطّ الصورة الفاشلة بدون وقف العملية
    }
  }

  return results;
}

/**
 * رفع شعار إلى Vercel Blob.
 * يضغط الصورة أولاً ثم يرفعها.
 */
export async function uploadLogoToBlob(file: File): Promise<string> {
  // ضغط الصورة أولاً
  const compressed = await compressLogo(file);
  // تحويل base64 إلى File
  const res = await fetch(compressed);
  const blob = await res.blob();
  const compressedFile = new File([blob], file.name, { type: 'image/webp' });
  return uploadToVercelBlob(compressedFile, 'logos');
}
