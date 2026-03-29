'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Car, Wrench, Building2, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { isRTL, t } = useLanguage();
  const { user, isLoggedIn, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/showroom', label: t('showroom'), icon: Car },
    { href: '/parts', label: t('parts'), icon: Wrench },
    { href: '/brands', label: t('brands'), icon: Building2 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-lg">X</span>
            </div>
            <span className="text-xl font-black text-white">CAR X</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-white/70" />
                  <span className="text-white/70 text-sm">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-white/70 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span>{t('login')}</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10"
            >
              <div className="py-4 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 text-white/70 hover:text-white transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                
                {isLoggedIn ? (
                  <div className="pt-4 border-t border-white/10 space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-white/70" />
                      <span className="text-white/70">{user?.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="flex items-center space-x-3 text-white/70 hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/10">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 text-white/70 hover:text-white transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>{t('login')}</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}