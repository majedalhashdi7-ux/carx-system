'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import MultiImageUploader from '../../../../../components/admin/MultiImageUploader';

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await api.cars.getById(carId);
        if (res.data) {
          const car = (res.data as any).data?.car || (res.data as any).data || (res.data as any).car || res.data;
          if (car && (car.title || car._id || car.make)) {
            setFormData({
              title: car.title || '',
              make: car.make || car.brand || '',
              model: car.model || '',
              year: car.year || new Date().getFullYear(),
              price: car.price || 0,
              category: car.category || 'sedan',
              fuelType: car.fuelType || 'petrol',
              transmission: car.transmission || 'automatic',
              description: car.description || '',
            });
            // Load existing images
            const existingImages: string[] = car.images || (car.mainImage ? [car.mainImage] : []);
            setImages(existingImages);
          }
        }
      } catch {
        setError('فشل في جلب بيانات السيارة');
      } finally {
        setInitialLoading(false);
      }
    };
    if (carId) fetchCar();
  }, [carId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.cars.update(carId, {
        ...formData,
        images,
        imageUrl: images[0] || '',
      });
      if (res.error) throw new Error(res.error);
      router.push('/admin/cars');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل السيارة');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Link href="/admin/cars" className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-4">
          <ArrowRight className="w-4 h-4" />
          العودة للقائمة
        </Link>
        <h1 className="text-3xl font-black tracking-tight mt-2">تعديل <span className="text-luxury-gold">بيانات السيارة</span></h1>
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
              <input type="text" name="title" required value={formData.title} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Make & Model */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الماركة</label>
              <input type="text" name="make" required value={formData.make} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الموديل</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Year & Price */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">سنة الصنع</label>
              <input type="number" name="year" min={1900} max={new Date().getFullYear() + 2} value={formData.year} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">السعر (ر.س)</label>
              <input type="number" name="price" min={0} value={formData.price} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>

            {/* Category & Fuel */}
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الفئة</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              >
                <option value="sedan">سيدان</option>
                <option value="suv">SUV</option>
                <option value="pickup">بيك آب</option>
                <option value="sports">رياضية</option>
                <option value="luxury">فاخرة</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-white/60 mb-2">الوقود</label>
              <select name="fuelType" value={formData.fuelType} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
              >
                <option value="petrol">بنزين</option>
                <option value="diesel">ديزل</option>
                <option value="electric">كهرباء</option>
                <option value="hybrid">هجين</option>
              </select>
            </div>

            {/* Transmission */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-white/60 mb-2">ناقل الحركة</label>
              <select name="transmission" value={formData.transmission} onChange={handleChange}
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
                hint="يمكنك تحديد عدة صور بمرة واحدة — تُضغط تلقائياً قبل الحفظ"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-white/60 mb-2">الوصف</label>
              <textarea name="description" rows={4} value={formData.description} onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-white/10">
            <button type="submit" disabled={loading}
              className="bg-luxury-gold text-black px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <><Save className="w-5 h-5" /> تحديث السيارة</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
