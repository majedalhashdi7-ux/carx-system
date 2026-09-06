'use client';
// [[MERGED]] /admin/live-auctions → /admin/auctions
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LiveAuctionsAdminRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/auctions'); }, [router]);
    return null;
}
