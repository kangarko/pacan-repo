'use client'

import { useGlobalError } from '@repo/ui/hooks/useGlobalError';
import VibetoexitGlobalError from '../components/GlobalError';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useGlobalError(error);

    return (
        <html>
            <body>
                <VibetoexitGlobalError reset={reset} />
            </body>
        </html>
    )
} 