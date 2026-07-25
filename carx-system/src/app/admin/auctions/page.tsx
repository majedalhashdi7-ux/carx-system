import { redirect } from 'next/navigation';

/**
 * Redirect /admin/auctions → /admin/live-auctions
 * Server-side redirect (لا يحتاج JavaScript في المتصفح)
 */
export default function AdminAuctionsPage() {
  redirect('/admin/live-auctions');
}
