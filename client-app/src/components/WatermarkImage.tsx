'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getProxiedImageUrl } from '@/lib/imageUtils';

interface WatermarkImageProps extends Omit<ImageProps, 'className'> {
    className?: string;
    containerClassName?: string;
    showWatermark?: boolean;
    watermarkPosition?: 'br' | 'bl' | 'tr' | 'tl';
    variant?: 'gold' | 'white' | 'auto';
    fallbackSrc?: string;
}

const positionClasses = {
    br: 'bottom-2.5 right-2.5',
    bl: 'bottom-2.5 left-2.5',
    tr: 'top-2.5 right-2.5',
    tl: 'top-2.5 left-2.5',
};

/** شارة علامة مائية شفافة وأنيقة غير حجابة لتفاصيل السيارة */
const WatermarkBadgeOverlays = ({ 
    position, 
    variant = 'gold' 
}: { 
    position: keyof typeof positionClasses;
    variant?: 'gold' | 'white' | 'auto';
}) => {
    const isWhite = variant === 'white';

    return (
        <div className={cn(
            "absolute z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-md pointer-events-none select-none transition-all duration-300 opacity-80 group-hover:opacity-100",
            positionClasses[position],
            isWhite 
                ? "bg-black/35 border-white/20 text-white shadow-black/40" 
                : "bg-black/40 border-[#C9A96E]/30 text-[#C9A96E] shadow-black/50"
        )}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shadow-[0_0_8px_#C9A96E]" />
            <span className="text-[10px] font-black tracking-wider uppercase text-[#C9A96E]">HM CAR</span>
        </div>
    );
};

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000';

function toProxiedUrl(url: string): string {
    if (!url || typeof url !== 'string') return DEFAULT_FALLBACK;
    return getProxiedImageUrl(url);
}

export default function WatermarkImage({
    className,
    containerClassName,
    showWatermark = true,
    watermarkPosition = 'br',
    variant = 'gold',
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
            {showWatermark && <WatermarkBadgeOverlays position={watermarkPosition} variant={variant} />}
        </div>
    );
}
