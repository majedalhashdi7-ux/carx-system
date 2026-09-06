'use client';
// [[MERGED]] صفحة /social تم دمجها مع /contact
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SocialRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/contact'); }, [router]);
    return null;
}
