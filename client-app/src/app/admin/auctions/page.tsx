import { redirect } from 'next/navigation';

/**
 * إعادة توجيه من /admin/auctions إلى /admin/market
 * نظراً لأن صفحة المزادات الرئيسية موجودة في /admin/market
 */
export default function AdminAuctionsRedirect() {
    redirect('/admin/market');
}
