'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Eye, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { api } from '../../../lib/api';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // This is a placeholder since we don't have api.orders exported yet
    // For now we will just simulate an empty list
    setLoading(false);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
            <p className="text-white/40 text-sm mt-1">تتبع وعالج طلبات الحجز والشراء</p>
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
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all"
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
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السيارة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">المبلغ</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">تاريخ الطلب</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-6 py-8 h-20 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-white/20">
                      لا توجد طلبات لعرضها حالياً
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-white/60">#{order._id.substring(0, 6).toUpperCase()}</td>
                      <td className="px-6 py-4 font-bold text-sm">{order.user?.name}</td>
                      <td className="px-6 py-4 text-sm text-white/80">{order.car?.title}</td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-luxury-gold">{order.totalAmount?.toLocaleString()} ر.س</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> قيد المعالجة
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40">{new Date().toLocaleDateString('ar-SA')}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <Eye className="w-4 h-4 text-white/60 hover:text-white" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
