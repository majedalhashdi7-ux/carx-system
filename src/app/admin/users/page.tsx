'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, User, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt?: string;
}

const SIDEBAR_ITEMS = [
  { href: '/admin', label: 'الإحصائيات' },
  { href: '/admin/cars', label: 'السيارات' },
  { href: '/admin/parts', label: 'قطع الغيار' },
  { href: '/admin/brands', label: 'الوكالات' },
  { href: '/admin/users', label: 'المستخدمون', active: true },
  { href: '/admin/settings', label: 'الإعدادات' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('carx-token');
      const res = await fetch('/api/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn || user?.role !== 'admin') {
        router.push('/login');
        return;
      }
      fetchUsers();
    }
  }, [loading, isLoggedIn, user, fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المستخدم؟')) return;
    try {
      const token = localStorage.getItem('carx-token');
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { admin: 'مشرف', manager: 'مدير', user: 'مستخدم' };
    return map[role] || role;
  };

  const roleColor = (role: string) => {
    const map: Record<string, string> = {
      admin: 'text-red-400 bg-red-500/10 border-red-500/30',
      manager: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      user: 'text-gray-400 bg-white/5 border-white/10',
    };
    return map[role] || 'text-gray-400 bg-white/5 border-white/10';
  };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <div>
              <p className="font-black text-white">CAR X</p>
              <p className="text-xs text-gray-500">لوحة الإدارة</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${item.active ? 'bg-red-600/20 text-white border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowRight className="w-3 h-3" />
            العودة للموقع
          </Link>
        </div>
      </div>

      <div className="mr-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">المستخدمون</h1>
            <p className="text-gray-400 mt-1">{filtered.length} مستخدم</p>
          </div>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="ابحث عن مستخدم..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
        </div>

        <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>#</span><span>المستخدم</span><span>الدور</span><span>الهاتف</span><span>حذف</span>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">لا يوجد مستخدمون</p>
            </div>
          ) : (
            filtered.map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center font-bold text-sm">
                  {u.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border font-bold ${roleColor(u.role)}`}>
                  {roleLabel(u.role)}
                </span>
                <span className="text-sm text-gray-400">{u.phone || '—'}</span>
                {u.role !== 'admin' && (
                  <button onClick={() => handleDelete(u._id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {u.role === 'admin' && <Shield className="w-4 h-4 text-red-400 opacity-50" />}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
