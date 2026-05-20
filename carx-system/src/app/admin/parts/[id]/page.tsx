'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Wrench, Image, Plus, Trash, AlertCircle } from 'lucide-react';
import { api } from '../../../../lib/api';
import Navbar from '../../../../components/Navbar';

export default function AdminEditPartPage() {
  const router = useRouter();
  const params = useParams();
  const partId = params.id as string;

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [partType, setPartType] = useState('مكابح');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('999');
  const [inStock, setInStock] = useState(true);
  const [description, setDescription] = useState('');
  
  // Image links management
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  
  const [brands, setBrands] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch brands for selector
    const fetchBrandsAndPart = async () => {
      try {
        // Fetch brands
        const brandsRes = await api.brands.getAll();
        if (brandsRes.data) {
          setBrands((brandsRes.data as any).data?.brands || (brandsRes.data as any).brands || []);
        }

        // Fetch part details
        if (partId) {
          const partRes = await api.parts.getById(partId);
          if (partRes.data) {
            const part = (partRes.data as any).data?.part || (partRes.data as any).part;
            if (part) {
              setName(part.name || '');
              setNameEn(part.nameEn || '');
              setPartType(part.partType || 'مكابح');
              setSelectedBrandId(part.brand?._id || part.brand || '');
              setCarMake(part.carMake || '');
              setCarModel(part.carModel || '');
              setCarYear(part.carYear ? part.carYear.toString() : '');
              setPrice(part.price ? part.price.toString() : '');
              setStockQty(part.stockQty !== undefined ? part.stockQty.toString() : '999');
              setInStock(part.inStock !== false);
              setDescription(part.description || '');
              
              if (part.images && part.images.length > 0) {
                setImageUrls(part.images);
              } else {
                setImageUrls(['']);
              }
            } else {
              setError('لم يتم العثور على قطعة الغيار المطلوبة');
            }
          } else {
            setError(partRes.error || 'فشل جلب تفاصيل قطعة الغيار');
          }
        }
      } catch (err) {
        console.error('Failed to load edit part details:', err);
        setError('حدث خطأ أثناء جلب البيانات من الخادم');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchBrandsAndPart();
  }, [partId]);

  const handleAddImageUrlField = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrlField = (index: number) => {
    if (imageUrls.length === 1) {
      setImageUrls(['']);
    } else {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      setError('الرجاء إدخال اسم القطعة والسعر.');
      return;
    }

    setLoading(true);
    setError('');
    
    // Filter out empty image URLs
    const finalImages = imageUrls.filter(url => url.trim() !== '');

    const partData = {
      name,
      nameAr: name,
      nameEn: nameEn || name,
      partType,
      partTypeAr: partType,
      brand: selectedBrandId || null,
      carMake: carMake || undefined,
      carModel: carModel || undefined,
      carYear: carYear ? parseInt(carYear) : undefined,
      price: parseFloat(price),
      priceSar: parseFloat(price),
      stockQty: parseInt(stockQty) || 999,
      inStock,
      description,
      images: finalImages.length > 0 ? finalImages : ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'],
    };

    try {
      const res = await api.parts.update(partId, partData);
      if (!res.error) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/parts');
        }, 1500);
      } else {
        setError(res.error || 'فشل تعديل قطعة الغيار');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/admin/parts" className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة لإدارة قطع الغيار
          </Link>
        </div>

        {/* Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold">
              <Wrench className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">تعديل قطعة الغيار</h1>
          </div>
          <p className="text-white/40 text-sm mt-2">قم بتعديل بيانات قطعة الغيار الحالية في النظام</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-luxury-gold/10 border border-luxury-gold/20 rounded-3xl text-center text-luxury-gold space-y-4"
          >
            <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto text-black text-2xl font-bold">✓</div>
            <h2 className="text-2xl font-bold">تم حفظ التعديلات بنجاح!</h2>
            <p className="text-sm text-gray-300">جاري إعادة توجيهك إلى قائمة قطع الغيار...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {/* Basic Info Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">المعلومات الأساسية</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">اسم القطعة (بالعربي)</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: قماش فرامل أمامي سيراميك"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">اسم القطعة (بالإنجليزي - اختياري)</label>
                  <input 
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Example: Front Ceramic Brake Pads"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">نوع القطعة / الفئة</label>
                  <select 
                    value={partType}
                    onChange={(e) => setPartType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 cursor-pointer text-right"
                    dir="rtl"
                  >
                    <option value="مكابح" className="bg-black">مكابح (فرامل)</option>
                    <option value="فلاتر" className="bg-black">فلاتر وهواء</option>
                    <option value="إضاءة" className="bg-black">أنظمة إضاءة ومصابيح</option>
                    <option value="محركات" className="bg-black">أجزاء المحرك وناقل الحركة</option>
                    <option value="عضلات" className="bg-black">مساعدين وعضلات ونظام تعليق</option>
                    <option value="زيوت" className="bg-black">زيوت وسوائل تبريد</option>
                    <option value="أخرى" className="bg-black">إكسسوارات وقطع أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">العلامة التجارية الموحدة (الوكالة)</label>
                  <select 
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 cursor-pointer text-right"
                    dir="rtl"
                  >
                    <option value="" className="bg-black">-- اختر ماركة / وكالة (إن وجد) --</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id} className="bg-black">{b.name} ({b.country || 'دولي'})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Car Info Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">السيارات المتوافقة (اختياري)</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">ماركة السيارة</label>
                  <input 
                    type="text"
                    value={carMake}
                    onChange={(e) => setCarMake(e.target.value)}
                    placeholder="مثال: Mercedes-Benz"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">الموديل المتوافق</label>
                  <input 
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    placeholder="مثال: G63 AMG"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">سنة الصنع المتوافقة</label>
                  <input 
                    type="number"
                    value={carYear}
                    onChange={(e) => setCarYear(e.target.value)}
                    placeholder="مثال: 2024"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Price & Stock Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">الأسعار والتوافر</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">السعر بالريال السعودي (ر.س)*</label>
                  <input 
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="مثال: 1250"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right font-bold"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">الكمية في المستودع</label>
                  <input 
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="999"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-white/10 text-luxury-gold bg-white/5 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm font-bold text-white">القطعة متوفرة حالياً للبيع</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">وصف وتفاصيل القطعة</h2>
              <div>
                <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">وصف تفصيلي</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب هنا جميع المواصفات الفنية، شروط الضمان، أو أي معلومات إضافية مفيدة للعملاء..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right min-h-[150px]"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Image URLs Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h2 className="text-lg font-bold">صور القطعة</h2>
                <button 
                  type="button" 
                  onClick={handleAddImageUrlField}
                  className="flex items-center gap-1 text-xs text-luxury-gold hover:text-white transition-colors font-bold"
                >
                  <Plus className="w-4 h-4" />
                  إضافة رابط صورة
                </button>
              </div>

              <div className="space-y-4">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/20">
                      <Image className="w-5 h-5" />
                    </div>
                    <input 
                      type="url"
                      value={url}
                      onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left"
                      dir="ltr"
                    />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImageUrlField(idx)}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all border border-red-500/20"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-luxury-gold text-black font-black text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all shadow-xl shadow-luxury-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
