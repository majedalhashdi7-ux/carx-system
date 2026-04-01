'use client';

/**
 * صفحة إعدادات CAR X في لوحة التحكم
 * - أرقام التواصل الثلاثة (مبيعات / مزاد / دعم)
 * - إدارة حماية الأجهزة
 * - رفع فيديو الصفحة الرئيسية
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Phone, Shield, Video, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-original';
import { useLanguage } from '@/lib/LanguageContext';

interface CarXSettings {
    salesWhatsapp: string;
    auctionWhatsapp: string;
    supportWhatsapp: string;
    heroVideoUrl: string;
    deviceLockEnabled: boolean;
}

const DEFAULT: CarXSettings = {
    salesWhatsapp: '+967781007805',
    auctionWhatsapp: '+967781007805',
    supportWhatsapp: '+967781007805',
    heroVideoUrl: '/videos/CAR_X.mp4',
    deviceLockEnabled: true,
};

export default function CarXSettingsPage() {
    const { isRTL } = useLanguage();
    const [settings, setSettings] = useState<CarXSettings>(DEFAULT);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // جلب الإعدادات من الباكند
        api.settings.getAll().then((res) => {
            if (res?.success && res.data?.carxSettings) {
                setSettings({ ...DEFAULT, ...res.data.carxSettings });
            }
        }).catch(() => {});
    }, []);

    async function handleSave() {
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const res = await api.settings.updateHomeContent({ homeContent: { carxSettings: settings } as any });
            if (res?.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                setError(isRTL ? 'فشل الحفظ' : 'Save failed');
            }
        } catch {
            setError(isRTL ? 'خطأ في الاتصال' : 'Connection error');
        } finally {
            setSaving(false);
        }
    }

    const Field = ({ label, value, onChange, placeholder }: {
        label: string; value: string; onChange: (v: string) => void; placeholder?: string;
    }) => (
        <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-red-500/60 transition-all"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* الهيدر */}
            <div className="max-w-3xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                            <span className="text-red-400 font-black text-lg">X</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-widest">
                                {isRTL ? 'إعدادات CAR X' : 'CAR X Settings'}
                            </h1>
                            <p className="text-white/30 text-xs font-bold">
                                {isRTL ? 'أرقام التواصل • حماية الأجهزة • الفيديو' : 'Contacts • Device Security • Video'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {/* ── بطاقة أرقام التواصل ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-zinc-900 border border-white/8 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Phone className="w-5 h-5 text-red-400" />
                            <h2 className="text-base font-black uppercase tracking-widest">
                                {isRTL ? 'أرقام التواصل الثلاثة' : 'Three Contact Numbers'}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <Field
                                label={isRTL ? 'رقم المبيعات (شراء سيارة / قطعة غيار)' : 'Sales Number (Car/Parts Purchase)'}
                                value={settings.salesWhatsapp}
                                onChange={(v) => setSettings(s => ({ ...s, salesWhatsapp: v }))}
                                placeholder="+967..."
                            />
                            <Field
                                label={isRTL ? 'رقم المزاد المباشر' : 'Live Auction Number'}
                                value={settings.auctionWhatsapp}
                                onChange={(v) => setSettings(s => ({ ...s, auctionWhatsapp: v }))}
                                placeholder="+967..."
                            />
                            <Field
                                label={isRTL ? 'رقم خدمة العملاء / الدعم' : 'Customer Support Number'}
                                value={settings.supportWhatsapp}
                                onChange={(v) => setSettings(s => ({ ...s, supportWhatsapp: v }))}
                                placeholder="+967..."
                            />
                        </div>
                        <p className="text-white/20 text-xs mt-4 font-bold">
                            {isRTL
                                ? '• رقم المبيعات: يفتح عند ضغط العميل على "شراء الآن"\n• رقم المزاد: يفتح عند الاستفسار عن مزاد\n• رقم الدعم: يفتح في حالة حظر الجهاز'
                                : '• Sales: opens when client taps "Buy Now"\n• Auction: opens when inquiring about an auction\n• Support: opens when device is blocked'}
                        </p>
                    </motion.div>

                    {/* ── بطاقة فيديو الرئيسية ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-zinc-900 border border-white/8 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Video className="w-5 h-5 text-red-400" />
                            <h2 className="text-base font-black uppercase tracking-widest">
                                {isRTL ? 'فيديو الصفحة الرئيسية' : 'Hero Video'}
                            </h2>
                        </div>
                        <Field
                            label={isRTL ? 'رابط الفيديو (المسار أو URL)' : 'Video URL or Path'}
                            value={settings.heroVideoUrl}
                            onChange={(v) => setSettings(s => ({ ...s, heroVideoUrl: v }))}
                            placeholder="/videos/CAR_X.mp4"
                        />
                        <div className="mt-4 p-3 bg-red-950/30 border border-red-900/30 rounded-xl">
                            <p className="text-red-300/70 text-xs font-bold">
                                {isRTL
                                    ? '📁 الفيديو الحالي: /videos/CAR_X.mp4  |  لتغييره: ضع الفيديو في client-app/public/videos/ وادخل اسمه'
                                    : '📁 Current: /videos/CAR_X.mp4  |  To change: place video in client-app/public/videos/ and enter its name'}
                            </p>
                        </div>
                    </motion.div>

                    {/* ── بطاقة حماية الأجهزة ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-zinc-900 border border-white/8 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-5 h-5 text-red-400" />
                            <h2 className="text-base font-black uppercase tracking-widest">
                                {isRTL ? 'حماية الأجهزة' : 'Device Security'}
                            </h2>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm font-black text-white">
                                    {isRTL ? 'تفعيل ربط الحساب بجهاز واحد' : 'One Device Per Account'}
                                </p>
                                <p className="text-white/30 text-xs mt-1 font-medium">
                                    {isRTL
                                        ? 'عند التفعيل: لا يستطيع العميل الدخول من جهاز آخر إلا بعد إلغاء القفل من الآدمن'
                                        : 'When enabled: client cannot login from another device unless admin unlocks it'}
                                </p>
                            </div>
                            <button
                                aria-label="Toggle device lock security"
                                title="Toggle device lock"
                                onClick={() => setSettings(s => ({ ...s, deviceLockEnabled: !s.deviceLockEnabled }))}
                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.deviceLockEnabled ? 'bg-red-600' : 'bg-white/10'}`}
                            >
                                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-300 ${settings.deviceLockEnabled ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-yellow-400/60">
                            <AlertTriangle className="w-3 h-3" />
                            <p className="text-[10px] font-bold">
                                {isRTL
                                    ? 'لإلغاء القفل عن مستخدم: اذهب لصفحة المستخدمين → اضغط اسمه → "إلغاء قفل الجهاز"'
                                    : 'To unlock a user: go to Users page → click name → "Unlock Device"'}
                            </p>
                        </div>
                    </motion.div>

                    {/* ── رسالة الخطأ ── */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-3">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <p className="text-red-300 text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {/* ── زر الحفظ ── */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : saved ? (
                            <><CheckCircle className="w-5 h-5 text-green-300" />{isRTL ? 'تم الحفظ ✓' : 'Saved ✓'}</>
                        ) : (
                            <><Save className="w-5 h-5" />{isRTL ? 'حفظ الإعدادات' : 'Save Settings'}</>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
