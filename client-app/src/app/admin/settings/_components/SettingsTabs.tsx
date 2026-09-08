'use client';

/**
 * تبويبات إعدادات النظام المتبقية
 * ─────────────────────────────────
 * يحتوي على 6 تبويبات:
 * 1. SocialTab    - روابط التواصل الاجتماعي
 * 2. ContactTab   - معلومات الاتصال
 * 3. CurrencyTab  - إعدادات العملة وأسعار الصرف
 * 4. SiteTab      - هوية الموقع (الشعار والوصف)
 * 5. HomeTab      - محتوى الصفحة الرئيسية (Hero)
 * 6. FeaturesTab  - قسم "لماذا تختارنا"
 */

import { motion } from 'framer-motion';
import {
    Save, Globe, MessageCircle, Instagram, Youtube, Facebook, Camera,
    Send, Linkedin, Phone, Mail, MapPin, Clock, DollarSign, LayoutDashboard, Shield
} from 'lucide-react';
import NextImage from 'next/image';
import { api } from '@/lib/api-original';
import { cn } from '@/lib/utils';

const EMPTY_STRING = '';
const rawText = (value: string) => value;

// ── أنواع البيانات ──
interface SocialLinks { whatsapp: string; instagram: string; twitter: string; facebook: string; youtube: string; tiktok: string; snapchat: string; telegram: string; linkedin: string; }
interface ContactInfo { phone: string; email: string; address: string; workingHours: string; }
interface CurrencySettings { usdToSar: number; usdToKrw: number; activeCurrency: string; partsMultiplier: number; auctionMultiplier: number; }
interface SiteInfo { siteName: string; siteDescription: string; logoUrl: string; faviconUrl: string; }
interface HomeContent {
    heroTitle: string; 
    heroSubtitle: string; 
    heroVideoUrl: string;
    featuredCarsSource?: 'showroom' | 'auctions';
    showSearchSection?: boolean;
    showLiveMarket?: boolean;
    showTrustHub?: boolean;
    showAdvertising?: boolean;
    showBuyingJourney?: boolean;
    showPlatformFeatures?: boolean;
    showBrandCatalog?: boolean;
    showTrustedBy?: boolean;
    showTestimonials?: boolean;
    showAppConversion?: boolean;
    showFAQ?: boolean;
}
interface Feature { icon: string; title: string; desc: string;[key: string]: string; }

// ─────────────────────────────────
// تبويب التواصل الاجتماعي
// ─────────────────────────────────
export function SocialTab({ socialLinks, loading, isRTL, onSave, onLinkChange, setMessage }: {
    socialLinks: SocialLinks;
    loading: boolean;
    isRTL: boolean;
    onSave: () => void;
    onLinkChange: (links: SocialLinks) => void;
    setMessage: (msg: { type: string; text: string }) => void;
}) {
    // قائمة منصات التواصل الاجتماعي المدعومة
    const socialFields = [
        { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+966XXXXXXXXX', color: 'text-green-500' },
        { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...', color: 'text-pink-500' },
        { key: 'twitter', label: 'X (Twitter)', icon: Globe, placeholder: 'https://x.com/...', color: 'text-white' },
        { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...', color: 'text-blue-500' },
        { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...', color: 'text-red-500' },
        { key: 'tiktok', label: 'TikTok', icon: Camera, placeholder: 'https://tiktok.com/@...', color: 'text-white' },
        { key: 'snapchat', label: 'Snapchat', icon: Camera, placeholder: 'snapchat_username', color: 'text-yellow-400' },
        { key: 'telegram', label: 'Telegram', icon: Send, placeholder: 'https://t.me/...', color: 'text-blue-400' },
        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/...', color: 'text-blue-600' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <h2 className="text-lg font-black uppercase tracking-wider mb-2 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-cinematic-neon-red" />
                    {isRTL ? rawText('روابط التواصل الاجتماعي') : rawText('Social Media Links')}
                </h2>
                <p className="text-xs text-white/40 mb-8">
                    {isRTL
                        ? rawText('✅ الروابط التي تضيفها فقط ستظهر — الروابط الفارغة لا تظهر أبداً')
                        : rawText('✅ Only links you add will appear — empty links are hidden')}
                </p>
                <div className="space-y-3">
                    {socialFields.map(field => {
                        const currentVal = ((socialLinks as any)[field.key] as string) || EMPTY_STRING;
                        const hasValue = currentVal.trim() !== EMPTY_STRING;
                        const Icon = field.icon;
                        return (
                            <div key={field.key}
                                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${hasValue ? 'bg-white/4 border-white/15' : 'bg-white/1 border-white/5 opacity-60'}`}>
                                {/* أيقونة المنصة */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasValue ? 'bg-white/10' : 'bg-white/5'}`}>
                                    <Icon className={`w-5 h-5 ${field.color}`} />
                                </div>
                                {/* حقل الرابط */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                                        {field.label}
                                        {hasValue
                                            ? <span className="mr-2 text-green-400">{rawText('● موجود')}</span>
                                            : <span className="mr-2 text-white/20">{rawText('○ فارغ - لن يظهر')}</span>
                                        }
                                    </div>
                                    <input type="text" value={currentVal} dir="ltr"
                                        onChange={e => onLinkChange({ ...socialLinks, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full bg-transparent text-sm text-white placeholder:text-white/20 outline-none border-b border-white/10 pb-1 focus:border-cinematic-neon-red/40 transition-colors" />
                                </div>
                                {/* أزرار الحفظ والحذف */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {hasValue && (
                                        <button type="button" title="حفظ"
                                            onClick={async () => {
                                                try {
                                                    await api.settings.updateSocialLinks({ socialLinks: socialLinks as any });
                                                    setMessage({ type: 'success', text: isRTL ? `✅ تم حفظ ${field.label}` : `✅ ${field.label} saved` });
                                                    setTimeout(() => setMessage({ type: EMPTY_STRING, text: EMPTY_STRING }), 2000);
                                                } catch { setMessage({ type: 'error', text: isRTL ? 'فشل الحفظ' : 'Save failed' }); }
                                            }}
                                            className="px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                            {isRTL ? rawText('حفظ') : rawText('Save')}
                                        </button>
                                    )}
                                    <button type="button" title="حذف"
                                        onClick={async () => {
                                            const updated = { ...socialLinks, [field.key]: EMPTY_STRING };
                                            onLinkChange(updated as SocialLinks);
                                            try {
                                                await api.settings.updateSocialLinks({ socialLinks: updated as any });
                                                setMessage({ type: 'success', text: isRTL ? `🗑️ تم حذف ${field.label}` : `🗑️ ${field.label} removed` });
                                                setTimeout(() => setMessage({ type: EMPTY_STRING, text: EMPTY_STRING }), 2000);
                                            } catch { setMessage({ type: 'error', text: isRTL ? 'فشل الحذف' : 'Delete failed' }); }
                                        }}
                                        className="px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                                        {isRTL ? rawText('حذف') : rawText('Del')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ جميع الروابط' : 'Save All Links'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب معلومات الاتصال
// ─────────────────────────────────
export function ContactTab({ contactInfo, loading, isRTL, onSave, onSilentSave, onContactChange }: {
    contactInfo: ContactInfo; loading: boolean; isRTL: boolean;
    onSave: () => void; onSilentSave: () => void;
    onContactChange: (info: ContactInfo) => void;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Phone className="w-5 h-5 text-cinematic-neon-red" />
                    {isRTL ? rawText('معلومات الاتصال') : rawText('Contact Information')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* رقم الهاتف */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> {isRTL ? rawText('رقم الهاتف') : rawText('Phone Number')}
                        </label>
                        <input type="tel" value={contactInfo.phone}
                            onChange={e => onContactChange({ ...contactInfo, phone: e.target.value })}
                            onBlur={onSilentSave} placeholder="+966XXXXXXXXX"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* البريد الإلكتروني */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> {isRTL ? rawText('البريد الإلكتروني') : rawText('Email')}
                        </label>
                        <input type="email" value={contactInfo.email}
                            onChange={e => onContactChange({ ...contactInfo, email: e.target.value })}
                            onBlur={onSilentSave} placeholder="info@hmcar.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* العنوان */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> {isRTL ? rawText('العنوان') : rawText('Address')}
                        </label>
                        <input type="text" value={contactInfo.address}
                            onChange={e => onContactChange({ ...contactInfo, address: e.target.value })}
                            onBlur={onSilentSave} placeholder={isRTL ? 'المملكة العربية السعودية، الرياض' : 'Riyadh, Saudi Arabia'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* ساعات العمل */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {isRTL ? rawText('ساعات العمل') : rawText('Working Hours')}
                        </label>
                        <input type="text" value={contactInfo.workingHours}
                            onChange={e => onContactChange({ ...contactInfo, workingHours: e.target.value })}
                            onBlur={onSilentSave} placeholder={isRTL ? 'السبت - الخميس: 9 صباحاً - 9 مساءً' : 'Sat - Thu: 9AM - 9PM'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ المعلومات' : 'Save Info'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب إعدادات العملة
// ─────────────────────────────────
export function CurrencyTab({ currencySettings, loading, isRTL, onSave, onSilentSave, onCurrencyChange }: {
    currencySettings: CurrencySettings; loading: boolean; isRTL: boolean;
    onSave: () => void; onSilentSave: () => void;
    onCurrencyChange: (settings: CurrencySettings) => void;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-cinematic-neon-red" />
                    {isRTL ? rawText('إعدادات العملة والصرف') : rawText('Currency & Exchange Settings')}
                </h2>
                <p className="text-sm text-white/40 mb-8">
                    {isRTL ? rawText('قم بتعيين أسعار الصرف لتحويل الأسعار تلقائياً بين العملات') : rawText('Set exchange rates for automatic price conversion between currencies')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* سعر صرف الدولار مقابل الريال */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? rawText('سعر صرف الدولار (1 USD = ? SAR)') : rawText('USD Exchange Rate (1 USD = ? SAR)')}
                        </label>
                        <input type="number" step="0.01" value={currencySettings.usdToSar}
                            title={isRTL ? 'سعر صرف الدولار مقابل الريال' : 'USD to SAR Exchange Rate'}
                            onChange={e => onCurrencyChange({ ...currencySettings, usdToSar: parseFloat(e.target.value) || 0 })}
                            onBlur={onSilentSave}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* العملة النشطة للعرض */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? rawText('العملة النشطة للعرض') : rawText('Active Display Currency')}
                        </label>
                        <select title="العملة النشطة" value={currencySettings.activeCurrency}
                            onChange={e => onCurrencyChange({ ...currencySettings, activeCurrency: e.target.value })}
                            onBlur={onSilentSave}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40 appearance-none cursor-pointer">
                            <option value="SAR" className="bg-black">{rawText('SAR (ريال سعودي)')}</option>
                            <option value="USD" className="bg-black">{rawText('USD (دولار أمريكي)')}</option>
                            <option value="KRW" className="bg-black">{rawText('KRW (وون كوري)')}</option>
                        </select>
                    </div>
                    {/* سعر صرف الدولار مقابل الوون الكوري */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? rawText('سعر صرف الدولار مقابل الوون الكوري (1 USD = ? KRW)') : rawText('USD to KRW Exchange Rate (1 USD = ? KRW)')}
                        </label>
                        <input type="number" step="1" value={currencySettings.usdToKrw}
                            title={isRTL ? 'سعر صرف الدولار مقابل الوون الكوري' : 'USD to KRW Exchange Rate'}
                            onChange={e => onCurrencyChange({ ...currencySettings, usdToKrw: parseFloat(e.target.value) || 0 })}
                            onBlur={onSilentSave}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* معامل ضرب أسعار قطع الغيار */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? rawText('معامل السعر (قطع الغيار)') : rawText('Parts Multiplier')}
                        </label>
                        <input type="number" step="0.01" value={currencySettings.partsMultiplier || 1.15}
                            title={isRTL ? 'معامل ضرب أسعار قطع الغيار' : 'Parts Price Multiplier'}
                            onChange={e => onCurrencyChange({ ...currencySettings, partsMultiplier: parseFloat(e.target.value) || 1 })}
                            onBlur={onSilentSave}
                            className="w-full bg-white/5 border border-[#c9a96e]/20 rounded-xl py-4 px-4 text-sm text-[#c9a96e] focus:outline-none focus:border-[#c9a96e]/40" />
                        <span className="text-[8px] text-white/20 mt-1 block tracking-wider uppercase"> {isRTL ? 'يضرب في السعر الأساسي للقطع' : 'MULTIPLIER FOR PARTS BASE PRICE'} </span>
                    </div>
                    {/* معامل ضرب أسعار المزادات */}
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">
                            {isRTL ? rawText('معامل السعر (المزادات)') : rawText('Auction Multiplier')}
                        </label>
                        <input type="number" step="0.01" value={currencySettings.auctionMultiplier || 1.1}
                            title={isRTL ? 'معامل ضرب أسعار المزادات' : 'Auction Price Multiplier'}
                            onChange={e => onCurrencyChange({ ...currencySettings, auctionMultiplier: parseFloat(e.target.value) || 1 })}
                            onBlur={onSilentSave}
                            className="w-full bg-white/5 border border-cinematic-neon-blue/20 rounded-xl py-4 px-4 text-sm text-cinematic-neon-blue focus:outline-none focus:border-cinematic-neon-blue/40" />
                        <span className="text-[8px] text-white/20 mt-1 block tracking-wider uppercase"> {isRTL ? 'يضاف كنسبة أو يضرب في سعر المزاد' : 'MULTIPLIER FOR AUCTION FINAL PRICES'} </span>
                    </div>
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ إعدادات العملة' : 'Save Currency Settings'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب هوية الموقع
// ─────────────────────────────────
export function SiteTab({ siteInfo, loading, isRTL, onSave, onSilentSave, onSiteChange, onLogoUpload }: {
    siteInfo: SiteInfo; loading: boolean; isRTL: boolean;
    onSave: () => void; onSilentSave: () => void;
    onSiteChange: (info: SiteInfo) => void;
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <Camera className="w-5 h-5 text-cinematic-neon-red" />
                    {isRTL ? rawText('هوية الشعار والموقع') : rawText('Site Identity & Logo')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* رفع الشعار */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                            {isRTL ? rawText('شعار الموقع') : rawText('Site Logo')}
                        </label>
                        <div className="relative group">
                            <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                                {siteInfo.logoUrl ? (
                                    <NextImage src={siteInfo.logoUrl} alt="شعار الموقع" fill className="max-h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <Camera className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                        <span className="text-[10px] text-white/20 font-bold uppercase">{isRTL ? rawText('بدون شعار') : rawText('No Logo')}</span>
                                    </div>
                                )}
                                {/* منطقة الرفع التي تظهر عند الهوفر */}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <input type="file" title="رفع شعار جديد" className="hidden" accept="image/*"
                                        onChange={e => { onLogoUpload(e); onSilentSave(); }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? rawText('تغيير الشعار') : rawText('CHANGE LOGO')}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* معلومات الموقع النصية */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{isRTL ? rawText('اسم الموقع') : rawText('Site Name')}</label>
                            <input type="text" title="اسم الموقع" value={siteInfo.siteName}
                                onChange={e => onSiteChange({ ...siteInfo, siteName: e.target.value })}
                                onBlur={onSilentSave}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{isRTL ? rawText('وصف الموقع') : rawText('Site Description')}</label>
                            <textarea title="وصف الموقع" value={siteInfo.siteDescription} rows={4}
                                onChange={e => onSiteChange({ ...siteInfo, siteDescription: e.target.value })}
                                onBlur={onSilentSave}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40 resize-none" />
                        </div>
                    </div>
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ هوية الموقع' : 'Save Site Identity'} onClick={onSave} white />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب محتوى الصفحة الرئيسية
// ─────────────────────────────────
export function HomeTab({ homeContent, loading, isRTL, onSave, onSilentSave, onHomeChange }: {
    homeContent: HomeContent; loading: boolean; isRTL: boolean;
    onSave: () => void; onSilentSave: () => void;
    onHomeChange: (content: HomeContent) => void;
}) {
    // Helper for toggles
    const handleToggle = (key: keyof HomeContent) => {
        onHomeChange({ ...homeContent, [key]: !(homeContent[key] ?? true) });
        // Auto-save the toggle
        setTimeout(() => onSilentSave(), 500);
    };

    const sections = [
        { key: 'showSearchSection', labelAr: 'قسم البحث السريع', labelEn: 'Quick Search Section' },
        { key: 'showLiveMarket', labelAr: 'المعرض المباشر (السيارات المضافة)', labelEn: 'Live Showroom (Added Cars)' },
        { key: 'showTrustHub', labelAr: 'إحصائيات المنصة', labelEn: 'Platform Statistics' },
        { key: 'showAdvertising', labelAr: 'المساحة الإعلانية', labelEn: 'Advertising Space' },
        { key: 'showBuyingJourney', labelAr: 'منظومة الشراء (خطوات)', labelEn: 'Buying Journey Steps' },
        { key: 'showPlatformFeatures', labelAr: 'مميزات المنصة (لماذا نحن)', labelEn: 'Platform Features' },
        { key: 'showBrandCatalog', labelAr: 'دليل الماركات', labelEn: 'Brand Catalog' },
        { key: 'showTrustedBy', labelAr: 'شركاء النخبة', labelEn: 'Trusted Partners' },
        { key: 'showTestimonials', labelAr: 'آراء العملاء', labelEn: 'Testimonials' },
        { key: 'showAppConversion', labelAr: 'ترويج التطبيق', labelEn: 'App Promotion' },
        { key: 'showFAQ', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ Section' }
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5 text-cinematic-neon-red" />
                    {isRTL ? rawText('محتوى الصفحة الرئيسية') : rawText('Home Page Content')}
                </h2>
                <div className="space-y-6">
                    {/* العنوان الرئيسي */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{isRTL ? rawText('عنوان البطولة (Hero Title)') : rawText('Hero Title')}</label>
                        <input type="text" title="Hero Title" value={homeContent?.heroTitle || ''}
                            onChange={e => onHomeChange({ ...homeContent, heroTitle: e.target.value })}
                            onBlur={onSilentSave} placeholder={isRTL ? 'أدخل العنوان الرئيسي...' : 'Enter main title...'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* العنوان الفرعي */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{isRTL ? rawText('العنوان الفرعي') : rawText('Hero Subtitle')}</label>
                        <input type="text" title="Hero Subtitle" value={homeContent?.heroSubtitle || ''}
                            onChange={e => onHomeChange({ ...homeContent, heroSubtitle: e.target.value })}
                            onBlur={onSilentSave} placeholder={isRTL ? 'أدخل العنوان الفرعي...' : 'Enter subtitle...'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    {/* رابط الفيديو */}
                    <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{isRTL ? rawText('رابط الفيديو (Hero Video URL)') : rawText('Hero Video URL')}</label>
                        <input type="text" title="Hero Video URL" value={homeContent?.heroVideoUrl || ''}
                            onChange={e => onHomeChange({ ...homeContent, heroVideoUrl: e.target.value })}
                            onBlur={onSilentSave} placeholder="/videos/hero.mp4"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40" />
                    </div>
                    
                    {/* مصدر السيارات المميزة في الصفحة الرئيسية */}
                    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <label className="text-[10px] font-black text-[#c9a96e] uppercase tracking-widest block">
                            {isRTL ? rawText('مصدر عرض السيارات المميزة (تحت أزرار Hero)') : rawText('Homepage Featured Cars Source')}
                        </label>
                        <div className="flex gap-2">
                            {(['showroom', 'auctions'] as const).map(source => (
                                <button
                                    key={source}
                                    type="button"
                                    onClick={() => {
                                        onHomeChange({ ...homeContent, featuredCarsSource: source });
                                        setTimeout(() => onSilentSave(), 200);
                                    }}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border",
                                        (homeContent?.featuredCarsSource || 'showroom') === source
                                            ? "bg-[#c9a96e] text-black border-[#c9a96e]"
                                            : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {source === 'showroom'
                                        ? (isRTL ? 'سيارات المعرض (Showroom)' : 'Showroom Cars')
                                        : (isRTL ? 'المزادات الحية (Live Auctions)' : 'Live Auctions')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="mt-10 pt-8 border-t border-white/10">
                    <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                        {isRTL ? rawText('التحكم بظهور الأقسام') : rawText('Section Visibility Controls')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sections.map(section => {
                            const isVisible = homeContent?.[section.key as keyof HomeContent] ?? true;
                            return (
                                <div key={section.key} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                                        {isRTL ? section.labelAr : section.labelEn}
                                    </span>
                                    <button 
                                        type="button"
                                        title={isRTL ? section.labelAr : section.labelEn}
                                        onClick={() => handleToggle(section.key as keyof HomeContent)}
                                        className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isVisible ? "bg-green-500/80" : "bg-white/20"}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${isVisible ? (isRTL ? "-translate-x-4" : "translate-x-4") : "translate-x-0"}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ محتوى الصفحة' : 'Save Home Content'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب "لماذا تختارنا"
// ─────────────────────────────────
export function FeaturesTab({ features, loading, isRTL, onSave, onFeaturesChange }: {
    features: Feature[]; loading: boolean; isRTL: boolean;
    onSave: () => void;
    onFeaturesChange: (features: Feature[]) => void;
}) {
    // تحديث حقل واحد في ميزة محددة
    const updateFeature = (idx: number, field: string, value: string) => {
        const updated = [...features];
        updated[idx][field] = value;
        onFeaturesChange(updated);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black uppercase tracking-wider flex items-center gap-3">
                        <Shield className="w-5 h-5 text-cinematic-neon-red" />
                        {isRTL ? rawText('لماذا تختارنا') : rawText('Why Choose Us')}
                    </h2>
                    {/* زر إضافة ميزة جديدة */}
                    <button onClick={() => onFeaturesChange([...features, { icon: 'Star', title: '', desc: '' }])}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        {isRTL ? rawText('+ إضافة ميزة') : rawText('+ ADD FEATURE')}
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    {features.map((feature, idx) => (
                        <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-2xl relative group">
                            {/* زر حذف الميزة */}
                            <button onClick={() => onFeaturesChange(features.filter((_, i) => i !== idx))}
                                className="absolute top-4 right-4 text-white/20 hover:text-cinematic-neon-red transition-colors">
                                {rawText('✕')}
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* اسم الأيقونة */}
                                <div>
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">{rawText('Icon Name (Lucide)')}</label>
                                    <input type="text" value={feature.icon}
                                        onChange={e => updateFeature(idx, 'icon', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white"
                                        placeholder="e.g. Shield, Star, Zap" />
                                </div>
                                {/* العنوان */}
                                <div>
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">{rawText('Title')}</label>
                                    <input type="text" value={feature.title}
                                        onChange={e => updateFeature(idx, 'title', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white"
                                        placeholder="Feature Title" />
                                </div>
                                {/* الوصف */}
                                <div>
                                    <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 block">{rawText('Description')}</label>
                                    <input type="text" value={feature.desc}
                                        onChange={e => updateFeature(idx, 'desc', e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-xs text-white"
                                        placeholder="Feature Description" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'حفظ المميزات' : 'Save Features'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// تبويب التسويق والتتبع (Marketing Pixels)
// ─────────────────────────────────
export function MarketingTab({ marketingPixels = { googleAnalyticsId: '', metaPixelId: '', snapchatPixelId: '', tiktokPixelId: '' }, loading, isRTL, onSave, onSilentSave, onMarketingChange }: {
    marketingPixels: any; loading: boolean; isRTL: boolean;
    onSave: () => void; onSilentSave: () => void;
    onMarketingChange: (info: any) => void;
}) {
    const pixels = marketingPixels || { googleAnalyticsId: '', metaPixelId: '', snapchatPixelId: '', tiktokPixelId: '' };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='space-y-6 pb-10'>
            <div className='p-8 bg-white/2 border border-white/5 rounded-3xl'>
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-cinematic-neon-red/10 flex items-center justify-center">
                        <Globe className='w-6 h-6 text-cinematic-neon-red' />
                    </div>
                    <div>
                        <h2 className='text-lg font-black uppercase tracking-wider text-white'>
                            {isRTL ? 'إعدادات التتبع التسويقي (SaaS Pixels)' : 'SaaS Marketing Pixels'}
                        </h2>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            {isRTL 
                                ? 'هذا التبويب مخصص لإدارة أكواد التتبع لكل عميل بشكل منفصل.' 
                                : 'Manage tracking pixels for each showroom / tenant independently.'}
                        </p>
                    </div>
                 </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <div className="space-y-3">
                        <label className='text-[10px] font-bold text-white/40 uppercase tracking-widest block flex items-center gap-2'>
                            <Globe className="w-3 h-3 text-emerald-400" />
                            Google Analytics 4 (GA4)
                        </label>
                        <input type='text' value={pixels.googleAnalyticsId || ''} 
                            placeholder='G-XXXXXXXXXX' 
                            onChange={e => onMarketingChange({ ...pixels, googleAnalyticsId: e.target.value })} 
                            onBlur={onSilentSave} 
                            className='w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-emerald-500/40' />
                        <p className="text-[8px] text-emerald-400/40 uppercase tracking-tighter">Enter your G- identifier for Google Traffic tracking</p>
                    </div>
                    <div className="space-y-3">
                        <label className='text-[10px] font-bold text-white/40 uppercase tracking-widest block flex items-center gap-2'>
                            <Globe className="w-3 h-3 text-blue-500" />
                            Meta (Facebook/Instagram) Pixel
                        </label>
                        <input type='text' value={pixels.metaPixelId || ''} 
                            placeholder='XXXXXXXXXXXXXXX' 
                            onChange={e => onMarketingChange({ ...pixels, metaPixelId: e.target.value })} 
                            onBlur={onSilentSave} 
                            className='w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-blue-500/40 text-blue-100' />
                        <p className="text-[8px] text-blue-500/40 uppercase tracking-tighter">FOR TRACKING CONVERSIONS FROM SOCIAL ADS</p>
                    </div>
                    <div className="space-y-3">
                        <label className='text-[10px] font-bold text-white/40 uppercase tracking-widest block flex items-center gap-2'>
                            <Globe className="w-3 h-3 text-yellow-400" />
                            Snapchat Pixel
                        </label>
                        <input type='text' value={pixels.snapchatPixelId || ''} 
                            placeholder='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' 
                            onChange={e => onMarketingChange({ ...pixels, snapchatPixelId: e.target.value })} 
                            onBlur={onSilentSave} 
                            className='w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-yellow-400/40' />
                            <p className="text-[8px] text-yellow-400/40 uppercase tracking-tighter">Enter your full snap pixel ID (UUID format)</p>
                    </div>
                    <div className="space-y-3">
                        <label className='text-[10px] font-bold text-white/40 uppercase tracking-widest block flex items-center gap-2'>
                            <Globe className="w-3 h-3 text-rose-500" />
                            TikTok Pixel
                        </label>
                        <input type='text' value={pixels.tiktokPixelId || ''} 
                            placeholder='CXXXXXXXXXXXXXX' 
                            onChange={e => onMarketingChange({ ...pixels, tiktokPixelId: e.target.value })} 
                            onBlur={onSilentSave} 
                            className='w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-rose-500/40' />
                            <p className="text-[8px] text-rose-500/40 uppercase tracking-tighter">TRACK SALES COMING FROM TIKTOK VIDEOS &amp; ADS</p>
                    </div>
                </div>
            </div>
            <SaveButton loading={loading} isRTL={isRTL} label={isRTL ? 'تفعيل وحفظ أرقام التتبع' : 'ACTIVATE PIXEL TRACKING'} onClick={onSave} />
        </motion.div>
    );
}

// ─────────────────────────────────
// مكوّن زر الحفظ المشترك (لإزالة التكرار)
// ─────────────────────────────────
function SaveButton({ loading, isRTL, label, onClick, white = false }: {
    loading: boolean; isRTL: boolean; label: string; onClick: () => void; white?: boolean;
}) {
    return (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onClick} disabled={loading}
            className={`w-full py-5 font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition-all ${white
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]'
                : 'bg-cinematic-neon-red text-white shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)]'
                }`}>
            <Save className="w-5 h-5" />
            {loading ? (isRTL ? rawText('جاري الحفظ...') : rawText('Saving...')) : label}
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────
// تبويب شعارات الصفحة الرئيسية (Home Brands - Circular Crop)
// ─────────────────────────────────────────────────────────────
interface HomeBrand {
    _id?: string;
    name: string;
    nameAr: string;
    logoUrl: string;
    order: number;
    isActive: boolean;
}

// مكوّن الاقتصاص الدائري للصورة
function CircularCropModal({ imageSrc, onCrop, onClose }: {
    imageSrc: string;
    onCrop: (croppedUrl: string) => void;
    onClose: () => void;
}) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [scale, setScale] = React.useState(1);
    const [offsetX, setOffsetX] = React.useState(0);
    const [offsetY, setOffsetY] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const [startDrag, setStartDrag] = React.useState({ x: 0, y: 0 });

    const SIZE = 280;

    const drawCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, SIZE, SIZE);

        // Draw circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const scaledW = img.naturalWidth * scale;
        const scaledH = img.naturalHeight * scale;
        const drawX = (SIZE - scaledW) / 2 + offsetX;
        const drawY = (SIZE - scaledH) / 2 + offsetY;
        ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        // Overlay circle border
        ctx.beginPath();
        ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(201,169,110,0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }, [scale, offsetX, offsetY]);

    React.useEffect(() => {
        drawCanvas();
    }, [drawCanvas, imageSrc]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setStartDrag({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging) return;
        setOffsetX(e.clientX - startDrag.x);
        setOffsetY(e.clientY - startDrag.y);
    };
    const handleMouseUp = () => setDragging(false);

    const handleCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const croppedUrl = canvas.toDataURL('image/png');
        onCrop(croppedUrl);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-[#0d0d1a] border border-white/10 rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
                <h3 className="text-lg font-black uppercase tracking-widest mb-2 text-center">اقتصاص الشعار</h3>
                <p className="text-[10px] text-white/40 text-center mb-6">اسحب الصورة لتحديد المنطقة — استخدم الشريط لتكبير أو تصغير</p>

                {/* Hidden img for drawing */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={imageSrc} alt="crop source" className="hidden" onLoad={drawCanvas} crossOrigin="anonymous" />

                {/* Canvas دائري */}
                <div className="flex justify-center mb-6">
                    <canvas
                        ref={canvasRef}
                        width={SIZE}
                        height={SIZE}
                        className="rounded-full cursor-move border-4 border-[#C9A96E]/40 shadow-[0_0_30px_rgba(201,169,110,0.2)]"
                        style={{ borderRadius: '50%' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>

                {/* شريط التكبير */}
                <div className="mb-6 px-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block text-center">تكبير / تصغير</label>
                    <input
                        type="range" min="0.1" max="3" step="0.05"
                        value={scale}
                        onChange={e => { setScale(Number(e.target.value)); setTimeout(drawCanvas, 10); }}
                        className="w-full accent-[#C9A96E]"
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        إلغاء
                    </button>
                    <button onClick={handleCrop}
                        className="flex-1 py-3 rounded-xl bg-[#C9A96E] text-black text-xs font-black uppercase tracking-widest hover:bg-[#b8955b] transition-all shadow-lg">
                        ✂ اقتصاص وحفظ
                    </button>
                </div>
            </div>
        </div>
    );
}

export function HomeBrandsTab({ isRTL }: { isRTL: boolean }) {
    const [brands, setBrands] = React.useState<HomeBrand[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: string; text: string }>({ type: '', text: '' });

    // حالة الإضافة/التعديل
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [formName, setFormName] = React.useState('');
    const [formNameAr, setFormNameAr] = React.useState('');
    const [formLogoUrl, setFormLogoUrl] = React.useState('');
    const [showForm, setShowForm] = React.useState(false);

    // حالة الاقتصاص
    const [cropImageSrc, setCropImageSrc] = React.useState<string | null>(null);
    const [pendingCroppedUrl, setPendingCroppedUrl] = React.useState<string>('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const showMsg = (type: string, text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    // جلب الشعارات
    const fetchBrands = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.settings.getHomeBrands();
            if (res?.success) setBrands(res.brands || []);
        } catch {
            showMsg('error', 'فشل في جلب الشعارات');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { fetchBrands(); }, [fetchBrands]);

    // فتح نموذج الإضافة
    const openAddForm = () => {
        setEditingId(null);
        setFormName('');
        setFormNameAr('');
        setFormLogoUrl('');
        setPendingCroppedUrl('');
        setShowForm(true);
    };

    // فتح نموذج التعديل
    const openEditForm = (brand: HomeBrand) => {
        setEditingId(brand._id || null);
        setFormName(brand.name);
        setFormNameAr(brand.nameAr || '');
        setFormLogoUrl(brand.logoUrl || '');
        setPendingCroppedUrl('');
        setShowForm(true);
    };

    // رفع الصورة وفتح نافذة الاقتصاص
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCropImageSrc(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // بعد الاقتصاص: نرفع الصورة المقتوصة للسيرفر
    const handleCropDone = async (croppedDataUrl: string) => {
        setCropImageSrc(null);
        setSaving(true);
        try {
            const res = await api.upload.base64(croppedDataUrl, `home-brand-${Date.now()}.png`);
            if (res?.success && res.url) {
                setFormLogoUrl(res.url);
                setPendingCroppedUrl(res.url);
                showMsg('success', 'تم رفع الشعار بنجاح ✓');
            } else {
                // fallback: use base64 directly
                setFormLogoUrl(croppedDataUrl);
                setPendingCroppedUrl(croppedDataUrl);
            }
        } catch {
            setFormLogoUrl(croppedDataUrl);
            setPendingCroppedUrl(croppedDataUrl);
        } finally {
            setSaving(false);
        }
    };

    // حفظ (إضافة أو تعديل)
    const handleSave = async () => {
        if (!formName.trim()) {
            showMsg('error', 'الاسم الإنجليزي مطلوب');
            return;
        }
        setSaving(true);
        try {
            const logoUrl = pendingCroppedUrl || formLogoUrl;
            if (editingId) {
                await api.settings.updateHomeBrand(editingId, {
                    name: formName,
                    nameAr: formNameAr,
                    logoUrl,
                });
                showMsg('success', 'تم تحديث الشعار بنجاح ✓');
            } else {
                await api.settings.addHomeBrand({
                    name: formName,
                    nameAr: formNameAr,
                    logoUrl,
                    order: brands.length,
                });
                showMsg('success', 'تم إضافة الشعار بنجاح ✓');
            }
            setShowForm(false);
            await fetchBrands();
        } catch {
            showMsg('error', 'فشل في حفظ الشعار');
        } finally {
            setSaving(false);
        }
    };

    // حذف
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل تريد حذف شعار "${name}" من الصفحة الرئيسية؟`)) return;
        try {
            await api.settings.deleteHomeBrand(id);
            showMsg('success', `تم حذف "${name}" بنجاح`);
            await fetchBrands();
        } catch {
            showMsg('error', 'فشل في الحذف');
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
            {/* نافذة الاقتصاص */}
            {cropImageSrc && (
                <CircularCropModal
                    imageSrc={cropImageSrc}
                    onCrop={handleCropDone}
                    onClose={() => setCropImageSrc(null)}
                />
            )}

            <div className="p-8 bg-white/2 border border-white/5 rounded-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/10 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-[#C9A96E]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-white">
                                {isRTL ? 'شعارات الصفحة الرئيسية' : 'Home Page Brand Logos'}
                            </h2>
                            <p className="text-[11px] text-white/40 mt-0.5">
                                {isRTL
                                    ? 'أضف شعارات الماركات التي تظهر في قسم "تصفح بالماركة" في الصفحة الرئيسية'
                                    : 'Manage brand logos shown in the "Browse By Brand" section on homepage'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openAddForm}
                        className="px-5 py-2.5 bg-[#C9A96E] text-black rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#b8955b] transition-all shadow-lg shadow-[#C9A96E]/20 flex items-center gap-2"
                    >
                        <span>+</span>
                        {isRTL ? 'إضافة شعار' : 'Add Brand'}
                    </button>
                </div>

                {/* رسالة النتيجة */}
                {message.text && (
                    <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${
                        message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* نموذج الإضافة/التعديل */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-white/5 border border-[#C9A96E]/20 rounded-2xl"
                    >
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-[#C9A96E]">
                            {editingId ? '✏ تعديل الشعار' : '+ إضافة شعار جديد'}
                        </h3>

                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* الشعار الدائري */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <div
                                    className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-[#C9A96E]/40 shadow-[0_0_20px_rgba(201,169,110,0.2)] overflow-hidden cursor-pointer hover:border-[#C9A96E] transition-all group relative"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {formLogoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formLogoUrl} alt="logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center">
                                            <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                                            <span className="text-[9px] text-gray-400 block mt-1">رفع</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] font-bold text-[#C9A96E]/70 hover:text-[#C9A96E] uppercase tracking-widest transition-colors"
                                >
                                    {isRTL ? 'اختر صورة' : 'Choose Image'}
                                </button>
                            </div>

                            {/* حقول البيانات */}
                            <div className="flex-1 grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                                        {isRTL ? 'اسم الماركة (إنجليزي)*' : 'Brand Name (English)*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        placeholder="e.g. Toyota"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#C9A96E]/40"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                                        {isRTL ? 'اسم الماركة (عربي)' : 'Brand Name (Arabic)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formNameAr}
                                        onChange={e => setFormNameAr(e.target.value)}
                                        placeholder="مثال: تويوتا"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#C9A96E]/40"
                                        dir="rtl"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                                        {isRTL ? 'رابط الشعار (اختياري - بديل عن الرفع)' : 'Logo URL (optional alternative)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formLogoUrl}
                                        onChange={e => setFormLogoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#C9A96E]/40"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                            >
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-[#C9A96E] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#b8955b] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الشعار' : 'Save Brand')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* قائمة الشعارات */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-[#C9A96E]/30 border-t-[#C9A96E] rounded-full animate-spin" />
                    </div>
                ) : brands.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                        <Camera className="w-10 h-10 text-white/20 mx-auto mb-3" />
                        <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
                            {isRTL ? 'لا توجد شعارات. اضغط "إضافة شعار" للبدء.' : 'No brands yet. Click "Add Brand" to start.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {brands.map((brand) => (
                            <motion.div
                                key={brand._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-2 p-4 bg-white/3 border border-white/8 rounded-2xl group hover:border-[#C9A96E]/30 transition-all"
                            >
                                {/* الشعار الدائري */}
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-2 border-[#C9A96E]/30 shadow-md overflow-hidden">
                                    {brand.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-xl font-black text-black">
                                            {(brand.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* الاسم */}
                                <div className="text-center">
                                    <p className="text-[11px] font-black text-white">{isRTL && brand.nameAr ? brand.nameAr : brand.name}</p>
                                    {isRTL && brand.nameAr && <p className="text-[9px] text-white/30">{brand.name}</p>}
                                </div>

                                {/* أزرار الإجراءات */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditForm(brand)}
                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500/30 transition-all"
                                    >
                                        ✏ {isRTL ? 'تعديل' : 'Edit'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(brand._id!, brand.name)}
                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase hover:bg-red-500/30 transition-all"
                                    >
                                        ✕ {isRTL ? 'حذف' : 'Del'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
