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
        const badgeSrc = variant === 'badge-3d' ? '/images/logo/logo-badge-3d.png' : '/images/logo/logo-badge.png';
        const dimMap = {
            sm: 'w-8 h-8',
            md: 'w-10 h-10',
            lg: 'w-14 h-14',
            xl: 'w-20 h-20',
        };

        return (
            <div className={cn('relative rounded-full overflow-hidden shrink-0 shadow-lg shadow-[#C9A96E]/20 border border-[#C9A96E]/30', dimMap[size], className)}>
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

    // Default: Horizontal Gold Crest & Text Logo (Transparent blending seamlessly into page)
    const dimMap = {
        sm: 'h-8 w-32 sm:h-9 sm:w-36',
        md: 'h-9 w-36 sm:h-11 sm:w-44',
        lg: 'h-12 w-48 sm:h-14 sm:w-56',
        xl: 'h-16 w-64 sm:h-20 sm:w-80',
    };

    return (
        <div className={cn('flex items-center shrink-0 select-none group', className)}>
            <div className={cn('relative shrink-0', dimMap[size])}>
                <Image
                    src="/images/logo/logo-horizontal.png"
                    alt="HM CAR SOUTH KOREA"
                    fill
                    className="object-contain filter drop-shadow-[0_2px_12px_rgba(201,169,110,0.4)] group-hover:scale-105 transition-transform duration-300 mix-blend-lighten"
                    unoptimized
                    priority
                />
            </div>
        </div>
    );
}
