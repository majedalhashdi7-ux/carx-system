'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { api } from '../lib/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send subscription request as a Contact form submission
      const res = await api.contact.send({
        name: 'مشترك النشرة البريدية',
        email: email,
        subject: 'اشتراك في النشرة البريدية',
        message: 'أريد الاشتراك في النشرة البريدية لتلقي آخر العروض والسيارات الحصرية.'
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSubscribed(true);
        setEmail('');
        // Also save to localStorage
        const subscribers = JSON.parse(localStorage.getItem('carx_subscribers') || '[]');
        if (!subscribers.includes(email)) {
          subscribers.push(email);
          localStorage.setItem('carx_subscribers', JSON.stringify(subscribers));
        }
      }
    } catch (err) {
      setError('حدث خطأ، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

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
              <Link href="/contact" className="hover:text-luxury-gold transition-colors"><Mail className="w-5 h-5" /></Link>
              <Link href="/contact" className="hover:text-luxury-gold transition-colors"><Phone className="w-5 h-5" /></Link>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">روابط سريعة</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-luxury-gold transition-colors">الرئيسية</Link></li>
              <li><Link href="/showroom" className="hover:text-luxury-gold transition-colors">المعرض</Link></li>
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
            {subscribed ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg text-center">
                تم الاشتراك بنجاح! شكراً لك.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="بريدك الإلكتروني" 
                    className="bg-transparent text-white px-4 py-3 w-full outline-none text-sm placeholder-gray-500"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-luxury-gold text-black px-4 font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {loading ? '...' : 'اشترك'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-[10px] pr-1">{error}</p>}
              </form>
            )}
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
