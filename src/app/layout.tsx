import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { SettingsProvider } from '@/lib/SettingsContext';
import { TenantProvider } from '@/lib/TenantContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CAR X - معارض ومزادات السيارات',
  description: 'نظام CAR X لمعارض ومزادات السيارات - تصميم حديث وتجربة مذهلة',
  keywords: 'سيارات, مزادات, معارض, CAR X, daood.okigo.net',
  authors: [{ name: 'CAR X Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'CAR X - معارض ومزادات السيارات',
    description: 'نظام CAR X لمعارض ومزادات السيارات',
    url: 'https://daood.okigo.net',
    siteName: 'CAR X',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <TenantProvider>
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <div id="root">
                  {children}
                </div>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </TenantProvider>
      </body>
    </html>
  );
}