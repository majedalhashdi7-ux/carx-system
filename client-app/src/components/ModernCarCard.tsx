'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Share2, Eye, Calendar, Gauge, Fuel, Settings, Star, ArrowRight, Home } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CarCardProps {
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
        mileage?: number;
        fuelType?: string;
        transmission?: string;
        category?: string;
        isActive?: boolean;
        isSold?: boolean;
    };
    index: number;
    formatPrice?: (price: number) => string;
}

export default function ModernCarCard({ car, index, formatPrice }: CarCardProps) {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [imageError, setImageError] = useState(false);

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

    const currentImage = car.images?.[currentImageIndex] || '/images/placeholder-car.jpg';
    const displayPrice = formatPrice ? formatPrice(car.price) : `${car.price?.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-gray-900/80 via-black to-gray-900/80 rounded-3xl overflow-hidden border border-white/10 hover:border-red-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10"
        >
            {/* Status Badge */}
            {car.isSold && (
                <div className="absolute top-4 start-4 z-20 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    {isRTL ? 'مباع' : 'SOLD'}
                </div>
            )}

            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                {/* Main Image */}
                <div className="relative w-full h-full">
                    {!imageError ? (
                        <Image
                            src={currentImage}
                            alt={car.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                            <div className="text-center text-white/40">
                                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Eye className="w-8 h-8" />
                                </div>
                                <p className="text-sm">{isRTL ? 'صورة غير متوفرة' : 'Image not available'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Navigation */}
                {car.images && car.images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100`}
                        >
                            <ArrowRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                        </button>
                        <button
                            onClick={nextImage}
                            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-2' : 'right-2'} w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100`}
                        >
                            <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        </button>
                    </>
                )}

                {/* Image Indicators */}
                {car.images && car.images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {car.images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentImageIndex ? 'bg-red-500' : 'bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-4 end-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                        onClick={() => setIsLiked(!isLiked)}
                        className={`w-10 h-10 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all ${
                            isLiked 
                                ? 'bg-red-500 text-white' 
                                : 'bg-black/60 text-white/80 hover:bg-red-500/20 hover:text-red-400'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* زر الرجوع للصفحة الرئيسية */}
                <div className="absolute top-4 start-4">
                    <motion.button
                        onClick={handleBackToHome}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 hover:border-red-500/50 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/80 transition-all duration-300 group/back"
                        title={isRTL ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
                    >
                        <Home className="w-5 h-5 group-hover/back:scale-110 transition-transform" />
                    </motion.button>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content Section */}
            <div className="p-6">
                {/* Title and Price */}
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-red-100 transition-colors">
                        {car.title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-black text-red-400">
                            {displayPrice}
                        </div>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Car Details */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white/60" />
                        </div>
                        <p className="text-xs text-white/40 mb-1">{isRTL ? 'السنة' : 'Year'}</p>
                        <p className="text-sm font-bold text-white">{car.year}</p>
                    </div>
                    
                    {car.mileage && (
                        <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                                <Gauge className="w-5 h-5 text-white/60" />
                            </div>
                            <p className="text-xs text-white/40 mb-1">{isRTL ? 'المسافة' : 'Mileage'}</p>
                            <p className="text-sm font-bold text-white">{car.mileage?.toLocaleString()}</p>
                        </div>
                    )}
                    
                    {car.fuelType && (
                        <div className="text-center">
                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center">
                                <Fuel className="w-5 h-5 text-white/60" />
                            </div>
                            <p className="text-xs text-white/40 mb-1">{isRTL ? 'الوقود' : 'Fuel'}</p>
                            <p className="text-sm font-bold text-white">{car.fuelType}</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Link href={`/cars/${car.id}`}>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600 hover:to-red-700 border border-red-600/30 hover:border-red-500 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                        {/* Button glow effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0"
                            animate={{
                                x: [-100, 100]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        <span className="relative z-10">{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                        <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10 ${isRTL ? 'rotate-180' : ''}`} />
                    </motion.button>
                </Link>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
}