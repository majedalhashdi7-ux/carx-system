'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/imageUtils';

interface WatermarkImageProps extends Omit<ImageProps, 'className'> {
    className?: string;
    containerClassName?: string;
    showWatermark?: boolean;
    watermarkPosition?: 'br' | 'bl' | 'tr' | 'tl';
    fallbackSrc?: string;
}

const positionClasses = {
    br: 'bottom-3 right-3',
    bl: 'bottom-3 left-3',
    tr: 'top-3 right-3',
    tl: 'top-3 left-3',
};

/** شارة علامة مائية وتغطية شعارات المصدر الفاخرة لـ HM CAR */
const WatermarkBadgeOverlays = ({ position }: { position: keyof typeof positionClasses }) => (
    <>
        {/* 2. شارة غلاف السفلية اليمنى لتغطية أي كتابات سفلية ومصادر خارجية */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/90 backdrop-blur-md border border-[#C9A96E]/40 shadow-2xl pointer-events-none select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />
            <span
                className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase"
                style={{
                    background: 'linear-gradient(135deg,#C9A96E 0%,#F5D9A0 50%,#C9A96E 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}
            >
                HM SHOWROOM
            </span>
        </div>
    </>
);

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';

function toProxiedUrl(url: string): string {
    if (!url || typeof url !== 'string') return DEFAULT_FALLBACK;
    return normalizeImageUrl(url);
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
            <div className={cn('relative overflow-hidden w-full h-full', containerClassName)}>
                <Image
                    className={cn('object-cover', className)}
                    src={imgSrc}
                    alt={alt || 'HM CAR'}
                    onError={handleError}
                    referrerPolicy="no-referrer"
                    unoptimized
                    {...props}
                />
                {showWatermark && <WatermarkBadgeOverlays position={watermarkPosition} />}
            </div>
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
            {showWatermark && <WatermarkBadgeOverlays position={watermarkPosition} />}
        </div>
    );
}
