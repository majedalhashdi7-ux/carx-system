'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, X, CheckCircle2, Clock, XCircle, AlertCircle, 
  ShoppingBag, Calendar, CreditCard, ArrowRight, Loader2, MessageSquare, Inbox
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

export default function MyOrdersPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [whatsappNumber, setWhatsappNumber] = useState('+966 50 000 0000');

  useEffect(() => {
    // Fetch dynamic WhatsApp from settings
    api.settings.getPublic().then((res: any) => {
      if (res.data?.homeContent?.carxSettings?.salesWhatsapp) {
        setWhatsappNumber(res.data.homeContent.carxSettings.salesWhatsapp);
      } else if (res.data?.contactInfo?.phone) {
        setWhatsappNumber(res.data.contactInfo.phone);
      }
    }).catch(() => {});
  }, []);

  const fetchMyOrders = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await api.orders.getAll();
      if (res.data) {
        const d = res.data as any;
        const ordersList = Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d)
            ? d
            : (d?.data?.orders || d?.orders || []);
        setOrders(ordersList);
      }
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMyOrders();
    }
  }, [isLoggedIn]);

  const openOrderDetails = async (orderId: string) => {
    try {
      const res = await api.orders.getById(orderId);
      if (res.data && (res.data as any).success) {
        setSelectedOrder((res.data as any).data);
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-500/10">
            <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-500/10">
            <XCircle className="w-3.5 h-3.5" /> ملغي
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-500/10">
            <CheckCircle2 className="w-3.5 h-3.5" /> تم التأكيد
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1.5 rounded-full border border-indigo-500/10">
            <Clock className="w-3.5 h-3.5 animate-pulse" /> قيد التجهيز
          </span>
        );
      case 'shipped_sea':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-500/10">
            <Clock className="w-3.5 h-3.5" /> مشحونة في البحر
          </span>
        );
      case 'customs_clearance':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/10">
            <Clock className="w-3.5 h-3.5" /> التخليص الجمركي
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5" /> وصلت وجاهزة للاستلام
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-500/10">
            <Clock className="w-3.5 h-3.5" /> قيد الانتظار
          </span>
        );
    }
  };

  const getStatusTextArabic = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'تم تأكيد طلبك وشراء السيارة';
      case 'processing': return 'قيد التجهيز والشحن';
      case 'shipped_sea': return 'مشحونة في البحر متجهة للميناء';
      case 'customs_clearance': return 'قيد التخليص الجمركي حالياً';
      case 'arrived': return 'وصلت المعرض وهي جاهزة للاستلام';
      case 'completed':
      case 'approved': return 'تم تسليم الطلب بنجاح';
      case 'cancelled': return 'تم إلغاء هذا الطلب';
      default: return 'قيد المعالجة';
    }
  };

  const handleWhatsAppInquiry = (order: any) => {
    if (!order) return;
    const orderNum = order.orderNumber || order._id || '';
    const itemTitle = order.items?.[0]?.titleSnapshot || 'سيارة / قطع غيار';
    const message = encodeURIComponent(
      `مرحباً CAR X، أود الاستفسار عن حالة طلبي:\n\n*رقم الطلب:* ${orderNum}\n*نوع المشتريات:* ${itemTitle}\n*الحالة الحالية:* ${getStatusTextArabic(order.status)}\n\nشكراً لكم.`
    );
    const cleanNum = whatsappNumber.replace(/\+/g, '').replace(/\s/g, '');
    window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search matches
      const term = searchTerm.toLowerCase();
      const orderNum = (order.orderNumber || order._id || '').toLowerCase();
      const firstItemTitle = (order.items?.[0]?.titleSnapshot || '').toLowerCase();
      const searchMatch = orderNum.includes(term) || firstItemTitle.includes(term);

      // Status matches
      if (statusFilter === 'all') return searchMatch;
      if (statusFilter === 'active') {
        return searchMatch && !['completed', 'approved', 'cancelled'].includes(order.status);
      }
      if (statusFilter === 'completed') {
        return searchMatch && ['completed', 'approved'].includes(order.status);
      }
      if (statusFilter === 'cancelled') {
        return searchMatch && order.status === 'cancelled';
      }
      return searchMatch;
    });
  }, [orders, searchTerm, statusFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-luxury-gold/20 border-t-luxury-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center" dir="rtl">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-luxury-gold/5 rounded-full blur-[120px]" />
        </div>
        <div className="text-center space-y-6 relative z-10 max-w-sm px-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
            <ShoppingBag className="w-10 h-10 text-white/40" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black">يجب تسجيل الدخول</h1>
            <p className="text-white/40 text-sm">يرجى تسجيل الدخول لعرض وتتبع طلبات الحجز والمشتريات الخاصة بك.</p>
          </div>
          <Link href="/login" className="w-full flex items-center justify-center gap-2 py-4 bg-luxury-gold text-black font-black rounded-2xl hover:bg-white transition-colors">
            <ArrowRight className="w-4 h-4" />
            تسجيل الدخول الآن
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white" dir="rtl">
      <Navbar />

      {/* Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-luxury-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 pt-32 pb-24 px-4 md:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/profile" className="text-xs text-white/40 hover:text-luxury-gold font-bold">الملف الشخصي</Link>
              <span className="text-white/20 text-xs">/</span>
              <span className="text-xs text-luxury-gold font-bold">طلباتي</span>
            </div>
            <h1 className="text-4xl font-black">طلبات الشراء والحجز</h1>
            <p className="text-white/40 text-sm mt-1">تتبع حالة سيارتك المحجوزة وطلبات قطع الغيار مباشرة</p>
          </div>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-stretch md:items-center">
          {/* Tabs */}
          <div className="flex gap-1.5 p-1 bg-white/[0.03] border border-white/5 rounded-2xl overflow-x-auto self-start">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'active', label: 'النشطة' },
              { id: 'completed', label: 'المكتملة' },
              { id: 'cancelled', label: 'الملغاة' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/10'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب أو اسم السلعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/25"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-10 h-10 text-luxury-gold animate-spin" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">جاري تحميل طلباتك...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="glass-panel p-20 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <Inbox className="w-10 h-10 text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">لا توجد طلبات</h3>
              <p className="text-white/40 text-sm max-w-xs mx-auto">
                {statusFilter === 'all'
                  ? 'لم تقم بإنشاء أي طلبات حجز سيارات أو قطع غيار بعد.'
                  : 'لا توجد طلبات تطابق هذه التصفية حالياً.'}
              </p>
            </div>
            {statusFilter === 'all' && (
              <Link href="/showroom" className="bg-luxury-gold hover:bg-white text-black font-black px-8 py-4 rounded-2xl text-sm transition-all duration-300">
                استكشف معرض السيارات
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map(order => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 md:p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="space-y-4 flex-1">
                  {/* Top info row */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/50">
                      {order.orderNumber || `CARX-${order._id.substring(0, 6).toUpperCase()}`}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-xs text-white/40">
                      {new Date(order.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                    </span>
                    <span className="text-white/20">•</span>
                    {order.items?.[0]?.itemType === 'sparePart' ? (
                      <span className="text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">قطع غيار</span>
                    ) : (
                      <span className="text-[10px] text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded">حجز سيارة</span>
                    )}
                  </div>

                  {/* Item snapshot info */}
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {order.items?.[0]?.titleSnapshot || 'طلب حجز سيارة'}
                    </h3>
                    {order.items && order.items.length > 1 && (
                      <p className="text-xs text-white/40 mt-1">بالإضافة إلى {order.items.length - 1} من العناصر الأخرى</p>
                    )}
                  </div>

                  {/* Cost & channel info */}
                  <div className="flex items-center gap-4">
                    <div className="text-luxury-gold font-bold font-mono">
                      {(order.pricing?.grandTotalSar || order.totalAmount || 0).toLocaleString()} ر.س
                    </div>
                  </div>
                </div>

                {/* Status and Action controls */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto border-t border-white/5 pt-4 md:pt-0 md:border-t-0 gap-4">
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openOrderDetails(order._id)}
                      className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> عرض الفاتورة
                    </button>
                    <button
                      onClick={() => handleWhatsAppInquiry(order)}
                      className="p-3 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/20 rounded-xl transition-all"
                      title="استفسر عبر واتساب"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice / Order Details Modal */}
      <AnimatePresence>
        {modalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Modal Overlay Close */}
            <div className="absolute inset-0" onClick={() => setModalOpen(false)} />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2rem] p-6 md:p-8 overflow-y-auto max-h-[85vh] backdrop-blur-xl z-10"
            >
              {/* Close button */}
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white transition-all text-white/50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Badge */}
              <div className="border-b border-white/5 pb-5 mb-6">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-[10px] font-black text-luxury-gold bg-luxury-gold/10 px-2.5 py-1 rounded-full uppercase tracking-wider">تفاصيل الفاتورة</span>
                  <span className="text-xs text-white/30">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</span>
                </div>
                <h2 className="text-2xl font-black">
                  طلب: <span className="font-mono text-white/60">{selectedOrder.orderNumber || `CARX-${selectedOrder._id.substring(0, 6).toUpperCase()}`}</span>
                </h2>
              </div>

              {/* Grid content */}
              <div className="space-y-6">
                {/* Status Banner */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 block">الحالة الحالية للطلب</span>
                    <span className="text-sm font-bold text-white">{getStatusTextArabic(selectedOrder.status)}</span>
                  </div>
                  <div>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                {/* Items detail list */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-luxury-gold" /> المشتريات والعناصر المحجوزة
                  </h3>
                  
                  <div className="divide-y divide-white/5">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                        <div>
                          <span className="font-bold text-sm text-white block">{item.titleSnapshot}</span>
                          <span className="text-xs text-white/40 mt-0.5 block">الكمية: {item.quantity || 1}</span>
                        </div>
                        <div className="text-left font-mono font-bold text-sm text-luxury-gold">
                          {(item.unitPriceSar || item.priceSnapshot || 0).toLocaleString()} ر.س
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3.5">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-luxury-gold" /> ملخص الفاتورة
                  </h3>

                  <div className="flex justify-between text-xs text-white/60">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono">{(selectedOrder.pricing?.subTotalSar || selectedOrder.totalAmount || 0).toLocaleString()} ر.س</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-white/60">
                    <span>الشحن والتصدير:</span>
                    <span className="font-mono">{(selectedOrder.pricing?.shippingSar || 0).toLocaleString()} ر.س</span>
                  </div>

                  <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                    <span className="text-sm font-bold text-white/80">المجموع النهائي:</span>
                    <span className="font-mono font-black text-lg text-luxury-gold">
                      {(selectedOrder.pricing?.grandTotalSar || selectedOrder.totalAmount || 0).toLocaleString()} ر.س
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => handleWhatsAppInquiry(selectedOrder)}
                    className="flex-1 py-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/10"
                  >
                    <MessageSquare className="w-4 h-4" /> استفسر عن الطلب عبر واتساب
                  </button>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="sm:w-32 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    إغلاق الفاتورة
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
