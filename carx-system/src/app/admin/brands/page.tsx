'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, Search, Edit2, Trash2, ExternalLink, 
  Award, CheckCircle2, XCircle, ArrowLeft 
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Fetch all brands including inactive ones
      const res = await api.brands.getAll() as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const brandList = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result?.data?.brands || result?.brands || []);
        setBrands(brandList);
      }
    } catch (err) {
      setError('فشل جلب الوكالات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الوكالة؟')) {
      try {
        const res = await api.brands.delete(id);
        if (!res.error) {
          fetchBrands();
        } else {
          alert(res.error || 'فشل حذف الوكالة');
        }
      } catch (err) {
        alert('فشل الاتصال بالخادم لحذف الوكالة');
      }
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const filteredBrands = brands.filter(brand => 
    brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.key || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.targetShowroom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold">
                <Award className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-bold">إدارة الوكالات والماركات</h1>
            </div>
            <p className="text-white/40 text-sm mt-2">أضف، عدّل، واحذف ماركات السيارات والوكالات في نظام CAR X</p>
          </div>
          <Link href="/admin/brands/new" className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-luxury-gold/10">
            <Plus className="w-5 h-5" />
            إضافة وكالة جديدة
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center text-sm font-bold mb-8">
            {error}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="ابحث عن وكالة بالاسم أو الرمز..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center">
            <div className="w-12 h-12 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/40 text-sm">جاري تحميل الوكالات...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-16 text-center">
            <Award className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد وكالات مضافة</h3>
            <p className="text-white/40 text-sm">لم يتم العثور على وكالات تطابق معايير البحث.</p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right" dir="rtl">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الشعار واسم الوكالة</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الرمز (Key)</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">التصنيف</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">المعرض المستهدف</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">حالة النشاط</th>
                    <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBrands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Logo & Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {brand.logoUrl ? (
                              <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Award className="w-5 h-5 text-white/20" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{brand.name}</div>
                            <div className="text-xs text-white/30 mt-0.5">{brand.nameEn || brand.key}</div>
                          </div>
                        </div>
                      </td>

                      {/* Key */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60 font-mono">
                        {brand.key}
                      </td>

                      {/* Classification */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          {brand.forCars && (
                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20">
                              سيارات
                            </span>
                          )}
                          {brand.forSpareParts && (
                            <span className="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              قطع غيار
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target Showroom */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {brand.targetShowroom === 'hm_local' ? 'المعرض المحلي (HM Local)' :
                         brand.targetShowroom === 'korean_import' ? 'الاستيراد الكوري' : 'كلاهما (Both)'}
                      </td>

                      {/* Active Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          brand.isActive !== false
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {brand.isActive !== false ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              نشط
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              غير نشط
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/showroom?make=${brand.key}`} 
                            target="_blank"
                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                            title="عرض في المعرض"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link 
                            href={`/admin/brands/${brand._id}`}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-luxury-gold hover:border-luxury-gold/30 transition-all"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(brand._id)}
                            className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
}

