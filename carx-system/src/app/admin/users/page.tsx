'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, User, UserPlus, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { api } from '../../../lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await api.users.getAll();
      if (res.data) {
        const allUsers = (res.data as any).data?.users || (res.data as any).data || (res.data as any).users || [];
        setUsers(allUsers);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 30 seconds to update online status
    const interval = setInterval(() => fetchUsers(), 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm)
  );

  const clients = filtered.filter(u => !['admin', 'super_admin', 'manager'].includes(u.role));
  const admins = filtered.filter(u => ['admin', 'super_admin', 'manager'].includes(u.role));
  const onlineCount = clients.filter(u => isOnline(u)).length;

  function isOnline(user: any): boolean {
    if (!user.lastActiveAt) return false;
    const diffMs = Date.now() - new Date(user.lastActiveAt).getTime();
    return diffMs <= 2 * 60 * 1000; // 2 minutes
  }

  function getLastSeen(user: any): string {
    if (!user.lastActiveAt) return 'لم يتصل بعد';
    const diffMs = Date.now() - new Date(user.lastActiveAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `منذ ${diffH} ساعة`;
    const diffD = Math.floor(diffH / 24);
    return `منذ ${diffD} يوم`;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">قاعدة العملاء</h1>
          <p className="text-white/40 text-sm mt-1">إدارة المستخدمين والصلاحيات في المنصة</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Online counter */}
          <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-black flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {onlineCount} متصل الآن
          </div>
          <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-black">
            <UserPlus className="w-4 h-4 inline ml-2" />
            {loading ? '...' : clients.length} عميل
          </div>
          {/* Refresh button */}
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last refreshed info */}
      <p className="text-xs text-white/20">
        آخر تحديث: {lastRefreshed.toLocaleTimeString('ar-SA')} · يتجدد تلقائياً كل 30 ثانية
      </p>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الإيميل أو رقم الجوال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-11 pl-4 text-sm focus:outline-none focus:border-luxury-gold/40 transition-all"
            dir="rtl"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <User className="w-4 h-4 text-luxury-gold" />
          <h2 className="font-black text-sm">العملاء المسجلون</h2>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right" dir="rtl">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">العميل</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">التواصل</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">حالة الاتصال</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">آخر نشاط</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-white/[0.01]" />
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/20">
                    لا يوجد عملاء متاحين حالياً
                  </td>
                </tr>
              ) : (
                clients.map((user) => {
                  const online = isOnline(user);
                  return (
                    <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Avatar + Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <span className="text-white/60 font-black text-sm">
                                {user.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            {/* Online dot */}
                            <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-400' : 'bg-white/20'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{user.name}</div>
                            <div className="text-xs text-white/30">#{user._id?.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{user.email || '—'}</div>
                        <div className="text-xs text-white/40">{user.phone || 'غير محدد'}</div>
                      </td>

                      {/* Online Status */}
                      <td className="px-6 py-4">
                        {online ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-500/10 border border-green-500/20 text-green-400">
                            <Wifi className="w-3 h-3" />
                            متصل الآن
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/30">
                            <WifiOff className="w-3 h-3" />
                            غير متصل
                          </span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td className="px-6 py-4 text-xs text-white/40 font-medium">
                        {getLastSeen(user)}
                      </td>

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-xs text-white/40">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins Section */}
      {admins.length > 0 && (
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <h2 className="font-black text-sm">المديرون</h2>
            <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{admins.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right" dir="rtl">
              <tbody className="divide-y divide-white/5">
                {admins.map((user) => (
                  <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 w-1/3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center shrink-0">
                          <span className="text-luxury-gold font-black text-sm">{user.name?.charAt(0) || 'A'}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{user.name}</div>
                          <div className="text-xs text-white/30">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1 text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md w-fit">
                        <Shield className="w-3 h-3" /> {user.role === 'super_admin' ? 'سوبر أدمن' : 'مدير'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '—'}
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
