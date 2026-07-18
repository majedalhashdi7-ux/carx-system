'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Car, Wrench, Gavel, ShieldCheck, Globe, Sparkles, Star, HelpCircle, Users,
    Download, Smartphone
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-original';
import Link from 'next/link';

// ─── Calculator Data ───
const COUNTRIES = [
    { nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', code: 'KSA' as const },
    { nameAr: 'الإمارات العربية المتحدة', nameEn: 'United Arab Emirates', code: 'UAE' as const },
    { nameAr: 'اليمن', nameEn: 'Yemen', code: 'YE' as const },
    { nameAr: 'الأردن', nameEn: 'Jordan', code: 'JO' as const }
];

const PORTS = {
    KSA: [
        { nameAr: 'ميناء جدة الإسلامي', nameEn: 'Jeddah Islamic Port', fee: 0 },
        { nameAr: 'ميناء الملك عبدالعزيز بالدمام', nameEn: 'King Abdulaziz Port (Dammam)', fee: 100 }
    ],
    UAE: [
        { nameAr: 'ميناء جبل علي', nameEn: 'Jebel Ali Port', fee: 50 }
    ],
    YE: [
        { nameAr: 'ميناء عدن', nameEn: 'Aden Port', fee: 200 }
    ],
    JO: [
        { nameAr: 'ميناء العقبة', nameEn: 'Aqaba Port', fee: 150 }
    ]
};

const CAR_SIZES = [
    { nameAr: 'سيدان (Sedan)', nameEn: 'Sedan', basePrice: 1200 },
    { nameAr: 'دفع رباعي / عائلية (SUV)', nameEn: 'SUV', basePrice: 1500 },
    { nameAr: 'شاحنة / نقل ثقيل (Heavy)', nameEn: 'Heavy Duty', basePrice: 2200 }
];

export default function HomePage() {
    const { isRTL } = useLanguage();
    const { formatPriceFromUsd, homeContent } = useSettings();

    // ─── Brand & Featured Stock State ───
    const [brands, setBrands] = useState<any[]>([]);
    const [featuredCars, setFeaturedCars] = useState<any[]>([]);
    const [carsLoading, setCarsLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        // Fetch active car brands
        api.brands.list('cars').then(res => {
            if (res?.success && res.brands) {
                const activeWithLogos = res.brands.filter((b: any) => b.isActive !== false && b.logoUrl);
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
        
        // Check if iOS/Android or already stand-alone
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
        
        // Fetch both local/imported showroom cars and running auctions to display a full combined series
        Promise.all([
            api.cars.list({ isActive: true, limit: 100 }).catch(() => ({ success: false, data: { cars: [] } })),
            api.auctions.list({ status: 'running', limit: 100 }).catch(() => ({ success: false, auctions: [] }))
        ]).then(([carsRes, auctionsRes]) => {
            const combined: any[] = [];
            
            if (carsRes?.success && carsRes.data?.cars) {
                combined.push(...carsRes.data.cars.map((c: any) => ({
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
                combined.push(...auctionsRes.auctions.map((a: any) => ({
                    ...a,
                    _id: a._id || a.id,
                    type: 'auctions',
                    price: a.currentBid || a.startingPrice || 0,
                    year: a.year || '2024',
                    transmission: a.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
                    fuel: a.fuelType || (isRTL ? 'ديزل' : 'Diesel'),
                    images: a.images || []
                })));
            }
            
            setFeaturedCars(combined);
        }).catch(err => console.error('Error fetching combined homepage fleet:', err))
          .finally(() => setCarsLoading(false));
    }, [isRTL]);

    const FALLBACK_BRANDS = [
        { name: 'Hyundai', logoUrl: '/brands/hyundai.png' },
        { name: 'Kia', logoUrl: '/brands/kia.png' },
        { name: 'Genesis', logoUrl: '/brands/genesis.png' },
        { name: 'BMW', logoUrl: '/brands/bmw.png' },
        { name: 'Mercedes-Benz', logoUrl: '/brands/mercedes.png' },
        { name: 'Toyota', logoUrl: '/brands/toyota.png' },
    ];
    const displayBrands = brands.length > 0 ? brands : FALLBACK_BRANDS;
    const marqueeBrands = [...displayBrands, ...displayBrands, ...displayBrands];

    const FALLBACK_CARS = [
        {
            _id: '1',
            title: isRTL ? 'هيونداي سانتا في 2024' : 'Hyundai Santa Fe 2024',
            images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=600'],
            price: 32000,
            specs: { year: '2024', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'بنزين' : 'Petrol' }
        },
        {
            _id: '2',
            title: isRTL ? 'كيا سورينتو 2023' : 'Kia Sorento 2023',
            images: ['https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=600'],
            price: 28000,
            specs: { year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'ديزل' : 'Diesel' }
        },
        {
            _id: '3',
            title: isRTL ? 'جينيسيس GV80 2023' : 'Genesis GV80 2023',
            images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=600'],
            price: 65000,
            specs: { year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'بنزين' : 'Petrol' }
        },
        {
            _id: '4',
            title: isRTL ? 'بي إم دبليو الفئة الخامسة 2023' : 'BMW 5 Series 2023',
            images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=600'],
            price: 49000,
            specs: { year: '2023', transmission: isRTL ? 'أوتوماتيك' : 'Automatic', fuel: isRTL ? 'هجين' : 'Hybrid' }
        }
    ];
    const displayCars = featuredCars.length > 0 ? featuredCars : FALLBACK_CARS;
    const marqueeCars = [...displayCars, ...displayCars, ...displayCars];

    // ─── Calculator State ───
    const [countryCode, setCountryCode] = useState<'KSA' | 'UAE' | 'YE' | 'JO'>('KSA');
    const [portIndex, setPortIndex] = useState(0);
    const [carSizeIndex, setCarSizeIndex] = useState(0);

    const availablePorts = PORTS[countryCode] || [];
    const selectedPort = availablePorts[portIndex] || availablePorts[0] || { fee: 0 };
    const selectedSize = CAR_SIZES[carSizeIndex];
    const totalUsd = selectedSize.basePrice + selectedPort.fee;

    // ─── Testimonials Data ───
    const testimonials = [
        {
            nameAr: 'أبو فهد القحطاني',
            nameEn: 'Abu Fahad Al-Qahtani',
            roleAr: 'مستورد سيارات من الرياض',
            roleEn: 'Car Importer from Riyadh',
            textAr: 'تجربتي مع HM CAR كانت استثنائية. استوردت مرسيدس S-Class 2023 والسيارة وصلت مفحوصة بدقة مطابقة لتقرير الكشط الكوري تماماً.',
            textEn: 'My experience with HM CAR was exceptional. Imported a 2023 Mercedes S-Class; it arrived inspected and matched the Korean report perfectly.',
            avatar: 'A',
            rating: 5
        },
        {
            nameAr: 'م. طارق اليوسفي',
            nameEn: 'Eng. Tariq Al-Yousefi',
            roleAr: 'عميل من جدة',
            roleEn: 'Client from Jeddah',
            textAr: 'المصداقية هي أهم ميزة. الدخول للمزادات الكورية مباشرة بنقرة واحدة وشفافية الأسعار وتتبع الشحن جعلني أثق بالمنصة بالكامل.',
            textEn: 'Transparency is key. Bidding directly in Korean auctions with transparent shipping tracking built a lot of trust.',
            avatar: 'T',
            rating: 5
        },
        {
            nameAr: 'خالد دبيان',
            nameEn: 'Khaled Dubayan',
            roleAr: 'تاجر سيارات من دبي',
            roleEn: 'Car Dealer from Dubai',
            textAr: 'أفضل منصة للحصول على قطع غيار كورية أصلية بأسعار منافسة وسرعة استيراد لم أشهدها في أي مكان آخر.',
            textEn: 'The absolute best platform for original Korean spare parts with competitive prices and unmatched delivery speed.',
            avatar: 'K',
            rating: 5
        }
    ];

    // ─── FAQs Data ───
    const faqs = [
        {
            qAr: 'كيف تضمنون سلامة وفحص السيارات المستوردة؟',
            qEn: 'How do you guarantee the quality and inspection of imported cars?',
            aAr: 'يتم فحص جميع السيارات مباشرة في كوريا بواسطة مفتشين خبراء، ونقدم تقريراً شاملاً بالصور والفيديو لضمان المطابقة الكاملة للمواصفات.',
            aEn: 'All cars are inspected directly in Korea by expert inspectors. We provide detailed photographic and video reports to ensure full quality compliance.'
        },
        {
            qAr: 'ما هي المدة الزمنية المستغرقة للشحن والوصول؟',
            qEn: 'How long does the shipping and delivery take?',
            aAr: 'تستغرق عملية الشحن البحري من كوريا الجنوبية إلى موانئ الخليج العربي ما بين 25 إلى 35 يوماً عمل شاملة تجهيز الأوراق الرسمية.',
            aEn: 'Shipping from South Korea to Arabian Gulf ports takes between 25 to 35 business days, including export paperwork preparation.'
        },
        {
            qAr: 'هل يمكنني المزايدة مباشرة في المزادات الكورية؟',
            qEn: 'Can I bid directly in Korean auctions?',
            aAr: 'نعم، نوفر وصولاً حياً ومباشراً لكافة لوائح المزادات الجارية مع خيار المزايدة بالوكالة (Proxy Bidding) وإشعارك لحظة بلحظة.',
            aEn: 'Yes, we provide live access to active Korean auction systems with proxy bidding options and real-time updates.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#08080c] text-white flex flex-col selection:bg-[#C9A96E] selection:text-black overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ─── Hero Section ─── */}
            <header className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
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

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic">
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

                    <p className="text-sm sm:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {isRTL 
                            ? 'ادخل مباشرة لمزادات السيارات الكورية الحية، واطلب قطع الغيار الأصلية، وتتبع شحنتك حتى باب منزلك مع ضمان الجودة والفحص قبل الشحن.'
                            : 'Access live Korean car auctions directly, request original spare parts, and track your shipment home with guaranteed inspection and quality.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/cars" className="px-8 py-4 rounded-2xl bg-[#C9A96E] border border-[#b8955b] text-black font-black uppercase tracking-widest text-xs hover:bg-[#b8955b] transition-all hover:scale-105 shadow-xl shadow-[#C9A96E]/20">
                            {isRTL ? 'تصفح المعرض' : 'BROWSE SHOWROOM'}
                        </Link>
                        <Link href="/auctions" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 hover:border-white/20 transition-all">
                            {isRTL ? 'المزادات الحية' : 'LIVE AUCTIONS'}
                        </Link>
                    </div>

                    {/* Featured Cars Marquee (Premium Square Card Slider) */}
                    <div className="mt-16 w-full max-w-7xl relative overflow-hidden select-none">
                        {carsLoading ? (
                            <div className="flex gap-4 justify-center items-center py-16">
                                <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[#C9A96E] animate-spin" />
                                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-black italic animate-pulse">Loading Luxury Fleet...</span>
                            </div>
                        ) : (
                            <div className="relative w-full overflow-hidden py-4">
                                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                                
                                <div className="animate-marquee-infinite flex gap-6">
                                    {displayCars.map((car, idx) => (
                                        <div key={`car-a-${idx}`} className="relative aspect-square w-[240px] sm:w-[280px] rounded-3xl overflow-hidden border border-white/10 bg-white/2 group flex-shrink-0">
                                            {car.images && car.images.length > 0 ? (
                                                <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <Car className="w-12 h-12 text-white/10" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 text-start">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded border text-[9px] font-black uppercase",
                                                        car.type === 'auctions' 
                                                            ? "bg-red-500/20 border-red-500/30 text-red-400" 
                                                            : "bg-orange-500/20 border-orange-500/30 text-[#C9A96E]"
                                                    )}>
                                                        {car.type === 'auctions' ? (isRTL ? 'مزاد مباشر' : 'LIVE AUCTION') : (isRTL ? 'معرض' : 'SHOWROOM')}
                                                    </span>
                                                    <span className="text-sm font-black text-[#C9A96E] cockpit-num">
                                                        {formatPriceFromUsd(car.price)}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="text-sm font-black text-white line-clamp-1 mb-1.5">
                                                    {car.title}
                                                </h4>
                                                
                                                <div className="flex gap-3 text-[9px] text-white/40">
                                                    <span>{car.year || '2024'}</span>
                                                    <span>•</span>
                                                    <span>{car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto')}</span>
                                                    <span>•</span>
                                                    <span>{car.fuel || (isRTL ? 'ديزل' : 'Diesel')}</span>
                                                </div>
                                            </div>
                                            
                                            <Link href={car.type === 'auctions' ? `/auctions/${car._id}` : `/cars/${car._id}`} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                    {displayCars.map((car, idx) => (
                                        <div key={`car-b-${idx}`} className="relative aspect-square w-[240px] sm:w-[280px] rounded-3xl overflow-hidden border border-white/10 bg-white/2 group flex-shrink-0">
                                            {car.images && car.images.length > 0 ? (
                                                <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                    <Car className="w-12 h-12 text-white/10" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-5 text-start">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded border text-[9px] font-black uppercase",
                                                        car.type === 'auctions' 
                                                            ? "bg-red-500/20 border-red-500/30 text-red-400" 
                                                            : "bg-orange-500/20 border-orange-500/30 text-[#C9A96E]"
                                                    )}>
                                                        {car.type === 'auctions' ? (isRTL ? 'مزاد مباشر' : 'LIVE AUCTION') : (isRTL ? 'معرض' : 'SHOWROOM')}
                                                    </span>
                                                    <span className="text-sm font-black text-[#C9A96E] cockpit-num">
                                                        {formatPriceFromUsd(car.price)}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="text-sm font-black text-white line-clamp-1 mb-1.5">
                                                    {car.title}
                                                </h4>
                                                
                                                <div className="flex gap-3 text-[9px] text-white/40">
                                                    <span>{car.year || '2024'}</span>
                                                    <span>•</span>
                                                    <span>{car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto')}</span>
                                                    <span>•</span>
                                                    <span>{car.fuel || (isRTL ? 'ديزل' : 'Diesel')}</span>
                                                </div>
                                            </div>
                                            
                                            <Link href={car.type === 'auctions' ? `/auctions/${car._id}` : `/cars/${car._id}`} className="absolute inset-0 z-10" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </header>

            {/* ─── Car Brands Ribbon Section (Circular Logos & Moving Marquee) ─── */}
            <section className="py-16 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent relative z-10 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 mb-8 text-center">
                    <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase">
                        {isRTL ? 'الشركات المصنعة والوكالات' : 'PREMIUM BRANDS'}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2">
                        {isRTL ? 'تصفح السيارات حسب العلامة التجارية' : 'Browse By Car Brand'}
                    </h2>
                </div>
                
                {/* Marquee Track */}
                <div className="relative w-full overflow-hidden py-4">
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                    
                    <div className="animate-marquee-infinite flex gap-12 items-center">
                        {displayBrands.map((brand, idx) => (
                            <div key={`brand-a-${idx}`} className="flex flex-col items-center gap-3 select-none">
                                {/* Circular Logo Frame */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center p-4 border-2 border-[#C9A96E]/20 shadow-[0_0_15px_rgba(201,169,110,0.1)] hover:border-[#C9A96E] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] transition-all duration-300">
                                    <div className="relative w-full h-full">
                                        {brand.logoUrl ? (
                                            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain pointer-events-none" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/40">
                                                {brand.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-white/70 hover:text-white transition-colors">
                                    {brand.name}
                                </span>
                            </div>
                        ))}
                        {displayBrands.map((brand, idx) => (
                            <div key={`brand-b-${idx}`} className="flex flex-col items-center gap-3 select-none">
                                {/* Circular Logo Frame */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white flex items-center justify-center p-4 border-2 border-[#C9A96E]/20 shadow-[0_0_15px_rgba(201,169,110,0.1)] hover:border-[#C9A96E] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] transition-all duration-300">
                                    <div className="relative w-full h-full">
                                        {brand.logoUrl ? (
                                            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain pointer-events-none" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-black/40">
                                                {brand.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-white/70 hover:text-white transition-colors">
                                    {brand.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Why Choose Us Section ─── */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase">
                        {isRTL ? 'ضمان وجودة إتش إم كار' : 'HM CAR TRUST HUB'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2 uppercase italic">
                        {isRTL ? 'لماذا تختار منصتنا؟' : 'Why Choose Us?'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: ShieldCheck, titleAr: 'فحص فني شامل', titleEn: 'Guaranteed Inspection', descAr: 'يتم فحص كل سيارة بدقة في كوريا عبر مهندسينا قبل الشحن لضمان خلوها من أي مشاكل.', descEn: 'Every car is thoroughly inspected in Korea by our engineers before shipping.' },
                        { icon: Gavel, titleAr: 'مزادات كورية مباشرة', titleEn: 'Direct Auction Access', descAr: 'شاهد وزايد في المزادات الحية مباشرة دون وسطاء وبمنتهى الشفافية والسهولة.', descEn: 'Watch and bid in live Korean auctions directly without intermediaries.' },
                        { icon: Wrench, titleAr: 'قطع غيار أصلية', titleEn: 'Original Parts Catalog', descAr: 'استورد قطع غيار كورية أصلية وتتبع الشحنات بأسعار منافسة للمخزون والتجزئة.', descEn: 'Import original Korean spare parts directly at competitive retail rates.' },
                        { icon: Users, titleAr: 'دعم العملاء 24/7', titleEn: 'Expert Support 24/7', descAr: 'فريقنا جاهز لمساعدتك في كل خطوة من المزايدة والشراء وحتى الشحن والتسجيل.', descEn: 'Our team is ready to guide you from bidding and purchasing to registration.' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-[#101018] border border-white/5 p-6 rounded-2xl relative overflow-hidden group hover:border-[#C9A96E]/30 transition-all duration-300">
                            <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <item.icon className="w-6 h-6 text-[#C9A96E]" />
                            </div>
                            <h3 className="text-base font-black mb-2 text-white">
                                {isRTL ? item.titleAr : item.titleEn}
                            </h3>
                            <p className="text-xs text-white/45 leading-relaxed">
                                {isRTL ? item.descAr : item.descEn}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Testimonials Section ─── */}
            <section className="py-20 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent border-t border-white/5 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16">
                        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase">
                            {isRTL ? 'آراء شركاء النجاح' : 'TESTIMONIALS'}
                        </span>
                        <h2 className="text-3xl font-black mt-2">
                            {isRTL ? 'ماذا يقول عملاؤنا عنا؟' : 'What Our Customers Say'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, idx) => (
                            <div key={idx} className="bg-[#11111a] border border-white/5 rounded-2xl p-6 relative flex flex-col justify-between">
                                <div>
                                    <div className="flex gap-1 mb-4">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 text-[#C9A96E] fill-[#C9A96E]" />
                                        ))}
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed italic mb-6">
                                        "{isRTL ? t.textAr : t.textEn}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30 flex items-center justify-center font-black text-xs">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white">{isRTL ? t.nameAr : t.nameEn}</div>
                                        <div className="text-[9px] text-[#C9A96E]/70 font-semibold mt-0.5">{isRTL ? t.roleAr : t.roleEn}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FAQs Section ─── */}
            <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase">
                        {isRTL ? 'الأسئلة المتكررة' : 'FREQUENTLY ASKED QUESTIONS'}
                    </span>
                    <h2 className="text-3xl font-black mt-2">
                        {isRTL ? 'إجابات على استفساراتك' : 'Answers To Your Questions'}
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-[#101018] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                            <h3 className="text-sm sm:text-base font-black flex items-start gap-2.5 text-white mb-2 leading-snug">
                                <HelpCircle className="w-5 h-5 text-[#C9A96E] shrink-0 mt-0.5" />
                                {isRTL ? faq.qAr : faq.qEn}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/50 pl-7 leading-relaxed">
                                {isRTL ? faq.aAr : faq.aEn}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Footer ─── */}
            <footer className="mt-auto py-10 bg-[#06060a] border-t border-white/5 relative z-10 text-center text-xs text-white/30">
                <div className="max-w-7xl mx-auto px-4">
                    <p className="mb-2">© {new Date().getFullYear()} {isRTL ? 'إتش إم كار لخدمات استيراد السيارات. جميع الحقوق محفوظة.' : 'HM CAR Automotive Imports. All rights reserved.'}</p>
                    <p className="text-[10px] text-white/15">
                        {isRTL ? 'تطبيق ويب آمن وعالي الأداء مدعوم بالكامل' : 'High performance secure web app'}
                    </p>
                </div>
            </footer>
            {/* Premium PWA Install Floating Trigger */}
            <AnimatePresence>
                {showInstallBtn && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        className="fixed bottom-24 right-4 z-[100]"
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
