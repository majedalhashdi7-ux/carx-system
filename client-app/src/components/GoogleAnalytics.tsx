'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import ReactGA from 'react-ga4';
import { useSettings } from '@/lib/SettingsContext';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { marketingPixels } = useSettings();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // ── Google Analytics 4 ──
    const GA_ID = marketingPixels?.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID;
    if (GA_ID && !initialized) {
      ReactGA.initialize(GA_ID);
      console.log('✅ GA4 Initialized:', GA_ID);
      setInitialized(true);
    }
  }, [marketingPixels, initialized]);

  useEffect(() => {
    // إرسال الأحداث عند تغيير الصفحة
    if (initialized) {
      const url = pathname + searchParams.toString();
      ReactGA.send({ hitType: 'pageview', page: url });
    }
  }, [pathname, searchParams, initialized]);

  return null;
}
