'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BookPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/poziv');
    }, [router]);

    return null;
}