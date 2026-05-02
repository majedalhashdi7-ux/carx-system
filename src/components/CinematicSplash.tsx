'use client';

/**
 * CinematicSplash - شاشة ترحيب سينمائية مذهلة
 * تجربة دخول استثنائية تفوق الخيال
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Star, Crown } from 'lucide-react';

interface CinematicSplashProps {
  onComplete: () => void;
}

export default function CinematicSplash({ onComplete }: CinematicSplashProps) {
  const [stage, setStage] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // إنشاء جسيمات عشوائية
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    // تسلسل العرض
    const timers = [
      setTimeout(() => setStage(1), 500),      // شعار يظهر
      setTimeout(() => setStage(2), 1500),     // نص يظهر
      setTimeout(() => setStage(3), 2500),     // تأثيرات إضافية
      setTimeout(() => setStage(4), 3500),     // بداية الاختفاء
      setTimeout(() => onComplete(), 4500),    // انتهاء
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] overflow-hidden"
      >
        {/* خلفية متدرجة متحركة */}
        <div className="absolute inset-0 bg-black">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.3) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* شبكة خلفية متحركة */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* جسيمات متطايرة */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-red-400 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              scale: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
              y: [0, -50, -100],
            }}
            transition={{
              duration: 3,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* خطوط ضوئية متحركة */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(220, 38, 38, 0.1) 50%, transparent 100%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* المحتوى الرئيسي */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {/* الشعار الرئيسي */}
            <motion.div
              initial={{ scale: 0, rotateY: -180 }}
              animate={stage >= 1 ? { 
                scale: [0, 1.2, 1],
                rotateY: 0,
              } : {}}
              transition={{
                duration: 1,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative mb-8"
            >
              {/* هالة مضيئة خلف الشعار */}
              <motion.div
                className="absolute inset-0 -m-20"
                animate={{
                  boxShadow: [
                    '0 0 60px 20px rgba(220, 38, 38, 0.3)',
                    '0 0 100px 40px rgba(220, 38, 38, 0.5)',
                    '0 0 60px 20px rgba(220, 38, 38, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* الشعار */}
              <div className="relative">
                <motion.div
                  animate={stage >= 3 ? {
                    rotate: [0, 5, -5, 0],
                  } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: 2,
                  }}
                >
                  <h1 className="text-9xl font-black tracking-tighter">
                    <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent drop-shadow-2xl">
                      CAR
                    </span>
                    <span className="text-white drop-shadow-2xl"> X</span>
                  </h1>
                </motion.div>

                {/* أيقونات متحركة حول الشعار */}
                {stage >= 2 && (
                  <>
                    <motion.div
                      className="absolute -top-8 -right-8"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        y: [0, -10, 0],
                      }}
                      transition={{
                        scale: { duration: 0.5 },
                        rotate: { duration: 0.5 },
                        y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                      }}
                    >
                      <Crown className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
                    </motion.div>

                    <motion.div
                      className="absolute -bottom-8 -left-8"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        y: [0, 10, 0],
                      }}
                      transition={{
                        scale: { duration: 0.5, delay: 0.1 },
                        rotate: { duration: 0.5, delay: 0.1 },
                        y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                      }}
                    >
                      <Zap className="w-12 h-12 text-red-400 drop-shadow-lg" />
                    </motion.div>

                    <motion.div
                      className="absolute top-1/2 -left-16 -translate-y-1/2"
                      initial={{ scale: 0, x: -50 }}
                      animate={{ 
                        scale: 1, 
                        x: 0,
                        rotate: [0, 360],
                      }}
                      transition={{
                        scale: { duration: 0.5, delay: 0.2 },
                        x: { duration: 0.5, delay: 0.2 },
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      }}
                    >
                      <Star className="w-10 h-10 text-blue-400 drop-shadow-lg" />
                    </motion.div>

                    <motion.div
                      className="absolute top-1/2 -right-16 -translate-y-1/2"
                      initial={{ scale: 0, x: 50 }}
                      animate={{ 
                        scale: 1, 
                        x: 0,
                        rotate: [0, -360],
                      }}
                      transition={{
                        scale: { duration: 0.5, delay: 0.3 },
                        x: { duration: 0.5, delay: 0.3 },
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      }}
                    >
                      <Sparkles className="w-10 h-10 text-purple-400 drop-shadow-lg" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>

            {/* النص الترحيبي */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={stage >= 2 ? { 
                opacity: 1, 
                y: 0,
              } : {}}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
            >
              <motion.p
                className="text-2xl md:text-3xl font-bold text-white mb-2"
                animate={{
                  textShadow: [
                    '0 0 10px rgba(255, 255, 255, 0.5)',
                    '0 0 20px rgba(255, 255, 255, 0.8)',
                    '0 0 10px rgba(255, 255, 255, 0.5)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                مرحباً بك في عالم السيارات الفاخرة
              </motion.p>
              
              <motion.p
                className="text-lg text-gray-400"
                initial={{ opacity: 0 }}
                animate={stage >= 2 ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                تجربة استثنائية تفوق الخيال
              </motion.p>
            </motion.div>

            {/* شريط التحميل */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={stage >= 2 ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <div className="w-64 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{
                    duration: 3.5,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              
              <motion.p
                className="text-sm text-gray-500 mt-3"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                جاري تحضير تجربتك المميزة...
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* تأثير الانفجار عند الانتهاء */}
        {stage >= 4 && (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-red-500/50 via-transparent to-transparent" />
          </motion.div>
        )}

        {/* موجات ضوئية متوسعة */}
        {stage >= 3 && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-red-500/30 rounded-full"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ 
                  width: 1000, 
                  height: 1000, 
                  opacity: 0,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
