'use client';

import { redirect } from 'next/navigation';

/**
 * /auctions/live — يحوّل للقائمة الرئيسية للمزادات
 * الجلسات الفعلية متاحة عبر /auctions/live/[id]
 */
export default function LiveAuctionsIndexPage() {
  redirect('/auctions');
}
