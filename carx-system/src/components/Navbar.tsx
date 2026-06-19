'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, Search, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CurrencySelector from './CurrencySelector';
import AdvancedCart from './AdvancedCart';
import { useAuth } from '../lib/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'cars' | 'parts'>('cars');
  const [showCart, setShowCart] = useState(false);

  // استخدام AuthContext بدلاً من localStorage مباشرةً
  const { user, isLoggedIn, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    window.location.href = '/login';
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchModal(false);
    if (searchType === 'cars') {
      window.location.href = `/showroom?search=${encodeURIComponent(searchQuery)}`;
    } else {
      window.location.href = `/parts?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'المعرض', href: '/showroom' },
    { name: 'قطع الغيار', href: '/parts' },
    { name: 'الماركات', href: '/brands' },
    { name: 'من نحن', href: '/about' },
    { name: 'اتصل بنا', href: '/contact' },
  ];


  return (
    <>
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
              
              {/* Show admin panel link if they are logged in as admin */}
              {isLoggedIn && (user?.role === 'admin' || user?.role === 'super_admin') && (
                <Link 
                  href="/admin"
                  className="text-sm font-bold text-luxury-gold hover:text-white transition-all duration-300 uppercase tracking-widest relative group"
                >
                  لوحة التحكم
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              )}
            </div>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <button 
                onClick={() => setShowSearchModal(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              <CurrencySelector />

              <button 
                onClick={() => setShowCart(true)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all relative"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>

              {/* User Dropdown */}
              <div className="relative">
                {isLoggedIn ? (
                  <>
                    <button 
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl text-luxury-gold bg-luxury-gold/10 border border-luxury-gold/20 hover:bg-luxury-gold hover:text-black transition-all"
                    >
                      <User className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 mt-3 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-right"
                        >
                          <div className="px-4 py-3 border-b border-white/5 text-right">
                            <p className="text-xs text-white/40">مرحباً بك</p>
                            <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name || 'مستخدم CAR X'}</p>
                            <p className="text-xs text-luxury-gold/60 mt-0.5">{user?.email}</p>
                          </div>
                          
                          {/* Profile link - for all users */}
                          <Link 
                            href="/profile" 
                            className="flex items-center gap-2 w-full text-right px-4 py-2.5 text-sm text-white/70 hover:text-luxury-gold hover:bg-white/5 rounded-xl transition-colors font-bold mt-1"
                            onClick={() => setShowUserDropdown(false)}
                          >
                            <User className="w-4 h-4" />
                            الملف الشخصي
                          </Link>

                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <Link 
                              href="/admin" 
                              className="block w-full text-right px-4 py-2.5 text-sm text-luxury-gold hover:text-white hover:bg-luxury-gold/10 rounded-xl transition-colors font-bold"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              👑 لوحة التحكم
                            </Link>
                          )}

                          <button 
                            onClick={handleLogout}
                            className="w-full text-right px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold mt-1 border-t border-white/5 pt-2.5"
                          >
                            تسجيل الخروج
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </>
                ) : (
                  <Link 
                    href="/login"
                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>

              <div className="h-8 w-[1px] bg-white/10 mx-2" />
              {!isLoggedIn && (
                <Link href="/login" className="bg-white text-black px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-luxury-gold transition-all duration-500 transform hover:scale-105">
                  تسجيل الدخول
                </Link>
              )}
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

                {isLoggedIn && (user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Link 
                    href="/admin"
                    className="block text-xl font-bold text-luxury-gold hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    لوحة التحكم
                  </Link>
                )}

                {/* Mobile Auth Options */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  {isLoggedIn ? (
                    <>
                      <div className="text-right px-2">
                        <p className="text-xs text-white/40">تسجيل الدخول كـ</p>
                        <p className="text-base font-bold text-luxury-gold truncate mt-0.5">{user?.name || 'عميل CAR X'}</p>
                      </div>
                      <button 
                        onClick={() => { setIsOpen(false); handleLogout(); }}
                        className="block w-full bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-2xl font-black text-center"
                      >
                        تسجيل الخروج
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Link 
                        href="/login" 
                        className="block bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-center hover:bg-white/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        تسجيل الدخول
                      </Link>
                      <Link 
                        href="/register" 
                        className="block bg-luxury-gold text-black py-4 rounded-2xl font-black text-center hover:bg-white transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        إنشاء حساب
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Modal Overlay */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <button 
              onClick={() => setShowSearchModal(false)}
              className="absolute top-8 left-8 w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-2xl space-y-8 text-center">
              <h2 className="text-3xl font-black text-white">البحث الفاخر في <span className="text-luxury-gold">CAR X</span></h2>
              
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setSearchType('cars')}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    searchType === 'cars' 
                      ? 'bg-luxury-gold text-black border-luxury-gold' 
                      : 'bg-white/5 text-white border-white/5 hover:bg-white/10'
                  }`}
                >
                  البحث عن سيارة
                </button>
                <button 
                  onClick={() => setSearchType('parts')}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                    searchType === 'parts' 
                      ? 'bg-luxury-gold text-black border-luxury-gold' 
                      : 'bg-white/5 text-white border-white/5 hover:bg-white/10'
                  }`}
                >
                  البحث عن قطعة غيار
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'cars' ? "ابحث عن موديل، ماركة، أو سنة... (مثال: جي كلاس)" : "ابحث عن قطعة غيار... (مثال: فلتر زيت)"}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pr-6 pl-20 text-xl text-white focus:outline-none focus:border-luxury-gold/50 focus:bg-white/10 transition-all placeholder:text-white/20 text-right"
                  autoFocus
                  dir="rtl"
                />
                <button 
                  type="submit"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-luxury-gold text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-white transition-colors"
                >
                  ابحث
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Cart Drawer */}
      <AnimatePresence>
        {showCart && <AdvancedCart show={showCart} onClose={() => setShowCart(false)} />}
      </AnimatePresence>
    </>
  );
}
