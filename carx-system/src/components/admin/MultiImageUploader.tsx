'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadMultipleToBlob } from '../../lib/imageUtils';

function estimateDataUrlSize(dataUrl: string): number {
  if (!dataUrl || !dataUrl.startsWith('data:')) return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  hint?: string;
  folder?: 'cars' | 'parts' | 'brands' | 'logos';
}

export default function MultiImageUploader({
  images,
  onChange,
  maxImages = 8,
  label = 'صور المنتج',
  hint = 'اسحب وأفلت أو اضغط لاختيار صور متعددة',
  folder = 'cars',
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      setError(`الحد الأقصى ${maxImages} صور`);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress('جاري رفع الصور...');

    try {
      const uploaded = await uploadMultipleToBlob(
        files,
        folder,
        remaining,
        (current, total) => setUploadProgress(`جاري رفع ${current} من ${total}...`)
      );

      if (uploaded.length === 0) {
        setError('فشل رفع الصور. تأكد من اتصالك بالإنترنت.');
      } else {
        onChange([...images, ...uploaded]);
        setUploadProgress(`✅ تم رفع ${uploaded.length} صورة`);
        setTimeout(() => setUploadProgress(''), 3000);
      }
    } catch {
      setError('فشل رفع الصور. تأكد من أن الملفات صور صحيحة.');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange, folder]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-white/60">{label}</label>
        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full font-mono">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Drop Zone */}
      {images.length < maxImages && (
        <label
          className="relative flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-luxury-gold/40 hover:bg-white/[0.01] transition-all group text-center"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-10 h-10 text-luxury-gold animate-spin mb-3" />
              <span className="text-sm font-bold text-luxury-gold">{uploadProgress || 'جاري رفع الصور...'}</span>
              <span className="text-xs text-white/30 mt-1">يتم حفظها في التخزين السحابي الدائم</span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:border-luxury-gold/30 group-hover:bg-luxury-gold/5 transition-all">
                <Upload className="w-6 h-6 text-white/20 group-hover:text-luxury-gold transition-colors" />
              </div>
              <span className="text-sm font-bold mb-1">{hint}</span>
              <span className="text-xs text-white/30">PNG، JPG، WEBP — يتم الضغط تلقائياً</span>
              <span className="text-xs text-luxury-gold/60 mt-2 font-bold">
                يمكنك تحديد {maxImages - images.length} صورة بمرة واحدة
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
        </label>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((src, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50 aspect-square">
              <img
                src={src}
                alt={`صورة ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Size badge */}
              <div className="absolute bottom-1 right-1 text-[10px] font-bold text-white/60 bg-black/60 rounded px-1.5 py-0.5">
                {formatBytes(estimateDataUrlSize(src))}
              </div>
              {/* Main badge */}
              {idx === 0 && (
                <div className="absolute top-1 right-1 text-[10px] font-black text-black bg-luxury-gold rounded px-1.5 py-0.5">
                  رئيسية
                </div>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 left-1 p-1.5 bg-black/70 backdrop-blur rounded-lg text-white/40 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {/* Main label */}
              {idx === 0 && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-luxury-gold" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
