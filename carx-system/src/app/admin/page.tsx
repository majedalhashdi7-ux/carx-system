'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Car, 
  Wrench,
  Award,
  ShoppingBag, 
  Users, 
  Settings, 
  TrendingUp, 
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { api } from '../../lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'قيد الانتظار', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock },
  processing: { label: 'قيد المعالجة', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   icon: RefreshCw },
  completed:  { label: 'مكتمل',        color: 'text-green-400 bg-green-400/10 border-green-400/20',  icon: CheckCircle2 },
  cancelled:  { label: 'ملغي',         color: 'text-red-400 bg-red-400/10 border-red-400/20',        icon: XCircle },
  rejected:   { label: 'مرفوض',        color: 'text-red-500 bg-red-500/10 border-red-500/20',        icon: AlertCircle },
};

export default function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.admin.getStats() as any,
          api.orders.getAll() as any,
        ]);
        if (statsRes.data?.success) setDashboardStats(statsRes.data.data);
        if (ordersRes.data?.data?.orders) {
          setRecentOrders(ordersRes.data.data.orders.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'إجمالي السيارات',  value: dashboardStats?.totalCars      ?? '—', icon: Car,        trend: null,  color: 'text-luxury-gold'  },
    { label: 'الطلبات المعلّقة', value: dashboardStats?.pendingOrders   ?? '—', icon: ShoppingBag, trend: null, color: 'text-yellow-400'   },
    { label: 'إجمالي العملاء',   value: dashboardStats?.totalUsers      ?? '—', icon: Users,       trend: null, color: 'text-blue-400'     },
    { label: 'المزادات النشطة',  value: dashboardStats?.runningAuctions ?? '—', icon: TrendingUp,  trend: null, color: 'text-purple-400'   },
  ];

  const navItems = [
    { label: 'لوحة القيادة',    icon: LayoutDashboard, active: true,  href: '/admin' },
    { label: 'إدارة السيارات',  icon: Car,             active: false, href: '/admin/cars' },
    { label: 'قطع الغيار',      icon: Wrench,          active: false, href: '/admin/parts' },
    { label: 'إدارة الوكالات',  icon: Award,           active: false, href: '/admin/brands' },
    { label: 'الطلبات',         icon: ShoppingBag,     active: false, href: '/admin/orders' },
    { label: 'العملاء',         icon: Users,           active: false, href: '/admin/users' },
    { label: 'الاستيراد الذكي', icon: Download,        active: false, href: '/admin/import' },
    { label: 'الإعدادات',       icon: Settings,        active: false, href: '/admin/settings' },
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="glass-panel p-6 rounded-[2rem] sticky top-32 space-y-2">
              <div className="px-4 mb-6">
                <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">القائمة الرئيسية</h2>
              </div>
              {navItems.map((item, idx) => (
                <Link
                  href={item.href}
                  key={idx}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
                    item.active
                      ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 ${item.active ? 'text-black' : 'group-hover:text-luxury-gold'} transition-colors`} />
                    {item.label}
                  </div>
                  {item.active && <div className="w-1.5 h-1.5 rounded-full bg-black/30" />}
                </Link>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">لوحة التحكم <span className="text-luxury-gold">الإدارية</span></h1>
                <p className="text-white/40 mt-2 font-medium">ملخص أداء CAR X — آخر تحديث الآن</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/admin/orders" className="glass-panel px-5 py-3 rounded-2xl text-sm font-bold text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  عرض الطلبات
                </Link>
                <Link href="/admin/cars/new" className="bg-luxury-gold text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-white transition-colors duration-300">
                  <Plus className="w-5 h-5" />
                  إضافة سيارة
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="premium-card p-6 group"
                >
                  <div className="glow-overlay" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      {stat.trend && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                          <ArrowUpRight className="w-3 h-3" />
                          {stat.trend}
                        </div>
                      )}
                    </div>
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-black tracking-tight">
                      {loading ? (
                        <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse" />
                      ) : stat.value}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Orders Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="premium-card p-8"
            >
              <div className="glow-overlay" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black">آخر الطلبات</h2>
                    <p className="text-white/30 text-sm mt-1">أحدث طلبات الشراء الواردة</p>
                  </div>
                  <Link href="/admin/orders" className="text-luxury-gold text-sm font-black hover:text-white transition-colors flex items-center gap-1.5">
                    عرض الكل
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-16 bg-white/[0.03] rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm font-bold">لا توجد طلبات بعد</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" dir="rtl">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-right text-white/30 font-bold text-xs uppercase tracking-widest pb-4 pr-2">رقم الطلب</th>
                          <th className="text-right text-white/30 font-bold text-xs uppercase tracking-widest pb-4">العميل</th>
                          <th className="text-right text-white/30 font-bold text-xs uppercase tracking-widest pb-4">المبلغ</th>
                          <th className="text-right text-white/30 font-bold text-xs uppercase tracking-widest pb-4">الحالة</th>
                          <th className="text-right text-white/30 font-bold text-xs uppercase tracking-widest pb-4">التاريخ</th>
                          <th className="pb-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {recentOrders.map((order, idx) => {
                          const statusInfo = STATUS_MAP[order.status] || STATUS_MAP['pending'];
                          const StatusIcon = statusInfo.icon;
                          const date = order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('ar-SA', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—';
                          return (
                            <motion.tr
                              key={order._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="group hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-4 pr-2">
                                <span className="font-mono text-luxury-gold text-xs font-black">
                                  {order.orderNumber || order._id?.slice(-8).toUpperCase()}
                                </span>
                              </td>
                              <td className="py-4">
                                <div>
                                  <p className="font-bold text-white">{order.buyer?.name || 'غير محدد'}</p>
                                  <p className="text-white/30 text-xs">{order.buyer?.email || ''}</p>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className="font-black text-white">
                                  {order.pricing?.grandTotalSar
                                    ? `${order.pricing.grandTotalSar.toLocaleString('ar-SA')} ر.س`
                                    : '—'}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${statusInfo.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className="text-white/40 text-xs">{date}</span>
                              </td>
                              <td className="py-4">
                                <Link
                                  href={`/admin/orders`}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-luxury-gold text-xs font-black hover:underline"
                                >
                                  تفاصيل ←
                                </Link>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'إضافة سيارة جديدة',   href: '/admin/cars/new',    icon: Car,       color: 'from-luxury-gold/20 to-luxury-gold/5' },
                { label: 'إضافة قطعة غيار',     href: '/admin/parts',       icon: Wrench,    color: 'from-blue-500/20 to-blue-500/5'       },
                { label: 'إدارة الوكالات',       href: '/admin/brands',      icon: Award,     color: 'from-purple-500/20 to-purple-500/5'   },
                { label: 'مراجعة الطلبات',       href: '/admin/orders',      icon: ShoppingBag, color: 'from-green-500/20 to-green-500/5'   },
                { label: 'قاعدة العملاء',        href: '/admin/users',       icon: Users,     color: 'from-pink-500/20 to-pink-500/5'       },
                { label: 'الاستيراد الذكي',      href: '/admin/import',      icon: Download,  color: 'from-teal-500/20 to-teal-500/5'       },
                { label: 'إعدادات المنصة',       href: '/admin/settings',    icon: Settings,  color: 'from-orange-500/20 to-orange-500/5'   },
              ].map((action, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + idx * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className={`group block p-6 rounded-[1.5rem] border border-white/[0.06] bg-gradient-to-br ${action.color} hover:border-white/20 transition-all duration-500`}
                  >
                    <action.icon className="w-6 h-6 text-white/40 group-hover:text-white mb-4 transition-colors" />
                    <p className="text-sm font-black text-white/60 group-hover:text-white transition-colors">{action.label}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
