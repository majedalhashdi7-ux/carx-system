'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Save, AlertCircle, CheckCircle2, Eye, EyeOff, Car, DollarSign } from 'lucide-react';
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
  const [saved, setSaved] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    priceKrw: 0,
    mileage: 0,
    category: 'sedan',
    fuelType: 'petrol',
    transmission: 'automatic',
    color: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await api.cars.getById(carId);
        if (res.data) {
          const car = (res.data as any).data?.car || (res.data as any).data || (res.data as any).car || res.data;
          if (car && (car.title || car._id || car.make)) {
            setFormData({
              title:        car.title || '',
              make:         car.make || car.brand || '',
              model:        car.model || '',
              year:         car.year || new Date().getFullYear(),
              price:        car.price || car.priceSar || 0,
              priceKrw:     car.priceKrw || 0,
              mileage:      car.mileage || 0,
              category:     car.category || 'sedan',
              fuelType:     car.fuelType || 'petrol',
              transmission: car.transmission || 'automatic',
              color:        car.color || '',
              description:  car.description || '',
              isActive:     car.isActive !== false,
            });
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
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : ['year', 'price', 'priceKrw', 'mileage'].includes(name)
          ? Number(value)
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await api.cars.update(carId, {
        ...formData,
        images,
        mainImage: images[0] || '',
        imageUrl:  images[0] || '',
      });
      if (res.error) throw new Error(res.error);
      setSaved(true);
      setTimeout(() => router.push('/admin/cars'), 1200);
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
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/cars" className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-3">
            <ArrowRight className="w-4 h-4" />
            العودة لإدارة السيارات
          </Link>
          <h1 className="text-3xl font-black tracking-tight">
            تعديل <span className="text-luxury-gold">بيانات السيارة</span>
          </h1>
        </div>
        {/* حالة النشر */}
        <div
          onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border cursor-pointer transition-all font-bold text-sm ${
            formData.isActive
              ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
              : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
          }`}
        >
          {formData.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {formData.isActive ? 'نشط — ظاهر للعملاء' : 'مخفي — غير منشور'}
        </div>
      </div>

      {/* رسائل */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">✅ تم حفظ التعديلات بنجاح — جاري التوجيه...</p>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 blur-[100px] pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

          {/* ── المعلومات الأساسية ── */}
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-white/40 uppercase tracking-widest mb-5">
              <Car className="w-4 h-4" /> المعلومات الأساسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-white/60 mb-2">اسم السيارة (العنوان)</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  placeholder="مثال: هيونداي سوناتا 2023"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">الماركة</label>
                <input type="text" name="make" required value={formData.make} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  placeholder="هيونداي"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">الموديل</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  placeholder="سوناتا"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">سنة الصنع</label>
                <input type="number" name="year" min={1990} max={new Date().getFullYear() + 2} value={formData.year} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">الكيلومترات</label>
                <input type="number" name="mileage" min={0} value={formData.mileage} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  dir="ltr" placeholder="0"
                />
              </div>

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
                  <option value="hatchback">هاتشباك</option>
                  <option value="coupe">كوبيه</option>
                  <option value="van">فان</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">اللون</label>
                <input type="text" name="color" value={formData.color} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  placeholder="أبيض"
                />
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
                  <option value="lpg">غاز (LPG)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ناقل الحركة</label>
                <select name="transmission" value={formData.transmission} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                >
                  <option value="automatic">أوتوماتيك</option>
                  <option value="manual">يدوي</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── الأسعار ── */}
          <div className="pt-6 border-t border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-black text-white/40 uppercase tracking-widest mb-5">
              <DollarSign className="w-4 h-4" /> الأسعار
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">السعر (ريال سعودي)</label>
                <input type="number" name="price" min={0} value={formData.price} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">السعر (وون كوري) — اختياري</label>
                <input type="number" name="priceKrw" min={0} value={formData.priceKrw} onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white/50 focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  dir="ltr" placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ── الصور ── */}
          <div className="pt-6 border-t border-white/5">
            <MultiImageUploader
              images={images}
              onChange={setImages}
              maxImages={15}
              label="صور السيارة"
              hint="يمكنك تحديد عدة صور بمرة واحدة — تُضغط تلقائياً قبل الحفظ — الصورة الأولى هي الصورة الرئيسية"
            />
          </div>

          {/* ── الوصف ── */}
          <div className="pt-6 border-t border-white/5">
            <label className="block text-sm font-bold text-white/60 mb-2">الوصف والملاحظات</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors resize-none"
              placeholder="أضف وصفاً للسيارة أو ملاحظات للمشترين..."
            />
          </div>

          {/* ── زر الحفظ ── */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <Link href="/admin/cars"
              className="px-6 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all text-sm font-bold"
            >
              إلغاء
            </Link>
            <button type="submit" disabled={loading || saved}
              className="bg-luxury-gold text-black px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : saved ? (
                <><CheckCircle2 className="w-5 h-5" /> تم الحفظ!</>
              ) : (
                <><Save className="w-5 h-5" /> حفظ التعديلات</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
