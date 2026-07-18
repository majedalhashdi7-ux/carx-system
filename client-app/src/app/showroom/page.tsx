'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShowroomPageRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/cars');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
