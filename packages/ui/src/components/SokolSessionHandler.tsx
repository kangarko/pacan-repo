'use client';

import { useEffect, useState, createContext, ReactNode, useContext } from 'react';
import Cookies from 'js-cookie';
import { fetchJsonPost } from '@repo/ui/lib/utils';
import { safeLocalStorageGet, safeLocalStorageSet, sendClientErrorEmail, track } from '@repo/ui/lib/clientUtils';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SokolData } from '../lib/types';

const SokolSessionContext = createContext<SokolData | null>(null);

export const useSokolSession = () => {
    const context = useContext(SokolSessionContext);
    if (context === undefined) {
        throw new Error('useSokolSession must be used within a SokolSessionProvider');
    }
    return context;
};

export default function SokolSessionHandler({ children, lang = 'en' }: { children: ReactNode, lang?: string }) {
    const [cookiesEnabled, setCookiesEnabled] = useState<boolean | null>(null);
    const [sokolData, setSokolData] = useState<SokolData | null>(null);
    const [pixelLoaded, setPixelLoaded] = useState(false);
    const pathname = usePathname();

    // Check if cookies are enabled
    useEffect(() => {
        // The most reliable way to check for cookie support is to try to set one.
        // We'll use the js-cookie library as it can handle some browser quirks,
        // and wrap it in a try-catch for maximum safety in restrictive environments.
        try {
            Cookies.set('cookietest', '1', { sameSite: 'Lax' });
            const cookiesWork = Cookies.get('cookietest') === '1';

            // Clean up the test cookie
            Cookies.remove('cookietest');

            setCookiesEnabled(cookiesWork);
        } catch (e) {
            // This will catch errors in environments where cookie access is completely blocked,
            // such as Safari's "hardest mode" or in certain iFrames.
            console.warn('Could not access cookies. This might be due to browser privacy settings.', e);
            setCookiesEnabled(false);
        }
    }, []);

    useEffect(() => {
        const initializeSokolSession = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);

                const sokolId = searchParams.get('sokol');
                const headlineSlug = searchParams.get('hd');

                const localStorageUserId = safeLocalStorageGet('user_id', null);
                const localStorageHeadlineId = safeLocalStorageGet('headline_id', null);

                const response = await fetchJsonPost('/api/sokol/init', {
                    sokol_id: sokolId,
                    headline_slug: headlineSlug,
                    user_id: localStorageUserId,
                    headline_id: localStorageHeadlineId
                });

                safeLocalStorageSet('user_id', response.user_id.toString());
                Cookies.set('user_id', response.user_id);

                if (response.headline) {
                    safeLocalStorageSet('headline_id', response.headline?.id);
                    safeLocalStorageSet('active_headline', JSON.stringify(response.headline));

                    Cookies.set('headline_id', response.headline?.id);
                    Cookies.set('active_headline', JSON.stringify(response.headline));
                }

                setSokolData(response);

            } catch (error) {
                sendClientErrorEmail('Error in sokol/init:', error);
            }
        };

        if (cookiesEnabled)
            initializeSokolSession();

    }, [cookiesEnabled]);

    // Track page views when pixel is loaded
    useEffect(() => {
        if (!pixelLoaded || !sokolData)
            return;

        track('view', {
            user_id: sokolData.user_id,
            headline_id: sokolData.headline?.id
        });
    }, [pathname, pixelLoaded, sokolData]);

    // Show loading spinner while checking cookies
    if (cookiesEnabled === null) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
                <div className="animate-spin mx-auto w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
            </div>
        );
    }

    // Show error message if cookies are disabled
    if (!cookiesEnabled) {
        if (lang === 'hr') {
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

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        Cookies are disabled
                    </h1>
                    <p className="text-gray-600 mb-6">
                        This site requires cookies to function properly. Please enable cookies in your browser settings and refresh the page.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-md text-left">
                        <p className="text-sm text-gray-500 font-medium mb-2">
                            How to enable cookies:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Chrome: Settings → Privacy and security → Cookies</li>
                            <li>• Firefox: Settings → Privacy & Security → Cookies</li>
                            <li>• Safari: Preferences → Privacy → Cookies</li>
                            <li>• Edge: Settings → Cookies and site permissions</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Refresh page
                    </button>
                </div>
            </div>
        );
    }

    if (!sokolData)
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center black">
                <div className="animate-spin mx-auto w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
            </div>
        );

    return (
        <SokolSessionContext.Provider value={sokolData}>
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