import type { Metadata } from "next";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { CartProvider } from "../lib/CartContext";
import { CurrencyProvider } from "../lib/CurrencyContext";
import { AuthProvider } from "../lib/AuthContext";

export const metadata: Metadata = {
  title: "CAR X | المعرض الحصري للسيارات الفاخرة في المملكة",
  description: "اكتشف عالم الرفاهية والأداء مع CAR X. وجهتك الأولى لبيع وشراء أفخم السيارات العالمية بأفضل الأسعار وأعلى مستويات الخدمة.",
  keywords: "سيارات فاخرة, بيع سيارات, سيارات مستعملة, مرسيدس, بي ام دبليو, فيراري, السعودية, الرياض",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
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
