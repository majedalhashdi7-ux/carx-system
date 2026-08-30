'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, Search, Edit2, Trash2, ExternalLink, 
  Wrench, CheckCircle2, XCircle, ArrowRight, Package, Globe,
  Download, Loader2, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

const PARTS_COOLDOWN_MS = 120_000; // دقيقتان — استيراد الوكالات يستغرق وقتاً أطول
const PARTS_STORAGE_KEY = 'hmcar_last_autospare_import';

// مكون صورة آمن لقطع الغيار مع proxy وfallback
function SafePartImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [imgSrc, setImgSrc] = React.useState(src || '');
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(src || '');
    setErrored(false);
  }, [src]);

  if (!imgSrc || errored) {
    return <Wrench className="w-5 h-5 text-white/20" />;
  }

  const resolved = imgSrc.startsWith('http') && !imgSrc.includes('cloudinary') && !imgSrc.includes('unsplash')
    ? `/api/v2/image-proxy?url=${encodeURIComponent(imgSrc)}`
    : imgSrc;

  return (
    <img
      src={resolved}
      alt={alt || ''}
      className={className}
      onError={() => {
        if (resolved !== imgSrc) {
          setImgSrc(imgSrc);
        } else {
          setErrored(true);
        }
      }}
    />
  );
}

// ─── زر الاستيراد التلقائي من AutoSpare ─────────────────────────────────────
function AutoSpareImportButton({ onImported }: { onImported: () => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg]       = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const last = Number(localStorage.getItem(PARTS_STORAGE_KEY) || 0);
    const remaining = Math.max(0, PARTS_COOLDOWN_MS - (Date.now() - last));
    if (remaining > 0) setCooldown(Math.ceil(remaining / 1000));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleImport = useCallback(async () => {
    if (cooldown > 0 || status === 'loading') return;
    setStatus('loading');
    setMsg('');
    try {
      const res = await api.import.autospare() as any;
      const d = res.data || res;
      if (res.error) { setStatus('error'); setMsg(res.error); return; }

      const brands = d?.brandsImported ?? d?.data?.brandsImported ?? 0;
      const parts  = d?.partsImported  ?? d?.data?.partsImported  ?? 0;

      setStatus('success');
      setMsg(`✅ تم استيراد ${brands} وكالة و ${parts} قطعة غيار من AutoSpare`);
      localStorage.setItem(PARTS_STORAGE_KEY, String(Date.now()));
      setCooldown(Math.ceil(PARTS_COOLDOWN_MS / 1000));
      onImported();
      setTimeout(() => setStatus('idle'), 10000);
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message || 'فشل الاستيراد');
      setTimeout(() => setStatus('idle'), 5000);
    }
  }, [cooldown, status, onImported]);

  const isDisabled = cooldown > 0 || status === 'loading';

  return (
    <div className="flex flex-col gap-3">
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        onClick={handleImport}
        disabled={isDisabled}
        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all relative overflow-hidden
          ${isDisabled
            ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            : 'bg-luxury-gold text-black hover:bg-white shadow-[0_0_25px_rgba(212,175,55,0.2)] cursor-pointer'
          }`}
      >
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" />
          : cooldown > 0 ? <Clock className="w-4 h-4" />
          : <Download className="w-4 h-4" />}
        {status === 'loading' ? 'جاري الاستيراد...'
          : cooldown > 0 ? `انتظر ${cooldown}ث`
          : 'استيراد تلقائي للوكالات والقطع'}
        {cooldown > 0 && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-luxury-gold/40"
            style={{ width: `${(cooldown / (PARTS_COOLDOWN_MS / 1000)) * 100}%` }} />
        )}
      </motion.button>
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-bold
              ${status === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const useImportedCallback = (fn: () => void) => useCallback(fn, []);

export default function AdminPartsPage() {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState<'imported' | 'carx' | null>(null);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.parts.getAll() as any;
      if (res.error) {
        setError(res.error);
      } else {
        const result = res.data;
        const partsList = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : (result?.data?.parts || result?.parts || []);
        setParts(partsList);
      }
    } catch {
      setError('فشل جلب قطع الغيار من الخادم');
    } finally {
      setLoading(false);
    }
  }, []);

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
                  إدارة قطع الغيار —{' '}
                  <span className="text-luxury-gold">
                    {activeSection === 'imported' ? 'القطع المستوردة' : 'قطع CAR X'}
                  </span>
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {activeSection === 'imported'
                    ? 'وكالات وقطع غيار مستوردة من AutoSpare — السعر عند الطلب عبر WhatsApp'
                    : 'تحكم في مخزون قطع الغيار المضافة يدوياً من إدارة المعرض'}
                </p>
              </div>
              {activeSection === 'carx' && (
                <Link
                  href="/admin/parts/new"
                  className="flex items-center gap-2 px-5 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  إضافة قطعة غيار جديدة
                </Link>
              )}
            </div>

            {/* ── زر الاستيراد التلقائي (للقطع المستوردة فقط) ── */}
            {activeSection === 'imported' && (
              <div className="bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/15 rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-black text-white">استيراد تلقائي من AutoSpare</h3>
                    </div>
                    <p className="text-white/30 text-xs leading-relaxed max-w-md">
                      يجلب جميع <strong className="text-white/60">الوكالات</strong> (الاسم + الشعار) وقطع كل وكالة (الاسم + الصورة) —
                      {' '}<strong className="text-white/60">بدون سعر</strong>، الطلب يكون عبر WhatsApp.
                    </p>
                  </div>
                  <AutoSpareImportButton onImported={fetchParts} />
                </div>
                <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    شعارات الوكالات محفوظة
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <Download className="w-3 h-3 text-blue-400" />
                    صور القطع + علامة مائية HM CAR
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-medium">
                    <RefreshCw className="w-3 h-3 text-luxury-gold" />
                    السعر: «اطلب عبر WhatsApp»
                  </div>
                </div>
              </div>
            )}

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
                                <SafePartImage
                                  src={part.img || part.image || part.images?.[0]}
                                  alt={part.name}
                                  className="w-full h-full object-cover"
                                />
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
