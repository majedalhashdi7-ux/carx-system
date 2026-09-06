'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function AdminContactRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/admin/messages'); }, [router]);
    return null;
}
