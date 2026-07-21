'use client';

/**
 * روابط التواصل الاجتماعي (Social Links)
 * يعرض أيقونات تفاعلية لجميع حسابات التواصل الاجتماعي المضافة من قبل المشرف.
 * يدعم فتح الروابط في علامات تبويب جديدة واستخدام صور مخصصة للأيقونات.
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    MessageCircle,
    Instagram,
    Youtube,
    Facebook,
    Linkedin,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-original";

// أيقونات مخصصة
const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg className={className || 'w-5 h-5'} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.029-.06-.045-.135-.045-.209-.015-.24.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface SocialLinksProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    vertical?: boolean;
}

// لا توجد قيم افتراضية - فقط الروابط التي يضيفها الأدمن تظهر
const emptySocialLinks = {
    whatsapp: '',
    instagram: '',
    twitter: '',
    facebook: '',
    youtube: '',
    tiktok: '',
    snapchat: '',
    telegram: '',
    linkedin: ''
};

export default function SocialLinks({
    className,
    size = 'md',
    vertical = false
}: SocialLinksProps) {
    const [socialLinks, setSocialLinks] = useState(emptySocialLinks);

    const loadSocialLinks = async () => {
        try {
            // جلب روابط التواصل الاجتماعي من الإعدادات العامة للموقع
            const response = await api.settings.getPublic();
            if (response.success && response.data.socialLinks) {
                // دمج الروابط المجلوبة مع القائمة الفارغة لضمان وجود جميع الحقول
                setSocialLinks({ ...emptySocialLinks, ...response.data.socialLinks });
            } else {
                setSocialLinks(emptySocialLinks);
            }
        } catch {
            console.error('Failed to load social links');
            setSocialLinks(emptySocialLinks);
        }
    };

    useEffect(() => {
        loadSocialLinks();
    }, []);

    const sizeClasses = {
        sm: 'w-8 h-8 md:w-10 md:h-10',
        md: 'w-10 h-10 md:w-12 md:h-12',
        lg: 'w-12 h-12 md:w-14 md:h-14'
    };

    const iconSizes = {
        sm: 'w-4 h-4 md:w-5 md:h-5',
        md: 'w-5 h-5 md:w-6 md:h-6',
        lg: 'w-6 h-6 md:w-7 md:h-7'
    };

    // نقوم بتعطيل الصور المخصصة للواتساب لتطبيق SVG دائري عصري
    const customIcons: { [key: string]: string } = {
        instagram: '/images/icons/instagram.jpg',
        facebook: '/images/icons/facebook.jpg',
        tiktok: '/images/icons/tiktok.jpg',
    };

    const links = [
        {
            key: 'whatsapp',
            icon: WhatsAppIcon,
            color: 'bg-green-500 hover:bg-green-600 text-white shadow-[0_4px_14px_rgba(37,211,102,0.35)]',
            href: socialLinks.whatsapp ? `https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}` : null,
            label: 'WhatsApp'
        },
        {
            key: 'instagram',
            icon: Instagram,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.instagram,
            label: 'Instagram'
        },
        {
            key: 'twitter',
            icon: XIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.twitter,
            label: 'X'
        },
        {
            key: 'facebook',
            icon: Facebook,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.facebook,
            label: 'Facebook'
        },
        {
            key: 'youtube',
            icon: Youtube,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.youtube,
            label: 'YouTube'
        },
        {
            key: 'tiktok',
            icon: TikTokIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.tiktok,
            label: 'TikTok'
        },
        {
            key: 'snapchat',
            icon: SnapchatIcon,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.snapchat ? `https://snapchat.com/add/${socialLinks.snapchat}` : null,
            label: 'Snapchat'
        },
        {
            key: 'telegram',
            icon: Send,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.telegram,
            label: 'Telegram'
        },
        {
            key: 'linkedin',
            icon: Linkedin,
            color: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
            href: socialLinks.linkedin,
            label: 'LinkedIn'
        }
    ].filter(link => link.href);

    if (links.length === 0) return null;

    return (
        <div className={cn(
            "flex gap-3",
            vertical ? "flex-col" : "flex-row flex-wrap",
            className
        )}>
            {links.map((link, i) => (
                <motion.a
                    key={link.key}
                    href={link.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "flex items-center justify-center rounded-full transition-all shadow-2xl overflow-hidden",
                        sizeClasses[size],
                        link.color
                    )}
                    title={link.label}
                >
                    {/* استخدام الصور المخصصة إذا كانت موجودة، وإلا العودة للأيقونة الافتراضية */}
                    {customIcons[link.key] ? (
                        <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={customIcons[link.key]}
                            alt={link.label}
                            className="w-full h-full object-cover"
                        />
                        </>
                    ) : (
                        <link.icon className={iconSizes[size]} />
                    )}
                </motion.a>
            ))}
        </div>
    );
}

/**
 * الزر العائم للواتساب (WhatsApp Floating Action Button)
 * يظهر في زاوية الشاشة ليتيح للمستخدم التواصل المباشر والسريع مع الدعم الفني.
 */
export function WhatsAppFAB() {
    const [whatsappNumber, setWhatsappNumber] = useState('+967781007805');

    useEffect(() => {
        api.settings.getPublic().then((res: { success: boolean; data: { socialLinks?: { whatsapp?: string } } }) => {
            if (res?.success && res.data.socialLinks?.whatsapp) {
                setWhatsappNumber(res.data.socialLinks.whatsapp);
            }
        }).catch(() => { });
    }, []);

    return (
        <motion.a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.65)] transition-all border border-white/20"
            style={{
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                borderRadius: '50%'
            }}
            aria-label="WhatsApp"
        >
            <WhatsAppIcon className="w-7 h-7 text-white" />
        </motion.a>
    );
}
