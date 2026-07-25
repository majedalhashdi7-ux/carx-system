import { redirect } from 'next/navigation';

/**
 * إعادة توجيه من /admin/auctions إلى /admin/live-auctions
 * لضمان وصول المشرف مباشرة لصفحة إدارة المزادات المباشرة ومزادات الاستيراد
 */
export default function AdminAuctionsRedirect() {
    redirect('/admin/live-auctions');
}

