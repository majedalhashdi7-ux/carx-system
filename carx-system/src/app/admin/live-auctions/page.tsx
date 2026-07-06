'use client';

import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit2, ChevronLeft, X, 
  Link as LinkIcon, Play, Square, ExternalLink, 
  Image as ImageIcon, Loader2, Download, CheckCircle, 
  AlertCircle, Radio, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";

export default function AdminLiveAuctions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generalWhatsapp, setGeneralWhatsapp] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    externalUrl: '',
    whatsappNumber: '',
    auctionUsername: '', 
    auctionPassword: '', 
    cars: [] as any[]
  });

  useEffect(() => {
    loadSessions();
    api.settings.getPublic().then((res: any) => {
      if (res?.data?.contactInfo?.whatsapp) {
        setGeneralWhatsapp(res.data.contactInfo.whatsapp);
      }
    }).catch(() => {});
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.liveAuctions.list();
      if (res.data?.success) {
        setSessions(res.data.data);
      } else if (res.data) {
        setSessions(res.data as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) return alert("يرجى إدخال عنوان جلسة المزاد المباشر");
    setIsLoading(true);
    try {
      if (editingId) {
        await api.liveAuctions.update(editingId, formData);
      } else {
        await api.liveAuctions.create(formData);
      }
      setIsModalOpen(false);
      resetForm();
      loadSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف جلسة المزاد المباشر بالكامل؟")) return;
    try {
      await api.liveAuctions.delete(id);
      loadSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatus = async (id: string, action: 'start' | 'end') => {
    try {
      if (action === 'start') {
        await api.liveAuctions.start(id);
      } else {
        await api.liveAuctions.end(id);
      }
      loadSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportCars = async (id: string) => {
    setIsImporting(id);
    try {
      const res = await api.liveAuctions.importExternal(id);
      if (res.data?.success) {
        alert(res.data.message || "تم استيراد سيارات المزاد المباشر بنجاح!");
        loadSessions();
      } else {
        alert(res.error || "فشل استيراد السيارات. يرجى مراجعة الرابط الخارجي للجلسة.");
      }
    } catch (err: any) {
      alert("حدث خطأ تقني أثناء استيراد السيارات: " + err.message);
    } finally {
      setIsImporting(null);
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      externalUrl: '', 
      whatsappNumber: '', 
      auctionUsername: '', 
      auctionPassword: '', 
      cars: [] 
    });
    setEditingId(null);
  };

  const addCar = () => {
    setFormData({
      ...formData,
      cars: [...formData.cars, { title: '', images: [], condition: 'مستعملة', description: '', priceEstimate: '' }]
    });
  };

  const removeCar = (index: number) => {
    const newCars = [...formData.cars];
    newCars.splice(index, 1);
    setFormData({ ...formData, cars: newCars });
  };

  const updateCar = (index: number, field: string, value: any) => {
    const newCars = [...formData.cars];
    newCars[index] = { ...newCars[index], [field]: value };
    setFormData({ ...formData, cars: newCars });
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-white/40 hover:text-white mb-2 transition-colors">
            <Link href="/admin" className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4 rotate-180" />
              العودة للوحة القيادة
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            إدارة <span className="text-luxury-gold">المزادات المباشرة</span>
          </h1>
          <p className="text-white/40 mt-1 text-sm font-medium">
            أنشئ جلسات بث مباشر للمزادات الخارجية، واكشط أو أضف سيارات لتقديم طلبات الشراء للعملاء.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-6 py-3.5 bg-luxury-gold text-black font-black rounded-2xl flex items-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.2)] hover:bg-white transition-all text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-black" />
          إنشاء جلسة مزاد
        </motion.button>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl">
            <Loader2 className="w-8 h-8 text-luxury-gold animate-spin mb-4" />
            <p className="text-white/40 text-sm font-bold">جاري تحميل جلسات المزاد...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl text-center space-y-4">
            <Radio className="w-12 h-12 text-white/10" />
            <p className="text-white/40 text-sm font-bold">لا توجد أي جلسات مزاد مباشر حالياً</p>
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="text-luxury-gold text-xs font-black hover:underline"
            >
              أنشئ أول جلسة مزاد الآن ←
            </button>
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session._id} 
              className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 group"
            >
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    session.status === 'live' 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : session.status === 'ended' 
                      ? "bg-white/5 text-white/30 border-white/5" 
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {session.status === 'live' ? 'نشط الآن' : session.status === 'ended' ? 'منتهي' : 'قادم'}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white truncate">{session.title}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-white/40 font-mono font-medium">
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-luxury-gold/50" />
                    <span className="truncate max-w-[250px] md:max-w-[400px] block" dir="ltr">{session.externalUrl || "لا يوجد رابط خارجي"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>عدد السيارات:</span>
                    <span className="text-white font-bold">{session.cars?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                {session.externalUrl && (
                  <button 
                    onClick={() => handleImportCars(session._id)}
                    disabled={isImporting !== null}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold hover:text-black border border-luxury-gold/20 rounded-xl transition-all text-xs font-black cursor-pointer disabled:opacity-50"
                  >
                    {isImporting === session._id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري الاستيراد...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>استيراد كروت السيارات</span>
                      </>
                    )}
                  </button>
                )}

                {session.status !== 'live' ? (
                  <button 
                    onClick={() => handleStatus(session._id, 'start')} 
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black border border-green-500/20 rounded-xl transition-all text-xs font-black cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>تشغيل البث</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleStatus(session._id, 'end')} 
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all text-xs font-black cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                    <span>إيقاف البث</span>
                  </button>
                )}

                <button 
                  onClick={() => { setFormData(session); setEditingId(session._id); setIsModalOpen(true); }} 
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/60 hover:text-white border border-white/10 rounded-xl transition-all text-xs font-bold cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>تعديل</span>
                </button>

                <button 
                  onClick={() => handleDelete(session._id)} 
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-red-500/5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف</span>
                </button>

                <Link 
                  href={`/auctions/live/${session._id}`} 
                  target="_blank" 
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/40 hover:text-white border border-white/5 rounded-xl transition-all text-xs font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>عرض</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - Create/Edit Live Auction Session */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-white text-right shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-luxury-gold" />
                  <h3 className="text-xl font-black">
                    {editingId ? 'تعديل جلسة المزاد المباشر' : 'إنشاء جلسة مزاد مباشر جديدة'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-bold text-white/60">عنوان الجلسة *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: مزاد سيارات لوتيه الكوري - مباشر يوم الاثنين"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-bold text-white/60">الرابط الخارجي (صفحة مزاد Encar / Copart / Lotte)</label>
                  <input
                    type="url"
                    value={formData.externalUrl}
                    onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://www.copart.com/... أو https://encar.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 font-mono text-left"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-white/30">💡 سيتم استخدام هذا الرابط لكشط واستيراد بيانات السيارات تلقائياً.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/60">رقم واتساب المزاد (أو اترك فارغاً للرقم العام)</label>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder={generalWhatsapp || "+96650000000"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-white/60">اسم مستخدم الحساب الخارجي (اختياري)</label>
                  <input
                    type="text"
                    value={formData.auctionUsername}
                    onChange={e => setFormData({ ...formData, auctionUsername: e.target.value })}
                    placeholder="ID"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-bold text-white/60">كلمة سر الحساب الخارجي (اختياري)</label>
                  <input
                    type="password"
                    value={formData.auctionPassword}
                    onChange={e => setFormData({ ...formData, auctionPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-luxury-gold/50 text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Cars Management Section */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-white">سيارات المزاد ({formData.cars?.length || 0})</h4>
                  <button
                    type="button"
                    onClick={addCar}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة سيارة يدوياً
                  </button>
                </div>

                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                  {formData.cars?.length === 0 ? (
                    <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
                      <p className="text-xs text-white/30 font-medium">لا توجد سيارات مضافة حالياً في هذه الجلسة.</p>
                      <p className="text-[10px] text-white/20 mt-1">يمكنك حفظ الجلسة ثم الضغط على "استيراد السيارات تلقائياً" لكشطها من الرابط.</p>
                    </div>
                  ) : (
                    formData.cars.map((car, index) => (
                      <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => removeCar(index)}
                          className="absolute top-4 left-4 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-black border border-red-500/20 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 col-span-2">
                            <label className="block text-[10px] text-white/40">عنوان السيارة *</label>
                            <input
                              type="text"
                              value={car.title}
                              onChange={e => updateCar(index, 'title', e.target.value)}
                              placeholder="مثال: Hyundai Grandeur 2022"
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-white/40">رقم اللوت (Lot Number)</label>
                            <input
                              type="text"
                              value={car.lotNumber || ''}
                              onChange={e => updateCar(index, 'lotNumber', e.target.value)}
                              placeholder="مثال: 569874"
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50 text-left font-mono"
                              dir="ltr"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-white/40">تقدير السعر</label>
                            <input
                              type="text"
                              value={car.priceEstimate || ''}
                              onChange={e => updateCar(index, 'priceEstimate', e.target.value)}
                              placeholder="مثال: 45,000 ر.س"
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-white/40">الحالة</label>
                            <input
                              type="text"
                              value={car.condition || ''}
                              onChange={e => updateCar(index, 'condition', e.target.value)}
                              placeholder="مثال: نظيف / صدمة خفيفة"
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-white/40">رابط صورة السيارة</label>
                            <input
                              type="text"
                              value={car.images?.[0] || ''}
                              onChange={e => updateCar(index, 'images', e.target.value ? [e.target.value] : [])}
                              placeholder="https://..."
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-luxury-gold/50 text-left font-mono"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3.5 bg-luxury-gold text-black font-black text-sm rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] cursor-pointer"
                >
                  حفظ الجلسة
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
