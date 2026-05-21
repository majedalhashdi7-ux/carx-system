// CAR X Error Logger - Console-based (Sentry can be added later)

export const captureException = (error: unknown, context?: Record<string, unknown>) => {
  console.error('⚠️ [CAR X ERROR]:', error);
  if (context) {
    console.group('🔍 Context');
    console.log(context);
    console.groupEnd();
  }
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', error: '❌' };
  console.log(`${icons[level] || 'ℹ️'} [CAR X - ${level.toUpperCase()}]:`, message);
};
