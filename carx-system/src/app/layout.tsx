import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { CartProvider } from "../lib/CartContext";
import { CurrencyProvider } from "../lib/CurrencyContext";
import { AuthProvider } from "../lib/AuthContext";

export const viewport: Viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "CAR X | المعرض الحصري للسيارات الفاخرة في المملكة",
  description: "اكتشف عالم الرفاهية والأداء مع CAR X. وجهتك الأولى لبيع وشراء أفخم السيارات العالمية بأفضل الأسعار وأعلى مستويات الخدمة.",
  keywords: "سيارات فاخرة, بيع سيارات, سيارات مستعملة, مرسيدس, بي ام دبليو, فيراري, السعودية, الرياض",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CAR X",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    title: "CAR X | المعرض الحصري للسيارات الفاخرة",
    description: "وجهتك الأولى لبيع وشراء أفخم السيارات العالمية في المملكة",
    type: "website",
    locale: "ar_SA",
    siteName: "CAR X",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CAR X" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased bg-black selection:bg-luxury-gold selection:text-black">
        <ErrorBoundary>
          <AuthProvider>
            <CartProvider>
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </CartProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
