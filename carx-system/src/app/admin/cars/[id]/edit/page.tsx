'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Save, Link as LinkIcon, AlertCircle, Upload, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
import { api } from '../../../../../lib/api';
import { uploadImage } from '../../../../../lib/cloudinary';

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  
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
    imageUrl: ''
  });

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await api.cars.getById(carId);
        if (res.data) {
          const car = (res.data as any).data?.car || (res.data as any).car;
          if (car) {
            const img = car.images?.[0] || car.mainImage || '';
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
              imageUrl: img
            });
            setPreviewImage(img);
          }
        }
      } catch (err) {
        setError('فشل في جلب بيانات السيارة');
      } finally {
        setInitialLoading(false);
      }
    };
    if (carId) {
      fetchCar();
    }
  }, [carId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'price' ? Number(value) : value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploading(true);
      setError('');
      try {
        const url = await uploadImage(file);
        setPreviewImage(url);
        setFormData(prev => ({ ...prev, imageUrl: url }));
      } catch (err: any) {
        setError(err.message || 'فشل رفع الصورة إلى Cloudinary');
      } finally {
        setImageUploading(false);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setPreviewImage(url);
  };

  const clearImage = () => {
    setPreviewImage('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSubmit = {
        ...formData,
        images: formData.imageUrl ? [formData.imageUrl] : []
      };
      
      const res = await api.cars.update(carId, dataToSubmit);
      
      if (res.error) {
        throw new Error(res.error);
      }

      router.push('/admin/cars');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تعديل السيارة');
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/cars" className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-4">
            <ArrowRight className="w-4 h-4" />
            العودة للقائمة
          </Link>
          <h1 className="text-3xl font-black tracking-tight">تعديل بيانات <span className="text-luxury-gold">السيارة</span></h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
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
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">الموديل</label>
                <input 
                  type="text" 
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Year & Price */}
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">سنة الصنع</label>
                <input 
                  type="number" 
                  name="year"
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">السعر (ر.س)</label>
                <input 
                  type="number" 
                  name="price"
                  required
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors font-mono"
                  dir="ltr"
                />
              </div>

              {/* Selects */}
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">الفئة</label>
                <select 
                  name="category" 
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                >
                  <option value="sedan">سيدان</option>
                  <option value="suv">دفع رباعي (SUV)</option>
                  <option value="sport">رياضية</option>
                  <option value="luxury">فاخرة</option>
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

              {/* Image Upload Area */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-white/60 mb-3">صورة السيارة الرئيسية</label>
                
                {imageUploading ? (
                  <div className="border-2 border-dashed border-luxury-gold/30 bg-white/[0.01] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-10 h-10 text-luxury-gold animate-spin mb-3" />
                    <span className="text-sm font-bold text-luxury-gold">جاري رفع الصورة إلى الخادم السحابي...</span>
                    <span className="text-xs text-white/30 mt-1">يرجى الانتظار لحين اكتمال الرفع</span>
                  </div>
                ) : previewImage ? (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={clearImage}
                      className="absolute top-4 left-4 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-red-500 hover:text-white transition-all text-white/60"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Local File Input */}
                    <label className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-luxury-gold/30 hover:bg-white/[0.01] transition-all group text-center">
                      <Upload className="w-10 h-10 text-white/20 group-hover:text-luxury-gold transition-colors mb-3" />
                      <span className="text-sm font-bold">تحميل صورة من الجهاز</span>
                      <span className="text-xs text-white/30 mt-1">يدعم PNG, JPG, WEBP</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Web Link Input */}
                    <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-2 text-white/40">
                        <LinkIcon className="w-5 h-5 text-luxury-gold" />
                        <span className="text-sm font-bold">أو أضف رابط صورة مباشر</span>
                      </div>
                      <input 
                        type="url" 
                        value={formData.imageUrl}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                  </div>
                )}
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
                    تحديث السيارة
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
