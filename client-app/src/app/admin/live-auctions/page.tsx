import { redirect } from 'next/navigation';

/**
 * إعادة توجيه سلسة لجميع زوار صفحة /admin/live-auctions
 * إلى مركز إدارة المزادات الموحد الرئيسي /admin/auctions
 */
export default function LiveAuctionsRedirect() {
    redirect('/admin/auctions?tab=live');
}
