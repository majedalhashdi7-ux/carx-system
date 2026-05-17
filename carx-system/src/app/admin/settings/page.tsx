'use client';

import { useState } from 'react';
import { Save, Settings, Globe, Shield, CreditCard, Bell } from 'lucide-react';
import Navbar from '../../../components/Navbar';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'عام', icon: Globe },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'payment', label: 'الدفع', icon: CreditCard },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold">إعدادات المنصة</h1>
            <p className="text-white/40 text-sm mt-1">تكوين وتخصيص تجربة CAR X بالكامل</p>
          </div>
          <button 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-luxury-gold text-black font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-luxury-gold/10"
          >
            <Save className="w-5 h-5" />
            حفظ التغييرات
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-luxury-gold' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-luxury-gold" /> الإعدادات العامة
                </h2>
                
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">اسم المنصة</label>
                  <input 
                    type="text" 
                    defaultValue="CAR X"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">الوصف التعريفي (SEO)</label>
                  <textarea 
                    rows={3}
                    defaultValue="المعرض الحصري للسيارات الفاخرة في المملكة"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2">رقم هاتف التواصل</label>
                    <input 
                      type="text" 
                      defaultValue="+966 50 000 0000"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/60 mb-2">البريد الإلكتروني للعملاء</label>
                    <input 
                      type="email" 
                      defaultValue="support@carx.sa"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'general' && (
              <div className="h-64 flex flex-col items-center justify-center text-white/30 text-center space-y-4">
                <Settings className="w-12 h-12 animate-spin-slow opacity-20" />
                <p className="text-sm">هذا القسم قيد التطوير...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
