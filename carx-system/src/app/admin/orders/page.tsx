'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, X, CheckCircle2, Clock, XCircle, AlertCircle, ShoppingBag, User, Calendar, CreditCard, ChevronRight, Loader2 } from 'lucide-react';

import { api } from '../../../lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.orders.getAll();
      if (res.data) {
        setOrders((res.data as any).data?.orders || (res.data as any).orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetails = async (orderId: string) => {
    try {
      const res = await api.orders.getById(orderId);
      if (res.data && (res.data as any).success) {
        setSelectedOrder((res.data as any).data);
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch order details', err);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    setAlert(null);
    try {
      const res = await api.orders.updateStatus(selectedOrder._id, status);
      if (res.data && (res.data as any).success) {
        setAlert({ msg: 'تم تحديث حالة الطلب بنجاح!', type: 'success' });
        setSelectedOrder((prev: any) => ({ ...prev, status }));
        // Refresh local orders list
        fetchOrders();
      } else {
        throw new Error('فشل تحديث الحالة');
      }
    } catch (err: any) {
      setAlert({ msg: err.message || 'حدث خطأ أثناء تحديث حالة الطلب', type: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل / مقبول
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
            <XCircle className="w-3.5 h-3.5" /> ملغي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" /> قيد المعالجة
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const orderNum = order.orderNumber || order._id || '';
    const buyerName = order.buyer?.name || '';
    return orderNum.toLowerCase().includes(term) || buyerName.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black">إدارة الطلبات</h1>
            <p className="text-white/40 text-sm mt-1">تتبع وعالج طلبات حجز السيارات وسلة قطع الغيار</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="ابحث برقم الطلب أو اسم العميل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all"
              dir="rtl"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm flex items-center gap-2 hover:bg-white/10">
              <Filter className="w-4 h-4" />
              تصفية
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">رقم الطلب</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">العميل</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">نوع الطلب</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">المبلغ الإجمالي</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">التاريخ</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-8 h-20 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-white/20">
                      لا توجد طلبات مطابقة أو مضافة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-white/60">
                        {order.orderNumber || `CARX-${order._id.substring(0, 6).toUpperCase()}`}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-sm">{order.buyer?.name || 'عميل مجهول'}</div>
                          <div className="text-[10px] text-white/30">{order.buyer?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.items?.[0]?.typeSnapshot === 'spare_part' ? (
                          <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded">قطع غيار</span>
                        ) : (
                          <span className="text-xs text-luxury-gold bg-luxury-gold/10 px-2 py-1 rounded">حجز سيارة</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-luxury-gold">
                        {(order.pricing?.grandTotalSar || order.totalAmount || 0).toLocaleString()} ر.س
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-xs text-white/40">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => openOrderDetails(order._id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-luxury-gold hover:text-black transition-all"
                          title="عرض تفاصيل الفاتورة والطلب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Premium Order Details Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-6 md:p-10 overflow-y-auto backdrop-blur-xl">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setModalOpen(false);
                setAlert(null);
              }}
              className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white transition-all text-white/60"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-black text-luxury-gold bg-luxury-gold/10 px-3 py-1.5 rounded-full">تفاصيل الفاتورة</span>
                  <span className="text-xs text-white/40">{new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}</span>
                </div>
                <h2 className="text-2xl font-black mt-2">
                  طلب: <span className="text-white/60">{selectedOrder.orderNumber || `CARX-${selectedOrder._id.substring(0, 6).toUpperCase()}`}</span>
                </h2>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(selectedOrder.status)}
              </div>
            </div>

            {/* Alert Message */}
            {alert && (
              <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
                alert.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}>
                {alert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-bold">{alert.msg}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left & Middle Column: Items and Price Snapshot */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* User info */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-xs uppercase font-bold text-white/40 tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-luxury-gold" /> بيانات العميل المشتري
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-white/40">الاسم بالكامل</span>
                      <span className="text-sm font-bold text-white">{selectedOrder.buyer?.name || 'عميل مجهول'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/40">رقم الهاتف</span>
                      <span className="text-sm font-bold text-white" dir="ltr">{selectedOrder.buyer?.phone || 'غير متاح'}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-[10px] text-white/40">البريد الإلكتروني</span>
                      <span className="text-sm font-mono text-white/80">{selectedOrder.buyer?.email || 'غير متاح'}</span>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-xs uppercase font-bold text-white/40 tracking-wider mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-luxury-gold" /> تفاصيل المشتريات
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                        <div>
                          <h4 className="font-bold text-sm">{item.titleSnapshot}</h4>
                          <p className="text-xs text-white/40 mt-1">الكمية: {item.quantity || 1}</p>
                        </div>
                        <div className="text-left">
                          <span className="block font-mono font-bold text-sm text-luxury-gold">
                            {(item.unitPriceSar || item.priceSnapshot || 0).toLocaleString()} ر.س
                          </span>
                          {item.unitPriceUsd && (
                            <span className="block text-[10px] text-white/30 font-mono">
                              ${item.unitPriceUsd.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing Breakdown & Action Buttons */}
              <div className="space-y-6">
                
                {/* Pricing Summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs uppercase font-bold text-white/40 tracking-wider mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-luxury-gold" /> ملخص الفاتورة
                  </h3>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">المجموع الفرعي:</span>
                    <span className="font-mono">{(selectedOrder.pricing?.subTotalSar || selectedOrder.totalAmount || 0).toLocaleString()} ر.س</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">الشحن والتصدير:</span>
                    <span className="font-mono">{(selectedOrder.pricing?.shippingSar || 0).toLocaleString()} ر.س</span>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-white/80">المجموع الكلي:</span>
                    <div className="text-left">
                      <span className="block font-mono font-black text-lg text-luxury-gold">
                        {(selectedOrder.pricing?.grandTotalSar || selectedOrder.totalAmount || 0).toLocaleString()} ر.س
                      </span>
                      {selectedOrder.pricing?.grandTotalUsd && (
                        <span className="block text-[10px] text-white/30 font-mono">
                          ${selectedOrder.pricing?.grandTotalUsd.toLocaleString()} USD
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white/40 tracking-wider mb-2">تحديث حالة المعالجة</h3>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      disabled={updatingStatus || selectedOrder.status === 'approved'}
                      onClick={() => handleStatusChange('approved')}
                      className="w-full py-3 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-green-500/20 hover:border-transparent transition-all disabled:opacity-50"
                    >
                      {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      قبول وإكمال الطلب
                    </button>

                    <button
                      disabled={updatingStatus || selectedOrder.status === 'pending'}
                      onClick={() => handleStatusChange('pending')}
                      className="w-full py-3 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-yellow-500/20 hover:border-transparent transition-all disabled:opacity-50"
                    >
                      {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      تعيين كقيد الانتظار
                    </button>

                    <button
                      disabled={updatingStatus || selectedOrder.status === 'cancelled'}
                      onClick={() => handleStatusChange('cancelled')}
                      className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-red-500/20 hover:border-transparent transition-all disabled:opacity-50"
                    >
                      {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      إلغاء الطلب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
