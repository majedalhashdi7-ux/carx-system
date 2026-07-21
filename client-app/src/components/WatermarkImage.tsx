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
    br: 'bottom-1.5 right-1.5',
    bl: 'bottom-1.5 left-1.5',
    tr: 'top-1.5 right-1.5',
    tl: 'top-1.5 left-1.5',
};

const WatermarkBadge = ({ position }: { position: keyof typeof positionClasses }) => (
    <div
        className={cn(
            'absolute z-20 flex items-center gap-0.5 px-1.5 py-[3px] rounded-md pointer-events-none',
            'bg-black/60 backdrop-blur-[3px] border border-[#C9A96E]/20',
            positionClasses[position]
        )}
    >
        <span
            className="text-[7px] sm:text-[8px] font-black tracking-[0.15em] leading-none select-none"
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
    const [imgSrc, setImgSrc] = useState<any>(src || fallbackSrc);

    useEffect(() => {
        setImgSrc(src || fallbackSrc);
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
