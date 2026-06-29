'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Car, Wrench, Award,
  ShoppingBag, Users, Settings, Download,
  LogOut, X, Menu
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'لوحة القيادة',    icon: LayoutDashboard, href: '/admin' },
  { label: 'إدارة السيارات',  icon: Car,             href: '/admin/cars' },
  { label: 'قطع الغيار',      icon: Wrench,          href: '/admin/parts' },
  { label: 'إدارة الوكالات',  icon: Award,           href: '/admin/brands' },
  { label: 'الطلبات',         icon: ShoppingBag,     href: '/admin/orders' },
  { label: 'العملاء',         icon: Users,           href: '/admin/users' },
  { label: 'الاستيراد الذكي', icon: Download,        href: '/admin/import' },
  { label: 'الإعدادات',       icon: Settings,        href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.push('/login?redirect=/admin');
      return;
    }
    const allowedRoles = ['admin', 'super_admin', 'manager'];
    if (!allowedRoles.includes(user?.role || '')) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <span className="text-4xl font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>
          <div className="w-10 h-10 border-[3px] border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-bold">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  const allowedRoles = ['admin', 'super_admin', 'manager'];
  if (!isLoggedIn || !allowedRoles.includes(user?.role || '')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir="rtl">
      
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 right-0 h-full w-72 bg-black/95 border-l border-white/[0.06]
        z-50 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <Link href="/admin" className="group">
            <span className="text-2xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold group-hover:text-white transition-colors">X</span>
            </span>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">لوحة الإدارة</p>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">القائمة الرئيسية</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                  isActive
                    ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-black' : 'group-hover:text-luxury-gold'
                  }`} />
                  {item.label}
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-black/30" />}
              </Link>
            );
          })}
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center shrink-0">
              <span className="text-luxury-gold font-black text-sm">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-black/90 border-b border-white/[0.06] px-4 py-3 flex items-center justify-between backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
