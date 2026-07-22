'use client';

/**
 * مكوّن بطاقة السيارة - CarCard
 * يعرض معلومات سيارة واحدة في شبكة إدارة السيارات
 * يشمل: الصورة، الاسم، السعر، وأزرار الإجراءات (تعديل، بيع، حذف)
 */

import { motion } from 'framer-motion';
import { Edit, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { getBrandDisplayName, formatCarTitle } from '@/lib/brandTranslations';

// ── نوع بيانات السيارة ──
interface Car {
    id: string;
    title: string;
    make: string | { name: string };
    model: string;
    year: number;
    price: number;
    category: string;
    images: string[];
    isActive: boolean;
    isSold: boolean;
    displayCurrency?: string;
}

interface CarCardProps {
    car: Car;
    index: number;
    usdToSar: number;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onEdit: (car: Car) => void;
    onDelete: (id: string) => void;
    onMarkSold: (id: string, title: string) => void;
    onToggleActive?: (id: string, current: boolean) => void;
}

export default function CarCard({ car, index, usdToSar, isSelected, onToggleSelect, onEdit, onDelete, onMarkSold, onToggleActive }: CarCardProps) {
    const { isRTL } = useLanguage();

    // استخراج وترجمة اسم الماركة وعنوان السيارة حسب اللغة المحددة (عربي / إنجليزي)
    const rawMake = typeof car.make === 'object' ? (car.make as any)?.name || '' : (car.make || '');
    const displayMake = getBrandDisplayName(rawMake, isRTL);
    const displayTitle = formatCarTitle(car.title || `${rawMake} ${car.model} ${car.year}`, rawMake, isRTL);

    // عرض السعر حسب عملة العرض المختارة
    const displayPrice = car.displayCurrency === 'USD'
        ? `${((car.price || 0) / usdToSar).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`
        : `${Number(car.price || 0).toLocaleString()} SAR`;

    // معالجة رابط الصورة لإصلاح الروابط الكورية وتمريرها عبر Proxy لمنع 403
    const getImageUrl = (url: string | undefined): string => {
        if (!url) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
        
        // إزالة التكرار في الرابط
        if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
            url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        }
        
        // إصلاح الروابط التي تنتهي بـ _
        if (url.endsWith('_')) {
            if (url.startsWith('http')) {
                url = `${url}001.jpg`;
            } else {
                url = `https://ci.encar.com${url}001.jpg`;
            }
        }
        
        // إضافة النطاق إذا كان الرابط نسبي
        if (url.startsWith('/carpicture')) {
            url = `https://ci.encar.com${url}`;
        } else if (url.startsWith('/') && !url.startsWith('http')) {
            url = `https://ci.encar.com/carpicture${url}`;
        }
        
        // تمرير الصور الكورية عبر proxy لمنع حظر Vercel (403 Forbidden)
        if (url.includes('encar.com') || url.includes('encar.co.kr')) {
            return `/api/v2/image-proxy?url=${encodeURIComponent(url)}`;
        }

        return url;
    };

    const imageUrl = getImageUrl(car.images?.[0]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className={cn(
                "ck-card overflow-hidden group ck-hover-lift relative transition-all",
                isSelected && "border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] bg-orange-500/5"
            )}
        >
            {/* ── صورة السيارة ── */}
            <div className="relative h-52 overflow-hidden bg-zinc-900">
                {/* مربع الاختيار للتحديد المباشر */}
                {onToggleSelect && (
                    <div className="absolute top-3 start-3 z-30" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={() => onToggleSelect(car.id)}
                            className="w-5 h-5 rounded border-white/30 bg-black/70 text-orange-500 focus:ring-orange-500 cursor-pointer accent-orange-500 shadow-md"
                        />
                    </div>
                )}

                <Image
                    src={imageUrl}
                    alt={car.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={70}
                    priority={index < 3}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                    unoptimized
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
                    }}
                />
                {/* تدرج سفلي لتحسين قراءة النص */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-transparent to-transparent" />

                {/* شارة الحالة (نشط / مباع / معطل) */}
                <div className="absolute top-3 end-3">
                    {car.isSold ? (
                        <span className="ck-badge ck-badge-active">✓ {isRTL ? 'مباع' : 'SOLD'}</span>
                    ) : !car.isActive ? (
                        <span className="ck-badge ck-badge-danger">{isRTL ? 'معطل' : 'OFF'}</span>
                    ) : (
                        <span className="ck-badge ck-badge-live ck-badge-active">{isRTL ? 'نشط' : 'LIVE'}</span>
                    )}
                </div>
            </div>

            {/* ── تفاصيل السيارة وأزرار الإجراءات ── */}
            <div className="p-5 space-y-4">
                <div>
                    {/* اسم الماركة واسم السيارة المترجم بحسب اللغة */}
                    <p className="cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.2em] mb-1">
                        {displayMake}
                    </p>
                    <h3 className="text-base font-bold text-white truncate" title={displayTitle}>{displayTitle}</h3>
                </div>

                {/* السعر وأزرار الإجراءات */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    {/* السعر */}
                    <div>
                        <p className="cockpit-mono text-[8px] text-white/25 uppercase mb-0.5">PRICE</p>
                        <p className="cockpit-num text-xl font-black text-orange-400">{displayPrice}</p>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-1.5">
                        {/* زر التعديل */}
                        <button
                            onClick={() => onEdit(car)}
                            title={isRTL ? 'تعديل' : 'Edit'}
                            className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* زر العرض/الإخفاء (Toggle Active) */}
                        <button
                            onClick={() => onToggleActive && onToggleActive(car.id, car.isActive)}
                            title={car.isActive ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                            className={car.isActive
                                ? "w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                                : "w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center"
                            }
                        >
                            {car.isActive ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 opacity-50" />}
                        </button>

                        {/* زر تسجيل البيع - يظهر فقط إذا لم تُباع بعد */}
                        {!car.isSold && (
                            <button
                                onClick={() => onMarkSold(car.id, car.title)}
                                title={isRTL ? 'تم البيع' : 'Mark Sold'}
                                className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* زر الحذف */}
                        <button
                            onClick={() => onDelete(car.id)}
                            title={isRTL ? 'حذف' : 'Delete'}
                            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
