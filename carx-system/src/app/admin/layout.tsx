'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Car, Wrench, Award,
  ShoppingBag, Users, Settings, Download,
  LogOut, X, Menu, Radio, ChevronDown,
  Bell, Search
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

const NAV_ITEMS = [
  { label: 'لوحة القيادة',     icon: LayoutDashboard, href: '/admin' },
  { label: 'إدارة السيارات',   icon: Car,             href: '/admin/cars' },
  { label: 'المزادات المباشرة', icon: Radio,           href: '/admin/live-auctions' },
  { label: 'قطع الغيار',       icon: Wrench,          href: '/admin/parts' },
  { label: 'إدارة الوكالات',   icon: Award,           href: '/admin/brands' },
  { label: 'الطلبات',          icon: ShoppingBag,     href: '/admin/orders' },
  { label: 'العملاء',          icon: Users,           href: '/admin/users' },
  { label: 'الاستيراد الذكي',  icon: Download,        href: '/admin/import' },
  { label: 'الإعدادات',        icon: Settings,        href: '/admin/settings' },
];

// روابط الاستيراد الفرعية
const IMPORT_SUB_ITEMS = [
  { label: 'استيراد سيارة',     icon: Car,    href: '/admin/import/cars' },
  { label: 'استيراد قطعة غيار', icon: Wrench, href: '/admin/import/parts' },
  { label: 'مزاد مباشر',        icon: Radio,  href: '/admin/live-auctions' },
];

// قائمة التنقل السفلية للموبايل (أهم 5 صفحات)
const BOTTOM_NAV = [
  { label: 'الرئيسية', icon: LayoutDashboard, href: '/admin' },
  { label: 'سيارات',   icon: Car,             href: '/admin/cars' },
  { label: 'طلبات',    icon: ShoppingBag,     href: '/admin/orders' },
  { label: 'عملاء',    icon: Users,           href: '/admin/users' },
  { label: 'المزيد',   icon: Menu,            href: null }, // يفتح الـ sidebar
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // إغلاق الـ sidebar عند تغيير الصفحة
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // إغلاق بـ Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) { router.push('/login?redirect=/admin'); return; }
    const allowed = ['admin', 'super_admin', 'manager'];
    if (!allowed.includes(user?.role || '')) router.push('/');
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>
          <div className="w-10 h-10 border-[3px] border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-bold">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  const allowedRoles = ['admin', 'super_admin', 'manager'];
  if (!isLoggedIn || !allowedRoles.includes(user?.role || '')) return null;

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex" dir="rtl">

      {/* ── Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside className={`
        fixed top-0 right-0 h-full w-[280px] sm:w-72 bg-[#080808] border-l border-white/[0.06]
        z-50 flex flex-col transition-transform duration-300 ease-out
        lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        shadow-[-20px_0_60px_rgba(0,0,0,0.5)] lg:shadow-none
      `}>

        {/* Logo */}
        <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <Link href="/admin" className="group flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-luxury-gold flex items-center justify-center shrink-0">
              <span className="text-black font-black text-sm">CX</span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold">X</span>
              </span>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">لوحة الإدارة</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 sm:p-4 space-y-0.5 overflow-y-auto overscroll-contain">
          <p className="px-3 mb-3 text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">القائمة الرئيسية</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const isImport = item.href === '/admin/import';
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all group ${
                    isActive
                      ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                      : 'text-white/40 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                      isActive ? 'text-black' : 'group-hover:text-luxury-gold'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isImport && (
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'rotate-180 text-black/60' : 'text-white/20'}`} />
                  )}
                </Link>

                {/* Sub items for import */}
                {isImport && isActive && (
                  <div className="mr-4 mt-1 mb-1 space-y-0.5 border-r-2 border-luxury-gold/20 pr-3">
                    {IMPORT_SUB_ITEMS.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                      return (
                        <Link key={sub.href} href={sub.href}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            subActive
                              ? 'text-luxury-gold bg-luxury-gold/10'
                              : 'text-white/30 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <sub.icon className="w-3.5 h-3.5 shrink-0" />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 sm:p-4 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-2xl bg-white/[0.02]">
            <div className="w-9 h-9 rounded-xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center shrink-0">
              <span className="text-luxury-gold font-black text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut className="w-4 h-4 shrink-0" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">

        {/* ── Top Header (all screens) ── */}
        <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          {/* Mobile: hamburger | Desktop: page title area */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all shrink-0"
            aria-label="فتح القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo (mobile only) */}
          <span className="lg:hidden text-lg font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>

          {/* Desktop: breadcrumb-like current page */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-white/40 font-bold">
            <span>لوحة الإدارة</span>
            <span>/</span>
            <span className="text-white">
              {NAV_ITEMS.find(n => n.href !== '/admin' && pathname.startsWith(n.href))?.label ||
               NAV_ITEMS.find(n => n.href === '/admin' && pathname === '/admin')?.label || 'الرئيسية'}
            </span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all text-xs font-bold">
              <span>عرض الموقع</span>
            </Link>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

        {/* ── Bottom Navigation (mobile only) ── */}
        <nav className="lg:hidden fixed bottom-0 right-0 left-0 z-30 bg-black/95 backdrop-blur-xl border-t border-white/[0.06] safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV.map((item) => {
              if (item.href === null) {
                // "المزيد" — يفتح الـ sidebar
                return (
                  <button key="more" onClick={() => setSidebarOpen(true)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0 ${
                      sidebarOpen ? 'text-luxury-gold' : 'text-white/30 hover:text-white'
                    }`}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] font-black">{item.label}</span>
                  </button>
                );
              }
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0 ${
                    isActive ? 'text-luxury-gold' : 'text-white/30 hover:text-white'
                  }`}>
                  <div className="relative">
                    <item.icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-luxury-gold border border-black" />
                    )}
                  </div>
                  <span className="text-[10px] font-black truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom nav spacer */}
        <div className="lg:hidden h-16" />
      </div>
    </div>
  );
}
