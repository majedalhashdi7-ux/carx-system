'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Search, Edit2, Trash2, 
  Filter, MoreHorizontal, CheckCircle2, XCircle 
} from 'lucide-react';
import { api } from '../../../lib/api';
import Navbar from '../../../components/Navbar';

export default function AdminCarsPage() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const fetchCars = async () => {
    setLoading(true);
    const res = await api.cars.getAll() as any;
    if (res.error) {
      setError(res.error);
    } else {
      const result = res.data;
      setCars(result?.data?.cars || result?.cars || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
      try {
        await api.cars.delete(id);
        fetchCars();
      } catch (_err) {
        alert('فشل حذف السيارة');
      }
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const filteredCars = cars.filter(car => 
    car.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold">إدارة السيارات</h1>
            <p className="text-white/40 text-sm mt-1">تحكم في مخزون السيارات المعروضة في CAR X</p>
          </div>
          <Link href="/admin/cars/new" className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-luxury-gold/10">
            <Plus className="w-5 h-5" />
            إضافة سيارة جديدة
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text"
              placeholder="ابحث عن سيارة برقم الهيكل أو الاسم..."
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
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السيارة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الماركة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">السعر</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">تاريخ الإضافة</th>
                  <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-widest">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-20 bg-white/[0.01]" />
                    </tr>
                  ))
                ) : filteredCars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-white/20">
                      لا توجد سيارات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredCars.map((car) => (
                    <tr key={car._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={car.mainImage || car.images?.[0] || 'https://via.placeholder.com/100'} 
                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                            alt=""
                          />
                          <div>
                            <div className="font-bold text-sm">{car.title}</div>
                            <div className="text-[10px] text-white/30 uppercase">{car.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-white/60">{car.brand || car.make}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm">
                        {car.price?.toLocaleString()} <span className="text-[10px] text-white/20">ريال</span>
                      </td>
                      <td className="px-6 py-4">
                        {car.isActive ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            نشط
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-white/20 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            مخفي
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40">
                        {new Date(car.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/cars/${car._id}/edit`} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-luxury-gold transition-all">
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(car._id)}
                            className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
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
