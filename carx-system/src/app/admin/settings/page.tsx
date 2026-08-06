'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, Globe, Shield, CreditCard, Bell, Share2, Upload, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

import { api } from '../../../lib/api';
import { uploadImage } from '../../../lib/cloudinary';
import SyncWatermarksButton from '../../../components/admin/SyncWatermarksButton';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Forms Data
  const [generalData, setGeneralData] = useState({
    title: 'CAR X',
    description: 'المعرض الحصري للسيارات الفاخرة',
    phone: '',
    email: ''
  });

  const [socialData, setSocialData] = useState({
    salesWhatsapp: '',
    auctionWhatsapp: '',
    supportWhatsapp: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    snapchat: '',
    youtube: ''
  });

  const [brandData, setBrandData] = useState({
    logo: '',
    heroVideoUrl: ''
  });

  const [securityData, setSecurityData] = useState({
    deviceLockEnabled: true,
    maintenanceMode: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setInitialLoading(true);
      try {
        const res = await api.settings.get();
        if (res.data && (res.data as any).success) {
          const settings = (res.data as any).data;
          
          setGeneralData({
            title: settings.siteInfo?.name || 'CAR X',
            description: settings.siteInfo?.description || 'المعرض الحصري للسيارات الفاخرة',
            phone: settings.contactInfo?.phone || '',
            email: settings.contactInfo?.email || ''
          });

          const carx = settings.homeContent?.carxSettings || {};
          setSocialData({
            salesWhatsapp: carx.salesWhatsapp || settings.contactInfo?.whatsapp || '',
            auctionWhatsapp: carx.auctionWhatsapp || settings.contactInfo?.whatsapp || '',
            supportWhatsapp: carx.supportWhatsapp || settings.contactInfo?.whatsapp || '',
            whatsapp: settings.contactInfo?.whatsapp || settings.socialLinks?.whatsapp || carx.salesWhatsapp || '',
            facebook: settings.socialLinks?.facebook || '',
            instagram: settings.socialLinks?.instagram || '',
            twitter: settings.socialLinks?.twitter || '',
            tiktok: settings.socialLinks?.tiktok || '',
            snapchat: settings.socialLinks?.snapchat || '',
            youtube: settings.socialLinks?.youtube || ''
          });

          setBrandData({
            logo: settings.siteInfo?.logo || '',
            heroVideoUrl: carx.heroVideoUrl || '/videos/CAR_X.mp4'
          });

          setSecurityData({
            deviceLockEnabled: carx.deviceLockEnabled !== false,
            maintenanceMode: settings.features?.maintenanceMode || false
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setErrorMsg('حدث خطأ أثناء تحميل الإعدادات');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGeneralData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialData(prev => ({ ...prev, [name]: value }));
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBrandData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageUploading(true);
      setErrorMsg('');
      try {
        const url = await uploadImage(file);
        setBrandData(prev => ({ ...prev, logo: url }));
        setSuccessMsg('تم رفع الشعار الجديد بنجاح');
      } catch (err: any) {
        setErrorMsg(err.message || 'فشل رفع الشعار');
      } finally {
        setImageUploading(false);
      }
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (activeTab === 'general') {
        const res1 = await api.settings.updateSiteInfo({
          name: generalData.title,
          description: generalData.description,
          logo: brandData.logo
        });
        const res2 = await api.settings.updateContactInfo({
          phone: generalData.phone,
          email: generalData.email,
          whatsapp: socialData.salesWhatsapp
        });

        if (res1.error || res2.error) throw new Error(res1.error || res2.error);
        showToast('تم حفظ الإعدادات العامة بنجاح!');
      } 
      else if (activeTab === 'social') {
        // Save WhatsApp numbers in CarX settings
        const resCarX = await api.settings.updateCarX({
          salesWhatsapp: socialData.salesWhatsapp,
          auctionWhatsapp: socialData.auctionWhatsapp,
          supportWhatsapp: socialData.supportWhatsapp,
          heroVideoUrl: brandData.heroVideoUrl
        });
        // Save social links
        const resSocial = await api.settings.updateSocialLinks({
          whatsapp: socialData.whatsapp || socialData.salesWhatsapp,
          facebook: socialData.facebook,
          instagram: socialData.instagram,
          twitter: socialData.twitter,
          tiktok: socialData.tiktok,
          snapchat: socialData.snapchat,
          youtube: socialData.youtube
        });
        if (resCarX.error) throw new Error(resCarX.error);
        if (resSocial.error) throw new Error(resSocial.error);
        showToast('تم حفظ جميع روابط التواصل الاجتماعي بنجاح!');
      }
      else if (activeTab === 'brand') {
        const res = await api.settings.updateCarX({
          heroVideoUrl: brandData.heroVideoUrl
        });
        const resLogo = await api.settings.updateSiteInfo({
          name: generalData.title,
          description: generalData.description,
          logo: brandData.logo
        });
        if (res.error || resLogo.error) throw new Error(res.error || resLogo.error);
        showToast('تم تحديث هوية المعارض والشعار السحابي بنجاح!');
      }
      else if (activeTab === 'security') {
        const res = await api.settings.updateCarX({
          deviceLockEnabled: securityData.deviceLockEnabled
        });
        if (res.error) throw new Error(res.error);
        showToast('تم تحديث الخيارات الأمنية والتشغيلية بنجاح!');
      }
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ غير متوقع أثناء الحفظ', true);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'عام وتواصل', icon: Globe },
    { id: 'social', label: 'الواتساب والاجتماعي', icon: Share2 },
    { id: 'brand', label: 'الهوية والشعار السحابي', icon: Sparkles },
    { id: 'security', label: 'الأمان والتشغيل', icon: Shield },
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
        
        {/* Toast Messages */}
        {successMsg && (
          <div className="fixed bottom-10 left-10 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.1)]">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="fixed bottom-10 left-10 z-50 bg-red-500/20 border border-red-500/30 text-red-500 px-6 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm">{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black">إعدادات المنصة</h1>
            <p className="text-white/40 text-sm mt-1">تخصيص وإدارة تجربة وهوية CAR X بالكامل</p>
          </div>
          
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading || imageUploading}
            className="flex items-center gap-2 px-8 py-4 bg-luxury-gold text-black font-black rounded-xl hover:bg-white transition-all shadow-lg shadow-luxury-gold/10 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            حفظ التغييرات
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-luxury-gold' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 blur-[100px] pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              
              {/* Tab: General */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-luxury-gold">
                    <Globe className="w-6 h-6" /> الإعدادات العامة وتفاصيل التواصل
                  </h2>
                  <p className="text-xs text-white/40 leading-relaxed">تتحكم هذه الإعدادات باسم وهامش الموقع والبريد وتفاصيل الاتصال الهامة للزوار.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-white/60 mb-2">اسم المنصة</label>
                      <input 
                        type="text" 
                        name="title"
                        value={generalData.title}
                        onChange={handleGeneralChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-white/60 mb-2">الوصف التعريفي (SEO Description)</label>
                      <textarea 
                        name="description"
                        rows={3}
                        value={generalData.description}
                        onChange={handleGeneralChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">رقم هاتف التواصل</label>
                      <input 
                        type="text" 
                        name="phone"
                        value={generalData.phone}
                        onChange={handleGeneralChange}
                        placeholder="+966 50 000 0000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">البريد الإلكتروني</label>
                      <input 
                        type="email" 
                        name="email"
                        value={generalData.email}
                        onChange={handleGeneralChange}
                        placeholder="support@carx-motors.com"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Social/Whatsapp */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-luxury-gold">
                    <Share2 className="w-6 h-6" /> أرقام الواتساب ووسائل التواصل الاجتماعي
                  </h2>
                  <p className="text-xs text-white/40 leading-relaxed">تتحكم هذه الإعدادات بأزرار وتوجيهات الاتصال التلقائية للعملاء لحجز السيارات والقطع.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">واتساب المبيعات</label>
                      <input 
                        type="text" 
                        name="salesWhatsapp"
                        value={socialData.salesWhatsapp}
                        onChange={handleSocialChange}
                        placeholder="+966 50 000 0000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">واتساب المزادات الحية</label>
                      <input 
                        type="text" 
                        name="auctionWhatsapp"
                        value={socialData.auctionWhatsapp}
                        onChange={handleSocialChange}
                        placeholder="+966 50 000 0000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-white/60 mb-2">واتساب الدعم الفني العام</label>
                      <input 
                        type="text" 
                        name="supportWhatsapp"
                        value={socialData.supportWhatsapp}
                        onChange={handleSocialChange}
                        placeholder="+966 50 000 0000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div className="border-t border-white/10 md:col-span-2 my-2 pt-4">
                      <h3 className="text-sm font-bold text-white/80 mb-1">واتساب موحد للصفحة الرئيسية</h3>
                      <p className="text-xs text-white/30 mb-4">يظهر في الصفحة الرئيسية كرابط تواصل رئيسي مع العملاء</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-white/60 mb-2">رقم الواتساب الرئيسي (يظهر في الموقع)</label>
                      <input 
                        type="text" 
                        name="whatsapp"
                        value={socialData.whatsapp}
                        onChange={handleSocialChange}
                        placeholder="+966 50 000 0000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div className="border-t border-white/10 md:col-span-2 my-2 pt-4">
                      <h3 className="text-sm font-bold text-white/80 mb-4">روابط الشبكات الاجتماعية</h3>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">📘 رابط فيسبوك</label>
                      <input 
                        type="text" 
                        name="facebook"
                        value={socialData.facebook}
                        onChange={handleSocialChange}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">📸 رابط انستجرام</label>
                      <input 
                        type="text" 
                        name="instagram"
                        value={socialData.instagram}
                        onChange={handleSocialChange}
                        placeholder="https://instagram.com/yourpage"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">𝕏 رابط تويتر (X)</label>
                      <input 
                        type="text" 
                        name="twitter"
                        value={socialData.twitter}
                        onChange={handleSocialChange}
                        placeholder="https://twitter.com/yourpage"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">🎵 رابط تيك توك</label>
                      <input 
                        type="text" 
                        name="tiktok"
                        value={socialData.tiktok}
                        onChange={handleSocialChange}
                        placeholder="https://tiktok.com/@yourpage"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">👻 رابط سناب شات</label>
                      <input 
                        type="text" 
                        name="snapchat"
                        value={socialData.snapchat}
                        onChange={handleSocialChange}
                        placeholder="https://snapchat.com/add/yourname"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">▶️ رابط يوتيوب</label>
                      <input 
                        type="text" 
                        name="youtube"
                        value={socialData.youtube}
                        onChange={handleSocialChange}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Brand & Assets */}
              {activeTab === 'brand' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-luxury-gold">
                    <Sparkles className="w-6 h-6" /> الشعار السحابي وهوية المنصة
                  </h2>
                  <p className="text-xs text-white/40 leading-relaxed">تخصيص الشعار المرفوع سحابياً عبر Cloudinary ومصادر الوسائط الفاخرة لواجهة العميل.</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-3">شعار المعرض (شعار شفاف)</label>
                      
                      {imageUploading ? (
                        <div className="border border-dashed border-luxury-gold/30 bg-white/[0.01] rounded-2xl p-8 flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 text-luxury-gold animate-spin" />
                          <span className="text-sm font-bold text-luxury-gold">جاري رفع الشعار السحابي...</span>
                        </div>
                      ) : brandData.logo ? (
                        <div className="flex items-center gap-6 p-4 border border-white/10 bg-black/50 rounded-2xl">
                          <img src={brandData.logo} className="h-16 max-w-[150px] object-contain rounded bg-white/5 p-2" alt="Logo" />
                          <label className="bg-white/5 border border-white/10 hover:bg-white/10 text-xs px-4 py-2.5 rounded-xl cursor-pointer font-bold transition-all">
                            تحديث الشعار
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        </div>
                      ) : (
                        <label className="border border-dashed border-white/10 hover:border-luxury-gold/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-black/35">
                          <Upload className="w-8 h-8 text-white/20 mb-2" />
                          <span className="text-xs font-bold">انقر لرفع الشعار</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-2">رابط فيديو البانر الرئيسي (Hero Video)</label>
                      <input 
                        type="text" 
                        name="heroVideoUrl"
                        value={brandData.heroVideoUrl}
                        onChange={handleBrandChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-luxury-gold/50 focus:outline-none transition-colors"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Security & Functionality */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-luxury-gold">
                    <Shield className="w-6 h-6" /> الخيارات الأمنية وحالة التشغيل
                  </h2>
                  <p className="text-xs text-white/40 leading-relaxed">التحكم في خيارات أمان الأجهزة وحصانة المنصة العامة ضد الاختراق.</p>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-5 border border-white/10 bg-white/[0.01] rounded-2xl">
                      <div className="space-y-1">
                        <span className="block text-sm font-bold">تفعيل بصمة الجهاز (Device Fingerprint)</span>
                        <span className="text-xs text-white/30">يقوم بحماية حسابات المدراء ومطابقة البصمة لمنع التهكير.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={securityData.deviceLockEnabled} 
                          onChange={(e) => setSecurityData(prev => ({ ...prev, deviceLockEnabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luxury-gold" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-5 border border-white/10 bg-white/[0.01] rounded-2xl">
                      <div className="space-y-1">
                        <span className="block text-sm font-bold">وضع الصيانة الكامل</span>
                        <span className="text-xs text-white/30">تعطيل تصفح المنصة بشكل مؤقت للقيام بالتحديثات البرمجية.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={securityData.maintenanceMode} 
                          onChange={(e) => setSecurityData(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── قسم أدوات النظام ─── */}
              <div className="border border-white/10 bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10">
                  <h3 className="font-black text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-luxury-gold" />
                    أدوات النظام
                  </h3>
                  <p className="text-xs text-white/30 mt-1">عمليات صيانة البيانات والمزامنة الجذرية</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* زر تطبيق العلامة المائية */}
                  <div className="flex items-center justify-between p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-xl">
                    <div className="space-y-1">
                      <span className="block text-sm font-bold">💧 تطبيق العلامة المائية على جميع الصور</span>
                      <span className="text-xs text-white/40">
                        يضيف شعار HM SHOWROOM على كل صور السيارات وقطع الغيار في قاعدة البيانات (بما فيها القديمة). تعمل في الخلفية.
                      </span>
                    </div>
                    <SyncWatermarksButton />
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
    </div>
  );
}
