import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// إعداد خط "Tajawal" لتحسين مظهر اللغة العربية واللاتينية في التطبيق
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "900"], // [[ARABIC_COMMENT]] تقليل عدد الأوزان لضغط حجم الخط وتسريع التحميل
  variable: "--font-tajawal",
  display: "swap",
});
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import { cookies } from "next/headers";
import AppShell from "@/components/AppShell";
import SmartPrefetchProvider from "@/components/SmartPrefetchProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NetworkStatus from "@/components/NetworkStatus";

// إعدادات نافذة العرض (Viewport) للجوال والحاسوب
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // السماح للمستخدم بتكبير الصفحة لسهولة القراءة
  themeColor: "#000000",
  colorScheme: "dark",
};

// البيانات الوصفية (SEO Metadata) لتحسين ظهور الموقع في محركات البحث ومشاركات التواصل الاجتماعي
export const metadata: Metadata = {
  metadataBase: new URL('https://hmcar.okigo.net'),
  title: {
    template: '%s | HM CAR',
    default: 'HM CAR | Premium Korean Auto Export & Parts',
  },
  description: "اتش ام كار - منصتك الأولى لتصدير السيارات الكورية الفاخرة وقطع الغيار الأصلية. جودة كورية، شحن دولي، ومزادات حصرية.",
  keywords: "car export, korean cars, luxury vehicles, spare parts, auto auction, سيارات كورية, قطع غيار, مزاد سيارات, تصدير من كوريا, HM CAR",
  authors: [{ name: 'HM CAR Team', url: 'https://hmcar.com' }],
  creator: 'HM CAR',
  publisher: 'HM CAR Export',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'ar-SA': '/ar',
      'en-US': '/en',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HM CAR",
  },
  openGraph: {
    title: "HM CAR | Premium Korean Auto Export",
    description: "تصدير السيارات الفاخرة وقطع الغيار من كوريا إلى العالم - أفضل الأسعار وجودة مضمونة",
    url: 'https://hmcar.okigo.net',
    siteName: "HM CAR",
    locale: 'ar_SA',
    type: "website",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: 'HM CAR Export' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "HM CAR | Premium Korean Auto Export",
    description: "تصدير السيارات الفاخرة وقطع الغيار من كوريا إلى العالم",
    images: ["/icons/icon-512x512.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // قراءة اللغة المفضلة من الكوكيز (Cookies) لتحديد اتجاه الصفحة (RTL/LTR) في السيرفر قبل التحميل
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("appLang")?.value?.toUpperCase();
  const lang = cookieLang === "EN" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        {/* Apple Splash Screen Meta Tags */}
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_15_Pro_Max_landscape.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_15_Pro_Max_portrait.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_15_Pro_landscape.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_15_Pro_portrait.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_14_Pro_Max_landscape.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_14_Pro_Max_portrait.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_14_Pro_landscape.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_14_Pro_portrait.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_mini__iPhone_12_mini_landscape.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_13_mini__iPhone_12_mini_portrait.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11_Pro__iPhone_XS__iPhone_X_portrait.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11__iPhone_XR_landscape.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_11__iPhone_XR_portrait.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_landscape.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus_portrait.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__landscape.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__portrait.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/12.9__iPad_Pro_landscape.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/12.9__iPad_Pro_portrait.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/11__iPad_Pro__10.5__iPad_Pro_landscape.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/11__iPad_Pro__10.5__iPad_Pro_portrait.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.9__iPad_Air_landscape.png" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.9__iPad_Air_portrait.png" media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.5__iPad_Air_landscape.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.5__iPad_Air_portrait.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.2__iPad_landscape.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/10.2__iPad_portrait.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/7.9__iPad_mini_landscape.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/splash_screens/7.9__iPad_mini_portrait.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
        {/* [[ARABIC_COMMENT]] سكريبت معالجة الأخطاء الذاتي (Self-Healing) لتجاوز الكاش المعطوب */}
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('error', function(e) {
              if (e.message && (e.message.indexOf('Maximum update depth exceeded') > -1 || e.message.indexOf('Minified React error #185') > -1 || e.message.indexOf('Minified React error #321') > -1)) {
                console.warn('[Self-Healing] Fatal React loop detected. Clearing Service Workers & cache...');
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for(var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for(var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                  });
                }
                sessionStorage.setItem('hm_crash_recovery', '1');
                setTimeout(function() { window.location.reload(true); }, 500);
              }
            });
            if (sessionStorage.getItem('hm_crash_recovery')) {
              console.log('[Self-Healing] Recovered from crash.');
              sessionStorage.removeItem('hm_crash_recovery');
            }
            
            // تسجيل Service Worker للعمل Offline
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('[SW] Registered successfully:', registration.scope);
                }).catch(function(error) {
                  console.log('[SW] Registration failed:', error);
                });
              });
            }
          `
        }} />
      </head>
      <body className={`antialiased selection:bg-white/20 selection:text-white ${tajawal.variable}`}>
        {/* [[ARABIC_COMMENT]] فاحص أداء الواجهة - يظهر فقط في بيئة التطوير للمساعدة في تحسين السرعة */}
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const observer = new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    console.log(\`%c[Performance] \${entry.name}: \${entry.startTime.toFixed(2)}ms\`, 'color: #c9a96e; font-weight: bold;');
                  });
                });
                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
              }
            `
          }} />
        )}
        <Providers>
          <NetworkStatus />
          <ErrorBoundary>
            <SmartPrefetchProvider>
              <AppShell>
                <Suspense fallback={null}>
                  <GoogleAnalytics />
                </Suspense>
                {children}
              </AppShell>
            </SmartPrefetchProvider>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
