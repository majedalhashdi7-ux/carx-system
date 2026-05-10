'use client';

import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Car, 
  ShoppingBag, 
  Users, 
  Settings, 
  TrendingUp, 
  Plus,
  Search,
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function AdminDashboard() {
  const stats = [
    { label: 'إجمالي السيارات', value: '24', icon: Car, trend: '+12%', color: 'text-luxury-gold' },
    { label: 'الطلبات النشطة', value: '156', icon: ShoppingBag, trend: '+5%', color: 'text-green-400' },
    { label: 'العملاء الجدد', value: '1,204', icon: Users, trend: '+18%', color: 'text-blue-400' },
    { label: 'الإيرادات (ريال)', value: '4.2M', icon: TrendingUp, trend: '+25%', color: 'text-purple-400' },
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
              {[
                { label: 'لوحة القيادة', icon: LayoutDashboard, active: true },
                { label: 'إدارة السيارات', icon: Car, active: false },
                { label: 'الطلبات والمبيعات', icon: ShoppingBag, active: false },
                { label: 'قاعدة العملاء', icon: Users, active: false },
                { label: 'إعدادات المنصة', icon: Settings, active: false },
              ].map((item, idx) => (
                <button 
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
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-10">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">لوحة التحكم <span className="text-luxury-gold">الإدارية</span></h1>
                <p className="text-white/40 mt-2 font-medium">مرحباً بك مجدداً، إليك ملخص أداء CAR X لهذا اليوم.</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-colors">
                  <Search className="w-5 h-5 text-white/60" />
                </button>
                <button className="bg-white text-black px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-luxury-gold transition-colors duration-300">
                  <Plus className="w-5 h-5" />
                  إضافة سيارة جديدة
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="premium-card p-6 group"
                >
                  <div className="glow-overlay" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" />
                        {stat.trend}
                      </div>
                    </div>
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Placeholder for Data Table/Graphs */}
            <div className="premium-card min-h-[500px] flex items-center justify-center p-12 text-center group">
              <div className="glow-overlay" />
              <div className="relative z-10 max-w-sm space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:border-luxury-gold/30 transition-colors duration-500">
                  <Settings className="w-8 h-8 text-white/20 animate-spin-slow" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">جاهز للإدارة</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    اختر القسم الذي تريد إدارته من القائمة الجانبية للبدء في تحديث المخزون أو مراجعة الطلبات.
                  </p>
                </div>
                <div className="pt-4">
                  <button className="text-luxury-gold text-sm font-black uppercase tracking-widest border-b border-luxury-gold/0 hover:border-luxury-gold/100 transition-all pb-1">
                    عرض المساعدة
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}

