'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ShowroomCarDetailRedirect() {
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        if (id) {
            router.replace(`/cars/${id}`);
        } else {
            router.replace('/cars');
        }
    }, [router, id]);

    return (
        <div className="min-h-screen bg-[#08080f] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}
