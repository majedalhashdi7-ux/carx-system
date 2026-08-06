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
    variant?: 'gold' | 'white' | 'auto';
    fallbackSrc?: string;
}

const positionClasses = {
    br: 'bottom-3 right-3',
    bl: 'bottom-3 left-3',
    tr: 'top-3 right-3',
    tl: 'top-3 left-3',
};

/** شارة علامة مائية ذكية وشعار HM CAR SOUTH KOREA المتكيف لجميع خلفيات الصور */
const WatermarkBadgeOverlays = ({ 
    position, 
    variant = 'gold' 
}: { 
    position: keyof typeof positionClasses;
    variant?: 'gold' | 'white' | 'auto';
}) => {
    const isWhite = variant === 'white';

    return (
        <>
            {/* العلامة المائية الشفافة الفاخرة HM CAR SOUTH KOREA */}
            <div className={cn(
                "absolute z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md border shadow-2xl pointer-events-none select-none transition-all duration-300",
                positionClasses[position],
                isWhite 
                    ? "bg-black/80 border-white/40 shadow-white/10 text-white" 
                    : "bg-black/90 border-[#C9A96E]/40 shadow-black/80 text-[#C9A96E]"
            )}>
                {/* SVG Logo Icon */}
                <img 
                    src={isWhite ? "/assets/watermark/hmcar-white.svg" : "/assets/watermark/hmcar-gold.svg"} 
                    alt="HM CAR SOUTH KOREA"
                    className="h-4 sm:h-5 w-auto object-contain" 
                />
            </div>
        </>
    );
};

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
                {showWatermark && <WatermarkBadgeOverlays position={watermarkPosition} variant={variant} />}
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
            {showWatermark && <WatermarkBadgeOverlays position={watermarkPosition} variant={variant} />}
        </div>
    );
}
