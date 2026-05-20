'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Award, Image, AlertCircle } from 'lucide-react';
import { api } from '../../../../lib/api';
import Navbar from '../../../../components/Navbar';

export default function AdminNewBrandPage() {
  const router = useRouter();

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('الرجاء إدخال اسم الوكالة / الشركة.');
      return;
    }

    setLoading(true);
    setError('');

    const brandData = {
      name,
      nameEn,
      logoUrl,
      category,
      targetShowroom,
      isActive,
      location,
      phone,
      whatsapp,
      description,
      description_ar: descriptionAr
    };

    try {
      const res = await api.brands.create(brandData);
      if (!res.error) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/brands');
        }, 1500);
      } else {
        setError(res.error || 'فشل إضافة الوكالة');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold">إضافة وكالة جديدة</h1>
          </div>
          <p className="text-white/40 text-sm mt-2">قم بملء البيانات أدناه لإضافة علامة تجارية جديدة أو وكالة حصرية</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-luxury-gold/10 border border-luxury-gold/20 rounded-3xl text-center text-luxury-gold space-y-4"
          >
            <div className="w-16 h-16 bg-luxury-gold rounded-full flex items-center justify-center mx-auto text-black text-2xl font-bold">✓</div>
            <h2 className="text-2xl font-bold">تمت إضافة الوكالة بنجاح!</h2>
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-luxury-gold/40 cursor-pointer text-right"
                    dir="rtl"
                  >
                    <option value="cars" className="bg-black">سيارات فقط (Cars)</option>
                    <option value="parts" className="bg-black">قطع غيار فقط (Spare Parts)</option>
                    <option value="both" className="bg-black">كلاهما (سيارات وقطع غيار)</option>
                  </select>
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
                  حفظ الوكالة وإضافتها
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
