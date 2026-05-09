'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Car, Home as HomeIcon, Settings, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/', label: 'الرئيسية', icon: HomeIcon },
    { href: '/cars', label: 'المعرض', icon: Car },
    { href: '/about', label: 'من نحن', icon: Settings },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold">X</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative text-sm font-bold transition-colors hover:text-white ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-luxury-gold"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop User Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-sm font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                <User className="w-4 h-4" />
                تسجيل الدخول
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-black/95 pt-24 px-6 md:hidden"
        >
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 text-2xl font-bold ${
                  pathname === link.href ? 'text-luxury-gold' : 'text-white'
                }`}
              >
                <link.icon className="w-6 h-6" />
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10 my-4" />
            <button className="flex items-center gap-4 text-2xl font-bold text-gray-400">
              <User className="w-6 h-6" />
              تسجيل الدخول
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
