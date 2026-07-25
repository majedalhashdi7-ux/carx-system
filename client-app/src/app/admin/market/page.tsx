import { redirect } from 'next/navigation';

/**
 * إعادة توجيه سلسة لجميع زوار صفحة /admin/market
 * إلى مركز إدارة المزادات الموحد الرئيسي /admin/auctions
 */
export default function MarketRedirect() {
    redirect('/admin/auctions');
}
