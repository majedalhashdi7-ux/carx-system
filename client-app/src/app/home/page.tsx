'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HMCarLogo from '@/components/HMCarLogo';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-original';
import Link from 'next/link';
import { getBrandDisplayName, getClearbitLogoUrl, formatCarTitle } from '@/lib/brandTranslations';
import { HeroSection, StatsBar, ShowroomGrid, LiveAuctionTicker, WhyUsSection } from '@/components/home';

// ─── TypeScript Interfaces ───
interface CarItem {
    _id: string;
    id?: string;
    title?: string;
    make?: string | { name: string };
    model?: string;
    year?: number | string;
    price?: number;
    priceSar?: number;
    transmission?: string;
    fuelType?: string;
    fuel?: string;
    images?: string[];
    image?: string;
    imageUrl?: string;
    listingType?: string;
    isLiveAuction?: boolean;
    type?: string;
    priceEstimate?: string;
    sessionId?: string;
    sourceUrl?: string;
    isHidden?: boolean;
    lotNumber?: string;
}

interface BrandItem {
    name: string;
    nameAr?: string;
    logoUrl?: string;
    logo?: string;
    isActive?: boolean;
    key?: string;
}

// ─── PWA Install Prompt Type ───
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BRAND_SVG_LOGOS: Record<string, string> = {
    'hyundai': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg',
    'هيونداي': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg',
    'kia': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo_2021.svg',
    'كيا': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo_2021.svg',
    'genesis': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Genesis_Logo.svg',
    'جينيسيس': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Genesis_Logo.svg',
    'bmw': 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    'بي ام دبليو': 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    'بي إم دبليو': 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    'mercedes': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'مرسيدس': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'mercedes-benz': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'مرسيدس بنز': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'toyota': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg',
    'تويوتا': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg',
    'porsche': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Porsche_logo.svg',
    'بورش': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Porsche_logo.svg',
    'بورشه': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Porsche_logo.svg',
    'audi': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
    'أودي': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
    'lexus': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Lexus_division_logo.svg',
    'لكزس': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Lexus_division_logo.svg',
    'ford': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg',
    'فورد': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg',
    'jeep': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Jeep_logo.svg',
    'جيب': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Jeep_logo.svg',
    'nissan': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Nissan_logo.svg',
    'نيسان': 'https://upload.wikimedia.org/wikipedia/commons/8/82/Nissan_logo.svg',
};

function HomeBrandLogo({ brand, isRTL }: { brand: any, isRTL: boolean }) {
    const displayName = getBrandDisplayName(brand.nameAr || brand.name, isRTL);
    const keyLower = (brand.name || brand.nameAr || '').toLowerCase().trim();

    const getLogoUrl = () => {
        const l = brand.logoUrl || brand.logo;
        if (l && typeof l === 'string' && l.trim().length > 0) {
            return l.trim();
        }
        return BRAND_SVG_LOGOS[keyLower] || getClearbitLogoUrl(brand.name) || '';
    };

    const [logoSrc, setLogoSrc] = useState(getLogoUrl());
    const [showLetter, setShowLetter] = useState(false);
    const firstLetter = (displayName || brand.name || 'C').trim().charAt(0).toUpperCase();

    useEffect(() => {
        setLogoSrc(getLogoUrl());
        setShowLetter(false);
    }, [brand, keyLower]);

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
                                const fallbackSvg = BRAND_SVG_LOGOS[keyLower];
                                if (fallbackSvg && logoSrc !== fallbackSvg) {
                                    setLogoSrc(fallbackSvg);
                                } else {
                                    const cb = getClearbitLogoUrl(brand.name);
                                    if (cb && logoSrc !== cb) {
                                        setLogoSrc(cb);
                                    } else {
                                        setShowLetter(true);
                                    }
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
            <span className="text-[11px] sm:text-xs font-black text-white/90 group-hover:text-[#C9A96E] transition-colors text-center">
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
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [showroomCars, setShowroomCars] = useState<CarItem[]>([]);
    const [liveAuctions, setLiveAuctions] = useState<CarItem[]>([]);
    const [carsLoading, setCarsLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

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

    const [homeBrands, setHomeBrands] = useState<any[]>([]);

    useEffect(() => {
        // أولاً: جلب شعارات الصفحة الرئيسية التي يتحكم بها الأدمن
        api.settings.getHomeBrands().then((res: any) => {
            if (res?.success && res.brands && res.brands.length > 0) {
                setHomeBrands(res.brands.filter((b: any) => b.isActive !== false));
            }
        }).catch(() => {});

        // ثانياً: جلب وكالات السيارات كـ fallback
        api.brands.list('cars').then(res => {
            if (res?.success && res.brands) {
                const activeWithLogos = res.brands.filter((b: any) => b.isActive !== false);
                setBrands(activeWithLogos);
            }
        }).catch(err => console.error('Error fetching brands:', err));
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
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
        // إلغاء أي طلب سابق عند إعادة التشغيل
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setCarsLoading(true);

        const withTimeout = <T,>(promise: Promise<T>, ms = 8000): Promise<T> =>
            Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

        const normalizeCarItem = (c: CarItem, type: string): CarItem => ({
            ...c,
            _id: c.id || c._id,
            type,
            price: c.price || c.priceSar || 0,
            year: c.year || '2024',
            transmission: c.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
            fuel: c.fuelType || c.fuel || (isRTL ? 'ديزل' : 'Diesel'),
            images: c.images || (c.image ? [c.image] : []),
        });

        Promise.all([
            withTimeout(api.cars.list({ limit: 100, status: 'all' })).catch(() => ({ success: false, data: [] })),
            withTimeout(api.liveAuctions.list()).catch(() => ({ success: false, data: [] })),
            withTimeout(api.auctions.list({ status: 'running', limit: 100 })).catch(() => ({ success: false, data: [] }))
        ]).then(([carsRes, liveAuctionsRes, auctionsRes]) => {
            if (controller.signal.aborted) return;

            const rawCars: CarItem[] = Array.isArray((carsRes as any)?.data)
                ? (carsRes as any).data
                : ((carsRes as any)?.data?.cars || (carsRes as any)?.cars || []);

            if (rawCars.length > 0) {
                setShowroomCars(rawCars.map(c => normalizeCarItem(c, 'showroom')));
            }

            // تجميع سيارات المزادات الحقيقية
            const realAuctionCars: CarItem[] = [];
            const addedIds = new Set<string>();

            // 1. من جلسات المزاد المباشر
            const sessions: CarItem[] = Array.isArray((liveAuctionsRes as any)?.data)
                ? (liveAuctionsRes as any).data
                : ((liveAuctionsRes as any)?.sessions || []);

            sessions.forEach((session: any) => {
                if (Array.isArray(session.cars)) {
                    session.cars.forEach((car: CarItem) => {
                        const carId = car._id || car.id || car.lotNumber;
                        if (!car.isHidden && carId && !addedIds.has(carId)) {
                            addedIds.add(carId);
                            realAuctionCars.push({
                                ...car,
                                _id: carId,
                                title: car.title || (isRTL ? 'سيارة مزاد حي' : 'Live Auction Car'),
                                type: 'live-auction',
                                price: car.price || car.priceSar || 0,
                                year: car.year || '2024',
                                transmission: car.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
                                fuel: car.fuelType || car.fuel || (isRTL ? 'ديزل' : 'Diesel'),
                                images: (car.images?.length ?? 0) > 0 ? car.images : (car.image ? [car.image] : []),
                                sessionId: (session as any)._id || (session as any).id,
                                sourceUrl: car.sourceUrl || (session as any).externalUrl,
                            });
                        }
                    });
                }
            });

            // 2. المزادات التقليدية
            const rawAuctions: any[] = Array.isArray((auctionsRes as any)?.data)
                ? (auctionsRes as any).data
                : ((auctionsRes as any)?.auctions || (auctionsRes as any)?.data?.auctions || []);

            rawAuctions.forEach((a: any) => {
                const aucId = a._id || a.id;
                if (aucId && !addedIds.has(aucId)) {
                    addedIds.add(aucId);
                    realAuctionCars.push({
                        ...a,
                        _id: aucId,
                        title: a.car?.title || a.title || (isRTL ? 'سيارة مزاد حي' : 'Live Auction Car'),
                        type: 'auctions',
                        price: a.currentBid || a.currentPrice || a.startingPrice || 0,
                        year: a.car?.year || a.year || '2024',
                        transmission: a.car?.transmission || a.transmission || (isRTL ? 'أوتوماتيك' : 'Auto'),
                        fuel: a.car?.fuelType || a.fuel || (isRTL ? 'ديزل' : 'Diesel'),
                        images: a.car?.images || a.images || (a.car?.image ? [a.car.image] : [])
                    });
                }
            });

            // 3. سيارات المعرض المصنفة كـ auction
            rawCars.forEach((c: CarItem) => {
                const cId = c.id || c._id;
                if ((c.listingType === 'auction' || c.isLiveAuction) && cId && !addedIds.has(cId)) {
                    addedIds.add(cId);
                    realAuctionCars.push(normalizeCarItem(c, 'auctions'));
                }
            });

            if (realAuctionCars.length > 0) setLiveAuctions(realAuctionCars);
        })
        .catch(err => { if (!controller.signal.aborted) console.error('Error fetching homepage data:', err); })
        .finally(() => { if (!controller.signal.aborted) setCarsLoading(false); });

        return () => { controller.abort(); };
    }, [isRTL]);

    const FALLBACK_BRANDS = [
        { name: 'Hyundai', nameAr: 'هيونداي', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg' },
        { name: 'Kia', nameAr: 'كيا', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo_2021.svg' },
        { name: 'Genesis', nameAr: 'جينيسيس', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Genesis_Logo.svg' },
        { name: 'BMW', nameAr: 'بي إم دبليو', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
        { name: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg' },
    ];
    // أولوية العرض: شعارات الأدمن ← وكالات السيارات ← FALLBACK
    const display5Brands = (
        homeBrands.length > 0 ? homeBrands
        : brands.length > 0 ? brands
        : FALLBACK_BRANDS
    ).slice(0, 8);

    const displayShowroomCars = showroomCars;
    const displayAuctionCars = liveAuctions;

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

            {/* ─── 1. Hero ─── */}
            <HeroSection isRTL={isRTL} />

            {/* ─── 2. Brands ─── */}
            {(homeContent?.showBrandCatalog ?? true) && (
                <section className="py-10 border-y border-white/5 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent relative z-10">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-1">
                            {isRTL ? 'الشركات المصنعة والوكالات' : 'PREMIUM BRANDS'}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black mb-8">
                            {isRTL ? 'تصفح بالماركة التجاريـة' : 'Browse By Car Brand'}
                        </h2>
                        <div className="flex items-center justify-center gap-4 sm:gap-10 flex-wrap max-w-4xl mx-auto">
                            {display5Brands.map((brand, idx) => (
                                <HomeBrandLogo key={`brand-circle-${idx}`} brand={brand} isRTL={isRTL} />
                            ))}
                        </div>
                        <div className="mt-6">
                            <Link href="/brands" className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#C9A96E]/70 hover:text-[#C9A96E] uppercase tracking-widest transition-colors">
                                {isRTL ? 'عرض كل الماركات' : 'VIEW ALL BRANDS'}
                                <ArrowRight className={cn('w-3 h-3', isRTL && 'rotate-180')} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ─── 3. Stats ─── */}
            <StatsBar isRTL={isRTL} showroomCount={showroomCars.length} auctionCount={liveAuctions.length} brandCount={brands.length} />

            {/* ─── 4. Showroom Grid ─── */}
            <ShowroomGrid
                isRTL={isRTL}
                cars={displayShowroomCars}
                loading={carsLoading}
                formatCarImage={formatCarImage}
                formatCarTitle={formatCarTitle}
                formatPrice={formatPriceFromUsd}
            />

            {/* ─── 5. Live Auction Ticker ─── */}
            <LiveAuctionTicker
                isRTL={isRTL}
                cars={displayAuctionCars}
                formatCarImage={formatCarImage}
                formatCarTitle={formatCarTitle}
                formatPrice={formatPriceFromUsd}
            />

            {/* ─── 6. Why Us + Social ─── */}
            {(homeContent?.showPlatformFeatures ?? true) && (
                <WhyUsSection
                    isRTL={isRTL}
                    socialPlatforms={socialPlatforms}
                    contactEmail={contactEmail}
                    contactPhone={contactPhone}
                />
            )}

            {/* ─── Footer ─── */}
            <footer className="mt-auto pt-12 pb-8 bg-[#06060a] border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                        <div>
                            <h4 className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest mb-3">{isRTL ? 'المعرض' : 'Showroom'}</h4>
                            <ul className="space-y-2">
                                <li><Link href="/cars" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'كل السيارات' : 'All Cars'}</Link></li>
                                <li><Link href="/brands" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'الماركات' : 'Brands'}</Link></li>
                                <li><Link href="/parts" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'قطع الغيار' : 'Spare Parts'}</Link></li>
                                <li><Link href="/search" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'البحث' : 'Search'}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest mb-3">{isRTL ? 'المزادات' : 'Auctions'}</h4>
                            <ul className="space-y-2">
                                <li><Link href="/auctions" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'المزادات الحية' : 'Live Auctions'}</Link></li>
                                <li><Link href="/auctions/my-bids" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'مزايداتي' : 'My Bids'}</Link></li>
                                <li><Link href="/comparisons" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'مقارنة السيارات' : 'Compare Cars'}</Link></li>
                                <li><Link href="/favorites" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'المفضلة' : 'Favorites'}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest mb-3">{isRTL ? 'الخدمات' : 'Services'}</h4>
                            <ul className="space-y-2">
                                <li><Link href="/concierge" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'طلب خاص' : 'Concierge'}</Link></li>
                                <li><Link href="/contact" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'تواصل معنا' : 'Contact'}</Link></li>
                                <li><Link href="/support" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'الدعم' : 'Support'}</Link></li>
                                <li><Link href="/orders" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'طلباتي' : 'My Orders'}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-[#C9A96E] uppercase tracking-widest mb-3">{isRTL ? 'الحساب' : 'Account'}</h4>
                            <ul className="space-y-2">
                                <li><Link href="/client/dashboard" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'لوحتي' : 'Dashboard'}</Link></li>
                                <li><Link href="/client/profile" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'الملف الشخصي' : 'Profile'}</Link></li>
                                <li><Link href="/login" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'تسجيل دخول' : 'Login'}</Link></li>
                                <li><Link href="/privacy" className="text-xs text-white/40 hover:text-white transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/25">
                        <HMCarLogo variant="horizontal" size="sm" />
                        <p>© {new Date().getFullYear()} {isRTL ? 'إتش إم كار — جميع الحقوق محفوظة.' : 'HM CAR — All rights reserved.'}</p>
                        <p className="hidden sm:block">{isRTL ? 'منصة السيارات المستوردة الفاخرة' : 'Premium Imported Cars Platform'}</p>
                    </div>
                </div>
            </footer>

            {/* PWA Install Floating Button */}
            <AnimatePresence>
                {showInstallBtn && (homeContent?.showAppConversion ?? true) && (
                    <motion.div initial={{ opacity: 0, scale: 0.8, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 50 }} className="fixed bottom-20 right-4 z-[100]">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleInstallApp}
                            className="flex items-center gap-2.5 px-4.5 py-3 rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#b8955b] border border-[#a07e40] text-black font-black text-xs uppercase tracking-wider shadow-[0_10px_30px_rgba(201,169,110,0.3)] group transition-all">
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
