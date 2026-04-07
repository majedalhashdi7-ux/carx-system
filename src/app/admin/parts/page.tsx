'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface Part {
  _id: string;
  name: string;
  nameAr?: string;
  partType?: string;
  carMake?: string;
  price: number;
  priceSar?: number;
  stockQty?: number;
  condition?: string;
  images?: string[];
  createdAt?: string;
}

export default function AdminPartsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchParts = useCallback(async () => {
    try {
      const token = localStorage.getItem('carx-token');
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/parts?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setParts(data.data);
        setPagination(data.pagination || { total: data.data.length, pages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingParts(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn || !['admin', 'manager'].includes(user?.role || '')) {
        router.push('/login');
        return;
      }
      fetchParts();
    }
  }, [loading, isLoggedIn, user, fetchParts]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه القطعة؟')) return;
    try {
      const token = localStorage.getItem('carx-token');
      await fetch(`/api/parts/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchParts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || loadingParts) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <AdminSidebar />

      {/* Main */}
      <div className="lg:mr-64 pt-16 lg:pt-0 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">قطع الغيار</h1>
            <p className="text-gray-400 mt-1">{pagination.total} قطعة إجمالاً</p>
          </div>
          <Link href="/admin/parts/new">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer">
              <Plus className="w-5 h-5" />
              إضافة قطعة
            </motion.div>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="ابحث..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
        </div>

        {/* Table */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/5 text-xs text-gray-500 font-bold uppercase tracking-wider">
            <span>صورة</span><span>الاسم</span><span>الفئة</span><span>الماركة</span><span>السعر</span><span>إجراءات</span>
          </div>
          {parts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد قطع</p>
            </div>
          ) : (
            parts.map((part, i) => (
              <motion.div key={part._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                <div className="w-12 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                  {part.images?.[0] ? (
                    <Image src={part.images[0]} alt={part.nameAr || part.name} width={48} height={40} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <Package className="w-5 h-5 text-gray-600 m-2.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{part.nameAr || part.name}</p>
                  <p className="text-xs text-gray-500">{part.condition || 'NEW'}</p>
                </div>
                <span className="text-sm text-gray-300">{part.partType || '—'}</span>
                <span className="text-sm text-gray-300">{part.carMake || '—'}</span>
                <span className="font-bold text-red-400">{(part.priceSar || part.price || 0).toLocaleString()} ر.س</span>
                <div className="flex gap-2">
                  <Link href={`/admin/parts/${part._id}/edit`}>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="تعديل">
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button onClick={() => handleDelete(part._id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all text-sm">السابق</button>
            <span className="px-4 py-2 text-gray-400 text-sm">{page} / {pagination.pages}</span>
            <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all text-sm">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
