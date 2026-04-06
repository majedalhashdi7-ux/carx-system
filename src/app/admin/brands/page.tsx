'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Search, Edit, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Brand {
  _id: string;
  name: string;
  nameEn?: string;
  key: string;
  logoUrl?: string;
  carCount?: number;
}

const SIDEBAR_ITEMS = [
  { href: '/admin', label: 'الإحصائيات' },
  { href: '/admin/cars', label: 'السيارات' },
  { href: '/admin/parts', label: 'قطع الغيار' },
  { href: '/admin/brands', label: 'الوكالات', active: true },
  { href: '/admin/users', label: 'المستخدمون' },
  { href: '/admin/settings', label: 'الإعدادات' },
];

export default function AdminBrandsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success) setBrands(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn || !['admin', 'manager'].includes(user?.role || '')) {
        router.push('/login');
        return;
      }
      fetchBrands();
    }
  }, [loading, isLoggedIn, user, fetchBrands]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الوكالة؟')) return;
    try {
      const token = localStorage.getItem('carx-token');
      await fetch(`/api/brands/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchBrands();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = brands.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.nameEn || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

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
            <h1 className="text-3xl font-black">الوكالات</h1>
            <p className="text-gray-400 mt-1">{filtered.length} وكالة</p>
          </div>
          <Link href="/admin/brands/new">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-colors cursor-pointer">
              <Plus className="w-5 h-5" />
              إضافة وكالة
            </motion.div>
          </Link>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="ابحث عن وكالة..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-4 text-center py-16">
              <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد وكالات</p>
            </div>
          ) : (
            filtered.map((brand, i) => (
              <motion.div key={brand._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-zinc-950 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  {brand.logoUrl ? (
                    <Image src={brand.logoUrl} alt={brand.name} width={64} height={64}
                      className="object-contain w-full h-full p-2" unoptimized />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <p className="font-black text-center mb-1">{brand.name}</p>
                {brand.nameEn && <p className="text-xs text-gray-500 text-center mb-3">{brand.nameEn}</p>}
                <p className="text-xs text-center text-red-400 mb-4">{brand.carCount || 0} سيارة</p>
                <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/admin/brands/${brand._id}/edit`}>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="تعديل">
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button onClick={() => handleDelete(brand._id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="حذف">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
