'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /admin/auctions → /admin/live-auctions
 * هذه الصفحة موجودة فقط لإعادة التوجيه، تجنباً لخطأ 404
 */
export default function AdminAuctionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/live-auctions');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin" />
        <p className="text-white/40 text-sm font-bold">جاري التوجيه...</p>
      </div>
    </div>
  );
}
