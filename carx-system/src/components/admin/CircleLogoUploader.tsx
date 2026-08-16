'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, Award } from 'lucide-react';
import { uploadLogoToBlob } from '../../lib/imageUtils';

interface CircleLogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function CircleLogoUploader({
  value,
  onChange,
  placeholder = 'شعار الوكالة',
}: CircleLogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const blobUrl = await uploadLogoToBlob(file);
      onChange(blobUrl);
    } catch {
      setError('فشل رفع الشعار. تأكد من اتصالك بالإنترنت.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };


  return (
    <div className="space-y-4" dir="rtl">
      <label className="block text-xs font-bold text-white/60 uppercase tracking-widest">
        {placeholder}
      </label>

      <div className="flex items-center gap-6">
        {/* Circle Preview */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/5 overflow-hidden flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-luxury-gold animate-spin" />
            ) : value ? (
              <img
                src={value}
                alt="شعار الوكالة"
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <Award className="w-10 h-10 text-white/10" />
            )}
          </div>
          {/* Edit overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Upload className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Text area */}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-white/60">
            ارفع شعار الوكالة من جهازك — سيُضغط ويُعرض في الدائرة
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-luxury-gold/10 hover:border-luxury-gold/30 hover:text-luxury-gold transition-all disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              اختر صورة
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all"
              >
                حذف
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 font-bold">{error}</p>
          )}

          {/* OR URL input */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-white/20 font-bold">أو</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <input
            type="url"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-luxury-gold/40 transition-colors font-mono text-left"
            dir="ltr"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
