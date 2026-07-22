'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, Wrench, Gavel, ShieldCheck, Globe, Sparkles, Star, HelpCircle, Users,
    Download, Smartphone, Eye, MessageSquare, ArrowRight, RefreshCw, Phone, Mail,
    Share2, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import HMCarLogo from '@/components/HMCarLogo';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-original';
import Link from 'next/link';
import { getBrandDisplayName, getClearbitLogoUrl, isLocalPath, formatCarTitle } from '@/lib/brandTranslations';

function HomeBrandLogo({ brand, isRTL }: { brand: any, isRTL: boolean }) {
    const displayName = getBrandDisplayName(brand.nameAr || brand.name, isRTL);
    const initialSrc = (() => {
        const l = brand.logoUrl || brand.logo;
        if (!l || isLocalPath(l)) {
            return getClearbitLogoUrl(brand.name) || '';
        }
        return l;
    })();
    const [logoSrc, setLogoSrc] = useState(initialSrc);
    const [showLetter, setShowLetter] = useState(false);
    const firstLetter = (displayName || brand.name || 'C').trim().charAt(0).toUpperCase();

    return (
        <Link href={`/cars?make=${encodeURIComponent(brand.name)}`} className="flex flex-col items-center gap-2.5 select-none group">
            {/* Circular Logo Frame */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-3.5 border-2 border-[#C9A96E]/30 shadow-[0_0_20px_rgba(201,169,110,0.15)] group-hover:border-[#C9A96E] group-hover:scale-108 group-hover:shadow-[0_0_25px_rgba(201,169,110,0.35)] transition-all duration-300">
                <div className="relative w-full h-full flex items-center justify-center">
                    {!showLetter && logoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoSrc}
                            alt={displayName}
                            className="w-full h-full object-contain pointer-events-none"
                            onError={() => {
                                const cb = getClearbitLogoUrl(brand.name);
                                if (cb && logoSrc !== cb) {
                                    setLogoSrc(cb);
                                } else {
                                    setShowLetter(true);
                                }
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-black text-black">
                            {firstLetter}
                        </div>
                    )}
                </div>
            </div>
            <span className="text-[11px] font-black text-white/80 group-hover:text-[#C9A96E] transition-colors text-center">
                {displayName}
            </span>
        </Link>
    );
}

export default function HomePage() {
    const { isRTL } = useLanguage();
    const { formatPriceFromUsd, homeContent, socialLinks } = useSettings();
    const WHATSAPP_NUMBER = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');

    // ─── State ───
    const [brands, setBrands] = useState<any[]>([]);
    const [featuredCars, setFeaturedCars] = useState<any[]>([]);
    const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
    const [carsLoading, setCarsLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [auctionRotationIndex, setAuctionRotationIndex] = useState(0);

    const formatCarImage = (url: string | undefined): string => {
        if (!url) return 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
        let img = url;
        if (img.includes('https://ci.encar.comhttps://ci.encar.com')) img = img.replace('https://ci.encar.comhttps://ci.encar.com', 'https://ci.encar.com');
        if (img.endsWith('_')) img = img.startsWith('http') ? `${img}001.jpg` : `https://ci.encar.com${img}001.jpg`;
        if (img.startsWith('/carpicture')) img = `https://ci.encar.com${img}`;
        if (img.startsWith('/') && !img.startsWith('http')) img = `https://ci.encar.com/carpicture${img}`;
        if (img.includes('encar.com') || img.includes('encar.co.kr')) return `/api/v2/image-proxy?url=${encodeURIComponent(img)}`;
        return img;
    };

    const handleHomeWhatsAppOrder = async (car: any) => {
        const rawMake = typeof car.make === 'object' ? car.make?.name : car.make;
        const title = formatCarTitle(car.title || `${rawMake || ''} ${car.model || ''} ${car.year || ''}`, rawMake || '', isRTL);
        const price = formatPriceFromUsd(car.price || 0);

        try {
            await api.orders.create({
                items: [{
                    carId: car._id,
                    title: title,
                    price: car.price || 0,
                    image: Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : ''
                }],
                totalAmount: car.price || 0,
                status: 'NEW',
                notes: `طلب استفسار عبر الواتساب من الصفحة الرئيسية لسيارة: ${title}`
            });
        } catch (e) {
            console.error('Order creation error:', e);
        }

        const msg = encodeURIComponent(
            isRTL
                ? `مرحباً إتش إم كار 👋\nأود الاستفسار عن سيارة المزاد/المعرض:\n🚗 *${title}*\n💰 السعر: ${price}\n🆔 رمز السيارة: #${car._id}`
                : `Hello HM CAR 👋\nI would like to inquire about car:\n🚗 *${title}*\n💰 Price: ${price}\n🆔 Car ID: #${car._id}`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    };

    useEffect(() => {
        // Fetch active car brands
        api.brands.list('cars').then(res => {
            if (res?.success && res.brands) {
                const activeWithLogos = res.brands.filter((b: any) => b.isActive !== false);
                setBrands(activeWithLogos);
            }
        }).catch(err => console.error('Error fetching brands:', err));
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android/.test(ua);

        if (isMobile && !isStandalone) {
            setShowInstallBtn(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowInstallBtn(false);
            }
        } else {
            alert(isRTL
                ? 'تثبيت التطبيق على جهازك:\n١. اضغط على زر "مشاركة" (Share) أسفل المتصفح.\n٢. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                : 'Install app on your device:\n1. Tap the "Share" button in your browser.\n2. Select "Add to Home Screen".'
            );
        }
    };

    useEffect(() => {
        setCarsLoading(true);

        Promise.all([
            api.cars.list({ isActive: true, limit: 100 }).catch(() => ({ success: false, data: { cars: [] } })),
            api.auctions.list({ status: 'running', limit: 100 }).catch(() => ({ success: false, auctions: [] }))
        ]).then(([carsRes, auctionsRes]) => {
            const combinedCars: any[] = [];
            const auctionItems: any[] = [];

            if (carsRes?.success && carsRes.data?.cars) {
                combinedCars.push(...carsRes.data.cars.map((c: any) => ({
                    ...c,
                    _id: c.id || c._id,
                    type: 'showroom',
                    price: c.price || 0,
                    year: c.year || '2024',
                    transmission: c.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
                    fuel: c.fuelType || (isRTL ? 'ديزل' : 'Diesel'),
                    images: c.images || []
                })));
            }

            if (auctionsRes?.success && auctionsRes.auctions) {
                auctionsRes.auctions.forEach((a: any) => {
                    const item = {
                        ...a,
                        _id: a._id || a.id,
                        type: 'auctions',
                        price: a.currentBid || a.startingPrice || 0,
                        year: a.year || '2024',
                        transmission: a.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
                        fuel: a.fuelType || (isRTL ? 'ديزل' : 'Diesel'),
                        images: a.images || []
                    };
                    combinedCars.push(item);
                    auctionItems.push(item);
                });
            }

            setFeaturedCars(combinedCars);
            setLiveAuctions(auctionItems);
        }).catch(err => console.error('Error fetching homepage data:', err))
            .finally(() => setCarsLoading(false));
    }, [isRTL]);

    // ─── Auto-rotating Live Auction 4-Cards Grid ───
    useEffect(() => {
        if (liveAuctions.length <= 4) return;
        const interval = setInterval(() => {
            setAuctionRotationIndex(prev => (prev + 1) % liveAuctions.length);
        }, 5000); // rotates every 5 seconds
        return () => clearInterval(interval);
    }, [liveAuctions.length]);

    const FALLBACK_BRANDS = [
        { name: 'Hyundai', logoUrl: '/brands/hyundai.png' },
        { name: 'Kia', logoUrl: '/brands/kia.png' },
        { name: 'Genesis', logoUrl: '/brands/genesis.png' },
        { name: 'BMW', logoUrl: '/brands/bmw.png' },
        { name: 'Mercedes-Benz', logoUrl: '/brands/mercedes.png' },
    ];
    // Display exactly 5 circular brand logos (as requested: "ويكون العدد خمس دواير شعارات سيارات")
    const display5Brands = (brands.length > 0 ? brands : FALLBACK_BRANDS).slice(0, 5);

    const FALLBACK_CARS = [
        {
            _id: '1',
            title: isRTL ? 'هيونداي سانتا في 2024' : 'Hyundai Santa Fe 2024',
            images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600'],
            price: 32000,
            year: '2024', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'بنزين' : 'Petrol'
        },
        {
            _id: '2',
            title: isRTL ? 'كيا سورينتو 2023' : 'Kia Sorento 2023',
            images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600'],
            price: 28000,
            year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'ديزل' : 'Diesel'
        },
        {
            _id: '3',
            title: isRTL ? 'جينيسيس GV80 2023' : 'Genesis GV80 2023',
            images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=600'],
            price: 65000,
            year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'بنزين' : 'Petrol'
        },
        {
            _id: '4',
            title: isRTL ? 'بي إم دبليو الفئة الخامسة 2023' : 'BMW 5 Series 2023',
            images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600'],
            price: 49000,
            year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'هجين' : 'Hybrid'
        }
    ];

    const displayCars = featuredCars.length > 0 ? featuredCars : FALLBACK_CARS;
    const auctionCarsSource = liveAuctions.length > 0 ? liveAuctions : displayCars;

    // Rotating 4 cars selection
    const rotated4AuctionCars = Array.from({ length: Math.min(4, auctionCarsSource.length) }, (_, i) => {
        return auctionCarsSource[(auctionRotationIndex + i) % auctionCarsSource.length];
    });

    // ─── Dynamic Social Links Configuration ───
    const socialPlatforms = [
        {
            key: 'whatsapp',
            url: socialLinks?.whatsapp ? `https://wa.me/${socialLinks.whatsapp.replace(/\D/g, '')}` : '',
            labelAr: 'واتساب', labelEn: 'WhatsApp', color: '#25D366',
            icon: (
                <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.988l-1.413 5.164 5.283-1.386c1.455.795 3.1 1.218 4.789 1.218 5.507 0 9.989-4.478 9.989-9.984s-4.482-9.984-9.989-9.984zm5.792 14.126c-.244.686-1.42 1.309-1.968 1.353-.51.041-1.157.184-3.771-.84-3.136-1.226-5.132-4.39-5.288-4.597-.156-.207-1.267-1.688-1.267-3.22 0-1.533.805-2.287 1.09-2.58.286-.293.626-.367.834-.367.208 0 .416.002.598.01.194.008.455-.074.71.539.26.626.885 2.159.963 2.316.078.157.13.34.026.547-.104.207-.156.335-.312.516-.156.182-.328.406-.468.545-.156.156-.319.327-.137.64.182.313.809 1.334 1.734 2.159 1.189 1.06 2.193 1.388 2.506 1.544.313.156.495.13.677-.078.182-.208.781-.911.989-1.224.208-.313.416-.26.703-.156.286.104 1.821.859 2.133 1.015.312.156.52.234.598.365.078.13.078.756-.166 1.442z" />
                </svg>
            )
        },
        { key: 'instagram', url: socialLinks?.instagram || '', labelAr: 'إنستغرام', labelEn: 'Instagram', color: '#E4405F', icon: '📸' },
        { key: 'facebook', url: socialLinks?.facebook || '', labelAr: 'فيسبوك', labelEn: 'Facebook', color: '#1877F2', icon: '📘' },
        { key: 'tiktok', url: (socialLinks as any)?.tiktok || '', labelAr: 'تيك توك', labelEn: 'TikTok', color: '#ffffff', icon: '🎵' },
        { key: 'snapchat', url: (socialLinks as any)?.snapchat || '', labelAr: 'سناب شات', labelEn: 'Snapchat', color: '#FFFC00', icon: '👻' },
        { key: 'youtube', url: (socialLinks as any)?.youtube || '', labelAr: 'يوتيوب', labelEn: 'YouTube', color: '#FF0000', icon: '▶️' },
        { key: 'twitter', url: socialLinks?.twitter || '', labelAr: 'تويتر (X)', labelEn: 'X (Twitter)', color: '#1DA1F2', icon: '𝕏' },
    ].filter(p => Boolean(p.url && p.url.trim() !== ''));

    const contactEmail = (socialLinks as any)?.email || 'info@hmcar.app';
    const contactPhone = (socialLinks as any)?.phone || socialLinks?.whatsapp || '+821080880014';

    return (
        <div className="min-h-screen bg-[#08080c] text-white flex flex-col selection:bg-[#C9A96E] selection:text-black overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ─── Hero Section ─── */}
            <header className="relative pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#C9A96E] mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        {isRTL ? 'بوابتك المباشرة لأسواق السيارات الكورية' : 'YOUR DIRECT ACCESS TO KOREAN AUTOMOTIVE MARKET'}
                    </div>

                    <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic">
                        {isRTL ? (
                            <>
                                استورد سيارتك <span className="text-[#C9A96E] drop-shadow-[0_0_20px_rgba(201,169,110,0.3)]">الكورية الفاخرة</span> مباشرة بنقرة واحدة
                            </>
                        ) : (
                            <>
                                IMPORT YOUR <span className="text-[#C9A96E] drop-shadow-[0_0_20px_rgba(201,169,110,0.3)]">LUXURY KOREAN</span> CAR DIRECTLY
                            </>
                        )}
                    </h1>

                    <p className="text-xs sm:text-base text-white/50 max-w-2xl mx-auto mb-8 leading-relaxed">
                        {isRTL
                            ? 'ادخل مباشرة لمزادات السيارات الكورية الحية، واطلب قطع الغيار الأصلية، وتتبع شحنتك حتى باب منزلك مع ضمان الجودة والفحص قبل الشحن.'
                            : 'Access live Korean car auctions directly, request original spare parts, and track your shipment home with guaranteed inspection and quality.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link href="/cars" className="px-7 py-3.5 rounded-2xl bg-[#C9A96E] border border-[#b8955b] text-black font-black uppercase tracking-widest text-xs hover:bg-[#b8955b] transition-all hover:scale-105 shadow-xl shadow-[#C9A96E]/20">
                            {isRTL ? 'تصفح المعرض' : 'BROWSE SHOWROOM'}
                        </Link>
                        <Link href="/auctions" className="px-7 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/20 transition-all">
                            {isRTL ? 'المزادات الحية' : 'LIVE AUCTIONS'}
                        </Link>
                    </div>

                    {/* ─── 4. شريط متحرك لا نهائي لبطاقات سيارات المعرض ─── */}
                    <div className="mt-12 w-full max-w-7xl relative overflow-hidden select-none">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <span className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5" />
                                {isRTL ? 'معرض أسطول السيارات المتاحة' : 'AVAILABLE CARS FLEET'}
                            </span>
                            <Link href="/cars" className="text-[10px] font-black text-white/40 hover:text-[#C9A96E] transition-colors flex items-center gap-1">
                                {isRTL ? 'عرض الكل' : 'View All'}
                                <ArrowRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
                            </Link>
                        </div>

                        {carsLoading ? (
                            <div className="flex gap-4 justify-center items-center py-12">
                                <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[#C9A96E] animate-spin" />
                                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-black italic animate-pulse">جاري تحميل السيارات...</span>
                            </div>
                        ) : (
                            <div className="relative w-full overflow-hidden py-2">
                                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-[#08080c] to-transparent z-10 pointer-events-none" />
                                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-[#08080c] to-transparent z-10 pointer-events-none" />

                                <div className="animate-marquee-infinite flex gap-4 sm:gap-6">
                                    {[...displayCars, ...displayCars, ...displayCars].map((car, idx) => (
                                        <div key={`car-marquee-${idx}`} className="relative aspect-square w-[220px] sm:w-[260px] rounded-3xl overflow-hidden border border-white/10 bg-[#101018] group flex-shrink-0 cursor-pointer shadow-xl hover:border-[#C9A96E]/50 transition-all duration-300">
                                            {car.images && car.images.length > 0 ? (
                                                <img src={formatCarImage(car.images[0])} alt={car.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <Car className="w-12 h-12 text-white/10" />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4 text-start">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded border text-[8.5px] font-black uppercase",
                                                        car.type === 'auctions'
                                                            ? "bg-red-500/20 border-red-500/30 text-red-400"
                                                            : "bg-orange-500/20 border-orange-500/30 text-[#C9A96E]"
                                                    )}>
                                                        {car.type === 'auctions' ? (isRTL ? 'مزاد' : 'AUCTION') : (isRTL ? 'معرض' : 'SHOWROOM')}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-black text-[#C9A96E] cockpit-num">
                                                        {formatPriceFromUsd(car.price)}
                                                    </span>
                                                </div>

                                                <h4 className="text-xs sm:text-sm font-black text-white line-clamp-1 mb-1">
                                                    {car.title}
                                                </h4>

                                                <div className="flex gap-2 text-[8.5px] text-white/40">
                                                    <span>{car.year || '2024'}</span>
                                                    <span>•</span>
                                                    <span>{car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto')}</span>
                                                    <span>•</span>
                                                    <span>{car.fuel || (isRTL ? 'ديزل' : 'Diesel')}</span>
                                                </div>
                                            </div>

                                            {/* رابط مباشر لصفحة السيارة عند الضغط */}
                                            <Link href={car.type === 'auctions' ? `/auctions/${car._id}` : `/cars/${car._id}`} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </header>

            {/* ─── 5. شعارات السيارات الدائرية الخمسة المثبتة (5 Circular Brand Cards) ─── */}
            {(homeContent?.showBrandCatalog ?? true) && (
                <section className="py-12 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent relative z-10">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-1">
                            {isRTL ? 'الشركات المصنعة والوكالات' : 'PREMIUM BRANDS'}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black mb-8">
                            {isRTL ? 'تصفح بالماركة التجاريـة' : 'Browse By Car Brand'}
                        </h2>

                        {/* 5 شعارات دائرية محددة */}
                        <div className="flex items-center justify-center gap-4 sm:gap-10 flex-wrap max-w-4xl mx-auto">
                            {display5Brands.map((brand, idx) => (
                                <HomeBrandLogo key={`brand-circle-${idx}`} brand={brand} isRTL={isRTL} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── 6. بطاقات المزاد المباشر التناوبية في الرئيسية (Auto-Rotating 4 Live Auction Cards) ─── */}
            {(homeContent?.showLiveAuctions ?? true) && (
                <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                {isRTL ? 'المزاد المباشر الحي' : 'LIVE AUCTION FLEET'}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white italic uppercase">
                                {isRTL ? 'سيارات المزاد المباشر' : 'Live Auction Cars'}
                            </h2>
                        </div>
                        <Link
                            href="/auctions"
                            className="text-xs font-black text-[#C9A96E] hover:underline flex items-center gap-1.5"
                        >
                            <span>{isRTL ? 'كل المزادات' : 'All Auctions'}</span>
                            <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                        </Link>
                    </div>

                    {/* شبكة 4 بطاقات تتغير تلقائياً كل فترة زمنية */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                        {rotated4AuctionCars.map((car, idx) => {
                            const rawMake = typeof car.make === 'object' ? car.make?.name : car.make;
                            const title = formatCarTitle(car.title || `${rawMake || ''} ${car.model || ''} ${car.year || ''}`, rawMake || '', isRTL);
                            const image = formatCarImage(Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : undefined);
                            const priceStr = formatPriceFromUsd(car.price || 0);

                            return (
                                <motion.div
                                    key={`auction-card-${car._id || idx}`}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#101018] border border-white/10 hover:border-red-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
                                >
                                    <div>
                                        {/* الصورة */}
                                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900">
                                            <img
                                                src={image}
                                                alt={title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#101018] via-transparent to-transparent" />
                                            <div className="absolute top-2.5 start-2.5">
                                                <span className="px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase bg-red-500/20 border border-red-500/40 text-red-400 backdrop-blur-md">
                                                    🔴 {isRTL ? 'مزاد حي' : 'LIVE'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* التفاصيل */}
                                        <div className="p-3 sm:p-4">
                                            <h3 className="text-xs sm:text-sm font-bold text-white mb-2 line-clamp-1 group-hover:text-red-400 transition-colors" title={title}>
                                                {title}
                                            </h3>

                                            <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                                                <div>
                                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest block">
                                                        {isRTL ? 'أعلى مزايدة' : 'HIGHEST BID'}
                                                    </span>
                                                    <span className="text-xs sm:text-base font-black text-[#C9A96E]">
                                                        {priceStr}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* زر المزايدة الطلب */}
                                    <div className="p-3 pt-0">
                                        <Link
                                            href={`/auctions/${car._id}`}
                                            className="w-full h-9 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-[10px] sm:text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Gavel className="w-3.5 h-3.5" />
                                            <span>{isRTL ? 'زايد الآن' : 'Bid Now'}</span>
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ─── 7. قسم "لماذا تختار منصتنا؟" والتواصل الاجتماعي الديناميكي (Why Choose Us & Dynamic Social Footer) ─── */}
            {(homeContent?.showPlatformFeatures ?? true) && (
                <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-1">
                            {isRTL ? 'ضمان وجودة إتش إم كار' : 'HM CAR TRUST HUB'}
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase italic">
                            {isRTL ? 'لماذا تختار منصتنا؟' : 'Why Choose Us?'}
                        </h2>
                    </div>

                    {/* الميزات الأربع: كل ثنتين جنب بعض في الجوال (grid-cols-2) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-16">
                        {[
                            { icon: ShieldCheck, titleAr: 'فحص فني شامل', titleEn: 'Guaranteed Inspection', descAr: 'فحص كل سيارة بدقة في كوريا عبر مهندسينا قبل الشحن.', descEn: 'Every car is thoroughly inspected in Korea before shipping.' },
                            { icon: Gavel, titleAr: 'مزادات مباشرة', titleEn: 'Direct Auction Access', descAr: 'مزايدة حية ومباشرة بدون وسطاء وبمنتهى الشفافية.', descEn: 'Watch and bid in live Korean auctions directly.' },
                            { icon: Wrench, titleAr: 'قطع غيار أصلية', titleEn: 'Original Parts Catalog', descAr: 'استيراد قطع غيار كورية أصلية وتتبع الشحنات.', descEn: 'Import original Korean spare parts directly.' },
                            { icon: Users, titleAr: 'دعم العملاء 24/7', titleEn: 'Expert Support 24/7', descAr: 'فريقنا جاهز لمساعدتك في المزايدة والشراء والتسجيل.', descEn: 'Our team is ready to guide you step-by-step.' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-[#101018] border border-white/5 p-4 sm:p-6 rounded-2xl relative overflow-hidden group hover:border-[#C9A96E]/30 transition-all duration-300">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A96E]" />
                                </div>
                                <h3 className="text-xs sm:text-base font-black mb-1.5 text-white">
                                    {isRTL ? item.titleAr : item.titleEn}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-white/45 leading-relaxed line-clamp-3">
                                    {isRTL ? item.descAr : item.descEn}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ─── قسم منصات التواصل الاجتماعي الديناميكي والاتصال ─── */}
                    <div className="bg-[#0c0c14] border border-white/8 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
                        <div className="max-w-2xl mx-auto">
                            <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-2">
                                {isRTL ? 'تواصل معنا مباشرة' : 'CONNECT WITH US'}
                            </span>
                            <h3 className="text-xl sm:text-3xl font-black mb-6">
                                {isRTL ? 'تابعنا على منصات التواصل الاجتماعي' : 'Follow Us On Social Media'}
                            </h3>

                            {/* الأيقونات الدائرية الديناميكية — لا تظهر إلا إذا أضاف الأدمن الرابط */}
                            {socialPlatforms.length > 0 ? (
                                <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap mb-8">
                                    {socialPlatforms.map((platform) => (
                                        <a
                                            key={platform.key}
                                            href={platform.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center gap-2 group cursor-pointer"
                                        >
                                            <div
                                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl border-2 border-white/10 bg-white/5 group-hover:scale-110 group-hover:border-[#C9A96E] transition-all shadow-lg"
                                                style={{ boxShadow: `0 0 15px ${platform.color}30` }}
                                            >
                                                <span>{platform.icon}</span>
                                            </div>
                                            <span className="text-[10px] sm:text-xs font-bold text-white/70 group-hover:text-[#C9A96E] transition-colors">
                                                {isRTL ? platform.labelAr : platform.labelEn}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40 mb-6">{isRTL ? 'يسعدنا تواصلكم معنا عبر البريد والهاتف' : 'Contact us via email or phone'}</p>
                            )}

                            {/* البريد الإلكتروني ورقم الهاتف */}
                            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-white/5 text-xs font-bold text-white/60">
                                {contactPhone && (
                                    <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:text-[#C9A96E] transition-colors">
                                        <Phone className="w-4 h-4 text-[#C9A96E]" />
                                        <span dir="ltr">{contactPhone}</span>
                                    </a>
                                )}
                                {contactEmail && (
                                    <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-[#C9A96E] transition-colors">
                                        <Mail className="w-4 h-4 text-[#C9A96E]" />
                                        <span>{contactEmail}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Footer ─── */}
            <footer className="mt-auto py-10 bg-[#06060a] border-t border-white/5 relative z-10 text-center text-xs text-white/30">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
                    <HMCarLogo variant="horizontal" size="md" />
                    <p className="mb-1">© {new Date().getFullYear()} {isRTL ? 'إتش إم كار لخدمات استيراد السيارات. جميع الحقوق محفوظة.' : 'HM CAR Automotive Imports. All rights reserved.'}</p>
                    <p className="text-[10px] text-white/15">
                        {isRTL ? 'منصة استيراد ومزادات السيارات الفاخرة المعتمدة' : 'Official Luxury Car Export & Live Auction Platform'}
                    </p>
                </div>
            </footer>

            {/* Premium PWA Install Floating Trigger */}
            <AnimatePresence>
                {showInstallBtn && (homeContent?.showAppConversion ?? true) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        className="fixed bottom-20 right-4 z-[100]"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleInstallApp}
                            className="flex items-center gap-2.5 px-4.5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#b8955b] border border-[#a07e40] text-black font-black text-xs uppercase tracking-wider shadow-[0_10px_30px_rgba(201,169,110,0.3)] group transition-all"
                        >
                            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] sm:text-xs">{isRTL ? 'تنزيل التطبيق' : 'DOWNLOAD APP'}</span>
                            <Download className="w-3.5 h-3.5 opacity-60" />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
