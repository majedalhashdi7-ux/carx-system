'use client';
// [[MERGED]] صفحة /gallery تم دمجها مع /cars — إعادة توجيه تلقائية
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GalleryRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/cars'); }, [router]);
    return null;
}
