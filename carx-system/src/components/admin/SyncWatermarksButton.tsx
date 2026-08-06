'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Droplets } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * زر تطبيق العلامة المائية على كل الصور
 * يستدعي POST /api/v2/system/sync-watermarks
 * يُستخدم في صفحة إعدادات Admin
 */
export default function SyncWatermarksButton() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        if (status === 'loading') return;
        const confirm = window.confirm(
            'هل تريد تطبيق العلامة المائية على جميع الصور؟\n\nستعمل العملية في الخلفية وقد تستغرق عدة دقائق حسب حجم البيانات.'
        );
        if (!confirm) return;

        setStatus('loading');
        setMessage('');

        try {
            const res = await api.post('/system/sync-watermarks', {});
            if (res.success) {
                setStatus('success');
                setMessage(res.message || '✅ بدأت عملية المزامنة في الخلفية');
                setTimeout(() => setStatus('idle'), 8000);
            } else {
                throw new Error(res.error || 'فشل بدء العملية');
            }
        } catch (err: unknown) {
            setStatus('error');
            const message = err instanceof Error ? err.message : 'حدث خطأ';
            setMessage(message);
            setTimeout(() => setStatus('idle'), 5000);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                id="sync-watermarks-btn"
                type="button"
                onClick={handleSync}
                disabled={status === 'loading'}
                className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                    ${status === 'loading'
                        ? 'bg-white/10 text-white/40 cursor-not-allowed'
                        : status === 'success'
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : status === 'error'
                                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                                : 'bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/20'
                    }
                `}
            >
                {status === 'loading' ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> جارٍ التشغيل...</>
                ) : status === 'success' ? (
                    <><CheckCircle className="w-3.5 h-3.5" /> تم</>
                ) : status === 'error' ? (
                    <><AlertCircle className="w-3.5 h-3.5" /> خطأ</>
                ) : (
                    <><Droplets className="w-3.5 h-3.5" /> تطبيق الآن</>
                )}
            </button>
            {message && (
                <p className={`text-[10px] max-w-xs text-right ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
