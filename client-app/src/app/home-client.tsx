"use client";

/**
 * المكون الرئيسي للصفحة الرئيسية (HomeClient)
 * يتحكم في عرض الموقع بناءً على المنصة (متصفح أو PWA مثبت).
 * يتضمن الخلفية السينمائية، شريط الإعلانات، وعرض السيارات الأحدث.
 */

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Smartphone, Download, Link as LinkIcon,
  ArrowRight, Car, X, Shield, Award, Globe, Truck, HelpCircle,
  Wrench, Layers, Package, Zap, Cog, TrendingUp, Gavel, Timer
} from "lucide-react";
import { SocialIconMap, SocialColorMap } from "@/components/SocialIcons";

const lucideIcons = { Shield, Award, Globe, Truck, HelpCircle, Wrench, Layers, Package, Zap, Cog, TrendingUp, Gavel, Timer };
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api-original";

import dynamic from "next/dynamic";
const LandingShowcase = dynamic(() => import("@/components/LandingShowcase"), { ssr: false });
const AppHome = dynamic(() => import("@/components/AppHome"), { ssr: false });
const SmartAdBanner = dynamic(() => import("@/components/SmartAdBanner"), { ssr: false });
const CarXHome = dynamic(() => import("@/components/CarXHome"), { ssr: false });

import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/SocketContext";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { cn } from "@/lib/utils";
import { useStandalone } from "@/lib/useStandalone";
import { useTenant } from "@/lib/TenantContext";
import ModernCarCard from "@/components/ModernCarCard";

export type CarType = {
  id?: string;
  name?: string;
  title?: string;
  images?: string[];
  year?: number | string;
  make?: { name?: string } | string;
  price?: number | string;
  model?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  priceSar?: number;
  priceUsd?: number;
};

interface HomeClientProps {
  latestCars: CarType[];
}

// ── مكون زر التطبيق العائم ──
function PWAFloatingButton({ isRTL, deferredInstall, onInstall }: { isRTL: boolean; deferredInstall: any; onInstall: () => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // إظهار البطاقة تلقائياً بعد 3 ثوانٍ
    const alreadyDismissed = localStorage.getItem('pwa_popup_dismissed');
    if (alreadyDismissed) return;
    const timer = setTimeout(() => setShowPopup(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // إغلاق نهائي عند الضغط على X
  const handleClose = () => {
    setShowPopup(false);
    setDismissed(true);
    localStorage.setItem('pwa_popup_dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <div className="relative">
      {/* أيقونة الهاتف الثابتة */}
      <motion.button
        id="pwa-float-btn"
        onClick={() => setShowPopup(!showPopup)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:border-accent-gold/50 transition-transform text-accent-gold shadow-[0_0_15px_rgba(201,169,110,0.2)]"
        title={isRTL ? 'تطبيق HM CAR' : 'HM CAR App'}
      >
        <Smartphone className="w-4 h-4" />
      </motion.button>

      {/* Popup مصغّر وأنيق */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="fixed bottom-24 left-4 z-[199] w-64 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-accent-gold/30 shadow-[0_16px_40px_rgba(201,169,110,0.2)] overflow-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* زر الإغلاق X في الركن */}
            <button
              onClick={handleClose}
              aria-label={isRTL ? "إغلاق" : "Close"}
              title={isRTL ? "إغلاق" : "Close"}
              className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all`}
            >
              <X className="w-3 h-3" />
            </button>

            <div className="p-4">
              {/* Header مصغّر */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-gold to-[#a98544] text-black flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase">HM CAR</h3>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-accent-gold fill-accent-gold" />)}
                  </div>
                </div>
              </div>

              <p className="text-white/70 text-xs font-bold leading-relaxed mb-3">
                {isRTL ? 'احصل على تنبيهات فورية للمزادات!' : 'Get instant auction alerts!'}
              </p>

              <button
                onClick={() => {
                  if (deferredInstall) { onInstall(); handleClose(); }
                  else setShowIOSGuide(!showIOSGuide);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-accent-gold to-[#e8c97a] text-black rounded-xl font-black text-xs flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                {isRTL ? 'تثبيت مجاناً' : 'Install Free'}
              </button>

              {showIOSGuide && !deferredInstall && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 text-[10px] text-white/50 space-y-1 bg-black/30 p-3 rounded-xl"
                >
                  <p>⬆️ {isRTL ? 'اضغط زر المشاركة' : 'Tap Share button'}</p>
                  <p>➕ {isRTL ? 'إضافة للشاشة الرئيسية' : 'Add to Home Screen'}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function HomeClient({ latestCars: initialLatestCars }: HomeClientProps) {
  const [latestCars, setLatestCars] = useState<CarType[]>(initialLatestCars || []);
  const [loadingCars, setLoadingCars] = useState(initialLatestCars?.length === 0);

  useEffect(() => {
    if (latestCars.length === 0) {
      setLoadingCars(true);
      api.cars.list({ limit: 8, sort: 'createdAt:desc' })
        .then(res => {
          const data = res?.data || res;
          if (Array.isArray(data)) setLatestCars(data);
          else if (Array.isArray(data?.data)) setLatestCars(data.data);
        })
        .catch(err => console.error("Error fetching cars:", err))
        .finally(() => setLoadingCars(false));
    }
  }, []);

  const { isRTL } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const { socket, isConnected } = useSocket();
  const { siteInfo, homeContent, formatPrice, features } = useSettings();
  const { tenant } = useTenant();
  const isCarX = tenant?.id === 'carx';
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const [videoHeight, setVideoHeight] = useState<string>("55vh");
  const [deferredInstall, setDeferredInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // التحقق مما إذا كان التطبيق مسجلاً كمثبت في التخزين المحلي بعد تحميل الصفحة لتجنب خطأ Hydration
    if (typeof window !== 'undefined') {
      setIsInstalled(!!localStorage.getItem('pwa_installed'));
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredInstall(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);


  const handleInstallPWA = async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); localStorage.setItem('pwa_installed', '1'); }
    setDeferredInstall(null);
  };

  const router = useRouter();
  const isStandalone = useStandalone();

  useEffect(() => {
    // تم إيقاف التحويل التلقائي لكي يبقى العميل في واجهة التطبيق المجملة (AppHome)
    // if (isStandalone && isLoggedIn) {
    //   router.replace('/client/dashboard');
    // }
  }, [isStandalone, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && user && socket && isConnected) {
      const userId = (user as any)._id || (user as any).id;
      socket.emit('user_navigation', {
        userId,
        userName: user.name,
        page: isRTL ? 'الصفحة الرئيسية' : 'Home Page',
        timestamp: new Date()
      });
    }
  }, [isLoggedIn, user, socket, isConnected, isRTL]);

  useEffect(() => {
    const updateHeight = () => {
      const top = liveRef.current ? liveRef.current.offsetTop : 0;
      if (top > 0) setVideoHeight(`${top}px`);
      else setVideoHeight("85vh");
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const txt = {
    rights: isRTL ? "جميع الحقوق محفوظة" : "All Rights Reserved",
    privacy: isRTL ? "سياسة الخصوصية" : "Privacy Policy",
    terms: isRTL ? "شروط الاستخدام" : "Terms of Use",
  };

  // lucideIcons removed — icons now imported directly where needed


  const [socialConfig, setSocialConfig] = useState<{ whatsapp?: string; links: { platform: string; url: string }[] }>({
    whatsapp: '+821080880014',
    links: [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'snapchat', url: 'https://snapchat.com' },
    ]
  });

  useEffect(() => {
    const DEFAULT_WHATSAPP = '+821080880014';
    const DEFAULT_SOCIAL_LINKS = [
      { platform: 'instagram', url: 'https://instagram.com' },
      { platform: 'tiktok', url: 'https://tiktok.com' },
      { platform: 'snapchat', url: 'https://snapchat.com' },
    ];

    const fetchSocialLinks = async () => {
      try {
        const response = await api.settings.getPublic();
        if (response.success && response.data.socialLinks) {
          const sl = response.data.socialLinks;
          const linksArray = Object.entries(sl)
            .filter(([k, v]) => k !== 'whatsapp' && v && String(v).startsWith('http'))
            .map(([k, v]) => ({ platform: k, url: v as string }));

          setSocialConfig({
            whatsapp: sl.whatsapp || DEFAULT_WHATSAPP,
            links: linksArray.length > 0 ? linksArray : DEFAULT_SOCIAL_LINKS
          });
        }
      } catch (err) {
        console.error("Failed to fetch social links", err);
      }
    };
    fetchSocialLinks();
  }, []);

  // Social icons are now imported from @/components/SocialIcons

  const whatsappUrl = socialConfig.whatsapp ? `https://wa.me/${String(socialConfig.whatsapp).replace(/\D/g, '')}` : "#";

  if (isCarX) {
    return <CarXHome />;
  }

  return (
    <main ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-black text-white" dir={isRTL ? "rtl" : "ltr"}>
      <div className="hide-in-app">
        <Navbar />
      </div>

      {/* ── STICKY SOCIAL BAR (Visible only in Web) ── */}
      {!isStandalone && (
        <div className={cn(
          "fixed z-[90] flex flex-col gap-3 top-1/3",
          isRTL ? "right-4" : "left-4"
        )}>
          {socialConfig.whatsapp && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-green-500/30 flex items-center justify-center text-green-500 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.3)]" title="WhatsApp">
              <SocialIconMap.whatsapp className="w-6 h-6" />
            </a>
          )}
          {socialConfig.links.map((link, i) => {
            const SvgIcon = SocialIconMap[link.platform];
            const colorClass = SocialColorMap[link.platform] || 'text-white/80';
            return (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className={`w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:scale-110 hover:border-white/30 transition-transform ${colorClass}`} title={link.platform}>
                {SvgIcon ? <SvgIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
              </a>
            )
          })}
          {/* ── FLOATING PWA PHONE ICON ── */}
          {!isInstalled && (
            <PWAFloatingButton
              isRTL={isRTL}
              deferredInstall={deferredInstall}
              onInstall={handleInstallPWA}
            />
          )}

          {/* ── PERSISTENT CURRENCY SWITCHER ── */}
          <CurrencySwitcher variant="minimal" className="mt-2" />
        </div>
      )}

      {/* ── BACKGROUND LOGIC ── */}
      {!isStandalone ? (
        <CinematicVideoBackground
          videoSrc={homeContent?.heroVideoUrl || "/videos/hero.mp4"}
          fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
          mobileImage="/images/hmcar.jpg"
          overlayOpacity={0.55}
          height={videoHeight}
        />
      ) : null}

      {/* ── BACK TO TOP BUTTON ── - مخفي في وضع التطبيق لتجنب التحجب على شريط التنقل السفلي */}
      {!isStandalone && (
        <motion.button
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-2xl bg-accent-gold text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          title={isRTL ? 'الرجوع للأعلى' : 'Back to Top'}
        >
          <ArrowRight className="-rotate-90 w-5 h-5" />
        </motion.button>
      )}

      {/* ── CONTENT SWITCHER ── */}
      {isStandalone ? (
        // ── واجهة التطبيق الاحترافية (App Interface) ──
        <AppHome 
          isRTL={isRTL} 
          latestCars={latestCars} 
          formatPrice={formatPrice} 
        />
      ) : (
        // ── واجهة الموقع الاستعراضية (Web Showcase) ──
        <>
          {/* 1. HERO SHOWCASE */}
          <LandingShowcase isRTL={isRTL} latestCars={latestCars} />

          {/* 2. LATEST CARS SECTION (RESTORED) */}
          <section className="relative z-10 py-24 px-4 bg-gradient-to-b from-transparent to-black/20">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">
                    {isRTL ? 'أحدث السيارات' : 'LATEST ARRIVALS'}
                  </h2>
                  <div className="h-1 w-20 bg-accent-gold mt-2" />
                </div>
                <Link href="/gallery" className="group flex items-center gap-2 text-accent-gold font-bold uppercase tracking-widest hover:text-white transition-colors">
                  {isRTL ? 'عرض الكل' : 'VIEW ALL'}
                  <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-2", isRTL && "rotate-180 group-hover:-translate-x-2")} />
                </Link>
              </div>

              {loadingCars ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden animate-pulse">
                      <div className="h-52 bg-white/8" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 bg-white/8 rounded-lg w-3/4" />
                        <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                        <div className="h-8 bg-white/8 rounded-xl w-full mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {latestCars.slice(0, 8).map((car, i) => (
                    <ModernCarCard key={car.id || i} car={car as any} index={i} formatPrice={formatPrice} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── شريط "وصل حديثاً" - آخر 7 أيام ── */}
          {latestCars.length > 0 && (
            <section className="relative z-10 py-12 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-black text-green-400 uppercase tracking-widest">
                        {isRTL ? 'وصل حديثاً' : 'New Arrivals'}
                      </span>
                    </div>
                    <span className="text-white/30 text-xs">{isRTL ? 'آخر 7 أيام' : 'Last 7 days'}</span>
                  </div>
                  <Link href="/cars" className="text-xs font-bold text-accent-gold hover:text-white transition-colors flex items-center gap-1">
                    {isRTL ? 'عرض الكل' : 'View All'}
                    <ArrowRight className={cn("w-3.5 h-3.5", isRTL && "rotate-180")} />
                  </Link>
                </div>

                {/* شريط أفقي قابل للتمرير */}
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory">
                  {latestCars.slice(0, 12).map((car: any, i) => (
                    <motion.div
                      key={car.id || i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="snap-start shrink-0 w-52 sm:w-60 group cursor-pointer"
                      onClick={() => router.push(`/cars/${car.id || car._id}`)}
                    >
                      <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/3 hover:border-luxury-gold/30 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)]">
                        {/* صورة السيارة */}
                        <div className="relative h-36 overflow-hidden bg-white/5">
                          {car.images?.[0] ? (
                            <Image src={car.images[0]} alt={car.title || car.name || ''} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-10 h-10 text-white/10" />
                            </div>
                          )}
                          {/* شارة جديد */}
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-0.5 rounded-full bg-green-500 text-[9px] font-black text-black uppercase tracking-widest">
                              {isRTL ? 'جديد' : 'New'}
                            </span>
                          </div>
                        </div>
                        {/* بيانات السيارة */}
                        <div className="p-3 space-y-1.5">
                          <p className="text-xs font-black text-white truncate">{car.title || car.name}</p>
                          <div className="flex items-center gap-2 text-[9px] text-white/40 font-bold">
                            {car.year && <span>{car.year}</span>}
                            {car.mileage && <><span>·</span><span>{Number(car.mileage).toLocaleString()} km</span></>}
                          </div>
                          <div className="text-sm font-black text-luxury-gold">
                            {car.priceSar ? `${Number(car.priceSar).toLocaleString()} SAR` : car.price ? `${Number(car.price).toLocaleString()}` : '—'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 2.5 ANNOUNCEMENT RIBBON REMOVED: Replaced fully by SmartAdBanner */}

          {/* 4. LIVE MARKET TICKER - REMOVED: Now handled fully and robustly by SmartAdBanner */}
        </>
      )}

      {/* 4.5 الشريط الإعلاني الذكي المتحرك */}
      {(homeContent?.showAdvertising ?? true) && (
        <SmartAdBanner />
      )}

      {/* ── 5. THE BUYING JOURNEY - REMOVED AS REQUESTED ── */}

      {/* ── 5.1 PLATFORM FEATURES (DYNAMIC WITH FALLBACK) ── */}
      {(homeContent?.showPlatformFeatures ?? true) && (() => {
        const displayFeatures = features && features.length > 0 ? features : [
          { title: 'موثوقية تامة', titleEn: 'Absolute Trust', desc: 'سيارات مستوردة مفحوصة بالكامل مع ضمان الشفافية للمالك.', descEn: 'Fully inspected imported cars with transparency guaranteed.', icon: 'Shield' },
          { title: 'أسعار تنافسية', titleEn: 'Competitive Pricing', desc: 'مزادات حية تمنحك الأولوية للحصول على أفضل سعر بالسوق.', descEn: 'Live auctions giving you edge for the best market prices.', icon: 'Award' },
          { title: 'شحن عالمي', titleEn: 'Global Shipping', desc: 'نظام رقمي يتتبع مسار رحلة سيارتك حتى باب منزلك.', descEn: 'Digital system tracking your car journey to your doorstep.', icon: 'Globe' }
        ];

        return (
          <section className="relative z-10 py-32 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">{isRTL ? 'لماذا تختارنا؟' : 'WHY CHOOSE US?'}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {displayFeatures.slice(0, 6).map((feat, i) => {
                  const Icon = (lucideIcons as any)[feat.icon] || Shield;
                  return (
                    <div key={i} className="p-10 rounded-[3rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                      <div className="w-16 h-16 rounded-2xl bg-accent-gold/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                        <Icon className="w-8 h-8 text-accent-gold" />
                      </div>
                      <h4 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">{isRTL ? feat.title : (feat.titleEn || feat.title)}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{isRTL ? feat.desc : (feat.descEn || feat.desc)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        );
      })()}


      {/* ── 6. قسم المزادات الحالية ── */}
      {!isStandalone && (
        <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-black/0 to-black/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                      {isRTL ? 'مزادات حية' : 'LIVE AUCTIONS'}
                    </span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                  {isRTL ? 'المزادات الجارية' : 'ACTIVE AUCTIONS'}
                </h2>
                <div className="h-1 w-16 bg-red-500 mt-2" />
              </div>
              <Link
                href="/auctions"
                className="group flex items-center gap-2 text-red-400 font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                {isRTL ? 'عرض الكل' : 'VIEW ALL'}
                <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-2", isRTL && "rotate-180 group-hover:-translate-x-2")} />
              </Link>
            </div>

            {/* بطاقات المزادات */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-red-500/30 transition-all duration-300"
                >
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[9px] font-black text-red-400 uppercase">{isRTL ? 'جارٍ' : 'LIVE'}</span>
                  </div>
                  <div className="h-44 bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center">
                    <Gavel className="w-12 h-12 text-white/10" />
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-sm font-black text-white">{isRTL ? `مزاد سيارة #${i}00${i}` : `Vehicle Auction #${i}00${i}`}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-accent-gold">
                        <Timer className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">24:00:00</span>
                      </div>
                      <span className="text-xs font-bold text-white/50">{isRTL ? 'السعر الحالي' : 'Current Bid'}</span>
                    </div>
                    <Link
                      href="/auctions"
                      className="block w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs font-black text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      {isRTL ? 'المزايدة الآن' : 'BID NOW'}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA للمزادات */}
            <div className="mt-8 text-center">
              <Link
                href="/auctions"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-white transition-all"
              >
                <Gavel className="w-5 h-5" />
                {isRTL ? 'تصفح جميع المزادات' : 'BROWSE ALL AUCTIONS'}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. قسم قطع الغيار ── */}
      {!isStandalone && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Wrench className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
                      {isRTL ? 'متجر قطع الغيار' : 'PARTS STORE'}
                    </span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                  {isRTL ? 'قطع الغيار' : 'SPARE PARTS'}
                </h2>
                <div className="h-1 w-16 bg-amber-500 mt-2" />
              </div>
              <Link
                href="/parts"
                className="group flex items-center gap-2 text-amber-400 font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                {isRTL ? 'عرض الكل' : 'VIEW ALL'}
                <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-2", isRTL && "rotate-180 group-hover:-translate-x-2")} />
              </Link>
            </div>

            {/* فئات قطع الغيار */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { icon: Layers, label: isRTL ? 'محركات' : 'Engines', color: '#f97316' },
                { icon: Package, label: isRTL ? 'هيكل' : 'Body Parts', color: '#eab308' },
                { icon: Wrench, label: isRTL ? 'فرامل' : 'Brakes', color: '#ef4444' },
                { icon: Zap, label: isRTL ? 'كهربائي' : 'Electrical', color: '#60a5fa' },
                { icon: Cog, label: isRTL ? 'علبة تروس' : 'Transmission', color: '#a78bfa' },
                { icon: TrendingUp, label: isRTL ? 'عروض' : 'Deals', color: '#34d399' },
              ].map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  className="group cursor-pointer"
                >
                  <Link href="/parts">
                    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.06] transition-all text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                        style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                      >
                        <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{cat.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* CTA قطع الغيار */}
            <div className="p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 text-center">
              <Wrench className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-xl font-black text-white mb-2">
                {isRTL ? 'تحتاج قطعة غيار محددة؟' : 'Need a Specific Part?'}
              </h3>
              <p className="text-white/40 text-sm mb-5">
                {isRTL ? 'استخدم نظام الاستيراد الذكي أو تواصل معنا مباشرة' : 'Use our smart import system or contact us directly'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/parts"
                  className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                >
                  {isRTL ? 'تصفح المتجر' : 'Browse Store'}
                </Link>
                <Link
                  href="/concierge"
                  className="px-6 py-3 rounded-xl bg-accent-gold text-black font-black text-sm uppercase tracking-widest hover:bg-accent-gold/90 transition-all"
                >
                  {isRTL ? 'طلب مخصص' : 'Custom Order'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 8. قسم الدعوة للانضمام ── */}
      {!isStandalone && (
        <section className="relative z-10 py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-10 sm:p-16 rounded-[2.5rem] border border-accent-gold/20 bg-gradient-to-br from-accent-gold/5 to-transparent overflow-hidden"
            >
              {/* خلفية ديكورية */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-accent-gold/10 blur-[80px]" />
                <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full bg-accent-gold/5 blur-[80px]" />
              </div>

              <Sparkles className="w-10 h-10 text-accent-gold mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                {isRTL ? 'ابدأ اليوم' : 'START TODAY'}
              </h2>
              <p className="text-white/50 text-base mb-8 max-w-xl mx-auto">
                {isRTL
                  ? 'انضم إلى آلاف العملاء الذين يثقون في منصتنا لاستيراد سياراتهم وقطع الغيار بأفضل الأسعار'
                  : 'Join thousands of clients who trust our platform for importing vehicles and parts at the best prices'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-xl bg-accent-gold text-black font-black text-sm uppercase tracking-widest hover:bg-accent-gold/90 transition-all shadow-lg shadow-accent-gold/20"
                >
                  {isRTL ? 'إنشاء حساب مجاني' : 'CREATE FREE ACCOUNT'}
                </Link>
                <Link
                  href="/gallery"
                  className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  {isRTL ? 'تصفح المعرض' : 'BROWSE GALLERY'}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── 9. دليل الماركات: تم حذفه حسب الطلب ── */}






      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-24 px-4 border-t border-white/10 bg-black hide-in-app">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-20 text-center md:text-left">
            <div>
              <h3 className="text-3xl font-black text-accent-gold italic uppercase tracking-tighter mb-4">{siteInfo?.siteName || 'HM CAR'}</h3>
              <p className="text-white/40 text-sm max-w-sm">{isRTL ? 'وجهتك الأولى للسيارات الفاخرة الكورية.' : 'Your premier destination for Korean luxury cars.'}</p>
            </div>
            <div className="flex gap-4">
              {socialConfig.whatsapp && (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 rounded-2xl border border-green-500/30 flex items-center justify-center text-green-400 bg-green-500/5 hover:bg-green-500/10 transition-all"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  {(() => {
                    const WhatsAppIcon = SocialIconMap.whatsapp;
                    return WhatsAppIcon ? <WhatsAppIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />;
                  })()}
                </a>
              )}
              {socialConfig.links.map((link, i) => {
                const SvgIcon = SocialIconMap[link.platform];
                const colorClass = SocialColorMap[link.platform] || 'text-white/40';
                return (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all ${colorClass}`}
                    aria-label={link.platform}
                    title={link.platform}
                  >
                    {SvgIcon ? <SvgIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                  </a>
                )
              })}
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-[10px] font-black uppercase tracking-widest">
             <p>© 2026 {siteInfo?.siteName || 'HM CAR'}. {txt.rights}.</p>
             <div className="flex gap-8">
               <Link href="#" className="hover:text-accent-gold transition-colors">{txt.privacy}</Link>
               <Link href="#" className="hover:text-accent-gold transition-colors">{txt.terms}</Link>
             </div>
          </div>
        </div>
      </footer>



    </main>
  );
}
