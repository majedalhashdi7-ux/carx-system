'use client';

/**
 * صفحة Offline
 * تظهر عندما يكون المستخدم غير متصل بالإنترنت
 */

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // إذا عاد الاتصال، ارجع للصفحة السابقة
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    };

    // فحص الاتصال عند التحميل
    checkOnline();

    // الاستماع لتغييرات الاتصال
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, [router]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full text-center">
        {/* أيقونة */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
            <WifiOff className="w-16 h-16 text-white/30" />
          </div>
          {isOnline && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* العنوان */}
        <h1 className="text-3xl font-black text-white mb-4">
          {isOnline ? 'جاري إعادة الاتصال...' : 'لا يوجد اتصال بالإنترنت'}
        </h1>

        {/* الوصف */}
        <p className="text-white/50 mb-8 leading-relaxed">
          {isOnline 
            ? 'تم استعادة الاتصال بالإنترنت. جاري إعادة تحميل الصفحة...'
            : 'يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.'
          }
        </p>

        {/* الأزرار */}
        {!isOnline && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              إعادة المحاولة
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              العودة للرئيسية
            </button>
          </div>
        )}

        {/* نصائح */}
        <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl text-right">
          <h3 className="text-white font-bold mb-3">نصائح للحل:</h3>
          <ul className="text-sm text-white/50 space-y-2">
            <li>• تحقق من اتصال الواي فاي أو البيانات</li>
            <li>• أعد تشغيل جهاز الراوتر</li>
            <li>• جرب فتح الموقع في متصفح آخر</li>
            <li>• امسح ذاكرة التخزين المؤقت للمتصفح</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
