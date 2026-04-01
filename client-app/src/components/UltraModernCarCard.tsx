'use client';

/**
 * UltraModernCarCard - بطاقة السيارة الإبداعية المذهلة
 * تصميم ثوري مع تأثيرات ثلاثية الأبعاد وحركات متقدمة
 */

import React, { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { 
    Heart, Share2, Eye, Calendar, Gauge, Fuel, Settings, Star, ArrowRight, 
    Home, Zap, Shield, Award, Camera, Play, Pause, Volume2, VolumeX,
    Sparkles, Crown, Diamond, Flame, Bolt, Target, Gem
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UltraModernCarCardProps {
    car: {
        id: string;
        title: string;
        make: string;
        model: string;
        year: number;
        price: number;
        priceSar?: number;
        priceUsd?: number;
        images: string[];
        imageUrl?: string;
        mileage?: number;
        fuelType?: string;
        transmission?: string;
        category?: string;
        isActive?: boolean;
        isSold?: boolean;
        source?: string;
        isInspected?: boolean;
        condition?: string;
    };
    index: number;
    formatPrice?: (price: number) => string;
    onContact?: (car: any) => void;
    onViewDetails?: (car: any) => void;
}

export default function UltraModernCarCard({ 
    car, 
    index, 
    formatPrice, 
    onContact, 
    onViewDetails 
}: UltraModernCarCardProps) {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Motion values للتأثيرات ثلاثية الأبعاد المتقدمة
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-300, 300], [15, -15]);
    const rotateY = useTransform(x, [-300, 300], [-15, 15]);
    const scale = useSpring(1, { stiffness: 300, damping: 30 });
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showImageGallery, setShowImageGallery] = useState(false);

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const nextImage = () => {
        if (car.images && car.images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
        }
    };

    const prevImage = () => {
        if (car.images && car.images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
        }
    };

    // إصلاح صور السيارات الكورية
    const resolveCarImage = (imageUrl: string | undefined): string => {
        if (!imageUrl) {
            return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
        }
        
        let url = imageUrl.trim();
        
        // إصلاح الروابط المكررة
        if (url.includes('https://ci.encar.comhttps://ci.encar.com')) {
            url = url.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        }
        
        // إصلاح الروابط التي تنتهي بـ _
        if (url.endsWith('_')) {
            url = `${url}001.jpg`;
        }
        
        // إضافة بروتوكول إذا كان مفقوداً
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        
        return url;
    };

    const currentImage = car.images?.[currentImageIndex] || car.imageUrl || '';
    const resolvedImage = resolveCarImage(currentImage);
    const displayPrice = formatPrice ? formatPrice(car.price) : `${car.price?.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.1);
        y.set((e.clientY - centerY) * 0.1);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        scale.set(1);
        setIsHovered(false);
    };

    const handleMouseEnter = () => {
        scale.set(1.02);
        setIsHovered(true);
    };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 60, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ 
                duration: 0.8, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
            }}
            style={{
                rotateX,
                rotateY,
                scale,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            className="group relative perspective-1000"
        >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/80 via-black to-gray-900/80 border border-white/10 hover:border-red-500/30 transition-all duration-700 shadow-2xl hover:shadow-red-500/20">
                
                {/* خلفية هولوجرافية متحركة */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-purple-500/5 to-blue-500/10 animate-pulse" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,0,0,0.1)_0%,transparent_50%)] animate-pulse" />
                </div>

                {/* شبكة نيون متحركة */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.1)_1px,transparent_1px)] bg-[size:30px_30px] animate-pulse" />
                </div>

                {/* Status Badge */}
                {car.isSold && (
                    <div className="absolute top-4 start-4 z-30 px-4 py-2 bg-red-600/90 backdrop-blur-md text-white text-xs font-black rounded-2xl border border-red-500/50 shadow-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            {isRTL ? 'مباع' : 'SOLD'}
                        </div>
                    </div>
                )}

                {/* Korean Import Badge */}
                {car.source === 'korean_import' && (
                    <div className="absolute top-4 start-4 z-30 px-3 py-1.5 bg-blue-600/90 backdrop-blur-md text-white text-xs font-black rounded-xl border border-blue-500/50 shadow-lg">
                        <div className="flex items-center gap-1">
                            <span>🇰🇷</span>
                            {isRTL ? 'كوري' : 'Korean'}
                        </div>
                    </div>
                )}

                {/* Inspection Badge */}
                {car.isInspected && (
                    <div className="absolute top-16 start-4 z-30 px-3 py-1.5 bg-green-600/90 backdrop-blur-md text-white text-xs font-black rounded-xl border border-green-500/50 shadow-lg">
                        <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {isRTL ? 'مفحوص' : 'Inspected'}
                        </div>
                    </div>
                )}

                {/* Image Section */}
                <div className="relative h-64 overflow-hidden">
                    {/* Main Image */}
                    <div className="relative w-full h-full">
                        {!imageError ? (
                            <Image
                                src={resolvedImage}
                                alt={car.title}
                                fill
                                className="object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
                                onError={handleImageError}
                                priority={index < 4}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <div className="text-center text-white/40">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/10 flex items-center justify-center">
                                        <Eye className="w-10 h-10" />
                                    </div>
                                    <p className="text-sm font-bold">{isRTL ? 'صورة غير متوفرة' : 'Image not available'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Image Navigation */}
                    {car.images && car.images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'} w-10 h-10 rounded-2xl bg-black/70 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 border border-white/20`}
                            >
                                <ArrowRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
                            </button>
                            <button
                                onClick={nextImage}
                                className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'} w-10 h-10 rounded-2xl bg-black/70 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all opacity-0 group-hover:opacity-100 border border-white/20`}
                            >
                                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                            </button>
                        </>
                    )}

                    {/* Image Indicators */}
                    {car.images && car.images.length > 1 && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                            {car.images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        idx === currentImageIndex 
                                            ? 'bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]' 
                                            : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* زر الرجوع للصفحة الرئيسية */}
                    <div className="absolute top-4 end-4">
                        <motion.button
                            onClick={handleBackToHome}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 hover:border-red-500/50 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/90 transition-all duration-300 group/back shadow-lg"
                            title={isRTL ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
                        >
                            <Home className="w-6 h-6 group-hover/back:scale-110 transition-transform" />
                        </motion.button>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-20 end-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <motion.button
                            onClick={() => setIsLiked(!isLiked)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-12 h-12 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-lg ${
                                isLiked 
                                    ? 'bg-red-500/90 border border-red-400/50 text-white' 
                                    : 'bg-black/70 text-white/80 hover:bg-red-500/20 hover:text-red-400 border border-white/20 hover:border-red-400/50'
                            }`}
                        >
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 hover:border-blue-400/50 flex items-center justify-center text-white/80 hover:text-blue-400 hover:bg-blue-500/20 transition-all duration-300 shadow-lg"
                        >
                            <Share2 className="w-5 h-5" />
                        </motion.button>

                        <motion.button
                            onClick={() => setShowImageGallery(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 hover:border-purple-400/50 flex items-center justify-center text-white/80 hover:text-purple-400 hover:bg-purple-500/20 transition-all duration-300 shadow-lg"
                        >
                            <Camera className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                    {/* Title and Year */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                                    {car.make}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-white/60" />
                                <span className="text-sm font-bold text-white/80">{car.year}</span>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-black text-white group-hover:text-red-100 transition-colors duration-300 line-clamp-2 leading-tight">
                            {car.title}
                        </h3>
                    </div>

                    {/* Car Details */}
                    <div className="grid grid-cols-2 gap-4">
                        {car.mileage && (
                            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-red-500/30 transition-all">
                                <Gauge className="w-4 h-4 text-blue-400" />
                                <div>
                                    <p className="text-xs text-white/50 font-medium">{isRTL ? 'المسافة' : 'Mileage'}</p>
                                    <p className="text-sm font-bold text-white">{car.mileage?.toLocaleString()}</p>
                                </div>
                            </div>
                        )}
                        
                        {car.fuelType && (
                            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-red-500/30 transition-all">
                                <Fuel className="w-4 h-4 text-green-400" />
                                <div>
                                    <p className="text-xs text-white/50 font-medium">{isRTL ? 'الوقود' : 'Fuel'}</p>
                                    <p className="text-sm font-bold text-white">{car.fuelType}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-white/50 font-medium mb-1">{isRTL ? 'السعر' : 'Price'}</p>
                            <p className="text-2xl font-black text-red-400">{displayPrice}</p>
                        </div>
                        
                        <div className="flex gap-2">
                            {onContact && (
                                <motion.button
                                    onClick={() => onContact(car)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-xl font-bold text-sm text-white transition-all"
                                >
                                    {isRTL ? 'تواصل' : 'Contact'}
                                </motion.button>
                            )}
                            
                            <motion.button
                                onClick={() => onViewDetails?.(car)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2 shadow-lg"
                            >
                                <span>{isRTL ? 'التفاصيل' : 'Details'}</span>
                                <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                {/* Holographic Border */}
                <div className="absolute inset-0 rounded-3xl border border-transparent bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
                     style={{ 
                         background: 'linear-gradient(45deg, transparent, rgba(255,0,0,0.3), transparent)',
                         mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                         maskComposite: 'xor'
                     }} 
                />
            </div>

            {/* Image Gallery Modal */}
            <AnimatePresence>
                {showImageGallery && car.images && car.images.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowImageGallery(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative max-w-4xl w-full aspect-video bg-black rounded-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={resolveCarImage(car.images[currentImageIndex])}
                                alt={`${car.title} - Image ${currentImageIndex + 1}`}
                                fill
                                className="object-contain"
                            />
                            
                            <button
                                onClick={() => setShowImageGallery(false)}
                                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                            >
                                ×
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}