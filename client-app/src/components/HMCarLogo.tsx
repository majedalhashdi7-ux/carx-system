'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HMCarLogoProps {
    variant?: 'horizontal' | 'badge' | 'badge-3d' | 'auto';
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function HMCarLogo({
    variant = 'horizontal',
    className = '',
    size = 'md',
}: HMCarLogoProps) {
    if (variant === 'badge' || variant === 'badge-3d') {
        const badgeSrc = '/images/logo/logo-badge.png';
        const dimMap = {
            sm: 'w-9 h-9',
            md: 'w-11 h-11',
            lg: 'w-16 h-16',
            xl: 'w-24 h-24',
        };

        return (
            <div className={cn('relative rounded-full overflow-hidden shrink-0 shadow-md shadow-[#C9A96E]/20', dimMap[size], className)}>
                <Image
                    src={badgeSrc}
                    alt="HM CAR Badge"
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>
        );
    }

    // Horizontal Logo: Gold crest + crisp white text, 100% transparent background (no box / sticker)
    const dimMap = {
        sm: 'h-10 w-44 sm:h-12 sm:w-52',
        md: 'h-12 w-52 sm:h-14 sm:w-60',
        lg: 'h-14 w-60 sm:h-16 sm:w-72',
        xl: 'h-20 w-80 sm:h-24 sm:w-96',
    };

    return (
        <div className={cn('flex items-center shrink-0 select-none group', className)}>
            <div className={cn('relative shrink-0 flex items-center justify-center overflow-visible', dimMap[size])}>
                <Image
                    src="/images/logo/logo-horizontal.png"
                    alt="HM CAR SOUTH KOREA"
                    fill
                    className="object-contain mix-blend-screen invert group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    priority
                />
            </div>
        </div>
    );
}
