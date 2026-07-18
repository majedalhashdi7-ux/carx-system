'use client';

import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface WatermarkImageProps extends Omit<ImageProps, 'className'> {
    className?: string;
    containerClassName?: string;
    showWatermark?: boolean;
    watermarkPosition?: 'br' | 'bl' | 'tr' | 'tl';
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

/**
 * WatermarkImage — يعرض الصورة مع علامة مائية HM CAR
 * يدعم وضع fill (لاستخدامه داخل حاوية positioned) ووضع الصورة العادية
 */
export default function WatermarkImage({
    className,
    containerClassName,
    showWatermark = true,
    watermarkPosition = 'br',
    ...props
}: WatermarkImageProps) {
    /* وضع fill: الحاوية موجودة في المكوّن الأب، نضيف الشارة فقط */
    if (props.fill) {
        return (
            <>
                <Image className={cn('object-cover', className)} {...props} />
                {showWatermark && <WatermarkBadge position={watermarkPosition} />}
            </>
        );
    }

    /* وضع عادي: نلف الصورة بحاوية relative */
    return (
        <div className={cn('relative overflow-hidden', containerClassName)}>
            <Image className={cn('object-cover', className)} {...props} />
            {showWatermark && <WatermarkBadge position={watermarkPosition} />}
        </div>
    );
}
