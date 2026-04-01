"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, ChevronDown } from "lucide-react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollytellingHeroProps {
  isRTL?: boolean;
}

// Main Scrollytelling Component
export default function ScrollytellingHero({ isRTL = true }: ScrollytellingHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const textContent = {
    subtitle: isRTL ? "منصة المزادات الفاخرة" : "Luxury Auction Platform",
    scrollPrompt: isRTL ? "مرر للاستكشاف" : "Scroll to Explore",
    discover: isRTL ? "اكتشف" : "Discover",
    luxury: isRTL ? "الفخامة" : "Luxury",
    performance: isRTL ? "الأداء" : "Performance",
    future: isRTL ? "المستقبل" : "The Future",
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Smoother scrubbing
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    }, containerRef);

    setIsLoaded(true);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-[400vh]">
      {/* Sticky Canvas Area */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">

        {/* UI Overlay - "Glowy" & "Bold" */}
        <div className="absolute inset-0 z-10 pointer-events-none select-none">

          {/* Top Badge */}
          <motion.div
            className="absolute top-24 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
            transition={{ duration: 1 }}
          >
            <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-[#c9a96e]/50 bg-black/40 backdrop-blur-xl shadow-[0_0_30px_rgba(201,169,110,0.3)]">
              <Sparkles className="w-5 h-5 text-[#c9a96e] animate-pulse" />
              <span className="text-sm font-bold text-[#c9a96e] tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(201,169,110,0.8)]">
                {textContent.subtitle}
              </span>
            </div>
          </motion.div>

          {/* Dynamic Text Overlay based on Scroll Progress */}

          {/* Section 1: Discover Luxury */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 px-4 md:px-16 flex flex-col items-start">
            <motion.div
              className="max-w-4xl"
              style={{
                opacity: Math.max(0, 1 - scrollProgress * 3),
                y: scrollProgress * -100
              }}
            >
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e8dcb5] to-[#c9a96e] mb-4 font-display leading-[1.1] drop-shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                {textContent.discover}
              </h1>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white font-display leading-[1.1]" style={{ textShadow: "0 0 50px rgba(255,255,255,0.3)" }}>
                {textContent.luxury}
              </h1>
            </motion.div>
          </div>

          {/* Section 2: Performance (Appears mid-scroll) */}
          <motion.div
            className="absolute top-1/2 right-0 w-full -translate-y-1/2 px-4 md:px-16 flex flex-col items-end text-right"
            style={{
              opacity: Math.max(0, Math.min(1, (scrollProgress - 0.2) * 4) - (scrollProgress - 0.6) * 4),
            }}
          >
            <h2 className="text-5xl md:text-8xl font-black text-white font-display drop-shadow-[0_0_40px_rgba(201,169,110,0.5)]">
              {textContent.performance}
            </h2>
          </motion.div>

          {/* Section 3: The Future (Appears end-scroll) */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full"
            style={{
              opacity: Math.max(0, (scrollProgress - 0.7) * 4),
              scale: 0.8 + scrollProgress * 0.2
            }}
          >
            <h2 className="text-5xl md:text-8xl font-black text-[#c9a96e] font-display drop-shadow-[0_0_60px_rgba(201,169,110,0.8)]">
              {textContent.future}
            </h2>
          </motion.div>

          {/* Scroll Prompt */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            animate={{ opacity: scrollProgress > 0.1 ? 0 : 1 }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-white/70 font-bold drop-shadow-md">
              {textContent.scrollPrompt}
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-[#c9a96e] drop-shadow-[0_0_10px_rgba(201,169,110,1)]" />
            </motion.div>
          </motion.div>

          {/* Progress Bar (Vertical) */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 h-64 w-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="w-full bg-[#c9a96e] shadow-[0_0_20px_#c9a96e]"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

        </div>
      </div>

      {/* Invisible spacers to create scroll height */}
      <div className="h-screen" />
      <div className="h-screen" />
      <div className="h-screen" />
    </div>
  );
}
