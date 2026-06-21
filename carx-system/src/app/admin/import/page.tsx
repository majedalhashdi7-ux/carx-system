'use client';

import { useState } from 'react';
import { LayoutDashboard, Car, Wrench, Award, ShoppingBag, Users, Settings, Download } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ImportSystem from '../../../components/admin/ImportSystem';

export default function AdminImportPage() {
  const [importType, setImportType] = useState<'car' | 'part'>('car');

  const navItems = [
    { label: 'لوحة القيادة',    icon: LayoutDashboard, active: false, href: '/admin' },
    { label: 'إدارة السيارات',  icon: Car,             active: false, href: '/admin/cars' },
    { label: 'قطع الغيار',      icon: Wrench,          active: false, href: '/admin/parts' },
    { label: 'إدارة الوكالات',  icon: Award,           active: false, href: '/admin/brands' },
    { label: 'الطلبات',         icon: ShoppingBag,     active: false, href: '/admin/orders' },
    { label: 'العملاء',         icon: Users,           active: false, href: '/admin/users' },
    { label: 'الاستيراد الذكي', icon: Download,        active: true,  href: '/admin/import' },
    { label: 'الإعدادات',       icon: Settings,        active: false, href: '/admin/settings' },
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="glass-panel p-6 rounded-[2rem] sticky top-32 space-y-2">
              <div className="px-4 mb-6">
                <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">القائمة الرئيسية</h2>
              </div>
              {navItems.map((item, idx) => (
                <Link
                  href={item.href}
                  key={idx}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-bold transition-all group ${
                    item.active
                      ? 'bg-luxury-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 ${item.active ? 'text-black' : 'group-hover:text-luxury-gold'} transition-colors`} />
                    {item.label}
                  </div>
                  {item.active && <div className="w-1.5 h-1.5 rounded-full bg-black/30" />}
                </Link>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                نظام الاستيراد <span className="text-luxury-gold">الذكي والآلي</span>
              </h1>
              <p className="text-white/40 mt-2 font-medium">
                استيراد وتغذية المعرض بالسيارات وقطع الغيار عبر كشط محتوى الروابط الخارجية مباشرة.
              </p>
            </div>

            {/* Type Selector Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-1">
              <button
                onClick={() => setImportType('car')}
                className={`pb-4 px-4 text-sm font-black border-b-2 transition-all cursor-pointer ${
                  importType === 'car'
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                استيراد سيارات كورية / عالمية
              </button>
              <button
                onClick={() => setImportType('part')}
                className={`pb-4 px-4 text-sm font-black border-b-2 transition-all cursor-pointer ${
                  importType === 'part'
                    ? 'border-luxury-gold text-luxury-gold'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                استيراد قطع غيار ومستلزمات
              </button>
            </div>

            {/* Import System Component */}
            <div className="bg-zinc-950/20 border border-white/[0.04] p-6 md:p-8 rounded-[2rem] backdrop-blur-md">
              <ImportSystem type={importType} />
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
