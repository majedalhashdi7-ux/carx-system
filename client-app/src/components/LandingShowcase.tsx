/**
 * واجهة العرض الرئيسية (Landing Showcase)
 * أول ما يراه المستخدم في الموقع (البوابة الرئيسية).
 * تعرض الأقسام الثلاثة الكبرى: السيارات، قطع الغيار، وخدمات المزادات.
 * تتميز بتأثيرات بصرية سينمائية (أشعة نيون، حركات انسابية، وتصاميم زجاجية).
 */
import { motion } from "framer-motion";
import { Wrench, Gavel, ArrowRight, Car, Shield, Globe, Award, Sparkles, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/SettingsContext";

interface LandingShowcaseProps {
    isRTL: boolean;
    latestCars?: Array<{
        id?: string;
        title?: string;
        make?: { name?: string } | string;
        model?: string;
        images?: string[];
    }>;
}

export default function LandingShowcase({ isRTL }: LandingShowcaseProps) {
    const router = useRouter();
    const { homeContent } = useSettings();

    const cards = [
        {
            title: isRTL ? "سيارات للبيع" : "Cars for Sale",
            description: isRTL ? "اكتشف مجموعتنا الحصرية" : "Discover our exclusive collection",
            icon: Car,
            key: "cars",
            color: "from-blue-500/20 to-blue-600/5",
            border: "group-hover:border-blue-500/50",
            glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
            iconColor: "text-blue-400"
        },
        {
            title: isRTL ? "دخول المزادات" : "Enter Auctions",
            description: isRTL ? "زايد الآن على سيارات أحلامك" : "Bid now on your dream cars",
            icon: Gavel,
            key: "auctions",
            color: "from-[#c9a96e]/20 to-[#c9a96e]/5",
            border: "group-hover:border-[#c9a96e]/50",
            glow: "group-hover:shadow-[0_0_30px_rgba(201,169,110,0.3)]",
            iconColor: "text-[#c9a96e]"
        }
    ];

    // الإحصائيات والأرقام المميزة لـ HM CAR
    const stats = [
        { icon: Car, val: isRTL ? "+٥,٥٠٠" : "+5,500", label: isRTL ? "سيارة متاحة يومياً" : "Cars Available Daily" },
        { icon: Users, val: isRTL ? "+١٢,٠٠٠" : "+12,000", label: isRTL ? "عميل راضٍ" : "Happy Clients" },
        { icon: Award, val: isRTL ? "+١٠ سنوات" : "+10 Years", label: isRTL ? "خبرة في التصدير كوري" : "Korean Export Experience" },
        { icon: Globe, val: isRTL ? "١٠٠٪" : "100%", label: isRTL ? "شحن آمن ومضمون" : "Secure Global Shipping" }
    ];

    // لماذا نحن؟
    const whyUs = [
        { icon: Shield, title: isRTL ? "فحص فني شامل" : "Comprehensive Inspection", desc: isRTL ? "جميع السيارات تفحص بدقة في كوريا قبل الشحن لضمان السلامة." : "All vehicles are rigorously checked in Korea before shipping." },
        { icon: TrendingUp, title: isRTL ? "أسعار تنافسية واقعية" : "Realistic Prices", desc: isRTL ? "نقدم أسعاراً حقيقية ومباشرة بدون عمولات خفية من المزادات." : "We offer real, direct prices without hidden auction fees." },
        { icon: Sparkles, title: isRTL ? "تتبع فوري ومستمر" : "Real-time Tracking", desc: isRTL ? "تحديثات لحظية حول مسار الشحن والتخليص الجمركي لسيارتك." : "Live updates on shipping routes and customs clearance." }
    ];

    return (
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 overflow-hidden bg-black/40">
            {/* ── CINEMATIC PATHWAYS (NEON BEAMS) ── */}
            <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent rotate-[30deg]"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-cinematic-neon-blue/20 to-transparent rotate-[-45deg]"
                />
            </div>

            {/* ── GATEWAY TITLE ── */}
            <motion.div
                className="text-center z-20 mb-16 pt-24 sm:pt-36"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
            >
                <div className="relative inline-block mb-4">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full"
                    />
                    <h1 className="text-3xl sm:text-6xl md:text-8xl font-black font-display tracking-tighter text-white relative uppercase">
                        {homeContent?.heroTitle || (
                            <>
                                HM <span className="text-transparent bg-clip-text bg-gradient-to-b from-accent-gold to-[#8b7355]">CAR</span>
                            </>
                        )}
                    </h1>
                </div>
                <p className="text-base md:text-xl text-white/50 font-light tracking-[0.2em] uppercase max-w-2xl mx-auto px-6">
                    {homeContent?.heroSubtitle || (isRTL ? "استيراد السيارات من كوريا بأمان وبأفضل الأسعار" : "Importing Cars from Korea Securely & at Best Rates")}
                </p>

                {/* ── LOGIN BUTTON ── */}
                <motion.div
                    className="mt-8 flex justify-center relative z-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    <Link
                        href="/login"
                        className="relative inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs text-black bg-[#D4AF37] hover:bg-[#c9a030] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="relative z-10">
                            {isRTL ? "تسجيل الدخول / إنشاء حساب" : "LOGIN / REGISTER"}
                        </span>
                        <ArrowRight className={cn("relative z-10 w-4 h-4 transition-transform", isRTL && "rotate-180")} />
                    </Link>
                </motion.div>
            </motion.div>

            {/* ── CINEMATIC GATEWAY GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-20 px-6 mb-16">
                {cards.map((card, index) => (
                    <motion.button
                        key={index}
                        onClick={() => {
                            if (card.key === 'cars') router.push('/cars');
                            else if (card.key === 'auctions') router.push('/auctions');
                        }}
                        className="group relative"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.2, duration: 1 }}
                    >
                        <div className="absolute inset-0 -z-10 bg-black rounded-3xl border border-white/5 transition-all duration-500 group-hover:border-white/20 shadow-2xl" />

                        <div className={cn(
                            "relative overflow-hidden rounded-3xl p-8 h-80 flex flex-col items-center justify-center text-center transition-all duration-500",
                            "bg-white/[0.02] backdrop-blur-xl",
                            "group-hover:translate-y-[-5px]"
                        )}>
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-b",
                                card.color
                            )} />

                            <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative mb-6"
                            >
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center bg-black/40 border border-white/10 relative z-10 transition-all duration-500 group-hover:border-accent-gold/50 shadow-xl",
                                    card.iconColor
                                )}>
                                    <card.icon className="w-9 h-9" />
                                </div>
                            </motion.div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-accent-gold transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-white/40 text-xs tracking-wider">
                                    {card.description}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                                <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">
                                    {isRTL ? "اضغط للدخول" : "ACCESS NOW"}
                                </span>
                                <ArrowRight className={cn("w-3.5 h-3.5 text-accent-gold", isRTL && "rotate-180")} />
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* ── NUMBERS / STATS SECTION ── */}
            <motion.div 
                className="w-full max-w-5xl z-20 px-6 mb-16 border-t border-white/5 pt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {stats.map((st, i) => {
                        const Icon = st.icon;
                        return (
                            <div key={i} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 backdrop-blur-md">
                                <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center mx-auto mb-3">
                                    <Icon className="w-4 h-4 text-luxury-gold" />
                                </div>
                                <div className="text-2xl md:text-3xl font-black text-white italic mb-1">{st.val}</div>
                                <div className="text-[10px] font-bold text-white/40 tracking-wider uppercase">{st.label}</div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── WHY CHOOSE HM CAR? ── */}
            <motion.div 
                className="w-full max-w-5xl z-20 px-6 pb-24 border-t border-white/5 pt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
            >
                <h2 className="text-center text-xl md:text-2xl font-black text-white italic uppercase tracking-wider mb-8">
                    {isRTL ? "لماذا تختار HM CAR للاستيراد؟" : "Why Choose HM CAR?"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {whyUs.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4 items-start">
                                <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-luxury-gold" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xs font-black text-white">{item.title}</h3>
                                    <p className="text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
