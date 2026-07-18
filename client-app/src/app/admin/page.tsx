'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPageRoot() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#070711] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
