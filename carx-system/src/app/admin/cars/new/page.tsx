'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import MultiImageUploader from '../../../../components/admin/MultiImageUploader';

export default function NewCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    category: 'sedan',
    fuelType: 'petrol',
    transmission: 'automatic',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('يرجى إضافة صورة واحدة على الأقل للسيارة');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('carx_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v2'}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'carx',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images,
          imageUrl: images[0] || '',
          isActive: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'حدث خطأ أثناء إضافة السيارة');
      }

      router.push('/admin/cars');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للقائمة
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight">إضافة <span className="text-luxury-gold">سيارة جديدة</span></h1>
        <p className="text-white/40 mt-2 text-sm font-medium">أدخل تفاصيل السيارة لعرضها في المعرض الحصري.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 blur-[100px] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-white/60 mb-2">اسم السيارة (العنوان)</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                placeholder="مثال: مرسيدس جي كلاس 2024"
              />
            </div>

            {/* Make & Model */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الماركة</label>
              <input
                type="text"
                name="make"
                required
                value={formData.make}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                placeholder="مثال: Mercedes"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الموديل</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                placeholder="مثال: G63 AMG"
              />
            </div>

            {/* Year & Price */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">سنة الصنع</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min={1990}
                max={new Date().getFullYear() + 2}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">السعر (ر.س)</label>
              <input
                type="number"
                name="price"
                required
                min={0}
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Category & FuelType */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الفئة</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              >
                <option value="sedan">سيدان</option>
                <option value="suv">SUV</option>
                <option value="pickup">بيك آب</option>
                <option value="sports">رياضية</option>
                <option value="luxury">فاخرة</option>
                <option value="van">فان</option>
                <option value="hatchback">هاتشباك</option>
                <option value="coupe">كوبيه</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الوقود</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              >
                <option value="petrol">بنزين</option>
                <option value="diesel">ديزل</option>
                <option value="electric">كهرباء</option>
                <option value="hybrid">هجين</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">ناقل الحركة</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              >
                <option value="automatic">أوتوماتيك</option>
                <option value="manual">يدوي</option>
              </select>
            </div>

            {/* Multi-Image Upload */}
            <div className="md:col-span-2">
              <MultiImageUploader
                images={images}
                onChange={setImages}
                maxImages={8}
                label="صور السيارة"
                hint="اسحب وأفلت أو اضغط لاختيار صور السيارة — يمكنك تحديد عدة صور بمرة واحدة"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-white/60 mb-2">الوصف</label>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors resize-none"
                placeholder="اكتب وصفاً مفصلاً للسيارة..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={loading}
              className="bg-luxury-gold text-black px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ السيارة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
