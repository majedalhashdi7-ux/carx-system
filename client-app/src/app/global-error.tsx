'use client';

/**
 * صفحة الخطأ العالمي (Global Error Boundary)
 * تُعرض عند حدوث خطأ في الـ layout أو عند فشل الـ providers.
 * هذه أحرج حالة — لا يوجد شيء آخر يمكنه الإمساك بالخطأ.
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <head>
        <title>خطأ في النظام | HM CAR</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: #000;
            color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            max-width: 480px;
            width: 100%;
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 32px;
            padding: 40px;
            text-align: center;
          }
          .icon {
            width: 80px; height: 80px;
            background: rgba(239,68,68,0.1);
            border: 1px solid rgba(239,68,68,0.2);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
            font-size: 36px;
          }
          h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; }
          p { color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.6; margin-bottom: 32px; }
          .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          button {
            padding: 14px;
            border-radius: 16px;
            font-weight: 900;
            font-size: 13px;
            text-transform: uppercase;
            cursor: pointer;
            border: none;
            transition: opacity 0.2s;
          }
          button:hover { opacity: 0.85; }
          .btn-primary { background: #fff; color: #000; }
          .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
          .footer { margin-top: 24px; font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.2em; }
        `}</style>
      </head>
      <body>
        <div className="card" style={{ maxWidth: '480px', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '36px' }}>
            🛡️
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>
            System Error
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
            نعتذر، حدث خطأ في تحميل النظام. <br />
            يرجى المحاولة مرة أخرى.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={reset}
              style={{ padding: '14px', borderRadius: '16px', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', border: 'none', background: '#fff', color: '#000' }}
            >
              🔄 Retry
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              style={{ padding: '14px', borderRadius: '16px', fontWeight: 900, fontSize: '13px', textTransform: 'uppercase', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              🏠 Home
            </button>
          </div>
          <p style={{ marginTop: '24px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            HM CAR • GLOBAL ERROR
          </p>
        </div>
      </body>
    </html>
  );
}
