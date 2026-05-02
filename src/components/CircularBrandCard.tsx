'use client';

/**
 * CircularBrandCard - بطاقة الوكالة الدائرية الإبداعية
 * تصميم دائري مذهل مع تأثيرات متقدمة وشعارات واضحة
 */

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Building2, Car, ArrowRight, Star, Crown, Gem, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import Image from "next/image";

interface CircularBrandCardProps {
    brand: {
        id: string;
        key: string;
        name: string;
        nameAr?: string;
        logo?: string;
        description?: string;
        descriptionAr?: string;
        carCount?: number;
        isActive?: boolean;
    };
    index: number;
    onClick?: () => void;
}

export default function CircularBrandCard({ brand, index, onClick }: CircularBrandCardProps) {
    const { isRTL } = useLanguage();
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Motion values للتأثيرات ثلاثية الأبعاد
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.1);
        y.set((e.clientY - centerY) * 0.1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const displayName = isRTL ? (brand.nameAr || brand.name) : brand.name;
    const displayDescription = isRTL ? (brand.descriptionAr || brand.description) : brand.description;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
            }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            className="group relative perspective-1000"
        >
            <Link href={`/brands/${brand.key}`}>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/80 via-black to-gray-900/80 border border-white/10 hover:border-amber-500/40 transition-all duration-700 cursor-pointer shadow-2xl hover:shadow-amber-500/20 p-8">
                    
                    {/* خلفية هولوجرافية متحركة */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 animate-pulse" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.15)_0%,transparent_70%)] animate-pulse" />
                    </div>

                    {/* شبكة نيون متحركة */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.1)_1px,transparent_1px)] bg-[size:25px_25px] animate-pulse" />
                    </div>

                    {/* جسيمات متحركة */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-amber-400 rounded-full"
                                style={{
                                    left: `${20 + i * 10}%`,
                                    top: `${20 + i * 8}%`,
                                }}
                                animate={{
                                    y: [-10, -30, -10],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                }}
                            />
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        
                        {/* الشعار الدائري الكبير */}
                        <div className="relative">
                            {/* الحلقات المتوهجة الخارجية */}
                            <div className="absolute inset-0 rounded-full">
                                {/* الحلقة الأولى */}
                                <div className="absolute inset-0 rounded-full border-2 border-amber-500/0 group-hover:border-amber-500/30 transition-all duration-700 scale-110 animate-pulse" />
                                {/* الحلقة الثانية */}
                                <div className="absolute inset-0 rounded-full border border-amber-500/0 group-hover:border-amber-500/20 transition-all duration-1000 scale-125 animate-pulse" 
                                     style={{ animationDelay: '0.5s' }} />
                                {/* الحلقة الثالثة */}
                                <div className="absolute inset-0 rounded-full border border-amber-500/0 group-hover:border-amber-500/10 transition-all duration-1200 scale-140 animate-pulse" 
                                     style={{ animationDelay: '1s' }} />
                            </div>

                            {/* التوهج الخلفي */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-150" />
                            
                            {/* الشعار الرئيسي */}
                            <motion.div 
                                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-3 border-white/20 group-hover:border-amber-500/60 transition-all duration-700 flex items-center justify-center overflow-hidden shadow-2xl"
                                whileHover={{ 
                                    scale: 1.1,
                                    rotateY: 10,
                                    boxShadow: "0 25px 50px rgba(245,158,11,0.4)"
                                }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {/* تأثير الإضاءة الداخلية */}
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                {brand.logo && !imageError ? (
                                    <Image
                                        src={brand.logo}
                                        alt={displayName}
                                        width={100}
                                        height={100}
                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 filter brightness-110 group-hover:brightness-125"
                                        onError={() => setImageError(true)}
                                        unoptimized
                                    />
                                ) : (
                                    <div className="relative">
                                        <Building2 className="w-16 h-16 text-white/30 group-hover:text-amber-500/70 transition-colors duration-500" />
                                        {/* تأثير التوهج للأيقونة */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Building2 className="w-16 h-16 text-amber-500/0 group-hover:text-amber-500/30 transition-colors duration-500 blur-sm" />
                                        </div>
                                    </div>
                                )}

                                {/* نجوم متحركة حول الشعار */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute w-1 h-1 bg-amber-400 rounded-full"
                                            style={{
                                                left: '50%',
                                                top: '50%',
                                                transformOrigin: `${40 * Math.cos(i * 60 * Math.PI / 180)}px ${40 * Math.sin(i * 60 * Math.PI / 180)}px`,
                                            }}
                                            animate={{
                                                rotate: 360,
                                                scale: [0, 1, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                delay: i * 0.1,
                                            }}
                                        />
                                    ))}
                                </div>
                            </motion.div>

                            {/* تاج الوكالة المميزة */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                <motion.div
                                    animate={{ 
                                        y: [0, -5, 0],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <Crown className="w-4 h-4 text-white" />
                                </motion.div>
                            </div>
                        </div>

                        {/* اسم الوكالة */}
                        <div className="space-y-2">
                            <motion.h3 
                                className="text-2xl font-black text-white group-hover:text-amber-400 transition-colors duration-500 uppercase tracking-tight"
                                whileHover={{ scale: 1.05 }}
                            >
                                {displayName}
                            </motion.h3>
                            
                            {displayDescription && (
                                <p className="text-sm text-white/60 group-hover:text-white/80 line-clamp-2 leading-relaxed transition-colors duration-300 max-w-xs">
                                    {displayDescription}
                                </p>
                            )}
                        </div>

                        {/* إحصائيات الوكالة */}
                        <div className="flex items-center justify-center gap-6">
                            {/* عدد السيارات */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all duration-500">
                                <Car className="w-4 h-4 text-white/50 group-hover:text-amber-400 transition-colors" />
                                <div className="text-center">
                                    <p className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                                        {brand.carCount || 0}
                                    </p>
                                    <p className="text-xs text-white/40 group-hover:text-amber-400/70 transition-colors font-bold">
                                        {isRTL ? 'سيارة' : 'Cars'}
                                    </p>
                                </div>
                            </div>

                            {/* تقييم الوكالة */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all duration-500">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <div className="text-center">
                                    <p className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                                        4.8
                                    </p>
                                    <p className="text-xs text-white/40 group-hover:text-amber-400/70 transition-colors font-bold">
                                        {isRTL ? 'تقييم' : 'Rating'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* زر الاستكشاف */}
                        <motion.div
                            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500 hover:to-orange-500 border border-amber-500/30 hover:border-amber-400 rounded-2xl transition-all duration-500 group-hover:shadow-lg group-hover:shadow-amber-500/30"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="font-bold text-amber-400 group-hover:text-black transition-colors text-sm">
                                {isRTL ? 'استكشف الوكالة' : 'Explore Brand'}
                            </span>
                            <ArrowRight className={`w-4 h-4 text-amber-400 group-hover:text-black transition-all duration-300 group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                        </motion.div>

                        {/* شارات مميزة */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                                <Gem className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-bold text-purple-400">{isRTL ? 'مميز' : 'Premium'}</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                <span className="text-xs font-bold text-blue-400">{isRTL ? 'موثق' : 'Verified'}</span>
                            </div>
                        </div>
                    </div>

                    {/* تأثير الإضاءة العلوي */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-3/4 bg-amber-500/10 blur-3xl" />
                    </div>
                    
                    {/* خط متوهج في الأسفل */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/60 transition-all duration-700" />
                    
                    {/* Holographic Border */}
                    <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                         style={{ 
                             background: 'linear-gradient(45deg, transparent, rgba(245,158,11,0.3), transparent)',
                             mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                             maskComposite: 'xor'
                         }} 
                    />
                </div>
            </Link>
        </motion.div>
    );
}