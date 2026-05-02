'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Menu, X, Home, Car, Wrench, Building2, User, LogOut, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { isRTL } = useLanguage();
  const { user, isLoggedIn, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '/', label: isRTL ? 'الرئيسية' : 'Home', icon: Home },
    { href: '/showroom', label: isRTL ? 'المعرض' : 'Showroom', icon: Car },
    { href: '/parts', label: isRTL ? 'قطع الغيار' : 'Parts', icon: Wrench },
    { href: '/brands', label: isRTL ? 'الماركات' : 'Brands', icon: Building2 },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled
            ? 'rgba(0,0,0,0.85)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Red top accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-red-600 to-transparent" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            <Link href="/" className="group flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 15 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative w-10 h-10"
                style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/50">
                  <Zap className="w-5 h-5 text-white" fill="white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
              </motion.div>
              <div>
                <span className="text-2xl font-black tracking-tight">
                  <span className="text-white">CAR</span>
                  <span className="text-red-500"> X</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'text-white'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="navActive"
                          className="absolute inset-0 bg-white/10 rounded-xl border border-white/20"
                          style={{
                            boxShadow: '0 0 20px rgba(220,38,38,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                          }}
                        />
                      )}
                      <item.icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-red-400' : ''}`} />
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <span className="relative z-10 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/80 text-sm">{user?.name}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      boxShadow: '0 4px 20px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    <User className="w-4 h-4" />
                    <span>{isRTL ? 'تسجيل الدخول' : 'Login'}</span>
                  </motion.div>
                </Link>
              )}
            </div>

            {/* Mobile Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)' }}
            >
              <div className="px-6 py-4 space-y-1 border-t border-white/10">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        pathname === item.href
                          ? 'bg-red-600/20 text-white border border-red-500/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${pathname === item.href ? 'text-red-400' : ''}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                <div className="pt-3 border-t border-white/10">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-3 text-white/70">
                        <User className="w-5 h-5" />
                        <span>{user?.name}</span>
                      </div>
                      <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{isRTL ? 'تسجيل الخروج' : 'Logout'}</span>
                      </button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white font-bold">
                        <User className="w-5 h-5" />
                        <span>{isRTL ? 'تسجيل الدخول' : 'Login'}</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}