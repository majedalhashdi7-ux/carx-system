'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, Search, Edit2, Trash2, ExternalLink, 
  Wrench, CheckCircle2, XCircle, ArrowRight, Package, Globe
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function AdminPartsPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'imported' | 'carx' | null>(null);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await api.parts.getAll() as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        setParts(result?.data?.parts || result?.parts || []);
      }
    } catch (err) {
      setError('فشل جلب قطع الغيار من الخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف قطعة الغيار هذه؟')) {
      try {
        const res = await api.parts.delete(id);
        if (!res.error) {
          fetchParts();
        } else {
          alert(res.error || 'فشل حذف قطعة الغيار');
        }
      } catch (err) {
        alert('فشل الاتصال بالخادم لحذف قطعة الغيار');
      }
    }
  };

  const handleToggleStock = async (part: any) => {
    try {
      const updatedInStock = !part.inStock;
      const res = await api.parts.update(part._id, {
        ...part,
        inStock: updatedInStock,
        brand: part.brand?._id || part.brand || null
      });
      if (!res.error) {
        setParts(parts.map(p => p._id === part._id ? { ...p, inStock: updatedInStock } : p));
      } else {
        alert(res.error || 'فشل تعديل حالة التوفر');
      }
    } catch (err) {
      alert('حدث خطأ أثناء تعديل حالة التوفر');
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  // قطع مستوردة = source !== 'manual' أو source === 'autospare'
  const importedPartsCount = parts.filter(p => p.source && p.source !== 'manual').length;
  // قطع CAR X = source === 'manual' أو بدون source
  const carxPartsCount = parts.filter(p => !p.source || p.source === 'manual').length;

  const filteredParts = parts.filter(part => {
    const matchesSearch =
      part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.carMake || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.brand?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeSection === 'imported') {
      return part.source && part.source !== 'manual';
    } else if (activeSection === 'carx') {
      return !part.source || part.source === 'manual';
    }
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <AnimatePresence mode="wait">
        {activeSection === null ? (
          // --- Section Selection View ---
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-black">إدارة قطع الغيار</h1>
              <p className="text-white/40 text-sm mt-2">اختر القسم المراد إدارته والتحكم في مخزونه</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto py-6">
              {/* Imported Parts Card */}
              <div
                onClick={() => setActiveSection('imported')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Globe className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">قطع مستوردة</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    قطع الغيار المستوردة والمضافة تلقائياً عبر نظام الاستيراد الخارجي.
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                  {loading ? '...' : `${importedPartsCount} قطعة مستوردة`}
                </div>
              </div>

              {/* CAR X Parts Card */}
              <div
                onClick={() => setActiveSection('carx')}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-luxury-gold/40 rounded-3xl p-8 transition-all duration-300 cursor-pointer group text-center flex flex-col items-center justify-center space-y-6 min-h-[320px] relative overflow-hidden backdrop-blur-xl shadow-2xl hover:shadow-luxury-gold/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-luxury-gold/10" />
                <div className="w-20 h-20 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold group-hover:scale-110 group-hover:border-luxury-gold/40 transition-all duration-300">
                  <Package className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-luxury-gold transition-colors">قطع CAR X</h3>
                  <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">
                    قطع الغيار المضافة يدوياً من قبل إدارة معرض CAR X.
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                  {loading ? '...' : `${carxPartsCount} قطعة محلية`}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // --- Parts Table List View ---
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Back to selection */}
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-white/40 hover:text-luxury-gold transition-colors text-sm font-bold mb-4"
            >
              <ArrowRight className="w-4 h-4" />
              الرجوع لاختيار القسم
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black">
                  إدارة قطع الغيار - {activeSection === 'imported' ? 'القطع المستوردة' : 'قطع CAR X'}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {activeSection === 'imported'
                    ? 'إدارة مخزون قطع الغيار المستوردة تلقائياً'
                    : 'تحكم في مخزون قطع الغيار المضافة يدوياً من إدارة المعرض'}
                </p>
              </div>
              <Link
                href={activeSection === 'imported' ? '/admin/import' : '/admin/parts/new'}
                className="flex items-center gap-2 px-5 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                {activeSection === 'imported' ? 'استيراد قطعة غيار' : 'إضافة قطعة غيار جديدة'}
              </Link>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center text-sm font-bold">
                {error}
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="ابحث عن قطعة غيار بالاسم أو الماركة..."
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
                <p className="text-white/40 text-sm">جاري تحميل قطع الغيار...</p>
              </div>
            ) : filteredParts.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-16 text-center">
                <Wrench className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد قطع غيار</h3>
                <p className="text-white/40 text-sm">
                  {activeSection === 'imported'
                    ? 'لا توجد قطع غيار مستوردة في هذا القسم بعد.'
                    : 'لا توجد قطع غيار مضافة يدوياً. اضغط على "إضافة قطعة غيار جديدة" لإضافة أولى.'}
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right" dir="rtl">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">القطعة</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الماركة المستهدفة</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السعر</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">حالة التوفر</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">المخزون (الكمية)</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredParts.map((part) => (
                        <tr key={part._id} className="hover:bg-white/[0.01] transition-colors">
                          {/* Name & Photo */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                {part.images && part.images[0] ? (
                                  <img src={part.images[0]} alt={part.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Wrench className="w-5 h-5 text-white/20" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white">{part.name}</div>
                                <div className="text-xs text-white/30 mt-0.5">{part.partType || 'قطعة غيار'}</div>
                              </div>
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                            {part.brand?.name || part.carMake || 'عالمي'}
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-luxury-gold">
                            {part.price ? `${part.price.toLocaleString()} ر.س` : 'اتصل للسعر'}
                          </td>

                          {/* In Stock toggle */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStock(part)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                part.inStock
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              }`}
                            >
                              {part.inStock ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  متوفر
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  غير متوفر
                                </>
                              )}
                            </button>
                          </td>

                          {/* Stock Quantity */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                            {part.stockQty ?? 0}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/parts`}
                                target="_blank"
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                                title="عرض في المتجر"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/admin/parts/${part._id}`}
                                className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-luxury-gold hover:border-luxury-gold/30 transition-all"
                                title="تعديل"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(part._id)}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
