'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HMCarLogoProps {
    variant?: 'horizontal' | 'badge' | 'badge-3d' | 'auto';
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

export default function HMCarLogo({
    variant = 'horizontal',
    className = '',
    size = 'md',
    showText = true,
}: HMCarLogoProps) {
    const heightMap = {
        sm: 'h-8 sm:h-9',
        md: 'h-10 sm:h-12',
        lg: 'h-14 sm:h-16',
        xl: 'h-20 sm:h-24',
    };

    if (variant === 'badge' || variant === 'badge-3d') {
        const badgeSrc = variant === 'badge-3d' ? '/images/logo/logo-badge-3d.png' : '/images/logo/logo-badge.png';
        const dimMap = {
            sm: 'w-9 h-9',
            md: 'w-12 h-12',
            lg: 'w-16 h-16',
            xl: 'w-24 h-24',
        };

        return (
            <div className={cn('relative rounded-full overflow-hidden shrink-0 shadow-lg shadow-[#C9A96E]/20 border border-[#C9A96E]/30', dimMap[size], className)}>
                <Image
                    src={badgeSrc}
                    alt="HM CAR Logo"
                    fill
                    className="object-cover"
                    unoptimized
                />
            </div>
        );
    }

    // Default: Horizontal Logo (Golden Crest + HM CAR SOUTH KOREA)
    return (
        <div className={cn('flex items-center gap-2.5 shrink-0 select-none group', className)}>
            <div className={cn('relative aspect-[21/9] shrink-0', heightMap[size])}>
                <Image
                    src="/images/logo/logo-horizontal.png"
                    alt="HM CAR SOUTH KOREA"
                    fill
                    className="object-contain filter drop-shadow-[0_2px_10px_rgba(201,169,110,0.3)] group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    priority
                />
            </div>
        </div>
    );
}
