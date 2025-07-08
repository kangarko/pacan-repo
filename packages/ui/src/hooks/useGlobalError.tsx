'use client'

import { useEffect } from "react"
import { sendClientErrorEmail } from "@repo/ui/lib/clientUtils"

export function useGlobalError(error: Error & { digest?: string }) {
    useEffect(() => {
        if (error.name === 'ChunkLoadError' || (error.message && /Loading chunk .* failed/i.test(error.message))) {
            window.location.reload();
        } else {
            sendClientErrorEmail('Global error', error);
        }
    }, [error]);
} 