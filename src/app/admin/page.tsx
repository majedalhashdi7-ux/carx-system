'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Car, Package, Building2, Users, TrendingUp, Eye,
  Plus, Settings, LogOut, BarChart3, Shield, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface Stats {
  totalCars: number;
  activeCars: number;
  soldCars: number;
  totalParts: number;
  totalBrands: number;
  totalUsers: number;
}

interface RecentCar {
  _id: string;
  title: string;
  make: string;
  price: number;
  priceSar?: number;
  images: string[];
  createdAt: string;
}

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: number; color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-zinc-950 border border-white/10 rounded-2xl p-6"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-3xl font-black mb-1">{value.toLocaleString()}</p>
    <p className="text-gray-400 text-sm">{label}</p>
  </motion.div>
);

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCars, setRecentCars] = useState<RecentCar[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn || !['admin', 'manager'].includes(user?.role || '')) {
        router.push('/login');
        return;
      }
      fetchStats();
    }
  }, [loading, isLoggedIn, user]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('carx-token');
      const res = await fetch('/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentCars(data.recentCars || []);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">X</span>
            </div>
            <div>
              <p className="font-black text-white">CAR X</p>
              <p className="text-xs text-gray-500">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { href: '/admin', icon: BarChart3, label: 'الإحصائيات' },
            { href: '/admin/cars', icon: Car, label: 'إدارة السيارات' },
            { href: '/admin/parts', icon: Package, label: 'قطع الغيار' },
            { href: '/admin/brands', icon: Building2, label: 'الوكالات' },
            { href: '/admin/users', icon: Users, label: 'المستخدمون' },
            { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all"
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مشرف' : 'مدير'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
              <ArrowLeft className="w-3 h-3" />
              الموقع
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors mr-auto">
              <LogOut className="w-3 h-3" />
              خروج
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mr-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black">لوحة التحكم</h1>
          <p className="text-gray-400 mt-1">مرحباً {user?.name}، هذا ملخص النظام</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <StatCard icon={Car} label="إجمالي السيارات" value={stats.totalCars} color="bg-blue-500/20 text-blue-400" />
            <StatCard icon={TrendingUp} label="السيارات النشطة" value={stats.activeCars} color="bg-green-500/20 text-green-400" />
            <StatCard icon={Shield} label="المباعة" value={stats.soldCars} color="bg-yellow-500/20 text-yellow-400" />
            <StatCard icon={Package} label="قطع الغيار" value={stats.totalParts} color="bg-purple-500/20 text-purple-400" />
            <StatCard icon={Building2} label="الوكالات" value={stats.totalBrands} color="bg-orange-500/20 text-orange-400" />
            <StatCard icon={Users} label="المستخدمون" value={stats.totalUsers} color="bg-red-500/20 text-red-400" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/admin/cars/new', icon: Plus, label: 'إضافة سيارة جديدة', color: 'bg-red-600 hover:bg-red-700' },
            { href: '/admin/parts/new', icon: Plus, label: 'إضافة قطعة غيار', color: 'bg-blue-600 hover:bg-blue-700' },
            { href: '/admin/brands/new', icon: Plus, label: 'إضافة وكالة', color: 'bg-green-600 hover:bg-green-700' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className={`${color} flex items-center gap-3 text-white font-bold px-6 py-4 rounded-2xl transition-colors`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Recent Cars */}
        {recentCars.length > 0 && (
          <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">آخر السيارات المضافة</h2>
              <Link href="/admin/cars" className="text-red-400 hover:text-red-300 text-sm transition-colors">
                عرض الكل
              </Link>
            </div>
            <div className="space-y-3">
              {recentCars.map((car) => (
                <div key={car._id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/8 transition-colors">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {car.images?.[0] ? (
                      <Image src={car.images[0]} alt={car.title} width={64} height={48} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <Car className="w-6 h-6 text-gray-600 m-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{car.title}</p>
                    <p className="text-gray-400 text-sm">{car.make}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-400">{(car.priceSar || car.price || 0).toLocaleString()}</p>
                    <p className="text-gray-500 text-xs">ر.س</p>
                  </div>
                  <Link href={`/admin/cars/${car._id}`} className="text-gray-400 hover:text-white transition-colors">
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
