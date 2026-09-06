'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminSocialRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/settings'); }, [router]);
    return null;
}
