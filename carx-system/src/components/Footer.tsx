'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="text-3xl font-black tracking-tighter text-white">
                CAR<span className="text-luxury-gold">X</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              وجهتك الأولى لأفخم السيارات في المملكة. نجمع بين الأداء المذهل والرفاهية المطلقة لنقدم لك تجربة قيادة لا تُنسى.
            </p>
            <div className="flex gap-4 text-gray-400">
              <a href="#" className="hover:text-luxury-gold transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-luxury-gold transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-luxury-gold transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-luxury-gold transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">روابط سريعة</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-luxury-gold transition-colors">الرئيسية</Link></li>
              <li><Link href="/cars" className="hover:text-luxury-gold transition-colors">المعرض</Link></li>
              <li><Link href="/about" className="hover:text-luxury-gold transition-colors">من نحن</Link></li>
              <li><Link href="/contact" className="hover:text-luxury-gold transition-colors">اتصل بنا</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">المساعدة</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link href="/faq" className="hover:text-luxury-gold transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/terms" className="hover:text-luxury-gold transition-colors">الشروط والأحكام</Link></li>
              <li><Link href="/privacy" className="hover:text-luxury-gold transition-colors">سياسة الخصوصية</Link></li>
              <li><Link href="/shipping" className="hover:text-luxury-gold transition-colors">سياسة الشحن والتسليم</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">النشرة البريدية</h4>
            <p className="text-gray-400 text-sm mb-4">
              اشترك لتصلك أحدث العروض والسيارات الحصرية.
            </p>
            <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
              <input 
                type="email" 
                placeholder="بريدك الإلكتروني" 
                className="bg-transparent text-white px-4 py-3 w-full outline-none text-sm placeholder-gray-500"
              />
              <button className="bg-luxury-gold text-black px-4 font-bold text-sm hover:bg-white transition-colors">
                اشترك
              </button>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CAR X. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer transition-colors">العربية</span>
            <span>|</span>
            <span className="hover:text-white cursor-pointer transition-colors">English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
