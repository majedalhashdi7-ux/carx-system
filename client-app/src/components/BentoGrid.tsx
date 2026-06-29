"use client";

/**
 * شبكة التصنيف الجذابة (Bento Grid)
 * تعرض فئات الموقع (قطع غيار، سيارات، عروض، مزادات) بتنسيق هندسي عصري.
 * يتميز بصور خلفية عالية الجودة وتأثيرات حركية عند التمرير (Scroll Reveal).
 */

import { motion } from "framer-motion";
import { Wrench, Car, Tag, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function BentoGrid() {
    const { isRTL } = useLanguage();

    return (
        <section className="py-16 px-4 md:py-24 md:px-6 bg-transparent relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#c9a96e]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 text-white tracking-tight">
                        {isRTL ? "استكشف الفئات" : "Explore Categories"}
                    </h2>
                    <p className="text-white/40 max-w-2xl mx-auto text-lg">
                        {isRTL ? "تصفح مجموعتنا الواسعة من السيارات وقطع الغيار والعروض الحصرية" : "Browse our extensive collection of cars, spare parts, and exclusive offers"}
                    </p>
                </motion.div>

                {/* ── شبكة بينتو (Bento Grid) ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                    {/* Item 1: Cars for Sale (Showroom) - Large 3x2 */}
                    <motion.div
                        className="md:col-span-3 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black border border-white/10"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-700 md:group-hover:scale-110 md:transition-transform md:duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        <div className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/10 group-hover:bg-[#c9a96e] group-hover:text-black transition-colors duration-300">
                            <ArrowUpRight className="w-6 h-6 text-white group-hover:text-black" />
                        </div>

                        <div className="absolute bottom-0 left-0 p-10 w-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-[#c9a96e] flex items-center justify-center">
                                    <Car className="w-6 h-6 text-black" />
                                </div>
                                <span className="text-[#c9a96e] text-xs font-bold uppercase tracking-widest">
                                    {isRTL ? "معرض السيارات الكورية" : "Korean Car Showroom"}
                                </span>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-4 group-hover:translate-x-2 transition-transform duration-300">
                                {isRTL ? "أحدث الموديلات المستوردة مباشرة" : "Latest Directly Imported Vehicles"}
                            </h3>
                            <p className="text-white/60 mb-6 max-w-md line-clamp-2 md:line-clamp-none group-hover:text-white/80 transition-colors">
                                {isRTL
                                    ? "تصفح واشترِ أحدث السيارات المستوردة من كوريا الجنوبية مباشرة وبأفضل الأسعار."
                                    : "Browse and buy the latest cars imported directly from South Korea at the best rates."}
                            </p>
                            <Link href="/showroom">
                                <button className="px-8 py-3 bg-white/10 hover:bg-[#c9a96e] hover:text-black text-white font-bold rounded-xl backdrop-blur-md border border-white/20 hover:border-[#c9a96e] transition-all duration-300 flex items-center gap-2 group-hover:translate-x-2">
                                    {isRTL ? "عرض المعرض الكوري" : "View Korean Showroom"}
                                    <ArrowRight className="w-4 h-4 group-hover:ml-2 transition-all" />
                                </button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Item 2: Special VIP request (Concierge) - 1x1 */}
                    <motion.div
                        className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-[#c9a96e] border border-[#c9a96e]"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

                        <div className="relative p-8 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <Tag className="w-8 h-8 text-black" />
                                <span className="px-3 py-1 bg-black text-[#c9a96e] text-[10px] font-bold uppercase rounded-full">
                                    {isRTL ? "طلب خاص" : "VIP"}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-black mb-1">
                                    {isRTL ? "طلب سيارة خاصة" : "Custom Request"}
                                </h3>
                                <Link href="/concierge" className="text-black/70 font-bold uppercase text-[10px] tracking-wider hover:text-black flex items-center gap-1.5 transition-colors">
                                    {isRTL ? "اطلب الآن" : "Request Now"} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Item 3: Live Auctions (1x1) */}
                    <motion.div
                        className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-35 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                        <div className="relative p-8 h-full flex flex-col justify-end">
                            <div className="absolute top-8 right-8">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {isRTL ? "المزادات الحية" : "Live Auctions"}
                            </h3>
                            <Link href="/auctions" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-[#c9a96e] transition-colors flex items-center gap-2">
                                {isRTL ? "زايد الآن" : "Bid Now"} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
