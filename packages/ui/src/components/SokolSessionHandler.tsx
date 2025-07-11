'use client';

import { useEffect, useState, createContext, ReactNode, useContext } from 'react';
import Cookies from 'js-cookie';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { sendClientErrorEmail, track } from '@repo/ui/lib/clientUtils';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { AlertTriangle } from 'lucide-react';

interface SokolSessionContextType {
    isInitialized: boolean;
    userId: string | null;
}

const SokolSessionContext = createContext<SokolSessionContextType>({
    isInitialized: false,
    userId: null,
});

export const useSokolSession = () => {
    const context = useContext(SokolSessionContext);
    if (context === undefined) {
        throw new Error('useSokolSession must be used within a SokolSessionProvider');
    }
    return context;
};

export default function SokolSessionHandler({ children }: { children: ReactNode }) {
    const [cookiesEnabled, setCookiesEnabled] = useState<boolean | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [pixelLoaded, setPixelLoaded] = useState(false);
    const pathname = usePathname();

    // Check if cookies are enabled
    useEffect(() => {
        try {
            // Try to set a test cookie
            document.cookie = 'cookietest=1; SameSite=Lax';
            const cookiesWork = document.cookie.includes('cookietest=1');

            // Clean up test cookie
            if (cookiesWork)
                document.cookie = 'cookietest=1; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            setCookiesEnabled(cookiesWork);
        } catch {
            setCookiesEnabled(false);
        }
    }, []);

    useEffect(() => {
        const initializeSokolSession = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);

                const sokolId = searchParams.get('sokol');
                const headlineSlug = searchParams.get('hd');

                const response = await fetchJsonPost('/api/sokol/init', {
                    sokol_id: sokolId,
                    headline_slug: headlineSlug,
                });

                console.log('sokol/init returned', response);

                if (response.headline) {
                    Cookies.set('headline_id', response.headline.id, {
                        path: '/',
                        expires: 30, // 30 days
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    });

                    Cookies.set('active_headline', JSON.stringify(response.headline), {
                        path: '/',
                        expires: 30, // 30 days
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                    });
                }

                if (!response.user_id)
                    throw new Error('No user id returned from sokol/init.');

                Cookies.set('user_id', response.user_id, {
                    path: '/',
                    expires: 365 * 2, // 2 years
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                });

                setUserId(response.user_id);
                setIsInitialized(true);

            } catch (error) {
                sendClientErrorEmail('Error in sokol/init:', error);
            }
        };

        if (cookiesEnabled)
            initializeSokolSession();

    }, [cookiesEnabled]);

    // Track page views when pixel is loaded
    useEffect(() => {
        if (!pixelLoaded || !isInitialized || !userId)
            return;

        track('view', { user_id: userId });
    }, [pathname, pixelLoaded, isInitialized, userId]);

    const value = { isInitialized, userId };

    // Show nothing while checking cookies
    if (cookiesEnabled === null)
        return null;

    // Show error message if cookies are disabled
    if (!cookiesEnabled) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Kolačići su onemogućeni
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Ova stranica zahtijeva omogućene kolačiće (cookies) za pravilno funkcioniranje.
                        Molimo vas da omogućite kolačiće u postavkama vašeg preglednika i osvježite stranicu.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md text-left">
                        <p className="text-sm text-gray-500 font-medium mb-2">
                            Kako omogućiti kolačiće:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Chrome: Postavke → Privatnost i sigurnost → Kolačići</li>
                            <li>• Firefox: Postavke → Privatnost i sigurnost → Kolačići</li>
                            <li>• Safari: Postavke → Privatnost → Kolačići</li>
                            <li>• Edge: Postavke → Kolačići i dozvole stranice</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Osvježi stranicu
                    </button>
                </div>
            </div>
        );
    }

    if (!isInitialized) {
        return null;
    }

    return (
        <SokolSessionContext.Provider value={value}>
            {children}
            <div>
                <Script
                    id="fb-pixel"
                    src="/scripts/pixel.js"
                    strategy="afterInteractive"
                    onLoad={() => setPixelLoaded(true)}
                    data-pixel-id={process.env.NEXT_PUBLIC_FB_PIXEL_ID}
                />
            </div>
        </SokolSessionContext.Provider>
    );
} 