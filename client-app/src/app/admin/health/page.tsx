'use client';
// [[MERGED]] /admin/health دُمجت مع /admin/system
// للوصول للتشخيصات، اذهب إلى /admin/system
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminHealthRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/system'); }, [router]);
    return null;
}
