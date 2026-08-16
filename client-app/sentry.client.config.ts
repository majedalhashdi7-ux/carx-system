import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // 10% performance tracing في production لتخفيف التكلفة
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // لا debug في production
    debug: false,

    // تتبع 100% من الأخطاء الحقيقية
    replaysOnErrorSampleRate: 1.0,

    // 5% من الجلسات العادية
    replaysSessionSampleRate: 0.05,

    environment: process.env.NODE_ENV || 'development',

    // تصفية الأخطاء غير المهمة
    beforeSend(event) {
      // تجاهل أخطاء الشبكة العادية
      if (event.exception?.values?.[0]?.type === 'TypeError') {
        const msg = event.exception.values[0].value || '';
        if (msg.includes('Failed to fetch') || msg.includes('Load failed') || msg.includes('NetworkError')) {
          return null;
        }
      }
      return event;
    },

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });
}
