'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, ShoppingCart, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المعرض', href: '/showroom' },
    { name: 'من نحن', href: '/about' },
    { name: 'اتصل بنا', href: '/contact' },
    { name: 'لوحة التحكم', href: '/admin' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'py-4' : 'py-8'
    }`}>
      <div className="container mx-auto px-6">
        <div className={`glass-panel rounded-[2rem] px-8 py-4 flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'bg-white/5'
        }`}>
          
          {/* Logo */}
          <Link href="/" className="group relative z-10">
            <span className="text-3xl font-black tracking-tighter text-white">
              CAR<span className="text-luxury-gold group-hover:text-white transition-colors duration-500">X</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-sm font-bold text-white/70 hover:text-luxury-gold transition-all duration-300 uppercase tracking-widest relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-luxury-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <Search className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all">
              <User className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <Link href="/showroom" className="bg-white text-black px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-luxury-gold transition-all duration-500 transform hover:scale-105">
              استكشف الآن
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 right-0 mt-4 px-6"
          >
            <div className="glass-panel rounded-[2rem] p-8 space-y-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="block text-xl font-bold text-white/70 hover:text-luxury-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/10">
                <Link href="/showroom" className="block w-full bg-white text-black py-4 rounded-2xl font-black text-center">
                  المعرض الحصري
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
