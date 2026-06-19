'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // انتظر حتى يكتمل التحقق

    if (!isLoggedIn) {
      router.push('/login?redirect=/admin');
      return;
    }

    const allowedRoles = ['admin', 'super_admin', 'manager'];
    if (!allowedRoles.includes(user?.role || '')) {
      // المستخدم مسجّل دخوله لكن ليس أدمن
      router.push('/');
    }
  }, [isLoading, isLoggedIn, user, router]);

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <span className="text-4xl font-black tracking-tighter text-white">
            CAR<span className="text-luxury-gold">X</span>
          </span>
          <div className="w-10 h-10 border-[3px] border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-bold">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // غير مصرح له — سيتم التوجيه
  const allowedRoles = ['admin', 'super_admin', 'manager'];
  if (!isLoggedIn || !allowedRoles.includes(user?.role || '')) {
    return null;
  }

  return <>{children}</>;
}
