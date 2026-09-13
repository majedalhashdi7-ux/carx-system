'use client';
import Link from 'next/link';
import { ShieldCheck, Gavel, Wrench, Users, Phone, Mail } from 'lucide-react';

interface SocialPlatform { key: string; url: string; labelAr: string; labelEn: string; color: string; icon: React.ReactNode; }

interface Props {
  isRTL: boolean;
  socialPlatforms: SocialPlatform[];
  contactEmail: string;
  contactPhone: string;
}

const FEATURES = [
  { icon: ShieldCheck, titleAr: 'فحص فني شامل', titleEn: 'Guaranteed Inspection', descAr: 'فحص كل سيارة بدقة في كوريا عبر مهندسينا قبل الشحن.', descEn: 'Every car is thoroughly inspected in Korea before shipping.' },
  { icon: Gavel, titleAr: 'مزادات مباشرة', titleEn: 'Direct Auction Access', descAr: 'مزايدة حية ومباشرة بدون وسطاء وبمنتهى الشفافية.', descEn: 'Watch and bid in live Korean auctions directly.' },
  { icon: Wrench, titleAr: 'قطع غيار أصلية', titleEn: 'Original Parts Catalog', descAr: 'استيراد قطع غيار كورية أصلية وتتبع الشحنات.', descEn: 'Import original Korean spare parts directly.' },
  { icon: Users, titleAr: 'دعم العملاء 24/7', titleEn: 'Expert Support 24/7', descAr: 'فريقنا جاهز لمساعدتك في المزايدة والشراء والتسجيل.', descEn: 'Our team is ready to guide you step-by-step.' },
];

export function WhyUsSection({ isRTL, socialPlatforms, contactEmail, contactPhone }: Props) {
  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-12">
        <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-1">
          {isRTL ? 'ضمان وجودة إتش إم كار' : 'HM CAR TRUST HUB'}
        </span>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase italic">
          {isRTL ? 'لماذا تختار منصتنا؟' : 'Why Choose Us?'}
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-16">
        {FEATURES.map((item, idx) => (
          <div key={idx} className="bg-[#101018] border border-white/5 p-4 sm:p-6 rounded-2xl relative overflow-hidden group hover:border-[#C9A96E]/30 transition-all duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 flex items-center justify-center mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A96E]" />
            </div>
            <h3 className="text-xs sm:text-base font-black mb-1.5 text-white">{isRTL ? item.titleAr : item.titleEn}</h3>
            <p className="text-[10px] sm:text-xs text-white/45 leading-relaxed line-clamp-3">{isRTL ? item.descAr : item.descEn}</p>
          </div>
        ))}
      </div>

      {/* Social + Contact */}
      <div className="bg-[#0c0c14] border border-white/8 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <span className="text-[10px] font-black text-[#C9A96E] tracking-[0.3em] uppercase block mb-2">
            {isRTL ? 'تواصل معنا مباشرة' : 'CONNECT WITH US'}
          </span>
          <h3 className="text-xl sm:text-3xl font-black mb-6">
            {isRTL ? 'تابعنا على منصات التواصل الاجتماعي' : 'Follow Us On Social Media'}
          </h3>

          {socialPlatforms.length > 0 ? (
            <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap mb-8">
              {socialPlatforms.map((platform) => (
                <a key={platform.key} href={platform.url} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl border-2 border-white/10 bg-white/5 group-hover:scale-110 group-hover:border-[#C9A96E] transition-all shadow-lg"
                    style={{ boxShadow: `0 0 15px ${platform.color}30` }}>
                    <span>{platform.icon}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-white/70 group-hover:text-[#C9A96E] transition-colors">
                    {isRTL ? platform.labelAr : platform.labelEn}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40 mb-6">{isRTL ? 'يسعدنا تواصلكم معنا عبر البريد والهاتف' : 'Contact us via email or phone'}</p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-white/5 text-xs font-bold text-white/60">
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:text-[#C9A96E] transition-colors">
                <Phone className="w-4 h-4 text-[#C9A96E]" />
                <span dir="ltr">{contactPhone}</span>
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-[#C9A96E] transition-colors">
                <Mail className="w-4 h-4 text-[#C9A96E]" />
                <span>{contactEmail}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
