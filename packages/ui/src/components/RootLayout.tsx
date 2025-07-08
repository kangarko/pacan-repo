'use client'

import React from 'react';
import Script from 'next/script';
import SokolSessionHandler from '@repo/ui/components/SokolSessionHandler';

interface RootLayoutProps {
    children: React.ReactNode;
    lang: string;
    fontClassName: string;
}

export default function RootLayout({ children, lang, fontClassName }: RootLayoutProps) {
    if (!process.env.NEXT_PUBLIC_CLARITY_ID)
        throw new Error('NEXT_PUBLIC_CLARITY_ID is not set in environment variables for production.');

    return (
        <html lang={lang}>
            <head>
                <link rel="dns-prefetch" href="https://connect.facebook.net" />
                <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
            </head>
            <body className={fontClassName}>
                <SokolSessionHandler>
                    {children}
                </SokolSessionHandler>
                <Script id="microsoft-clarity-analytics">
                    {`
                            (function(c,l,a,r,i,t,y){
                                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                            })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
                        `}
                </Script>
            </body>
        </html>
    );
} 