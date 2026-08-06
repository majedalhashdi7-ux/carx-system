'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, RefreshCw, CheckCircle2, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/lib/ToastContext';

interface QuickImportBarProps {
    type: 'car' | 'part' | 'auction';
    onSuccess: () => void;
    placeholder?: string;
    className?: string;
}

export default function QuickImportBar({ type, onSuccess, placeholder, className = '' }: QuickImportBarProps) {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();

    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);

    const defaultPlaceholders = {
        car: isRTL ? 'ضع رابط سيارة Encar أو رابط خارجي للاستيراد السريع هنا...' : 'Paste Encar or external car URL here for quick import...',
        part: isRTL ? 'ضع رابط قطعة غيار لاستيرادها فوراً...' : 'Paste spare part URL for instant import...',
        auction: isRTL ? 'ضع رابط سيارة لإدراجها في المزاد الفوري المباشر...' : 'Paste car URL to create live auction instantly...'
    };

    const getToken = () => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('hm_token') || localStorage.getItem('carx_token') || localStorage.getItem('token') || '';
    };

    const handleFetch = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
            showToast(isRTL ? 'يرجى وضع رابط صحّيح يبدأ بـ http:// أو https://' : 'Please enter a valid URL starting with http:// or https://', 'error');
            return;
        }

        setLoading(true);
        setPreviewData(null);
        setIsDuplicate(false);

        try {
            const token = getToken();
            const res = await fetch('/api/v2/import/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar'
                },
                body: JSON.stringify({ url: trimmedUrl, type })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setPreviewData(json.data);
                setIsDuplicate(!!json.duplicate);
                showToast(isRTL ? '✨ تم استخراج ومعاينة البيانات بنجاح! راجعها ثم اضغط حفظ' : 'Data extracted successfully! Review and confirm save', 'success');
            } else {
                throw new Error(json.error || json.message || (isRTL ? 'فشل استخراج البيانات من الرابط' : 'Failed to extract data'));
            }
        } catch (err: any) {
            showToast(err.message || 'Import error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSave = async () => {
        if (!previewData) return;
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch('/api/v2/import/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': process.env.NEXT_PUBLIC_TENANT_ID || 'hmcar'
                },
                body: JSON.stringify({
                    type,
                    data: {
                        ...previewData,
                        sourceUrl: url
                    }
                })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                showToast(isRTL ? '🎉 تم الحفظ وإدراج البيانات بنجاح في الصفحة!' : '🎉 Saved & inserted into page!', 'success');
                setUrl('');
                setPreviewData(null);
                onSuccess();
            } else {
                throw new Error(json.error || json.message || (isRTL ? 'فشل حفظ البيانات' : 'Failed to save'));
            }
        } catch (err: any) {
            showToast(err.message || 'Save error', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`w-full space-y-3 ${className}`}>
            {/* شريط الإدخال المباشر في الصفحة */}
            <form onSubmit={handleFetch} className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-[#141625] border border-orange-500/30 hover:border-orange-500/60 transition-all shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-2.5 px-3 text-orange-400">
                    <Link2 className="w-5 h-5 animate-pulse" />
                </div>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={placeholder || defaultPlaceholders[type]}
                    className="flex-1 bg-transparent text-white text-xs sm:text-sm font-medium placeholder-white/40 focus:outline-none py-2"
                />
                {url && (
                    <button type="button" onClick={() => { setUrl(''); setPreviewData(null); }} className="p-1 rounded-full text-white/40 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-orange-500/20 shrink-0"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{isRTL ? 'جاري التجريف...' : 'EXTRACTING...'}</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            <span>{isRTL ? 'استيراد فوراً' : 'IMPORT NOW'}</span>
                        </>
                    )}
                </button>
            </form>

            {/* شريط المعاينة والتأكيد الفوري أسفل الشريط */}
            <AnimatePresence>
                {previewData && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        className="p-4 rounded-2xl bg-[#1b1e33] border border-emerald-500/40 shadow-2xl space-y-3"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span className="font-black text-xs text-emerald-300 uppercase tracking-wider">
                                    {isRTL ? 'معاينة العنصر المستورد قبل الاعتماد النهائي' : 'Imported Item Preview'}
                                </span>
                                {isDuplicate && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                        {isRTL ? 'موجود مسبقاً (سيُحدَّث)' : 'Existing Item (Will Update)'}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setPreviewData(null)} className="p-1 rounded-full text-white/40 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* معاينة الصورة */}
                            <div className="w-24 h-20 rounded-xl overflow-hidden bg-black/50 border border-white/10 relative shrink-0">
                                {(previewData.images?.[0] || previewData.imageUrl || previewData.img) ? (
                                    <img
                                        src={previewData.images?.[0] || previewData.imageUrl || previewData.img}
                                        alt={previewData.title || previewData.name || ''}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/30">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            {/* التفاصيل المستخرجة */}
                            <div className="flex-1 space-y-1 text-center sm:text-start">
                                <h4 className="font-black text-sm text-white line-clamp-1">
                                    {previewData.title || previewData.name || 'عنوان مستورد'}
                                </h4>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono">
                                    {previewData.make && <span className="text-amber-400 font-bold">{previewData.make} {previewData.model}</span>}
                                    {previewData.year && <span className="text-white/60">📅 {previewData.year}</span>}
                                    {previewData.priceSar > 0 && <span className="text-emerald-400 font-bold">💰 {previewData.priceSar?.toLocaleString()} ر.س</span>}
                                    {previewData.priceKrw > 0 && <span className="text-blue-400">₩ {previewData.priceKrw?.toLocaleString()}</span>}
                                </div>
                            </div>

                            {/* زر التأكيد والإضافة المباشرة */}
                            <button
                                onClick={handleConfirmSave}
                                disabled={saving}
                                className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30 shrink-0"
                            >
                                {saving ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>{isRTL ? 'جاري الإدراج...' : 'SAVING...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isRTL ? 'تأكيد وحفظ في الصفحة' : 'CONFIRM & ADD'}</span>
                                        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
