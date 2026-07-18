'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveAuctionsRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace('/auctions');
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cinematic-neon-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
