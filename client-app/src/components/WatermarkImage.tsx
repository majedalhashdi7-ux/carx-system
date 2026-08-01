'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface WatermarkImageProps extends Omit<ImageProps, 'className'> {
    className?: string;
    containerClassName?: string;
    showWatermark?: boolean;
    watermarkPosition?: 'br' | 'bl' | 'tr' | 'tl';
    fallbackSrc?: string;
}

const positionClasses = {
    br: 'bottom-2 right-2',
    bl: 'bottom-2 left-2',
    tr: 'top-2 right-2',
    tl: 'top-2 left-2',
};

/** علامة مائية واضحة HM CAR بتصميم احترافي */
const WatermarkBadge = ({ position }: { position: keyof typeof positionClasses }) => (
    <div
        className={cn(
            'absolute z-20 flex items-center gap-1 px-2 py-1 rounded-lg pointer-events-none select-none',
            'bg-black/70 backdrop-blur-sm border border-[#C9A96E]/40 shadow-lg',
            positionClasses[position]
        )}
    >
        {/* نقطة ذهبية */}
        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />
        <span
            className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] leading-none"
            style={{
                background: 'linear-gradient(135deg,#C9A96E 0%,#F5D9A0 55%,#C9A96E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            HM CAR
        </span>
    </div>
);

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';

/**
 * يُحوّل روابط الصور الخارجية (Encar وغيرها) عبر image-proxy الخادم
 * ليضيف علامة HM CAR ويُخفي شعارات المصادر الخارجية
 */
function toProxiedUrl(url: string): string {
    if (!url || typeof url !== 'string') return DEFAULT_FALLBACK;

    // الصور المعالجة مسبقاً أو المحلية - لا تحتاج proxy
    if (
        url.includes('/api/v2/image-proxy') ||
        url.startsWith('/uploads/') ||
        url.startsWith('/public/') ||
        url.includes('res.cloudinary.com')
    ) {
        return url;
    }

    // أي رابط HTTP خارجي → مرره عبر الـ proxy لإضافة الواترمارك
    if (url.startsWith('http')) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v2', '') || '';
        const encoded = encodeURIComponent(url);
        return `${apiBase}/api/v2/image-proxy?url=${encoded}&watermark=true&text=HM%20CAR`;
    }

    return url;
}

export default function WatermarkImage({
    className,
    containerClassName,
    showWatermark = true,
    watermarkPosition = 'br',
    fallbackSrc = DEFAULT_FALLBACK,
    src,
    alt,
    onError,
    ...props
}: WatermarkImageProps) {
    const rawSrc = (src as string) || fallbackSrc;
    const [imgSrc, setImgSrc] = useState<string>(toProxiedUrl(rawSrc));

    useEffect(() => {
        setImgSrc(toProxiedUrl((src as string) || fallbackSrc));
    }, [src, fallbackSrc]);

    const handleError = (e: any) => {
        if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
        }
        if (onError) onError(e);
    };

    if (props.fill) {
        return (
            <>
                <Image
                    className={cn('object-cover', className)}
                    src={imgSrc}
                    alt={alt || 'HM CAR'}
                    onError={handleError}
                    referrerPolicy="no-referrer"
                    unoptimized
                    {...props}
                />
                {showWatermark && <WatermarkBadge position={watermarkPosition} />}
            </>
        );
    }

    return (
        <div className={cn('relative overflow-hidden', containerClassName)}>
            <Image
                className={cn('object-cover', className)}
                src={imgSrc}
                alt={alt || 'HM CAR'}
                onError={handleError}
                referrerPolicy="no-referrer"
                unoptimized
                {...props}
            />
            {showWatermark && <WatermarkBadge position={watermarkPosition} />}
        </div>
    );
}
