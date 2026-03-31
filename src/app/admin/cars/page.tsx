'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Car as CarIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Car {
  _id: string;
  title: string;
  make: string;
  model?: string;
  year?: number;
  price: number;
  priceSar?: number;
  images: string[];
  isActive: boolean;
  isSold: boolean;
  source?: string;
  createdAt: string;
}

export default function AdminCarsPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!isLoggedIn || !['admin', 'manager'].includes(user?.role || ''))) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, user]);

  useEffect(() => {
    fetchCars();
  }, [page]);

  const fetchCars = async () => {
    setLoadingCars(true);
    try {
      const token = localStorage.getItem('carx-token');
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/cars?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setCars(data.data);
        setPagination(data.pagination);
      }
    } finally {
      setLoadingCars(false);
    }
  };

  const handleToggleActive = async (car: Car) => {
    const token = localStorage.getItem('carx-token');
    await fetch(`/api/admin/cars/${car._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ isActive: !car.isActive }),
    });
    fetchCars();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السيارة؟')) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem('carx-token');
      await fetch(`/api/admin/cars/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchCars();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Sidebar - reuse same layout as admin/page.tsx */}
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <div>
              <p className="font-black text-white">CAR X</p>
              <p className="text-xs text-gray-500">لوحة الإدارة</p>
            </div>
          </Link>
        </div>
        <nav className="p-4">
          <Link href="/admin" className="block text-gray-400 hover:text-white px-4 py-2 rounded-lg">← الرئيسية</Link>
        </nav>
      </div>

      {/* Main */}
      <div className="mr-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black">إدارة السيارات</h1>
            <p className="text-gray-400">{pagination.total} سيارة في المخزون</p>
          </div>
          <Link
            href="/admin/cars/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة سيارة
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن سيارة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCars()}
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button onClick={fetchCars} className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-3 rounded-xl transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Table */}
        <div className="bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="text-right px-4 py-3">السيارة</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">الماركة</th>
                <th className="text-right px-4 py-3 hidden lg:table-cell">السنة</th>
                <th className="text-right px-4 py-3">السعر</th>
                <th className="text-right px-4 py-3">الحالة</th>
                <th className="text-right px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loadingCars ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="w-8 h-8 border-4 border-white/10 border-t-red-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : cars.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <CarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    لا توجد سيارات
                  </td>
                </tr>
              ) : (
                cars.map((car) => (
                  <motion.tr
                    key={car._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                          {car.images?.[0] ? (
                            <Image src={car.images[0]} alt={car.title} width={48} height={36} className="object-cover w-full h-full" unoptimized />
                          ) : (
                            <CarIcon className="w-4 h-4 text-gray-600 m-2.5" />
                          )}
                        </div>
                        <span className="font-bold text-sm line-clamp-1">{car.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{car.make}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm hidden lg:table-cell">{car.year}</td>
                    <td className="px-4 py-3 text-red-400 font-bold text-sm">
                      {(car.priceSar || car.price || 0).toLocaleString()} ر.س
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        car.isSold ? 'bg-gray-500/20 text-gray-400' :
                        car.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {car.isSold ? 'مباع' : car.isActive ? 'نشط' : 'مخفي'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/showroom/${car._id}`} target="_blank"
                          className="text-gray-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleToggleActive(car)}
                          className={`transition-colors ${car.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-300'}`}>
                          {car.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/cars/${car._id}/edit`}
                          className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(car._id)}
                          disabled={deleting === car._id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30">السابق</button>
            <span className="px-4 py-2 text-gray-400">{page} / {pagination.pages}</span>
            <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
