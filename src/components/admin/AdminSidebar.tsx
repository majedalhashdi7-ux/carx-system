'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Car, Package, Building2, Users, Settings,
  LogOut, ArrowRight, Menu, X, Zap, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { href: '/admin', icon: BarChart3, label: 'الإحصائيات', exact: true },
  { href: '/admin/cars', icon: Car, label: 'السيارات' },
  { href: '/admin/parts', icon: Package, label: 'قطع الغيار' },
  { href: '/admin/brands', icon: Building2, label: 'الوكالات' },
  { href: '/admin/users', icon: Users, label: 'المستخدمون' },
  { href: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <p className="font-black text-white text-lg leading-none">
              CAR<span className="text-red-500"> X</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">لوحة الإدارة</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium group ${
                active
                  ? 'bg-red-600/20 text-white border border-red-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="adminActive"
                  className="absolute inset-0 bg-red-600/20 rounded-xl border border-red-500/30"
                />
              )}
              <item.icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${active ? 'text-red-400' : 'group-hover:text-white'}`} />
              <span className="relative z-10">{item.label}</span>
              {active && <ChevronRight className="w-4 h-4 relative z-10 mr-auto text-red-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Actions */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white truncate">{user?.name || 'مشرف'}</p>
            <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مشرف النظام' : 'مدير'}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>الموقع</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/10 z-40 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-zinc-950 border-b border-white/10 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-black text-white">CAR<span className="text-red-500"> X</span></span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-72 bg-zinc-950 border-l border-white/10 z-50"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
