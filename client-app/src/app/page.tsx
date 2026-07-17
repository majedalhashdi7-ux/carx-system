'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Car, Wrench, Gavel, ShieldCheck, Globe, Sparkles, Star, HelpCircle, Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
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
    const { formatPriceFromUsd } = useSettings();

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
                </motion.div>
            </header>

            {/* ─── Shipping Cost Calculator Section ─── */}
            <section className="py-20 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent border-y border-white/5 relative z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase">
                            {isRTL ? 'حاسبة التكلفة الفورية' : 'SHIPPING RATE CALCULATOR'}
                        </span>
                        <h2 className="text-3xl font-black tracking-tight mt-2">
                            {isRTL ? 'احسب تكلفة شحن سيارتك من كوريا' : 'Calculate Shipping From Korea'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#101018] border border-white/6 rounded-3xl p-6 sm:p-10 shadow-2xl">
                        {/* Selector fields */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                                    {isRTL ? 'الدولة المستهدفة' : 'Destination Country'}
                                </label>
                                <select 
                                    value={countryCode} 
                                    onChange={(e) => {
                                        setCountryCode(e.target.value as any);
                                        setPortIndex(0);
                                    }}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E]/50"
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code} className="bg-[#111118]">
                                            {isRTL ? c.nameAr : c.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                                    {isRTL ? 'ميناء الوصول' : 'Destination Port'}
                                </label>
                                <select 
                                    value={portIndex} 
                                    onChange={(e) => setPortIndex(Number(e.target.value))}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A96E]/50"
                                >
                                    {availablePorts.map((p, idx) => (
                                        <option key={idx} value={idx} className="bg-[#111118]">
                                            {isRTL ? p.nameAr : p.nameEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                                    {isRTL ? 'حجم وفئة السيارة' : 'Car Size & Class'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CAR_SIZES.map((size, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCarSizeIndex(idx)}
                                            className={cn(
                                                "p-3 rounded-xl border text-center transition-all text-xs font-bold",
                                                carSizeIndex === idx 
                                                    ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" 
                                                    : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                                            )}
                                        >
                                            {isRTL ? size.nameAr.split(' ')[0] : size.nameEn}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Result Output Card */}
                        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group min-h-[250px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E]/5 rounded-full blur-2xl group-hover:bg-[#C9A96E]/10 transition-all" />
                            <Globe className="w-8 h-8 text-[#C9A96E] mb-4 animate-pulse" />
                            
                            <span className="cockpit-mono text-[9px] text-white/40 uppercase tracking-[0.3em] mb-1">
                                {isRTL ? 'تكلفة الشحن التقديرية' : 'ESTIMATED SHIPPING COST'}
                            </span>
                            <div className="text-3xl sm:text-4xl font-black text-[#C9A96E] cockpit-num mb-2">
                                {formatPriceFromUsd(totalUsd)}
                            </div>
                            <p className="text-[10px] text-white/30 text-center leading-relaxed max-w-[240px]">
                                {isRTL 
                                    ? '* تشمل التكلفة الشحن البحري من كوريا وإعداد المستندات الجمركية الرسمية للتصدير.'
                                    : '* Rate includes ocean shipping from Korea and customs document preparation.'}
                            </p>
                        </div>
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
        </div>
    );
}
