import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

const tajawal = {
  variable: "--font-tajawal",
  className: "",
};
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import AppShell from "@/components/AppShell";
import SmartPrefetchProvider from "@/components/SmartPrefetchProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import NetworkStatus from "@/components/NetworkStatus";
import { getTenantConfigForHostname } from "@/lib/tenant-config";

// إعدادات نافذة العرض (Viewport) للجوال والحاسوب
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // السماح للمستخدم بتكبير الصفحة لسهولة القراءة
  themeColor: "#000000",
  colorScheme: "dark",
};

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const tenantConfig = getTenantConfigForHostname(host);

  const name = tenantConfig?.name || "HM CAR";
  const description = tenantConfig?.description || "منصة مزادات ومبيعات السيارات الفاخرة";

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://hmcar-system-two.vercel.app'),
    title: {
      template: `%s | ${name}`,
      default: `${name} | ${description}`,
    },
    description: description,
    keywords: "car export, luxury cars, spare parts, auto auction, سيارات كورية, قطع غيار, مزاد سيارات, تصدير, HM CAR, CAR X",
    authors: [{ name: `${name} Team` }],
    creator: name,
    publisher: `${name} System`,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: '/',
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: name,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // قراءة اللغة المفضلة من الكوكيز (Cookies) لتحديد اتجاه الصفحة (RTL/LTR) في السيرفر قبل التحميل
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("appLang")?.value?.toUpperCase();
  const lang = cookieLang === "EN" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const tenantConfig = getTenantConfigForHostname(host);
  const favicon = tenantConfig?.favicon || "/icons/icon-96x96.png";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href={favicon} />
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
              const messages = [
                'Maximum update depth exceeded',
                'Hydration failed',
                'Minified React error #185',
                'Minified React error #321',
                'Minified React error #418',
                'Minified React error #423'
              ];
              const errorMsg = e.message || '';
              if (messages.some(msg => errorMsg.indexOf(msg) > -1)) {
                console.warn('[Self-Healing] Fatal React loop or Hydration error detected.');
                
                // [[ARABIC_COMMENT]] منع التكرار اللانهائي - الحد الأقصى 3 محاولات
                const reloadCount = parseInt(sessionStorage.getItem('hm_reload_count') || '0');
                if (reloadCount >= 3) {
                  console.error('[Self-Healing] Maximum reload attempts reached. Stopping loop.');
                  return;
                }
                
                sessionStorage.setItem('hm_reload_count', (reloadCount + 1).toString());
                
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
                
                setTimeout(function() { window.location.reload(); }, 500);
              }
            });
            
            // [[ARABIC_COMMENT]] تصفير عداد المحاولات بعد دقيقة من التشغيل المستقر
            setTimeout(function() {
              sessionStorage.removeItem('hm_reload_count');
            }, 60000);
            
            // تسجيل Service Worker للعمل Offline مع التحديث التلقائي
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  reg.onupdatefound = function() {
                    var installingWorker = reg.installing;
                    if (installingWorker) {
                      installingWorker.onstatechange = function() {
                        if (installingWorker.state === 'installed') {
                          if (navigator.serviceWorker.controller) {
                            console.log('[Service Worker] New update found. Clearing caches and reloading...');
                            if ('caches' in window) {
                              caches.keys().then(function(names) {
                                for(var i = 0; i < names.length; i++) { caches.delete(names[i]); }
                              });
                            }
                            setTimeout(function() { window.location.reload(); }, 500);
                          }
                        }
                      };
                    }
                  };
                }).catch(function(error) {
                  console.error('Service worker registration failed:', error);
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
