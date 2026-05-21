'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Award, Image, AlertCircle } from 'lucide-react';
import { api } from '../../../../lib/api';
import Navbar from '../../../../components/Navbar';

export default function AdminEditBrandPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [category, setCategory] = useState('cars'); // 'cars', 'parts', 'both'
  const [targetShowroom, setTargetShowroom] = useState('hm_local'); // 'hm_local', 'korean_import', 'both'
  const [isActive, setIsActive] = useState(true);
  
  // Showroom detail properties
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        if (brandId) {
          const res = await api.brands.getById(brandId);
          if (res.data) {
            const brand = (res.data as any).data?.brand || (res.data as any).brand;
            if (brand) {
              setName(brand.name || '');
              setNameEn(brand.nameEn || '');
              setLogoUrl(brand.logoUrl || '');
              
              // Set category text
              if (brand.forCars && brand.forSpareParts) setCategory('both');
              else if (brand.forSpareParts) setCategory('parts');
              else setCategory('cars');
              
              setTargetShowroom(brand.targetShowroom || 'hm_local');
              setIsActive(brand.isActive !== false);
              setLocation(brand.location || '');
              setPhone(brand.phone || '');
              setWhatsapp(brand.whatsapp || '');
              setDescription(brand.description || '');
              setDescriptionAr(brand.description_ar || '');
            } else {
              setError('لم يتم العثور على الوكالة المطلوبة');
            }
          } else {
            setError(res.error || 'فشل جلب تفاصيل الوكالة');
          }
        }
      } catch (_err) {
        console.error('Failed to load edit brand details:', _err);
        setError('حدث خطأ أثناء جلب البيانات من الخادم');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchBrand();
  }, [brandId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('الرجاء إدخال اسم الوكالة.');
      return;
    }

    setLoading(true);
    setError('');

    // CRITICAL API WORKAROUND: If the brand is a spare parts brand (category 'parts' or 'both'),
    // we must NOT pass the category parameter in the PUT request payload to avoid a 403 error 
    // triggered by the backend's validation check.
    const brandData: any = {
      name,
      nameEn,
      logoUrl,
      targetShowroom,
      isActive,
      location,
      phone,
      whatsapp,
      description,
      description_ar: descriptionAr
    };

    // Only include category in payload if it is 'cars'
    if (category === 'cars') {
      brandData.category = 'cars';
    }

    try {
      const res = await api.brands.update(brandId, brandData);
      if (!res.error) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/brands');
        }, 1500);
      } else {
        setError(res.error || 'فشل تعديل بيانات الوكالة');
      }
    } catch (_err) {
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
          <Link href="/admin/brands" className="inline-flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة لإدارة الوكالات
          </Link>
        </div>

        {/* Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold">تعديل بيانات الوكالة</h1>
          </div>
          <p className="text-white/40 text-sm mt-2">قم بتعديل بيانات علامة تجارية أو وكالة حالية في النظام</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-luxury-gold/10 border border-luxury-gold/20 rounded-3xl text-center text-luxury-gold space-y-4"
          >
            <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto text-black text-2xl font-bold">✓</div>
            <h2 className="text-2xl font-bold">تم حفظ التعديلات بنجاح!</h2>
            <p className="text-sm text-gray-300">جاري إعادة توجيهك إلى قائمة الوكالات...</p>
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
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">المعلومات الأساسية للوكالة</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">اسم الوكالة (بالعربي)</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: مرسيدس بنز"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">اسم الوكالة (بالإنجليزي - اختياري)</label>
                  <input 
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Example: Mercedes-Benz"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">تصنيف الوكالة</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 cursor-pointer text-right disabled:opacity-50"
                    dir="rtl"
                    disabled={category === 'parts' || category === 'both'}
                  >
                    <option value="cars" className="bg-black">سيارات فقط (Cars)</option>
                    <option value="parts" className="bg-black">قطع غيار فقط (Spare Parts)</option>
                    <option value="both" className="bg-black">كلاهما (سيارات وقطع غيار)</option>
                  </select>
                  {(category === 'parts' || category === 'both') && (
                    <p className="text-[10px] text-luxury-gold/60 mt-1">لا يمكن تغيير تصنيف وكالات قطع الغيار المستوردة يدوياً.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">المعرض المستهدف</label>
                  <select 
                    value={targetShowroom}
                    onChange={(e) => setTargetShowroom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 cursor-pointer text-right"
                    dir="rtl"
                  >
                    <option value="hm_local" className="bg-black">المعرض المحلي (HM Local)</option>
                    <option value="korean_import" className="bg-black">الاستيراد الكوري</option>
                    <option value="both" className="bg-black">كلاهما</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">رابط الشعار (Logo Image URL)</label>
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white/20">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Image className="w-5 h-5" />
                      )}
                    </div>
                    <input 
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-white/10 text-luxury-gold bg-white/5 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm font-bold text-white">الوكالة نشطة ومعروضة حالياً</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Premium Profiling Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">بيانات الاتصال وموقع الفرع (اختياري)</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">موقع الوكالة الرئيسي</label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: طريق الملك عبدالعزيز، الرياض، المملكة العربية السعودية"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">رقم الهاتف</label>
                  <input 
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="966500000000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">رقم واتساب المباشر</label>
                  <input 
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="966500000000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <h2 className="text-lg font-bold border-b border-white/5 pb-3">نبذة ووصف الوكالة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">الوصف بالعربي</label>
                  <textarea 
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="اكتب نبذة تعريفية عن الوكالة وتاريخها هنا باللغة العربية..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-right min-h-[120px]"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/40 mb-2 uppercase tracking-widest">الوصف بالإنجليزي (Description)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a brief introduction about this agency in English..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 text-left min-h-[120px]"
                    dir="ltr"
                  />
                </div>
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
