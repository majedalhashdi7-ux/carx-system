'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Car, ShoppingBag, Users, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function AdminDashboard() {
  const stats = [
    { label: 'السيارات', value: '24', icon: Car, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'الطلبات', value: '156', icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'العملاء', value: '1,204', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {[
            { label: 'لوحة القيادة', icon: LayoutDashboard, active: true },
            { label: 'إدارة السيارات', icon: Car, active: false },
            { label: 'الطلبات', icon: ShoppingBag, active: false },
            { label: 'العملاء', icon: Users, active: false },
            { label: 'الإعدادات', icon: Settings, active: false },
          ].map((item, idx) => (
            <button 
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                item.active 
                  ? 'bg-luxury-gold text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم إدارة CAR X</h1>
            <p className="text-white/40 text-sm mt-1">نظرة عامة على أداء المنصة</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-white/40 text-sm mb-1">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-3">
              <Settings className="w-10 h-10 text-white/20 mx-auto" />
              <h3 className="text-lg font-medium text-white/60">اختر قسم من القائمة الجانبية لإدارته</h3>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
