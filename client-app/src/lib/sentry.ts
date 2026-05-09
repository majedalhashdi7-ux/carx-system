import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/hmcar-system-two\.vercel\.app/,
    /^https:\/\/carx-system-five\.vercel\.app/,
    /^https:\/\/daood\.okigo\.net/,
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
});